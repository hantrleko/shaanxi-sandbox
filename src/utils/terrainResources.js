import { SRGBColorSpace, TextureLoader } from 'three';
import { makeDemRaster } from './geography.js';

const base = import.meta.env.BASE_URL + 'textures/';
const textureLoader = new TextureLoader();

export function loadTerrainTexture(name, color = false) {
  return textureLoader.loadAsync(base + name).then(texture => {
    if (color) texture.colorSpace = SRGBColorSpace;
    return texture;
  });
}

export async function loadTerrainDem(name) {
  const image = new Image();
  image.src = base + name;
  await image.decode();
  const canvas = document.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(image, 0, 0);
  return makeDemRaster(context.getImageData(0, 0, canvas.width, canvas.height));
}

export function clearSceneGroup(group) {
  if (!group) return;
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  group.traverse(node => {
    if (node.geometry) geometries.add(node.geometry);
    if (node.material) {
      for (const material of [].concat(node.material)) {
        materials.add(material);
        for (const value of Object.values(material)) {
          if (value?.isTexture) textures.add(value);
        }
      }
    }
  });
  group.clear();
  for (const geometry of geometries) geometry.dispose();
  for (const material of materials) material.dispose();
  for (const texture of textures) texture.dispose();
}
