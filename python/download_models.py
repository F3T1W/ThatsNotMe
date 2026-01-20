import os
import requests
import zipfile
import shutil
import sys
import json
from tqdm import tqdm

# Allow overriding models directory via environment variable (for packaged app)
if os.environ.get('MODELS_DIR'):
    MODELS_DIR = os.path.join(os.environ.get('MODELS_DIR'), 'checkpoints')
else:
    MODELS_DIR = os.path.join(os.path.dirname(__file__), '..', 'models', 'checkpoints')

INSIGHTFACE_DIR = os.path.join(os.path.expanduser('~'), '.insightface', 'models')

URLS = {
    # Using HuggingFace mirrors which are often more reliable for direct downloads
    "inswapper_128.onnx": "https://huggingface.co/ezioruan/inswapper_128.onnx/resolve/main/inswapper_128.onnx",
    "buffalo_l.zip": "https://github.com/deepinsight/insightface/releases/download/v0.7/buffalo_l.zip",
    "GFPGANv1.4.pth": "https://github.com/TencentARC/GFPGAN/releases/download/v1.3.0/GFPGANv1.4.pth",
    "RealESRGAN_x2plus.pth": "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.1/RealESRGAN_x2plus.pth"
}

def ensure_models_dir():
    if not os.path.exists(MODELS_DIR):
        os.makedirs(MODELS_DIR)

def report_progress(filename, current, total, status="downloading"):
    data = {
        "filename": filename,
        "current": current,
        "total": total,
        "progress": int((current / total) * 100) if total > 0 else 0,
        "status": status
    }
    print(json.dumps(data), file=sys.stdout)
    sys.stdout.flush()

def download_file(url, dest_path):
    filename = os.path.basename(dest_path)
    
    # Headers to mimic a browser to avoid 403/429 errors from GitHub/HuggingFace
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }

    if os.path.exists(dest_path):
        # Verify file size (simple check)
        try:
            response = requests.head(url, allow_redirects=True, headers=headers)
            if response.status_code != 200:
                 # Try GET with stream if HEAD fails
                 pass
            else:
                remote_size = int(response.headers.get('content-length', 0))
                local_size = os.path.getsize(dest_path)
                
                # If remote size is unknown (chunked) or matches, skip.
                # If local file is < 1KB, it's definitely broken error page.
                if local_size < 1024:
                    print(f"File {filename} is too small ({local_size} bytes), re-downloading...", file=sys.stderr)
                elif remote_size > 0 and remote_size == local_size:
                    report_progress(filename, local_size, local_size, "exists")
                    return
                elif remote_size > 0:
                    print(f"File exists but size mismatch ({local_size} vs {remote_size}). Re-downloading...", file=sys.stderr)
        except Exception as e:
            print(f"Warning: Could not verify size for {filename}: {e}", file=sys.stderr)
            # Proceed to download just in case if validation failed
    
    report_progress(filename, 0, 100, "starting")
    
    try:
        response = requests.get(url, stream=True, headers=headers)
        response.raise_for_status() # Raise error for 4xx/5xx
        
        total_size = int(response.headers.get('content-length', 0))
        
        downloaded = 0
        with open(dest_path, 'wb') as file:
            for data in response.iter_content(chunk_size=8192): # 8KB chunks
                size = file.write(data)
                downloaded += size
                report_progress(filename, downloaded, total_size, "downloading")
                
        report_progress(filename, total_size, total_size, "completed")
        
    except Exception as e:
        print(json.dumps({"error": str(e), "filename": filename}), file=sys.stdout)
        raise e

def setup_insightface_models():
    # InsightFace looks for models in ~/.insightface/models/buffalo_l
    # We download buffalo_l.zip and extract it there
    buffalo_dir = os.path.join(INSIGHTFACE_DIR, 'buffalo_l')
    
    # Check if critical files exist inside buffalo_dir
    if os.path.exists(os.path.join(buffalo_dir, '1k3d68.onnx')) and \
       os.path.exists(os.path.join(buffalo_dir, '2d106det.onnx')):
        report_progress("buffalo_l", 100, 100, "exists")
        return

    zip_path = os.path.join(MODELS_DIR, 'buffalo_l.zip')
    
    # Download zip if not exists
    download_file(URLS['buffalo_l.zip'], zip_path)
    
    # Extract
    if not os.path.exists(buffalo_dir):
        os.makedirs(buffalo_dir)
        
    report_progress("buffalo_l.zip", 100, 100, "extracting")
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(buffalo_dir)
    report_progress("buffalo_l", 100, 100, "completed")

def main():
    ensure_models_dir()
    
    # 1. Download Swapper Model
    try:
        download_file(URLS['inswapper_128.onnx'], os.path.join(MODELS_DIR, 'inswapper_128.onnx'))
    except Exception as e:
        print(f"Failed to download swapper: {e}", file=sys.stderr)

    # 2. Download GFPGAN
    try:
        download_file(URLS['GFPGANv1.4.pth'], os.path.join(MODELS_DIR, 'GFPGANv1.4.pth'))
    except Exception as e:
         print(f"Failed to download GFPGAN: {e}", file=sys.stderr)

    # 3. Download RealESRGAN
    try:
        download_file(URLS['RealESRGAN_x2plus.pth'], os.path.join(MODELS_DIR, 'RealESRGAN_x2plus.pth'))
    except Exception as e:
         print(f"Failed to download RealESRGAN: {e}", file=sys.stderr)
    
    # 4. Setup Detection Models
    try:
        setup_insightface_models()
    except Exception as e:
         print(f"Failed to setup InsightFace: {e}", file=sys.stderr)
    
    print(json.dumps({"status": "all_done"}), file=sys.stdout)

if __name__ == "__main__":
    main()
