import extent from '../data/terrainExtent.json' with { type: 'json' };

// The DEM PNG and all vector coordinates use this Web Mercator tile mosaic.
export const TERRAIN_EXTENT = Object.freeze(extent);

const tileCount = 2 ** TERRAIN_EXTENT.zoom;
const rad = Math.PI / 180;
const earthRadiusKm = 6371.0088;
const mercatorCircumference = 40075016.6856;
const elevationRange = TERRAIN_EXTENT.maxElevation - TERRAIN_EXTENT.minElevation;

export function projectLonLat(lon, lat) {
  const tileX = (lon + 180) / 360 * tileCount;
  const tileY = (1 - Math.asinh(Math.tan(lat * rad)) / Math.PI) / 2 * tileCount;
  return {
    x: ((tileX - TERRAIN_EXTENT.firstTileX) / TERRAIN_EXTENT.tileColumns - 0.5) * TERRAIN_EXTENT.width,
    z: ((tileY - TERRAIN_EXTENT.firstTileY) / TERRAIN_EXTENT.tileRows - 0.5) * TERRAIN_EXTENT.depth
  };
}

export function unprojectWorld(x, z) {
  const tileX = (x / TERRAIN_EXTENT.width + 0.5) * TERRAIN_EXTENT.tileColumns + TERRAIN_EXTENT.firstTileX;
  const tileY = (z / TERRAIN_EXTENT.depth + 0.5) * TERRAIN_EXTENT.tileRows + TERRAIN_EXTENT.firstTileY;
  return {
    lon: tileX / tileCount * 360 - 180,
    lat: Math.atan(Math.sinh(Math.PI * (1 - 2 * tileY / tileCount))) / rad
  };
}

export function horizontalDistanceKm(a, b) {
  const h = Math.sin((b.lat - a.lat) * rad / 2) ** 2
    + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin((b.lon - a.lon) * rad / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(Math.min(1, h)));
}

export function makeDemRaster({ data, width, height }) {
  const gray = new Uint8Array(width * height);
  let valid = null;
  for (let i = 0; i < gray.length; i++) {
    gray[i] = data[i * 4];
    if (data[i * 4 + 3] === 0) {
      if (!valid) valid = new Uint8Array(gray.length).fill(1);
      valid[i] = 0;
    }
  }
  return { width, height, gray, valid };
}

export function decodeElevation(gray) {
  return TERRAIN_EXTENT.minElevation + gray / 255 * elevationRange;
}

export function sampleElevation(dem, x, z) {
  const u = x / TERRAIN_EXTENT.width + 0.5;
  const v = z / TERRAIN_EXTENT.depth + 0.5;
  if (!dem || !(u >= 0 && u <= 1 && v >= 0 && v <= 1)) return null;

  const px = u * (dem.width - 1);
  const py = v * (dem.height - 1);
  const x0 = Math.floor(px);
  const y0 = Math.floor(py);
  const x1 = Math.min(x0 + 1, dem.width - 1);
  const y1 = Math.min(y0 + 1, dem.height - 1);
  const tx = px - x0;
  const ty = py - y0;
  const index00 = y0 * dem.width + x0;
  const index10 = y0 * dem.width + x1;
  const index01 = y1 * dem.width + x0;
  const index11 = y1 * dem.width + x1;
  if (dem.valid && (!dem.valid[index00] || !dem.valid[index10] || !dem.valid[index01] || !dem.valid[index11])) {
    return null;
  }
  const north = dem.gray[index00] * (1 - tx) + dem.gray[index10] * tx;
  const south = dem.gray[index01] * (1 - tx) + dem.gray[index11] * tx;
  return decodeElevation(north * (1 - ty) + south * ty);
}

export function terrainDisplayHeight(elevation) {
  return elevation === null ? 0 : (elevation - TERRAIN_EXTENT.minElevation) / elevationRange * 7.2;
}

export function approximateSlope(dem, x, z) {
  const dx = TERRAIN_EXTENT.width / (dem.width - 1);
  const dz = TERRAIN_EXTENT.depth / (dem.height - 1);
  const west = sampleElevation(dem, x - dx, z);
  const east = sampleElevation(dem, x + dx, z);
  const north = sampleElevation(dem, x, z - dz);
  const south = sampleElevation(dem, x, z + dz);
  if ([west, east, north, south].some(value => value === null)) return null;
  const { lat } = unprojectWorld(x, z);
  const metersPerTile = Math.cos(lat * rad) * mercatorCircumference / tileCount;
  const dEast = (east - west) / (2 * metersPerTile * TERRAIN_EXTENT.tileColumns / (dem.width - 1));
  const dSouth = (south - north) / (2 * metersPerTile * TERRAIN_EXTENT.tileRows / (dem.height - 1));
  return Math.atan(Math.hypot(dEast, dSouth)) / rad;
}

export function makeElevationProfile(dem, start, end) {
  if (!dem || horizontalDistanceKm(unprojectWorld(start.x, start.z), unprojectWorld(end.x, end.z)) < 0.05) return null;
  const count = Math.ceil(Math.max(
    2,
    Math.abs(end.x - start.x) / TERRAIN_EXTENT.width * dem.width,
    Math.abs(end.z - start.z) / TERRAIN_EXTENT.depth * dem.height
  ));
  const points = [];
  let totalDistanceKm = 0;
  let minElevation = Infinity;
  let maxElevation = -Infinity;
  let previousCoordinates = null;

  for (let step = 0; step <= count; step++) {
    const fraction = step / count;
    const x = start.x + (end.x - start.x) * fraction;
    const z = start.z + (end.z - start.z) * fraction;
    const coordinates = unprojectWorld(x, z);
    if (previousCoordinates) totalDistanceKm += horizontalDistanceKm(previousCoordinates, coordinates);
    previousCoordinates = coordinates;
    const elevationM = sampleElevation(dem, x, z);
    if (elevationM !== null) {
      minElevation = Math.min(minElevation, elevationM);
      maxElevation = Math.max(maxElevation, elevationM);
    }
    points.push({ x, z, elevationM, distKm: totalDistanceKm });
  }
  return {
    points,
    totalDistanceKm,
    minElevation: Number.isFinite(minElevation) ? minElevation : null,
    maxElevation: Number.isFinite(maxElevation) ? maxElevation : null
  };
}

function inRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [aX, aY] = ring[i];
    const [bX, bY] = ring[j];
    if ((aY > lat) !== (bY > lat) && lon < (bX - aX) * (lat - aY) / (bY - aY) + aX) inside = !inside;
  }
  return inside;
}

export function findShaanxiCity(lon, lat, features = []) {
  for (const { geometry, properties } of features) {
    if (!geometry) continue;
    const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
    if (polygons?.some(([outer, ...holes]) => inRing(lon, lat, outer)
      && !holes.some(hole => inRing(lon, lat, hole)))) {
      return properties.name;
    }
  }
  return null;
}
