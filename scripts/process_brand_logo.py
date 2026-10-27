# scripts/process_brand_logo.py
import os
import numpy as np
from PIL import Image

src_path = r'C:/Users/HYC/.gemini/antigravity/brain/c047d890-ed1d-4fb0-a260-a5bd82dcba85/.user_uploaded/media_1793109659371_f7dfabcd.jpg'
out_dir = r'E:/Project/shaanxi-sandbox/public/images/brand'
os.makedirs(out_dir, exist_ok=True)

img = Image.open(src_path).convert('RGBA')
img.save(os.path.join(out_dir, 'eugene_logo_original.png'))

data = np.array(img, dtype=np.float32)
r, g, b, a = data[:, :, 0], data[:, :, 1], data[:, :, 2], data[:, :, 3]

# The background is white (r,g,b > 240). The logo is dark blue (r ~ 12, g ~ 35, b ~ 64).
# Compute darkness/distance from white:
brightness = (r + g + b) / 3.0
# Alpha mask: when brightness is 255 -> alpha 0; when brightness is dark -> alpha 255
alpha = np.clip((250 - brightness) * (255.0 / (250 - 60)), 0, 255)

# Variant 1: Transparent original color
var1 = np.zeros_like(data)
var1[:, :, 0] = r
var1[:, :, 1] = g
var1[:, :, 2] = b
var1[:, :, 3] = alpha
Image.fromarray(var1.astype(np.uint8)).save(os.path.join(out_dir, 'eugene_logo_dark_transparent.png'))

# Variant 2: Transparent pure white/cyan (perfect for dark UI)
var2 = np.zeros_like(data)
# Subtle tech-cyan tint (R: 240, G: 249, B: 255)
var2[:, :, 0] = 240
var2[:, :, 1] = 249
var2[:, :, 2] = 255
var2[:, :, 3] = alpha
Image.fromarray(var2.astype(np.uint8)).save(os.path.join(out_dir, 'eugene_logo_white.png'))

# Variant 3: Sleek Dark Glass Emblem Badge (128x128 for headers)
badge_size = 256
badge = Image.new('RGBA', (badge_size, badge_size), (0, 0, 0, 0))
# resize white logo to fit inside badge
logo_res = Image.fromarray(var2.astype(np.uint8)).resize((int(badge_size * 0.85), int(badge_size * 0.85)), Image.Resampling.LANCZOS)
paste_x = (badge_size - logo_res.width) // 2
paste_y = (badge_size - logo_res.height) // 2
badge.paste(logo_res, (paste_x, paste_y), logo_res)
badge.save(os.path.join(out_dir, 'eugene_logo_badge.png'))

print("Brand logo processed successfully into", out_dir)
