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

# Lazy import for GFPGAN to avoid heavy load if not used
def get_enhancer_imports():
    global GFPGANer
    # CRITICAL FIX: Patch for torchvision 0.16+ compatibility in basicsr
    # basicsr tries to import 'functional_tensor' which was removed in newer torchvision.
    import sys
    try:
        import torchvision.transforms.functional as F
        try:
             import torchvision.transforms.functional_tensor
        except ImportError:
             # Map the missing module to the main functional module
             sys.modules['torchvision.transforms.functional_tensor'] = F
    except Exception:
        pass

    from gfpgan import GFPGANer

# Path configuration
if os.environ.get('MODELS_DIR'):
    CHECKPOINTS_DIR = os.path.join(os.environ.get('MODELS_DIR'), 'checkpoints')
else:
    CHECKPOINTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'models', 'checkpoints')

def setup_logger():
    pass

class FaceTrainer:
    def __init__(self):
        self.app = None
        self.swapper = None
        self.enhancer = None
        
    def initialize(self):
        get_imports()
        # Initialize detection model
        # providers = ['CUDAExecutionProvider', 'CoreMLExecutionProvider', 'CPUExecutionProvider']
        
        # Explicitly disable swapper model during FaceAnalysis init if possible, or just ignore it
        # FORCE CPU provider to avoid CoreML issues on macOS which are causing 'NoneType' arithmetic in NMS
        # We need 'recognition' (arcface) to get embeddings, and 'detection' to find faces.
        # TRY: Allow CoreML for detection only, maybe it works better? 
        # Actually, let's try to remove provider restriction and let it default (likely CoreML first) 
        # but keep the Monkey Patch for NMS/NoneType safety in try-catch blocks we added.
        # If it crashes again, we know CoreML is the culprit. But since it fails to DETECT, maybe CPU is the problem.
        self.app = FaceAnalysis(name='buffalo_l', allowed_modules=['detection', 'recognition']) 
        # Increase det_size to better detect faces in high-res images. (640, 640) is default but sometimes too small.
        # (1280, 1280) usually gives better results for portraits.
        self.app.prepare(ctx_id=0, det_size=(640, 640)) # Reset to default, let adaptive handle sizes
        
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

    def initialize_enhancer(self, upscale=1):
        # Re-initialize if params changed or not initialized
        if self.enhancer is not None and self.enhancer.upscale == upscale:
            return

        get_enhancer_imports()
        
        model_path = os.path.join(CHECKPOINTS_DIR, 'GFPGANv1.4.pth')
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"GFPGAN model not found at {model_path}")

        # Initialize GFPGAN
        # To get sharper faces AND background, we need a background upsampler (RealESRGAN).
        # We will try to load RealESRGAN_x2plus.pth from our checkpoints.
        
        bg_upsampler = None
        # Try to set up RealESRGAN if requested (upscale > 1)
        if upscale > 1:
            try:
                from basicsr.archs.rrdbnet_arch import RRDBNet
                from realesrgan import RealESRGANer
                
                realesrgan_model_path = os.path.join(CHECKPOINTS_DIR, 'RealESRGAN_x2plus.pth')
                if os.path.exists(realesrgan_model_path):
                    # RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=2)
                    model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=2)
                    bg_upsampler = RealESRGANer(
                        scale=2,
                        model_path=realesrgan_model_path,
                        model=model,
                        tile=400,
                        tile_pad=10,
                        pre_pad=0,
                        half=False # Use float32 for better quality/stability on Mac
                    )
                    print(f"Background upsampler initialized: {realesrgan_model_path}", file=sys.stderr)
                else:
                     print(f"Warning: RealESRGAN model not found at {realesrgan_model_path}. Background will not be upscaled.", file=sys.stderr)
            except Exception as e:
                print(f"Warning: Failed to init RealESRGAN: {e}", file=sys.stderr)

        # Revert force upscale=4, as we only have x2plus model. Mismatch causes pixelation.
        # We will use sharpening filter instead for crispness.
        final_upscale = upscale 
        self.enhancer = GFPGANer(model_path=model_path, upscale=final_upscale, arch='clean', channel_multiplier=2, bg_upsampler=bg_upsampler)

    def load_model(self, model_path):
        """
        Dummy implementation or placeholder if load_model is expected.
        Actually, we load model data directly in swap_face.
        Let's add a helper to validate model file existence.
        """
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model file not found: {model_path}")
        # In this simplistic trainer, we don't hold state of "loaded model" in self 
        # other than validating it exists, because we load pickle on demand.
        # But batch_swap expects to load it once. 
        # Let's cache the embedding.
        with open(model_path, 'rb') as f:
            self.current_model_data = pickle.load(f)
        self.current_source_embedding = self.current_model_data['embedding']
        print(f"Model loaded: {model_path}", file=sys.stderr)

    def initialize_enhancer(self, upscale=1):
        get_enhancer_imports()
        
        model_path = os.path.join(CHECKPOINTS_DIR, 'GFPGANv1.4.pth')
        if not os.path.exists(model_path):
             print(f"Warning: GFPGAN model not found at {model_path}. Enhancement will be skipped.", file=sys.stderr)
             self.enhancer = None
             return

        # Check for RealESRGAN
        realesrgan_model_path = os.path.join(CHECKPOINTS_DIR, 'RealESRGAN_x2plus.pth')
        bg_upsampler = None
        
        if upscale > 1:
            try:
                if os.path.exists(realesrgan_model_path):
                    from realesrgan import RealESRGANer
                    from basicsr.archs.rrdbnet_arch import RRDBNet
                    # RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=2)
                    model = RRDBNet(num_in_ch=3, num_out_ch=3, num_feat=64, num_block=23, num_grow_ch=32, scale=2)
                    bg_upsampler = RealESRGANer(
                        scale=2,
                        model_path=realesrgan_model_path,
                        model=model,
                        tile=400,
                        tile_pad=10,
                        pre_pad=0,
                        half=False 
                    )
                    print(f"Background upsampler initialized: {realesrgan_model_path}", file=sys.stderr)
            except Exception as e:
                print(f"Warning: Failed to init RealESRGAN: {e}", file=sys.stderr)

        final_upscale = upscale 
        self.enhancer = GFPGANer(model_path=model_path, upscale=final_upscale, arch='clean', channel_multiplier=2, bg_upsampler=bg_upsampler)
        self.current_upscale = upscale

    def sharpen_image(self, img):
        # Apply Unsharp Mask to make it crisp
        gaussian = cv2.GaussianBlur(img, (0, 0), 2.0)
        unsharp_image = cv2.addWeighted(img, 1.5, gaussian, -0.5, 0)
        return unsharp_image

    def batch_swap(self, model_path, input_dir, output_dir, enhance=False, upscale=1):
        """
        Process all images in input_dir and save to output_dir
        """
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        # Load models ONCE
        print(f"Loading model from {model_path}...", file=sys.stderr)
        try:
            self.load_model(model_path)
            # Initialize enhancer if needed
            if enhance:
                # We need to initialize enhancer with dummy paths or check existing logic
                # For batch, we reuse the same logic as swap_face but we need to ensure enhancer is ready
                # swap_face logic: init enhancer inside swap_face is bad for batch.
                # Refactor: move enhancer init to separate method or ensure it's initialized.
                pass 
        except Exception as e:
             print(json.dumps({"error": f"Failed to load model: {str(e)}"}), file=sys.stdout)
             return

        image_files = [f for f in os.listdir(input_dir) if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp'))]
        total_images = len(image_files)
        
        if total_images == 0:
             print(json.dumps({"error": "No images found in input directory"}), file=sys.stdout)
             return

        print(f"Found {total_images} images. Starting batch processing...", file=sys.stderr)
        
        processed_count = 0
        import time
        start_time = time.time()

        for idx, filename in enumerate(image_files):
            input_path = os.path.join(input_dir, filename)
            output_path = os.path.join(output_dir, f"swap_{filename}")
            
            try:
                # Reuse swap_face logic but avoid reloading model
                # We can call swap_face but we need to make sure it doesn't reload if already loaded
                # Or better, refactor swap_face to separate model loading from processing.
                # For now, let's just call swap_face. It loads model every time which is slow.
                # WAIT! self.swap_face calls self.load_model. 
                # Let's optimize: check if self.swapper is already loaded matching model_path?
                # Actually, self.swap_face creates new INSwapper instance.
                # We should refactor swap_face to use pre-loaded model.
                
                # Refactored call:
                self.process_single_image(input_path, output_path, enhance, upscale)
                
                processed_count += 1
                
                # Calculate progress
                elapsed = time.time() - start_time
                avg_time = elapsed / processed_count
                remaining = total_images - processed_count
                eta = remaining * avg_time
                
                progress_data = {
                    "progress": int((processed_count / total_images) * 100),
                    "current": processed_count,
                    "total": total_images,
                    "eta_seconds": int(eta),
                    "filename": filename
                }
                print(json.dumps(progress_data), file=sys.stdout)
                sys.stdout.flush() # Ensure flush

            except Exception as e:
                print(f"Error processing {filename}: {e}", file=sys.stderr)
                # Continue with next file

        print(json.dumps({"success": True, "count": processed_count, "output_dir": output_dir}), file=sys.stdout)

    def process_single_image(self, target_image_path, output_path, enhance=False, upscale=1):
        # ... logic extracted from swap_face ...
        # This assumes models are ALREADY loaded in self.swapper and self.enhancer
        
        # Initialize enhancer if not already done and requested
        if enhance and not hasattr(self, 'enhancer'):
             # We need to init enhancer. The init logic is in swap_face currently.
             # Let's reuse the initialization block from swap_face but check if it exists.
             # Better yet, let's rely on swap_face logic but optimize it to NOT reload if path is same.
             # For MVP batch, let's just copy the processing logic here.
             
             # Need to ensure enhancer is initialized.
             # Let's look at how swap_face initializes enhancer.
             # It does it every time based on upscale param.
             # We should probably initialize it once in batch_swap.
             pass

        # ... (Implementation below) ...
        # Simplified for brevity: call existing swap_face but we need to fix the reloading issue.
        # Actually, for this task, I will modify swap_face to check if model is already loaded.
        self.swap_face(None, target_image_path, output_path, enhance, upscale, skip_loading=True)


    def swap_face(self, model_path, target_image_path, output_path, enhance=False, upscale=1, skip_loading=False):
        if not skip_loading and model_path:
             self.load_model(model_path)
        
        # ... (rest of swap_face logic) ...
        # Note: Enhancer init also takes time. We should cache it.
        
        # TARGET IMAGE LOADING
        img = cv2.imread(target_image_path)
        # ...

        if not self.app:
            self.initialize()
            
        if enhance:
            try:
                self.initialize_enhancer(upscale=upscale)
            except Exception as e:
                return {"success": False, "error": f"Failed to init enhancer: {str(e)}. Did you download GFPGANv1.4.pth?"}
            
        # Load source embedding from trained model
        try:
            if hasattr(self, 'current_source_embedding') and skip_loading:
                 source_embedding = self.current_source_embedding
            else:
                with open(model_path, 'rb') as f:
                    model_data = pickle.load(f)
                source_embedding = model_data['embedding']
        except Exception as e:
            return {"success": False, "error": f"Failed to load model: {str(e)}"}

        # Initialize Swapper if needed
        if self.swapper is None:
            model_file = os.path.join(CHECKPOINTS_DIR, 'inswapper_128.onnx')
            if not os.path.exists(model_file):
                return {"success": False, "error": "Inswapper model not found. Restart app to download."}
            
            # Providers: prioritizes GPU (CoreML for Apple Silicon) if available
            # Note: We keep CPU for FaceAnalysis (detection) stability, but Swapper is safer on CoreML
            self.swapper = insightface.model_zoo.get_model(model_file, providers=['CoreMLExecutionProvider', 'CPUExecutionProvider'])
            
            # Patch for insightface 0.7.3 issue where taskname attribute is missing in INSwapper class
            # but required by get_model if not properly initialized or if ONNX metadata is missing it
            if not hasattr(self.swapper, 'taskname'):
                self.swapper.taskname = 'swap' # Manually set taskname to 'swap'

        # Read target image
        img = cv2.imread(target_image_path)
        if img is None:
            return {"success": False, "error": "Cannot read target image"}

        # Fix EXIF orientation using PIL because cv2 ignores it
        try:
            from PIL import Image, ImageOps
            pil_img = Image.open(target_image_path)
            pil_img = ImageOps.exif_transpose(pil_img)
            # Convert back to cv2 (BGR)
            img = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
        except Exception as e:
            print(f"Warning: Failed to fix EXIF orientation: {e}", file=sys.stderr)

        # DEBUG: Save input image to verify what detector sees
        debug_path = os.path.join(os.path.dirname(output_path), "debug_input.jpg")
        cv2.imwrite(debug_path, img)
        print(f"DEBUG: Saved input image to {debug_path}. Shape: {img.shape}", file=sys.stderr)

        # Adaptive Detection Strategy
        # Try different detection sizes to find the face
        # Add (640, 640) again at end as fallback if others fail weirdly
        det_sizes = [(640, 640), (320, 320), (1280, 1280)]
        faces = []
        
        # Lower threshold to find tricky faces
        self.app.det_model.det_thresh = 0.3
        
        for size in det_sizes:
            print(f"Trying detection with size {size}...", file=sys.stderr)
            try:
                self.app.prepare(ctx_id=0, det_size=size)
                faces = self.app.get(img)
                if faces:
                    print(f"Faces found with size {size}!", file=sys.stderr)
                    break
            except Exception as e:
                print(f"Detection failed for size {size}: {e}", file=sys.stderr)
        
        if not faces:
            # Last resort: try rotating image if it's a portrait orientation issue? 
            # Or just fail gracefully.
            return {"success": False, "error": "No faces detected in target image (tried multiple scales)"}

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
            
        # Enhance Result if requested
        if enhance and self.enhancer:
            print(f"Applying enhancement with upscale={self.enhancer.upscale}...", file=sys.stderr)
            try:
                # GFPGAN restore
                # weight: the weight of restored faces. Default is 0.5.
                # If upscale > 1 (Strong mode), we use weight=1.0 for max sharpness
                weight = 1.0 if self.enhancer.upscale > 1 else 0.5
                _, _, res_img = self.enhancer.enhance(res_img, has_aligned=False, only_center_face=False, paste_back=True, weight=weight)
                
                # Apply extra sharpening if Strong mode
                if self.enhancer.upscale > 1:
                    print("Applying extra sharpening filter...", file=sys.stderr)
                    res_img = self.sharpen_image(res_img)
                
                print(f"Enhancement applied successfully (weight={weight}).", file=sys.stderr)
            except Exception as e:
                print(f"Warning: Enhancement failed: {e}", file=sys.stderr)
                import traceback
                traceback.print_exc()
                # Don't fail the whole swap, just return un-enhanced result
            
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
    parser.add_argument("--enhance", action="store_true", help="Enable face enhancement")
    parser.add_argument("--upscale", type=int, default=1, help="Upscale factor for enhancement")
    
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
            res = trainer.swap_face(args.model_path, args.target_image, args.output_path, enhance=args.enhance, upscale=args.upscale)
            print(json.dumps(res))

        elif args.command == "batch_swap":
            # output_path argument is used as output directory for batch
            trainer.batch_swap(args.model_path, args.dataset_path, args.output_path, enhance=args.enhance, upscale=args.upscale)
            
        else:
            print(json.dumps({"error": "Unknown command"}))
            
    except Exception as e:
        import traceback
        traceback.print_exc(file=sys.stderr)
        print(json.dumps({"error": str(e)}))

if __name__ == "__main__":
    main()
