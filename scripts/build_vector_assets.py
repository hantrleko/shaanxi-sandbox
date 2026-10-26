#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成全套高精 3D 地理矢量库 (真实经纬度 3D 投影与 DEM 贴合采样)
输出: src/data/shaanxiGeoVectors.js
"""

import json
import math
import os
from PIL import Image
import numpy as np

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "public", "data")
OUT_FILE = os.path.join(BASE_DIR, "src", "data", "shaanxiGeoVectors.js")

dem_img = Image.open(os.path.join(BASE_DIR, "public", "textures", "shaanxi_dem.png")).convert('L')
dem = np.array(dem_img, dtype=np.float32)
dem_h, dem_w = dem.shape

def project(lon, lat, offset_y=0.45):
    u = (lon - 104.0625) / (112.5 - 104.0625)
    lat_rad = math.radians(lat)
    tile_y = (1.0 - math.asinh(math.tan(lat_rad)) / math.pi) / 2.0 * 256.0
    v = (tile_y - 97.0) / (105.0 - 97.0)
    
    x = (u - 0.5) * 80.0
    z = (v - 0.5) * 140.0
    
    px = int(np.clip(u * (dem_w - 1), 0, dem_w - 1))
    py = int(np.clip(v * (dem_h - 1), 0, dem_h - 1))
    # 物理高度映射
    raw_h = (float(dem[py, px]) / 255.0) ** 1.1 * 18.5 + offset_y
    return [float(round(x, 2)), float(round(raw_h, 2)), float(round(z, 2))]

# 1. 读取市级与省级边界
with open(os.path.join(DATA_DIR, "shaanxi_full.json"), 'r', encoding='utf-8') as f:
    geo = json.load(f)

city_boundaries = []
for feat in geo['features']:
    name = feat['properties']['name']
    geom = feat['geometry']
    coords = geom['coordinates']
    if geom['type'] == 'Polygon':
        polys = [coords]
    elif geom['type'] == 'MultiPolygon':
        polys = coords
    else:
        continue
    
    rings = []
    for poly in polys:
        # 降采样步长 4
        pts = [project(pt[0], pt[1], 0.35) for pt in poly[0][::4]]
        if len(pts) > 2:
            rings.append(pts)
    city_boundaries.append({'name': name, 'rings': rings})

# 2. 真实水系经纬度定义
RIVERS_RAW = {
    "yellow_river": [
        (110.85, 39.50), (111.15, 38.80), (110.95, 38.00), (110.75, 37.20),
        (110.45, 36.15), (110.40, 35.55), (110.35, 34.60), (110.25, 34.58) # 潼关交汇
    ],
    "wei_river": [
        (106.65, 34.38), (107.15, 34.36), (107.85, 34.30), (108.35, 34.30),
        (108.70, 34.32), (108.95, 34.42), (109.50, 34.52), (110.25, 34.58) # 汇入黄河
    ],
    "han_river": [
        (106.35, 33.10), (107.02, 33.06), (107.65, 33.15), (108.35, 32.95),
        (109.02, 32.68), (109.65, 32.82), (110.20, 32.75) # 白河出境
    ],
    "jing_river": [
        (107.50, 35.35), (107.95, 35.15), (108.55, 34.75), (108.95, 34.45) # 泾渭分明
    ]
}

rivers_3d = {}
for rname, pts in RIVERS_RAW.items():
    rivers_3d[rname] = [project(lon, lat, 0.4) for lon, lat in pts]

# 3. 真实 POI
POIS_RAW = [
    {"id": "xian", "name": "西安 (古长安)", "lon": 108.9398, "lat": 34.3416, "badge": "十三朝古都 · 丝路起点", "type": "capital"},
    {"id": "huashan", "name": "西岳华山", "lon": 110.0847, "lat": 34.4883, "badge": "奇险天下第一山 (2154m)", "type": "mountain"},
    {"id": "taibai", "name": "太白山拔仙台", "lon": 107.7712, "lat": 33.9582, "badge": "秦岭主峰 (3771m)", "type": "mountain"},
    {"id": "bingmayong", "name": "秦始皇兵马俑", "lon": 109.2786, "lat": 34.3841, "badge": "世界第八大奇迹", "type": "relic"},
    {"id": "hukou", "name": "黄河壶口瀑布", "lon": 110.4503, "lat": 36.1472, "badge": "千里黄河一壶收", "type": "nature"},
    {"id": "yanan", "name": "延安宝塔山", "lon": 109.4897, "lat": 36.5855, "badge": "中国革命圣地", "type": "red"},
    {"id": "yulin", "name": "榆林镇北台", "lon": 109.7346, "lat": 38.3389, "badge": "塞上长城第一台", "type": "city"},
    {"id": "baoji", "name": "宝鸡青铜器博览", "lon": 107.1448, "lat": 34.3619, "badge": "炎帝故里 · 陈仓", "type": "city"},
    {"id": "hanzhong", "name": "汉中拜将坛", "lon": 107.0234, "lat": 33.0678, "badge": "两汉三国发祥地", "type": "city"},
    {"id": "ankang", "name": "安康瀛湖", "lon": 109.0293, "lat": 32.6847, "badge": "秦巴明珠 · 汉江秀水", "type": "city"}
]

pois_3d = []
for p in POIS_RAW:
    pos = project(p['lon'], p['lat'], 0.5)
    pois_3d.append({
        "id": p['id'],
        "name": p['name'],
        "badge": p['badge'],
        "type": p['type'],
        "pos": pos,
        "lon": p['lon'],
        "lat": p['lat']
    })

# 4. 山脉与地貌贴地 3D 大字标签
REGIONS_3D = [
    {"name": "秦 岭 山 脉", "pos": project(108.5, 33.85, 2.0), "sub": "中国南北地理分界线 · 800mm降水线", "size": "large"},
    {"name": "八 百 里 秦 川", "pos": project(108.7, 34.50, 1.2), "sub": "关中平原 · 天府之国最早所指", "size": "large"},
    {"name": "陕 北 黄 土 高 原", "pos": project(109.2, 36.90, 1.5), "sub": "深厚风积黄土 · 塬梁峁地貌", "size": "large"},
    {"name": "大 巴 山 脉", "pos": project(108.6, 32.30, 2.0), "sub": "米仓山·大巴山生态屏障", "size": "medium"},
    {"name": "毛 乌 素 沙 地", "pos": project(109.4, 38.45, 1.2), "sub": "塞北绿化奇迹 · 绿色版图北移", "size": "medium"}
]

# 5. 真实战役路线经纬度投影
CAMPAIGN_ROUTES_3D = {
    "chencang": {
        "feint": [project(107.02, 33.06), project(107.45, 33.65), project(107.75, 34.20)], # 褒斜道佯攻
        "surprise": [project(107.02, 33.06), project(106.70, 33.55), project(106.65, 34.15), project(106.95, 34.25), project(107.15, 34.36)], # 故道出大散关奇袭陈仓
        "conquest": [project(107.15, 34.36), project(108.05, 34.30), project(108.70, 34.32), project(109.20, 34.40)] # 平定关中
    },
    "wuzhangyuan": {
        "march": [project(107.02, 33.06), project(107.60, 33.80), project(107.78, 34.28)], # 出斜谷进驻五丈原
        "weishui": [project(107.65, 34.32), project(107.95, 34.32)], # 隔渭水对峙线
        "retreat": [project(107.78, 34.28), project(107.60, 33.80), project(107.02, 33.06)] # 全师撤回汉中
    },
    "yanan": {
        "evacuate": [project(109.48, 36.58), project(109.65, 36.75)],
        "qinghuabian": [project(109.65, 36.75), project(109.80, 36.65), project(109.85, 36.85)],
        "shajiadian": [project(109.85, 36.85), project(110.15, 37.45)]
    }
}

# 输出到 JS 模块
content = f"""// 真实地理矢量库 (由 GIS 经纬度投影与 DEM 真实高度生成)
export const CITY_BOUNDARIES = {json.dumps(city_boundaries, ensure_ascii=False, indent=2)};

export const REAL_RIVERS = {json.dumps(rivers_3d, ensure_ascii=False, indent=2)};

export const REAL_POIS = {json.dumps(pois_3d, ensure_ascii=False, indent=2)};

export const REAL_REGIONS = {json.dumps(REGIONS_3D, ensure_ascii=False, indent=2)};

export const REAL_CAMPAIGN_ROUTES = {json.dumps(CAMPAIGN_ROUTES_3D, ensure_ascii=False, indent=2)};
"""

with open(OUT_FILE, "w", encoding="utf-8") as f:
    f.write(content)

print(f"[OK] 成功导出真实地理矢量库: {OUT_FILE}")
