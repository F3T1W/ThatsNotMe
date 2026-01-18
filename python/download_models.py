import os
import requests
import zipfile
import shutil
from tqdm import tqdm

MODELS_DIR = os.path.join(os.path.dirname(__file__), '..', 'models', 'checkpoints')
INSIGHTFACE_DIR = os.path.join(os.path.expanduser('~'), '.insightface', 'models')

URLS = {
    "inswapper_128.onnx": "https://github.com/facefusion/facefusion-assets/releases/download/models/inswapper_128.onnx",
    "buffalo_l.zip": "https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip"
}

def ensure_models_dir():
    if not os.path.exists(MODELS_DIR):
        os.makedirs(MODELS_DIR)

def download_file(url, dest_path):
    if os.path.exists(dest_path):
        # Verify file size (simple check)
        remote_size = int(requests.head(url).headers.get('content-length', 0))
        local_size = os.path.getsize(dest_path)
        if remote_size == local_size:
            print(f"File exists and size matches: {dest_path}")
            return
        else:
            print(f"File exists but size mismatch ({local_size} vs {remote_size}). Re-downloading...")

    print(f"Downloading {url} to {dest_path}...")
    response = requests.get(url, stream=True)
    total_size = int(response.headers.get('content-length', 0))
    
    with open(dest_path, 'wb') as file, tqdm(
        desc=os.path.basename(dest_path),
        total=total_size,
        unit='iB',
        unit_scale=True,
        unit_divisor=1024,
    ) as bar:
        for data in response.iter_content(chunk_size=1024):
            size = file.write(data)
            bar.update(size)

def setup_insightface_models():
    # InsightFace looks for models in ~/.insightface/models/buffalo_l
    # We download buffalo_l.zip and extract it there
    buffalo_dir = os.path.join(INSIGHTFACE_DIR, 'buffalo_l')
    
    if os.path.exists(os.path.join(buffalo_dir, '1k3d68.onnx')):
        print("InsightFace models (buffalo_l) already set up.")
        return

    print("Setting up InsightFace detection models...")
    zip_path = os.path.join(MODELS_DIR, 'buffalo_l.zip')
    
    # Download zip if not exists
    download_file(URLS['buffalo_l.zip'], zip_path)
    
    # Extract
    if not os.path.exists(buffalo_dir):
        os.makedirs(buffalo_dir)
        
    print(f"Extracting to {buffalo_dir}...")
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(buffalo_dir)

def main():
    ensure_models_dir()
    
    # 1. Download Swapper Model
    swap_model_path = os.path.join(MODELS_DIR, 'inswapper_128.onnx')
    download_file(URLS['inswapper_128.onnx'], swap_model_path)
    
    # 2. Setup Detection Models
    setup_insightface_models()
    
    print("All models checked and downloaded.")

if __name__ == "__main__":
    main()
