import sys
import os
import json
import argparse
import cv2
import numpy as np
import pickle
from datetime import datetime

# Lazy import to speed up initial checks
class INSwapper:
    def __init__(self, model_file, session=None, providers=None):
        self.taskname = 'swap'
        # Basic mock or wrapper if we can't patch the real one easily
        # But wait, insightface returns its own INSwapper object.
        pass

def get_imports():
    global insightface, FaceAnalysis
    import insightface
    from insightface.app import FaceAnalysis
    
    # Critical Patch: Monkey patch the INSwapper class directly in the library if possible
    try:
        from insightface.model_zoo.inswapper import INSwapper
        # Force add taskname to the class itself
        if not hasattr(INSwapper, 'taskname'):
            setattr(INSwapper, 'taskname', 'swap')
        
        # Patch prepare method if missing (it seems FaceAnalysis calls prepare on all models, even swapper if it thinks it's part of the pipeline)
        if not hasattr(INSwapper, 'prepare'):
             def prepare(self, ctx_id, **kwargs):
                 pass
             setattr(INSwapper, 'prepare', prepare)
             
    except ImportError:
        pass # Maybe older version or different structure

def setup_logger():
    pass

class FaceTrainer:
    def __init__(self):
        self.app = None
        self.swapper = None
        
    def initialize(self):
        get_imports()
        # Initialize detection model
        # providers = ['CUDAExecutionProvider', 'CoreMLExecutionProvider', 'CPUExecutionProvider']
        
        # Explicitly disable swapper model during FaceAnalysis init if possible, or just ignore it
        # FORCE CPU provider to avoid CoreML issues on macOS which are causing 'NoneType' arithmetic in NMS
        # We need 'recognition' (arcface) to get embeddings, and 'detection' to find faces.
        self.app = FaceAnalysis(name='buffalo_l', allowed_modules=['detection', 'recognition'], providers=['CPUExecutionProvider'])
        self.app.prepare(ctx_id=0, det_size=(640, 640))
        
        # Monkey patch the internal models of FaceAnalysis if they suffer from the same issue
        if hasattr(self.app, 'models'):
            # Check if models is a dict (newer versions) or list
            models_iter = self.app.models.keys() if isinstance(self.app.models, dict) else range(len(self.app.models))
            
            for key in models_iter:
                model = self.app.models[key]
                # Force set taskname if missing, don't just check
                if not hasattr(model, 'taskname'):
                    name_hint = str(key) if isinstance(key, str) else ''
                    model.taskname = 'detection' if 'det' in name_hint else 'recognition'
                
                # Ensure prepare method exists
                if not hasattr(model, 'prepare'):
                    model.prepare = lambda ctx_id, **kwargs: None

    def detect_faces(self, dataset_path):
        if not self.app:
            self.initialize()
            
        results = []
        if not os.path.exists(dataset_path):
            return {"error": "Dataset path does not exist"}

        valid_extensions = ('.jpg', '.jpeg', '.png')
        files = [f for f in os.listdir(dataset_path) if f.lower().endswith(valid_extensions)]
        
        for filename in files:
            filepath = os.path.join(dataset_path, filename)
            try:
                img = cv2.imread(filepath)
                if img is None:
                    continue
                
                faces = self.app.get(img)
                
                results.append({
                    "file": filename,
                    "status": "ok",
                    "faces_count": len(faces)
                })
            except Exception as e:
                results.append({"file": filename, "status": "error", "message": str(e)})
                
        return {"results": results, "total_images": len(files)}

    def train_model(self, dataset_path, output_path, model_name):
        if not self.app:
            self.initialize()
            
        embeddings = []
        preview_image = None
        
        valid_extensions = ('.jpg', '.jpeg', '.png')
        files = [f for f in os.listdir(dataset_path) if f.lower().endswith(valid_extensions)]
        
        total = len(files)
        processed = 0
        
        for filename in files:
            filepath = os.path.join(dataset_path, filename)
            img = cv2.imread(filepath)
            if img is None:
                continue
                
            try:
                # Explicitly disable nms if possible or catch inside
                # On macOS sometimes CoreML/CPU provider clash causes issues with NMS
                # Let's try to run get() but if it fails deep in nms, we skip
                faces = self.app.get(img)
            except Exception as e:
                 # Catch ALL exceptions including TypeError for NoneType arithmetic in nms
                 # This usually means model inference returned None for boxes/scores
                 print(f"Warning: FaceAnalysis.get failed for {filename}: {e}", file=sys.stderr)
                 faces = [] 

            # Smart filtering: assume the largest face is the user
            if faces and len(faces) > 0:
                faces = sorted(faces, key=lambda x: x.bbox[2] * x.bbox[3], reverse=True)
                target_face = faces[0]
                
                # Check if embedding exists (if we only loaded detection, it might be missing)
                if target_face.embedding is None:
                    # If embedding is missing, we need recognition model
                    # But we disabled it to fix detection crash.
                    # We can try to run recognition separately or re-enable it carefully.
                    # Actually, let's try to enable 'genderage' back but ensure providers is strictly CPU
                    pass 
                
                # Store embedding
                if target_face.embedding is not None:
                    embeddings.append(target_face.embedding)
                
                # Save first good face as preview
                if preview_image is None:
                    bbox = target_face.bbox.astype(int)
                    # Add some padding
                    h, w, _ = img.shape
                    p = 50
                    x1 = max(0, bbox[0] - p)
                    y1 = max(0, bbox[1] - p)
                    x2 = min(w, bbox[2] + p)
                    y2 = min(h, bbox[3] + p)
                    preview_image = img[y1:y2, x1:x2]

            processed += 1

        if not embeddings:
            return {"success": False, "error": "No faces found in dataset"}

        # Calculate mean embedding
        mean_embedding = np.mean(embeddings, axis=0)
        norm_embedding = mean_embedding / np.linalg.norm(mean_embedding)
        
        # Create model structure
        model_data = {
            "name": model_name,
            "created_at": datetime.now().isoformat(),
            "embedding": norm_embedding,
            "version": "1.0",
            "source_images_count": len(embeddings)
        }
        
        # Save model
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        with open(output_path, 'wb') as f:
            pickle.dump(model_data, f)
            
        # Save preview
        preview_path = output_path.replace('.fsem', '.jpg')
        if preview_image is not None:
            cv2.imwrite(preview_path, preview_image)

        return {
            "success": True, 
            "model_path": output_path,
            "preview_path": preview_path,
            "faces_used": len(embeddings)
        }

    def swap_face(self, model_path, target_image_path, output_path):
        if not self.app:
            self.initialize()
            
        # Load source embedding from trained model
        try:
            with open(model_path, 'rb') as f:
                model_data = pickle.load(f)
            source_embedding = model_data['embedding']
        except Exception as e:
            return {"success": False, "error": f"Failed to load model: {str(e)}"}

        # Initialize Swapper if needed
        if self.swapper is None:
            model_file = os.path.join(os.path.dirname(__file__), '..', 'models', 'checkpoints', 'inswapper_128.onnx')
            if not os.path.exists(model_file):
                return {"success": False, "error": "Inswapper model not found. Restart app to download."}
            
            # Providers: prioritizes GPU (CUDA/CoreML) if available
            self.swapper = insightface.model_zoo.get_model(model_file, providers=['CoreMLExecutionProvider', 'CUDAExecutionProvider', 'CPUExecutionProvider'])
            # Patch for insightface 0.7.3 issue where taskname attribute is missing in INSwapper class
            # but required by get_model if not properly initialized or if ONNX metadata is missing it
            if not hasattr(self.swapper, 'taskname'):
                self.swapper.taskname = 'swap' # Manually set taskname to 'swap'

        # Read target image
        img = cv2.imread(target_image_path)
        if img is None:
            return {"success": False, "error": "Cannot read target image"}

        # Detect faces in target image
        faces = self.app.get(img)
        if not faces:
            return {"success": False, "error": "No faces detected in target image"}

        # Prepare source face object (mock)
        class SourceFace:
            def __init__(self, embedding):
                self.embedding = embedding
                self.normed_embedding = embedding
        
        source_face = SourceFace(source_embedding)
        
        # Swap ALL faces in target
        res_img = img.copy()
        for face in faces:
            res_img = self.swapper.get(res_img, face, source_face, paste_back=True)
            
        # Save result
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        cv2.imwrite(output_path, res_img)
        
        return {"success": True, "output_path": output_path}

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--command", required=True)
    parser.add_argument("--dataset_path")
    parser.add_argument("--output_path")
    parser.add_argument("--model_name")
    parser.add_argument("--model_path")
    parser.add_argument("--target_image")
    
    args = parser.parse_args()
    
    trainer = FaceTrainer()
    
    try:
        if args.command == "detect_faces":
            res = trainer.detect_faces(args.dataset_path)
            print(json.dumps(res))
            
        elif args.command == "train":
            res = trainer.train_model(args.dataset_path, args.output_path, args.model_name)
            print(json.dumps(res))
            
        elif args.command == "swap":
            res = trainer.swap_face(args.model_path, args.target_image, args.output_path)
            print(json.dumps(res))
            
        else:
            print(json.dumps({"error": "Unknown command"}))
            
    except Exception as e:
        import traceback
        traceback.print_exc(file=sys.stderr)
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()
