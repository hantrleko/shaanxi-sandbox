# scripts/enhance_terrain_textures.py
import os
import math
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter

TEX_DIR = "public/textures"
dem_path = os.path.join(TEX_DIR, "shaanxi_dem.png")
sat_path = os.path.join(TEX_DIR, "shaanxi_satellite_spotlight.jpg")

if not os.path.exists(sat_path):
    sat_path = os.path.join(TEX_DIR, "shaanxi_satellite.jpg")

print(f"Loading DEM from {dem_path}...")
dem_img = Image.open(dem_path).convert("L")
sat_img = Image.open(sat_path).convert("RGB")

w, h = sat_img.size
dem_resized = dem_img.resize((w, h), Image.Resampling.BICUBIC)
dem_arr = np.array(dem_resized, dtype=np.float32)

print("Calculating multi-scale hillshade and relief shading...")
# 1. Calculate gradient for hillshade
# Light source azimuth: 315 deg (NW), altitude: 45 deg
azimuth = math.radians(315.0)
altitude = math.radians(45.0)

# Sobel gradient
dx = (np.roll(dem_arr, -1, axis=1) - np.roll(dem_arr, 1, axis=1)) * 0.5
dy = (np.roll(dem_arr, -1, axis=0) - np.roll(dem_arr, 1, axis=0)) * 0.5

# Slope and aspect
slope = np.arctan(np.sqrt(dx**2 + dy**2) * 0.08)
aspect = np.arctan2(dy, -dx)

# Hillshade calculation
hillshade = np.sin(altitude) * np.cos(slope) + np.cos(altitude) * np.sin(slope) * np.cos(azimuth - aspect)
hillshade = np.clip(hillshade, 0.0, 1.0)

# Normalize hillshade to [0.35, 1.25]
hs_factor = hillshade * 0.9 + 0.35

# 2. Hypsometric tinting for enhanced geographic clarity:
# High elevation (Qinling peaks > 200/255): add slight cool snow/granite tint
# Mid-low elevation (Guanzhong plain 30~80/255): add rich fertile green-wheat hue
# Northern plateau (100~160/255): add warm rich golden loess hue
sat_arr = np.array(sat_img, dtype=np.float32) / 255.0

# Blend hillshade
blended = sat_arr * hs_factor[:, :, None]

# Subtle hypsometric color boost
# Qinling snow/high peaks (dem > 180)
high_mask = np.clip((dem_arr - 180.0) / 75.0, 0.0, 1.0)[:, :, None]
blended = blended * (1.0 - high_mask * 0.25) + (blended + 0.15) * (high_mask * 0.25)

# Guanzhong plain boost (dem between 25 and 75)
plain_mask = np.clip(1.0 - np.abs(dem_arr - 50.0) / 35.0, 0.0, 1.0)[:, :, None]
# enrich green and golden tones
blended[:, :, 1] += plain_mask[:, :, 0] * 0.04

# Normalize and convert
blended = np.clip(blended * 255.0, 0, 255).astype(np.uint8)
enhanced_sat = Image.fromarray(blended)

# Slight unsharp mask to make mountain ridges ultra-crisp
enhanced_sat = enhanced_sat.filter(ImageFilter.UnsharpMask(radius=1.5, percent=120, threshold=3))

# Boost contrast and saturation
enhanced_sat = ImageEnhance.Contrast(enhanced_sat).enhance(1.15)
enhanced_sat = ImageEnhance.Color(enhanced_sat).enhance(1.12)

out_sat_path = os.path.join(TEX_DIR, "shaanxi_satellite_spotlight.jpg")
enhanced_sat.save(out_sat_path, quality=95)
print(f"[OK] Enhanced relief-shaded satellite map saved: {out_sat_path}")

# 3. Generate razor-sharp Sobel Normal Map
print("Generating high-definition Sobel normal map...")
dem_norm_arr = np.array(dem_img, dtype=np.float32)
strength = 4.2
dzdx = (np.roll(dem_norm_arr, -1, axis=1) - np.roll(dem_norm_arr, 1, axis=1)) * (strength / 2.0)
dzdy = (np.roll(dem_norm_arr, -1, axis=0) - np.roll(dem_norm_arr, 1, axis=0)) * (strength / 2.0)

nx = -dzdx
ny = -dzdy
nz = np.ones_like(dem_norm_arr) * 115.0

length = np.sqrt(nx**2 + ny**2 + nz**2)
length[length == 0] = 1.0

nx = nx / length
ny = ny / length
nz = nz / length

r = ((nx + 1.0) * 0.5 * 255).astype(np.uint8)
g = ((ny + 1.0) * 0.5 * 255).astype(np.uint8)
b = ((nz + 1.0) * 0.5 * 255).astype(np.uint8)

normal_rgb = np.stack([r, g, b], axis=-1)
normal_img = Image.fromarray(normal_rgb, mode="RGB")
normal_img = normal_img.filter(ImageFilter.UnsharpMask(radius=1.0, percent=110, threshold=2))
out_normal_path = os.path.join(TEX_DIR, "shaanxi_normal.png")
normal_img.save(out_normal_path)
print(f"[OK] High-definition normal map saved: {out_normal_path}")
