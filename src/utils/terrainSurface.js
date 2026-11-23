import * as THREE from 'three';
import { ELEVATION_STOPS, SLOPE_STOPS } from '../data/mapThemes.js';
import { approximateSlope, sampleElevation, terrainDisplayHeight, TERRAIN_EXTENT } from './geography.js';

const { width, depth } = TERRAIN_EXTENT;
const lowestY = -1.3;
const elevations = ELEVATION_STOPS.map(value => new THREE.Color(value));
const slopes = SLOPE_STOPS.map(value => new THREE.Color(value));

export function createTerrainSurface({ map, mask, uniforms }) {
  const material = new THREE.MeshStandardMaterial({
    color: map ? 0xffffff : 0xb8ac86,
    map: map || null,
    roughness: 1,
    metalness: 0,
    normalScale: new THREE.Vector2(0.21, 0.21)
  });
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms, {
      provinceMask: { value: mask },
      hasProvinceMask: { value: mask ? 1 : 0 },
      elevationStops: { value: elevations },
      slopeStops: { value: slopes }
    });
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        attribute float mapHeight;
        attribute float mapSlope;
        varying float vMapHeight;
        varying float vMapSlope;
        varying vec2 vMapUV;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vMapHeight = mapHeight;
        vMapSlope = mapSlope;
        vMapUV = uv;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform sampler2D provinceMask;
        uniform int hasProvinceMask;
        uniform float mapStyle;
        uniform float seasons;
        uniform float historyMix;
        uniform float provinceView;
        uniform vec3 elevationStops[5];
        uniform vec3 slopeStops[4];
        varying float vMapHeight;
        varying float vMapSlope;
        varying vec2 vMapUV;`)
      .replace('#include <map_fragment>', `#include <map_fragment>
        float h = vMapHeight;
        vec3 terrainColor = diffuseColor.rgb;
        float luminance = dot(terrainColor, vec3(0.2126, 0.7152, 0.0722));
        terrainColor = mix(terrainColor, vec3(luminance), 0.13 + historyMix * 0.5);
        if (seasons > 0.5 && seasons < 1.5) {
          terrainColor = mix(terrainColor, vec3(0.23, 0.34, 0.14), 0.23);
        } else if (seasons > 1.5 && seasons < 2.5) {
          terrainColor = mix(terrainColor, vec3(0.10, 0.26, 0.12), 0.28);
        } else if (seasons > 2.5 && seasons < 3.5) {
          terrainColor = mix(terrainColor, vec3(0.5, 0.25, 0.09), 0.32);
        } else if (seasons > 3.5) {
          float snow = smoothstep(1100.0, 2450.0, h) * 0.74;
          terrainColor = mix(terrainColor, vec3(0.79, 0.86, 0.88), snow);
        }
        if (mapStyle > 0.5 && mapStyle < 1.5) {
          terrainColor = mix(elevationStops[0], elevationStops[1], clamp((h - 150.0) / 550.0, 0.0, 1.0));
          terrainColor = mix(terrainColor, elevationStops[2], clamp((h - 700.0) / 900.0, 0.0, 1.0));
          terrainColor = mix(terrainColor, elevationStops[3], clamp((h - 1600.0) / 1000.0, 0.0, 1.0));
          terrainColor = mix(terrainColor, elevationStops[4], clamp((h - 2600.0) / 1200.0, 0.0, 1.0));
          if (h < 0.0) terrainColor = vec3(0.18);
        } else if (mapStyle > 1.5 && mapStyle < 2.5) {
          float s = vMapSlope;
          terrainColor = mix(slopeStops[0], slopeStops[1], clamp(s / 10.0, 0.0, 1.0));
          terrainColor = mix(terrainColor, slopeStops[2], clamp((s - 10.0) / 10.0, 0.0, 1.0));
          terrainColor = mix(terrainColor, slopeStops[3], clamp((s - 20.0) / 15.0, 0.0, 1.0));
          if (s < 0.0) terrainColor = vec3(0.18);
        } else if (mapStyle > 2.5) {
          terrainColor = mix(vec3(0.65, 0.57, 0.39), vec3(0.025, 0.18, 0.125), smoothstep(320.0, 3200.0, h));
        }
        if (hasProvinceMask == 1) {
          float province = texture2D(provinceMask, vMapUV).r;
          if (provinceView > 0.5 && province < 0.49) discard;
          vec3 surroundings = mix(terrainColor * 0.46, vec3(0.030, 0.065, 0.064), 0.54);
          terrainColor = mix(surroundings, terrainColor, smoothstep(0.08, 0.84, province));
        }
        diffuseColor.rgb = terrainColor;`);
  };

  const mesh = new THREE.Mesh(new THREE.BufferGeometry(), material);
  const skirt = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshStandardMaterial({
    color: 0x283e3b, side: THREE.DoubleSide, roughness: 1
  }));
  const base = new THREE.Mesh(new THREE.BoxGeometry(width + 0.6, 0.55, depth + 0.6),
    new THREE.MeshStandardMaterial({ color: 0x263b3b, roughness: 1 }));
  base.position.y = lowestY - 0.275;
  return { mesh, skirt, base, mask, widthSegments: 0, depthSegments: 0 };
}

export function updateTerrainSurface(surface, dem, widthSegments, depthSegments) {
  const geometry = new THREE.PlaneGeometry(width, depth, widthSegments, depthSegments);
  geometry.rotateX(-Math.PI / 2);
  const vertices = geometry.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    const elevation = sampleElevation(dem, vertices.getX(i), vertices.getZ(i));
    vertices.setY(i, terrainDisplayHeight(elevation));
  }
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  surface.mesh.geometry.dispose();
  surface.mesh.geometry = geometry;
  surface.widthSegments = widthSegments;
  surface.depthSegments = depthSegments;
  updateTerrainAnalysis(surface, dem);

  const perimeter = [];
  const lastRow = depthSegments * (widthSegments + 1);
  for (let i = 0; i < widthSegments; i++) perimeter.push(i);
  for (let i = 0; i < depthSegments; i++) perimeter.push(i * (widthSegments + 1) + widthSegments);
  for (let i = widthSegments; i > 0; i--) perimeter.push(lastRow + i);
  for (let i = depthSegments; i > 0; i--) perimeter.push(i * (widthSegments + 1));
  const wall = [];
  for (let i = 0; i < perimeter.length; i++) {
    const a = perimeter[i];
    const b = perimeter[(i + 1) % perimeter.length];
    const ax = vertices.getX(a), ay = vertices.getY(a), az = vertices.getZ(a);
    const bx = vertices.getX(b), by = vertices.getY(b), bz = vertices.getZ(b);
    wall.push(ax, ay, az, ax, lowestY, az, bx, by, bz, bx, by, bz, ax, lowestY, az, bx, lowestY, bz);
  }
  const skirtGeometry = new THREE.BufferGeometry();
  skirtGeometry.setAttribute('position', new THREE.Float32BufferAttribute(wall, 3));
  skirtGeometry.computeVertexNormals();
  surface.skirt.geometry.dispose();
  surface.skirt.geometry = skirtGeometry;
}

export function updateTerrainAnalysis(surface, dem) {
  const geometry = surface.mesh.geometry;
  const vertices = geometry.attributes.position;
  const heightAttribute = geometry.getAttribute('mapHeight') ?? new THREE.Float32BufferAttribute(vertices.count, 1);
  const slopeAttribute = geometry.getAttribute('mapSlope') ?? new THREE.Float32BufferAttribute(vertices.count, 1);
  for (let i = 0; i < vertices.count; i++) {
    const x = vertices.getX(i);
    const z = vertices.getZ(i);
    const elevation = sampleElevation(dem, x, z);
    heightAttribute.setX(i, elevation ?? -1);
    slopeAttribute.setX(i, elevation === null ? -1 : (approximateSlope(dem, x, z) ?? -1));
  }
  heightAttribute.needsUpdate = true;
  slopeAttribute.needsUpdate = true;
  geometry.setAttribute('mapHeight', heightAttribute);
  geometry.setAttribute('mapSlope', slopeAttribute);
}

export function surfaceHeightAt(surface, x, z) {
  if (!surface) return 0;
  const { widthSegments, depthSegments } = surface;
  const px = THREE.MathUtils.clamp((x / width + 0.5) * widthSegments, 0, widthSegments);
  const pz = THREE.MathUtils.clamp((z / depth + 0.5) * depthSegments, 0, depthSegments);
  const col = Math.min(widthSegments - 1, Math.floor(px));
  const row = Math.min(depthSegments - 1, Math.floor(pz));
  const tx = px - col, tz = pz - row;
  const vertices = surface.mesh.geometry.attributes.position;
  const topLeft = row * (widthSegments + 1) + col;
  const bottomLeft = topLeft + widthSegments + 1;
  const b = vertices.getY(bottomLeft);
  const d = vertices.getY(topLeft + 1);
  if (tx + tz <= 1) return vertices.getY(topLeft) * (1 - tx - tz) + b * tz + d * tx;
  return vertices.getY(bottomLeft + 1) * (tx + tz - 1) + b * (1 - tx) + d * (1 - tz);
}
