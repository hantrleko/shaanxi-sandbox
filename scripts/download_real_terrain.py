#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
下载并拼接真实陕西遥感卫星影像与 AWS Terrarium DEM 高程瓦片
Zoom Level 8: 6 列 x 8 行 = 48 瓦片
拼接输出:
- public/textures/shaanxi_satellite.jpg (真实高分辨率卫星航拍底图)
- public/textures/shaanxi_dem.png (150 至 3800 米线性编码，透明像素为无数据)
"""

import os
import json
import urllib.request
from pathlib import Path
from PIL import Image
import numpy as np

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "textures")
os.makedirs(OUTPUT_DIR, exist_ok=True)

EXTENT = json.loads((Path(__file__).resolve().parents[1] / 'src/data/terrainExtent.json').read_text(encoding="utf-8"))
Z = EXTENT["zoom"]
X_START = EXTENT["firstTileX"]
Y_START = EXTENT["firstTileY"]
X_END = X_START + EXTENT["tileColumns"] - 1
Y_END = Y_START + EXTENT["tileRows"] - 1
TILE_SIZE = 256

WIDTH = (X_END - X_START + 1) * TILE_SIZE   # 1536
HEIGHT = (Y_END - Y_START + 1) * TILE_SIZE  # 2048

def fetch_image(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req, timeout=10) as resp:
        return Image.open(resp).convert("RGB")

def main():
    print(f"开始拼接陕西真实卫星影像与 DEM 瓦片 (分辨率: {WIDTH}x{HEIGHT})...")
    
    sat_canvas = Image.new("RGB", (WIDTH, HEIGHT))
    elevations = np.zeros((HEIGHT, WIDTH), dtype=np.float32)
    coverage = np.zeros((HEIGHT, WIDTH), dtype=np.uint8)

    total_tiles = (X_END - X_START + 1) * (Y_END - Y_START + 1)
    idx = 0

    for yi, y in enumerate(range(Y_START, Y_END + 1)):
        for xi, x in enumerate(range(X_START, X_END + 1)):
            idx += 1
            sat_url = f"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{Z}/{y}/{x}.jpg"
            dem_url = f"https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{Z}/{x}/{y}.png"
            
            # 1. 卫星贴图
            try:
                sat_tile = fetch_image(sat_url)
                sat_canvas.paste(sat_tile, (xi * TILE_SIZE, yi * TILE_SIZE))
            except Exception as e:
                print(f"Sat tile {x},{y} 失败: {e}")

            # 2. DEM 瓦片 (Terrarium 格式: elevation = (R * 256 + G + B / 256) - 32768)
            try:
                dem_tile = fetch_image(dem_url)
                dem_arr = np.array(dem_tile, dtype=np.float32)
                r, g, b = dem_arr[:, :, 0], dem_arr[:, :, 1], dem_arr[:, :, 2]
                tile_elev = (r * 256.0 + g + b / 256.0) - 32768.0
                tile = np.s_[yi*TILE_SIZE:(yi+1)*TILE_SIZE, xi*TILE_SIZE:(xi+1)*TILE_SIZE]
                elevations[tile] = tile_elev
                coverage[tile] = 255
            except Exception as e:
                print(f"DEM tile {x},{y} 失败: {e}")

            if idx % 10 == 0 or idx == total_tiles:
                print(f"进度: {idx}/{total_tiles} 瓦片...")

    # 保存卫星影像
    sat_output = os.path.join(OUTPUT_DIR, "shaanxi_satellite.jpg")
    sat_canvas.save(sat_output, quality=90)
    print(f"[OK] 真实卫星影像已保存: {sat_output}")

    # 归一化真实高程为 8-bit 灰度图供 WebGL Displacement/Canvas 使用
    # 陕西最低海拔约 150m (汉江安康白河出境处)，最高拔仙台 3771m
    min_elev = EXTENT["minElevation"]
    max_elev = EXTENT["maxElevation"]
    norm_elev = np.clip((elevations - min_elev) / (max_elev - min_elev), 0.0, 1.0)
    dem_img = Image.fromarray((norm_elev * 255).astype(np.uint8), mode="L")
    if np.any(coverage == 0):
        dem_img.putalpha(Image.fromarray(coverage, mode="L"))
    dem_output = os.path.join(OUTPUT_DIR, "shaanxi_dem.png")
    dem_img.save(dem_output)
    print(f"[OK] 真实 DEM 高程图已保存: {dem_output}")

if __name__ == "__main__":
    main()
