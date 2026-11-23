"""Build the static relief, province mask, and lightweight textures from repository assets."""

import json
import math
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / 'public'
TEXTURES = PUBLIC / 'textures'
EXTENT = json.loads((ROOT / 'src/data/terrainExtent.json').read_text(encoding='utf-8'))
RESAMPLER = Image.Resampling.LANCZOS


def raster_position(lon, lat, width, height):
    tiles = 2 ** EXTENT['zoom']
    u = (((lon + 180) / 360) * tiles - EXTENT['firstTileX']) / EXTENT['tileColumns']
    v = ((1 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2 * tiles - EXTENT['firstTileY']) / EXTENT['tileRows']
    return u * (width - 1), v * (height - 1)


def draw_province(width, height):
    boundary = json.loads((PUBLIC / 'data/shaanxi_full.json').read_text(encoding='utf-8'))
    mask = Image.new('L', (width, height))
    draw = ImageDraw.Draw(mask)
    for feature in boundary['features']:
        geom = feature['geometry']
        polygons = [geom['coordinates']] if geom['type'] == 'Polygon' else geom['coordinates']
        for outer, *holes in polygons:
            draw.polygon([raster_position(*p[:2], width, height) for p in outer], fill=255)
            for hole in holes:
                draw.polygon([raster_position(*p[:2], width, height) for p in hole], fill=0)
    return mask


def terrain_colors(heights, satellite, shade_amount=1.0):
    stops = [0, 20, 45, 75, 112, 172, 255]
    colors = np.array([
        [117, 134, 104], [133, 143, 109], [155, 154, 109], [183, 158, 111],
        [153, 145, 112], [186, 182, 152], [230, 223, 200]
    ])
    tint = np.stack([np.interp(heights, stops, colors[:, c]) for c in range(3)], axis=-1)
    photo = np.array(ImageEnhance.Color(satellite).enhance(0.55), dtype=float)
    dy, dx = np.gradient(heights)
    shade = np.clip(0.98 - shade_amount * (dx * 0.033 + dy * 0.036), 0.67, 1.26)
    return np.clip((tint * 0.68 + photo * 0.32) * shade[:, :, None], 0, 255).astype('uint8')


def relief_poster(dem, raw_satellite):
    width, height = 650, 867
    gray = dem.resize((width, height), RESAMPLER)
    mask = np.asarray(draw_province(width, height)) > 127
    heights = np.asarray(gray.filter(ImageFilter.GaussianBlur(0.38)), dtype=float)
    rgb = terrain_colors(heights, raw_satellite.resize((width, height), RESAMPLER))
    tilt = math.radians(-10)
    yy, xx = np.mgrid[0:height, 0:width]
    xx = xx - width / 2
    yy = yy - height / 2
    sx = (xx * math.cos(tilt) - yy * math.sin(tilt)) * 2.02 + 740
    sy = (xx * math.sin(tilt) + yy * math.cos(tilt)) * 1.19 + 625 - heights * 0.29

    canvas = Image.new('RGBA', (1480, 1250))
    draw = ImageDraw.Draw(canvas)
    for row in range(height - 1):
        for column in np.flatnonzero(mask[row, :-1]):
            col = int(column)
            points = [(sx[y, x], sy[y, x]) for y, x in (
                (row, col), (row, col + 1), (row + 1, col + 1), (row + 1, col)
            )]
            edges = []
            if not mask[row + 1, col]:
                edges.append(points[2:4])
            if not mask[row, col + 1]:
                edges.append(points[1:3])
            if col and not mask[row, col - 1]:
                edges.append([points[0], points[3]])
            for i, edge in enumerate(edges):
                wall = (118, 104, 78, 255) if i == 0 else (99, 92, 72, 255)
                draw.polygon([*edge, (edge[1][0], edge[1][1] + 12), (edge[0][0], edge[0][1] + 12)], fill=wall)
            draw.polygon(points, fill=tuple(int(c) for c in rgb[row, col]) + (255,))
    left, top, right, bottom = canvas.getbbox()
    bounds = (left - 14, top - 12, right + 14, bottom + 12)
    poster = canvas.crop(bounds)
    poster.thumbnail((940, 940), RESAMPLER)
    poster.save(TEXTURES / 'shaanxi_relief.webp', quality=87, method=6)

    coordinates = {
        '榆林': (109.7346, 38.3389),
        '延安': (109.4897, 36.5855),
        '西安': (108.9398, 34.3416),
        '汉中': (107.0234, 33.0678)
    }
    points = []
    for name, coordinate in coordinates.items():
        x, y = (round(p) for p in raster_position(*coordinate, width, height))
        points.append({
            'name': name,
            'left': round((sx[y, x] - bounds[0]) / (bounds[2] - bounds[0]) * 100, 2),
            'top': round((sy[y, x] - bounds[1]) / (bounds[3] - bounds[1]) * 100, 2)
        })
    metadata = {'width': poster.width, 'height': poster.height, 'points': points}
    (ROOT / 'src/data/reliefPoster.json').write_text(
        json.dumps(metadata, ensure_ascii=False, indent=2) + '\n', encoding='utf-8'
    )


def main():
    dem = Image.open(TEXTURES / 'shaanxi_dem.png')
    raw_satellite = Image.open(TEXTURES / 'shaanxi_satellite.jpg').convert('RGB')
    draw_province(512, 683).save(TEXTURES / 'shaanxi_mask.png', optimize=True)
    dem.resize((384, 512), Image.Resampling.NEAREST).save(
        TEXTURES / 'shaanxi_dem_preview.png', optimize=True
    )
    for width, height, name, quality in [
        (576, 768, 'shaanxi_satellite_preview.webp', 79),
        (1152, 1536, 'shaanxi_satellite_relief.webp', 85),
    ]:
        elevations = np.asarray(dem.convert('L').resize((width, height), RESAMPLER), dtype=float)
        satellite = raw_satellite.resize((width, height), RESAMPLER)
        Image.fromarray(terrain_colors(elevations, satellite, 0.50)).save(
            TEXTURES / name, quality=quality, method=6
        )
    normal = Image.open(TEXTURES / 'shaanxi_normal.png').convert('RGB').resize((768, 1024), RESAMPLER)
    normal.save(TEXTURES / 'shaanxi_normal_detail.webp', quality=82, method=6)
    relief_poster(dem.convert('L'), raw_satellite)


if __name__ == '__main__':
    main()
