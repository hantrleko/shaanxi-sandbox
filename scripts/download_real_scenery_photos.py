# scripts/download_real_scenery_photos.py
import os
import json
import urllib.request
import urllib.parse
from PIL import Image, ImageEnhance

os.makedirs('public/images/scenery', exist_ok=True)
os.makedirs('public/images/chapters', exist_ok=True)

HEADERS = {'User-Agent': 'ShaanxiSandboxBot/2.0 (contact: admin@eugenefinance.com)'}

SCENERY_TARGETS = [
    {
        "id": "hua_shan",
        "search": "Hua Shan",
        "title": "西岳华山",
        "sub": "奇险天下第一山 · 南峰绝壁与云海苍茫",
        "region": "关中",
        "camera": {"pos": [28.5, 22, 28], "target": [28.5, 12, 16.8]}
    },
    {
        "id": "taibai_shan",
        "search": "Mountain Taibai No.1.jpg",
        "fallback_search": "Taibai Mountain",
        "title": "秦岭太白山拔仙台",
        "sub": "华夏之父 · 3771.2m 中国南北气候分水岭",
        "region": "秦岭",
        "camera": {"pos": [-4.84, 38, 48], "target": [-4.84, 14, 22.75]}
    },
    {
        "id": "bingmayong",
        "search": "51714-Terracota-Army.jpg",
        "fallback_search": "Terracotta Army",
        "title": "秦始皇兵马俑一号坑",
        "sub": "世界第八大奇迹 · 千古大秦虎狼之师军阵",
        "region": "关中",
        "camera": {"pos": [6.8, 14, 22], "target": [6.8, 2.8, 14.8]}
    },
    {
        "id": "dayanta",
        "search": "Giant Wild Goose-Pagoda.jpg",
        "fallback_search": "Giant Wild Goose Pagoda",
        "title": "大慈恩寺大雁塔",
        "sub": "盛唐古都中轴 · 玄奘西行取经译经圣地",
        "region": "关中",
        "camera": {"pos": [2.5, 12, 22], "target": [2.5, 2.2, 16.5]}
    },
    {
        "id": "zhonglou",
        "search": "Xi'an Bell Tower 2024.10.jpg",
        "fallback_search": "Bell Tower of Xi'an",
        "title": "西安古城钟楼",
        "sub": "八百里秦川核心 · 中国现存规模最大的古代钟楼",
        "region": "关中",
        "camera": {"pos": [2.5, 10, 20], "target": [2.5, 2.2, 16.5]}
    },
    {
        "id": "hukou_waterfall",
        "search": "Hukou Waterfall.jpg",
        "fallback_search": "Hukou Waterfall",
        "title": "黄河壶口瀑布",
        "sub": "千里黄河一壶收 · 晋陕大峡谷咆哮金瀑",
        "region": "陕北",
        "camera": {"pos": [28.5, 18, 5], "target": [24.5, 2.8, -4.2]}
    },
    {
        "id": "qiankun_wan",
        "search": "黄河乾坤湾 1.jpg",
        "fallback_search": "Qiankun Bay",
        "title": "延川黄河乾坤湾",
        "sub": "天下黄河第一湾 · S形太极天然蛇曲大峡谷",
        "region": "陕北",
        "camera": {"pos": [24.5, 16, -8], "target": [20.5, 3.6, -15.2]}
    },
    {
        "id": "baota_shan",
        "search": "宝塔山",
        "fallback_search": "Yan'an Shaanxi",
        "title": "延安宝塔山",
        "sub": "巍巍宝塔山，滚滚延河水 · 革命圣地坐标",
        "region": "陕北",
        "camera": {"pos": [8.71, 24, -8], "target": [7.2, 5.2, -18.5]}
    },
    {
        "id": "huangdi_ling",
        "search": "Mausoleum of the Yellow Emperor",
        "fallback_search": "Huangdi Mausoleum",
        "title": "桥山黄帝陵",
        "sub": "中华第一陵 · 五千年华夏人文初祖衣冠古柏",
        "region": "陕北",
        "camera": {"pos": [5.8, 16, 6], "target": [3.8, 5.2, -3.2]}
    },
    {
        "id": "xian_city_wall",
        "search": "Xi'an City Wall",
        "fallback_search": "Fortifications of Xi'an",
        "title": "西安明城墙",
        "sub": "金城千里 · 全球现存规模最完整古代城垣",
        "region": "关中",
        "camera": {"pos": [2.5, 14, 22], "target": [2.5, 2.2, 16.5]}
    },
    {
        "id": "hanzhong_flower",
        "search": "Hanzhong",
        "fallback_search": "Rapeseed flowers China",
        "title": "汉中天汉油菜花海",
        "sub": "两汉三国发祥地 · 百万亩金色盆地江南风光",
        "region": "陕南",
        "camera": {"pos": [-10, 16, 42], "target": [-14.5, 3.2, 33.2]}
    },
    {
        "id": "hanjiang_water",
        "search": "Ankang",
        "fallback_search": "Han River China",
        "title": "陕南汉江瀛湖碧波",
        "sub": "南水北调中线水塔 · 一江清水送北方",
        "region": "陕南",
        "camera": {"pos": [4.0, 18, 48], "target": [2.0, 2.0, 38.0]}
    },
    {
        "id": "famen_temple",
        "search": "Famen Temple",
        "fallback_search": "Famen Temple Shaanxi",
        "title": "宝鸡扶风法门寺",
        "sub": "关中塔庙之祖 · 盛唐皇家供奉佛指舍利圣境",
        "region": "关中",
        "camera": {"pos": [-8.5, 14, 20], "target": [-11.5, 3.2, 14.2]}
    },
    {
        "id": "huaqing_pool",
        "search": "Huaqing Pool",
        "fallback_search": "Huaqing Palace",
        "title": "临潼华清宫骊山温泉",
        "sub": "温泉水滑洗凝脂 · 千年唐宫离宫皇家汤池",
        "region": "关中",
        "camera": {"pos": [8.5, 12, 20], "target": [6.8, 2.8, 14.8]}
    },
    {
        "id": "zhenbeitai",
        "search": "Zhenbeitai",
        "fallback_search": "Yulin Great Wall Shaanxi",
        "title": "榆林镇北台",
        "sub": "万里长城第一台 · 塞上明珠毛乌素南缘要塞",
        "region": "陕北",
        "camera": {"pos": [14.0, 20, -26], "target": [11.2, 6.2, -34.5]}
    },
    {
        "id": "guanzhong_plain",
        "search": "Weinan",
        "fallback_search": "Shaanxi agriculture",
        "title": "八百里秦川麦浪沃野",
        "sub": "金城千里天府之国 · 周秦汉唐十四朝立国之根",
        "region": "关中",
        "camera": {"pos": [4.0, 22, 24], "target": [3.97, 2.0, 16.0]}
    }
]

def fetch_image_url(query):
    q = urllib.parse.quote(query)
    api_url = f"https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch={q}&gsrnamespace=6&prop=imageinfo&iiprop=url|size&iiurlwidth=1200&format=json&gsrlimit=3"
    req = urllib.request.Request(api_url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=12) as r:
        data = json.loads(r.read())
        pages = data.get('query', {}).get('pages', {})
        for pid, p in pages.items():
            info = p.get('imageinfo', [{}])[0]
            title = p.get('title', '')
            thumb = info.get('thumburl') or info.get('url')
            if thumb and title.lower().endswith(('.jpg', '.jpeg', '.png')):
                return thumb
    return None

def download_and_process(img_url, out_path, target_size=(960, 600)):
    req = urllib.request.Request(img_url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=15) as r:
        raw_data = r.read()
    
    temp_path = out_path + '.tmp'
    with open(temp_path, 'wb') as f:
        f.write(raw_data)
    
    im = Image.open(temp_path).convert('RGB')
    
    # 智能居中裁剪到指定比例
    w, h = im.size
    target_ratio = target_size[0] / target_size[1]
    current_ratio = w / h
    
    if current_ratio > target_ratio:
        # 太宽，截左右
        new_w = int(h * target_ratio)
        left = (w - new_w) // 2
        im = im.crop((left, 0, left + new_w, h))
    else:
        # 太高，截上下
        new_h = int(w / target_ratio)
        top = (h - new_h) // 2
        im = im.crop((0, top, w, top + new_h))
    
    im = im.resize(target_size, Image.Resampling.LANCZOS)
    
    # 微调对比度与色彩饱和度，呈现国风大片质感
    enhancer = ImageEnhance.Color(im)
    im = enhancer.enhance(1.08)
    enh_c = ImageEnhance.Contrast(im)
    im = enh_c.enhance(1.05)
    
    im.save(out_path, format='JPEG', quality=88, optimize=True)
    if os.path.exists(temp_path):
        os.remove(temp_path)
    print(f"✓ Saved: {out_path} ({target_size[0]}x{target_size[1]})")

# 主循环执行下载
manifest = []
for item in SCENERY_TARGETS:
    target_id = item['id']
    out_file = f"public/images/scenery/{target_id}.jpg"
    print(f"\nProcessing {item['title']} ({target_id})...")
    
    url = None
    try:
        url = fetch_image_url(item['search'])
    except Exception as e:
        print(f"Primary search failed: {e}")
        
    if not url and 'fallback_search' in item:
        try:
            print(f"Trying fallback: {item['fallback_search']}")
            url = fetch_image_url(item['fallback_search'])
        except Exception as e:
            print(f"Fallback search failed: {e}")
            
    if url:
        try:
            download_and_process(url, out_file)
            manifest.append({
                "id": target_id,
                "title": item["title"],
                "sub": item["sub"],
                "region": item["region"],
                "camera": item["camera"],
                "url": f"./images/scenery/{target_id}.jpg"
            })
        except Exception as e:
            print(f"Download/process error for {target_id}: {e}")
    else:
        print(f"No image found for {target_id}")

# 同步更新 chapters 封面实景照片
chapter_mapping = {
    "geo_01_shaanxi.jpg": "hua_shan.jpg",
    "geo_02_qinling.jpg": "taibai_shan.jpg",
    "geo_03_guanzhong.jpg": "guanzhong_plain.jpg",
    "geo_04_loess.jpg": "qiankun_wan.jpg",
    "geo_05_hanjiang.jpg": "hanjiang_water.jpg",
    "geo_06_rivers.jpg": "hukou_waterfall.jpg",
    "his_01_huangdi.jpg": "huangdi_ling.jpg",
    "his_02_zhouyuan.jpg": "xian_city_wall.jpg",
    "his_03_bingmayong.jpg": "bingmayong.jpg",
    "his_04_changan.jpg": "dayanta.jpg",
    "silk_01_zhangqian.jpg": "zhonglou.jpg",
    "silk_02_xishi.jpg": "famen_temple.jpg"
}

for ch_name, sc_name in chapter_mapping.items():
    sc_path = f"public/images/scenery/{sc_name}"
    ch_path = f"public/images/chapters/{ch_name}"
    if os.path.exists(sc_path):
        with open(sc_path, 'rb') as sf:
            with open(ch_path, 'wb') as df:
                df.write(sf.read())
        print(f"Updated chapter photo: {ch_name} <- {sc_name}")

print(f"\nCompleted! Total downloaded real scenery photos: {len(manifest)}")
