import extent from '../data/bonsaiExtent.json' with { type: 'json' };

export function bonsaiTileWidthKm(id) {
  const { lat } = extent[id.replace('bonsai_', '')];
  return Math.cos(lat * Math.PI / 180) * 40075.0167 * extent.tileSpan / 2 ** extent.zoom;
}
