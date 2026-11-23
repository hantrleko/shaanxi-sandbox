import { REAL_POIS } from './shaanxiGeoVectors.js';
import { projectLonLat } from '../utils/geography.js';

function landmark(id) {
  const { lon, lat } = REAL_POIS.find(point => point.id === id);
  return projectLonLat(lon, lat);
}

export const QINLING_TRANSECT = [landmark('xian'), landmark('hanzhong')];
export const QINLING_SOURCE = 'https://sthjt.shaanxi.gov.cn/xxgk/fdnr/zcgh/202105/P020250227647255162702.pdf';

export const QINLING_STATIONS = [
  {
    title: '找到西安和汉中',
    label: '全省定位',
    prompt: '两座城市之间，要跨过怎样的地形？',
    description: '先在关中平原找到西安，再向西南找到汉中。观察两座城市之间突起的山地。',
    camera: { pos: [0, 128, 105], target: [0, 3, -4] },
    labels: ['xian', 'hanzhong', 'yulin', 'yanan']
  },
  {
    title: '找出连续山脊',
    label: '寻找山脊',
    prompt: '如果雨落在山脊两侧，它们会流向同一个地方吗？',
    description: '沿西安到汉中的方向观察，在你认为最可能是分水岭的位置做个标记。',
    camera: { pos: [-32, 49, 71], target: [-3, 5, 23] },
    labels: ['xian', 'hanzhong', 'taibai']
  },
  {
    title: '检查地形剖面',
    label: '画剖面',
    prompt: '哪一段爬升最快？越过山脊后，地势怎样变化？',
    description: '用西安和汉中作为端点生成教学剖面。移动曲线游标，地图会同步标出取样位置。',
    camera: { pos: [-28, 56, 78], target: [-2, 4, 25] },
    labels: ['xian', 'hanzhong', 'taibai']
  },
  {
    title: '验证水流方向',
    label: '看水流',
    prompt: '渭河与汉江分别属于哪两个水系？',
    description: '打开示意水系，比较秦岭两侧河流，再选择两条河的归属。',
    camera: { pos: [-11, 94, 108], target: [2, 4, 11] },
    labels: ['xian', 'hanzhong', 'taibai', 'ankang']
  }
];
