from PIL import Image, ImageDraw
import sys

def remove_background(input_path, output_path):
    img = Image.open(input_path).convert("RGBA")
    
    # We will flood fill from the 4 corners to replace white with transparent
    # Create a draw object
    # Pillow's floodfill modifies the image in place
    
    # Target color to replace (white)
    # The floodfill will start from these coordinates
    corners = [(0, 0), (img.width - 1, 0), (0, img.height - 1), (img.width - 1, img.height - 1)]
    
    # We need to do this carefully because PIL floodfill doesn't support tolerance out of the box in older versions, 
    # wait, ImageDraw.floodfill has a 'thresh' parameter.
    try:
        for corner in corners:
            ImageDraw.floodfill(img, corner, (255, 255, 255, 0), thresh=40)
    except Exception as e:
        print(f"Error processing {input_path}: {e}")
        return
    
    img.save(output_path)
    print(f"Processed {input_path} -> {output_path}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python remove_bg.py <input> <output>")
        sys.exit(1)
    remove_background(sys.argv[1], sys.argv[2])
