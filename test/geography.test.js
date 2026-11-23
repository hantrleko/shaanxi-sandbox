import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { REAL_POIS } from '../src/data/shaanxiGeoVectors.js';
import { QINLING_TRANSECT } from '../src/data/qinlingGuide.js';
import {
  decodeElevation, findShaanxiCity, horizontalDistanceKm, makeDemRaster, makeElevationProfile,
  projectLonLat, sampleElevation, terrainDisplayHeight, unprojectWorld
} from '../src/utils/geography.js';

const administrativeData = JSON.parse(readFileSync(new URL('../public/data/shaanxi_full.json', import.meta.url)));
const simpleRaster = { width: 2, height: 2, gray: Uint8Array.from([0, 64, 128, 255]), valid: null };

test('all stored landmarks agree with the tile mosaic and shared inverse projection', () => {
  for (const { id, lon, lat, pos } of REAL_POIS) {
    const { x, z } = projectLonLat(lon, lat);
    const projected = unprojectWorld(x, z);
    const stored = unprojectWorld(pos[0], pos[2]);
    assert.ok(horizontalDistanceKm({ lon, lat }, projected) < 1e-7, id);
    assert.ok(Math.abs(lon - stored.lon) < 0.001 && Math.abs(lat - stored.lat) < 0.001, id);
  }
});

test('the cursor uses city boundaries and recognises sites outside the province', () => {
  for (const [id, city] of [['xian', '西安市'], ['yanan', '延安市'], ['hanzhong', '汉中市']]) {
    const { lon, lat } = REAL_POIS.find(item => item.id === id);
    assert.equal(findShaanxiCity(lon, lat, administrativeData.features), city);
  }
  assert.equal(findShaanxiCity(105, 34, administrativeData.features), null);
});

test('the sampler decodes geographic elevation linearly, independent of scene height', () => {
  assert.equal(sampleElevation(simpleRaster, -40, -70), 150);
  assert.equal(sampleElevation(simpleRaster, 40, 70), 3800);
  assert.equal(sampleElevation(simpleRaster, 0, 0), decodeElevation((0 + 64 + 128 + 255) / 4));
  assert.equal(sampleElevation(simpleRaster, 41, 0), null);
  assert.ok(terrainDisplayHeight(3800) < 10);
});

test('missing DEM texels are not turned into invented elevations', () => {
  const raster = makeDemRaster({
    width: 2,
    height: 2,
    data: Uint8ClampedArray.from([0, 0, 0, 255, 64, 64, 64, 0, 128, 128, 128, 255, 255, 255, 255, 255])
  });
  const result = makeElevationProfile(raster, { x: -40, z: -70 }, { x: 40, z: 70 });
  assert.equal(result.points[1].elevationM, null);
  assert.equal(sampleElevation(null, 0, 0), null);
  assert.equal(makeElevationProfile(null, ...QINLING_TRANSECT), null);
});

test('the Xi’an–Hanzhong transect uses cumulative horizontal geographic distance', () => {
  const [a, b] = QINLING_TRANSECT;
  const profile = makeElevationProfile(simpleRaster, { ...a, y: 900 }, { ...b, y: -600 });
  assert.ok(profile.totalDistanceKm > 226 && profile.totalDistanceKm < 228);
  assert.equal(profile.points[0].distKm, 0);
  assert.equal(profile.points.at(-1).distKm, profile.totalDistanceKm);
  assert.deepEqual(profile, makeElevationProfile(simpleRaster, a, b));
  assert.equal(makeElevationProfile(simpleRaster, a, a), null);
});
