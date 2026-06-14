import os
import re

CSS_DIR = "src"

REPLACEMENTS = {
    # Replace all heavy dark blue gradients with a light off-white/gray background
    r"background:\s*linear-gradient\(135deg,\s*#001a4d\s*0%,\s*#003366\s*100%\);": "background: #f4f7fb;",
    r"background:\s*linear-gradient\(180deg,\s*#001a4d\s*0%,\s*#0f32a3\s*70%,\s*#001a4d\s*100%\);": "background: #f4f7fb;",
    r"background:\s*linear-gradient\(135deg,\s*#003366\s*0%,\s*#001a4d\s*100%\);": "background: #f4f7fb;",
    
    # Global color replacements to standard KC Blue
    r"#001a4d": "#1a4a8d",
    r"#003366": "#1a4a8d",
    r"#0f32a3": "#1a4a8d",
    r"#003d7a": "#1a4a8d",
    r"#002d7a": "#1a4a8d",
    r"#0040a8": "#1a4a8d",
    r"#004d99": "#1a4a8d"
}

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
        
    original = content
    for old, new in REPLACEMENTS.items():
        # Case insensitive regex replacement
        content = re.sub(old, new, content, flags=re.IGNORECASE)
        
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {filepath}")

def main():
    for root, dirs, files in os.walk(CSS_DIR):
        for file in files:
            if file.endswith('.css'):
                process_file(os.path.join(root, file))

if __name__ == "__main__":
    main()
