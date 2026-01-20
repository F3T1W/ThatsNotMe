import os
import sys
from PIL import Image, ImageOps, ImageDraw

def create_squircle_mask(size, radius_factor=0.2):
    mask = Image.new('L', size, 0)
    draw = ImageDraw.Draw(mask)
    # Draw a rounded rectangle that fills the size
    # In macOS Big Sur+, icons are "squircle" shaped.
    # A standard rounded rect is a good approximation.
    # Radius is typically ~22% of the width.
    w, h = size
    # Using a slightly complex shape for squircle or just rounded rect
    # Standard rounded rect:
    draw.rounded_rectangle((0, 0, w, h), radius=int(w * radius_factor), fill=255)
    return mask

def generate_icons(source_path):
    if not os.path.exists(source_path):
        print(f"Error: Source image {source_path} not found.")
        return

    # Create build directory if not exists
    build_dir = os.path.join(os.path.dirname(__file__))
    if not os.path.exists(build_dir):
        os.makedirs(build_dir)

    try:
        img = Image.open(source_path).convert("RGBA")
    except Exception as e:
        print(f"Error opening image: {e}")
        return

    # Base size for master icon
    base_size = (1024, 1024)
    
    # Resize/Crop to square
    img = ImageOps.fit(img, base_size, method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))

    # --- Windows (ICO) ---
    # ICO contains multiple sizes
    ico_path = os.path.join(build_dir, "icon.ico")
    img.save(ico_path, format="ICO", sizes=[(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)])
    print(f"Generated {ico_path}")

    # --- Linux/Windows (PNG) ---
    # Just the square icon
    png_path = os.path.join(build_dir, "icon.png")
    img.save(png_path, format="PNG")
    print(f"Generated {png_path}")

    # --- macOS (ICNS) ---
    # Needs to be a squircle and slightly padded usually, but Electron builder handles some of this?
    # Actually, for macOS, we often want the "document" style or app style.
    # App style (Big Sur+): Rounded square (Squircle) with drop shadow (optional).
    # We will generate a PNG set that iconutil (if available) or manual creation uses.
    # But usually just providing a 1024x1024 png to electron-builder is enough?
    # User specifically asked for "squircle rounding" and "90% size" previously.
    
    # Create the macOS specific version
    # 1. Resize to 90% (approx 921x921) to leave room for shadow if system adds it, 
    #    or just to match user preference "icon is slightly bigger than standard". 
    #    User said "icon slightly bigger than standard" -> wait, user said "icon slightly bigger than standard" so "90%" fix was GOOD.
    #    So we scale content down to ~90% of canvas.
    
    canvas_size = (1024, 1024)
    mac_img = Image.new('RGBA', canvas_size, (0,0,0,0))
    
    # Scale content
    content_scale = 0.9
    content_size = (int(1024 * content_scale), int(1024 * content_scale))
    scaled_content = img.resize(content_size, Image.Resampling.LANCZOS)
    
    # Apply Squircle Mask to content
    mask = create_squircle_mask(content_size, radius_factor=0.22)
    scaled_content.putalpha(mask)
    
    # Paste centered
    offset = ((1024 - content_size[0]) // 2, (1024 - content_size[1]) // 2)
    mac_img.paste(scaled_content, offset, scaled_content)
    
    # Save as ICNS source (or just .icns if we can, but PIL doesn't save ICNS directly easily without external tools usually, 
    # but newer Pillow might support it or we just save png and let electron-builder handle it?)
    # Wait, electron-builder prefers .icns for mac.
    # If we can't save ICNS directly via PIL (it's read-only mostly), we save as icon.icns using a trick or just save a png named icon.icns? No.
    # We will save as icon_mac.png and user might need to convert, OR we rely on electron-builder which can take png.
    # BUT user asked to "generate icons".
    # Let's check if we can save .icns. Pillow 9+ supports writing ICNS? 
    # Let's try. If not, we fall back to icon.png which electron-builder can use (it generates icns automatically).
    
    # Actually, electron-builder creates icns from png automatically if not provided.
    # But if we want the squircle look baked in:
    # We save this "mac ready" png as `build/icon.png`? No, that breaks Windows/Linux which expect square.
    # We should save it as `build/icon.icns` if possible.
    
    # Let's try to save ICNS.
    icns_path = os.path.join(build_dir, "icon.icns")
    
    # If on macOS, we prefer 'sips' for proper ICNS generation
    if sys.platform == 'darwin':
        # Create a temp png for sips
        mac_icon_png = os.path.join(build_dir, "icon_mac.png")
        mac_img.save(mac_icon_png)
        
        # Remove existing icns if any
        if os.path.exists(icns_path):
            os.remove(icns_path)
            
        print(f"Generating ICNS using sips from {mac_icon_png}...")
        ret = os.system(f"sips -s format icns '{mac_icon_png}' --out '{icns_path}'")
        
        if ret == 0 and os.path.exists(icns_path):
             print(f"Generated {icns_path} using sips")
             # Clean up temp png
             if os.path.exists(mac_icon_png):
                os.remove(mac_icon_png)
        else:
            print("Warning: sips failed to generate ICNS. Trying PIL fallback.")
            try:
                mac_img.save(icns_path, format="ICNS")
                print(f"Generated {icns_path} using PIL fallback")
            except Exception as e:
                print(f"Error saving ICNS with PIL: {e}")

    else:
        # On other platforms, rely on PIL (if it supports it) or just skip
        try:
            mac_img.save(icns_path, format="ICNS")
            print(f"Generated {icns_path}")
        except Exception:
            print("Warning: PIL could not save ICNS. This is expected on some systems without external libraries. Mac icon might be missing.")

if __name__ == "__main__":
    # Check for possible source files
    sources = ["image.jpg", "iconTest.jpg", "icon.png", "models/Hima2.jpg"]
    source = None
    for s in sources:
        if os.path.exists(s):
            source = s
            break
            
    if len(sys.argv) > 1:
        source = sys.argv[1]
        
    if source:
        print(f"Using source image: {source}")
        generate_icons(source)
    else:
        print("No source image found (checked iconTest.jpg, icon.png, models/Hima2.jpg). Please provide one.")
