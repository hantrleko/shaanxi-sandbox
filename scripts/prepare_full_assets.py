#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
一键生成并准备全部高精三维资产 (GIS 坐标、法线贴图、聚焦掩膜、真实微观盆景)
====================================================================
1. 下载陕西省及10地市官方 GeoJSON (阿里云 DataV)
2. 基于 DEM 高程图生成真实三维法线贴图 (Normal Map)
3. 生成省外暗化聚焦掩膜图 (Spotlight Mask)
4. 下载华山、太白山、壶口瀑布 Zoom 12 真实高精微观盆景切块
"""

import os
import math
import urllib.request
import json
from PIL import Image, ImageDraw, ImageFilter
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "public", "data")
TEX_DIR = os.path.join(BASE_DIR, "public", "textures")
BONSAI_DIR = os.path.join(TEX_DIR, "bonsai")

os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(BONSAI_DIR, exist_ok=True)

# 1. 下载陕西省及10地市 GeoJSON
def step1_fetch_geojson():
    print("\n--- 步骤 1: 获取真实 GeoJSON 数据 ---")
    url = "https://geo.datav.aliyun.com/areas_v3/bound/610000_full.json"
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    target_path = os.path.join(DATA_DIR, "shaanxi_full.json")
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            content = resp.read()
            with open(target_path, "wb") as f:
                f.write(content)
        data = json.loads(content.decode('utf-8'))
        print(f"[OK] 成功保存陕西省地级市 GeoJSON: {len(data['features'])} 个地市")
        return data
    except Exception as e:
        print(f"[ERR] GeoJSON 获取失败: {e}")
        return None

# 2. 从 DEM 计算真实 Normal Map (Sobel 梯度算子)
def step2_generate_normal_map():
    print("\n--- 步骤 2: 生成高精地形法线贴图 (Normal Map) ---")
    dem_path = os.path.join(TEX_DIR, "shaanxi_dem.png")
    if not os.path.exists(dem_path):
        print(f"[ERR] 未找到 {dem_path}")
        return

    dem_img = Image.open(dem_path).convert("L")
    dem = np.array(dem_img, dtype=np.float32)

    # Sobel 卷积核计算 dZ/dX, dZ/dY
    # 强度调节 factor
    strength = 3.5
    dzdx = (np.roll(dem, -1, axis=1) - np.roll(dem, 1, axis=1)) * (strength / 2.0)
    dzdy = (np.roll(dem, -1, axis=0) - np.roll(dem, 1, axis=0)) * (strength / 2.0)

    # 法向量 N = (-dzdx, -dzdy, 1.0) 归一化
    nx = -dzdx
    ny = -dzdy
    nz = np.ones_like(dem) * 128.0

    length = np.sqrt(nx**2 + ny**2 + nz**2)
    length[length == 0] = 1.0

    nx = nx / length
    ny = ny / length
    nz = nz / length

    # 映射到 [0, 255] RGB
    r = ((nx + 1.0) * 0.5 * 255).astype(np.uint8)
    g = ((ny + 1.0) * 0.5 * 255).astype(np.uint8)
    b = ((nz + 1.0) * 0.5 * 255).astype(np.uint8)

    normal_rgb = np.stack([r, g, b], axis=-1)
    normal_img = Image.fromarray(normal_rgb, mode="RGB")
    out_path = os.path.join(TEX_DIR, "shaanxi_normal.png")
    normal_img.save(out_path)
    print(f"[OK] 法线贴图已生成: {out_path} ({normal_img.width}x{normal_img.height})")

# 3. 生成省外暗化聚焦掩膜图 (Spotlight Mask)
def step3_generate_spotlight_mask(geojson_data):
    print("\n--- 步骤 3: 生成省外暗化聚焦底图 (Spotlight Mask) ---")
    sat_path = os.path.join(TEX_DIR, "shaanxi_satellite.jpg")
    if not os.path.exists(sat_path) or not geojson_data:
        return

    sat_img = Image.open(sat_path).convert("RGB")
    w, h = sat_img.size

    # Zoom 8 瓦片范围 (X: 202~207, Y: 97~104)
    # 计算瓦片范围对应的经纬度 Mercator
    def lon_to_x(lon):
        return (lon - 104.0625) / (112.5 - 104.0625) * w

    def lat_to_y(lat):
        # Mercator 反算
        lat_rad = math.radians(lat)
        merc_y = 1.0 - math.asinh(math.tan(lat_rad)) / math.pi
        # Y 97 to 105
        norm_y = (merc_y * 128.0 - 97.0) / (105.0 - 97.0)
        return norm_y * h

    # 创建掩膜 (省内 255 白色，省外 70 灰色)
    mask = Image.new("L", (w, h), 70)
    draw = ImageDraw.Draw(mask)

    for feat in geojson_data['features']:
        geom = feat['geometry']
        gtype = geom['type']
        coords = geom['coordinates']
        if gtype == 'Polygon':
            poly_list = [coords]
        elif gtype == 'MultiPolygon':
            poly_list = coords
        else:
            continue

        for poly in poly_list:
            pts = []
            for ring in poly:
                for pt in ring:
                    px = lon_to_x(pt[0])
                    py = lat_to_y(pt[1])
                    pts.append((px, py))
            if len(pts) >= 3:
                draw.polygon(pts, fill=255)

    # 边缘平滑羽化
    mask = mask.filter(ImageFilter.GaussianBlur(radius=3))

    # 应用掩膜生成聚焦合成卫星底图
    mask_arr = np.array(mask, dtype=np.float32) / 255.0
    sat_arr = np.array(sat_img, dtype=np.float32)

    # 省外不仅变暗，而且降低饱和度
    grey_sat = np.mean(sat_arr, axis=2, keepdims=True)
    focused_arr = sat_arr * mask_arr[:, :, None] + (grey_sat * 0.4) * (1.0 - mask_arr[:, :, None])
    focused_arr = np.clip(focused_arr, 0, 255).astype(np.uint8)

    focused_img = Image.fromarray(focused_arr, mode="RGB")
    out_path = os.path.join(TEX_DIR, "shaanxi_satellite_spotlight.jpg")
    focused_img.save(out_path, quality=92)
    print(f"[OK] 聚焦高对比度底图已生成: {out_path}")

# 4. 下载 3 个真实微观盆景 (Zoom 12 瓦片, 每个 3x3 = 9 瓦片, 768x768)
def deg2num(lat_deg, lon_deg, zoom):
    lat_rad = math.radians(lat_deg)
    n = 2.0 ** zoom
    xtile = int((lon_deg + 180.0) / 360.0 * n)
    ytile = int((1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * n)
    return (xtile, ytile)

def step4_fetch_micro_bonsais():
    print("\n--- 步骤 4: 下载高精微观盆景切块 (Zoom 12) ---")
    BONSAI_TARGETS = [
        {"id": "huashan", "name": "西岳华山", "lat": 34.48, "lon": 110.08, "zoom": 12},
        {"id": "taibai", "name": "秦岭太白山", "lat": 33.96, "lon": 107.77, "zoom": 12},
        {"id": "hukou", "name": "黄河壶口瀑布", "lat": 36.15, "lon": 110.45, "zoom": 12}
    ]

    for b in BONSAI_TARGETS:
        bx, by = deg2num(b['lat'], b['lon'], b['zoom'])
        # 3x3 瓦片
        tile_size = 256
        canvas_sat = Image.new("RGB", (tile_size * 3, tile_size * 3))
        dem_elevs = np.zeros((tile_size * 3, tile_size * 3), dtype=np.float32)

        for dy, y in enumerate(range(by - 1, by + 2)):
            for dx, x in enumerate(range(bx - 1, bx + 2)):
                sat_url = f"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{b['zoom']}/{y}/{x}.jpg"
                dem_url = f"https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{b['zoom']}/{x}/{y}.png"

                # 下载卫星
                try:
                    req = urllib.request.Request(sat_url, headers={'User-Agent': 'Mozilla/5.0'})
                    with urllib.request.urlopen(req, timeout=5) as resp:
                        img = Image.open(resp).convert("RGB")
                        canvas_sat.paste(img, (dx * tile_size, dy * tile_size))
                except Exception as e:
                    print(f"Sat tile {x},{y} 失败: {e}")

                # 下载 DEM
                try:
                    req = urllib.request.Request(dem_url, headers={'User-Agent': 'Mozilla/5.0'})
                    with urllib.request.urlopen(req, timeout=5) as resp:
                        dimg = Image.open(resp).convert("RGB")
                        darr = np.array(dimg, dtype=np.float32)
                        r, g, b_ch = darr[:, :, 0], darr[:, :, 1], darr[:, :, 2]
                        elev = (r * 256.0 + g + b_ch / 256.0) - 32768.0
                        dem_elevs[dy*tile_size:(dy+1)*tile_size, dx*tile_size:(dx+1)*tile_size] = elev
                except Exception as e:
                    print(f"DEM tile {x},{y} 失败: {e}")

        # 保存卫星贴图
        sat_out = os.path.join(BONSAI_DIR, f"{b['id']}_sat.jpg")
        canvas_sat.save(sat_out, quality=90)

        # 归一化并保存 DEM
        min_e = np.min(dem_elevs)
        max_e = np.max(dem_elevs)
        if max_e > min_e:
            norm_dem = (dem_elevs - min_e) / (max_e - min_e)
        else:
            norm_dem = np.zeros_like(dem_elevs)
        dem_out_img = Image.fromarray((norm_dem * 255).astype(np.uint8), mode="L")
        dem_out = os.path.join(BONSAI_DIR, f"{b['id']}_dem.png")
        dem_out_img.save(dem_out)

        # 保存高程元数据
        meta_out = os.path.join(BONSAI_DIR, f"{b['id']}_meta.json")
        with open(meta_out, "w", encoding="utf-8") as f:
            json.dump({
                "minElev": float(min_e),
                "maxElev": float(max_e),
                "elevDiff": float(max_e - min_e),
                "widthKm": 12.0
            }, f, indent=2, ensure_ascii=False)

        print(f"[OK] 微观盆景已就绪: {b['name']} ({min_e:.1f}m ~ {max_e:.1f}m, 高差 {max_e-min_e:.1f}m)")

def main():
    print("=" * 60)
    print("开始构建陕西地理沙盘高精三维资产链...")
    print("=" * 60)
    geojson = step1_fetch_geojson()
    step2_generate_normal_map()
    step3_generate_spotlight_mask(geojson)
    step4_fetch_micro_bonsais()
    print("\n✅ 所有三维资产已全部生成就绪！")

if __name__ == "__main__":
    main()
