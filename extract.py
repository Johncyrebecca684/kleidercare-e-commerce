import re
import json

file_path = r"C:\Users\Admin\.gemini\antigravity-ide\brain\78a10132-eb78-4b26-a112-10381d1c09ae\.system_generated\steps\69\content.md"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to find blocks containing:
# <img src="URL" ...>
# <p class="... text-uppercase">NAME</p>
# <p class="...">DESCRIPTION</p>

# The structure looks like this:
# <img class="card card-custom p-4" src="IMAGE_URL" ...>
# <p class="h4 p-3 text-center text-dark text-uppercase">NAME</p>
# <p class="px-3 text-center text-dark">CODE</p>
# <div class="action ...

pattern = re.compile(
    r'<img[^>]*?src="([^"]+)"[^>]*?>\s*'
    r'<p[^>]*?text-uppercase[^>]*?>([^<]+)</p>\s*'
    r'<p[^>]*?>([^<]+)</p>',
    re.DOTALL
)

matches = pattern.findall(content)

products = []
for i, match in enumerate(matches):
    img, name, desc = match
    img = img.strip()
    name = name.strip()
    desc = desc.strip()
    
    # Exclude dummy images or anything not relevant
    if not img.startswith('http'):
        continue

    products.append({
        "id": 13 + i,
        "name": name,
        "category": "Genuine Spare Parts",
        "price": 1000 + (i * 100) % 500, # Dummy price
        "originalPrice": 1200 + (i * 100) % 500,
        "rating": 4.8,
        "reviews": 100 + i,
        "image": img,
        "description": desc,
        "badge": "Best Seller" if i % 3 == 0 else None
    })

with open('extracted_products.json', 'w', encoding='utf-8') as f:
    json.dump(products, f, indent=2)

print(f"Extracted {len(products)} products.")
