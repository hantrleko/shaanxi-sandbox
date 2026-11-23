const baseLayers = Object.freeze({
  border: true,
  rivers: false,
  qinlingLine: false,
  silkRoad: false,
  pois: true,
  cultural: false,
  shuRoads: false,
  qinZhiDao: false,
  poetrySpots: false,
  valleyMist: false
});

export const LAYER_LABELS = Object.freeze({
  border: '行政边界',
  rivers: '主要水系',
  qinlingLine: '秦岭主脊示意',
  silkRoad: '丝绸之路示意',
  pois: '地名与地标',
  cultural: '人文风物',
  shuRoads: '古蜀道示意',
  qinZhiDao: '秦直道示意',
  poetrySpots: '诗词地标',
  valleyMist: '秦岭云海'
});

export function chapterLayers(theme, chapter) {
  const layers = { ...baseLayers };
  if (theme === 'geo') {
    layers.rivers = ['geo_01', 'geo_03', 'geo_05', 'geo_06'].includes(chapter);
    layers.qinlingLine = chapter === 'geo_02';
  } else if (theme === 'silkroad') {
    layers.silkRoad = true;
  }
  return layers;
}

export const guideLayers = (step, revealed) => ({
  ...baseLayers,
  qinlingLine: revealed || step >= 2,
  rivers: step === 3
});

export const ELEVATION_STOPS = ['#668170', '#9da279', '#bc9d6a', '#8c755e', '#ece4d0'];
export const SLOPE_STOPS = ['#768d66', '#c0ad6e', '#be754e', '#925240'];
