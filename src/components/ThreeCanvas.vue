<template>
  <div class="canvas-container" ref="containerRef">
    <div v-if="isSpinning360" class="map-status spin-notice">
      <button type="button" class="map-button" @click="stop360Spin">停止环绕</button>
    </div>

    <div v-if="currentMode === 'macro'" class="poi-overlay" :class="{ selecting: isSelecting }">
      <span v-for="label in sceneLabels" :key="label.id" :class="['scene-label', label.role]" :style="label.style">
        {{ label.text }}
      </span>
      <button
        v-for="poi in screenPois"
        :key="poi.id"
        type="button"
        class="map-place"
        :class="{ current: poi.id === selectedPoiId }"
        :aria-pressed="poi.id === selectedPoiId"
        :aria-label="poi.name"
        :style="poi.style"
        :tabindex="isSelecting ? -1 : 0"
        @click="onPoiClick(poi)"
      >{{ poi.label }}</button>
    </div>

    <!-- 历史战役军事战术标牌 (战役模式) -->
    <div
      v-if="currentMode === 'campaign'"
      class="poi-overlay"
      :style="{ pointerEvents: 'none' }"
    >
      <div
        v-for="cp in screenCheckpoints"
        :key="cp.name"
        class="campaign-badge"
        :class="{ visible: cp.visible }"
        :style="{
          transform: `translate(${cp.x}px, ${cp.y}px)`,
          pointerEvents: 'auto'
        }"
      >
        <div class="camp-icon">⚔️</div>
        <div class="camp-info">
          <div class="camp-name">{{ cp.name }}</div>
          <div class="camp-role">{{ cp.role }}</div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import { POI_LIST, CULTURAL_ITEMS, POETRY_SPOTS } from '../data/shaanxiData.js';
import { CITY_BOUNDARIES, REAL_RIVERS, REAL_POIS, REAL_CAMPAIGN_ROUTES, REAL_SHU_ROADS, REAL_QIN_ZHIDAO } from '../data/shaanxiGeoVectors.js';
import { soundscape } from '../utils/soundscape.js';
import { findShaanxiCity, makeElevationProfile, sampleElevation, TERRAIN_EXTENT, unprojectWorld } from '../utils/geography.js';
import { loadTerrainTexture, loadTerrainDem, clearSceneGroup } from '../utils/terrainResources.js';
import { createTerrainSurface, updateTerrainSurface, updateTerrainAnalysis, surfaceHeightAt } from '../utils/terrainSurface.js';
import { bonsaiTileWidthKm } from '../utils/bonsaiTerrain.js';

const props = defineProps({
  currentMode: { type: String, default: 'macro' }, // 'macro' | 'bonsai' | 'model' | 'campaign'
  activeBonsaiId: { type: String, default: 'bonsai_huashan' },
  bonsaiExaggeration: { type: Number, default: 5 },
  activeModelStage: { type: Number, default: 1 },
  activeCampaign: { type: Object, default: null },
  activeCampaignStageIndex: { type: Number, default: 0 },
  lightingMode: { type: String, default: 'dawn' }, // 'dawn' | 'noon' | 'sunset' | 'night'
  seasonMode: { type: String, default: 'natural' }, // 'natural' | 'spring' | 'summer' | 'autumn' | 'winter'
  gisMode: { type: String, default: 'natural' }, // 'natural' | 'hypsometric' | 'slope' | 'ink'
  layers: {
    type: Object,
    default: () => ({ border: true, rivers: true, qinlingLine: true, silkRoad: true, pois: true, cultural: false, shuRoads: true, qinZhiDao: true, poetrySpots: true, valleyMist: true })
  },
  activeLabId: { type: String, default: 'loess' },
  currentTectonicStage: { type: Number, default: 0 },
  cameraRequest: { type: Object, default: null },
  safeFrame: { type: Object, default: null },
  history: Boolean,
  guideStep: { type: Number, default: -1 },
  guideLabels: { type: Array, default: null },
  isGuidePicking: Boolean,
  isProbing: Boolean,
  isProfileVisible: Boolean,
  reducedMotion: Boolean,
  isProfilingActive: { type: Boolean, default: false },
  isRoadbookActive: { type: Boolean, default: false },
  isChallengeActive: { type: Boolean, default: false },
  isPortalActive: Boolean
});

const emit = defineEmits([
  'camera-update',
  'select-poi',
  'profile-calculated',
  'challenge-click',
  'select-culture',
  'select-poetry',
  'profile-step',
  'terrain-status',
  'guide-point',
  'map-gesture',
  'roadbook-point-added',
  'spin-360-status',
  'geo-telemetry'
]);

const containerRef = ref(null);
const selectedPoiId = ref(null);
const sceneLabels = ref([]);
const screenPois = ref([]);
const screenCheckpoints = ref([]);
const isSelecting = computed(() => props.isGuidePicking || props.isProbing || props.isProfilingActive
  || props.isChallengeActive || props.isRoadbookActive);
const shortNames = {
  xian: '西安', yanan: '延安', yulin: '榆林', hanzhong: '汉中', ankang: '安康',
  baoji: '宝鸡', taibai: '太白山', huashan: '华山', hukou: '壶口瀑布', bingmayong: '兵马俑'
};
const corePlaces = new Set(['xian', 'yulin', 'yanan', 'hanzhong', 'taibai']);
const renderedLayers = new Set();
let viewportObserver;
let terrainSurface;
let demRaster = null;
let boundaries = null;
let destroyed = false;
let mobile = false;
let status = 'loading';
let cameraTween = null;
let lastCameraReadout = null;
let guideMarker;
let cursorMarker;
let terrainReticleMesh = null;
const isSpinning360 = ref(false);
let spinTween = null;
let middleDownPos = { x: 0, y: 0, time: 0 };
let scene, camera, renderer, controls;
let macroGroup, bonsaiGroup, modelGroup, campaignGroup;
let borderSubGroup, riversSubGroup, qinlingSubGroup, silkRoadSubGroup, culturalSubGroup, profilingMeasureGroup, citiesSubGroup;
let shuRoadsSubGroup, qinZhiDaoSubGroup, poetrySubGroup, valleyMistGroup;
let terrainMesh, sunLight, skyFillLight, starfieldMesh;
let animFrameId = null;
let lastFrameTime = 0;

// 动态信标与高阶渲染动画追踪
let animatedValleyMist = [];
let animatedPoetryBeacons = [];

const terrainUniforms = {
  seasons: { value: 0 },
  mapStyle: { value: 0 },
  historyMix: { value: 0 },
  provinceView: { value: 0 }
};

const seasonCodeMap = {
  natural: 0.0,
  spring: 1.0,
  summer: 2.0,
  autumn: 3.0,
  winter: 4.0
};

// 3D 路书与 FPV 飞行状态
let roadbookGroup = null;
let currentRoadbookRoute = null;
let fpvActive = false;
let fpvPaused = false;
let fpvCurve = null;
let fpvProgress = 0;
let fpvSpeed = 0.00065;
let fpvWaypoints = [];
let fpvCallback = null;
let preFpvCameraState = null;

// 动态模拟系统变量
let loessWaterParticles = null;
let climateNorthParticles = null;
let climateSouthParticles = null;
let winterSnowParticles = null;
let bonsaiBuild = 0;
let globeMesh = null;
let tectonicQinlingMesh = null;
let tectonicGrabenMesh = null;

function applyResponsiveCameraFov(width, height) {
  if (!camera) return;
  const aspect = width / Math.max(1, height);
  camera.aspect = aspect;
  camera.fov = aspect < 0.85 ? Math.min(62, Math.round(40 / Math.max(0.65, aspect))) : 40;
}

// 初始化场景
const initThree = () => {
  const width = containerRef.value.clientWidth;
  const height = containerRef.value.clientHeight;
  mobile = width <= 760 || navigator.maxTouchPoints > 0;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x112b30);
  scene.fog = new THREE.FogExp2(0x112b30, 0.0014);

  camera = new THREE.PerspectiveCamera(40, width / Math.max(1, height), 0.1, 1500);
  applyResponsiveCameraFov(width, height);
  camera.updateProjectionMatrix();
  camera.position.set(0, 95, 125);

  try {
    renderer = new THREE.WebGLRenderer({
      antialias: !mobile,
      alpha: false,
      powerPreference: 'high-performance'
    });
  } catch {
    setTerrainStatus('static');
    return;
  }
  renderer.domElement.addEventListener('webglcontextlost', onContextLost);
  renderer.domElement.tabIndex = 0;
  renderer.domElement.setAttribute('aria-label', '三维地形。拖动旋转，滚轮缩放。选点时按回车标记地图中心。');
  renderer.domElement.addEventListener('keydown', onMapKeydown);
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, mobile ? 1.25 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  containerRef.value.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.17;
  controls.target.set(0, 4, 0);
  controls.addEventListener('change', requestRender);
  controls.maxPolarAngle = Math.PI / 2 - 0.03;
  controls.minDistance = 8;
  controls.maxDistance = 420;
  controls.touches = {
    ONE: THREE.TOUCH.ROTATE,
    TWO: THREE.TOUCH.DOLLY_PAN
  };
  // 🖱️ 鼠标按键映射：支持按住鼠标中键自由 360° 拖动旋转沙盘与俯仰视角 (GIS/CAD标准手势)
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.ROTATE,
    RIGHT: THREE.MOUSE.PAN
  };

  // 电影级分层多光源光照系统
  const ambientLight = new THREE.AmbientLight(0xf5f1e4, 1.12);
  scene.add(ambientLight);

  sunLight = new THREE.DirectionalLight(0xffedd5, 2.2);
  sunLight.position.set(70, 110, 50);
  scene.add(sunLight);

  skyFillLight = new THREE.DirectionalLight(0xc5dfd9, 0.62);
  skyFillLight.position.set(-60, 45, -60);
  scene.add(skyFillLight);

  // 场景节点分组结构
  macroGroup = new THREE.Group();
  bonsaiGroup = new THREE.Group();
  modelGroup = new THREE.Group();
  campaignGroup = new THREE.Group();

  borderSubGroup = new THREE.Group();
  riversSubGroup = new THREE.Group();
  qinlingSubGroup = new THREE.Group();
  silkRoadSubGroup = new THREE.Group();
  shuRoadsSubGroup = new THREE.Group();
  qinZhiDaoSubGroup = new THREE.Group();
  poetrySubGroup = new THREE.Group();
  valleyMistGroup = new THREE.Group();
  culturalSubGroup = new THREE.Group();
  profilingMeasureGroup = new THREE.Group();
  citiesSubGroup = new THREE.Group();

  macroGroup.add(borderSubGroup);
  macroGroup.add(riversSubGroup);
  macroGroup.add(qinlingSubGroup);
  macroGroup.add(silkRoadSubGroup);
  macroGroup.add(shuRoadsSubGroup);
  macroGroup.add(qinZhiDaoSubGroup);
  macroGroup.add(poetrySubGroup);
  macroGroup.add(valleyMistGroup);
  macroGroup.add(culturalSubGroup);
  macroGroup.add(profilingMeasureGroup);
  macroGroup.add(citiesSubGroup);


  renderer.domElement.addEventListener('pointerdown', onCanvasPointerDown);
  renderer.domElement.addEventListener('pointercancel', resetPointerGesture);
  renderer.domElement.addEventListener('pointerup', onCanvasPointerUp);
  renderer.domElement.addEventListener('auxclick', onAuxClick);
  renderer.domElement.addEventListener('wheel', onCanvasWheel, { passive: true });

  // 地面交互激光光标靶心
  const reticleRingGeo = new THREE.RingGeometry(0.9, 1.35, 32);
  reticleRingGeo.rotateX(-Math.PI / 2);
  const reticleMat = new THREE.MeshBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.85,
    side: THREE.DoubleSide
  });
  terrainReticleMesh = new THREE.Mesh(reticleRingGeo, reticleMat);
  terrainReticleMesh.visible = false;
  macroGroup.add(terrainReticleMesh);

  const crossGeo = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-1.8, 0, 0), new THREE.Vector3(1.8, 0, 0),
    new THREE.Vector3(0, 0, -1.8), new THREE.Vector3(0, 0, 1.8)
  ]);
  const crossLines = new THREE.LineSegments(crossGeo, new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.6 }));
  terrainReticleMesh.add(crossLines);

  scene.add(macroGroup);
  scene.add(bonsaiGroup);
  scene.add(modelGroup);
  scene.add(campaignGroup);

  bonsaiGroup.visible = false;
  modelGroup.visible = false;
  campaignGroup.visible = false;

  viewportObserver = new ResizeObserver(onWindowResize);
  viewportObserver.observe(containerRef.value);
  if (props.safeFrame) viewportObserver.observe(props.safeFrame);
  document.addEventListener('visibilitychange', onVisibility);
  onWindowResize();
  setLighting(props.lightingMode);
  setSeason(props.seasonMode);
  setGisMode(props.gisMode);
  terrainUniforms.historyMix.value = Number(props.history);
  applyMode(props.currentMode);
  if (props.currentMode === 'macro' && props.cameraRequest) applyCameraRequest(props.cameraRequest, true);
  loadRealTerrainAssets();
};

function setTerrainStatus(value) {
  status = value;
  emit('terrain-status', value);
}

function onContextLost(event) {
  event.preventDefault();
  setTerrainStatus('static');
  cancelMotion();
}

function committedTexture(texture) {
  if (!texture) return null;
  if (destroyed) {
    texture.dispose();
    return null;
  }
  texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
  return texture;
}

async function loadRealTerrainAssets() {
  const safe = promise => promise.catch(() => null);
  const lowDem = safe(loadTerrainDem('shaanxi_dem_preview.png'));
  const lowPhoto = safe(loadTerrainTexture('shaanxi_satellite_preview.webp', true));
  const maskData = safe(loadTerrainTexture('shaanxi_mask.png'));
  fetch(import.meta.env.BASE_URL + 'data/shaanxi_full.json')
    .then(response => response.ok ? response.json() : null)
    .then(collection => { if (!destroyed) boundaries = collection?.features || null; })
    .catch(() => {});

  const [preview, initialTexture, provinceMask] = await Promise.all([lowDem, lowPhoto, maskData]);
  const photo = committedTexture(initialTexture);
  const mask = committedTexture(provinceMask);
  if (destroyed) return;
  const fullDem = safe(loadTerrainDem('shaanxi_dem.png'));
  const initialDem = preview || await fullDem;
  if (destroyed || status === 'static') {
    photo?.dispose();
    mask?.dispose();
    return;
  }
  if (!initialDem) {
    photo?.dispose();
    mask?.dispose();
    if (props.currentMode === 'macro' || props.currentMode === 'campaign') setTerrainStatus('static');
    return;
  }

  terrainSurface = createTerrainSurface({ map: photo, mask, uniforms: terrainUniforms });
  terrainMesh = terrainSurface.mesh;
  macroGroup.add(terrainMesh, terrainSurface.skirt, terrainSurface.base);
  updateTerrainSurface(terrainSurface, initialDem, mobile ? 110 : 166, mobile ? 166 : 242);
  syncProvinceView();
  syncLayers();
  if (props.currentMode === 'macro' && props.cameraRequest) applyCameraRequest(props.cameraRequest, true);
  setTerrainStatus('preview');
  requestRender();

  void safe(loadTerrainTexture('shaanxi_satellite_relief.webp', true)).then(candidate => {
    const texture = committedTexture(candidate);
    if (!texture || !terrainSurface) return;
    terrainMesh.material.map?.dispose();
    terrainMesh.material.map = texture;
    terrainMesh.material.color.setHex(0xffffff);
    terrainMesh.material.needsUpdate = true;
    requestRender();
  });

  if (!mobile) {
    void safe(loadTerrainTexture('shaanxi_normal_detail.webp')).then(candidate => {
      const texture = committedTexture(candidate);
      if (!texture || !terrainSurface) return;
      terrainMesh.material.normalMap = texture;
      terrainMesh.material.needsUpdate = true;
      requestRender();
    });
  }
  demRaster = await fullDem;
  if (!destroyed && status !== 'static') {
    if (demRaster && demRaster !== initialDem) updateTerrainAnalysis(terrainSurface, demRaster);
    setTerrainStatus(demRaster ? 'ready' : 'limited');
    requestRender();
  }
}

function terrainLine(points, offset = 0.2) {
  const planar = points.map(([x, , z]) => new THREE.Vector3(x, 0, z));
  const curve = new THREE.CatmullRomCurve3(planar);
  const steps = Math.max(24, Math.ceil(curve.getLength() * 3));
  return curve.getSpacedPoints(steps).map(p => p.setY(getTerrainHeightAt(p.x, p.z) + offset));
}

function addDashedLine(group, points, color, dashSize = 0.58, gapSize = 0.39) {
  const material = new THREE.LineDashedMaterial({ color, dashSize, gapSize });
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), material);
  line.computeLineDistances();
  group.add(line);
}

function buildShaanxiBorder() {
  const material = new THREE.LineBasicMaterial({ color: 0xe2d8ba, transparent: true, opacity: 0.48 });
  for (const city of CITY_BOUNDARIES) {
    for (const ring of city.rings) {
      const points = ring.map(([x, , z]) => new THREE.Vector3(x, getTerrainHeightAt(x, z) + 0.14, z));
      if (points.length > 2) borderSubGroup.add(new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), material));
    }
  }
}

function buildRivers() {
  const widths = { yellow_river: 0.18, wei_river: 0.14, han_river: 0.14, jing_river: 0.08 };
  const main = new THREE.MeshBasicMaterial({ color: 0x69c3cb });
  const branch = new THREE.MeshBasicMaterial({ color: 0x508c94 });
  for (const [id, values] of Object.entries(REAL_RIVERS)) {
    if (values.length < 2) continue;
    const points = terrainLine(values, 0.40);
    const curve = new THREE.CatmullRomCurve3(points);
    const geometry = new THREE.TubeGeometry(curve, points.length, widths[id] || 0.1, 5, false);
    riversSubGroup.add(new THREE.Mesh(geometry, id === 'jing_river' ? branch : main));
  }
}

function buildQinlingLine() {
  // Generalised crest for classroom discussion. It is not a basin polygon.
  const points = [[-18.5, 0, 19.5], [-12, 0, 21.2], [-4.84, 0, 22.75],
    [2.5, 0, 22], [10.5, 0, 21.8], [17.1, 0, 17], [21.5, 0, 17.8]];
  addDashedLine(qinlingSubGroup, terrainLine(points, 0.35), 0xf5dc9e, 0.30, 0.25);
}

function buildSilkRoad() {
  const points = [[6.24, 0, 16.98], [1.5, 0, 15.2], [-4.5, 0, 14], [-10.78, 0, 16.67],
    [-18.5, 0, 12], [-28, 0, 5], [-38, 0, -4]];
  addDashedLine(silkRoadSubGroup, terrainLine(points), 0xe4ad71);
}

// 构建三秦重点城市三维聚落集群 (古今交融：长安城墙/大雁塔/钟楼与现代夜景天际线)
function buildProceduralCities() {
  while (citiesSubGroup.children.length > 0) {
    citiesSubGroup.remove(citiesSubGroup.children[0]);
  }

  const buildingMat = new THREE.MeshStandardMaterial({
    color: 0x111c2e,
    roughness: 0.4,
    metalness: 0.8
  });

  const nightWindowMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.95,
    roughness: 0.3,
    metalness: 0.6
  });

  const cyanWindowMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    emissive: 0x38bdf8,
    emissiveIntensity: 0.85,
    roughness: 0.3,
    metalness: 0.6
  });

  const wallMat = new THREE.MeshStandardMaterial({
    color: 0x292524,
    roughness: 0.9,
    metalness: 0.2
  });

  // 1. 西安 (汉唐长安都城与现代中心城市集群)
  const xianGroup = new THREE.Group();
  const xianX = 6.24;
  const xianZ = 16.98;
  const xianY = getTerrainHeightAt(xianX, xianZ) + 0.05;
  xianGroup.position.set(xianX, xianY, xianZ);

  // 仿明清/唐长安城墙 (矩形围城)
  const wallW = 4.8;
  const wallD = 3.6;
  const wallH = 0.42;
  const wallT = 0.22;

  const createWallSegment = (w, d, h, px, pz) => {
    const geo = new THREE.BoxGeometry(w, h, d);
    const m = new THREE.Mesh(geo, wallMat);
    m.position.set(px, h / 2, pz);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  };

  xianGroup.add(createWallSegment(wallW, wallT, wallH, 0, -wallD / 2));
  xianGroup.add(createWallSegment(wallW, wallT, wallH, 0, wallD / 2));
  xianGroup.add(createWallSegment(wallT, wallD, wallH, -wallW / 2, 0));
  xianGroup.add(createWallSegment(wallT, wallD, wallH, wallW / 2, 0));

  // 四隅角楼 (Corner Watchtowers)
  const cornerGeo = new THREE.BoxGeometry(0.36, 0.65, 0.36);
  const cornerMat = new THREE.MeshStandardMaterial({ color: 0x78350f, emissive: 0xd97706, emissiveIntensity: 0.4 });
  [[-wallW / 2, -wallD / 2], [wallW / 2, -wallD / 2], [-wallW / 2, wallD / 2], [wallW / 2, wallD / 2]].forEach(([cx, cz]) => {
    const cMesh = new THREE.Mesh(cornerGeo, cornerMat);
    cMesh.position.set(cx, 0.32, cz);
    xianGroup.add(cMesh);
  });

  // 钟楼 (中央三层金顶歇山亭)
  const bellTowerBase = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.35, 0.55), wallMat);
  bellTowerBase.position.set(0, 0.18, 0);
  xianGroup.add(bellTowerBase);

  const bellTowerPavilion = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.45, 0.42), nightWindowMat);
  bellTowerPavilion.position.set(0, 0.55, 0);
  xianGroup.add(bellTowerPavilion);

  const bellSpire = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.35, 8), new THREE.MeshBasicMaterial({ color: 0xfbbf24 }));
  bellSpire.position.set(0, 0.95, 0);
  xianGroup.add(bellSpire);

  // 大雁塔 (南郊七层叠涩方塔)
  const pagodaGroup = new THREE.Group();
  pagodaGroup.position.set(0.6, 0, 1.3);
  let pY = 0;
  for (let lvl = 0; lvl < 7; lvl++) {
    const w = 0.52 - lvl * 0.055;
    const h = 0.22;
    const tier = new THREE.Mesh(new THREE.BoxGeometry(w, h, w), (lvl % 2 === 0) ? nightWindowMat : buildingMat);
    tier.position.set(0, pY + h / 2, 0);
    pagodaGroup.add(tier);
    pY += h;
  }
  const pagodaTop = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.25, 6), new THREE.MeshBasicMaterial({ color: 0xf59e0b }));
  pagodaTop.position.set(0, pY + 0.12, 0);
  pagodaGroup.add(pagodaTop);
  xianGroup.add(pagodaGroup);

  // 80+ 现代都会立体建筑集群
  const bGeoMaster = new THREE.BoxGeometry(1, 1, 1);
  const seedRandom = (seed) => {
    let s = seed;
    return () => {
      s = (s * 9301 + 49297) % 233280;
      return s / 233280;
    };
  };
  const rng = seedRandom(42);

  for (let i = 0; i < 85; i++) {
    const angle = rng() * Math.PI * 2;
    const dist = 0.4 + rng() * 3.6;
    const bx = Math.cos(angle) * dist;
    const bz = Math.sin(angle) * dist;

    if (Math.abs(bx) < wallW / 2 + 0.2 && Math.abs(bz) < wallD / 2 + 0.2 && dist > 1.2) {
      continue;
    }

    const bw = 0.18 + rng() * 0.24;
    const bd = 0.18 + rng() * 0.24;
    const bh = 0.35 + Math.pow(rng(), 2.2) * 2.6;

    const useAmber = rng() > 0.45;
    const bMesh = new THREE.Mesh(bGeoMaster, useAmber ? nightWindowMat : cyanWindowMat);
    bMesh.scale.set(bw, bh, bd);
    bMesh.position.set(bx, bh / 2, bz);
    xianGroup.add(bMesh);
  }

  // 西安夜景地面暖金光晕盘
  const glowGeo = new THREE.PlaneGeometry(8.5, 7.5);
  glowGeo.rotateX(-Math.PI / 2);
  const glowCanvas = document.createElement('canvas');
  glowCanvas.width = 256;
  glowCanvas.height = 256;
  const gCtx = glowCanvas.getContext('2d');
  const gRad = gCtx.createRadialGradient(128, 128, 10, 128, 128, 120);
  gRad.addColorStop(0, 'rgba(245, 158, 11, 0.45)');
  gRad.addColorStop(0.5, 'rgba(217, 119, 6, 0.18)');
  gRad.addColorStop(1, 'rgba(217, 119, 6, 0)');
  gCtx.fillStyle = gRad;
  gCtx.fillRect(0, 0, 256, 256);
  const glowTex = new THREE.CanvasTexture(glowCanvas);
  const glowMesh = new THREE.Mesh(glowGeo, new THREE.MeshBasicMaterial({
    map: glowTex,
    transparent: true,
    opacity: 0.85,
    depthWrite: false
  }));
  glowMesh.position.set(0, 0.04, 0);
  xianGroup.add(glowMesh);

  citiesSubGroup.add(xianGroup);

  // 2. 关中、陕北、陕南重点城市聚落
  const SECONDARY_CITIES = [
    { id: 'xianyang', name: '咸阳', x: 1.5, z: 15.2, count: 28, maxH: 1.7, color: 0x38bdf8 },
    { id: 'baoji', name: '宝鸡', x: -10.78, z: 16.67, count: 26, maxH: 1.5, color: 0xf59e0b },
    { id: 'yanan', name: '延安', x: 3.2, z: -18.5, count: 22, maxH: 1.3, color: 0xef4444 },
    { id: 'yulin', name: '榆林', x: 8.71, z: -44.8, count: 20, maxH: 1.4, color: 0xf59e0b },
    { id: 'hanzhong', name: '汉中', x: -11.93, z: 36.04, count: 24, maxH: 1.4, color: 0x10b981 },
    { id: 'ankang', name: '安康', x: 7.09, z: 41.71, count: 20, maxH: 1.3, color: 0x06b6d4 }
  ];

  SECONDARY_CITIES.forEach((c) => {
    const cGroup = new THREE.Group();
    const cY = getTerrainHeightAt(c.x, c.z) + 0.05;
    cGroup.position.set(c.x, cY, c.z);

    const cRng = seedRandom(c.x * 100 + c.z);
    const cMat = new THREE.MeshStandardMaterial({
      color: 0x111c2e,
      emissive: c.color,
      emissiveIntensity: 0.75,
      roughness: 0.3,
      metalness: 0.7
    });

    for (let j = 0; j < c.count; j++) {
      const ang = cRng() * Math.PI * 2;
      const rad = 0.2 + cRng() * 1.5;
      const bx = Math.cos(ang) * rad;
      const bz = Math.sin(ang) * rad;

      const bw = 0.14 + cRng() * 0.16;
      const bd = 0.14 + cRng() * 0.16;
      const bh = 0.22 + Math.pow(cRng(), 2.0) * c.maxH;

      const bMesh = new THREE.Mesh(bGeoMaster, cMat);
      bMesh.scale.set(bw, bh, bd);
      bMesh.position.set(bx, bh / 2, bz);
      cGroup.add(bMesh);
    }

    // 地面柔光微光晕
    const sGlowGeo = new THREE.RingGeometry(0.1, 1.6, 24);
    sGlowGeo.rotateX(-Math.PI / 2);
    const sGlowMat = new THREE.MeshBasicMaterial({
      color: c.color,
      transparent: true,
      opacity: 0.25,
      depthWrite: false
    });
    const sGlowMesh = new THREE.Mesh(sGlowGeo, sGlowMat);
    sGlowMesh.position.set(0, 0.03, 0);
    cGroup.add(sGlowMesh);

    citiesSubGroup.add(cGroup);
  });

  // 3. 延安宝塔山专属三维微雕 (九层八角密檐砖塔 + 塔刹金光)
  const baotaGroup = new THREE.Group();
  const baotaX = 4.1;
  const baotaZ = -17.8;
  const baotaY = getTerrainHeightAt(baotaX, baotaZ) + 0.1;
  baotaGroup.position.set(baotaX, baotaY, baotaZ);

  const bBaseGeo = new THREE.CylinderGeometry(0.7, 0.8, 0.35, 8);
  const bBaseMat = new THREE.MeshStandardMaterial({ color: 0x44403c, roughness: 0.8 });
  const bBase = new THREE.Mesh(bBaseGeo, bBaseMat);
  bBase.position.y = 0.175;
  baotaGroup.add(bBase);

  const pagodaBrickMat = new THREE.MeshStandardMaterial({
    color: 0x78350f,
    roughness: 0.85,
    metalness: 0.1
  });
  const pagodaEavesMat = new THREE.MeshStandardMaterial({
    color: 0x292524,
    roughness: 0.6
  });

  let curH = 0.35;
  for (let lvl = 0; lvl < 9; lvl++) {
    const radiusBot = 0.52 - lvl * 0.038;
    const radiusTop = radiusBot - 0.025;
    const tierH = 0.28;
    const bodyGeo = new THREE.CylinderGeometry(radiusTop, radiusBot, tierH, 8);
    const body = new THREE.Mesh(bodyGeo, pagodaBrickMat);
    body.position.y = curH + tierH / 2;
    baotaGroup.add(body);

    const eaveGeo = new THREE.CylinderGeometry(radiusTop + 0.08, radiusTop + 0.02, 0.06, 8);
    const eave = new THREE.Mesh(eaveGeo, pagodaEavesMat);
    eave.position.y = curH + tierH + 0.03;
    baotaGroup.add(eave);
    curH += tierH + 0.06;
  }
  const finialGeo = new THREE.ConeGeometry(0.12, 0.45, 8);
  const finialMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
  const finial = new THREE.Mesh(finialGeo, finialMat);
  finial.position.y = curH + 0.22;
  baotaGroup.add(finial);

  citiesSubGroup.add(baotaGroup);

  // 4. 西岳华山专属三维微雕 (金锁关云台双坡歇山石木亭 + 绝壁险道)
  const huashanGroup = new THREE.Group();
  const huaX = 17.1;
  const huaZ = 15.2;
  const huaY = getTerrainHeightAt(huaX, huaZ) + 0.15;
  huashanGroup.position.set(huaX, huaY, huaZ);

  const huaPlat = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 0.8), wallMat);
  huaPlat.position.y = 0.15;
  huashanGroup.add(huaPlat);

  const pillarMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.4 });
  [[-0.28, -0.28], [0.28, -0.28], [-0.28, 0.28], [0.28, 0.28]].forEach(([px, pz]) => {
    const pil = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.65, 6), pillarMat);
    pil.position.set(px, 0.45, pz);
    huashanGroup.add(pil);
  });

  const roofGeo = new THREE.ConeGeometry(0.65, 0.35, 4);
  roofGeo.rotateY(Math.PI / 4);
  const roofMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.5,
    roughness: 0.3
  });
  const roof = new THREE.Mesh(roofGeo, roofMat);
  roof.position.y = 0.9;
  huashanGroup.add(roof);

  const lockBandGeo = new THREE.RingGeometry(0.1, 0.55, 16);
  lockBandGeo.rotateX(-Math.PI / 2);
  const lockBand = new THREE.Mesh(lockBandGeo, new THREE.MeshBasicMaterial({
    color: 0xfbbf24,
    transparent: true,
    opacity: 0.75,
    side: THREE.DoubleSide
  }));
  lockBand.position.y = 0.32;
  huashanGroup.add(lockBand);

  citiesSubGroup.add(huashanGroup);

  // 5. 榆林镇北台专属三维微雕 (万里长城第一台：四层梯级方台雄关要塞)
  const zhenbeiGroup = new THREE.Group();
  const zbX = 9.2;
  const zbZ = -44.2;
  const zbY = getTerrainHeightAt(zbX, zbZ) + 0.1;
  zhenbeiGroup.position.set(zbX, zbY, zbZ);

  const zMat = new THREE.MeshStandardMaterial({
    color: 0x57534e,
    roughness: 0.85,
    metalness: 0.15
  });
  const zbEmissive = new THREE.MeshStandardMaterial({
    color: 0x292524,
    emissive: 0xd97706,
    emissiveIntensity: 0.4,
    roughness: 0.7
  });

  const TIER_SPECS = [
    { w: 1.6, h: 0.38 },
    { w: 1.25, h: 0.35 },
    { w: 0.95, h: 0.32 },
    { w: 0.65, h: 0.30 }
  ];

  let curZbH = 0;
  TIER_SPECS.forEach((ts, idx) => {
    const tier = new THREE.Mesh(new THREE.BoxGeometry(ts.w, ts.h, ts.w), idx === 3 ? zbEmissive : zMat);
    tier.position.y = curZbH + ts.h / 2;
    zhenbeiGroup.add(tier);
    curZbH += ts.h;
  });

  const beaconPlatform = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.22, 8), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
  beaconPlatform.position.y = curZbH + 0.11;
  zhenbeiGroup.add(beaconPlatform);

  citiesSubGroup.add(zhenbeiGroup);
}

// 🌌 构建二十八宿星空穹顶与银河繁星系统
function buildStarfield() {
  if (starfieldMesh) {
    scene.remove(starfieldMesh);
    starfieldMesh.geometry.dispose();
    starfieldMesh.material.dispose();
    starfieldMesh = null;
  }
  const starCount = 1800;
  const starGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(starCount * 3);
  const colors = new Float32Array(starCount * 3);
  const sizes = new Float32Array(starCount);

  const starColors = [
    new THREE.Color(0xffffff),
    new THREE.Color(0xa5f3fc),
    new THREE.Color(0xfef08a),
    new THREE.Color(0xfbcfe8),
    new THREE.Color(0x67e8f9)
  ];

  for (let i = 0; i < starCount; i++) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = 380 + Math.random() * 70;

    const x = r * Math.sin(phi) * Math.cos(theta);
    const y = Math.abs(r * Math.cos(phi)) + 15;
    const z = r * Math.sin(phi) * Math.sin(theta);

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    const col = starColors[Math.floor(Math.random() * starColors.length)];
    colors[i * 3] = col.r;
    colors[i * 3 + 1] = col.g;
    colors[i * 3 + 2] = col.b;

    sizes[i] = 1.2 + Math.random() * 2.4;
  }

  starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  starGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  starGeo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const ctx = canvas.getContext('2d');
  const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, 'rgba(255,255,255,1)');
  grad.addColorStop(0.3, 'rgba(224,242,254,0.8)');
  grad.addColorStop(0.8, 'rgba(56,189,248,0.2)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 32, 32);
  const starTex = new THREE.CanvasTexture(canvas);

  const starMat = new THREE.PointsMaterial({
    size: 2.2,
    vertexColors: true,
    map: starTex,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  starfieldMesh = new THREE.Points(starGeo, starMat);
  starfieldMesh.visible = (props.lightingMode === 'night');
  scene.add(starfieldMesh);
}

// ☁️ 构建秦岭体积云海与汉江晨雾系统
function buildValleyMist() {
  while (valleyMistGroup.children.length > 0) {
    valleyMistGroup.remove(valleyMistGroup.children[0]);
  }
  animatedValleyMist = [];

  const cCanvas = document.createElement('canvas');
  cCanvas.width = 128;
  cCanvas.height = 128;
  const cCtx = cCanvas.getContext('2d');
  const cGrad = cCtx.createRadialGradient(64, 64, 8, 64, 64, 62);
  cGrad.addColorStop(0, 'rgba(240, 249, 255, 0.45)');
  cGrad.addColorStop(0.5, 'rgba(224, 242, 254, 0.22)');
  cGrad.addColorStop(0.8, 'rgba(186, 230, 253, 0.08)');
  cGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  cCtx.fillStyle = cGrad;
  cCtx.fillRect(0, 0, 128, 128);
  const mistTex = new THREE.CanvasTexture(cCanvas);

  const mistMat = new THREE.MeshBasicMaterial({
    map: mistTex,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
    blending: THREE.NormalBlending,
    side: THREE.DoubleSide
  });

  const MIST_CENTERS = [
    { x: 3.5, z: 22.0, w: 26, d: 8, h: 4.5, count: 18 },
    { x: -9.5, z: 24.5, w: 22, d: 10, h: 5.2, count: 16 },
    { x: -11.5, z: 36.0, w: 28, d: 12, h: 2.8, count: 18 },
    { x: 7.5, z: 41.5, w: 24, d: 10, h: 2.6, count: 14 },
    { x: 19.8, z: -5.2, w: 10, d: 24, h: 3.8, count: 12 }
  ];

  MIST_CENTERS.forEach((zone) => {
    for (let k = 0; k < zone.count; k++) {
      const pw = (zone.w * 0.35) + Math.random() * (zone.w * 0.45);
      const pd = (zone.d * 0.35) + Math.random() * (zone.d * 0.45);
      const pGeo = new THREE.PlaneGeometry(pw, pd);
      pGeo.rotateX(-Math.PI / 2);

      const pMesh = new THREE.Mesh(pGeo, mistMat.clone());
      const px = zone.x + (Math.random() - 0.5) * zone.w;
      const pz = zone.z + (Math.random() - 0.5) * zone.d;
      const groundY = getTerrainHeightAt(px, pz);
      const py = groundY + zone.h + Math.random() * 2.2;

      pMesh.position.set(px, py, pz);
      pMesh.rotation.y = Math.random() * Math.PI;

      valleyMistGroup.add(pMesh);
      animatedValleyMist.push({
        mesh: pMesh,
        baseX: px,
        baseZ: pz,
        baseY: py,
        speedX: (Math.random() - 0.45) * 0.008,
        speedZ: (Math.random() - 0.45) * 0.006,
        rotSpeed: (Math.random() - 0.5) * 0.0012,
        phase: Math.random() * Math.PI * 2
      });
    }
  });

  valleyMistGroup.visible = !!props.layers?.valleyMist;
}

function buildHistoricalRoads() {
  for (const { pts } of Object.values(REAL_SHU_ROADS)) {
    if (pts.length >= 2) addDashedLine(shuRoadsSubGroup, terrainLine(pts), 0xe2ae72);
  }
  addDashedLine(qinZhiDaoSubGroup, terrainLine(REAL_QIN_ZHIDAO.pts), 0xdab08a, 0.82, 0.42);
}

// 🏮 构建唐诗宋词地理空间信标 (朱砂古印微雕 + 通天金星光柱)
function buildPoetrySpots() {
  while (poetrySubGroup.children.length > 0) {
    poetrySubGroup.remove(poetrySubGroup.children[0]);
  }
  animatedPoetryBeacons = [];

  POETRY_SPOTS.forEach(spot => {
    const spotGroup = new THREE.Group();
    const groundY = getTerrainHeightAt(spot.pos[0], spot.pos[2]);
    const posY = Math.max(spot.pos[1], groundY + 0.3);
    spotGroup.position.set(spot.pos[0], posY, spot.pos[2]);

    spotGroup.userData = { isPoetry: true, poetrySpot: spot };

    // 1. 朱砂古印微雕立方体
    const sealGeo = new THREE.BoxGeometry(0.55, 0.65, 0.55);
    const sealMat = new THREE.MeshStandardMaterial({
      color: 0xb91c1c,
      emissive: 0xd97706,
      emissiveIntensity: 0.7,
      roughness: 0.25,
      metalness: 0.4
    });
    const sealMesh = new THREE.Mesh(sealGeo, sealMat);
    sealMesh.position.y = 0.55;
    sealMesh.userData = { isPoetry: true, poetrySpot: spot };
    spotGroup.add(sealMesh);

    // 印钮金顶
    const finialGeo = new THREE.ConeGeometry(0.2, 0.35, 4);
    finialGeo.rotateY(Math.PI / 4);
    const finialMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    const finialMesh = new THREE.Mesh(finialGeo, finialMat);
    finialMesh.position.y = 0.95;
    finialMesh.userData = { isPoetry: true, poetrySpot: spot };
    spotGroup.add(finialMesh);

    // 2. 垂直通天金星光柱
    const beamGeo = new THREE.CylinderGeometry(0.04, 0.18, 9.0, 16);
    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const beamMesh = new THREE.Mesh(beamGeo, beamMat);
    beamMesh.position.y = 4.5;
    spotGroup.add(beamMesh);

    // 3. 地面朱金光环
    const ringGeo = new THREE.RingGeometry(0.2, 0.95, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xd97706,
      transparent: true,
      opacity: 0.65,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.y = 0.08;
    spotGroup.add(ringMesh);

    poetrySubGroup.add(spotGroup);

    animatedPoetryBeacons.push({
      seal: sealMesh,
      finial: finialMesh,
      ring: ringMesh,
      baseY: 0.55,
      phase: Math.random() * Math.PI * 2
    });
  });

  poetrySubGroup.visible = !!props.layers?.poetrySpots;
}

// 构建高精度微观盆景切块 (带四壁实心垂直地质切面与三维物理海拔标尺)
const bonsaiRasters = new Map();

function getBonsaiRaster(key) {
  if (!bonsaiRasters.has(key)) {
    const base = import.meta.env.BASE_URL + 'textures/bonsai/' + key;
    const data = Promise.all([
      loadTerrainDem('bonsai/' + key + '_dem.png'),
      fetch(base + '_meta.json').then(response => {
        if (!response.ok) throw new Error('Missing terrain metadata');
        return response.json();
      })
    ]).then(([dem, meta]) => ({ dem, meta })).catch(() => {
      bonsaiRasters.delete(key);
      return null;
    });
    bonsaiRasters.set(key, data);
  }
  return bonsaiRasters.get(key);
}

async function buildBonsaiBlock() {
  const build = ++bonsaiBuild;
  const key = props.activeBonsaiId.replace('bonsai_', '');
  const dataset = await getBonsaiRaster(key);
  if (!dataset || destroyed || build !== bonsaiBuild) return;
  const { dem, meta } = dataset;
  const photo = await loadTerrainTexture('bonsai/' + key + '_sat.jpg', true).catch(() => null);
  if (destroyed || build !== bonsaiBuild) {
    photo?.dispose();
    return;
  }
  const span = 32;
  const resolution = 90;
  const scale = span * props.bonsaiExaggeration / (bonsaiTileWidthKm(key) * 1000);
  const rise = meta.maxElev - meta.minElev;
  const surface = new THREE.PlaneGeometry(span, span, resolution, resolution);
  surface.rotateX(-Math.PI / 2);
  const position = surface.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const column = Math.round((position.getX(i) / span + 0.5) * (dem.width - 1));
    const row = Math.round((position.getZ(i) / span + 0.5) * (dem.height - 1));
    position.setY(i, dem.gray[row * dem.width + column] / 255 * rise * scale);
  }
  surface.computeVertexNormals();
  clearSceneGroup(bonsaiGroup);
  bonsaiGroup.add(new THREE.Mesh(surface, new THREE.MeshStandardMaterial({
    map: photo, color: photo ? 0xffffff : 0xb6a17c, roughness: 1
  })));

  const floor = -1.2;
  const perimeter = [];
  for (let i = 0; i <= resolution; i++) perimeter.push(i);
  for (let i = 1; i <= resolution; i++) perimeter.push(i * (resolution + 1) + resolution);
  for (let i = resolution - 1; i >= 0; i--) perimeter.push(resolution * (resolution + 1) + i);
  for (let i = resolution - 1; i >= 0; i--) perimeter.push(i * (resolution + 1));
  const wall = [];
  for (let i = 1; i < perimeter.length; i++) {
    const a = perimeter[i - 1], b = perimeter[i];
    const ax = position.getX(a), ay = position.getY(a), az = position.getZ(a);
    const bx = position.getX(b), by = position.getY(b), bz = position.getZ(b);
    wall.push(ax, ay, az, ax, floor, az, bx, by, bz, bx, by, bz, ax, floor, az, bx, floor, bz);
  }
  const walls = new THREE.BufferGeometry();
  walls.setAttribute('position', new THREE.Float32BufferAttribute(wall, 3));
  walls.computeVertexNormals();
  const rock = new THREE.MeshStandardMaterial({ color: 0x4e5550, side: THREE.DoubleSide, roughness: 1 });
  bonsaiGroup.add(new THREE.Mesh(walls, rock));
  const slab = new THREE.Mesh(new THREE.BoxGeometry(span + 0.7, 0.7, span + 0.7), rock);
  slab.position.y = floor - 0.35;
  bonsaiGroup.add(slab);

  const left = -span / 2 - 1.6;
  const measureAxis = new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(left, 0, 0), new THREE.Vector3(left, rise * scale, 0)
  ]);
  const axisMaterial = new THREE.LineBasicMaterial({ color: 0xe8c995 });
  bonsaiGroup.add(new THREE.Line(measureAxis, axisMaterial));
  for (const ratio of [0, 0.5, 1]) {
    const y = rise * scale * ratio;
    const elevation = Math.round(meta.minElev + rise * ratio);
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 150;
    labelCanvas.height = 48;
    const label = labelCanvas.getContext('2d');
    label.fillStyle = '#1a3031';
    label.fillRect(0, 0, 150, 48);
    label.font = 'bold 23px system-ui';
    label.textAlign = 'center';
    label.textBaseline = 'middle';
    label.fillStyle = '#fff0ce';
    label.fillText(elevation + ' m', 75, 24);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(labelCanvas) }));
    sprite.position.set(left - 2, y, 0);
    sprite.scale.set(4.6, 1.45, 1);
    bonsaiGroup.add(sprite);
  }
  requestRender();
}

// 盆景重提取缓动动画
const reExtractBonsai = () => {
  if (props.reducedMotion) { requestRender(); return; }
  if (!bonsaiGroup) return;
  gsap.killTweensOf([bonsaiGroup.position, bonsaiGroup.scale]);
  bonsaiGroup.position.y = -15;
  bonsaiGroup.scale.set(0.7, 0.7, 0.7);
  gsap.to(bonsaiGroup.position, {
    y: 0,
    duration: 1.5,
    ease: "power3.out", onUpdate: requestRender
  });
  gsap.to(bonsaiGroup.scale, {
    x: 1, y: 1, z: 1,
    duration: 1.5,
    ease: "power3.out", onUpdate: requestRender
  });
};

// 四大科学实验台深度建模与动态仿真
function buildEvolutionModel() {
  clearSceneGroup(modelGroup);
  loessWaterParticles = null;
  climateNorthParticles = null;
  climateSouthParticles = null;
  globeMesh = null;

  const labId = props.activeLabId || "loess";

  if (labId === "loess") {
    // 1. 黄土高原侵蚀演化 7阶模型
    const size = 32;
    const segs = 64;
    const geo = new THREE.PlaneGeometry(size, size, segs, segs);
    geo.rotateX(-Math.PI / 2);
    updateEvolutionGeometry(geo, props.activeModelStage);

    const mat = new THREE.MeshStandardMaterial({
      color: props.activeModelStage === 7 ? 0x2d6a4f : 0xd97706,
      roughness: 0.85,
      metalness: 0.1,
      flatShading: true
    });
    const evoMesh = new THREE.Mesh(geo, mat);
    evoMesh.receiveShadow = true;
    evoMesh.castShadow = true;
    modelGroup.add(evoMesh);

    const box = new THREE.Mesh(
      new THREE.BoxGeometry(size + 1, 4, size + 1),
      new THREE.MeshStandardMaterial({ color: 0x1f2937 })
    );
    box.position.set(0, -2, 0);
    modelGroup.add(box);

    // 动态水流冲刷粒子 (模拟暴雨侵蚀)
    const pCount = 120;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 26;
      pPos[i * 3 + 1] = 4.5 + Math.random() * 2.5;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 26;
    }
    pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.6, transparent: true, opacity: 0.85 });
    loessWaterParticles = new THREE.Points(pGeo, pMat);
    modelGroup.add(loessWaterParticles);

  } else if (labId === "tectonic") {
    // 2. 秦岭板块造山与渭河地堑三维构造模型
    const size = 34;
    const stage = props.currentTectonicStage || 0;

    const southGeo = new THREE.BoxGeometry(size, 8, 12);
    const southMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
    const southMesh = new THREE.Mesh(southGeo, southMat);
    southMesh.position.set(0, -4, 10);
    modelGroup.add(southMesh);

    const uplift = stage >= 1 ? 16 : 8;
    const qinlingGeo = new THREE.ConeGeometry(8.5, uplift, 4);
    qinlingGeo.rotateY(Math.PI / 4);
    const qinlingMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.45 });
    tectonicQinlingMesh = new THREE.Mesh(qinlingGeo, qinlingMat);
    tectonicQinlingMesh.position.set(0, uplift / 2 - 2, 2);
    modelGroup.add(tectonicQinlingMesh);

    const grabenDrop = stage === 2 ? -3.5 : 0;
    const grabenGeo = new THREE.BoxGeometry(size, 4, 10);
    const grabenMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.75 });
    tectonicGrabenMesh = new THREE.Mesh(grabenGeo, grabenMat);
    tectonicGrabenMesh.position.set(0, -2 + grabenDrop, -10);
    modelGroup.add(tectonicGrabenMesh);

    const fMat = new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 2 });
    const fGeo1 = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-17, 0, -4), new THREE.Vector3(17, 0, -4)]);
    const fGeo2 = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-17, 0, 4), new THREE.Vector3(17, 0, 4)]);
    modelGroup.add(new THREE.Line(fGeo1, fMat));
    modelGroup.add(new THREE.Line(fGeo2, fMat));

  } else if (labId === "climate") {
    // 3. 秦岭一山分南北气候模拟 (动态冷暖气流阻隔粒子系统)
    const wallGeo = new THREE.BoxGeometry(32, 14, 4);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
    const wallMesh = new THREE.Mesh(wallGeo, wallMat);
    wallMesh.position.set(0, 7, 0);
    modelGroup.add(wallMesh);

    const crestLineGeo = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-16, 14.1, 0), new THREE.Vector3(16, 14.1, 0)]);
    modelGroup.add(new THREE.Line(crestLineGeo, new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 3 })));

    const nCount = 160;
    const nGeo = new THREE.BufferGeometry();
    const nPos = new Float32Array(nCount * 3);
    for (let i = 0; i < nCount; i++) {
      nPos[i * 3] = (Math.random() - 0.5) * 28;
      nPos[i * 3 + 1] = Math.random() * 12 + 2;
      nPos[i * 3 + 2] = -Math.random() * 12 - 3;
    }
    nGeo.setAttribute("position", new THREE.BufferAttribute(nPos, 3));
    climateNorthParticles = new THREE.Points(nGeo, new THREE.PointsMaterial({ color: 0x38bdf8, size: 0.75, transparent: true, opacity: 0.85 }));
    modelGroup.add(climateNorthParticles);

    const sCount = 160;
    const sGeo = new THREE.BufferGeometry();
    const sPos = new Float32Array(sCount * 3);
    for (let i = 0; i < sCount; i++) {
      sPos[i * 3] = (Math.random() - 0.5) * 28;
      sPos[i * 3 + 1] = Math.random() * 8 + 2;
      sPos[i * 3 + 2] = Math.random() * 12 + 3;
    }
    sGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
    climateSouthParticles = new THREE.Points(sGeo, new THREE.PointsMaterial({ color: 0x10b981, size: 0.75, transparent: true, opacity: 0.85 }));
    modelGroup.add(climateSouthParticles);

  } else if (labId === "terra") {
    // 4. 地球视角与国家大地原点 (真正三维自转地球仪 + 精准经纬度定位光柱)
    const globeCanvas = document.createElement("canvas");
    globeCanvas.width = 1024;
    globeCanvas.height = 512;
    const gCtx = globeCanvas.getContext("2d");
    gCtx.fillStyle = "#060d1a";
    gCtx.fillRect(0, 0, 1024, 512);

    gCtx.strokeStyle = "rgba(56, 189, 248, 0.25)";
    gCtx.lineWidth = 1;
    for (let x = 0; x <= 1024; x += 64) {
      gCtx.beginPath(); gCtx.moveTo(x, 0); gCtx.lineTo(x, 512); gCtx.stroke();
    }
    for (let y = 0; y <= 512; y += 64) {
      gCtx.beginPath(); gCtx.moveTo(0, y); gCtx.lineTo(1024, y); gCtx.stroke();
    }
    gCtx.strokeStyle = "rgba(56, 189, 248, 0.6)";
    gCtx.beginPath(); gCtx.moveTo(0, 256); gCtx.lineTo(1024, 256); gCtx.stroke();

    gCtx.fillStyle = "rgba(16, 185, 129, 0.45)";
    gCtx.fillRect(780, 150, 100, 70);
    gCtx.fillStyle = "#f59e0b";
    gCtx.fillRect(818, 175, 16, 24);

    const globeTex = new THREE.CanvasTexture(globeCanvas);
    const globeGeo = new THREE.SphereGeometry(14, 48, 48);
    const globeMat = new THREE.MeshStandardMaterial({
      map: globeTex,
      roughness: 0.7,
      metalness: 0.2
    });
    globeMesh = new THREE.Mesh(globeGeo, globeMat);
    modelGroup.add(globeMesh);

    const R = 14;
    const latRad = 34.54 * Math.PI / 180;
    const lonRad = (108.92 - 90) * Math.PI / 180;
    const bx = R * Math.cos(latRad) * Math.sin(lonRad);
    const by = R * Math.sin(latRad);
    const bz = R * Math.cos(latRad) * Math.cos(lonRad);

    const beaconPole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 6),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b })
    );
    beaconPole.position.set(bx, by + 3, bz);
    modelGroup.add(beaconPole);

    const originCanvas = document.createElement("canvas");
    originCanvas.width = 380;
    originCanvas.height = 70;
    const oCtx = originCanvas.getContext("2d");
    oCtx.fillStyle = "rgba(10, 15, 24, 0.9)";
    oCtx.strokeStyle = "#f59e0b";
    oCtx.lineWidth = 2.5;
    oCtx.beginPath(); oCtx.roundRect(4, 4, 372, 62, 12); oCtx.fill(); oCtx.stroke();
    oCtx.fillStyle = "#fef08a";
    oCtx.font = 'bold 22px "Microsoft YaHei", sans-serif';
    oCtx.textAlign = "center"; oCtx.textBaseline = "middle";
    oCtx.fillText("中华人民共和国大地原点", 190, 24);
    oCtx.fillStyle = "#fcd34d";
    oCtx.font = '14px "Microsoft YaHei", sans-serif';
    oCtx.fillText("陕西泾阳永乐镇 · 34°32'N 108°55'E", 190, 48);

    const oSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(originCanvas) }));
    oSprite.position.set(bx, by + 8, bz);
    oSprite.scale.set(16, 3, 1);
    modelGroup.add(oSprite);
  }
}

function updateEvolutionGeometry(geo, stage) {
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    let h = 4.0;
    if (stage === 1) h = 4.0;
    else if (stage === 2) h = 5.0 + Math.sin(x * 0.1) * 0.3;
    else if (stage === 3) h = Math.max(1.0, 5.0 - (Math.sin(x * 1.2) > 0 ? Math.sin(x * 1.2) * 1.5 : 0));
    else if (stage === 4) h = 2.0 + Math.cos(x * 0.6) * 3.5;
    else if (stage === 5) h = 1.5 + Math.sin(x * 0.7) * Math.cos(z * 0.7) * 4.2;
    else if (stage === 6) h = 1.0 + Math.abs(Math.sin(x * 0.9) * Math.cos(z * 0.9)) * 5.5;
    else if (stage === 7) h = Math.floor((1.5 + Math.sin(x * 0.4) * Math.cos(z * 0.4) * 4.0) * 1.5) / 1.5;
    pos.setY(i, h);
  }
  geo.computeVertexNormals();
  geo.attributes.position.needsUpdate = true;
}

// 战役航线动态渲染
function buildCampaignVisuals() {
  clearSceneGroup(campaignGroup);

  if (!props.activeCampaign) return;

  const stage = props.activeCampaign.stages[props.activeCampaignStageIndex] || props.activeCampaign.stages[0];
  if (!stage) return;

  stage.routes.forEach((routePts) => {
    const pts = routePts.map(p => new THREE.Vector3(p[0], p[1] + 1.2, p[2]));
    const curve = new THREE.CatmullRomCurve3(pts);
    const tubeGeo = new THREE.TubeGeometry(curve, 60, 0.4, 8, false);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(stage.routeColor || "#ef4444"),
      emissive: new THREE.Color(stage.routeColor || "#ef4444"),
      emissiveIntensity: 0.95,
      roughness: 0.2
    });
    campaignGroup.add(new THREE.Mesh(tubeGeo, tubeMat));
  });

  stage.checkpoints.forEach((cp) => {
    const cpMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.7, 0.7, 0.4, 16),
      new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xb91c1c, emissiveIntensity: 0.85 })
    );
    cpMesh.position.set(cp.pos[0], cp.pos[1] + 1.5, cp.pos[2]);
    campaignGroup.add(cpMesh);
  });
}


// 投影 POI 屏幕空间坐标并执行严密的空间碰撞避让与全息引线解算 (彻底告别文字重叠)
const coordVector = new THREE.Vector3();
const cameraDirection = new THREE.Vector3();
let screenBounds = null;

function screenPosition(x, y, z) {
  coordVector.set(x, y, z).project(camera);
  return {
    x: (coordVector.x * 0.5 + 0.5) * containerRef.value.clientWidth,
    y: (0.5 - coordVector.y * 0.5) * containerRef.value.clientHeight,
    visible: coordVector.z > -1 && coordVector.z < 1
  };
}

function insideMap(point, margin = 0) {
  return point.visible && screenBounds && point.x > screenBounds.left + margin && point.x < screenBounds.right - margin
    && point.y > screenBounds.top + margin && point.y < screenBounds.bottom - margin;
}

function updatePoiScreenPositions() {
  const width = containerRef.value.clientWidth;
  if (props.currentMode === 'campaign') {
    const stage = props.activeCampaign?.stages[props.activeCampaignStageIndex];
    screenCheckpoints.value = (stage?.checkpoints || []).map(cp => ({
      ...cp, ...screenPosition(cp.pos[0], cp.pos[1] + 2, cp.pos[2])
    }));
    return;
  }
  if (props.currentMode !== 'macro') return;

  const focusIds = props.guideLabels;
  const distance = camera.position.distanceTo(controls.target);
  const used = [];
  const places = [];
  const fontWidth = width <= 760 ? 11 : 13;
  if (terrainSurface && props.layers.pois) {
    const keep = poi => focusIds ? focusIds.includes(poi.id) : distance < 97 || corePlaces.has(poi.id) || poi.id === selectedPoiId.value;
    const priority = poi => poi.id === selectedPoiId.value ? 0 : corePlaces.has(poi.id) ? 1 : 2;
    const candidates = POI_LIST.filter(keep).sort((a, b) => priority(a) - priority(b));
    for (const poi of candidates) {
      const data = REAL_POIS.find(item => item.id === poi.id) || poi;
      const [x, , z] = data.pos;
      const y = getTerrainHeightAt(x, z) + 0.45;
      const point = screenPosition(x, y, z);
      if (!insideMap(point, 1)) continue;
      const label = shortNames[poi.id] || poi.name;
      const labelWidth = label.length * fontWidth + 34;
      const left = point.x + 6 + labelWidth > screenBounds.right;
      const labelX = left ? point.x - labelWidth - 6 : point.x + 5;
      const labelY = point.y - 15;
      if (used.some(other => labelX < other.right && labelX + labelWidth > other.left && Math.abs(labelY - other.top) < 26)) continue;
      used.push({ left: labelX, right: labelX + labelWidth, top: labelY });
      places.push({ ...poi, pos: [x, y, z], label, style: { left: labelX + 'px', top: labelY + 'px' } });
    }
  }
  screenPois.value = places;

  const labels = [];
  if (props.guideStep === 3) {
    for (const [id, points] of Object.entries(REAL_RIVERS)) {
      const text = { wei_river: '渭河 →', han_river: '汉江 →', yellow_river: '黄河' }[id];
      if (!text) continue;
      const [x, , z] = points[id === 'wei_river' ? 2 : Math.floor(points.length / 2)];
      const point = screenPosition(x, getTerrainHeightAt(x, z) + 0.65, z);
      if (insideMap(point, 15)) {
        const overlap = used.some(box => point.x + 49 > box.left && point.x < box.right && Math.abs(point.y - box.top) < 26);
        labels.push({ id, role: 'water-label', text, style: { left: point.x + 'px', top: (point.y + (overlap ? 27 : 0)) + 'px' } });
      }
    }
  } else if (props.layers.qinlingLine && focusIds) {
    const x = -6.5, z = 22.4;
    const point = screenPosition(x, getTerrainHeightAt(x, z) + 0.6, z);
    if (insideMap(point, 32)) labels.push({ id: 'ridge', role: 'ridge-label', text: '秦岭主脊（示意）',
      style: { left: point.x + 'px', top: point.y + 'px' } });
  }
  sceneLabels.value = labels;
}

function cancelMotion() {
  cameraTween?.kill();
  cameraTween = null;
  stop360Spin();
}

function flyTo(pos, target, duration = 1.25) {
  if (!camera || !controls) return;
  cancelMotion();
  if (props.reducedMotion || duration <= 0) {
    camera.position.fromArray(pos);
    controls.target.fromArray(target);
    controls.update();
    requestRender();
    return;
  }
  const startPos = camera.position.clone();
  const startTarget = controls.target.clone();
  const endPos = new THREE.Vector3().fromArray(pos);
  const endTarget = new THREE.Vector3().fromArray(target);
  const progress = { t: 0 };
  cameraTween = gsap.to(progress, {
    t: 1,
    duration,
    ease: 'power2.inOut',
    onUpdate() {
      camera.position.lerpVectors(startPos, endPos, progress.t);
      controls.target.lerpVectors(startTarget, endTarget, progress.t);
      requestRender();
    },
    onComplete() { cameraTween = null; }
  });
}

function applyCameraRequest(request, immediate = false) {
  if (!request || !controls) return;
  updateCameraViewportOffset();
  let target = request.target;
  let position = request.pos;
  if (request.ground && terrainSurface) {
    const offset = getTerrainHeightAt(target[0], target[2]) + 0.6 - target[1];
    position = [position[0], position[1] + offset, position[2]];
    target = [target[0], target[1] + offset, target[2]];
  }
  if (request.fit && screenBounds) position = fitProvince(position, target);
  flyTo(position, target, immediate ? 0 : request.duration);
}

function fitProvince(position, target) {
  const trial = camera.clone();
  const center = new THREE.Vector3().fromArray(target);
  const direction = new THREE.Vector3().fromArray(position).sub(center);
  const projected = new THREE.Vector3();
  const { clientWidth: width, clientHeight: height } = containerRef.value;
  const centerX = (screenBounds.left + screenBounds.right) / 2;
  const centerY = (screenBounds.top + screenBounds.bottom) / 2;
  const availableX = (screenBounds.right - screenBounds.left) / 2 - 9;
  const availableY = (screenBounds.bottom - screenBounds.top) / 2 - 18;
  const samples = CITY_BOUNDARIES.flatMap(city => city.rings.flatMap(ring => ring.filter((_, i) => i % 3 === 0)));
  let scale = 1;
  for (let pass = 0; pass < 4; pass++) {
    trial.position.copy(center).addScaledVector(direction, scale);
    trial.lookAt(center);
    trial.updateMatrixWorld();
    let ratio = 0;
    for (const [x, , z] of samples) {
      projected.set(x, getTerrainHeightAt(x, z), z).project(trial);
      const px = (projected.x * 0.5 + 0.5) * width;
      const py = (0.5 - projected.y * 0.5) * height;
      ratio = Math.max(ratio, Math.abs(px - centerX) / Math.max(1, availableX),
        Math.abs(py - centerY) / Math.max(1, availableY));
    }
    if (ratio > 0.87 && ratio < 0.99) break;
    scale = THREE.MathUtils.clamp(scale * ratio * 1.06, 0.74, 1.85);
  }
  return center.clone().addScaledVector(direction, scale).toArray();
}

function getCameraState() {
  if (controls && camera) return { pos: camera.position.toArray(), target: controls.target.toArray(), duration: 0.8 };
  return null;
}

const onPoiClick = (poi) => {
  if (isSelecting.value) return;
  selectedPoiId.value = poi.id;
  if (props.guideStep < 0) emit('select-poi', poi);
  const [x, y, z] = poi.pos;
  flyTo([x + 6, y + 19, z + 25], [x, y, z], 1.1);
};

const resetNorth = () => {
  if (isSpinning360.value) stop360Spin();
  if (!camera || !controls) return;
  const dist = camera.position.distanceTo(controls.target);
  flyTo([controls.target.x, controls.target.y + dist * 0.6, controls.target.z + dist * 0.8], [controls.target.x, controls.target.y, controls.target.z], 1.2);
};

// 🔄 鼠标中键 / UI 触发全景 360 度环绕平滑自转演练
const start360Spin = (duration = 7.0) => {
  if (isSpinning360.value) {
    stop360Spin();
    return;
  }
  if (!camera || !controls || isSelecting.value || props.reducedMotion || props.guideStep >= 0) return;
  cancelMotion();
  isSpinning360.value = true;
  if (soundscape && soundscape.playBeaconChime) soundscape.playBeaconChime();
  emit('spin-360-status', true);

  const target = controls.target.clone();
  const offset = camera.position.clone().sub(target);
  const radius = offset.length();
  const initialTheta = Math.atan2(offset.x, offset.z);
  const phi = Math.acos(Math.max(-1, Math.min(1, offset.y / radius)));

  controls.enabled = false;

  const spinObj = { progress: 0 };
  spinTween = gsap.to(spinObj, {
    progress: 1.0,
    duration: duration,
    ease: "power2.inOut",
    onUpdate: () => {
      const curTheta = initialTheta + spinObj.progress * Math.PI * 2;
      camera.position.x = target.x + radius * Math.sin(phi) * Math.sin(curTheta);
      camera.position.y = target.y + radius * Math.cos(phi);
      camera.position.z = target.z + radius * Math.sin(phi) * Math.cos(curTheta);
      camera.lookAt(target);
      controls.target.copy(target);
      requestRender();
    },
    onComplete: () => {
      stop360Spin();
    }
  });
};

const stop360Spin = () => {
  if (spinTween) {
    spinTween.kill();
    spinTween = null;
  }
  if (isSpinning360.value) {
    isSpinning360.value = false;
    if (controls) {
      controls.enabled = true;
      controls.update();
    }
    emit('spin-360-status', false);
  }
};

const toggle360Spin = () => {
  if (isSpinning360.value) {
    stop360Spin();
  } else {
    start360Spin();
  }
};

function setLighting(mode) {
  if (!sunLight || !skyFillLight) return;
  const lighting = {
    dawn: { at: [-76, 77, -32], tint: 0xffd7a0, strength: 2.0, sky: 0xbad6e6, backdrop: 0x15282e },
    noon: { at: [-82, 108, -54], tint: 0xfff8e9, strength: 2.45, sky: 0xe2eee6, backdrop: 0x122d33 },
    sunset: { at: [-85, 34, 16], tint: 0xffb582, strength: 2.18, sky: 0x8398bc, backdrop: 0x232831 },
    night: { at: [26, 63, -52], tint: 0x8eb8ee, strength: 0.53, sky: 0x88a6be, backdrop: 0x081421 }
  };
  const choice = lighting[mode] || lighting.noon;
  sunLight.position.fromArray(choice.at);
  sunLight.color.setHex(choice.tint);
  sunLight.intensity = choice.strength;
  skyFillLight.color.setHex(choice.sky);
  scene.background.setHex(choice.backdrop);
  scene.fog.color.setHex(choice.backdrop);
  if (mode === 'night' && !starfieldMesh) buildStarfield();
  if (starfieldMesh) starfieldMesh.visible = mode === 'night';
  requestRender();
}

function updateCameraViewportOffset() {
  const container = containerRef.value?.getBoundingClientRect();
  if (!camera || !container?.width || !container.height) return;
  const view = props.safeFrame?.getBoundingClientRect();
  const { width, height } = container;
  screenBounds = view?.width > 24 && view.height > 24 ? {
    left: Math.max(0, view.left - container.left),
    right: Math.min(width, view.right - container.left),
    top: Math.max(0, view.top - container.top),
    bottom: Math.min(height, view.bottom - container.top)
  } : { left: 12, right: width - 12, top: 18, bottom: height - 18 };
  const x = (screenBounds.left + screenBounds.right - width) / 2;
  const y = (screenBounds.top + screenBounds.bottom - height) / 2;
  camera.setViewOffset(width, height, -x, -y, width, height);
  camera.updateProjectionMatrix();
  requestRender();
}

function onWindowResize() {
  if (!containerRef.value || !renderer || !camera) return;
  const { clientWidth: width, clientHeight: height } = containerRef.value;
  if (!width || !height) return;
  applyResponsiveCameraFov(width, height);
  if (renderer.domElement.style.width !== width + 'px' || renderer.domElement.style.height !== height + 'px') {
    renderer.setSize(width, height);
  }
  updateCameraViewportOffset();
}

function requestRender() {
  if (!animFrameId && renderer && status !== 'static' && !document.hidden && !props.isPortalActive && !destroyed) {
    animFrameId = requestAnimationFrame(animate);
  }
}

function animate(now) {
  animFrameId = null;
  if (document.hidden || props.isPortalActive || status === 'static') return;
  const delta = Math.max(0.25, Math.min(2, lastFrameTime ? (now - lastFrameTime) / (1000 / 60) : 1));
  lastFrameTime = now;
  controls.update();

  const isMacro = props.currentMode === 'macro';
  const moving = !props.reducedMotion;
  if (isMacro && terrainSurface) {
    const showCityModels = !props.guideLabels && props.layers.pois && camera.position.distanceTo(controls.target) < 66;
    if (showCityModels && !renderedLayers.has('cities')) {
      buildProceduralCities();
      renderedLayers.add('cities');
    }
    citiesSubGroup.visible = showCityModels;
  }
  if (isMacro && moving) {
    if (valleyMistGroup.visible && animatedValleyMist.length) {
      for (const mist of animatedValleyMist) {
        const phase = now * 0.0008 + mist.phase;
        mist.mesh.position.set(mist.baseX + Math.sin(phase) * 1.5, mist.baseY + Math.sin(phase * 1.5) * 0.25,
          mist.baseZ + Math.cos(phase * 0.8) * 1.2);
      }
      requestRender();
    }
    if (winterSnowParticles?.visible) {
      const { position, velocity } = winterSnowParticles.geometry.attributes;
      for (let i = 0; i < velocity.count; i++) {
        const y = position.getY(i) - velocity.getX(i) * delta;
        position.setY(i, y < 1 ? 45 : y);
      }
      position.needsUpdate = true;
      requestRender();
    }
  }
  if (props.currentMode === 'model' && moving) {
    if (globeMesh) globeMesh.rotation.y += 0.003 * delta;
    if (loessWaterParticles) moveModelParticles(loessWaterParticles, 1, -0.05 * delta, 1, 6);
    if (climateNorthParticles) moveModelParticles(climateNorthParticles, 2, 0.08 * delta, 0, -14);
    if (climateSouthParticles) moveModelParticles(climateSouthParticles, 2, -0.07 * delta, 2, 14);
    if (globeMesh || loessWaterParticles || climateNorthParticles || climateSouthParticles) requestRender();
  }
  if (fpvActive && !fpvPaused && fpvCurve) {
    fpvProgress = Math.min(1, fpvProgress + fpvSpeed * delta);
    const pos = fpvCurve.getPointAt(fpvProgress);
    const look = fpvCurve.getPointAt(Math.min(0.9999, fpvProgress + 0.04));
    camera.position.set(pos.x, Math.max(pos.y, getTerrainHeightAt(pos.x, pos.z)) + 2.2, pos.z);
    controls.target.set(look.x, Math.max(look.y, getTerrainHeightAt(look.x, look.z)) + 1.2, look.z);
    camera.lookAt(controls.target);
    const index = Math.min(fpvWaypoints.length - 1, Math.floor(fpvProgress * (fpvWaypoints.length - 1)));
    fpvCallback?.onProgress?.(fpvProgress, sampleElevation(demRaster, pos.x, pos.z), fpvWaypoints[index]);
    if (fpvProgress >= 1) {
      stopFPVFlight();
    } else requestRender();
  }
  soundscape.updateCameraSpatial(camera.position, controls.target, fpvActive ? 2.5 : 0);
  camera.updateMatrixWorld();
  camera.getWorldDirection(cameraDirection);
  const readout = {
    pitch: Math.round(Math.abs(Math.asin(THREE.MathUtils.clamp(cameraDirection.y, -1, 1))) * 180 / Math.PI),
    azimuth: (Math.round(Math.atan2(-cameraDirection.x, -cameraDirection.z) * 180 / Math.PI) + 360) % 360
  };
  if (readout.pitch !== lastCameraReadout?.pitch || readout.azimuth !== lastCameraReadout?.azimuth) {
    lastCameraReadout = readout;
    emit('camera-update', readout);
  }
  updatePoiScreenPositions();
  renderer.render(scene, camera);
}

function moveModelParticles(points, axis, delta, limit, restart) {
  const positions = points.geometry.attributes.position;
  for (let i = axis; i < positions.array.length; i += 3) {
    const next = positions.array[i] + delta;
    positions.array[i] = (delta < 0 ? next < limit : next > limit) ? restart : next;
  }
  positions.needsUpdate = true;
}

function onVisibility() {
  if (document.hidden) {
    cancelMotion();
    if (fpvActive) stopFPVFlight(false);
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  } else {
    lastFrameTime = 0;
    requestRender();
  }
}

function applyMode(mode) {
  if (!macroGroup) return;
  macroGroup.visible = mode === 'macro' || mode === 'campaign';
  bonsaiGroup.visible = mode === 'bonsai';
  modelGroup.visible = mode === 'model';
  campaignGroup.visible = mode === 'campaign';
  if (mode === 'bonsai') {
    flyTo([21, 42, 54], [0, 9, 0], 1.2);
    buildBonsaiBlock();
  } else if (mode === 'model') {
    flyTo([0, 32, 45], [0, 4, 0], 1.2);
    buildEvolutionModel();
  } else if (mode === 'campaign' && props.activeCampaign) {
    const { pos, target } = props.activeCampaign.camera;
    flyTo(pos, target, 1.2);
    buildCampaignVisuals();
  }
  requestRender();
}

function syncLayers() {
  if (!terrainSurface) return;
  const definitions = [
    ['border', borderSubGroup, buildShaanxiBorder],
    ['rivers', riversSubGroup, buildRivers],
    ['qinlingLine', qinlingSubGroup, buildQinlingLine],
    ['silkRoad', silkRoadSubGroup, buildSilkRoad],
    ['shuRoads', shuRoadsSubGroup, buildHistoricalRoads],
    ['qinZhiDao', qinZhiDaoSubGroup, buildHistoricalRoads],
    ['poetrySpots', poetrySubGroup, buildPoetrySpots],
    ['cultural', culturalSubGroup, buildCulturalHotspots],
    ['valleyMist', valleyMistGroup, buildValleyMist]
  ];
  for (const [name, group, build] of definitions) {
    group.visible = !!props.layers[name];
    if (group.visible && !renderedLayers.has(name)) {
      build();
      renderedLayers.add(name);
      if (name === 'shuRoads' || name === 'qinZhiDao') {
        renderedLayers.add('shuRoads');
        renderedLayers.add('qinZhiDao');
      }
    }
  }
  requestRender();
}

function syncProvinceView() {
  if (!terrainSurface) return;
  const clipped = !!terrainSurface.mask && props.guideStep === 0;
  terrainUniforms.provinceView.value = Number(clipped);
  terrainSurface.base.visible = !clipped;
  terrainSurface.skirt.visible = !clipped;
  requestRender();
}

function setGisMode(mode) {
  const styles = { natural: 0, hypsometric: 1, slope: 2, ink: 3 };
  terrainUniforms.mapStyle.value = styles[mode] ?? 0;
  requestRender();
}

watch(() => props.layers, syncLayers, { deep: true });
watch(() => props.currentMode, applyMode);
watch(() => props.cameraRequest, request => applyCameraRequest(request), { flush: 'post' });
watch(() => props.safeFrame, (frame, previous) => {
  if (previous) viewportObserver?.unobserve(previous);
  if (frame) viewportObserver?.observe(frame);
  updateCameraViewportOffset();
});
watch(() => props.isPortalActive, (portal) => {
  if (portal) cancelMotion();
  else { onWindowResize(); requestRender(); }
});
watch(() => props.gisMode, setGisMode);
watch(() => props.history, (history) => { terrainUniforms.historyMix.value = Number(history); requestRender(); });
watch(() => props.guideStep, syncProvinceView);
watch(() => [props.guideLabels, props.isProfileVisible], requestRender);
watch(() => props.reducedMotion, () => { cancelMotion(); requestRender(); });

// 盆景参数监听
watch([() => props.activeBonsaiId, () => props.bonsaiExaggeration], () => {
  if (props.currentMode === "bonsai") {
    buildBonsaiBlock();
  }
});

// 实验台状态监听
watch([() => props.activeLabId, () => props.currentTectonicStage, () => props.activeModelStage], () => {
  if (props.currentMode === "model") {
    buildEvolutionModel();
    requestRender();
  }
});

// 战役监听
watch([() => props.activeCampaign, () => props.activeCampaignStageIndex], () => {
  if (props.currentMode === "campaign") {
    buildCampaignVisuals();
    requestRender();
  }
});

// 光照监听
watch(() => props.lightingMode, (mode) => {
  setLighting(mode);
});

onMounted(initThree);

onBeforeUnmount(() => {
  destroyed = true;
  cancelAnimationFrame(animFrameId);
  cancelMotion();
  viewportObserver?.disconnect();
  if (bonsaiGroup) gsap.killTweensOf([bonsaiGroup.position, bonsaiGroup.scale]);
  document.removeEventListener('visibilitychange', onVisibility);
  if (controls) {
    controls.removeEventListener('change', requestRender);
    controls.dispose();
  }
  if (renderer) {
    clearSceneGroup(scene);
    terrainSurface?.mask?.dispose();
    renderer.dispose();
  }
});

// 构建人文风物地标 (非遗/美食/戏曲 - 高阶三维流光灵境，根除粗糙 Sprite 灰色圆盘)
function buildCulturalHotspots() {
  clearSceneGroup(culturalSubGroup);

  CULTURAL_ITEMS.forEach((item, idx) => {
    const cultGroup = new THREE.Group();
    cultGroup.position.set(item.pos[0], item.pos[1], item.pos[2]);

    // 1. 纤细立柱
    const stemGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.4, 8);
    const stemMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.9,
      roughness: 0.2
    });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 0.7;
    cultGroup.add(stem);

    // 2. 悬浮旋转金环 (Floating Torus Halo)
    const ringGeo = new THREE.TorusGeometry(0.36, 0.035, 12, 32);
    ringGeo.rotateX(Math.PI / 2);
    const ringMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.95,
      metalness: 0.9,
      roughness: 0.2
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.y = 1.4;
    cultGroup.add(ringMesh);

    // 3. 环中旋转金石晶核 (Octahedron Jewel Core)
    const coreGeo = new THREE.OctahedronGeometry(0.20, 0);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xf59e0b,
      emissiveIntensity: 1.1,
      metalness: 0.8,
      roughness: 0.2
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreMesh.position.y = 1.4;
    cultGroup.add(coreMesh);

    // 4. 地面微金光圈
    const gRingGeo = new THREE.RingGeometry(0.14, 0.32, 24);
    gRingGeo.rotateX(-Math.PI / 2);
    const gRingMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, transparent: true, opacity: 0.65, side: THREE.DoubleSide });
    const gRing = new THREE.Mesh(gRingGeo, gRingMat);
    gRing.position.y = 0.04;
    cultGroup.add(gRing);

    cultGroup.userData = { culturalItem: item };
    culturalSubGroup.add(cultGroup);
  });
}

// 射线碰撞与空间交互逻辑 (剖面测绘、挑战答题、风物点击)
const raycaster = new THREE.Raycaster();
const pointerVec = new THREE.Vector2();
const pointers = new Set();
let profilingPoints = [];
let primaryDown = null;

function hitTerrain() {
  return terrainMesh ? raycaster.intersectObject(terrainMesh)[0]?.point : null;
}

function dispatchMapPoint(point) {
  if (props.isGuidePicking) emit('guide-point', { x: point.x, z: point.z });
  else if (props.isProbing) readPoint(point);
  else if (props.isChallengeActive) emit('challenge-click', point.toArray());
  else if (props.isProfilingActive) handleProfilingHit(point);
  else if (props.isRoadbookActive) emit('roadbook-point-added', {
    x: point.x, y: point.y, z: point.z, elevationM: sampleElevation(demRaster, point.x, point.z),
    ...unprojectWorld(point.x, point.z)
  });
}

function handlePrimaryCanvasTap(event) {
  if (props.currentMode !== 'macro') return;
  const rect = renderer.domElement.getBoundingClientRect();
  pointerVec.set((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2);
  raycaster.setFromCamera(pointerVec, camera);
  if (isSelecting.value) {
    const point = hitTerrain();
    if (point) dispatchMapPoint(point);
    return;
  }
  for (const [key, group, eventName] of [
    ['culturalItem', culturalSubGroup, 'select-culture'],
    ['poetrySpot', poetrySubGroup, 'select-poetry']
  ]) {
    if (!group.visible) continue;
    const hit = raycaster.intersectObjects(group.children, true)[0];
    if (!hit) continue;
    let node = hit.object;
    while (node.parent && !node.userData[key]) node = node.parent;
    if (node.userData[key]) {
      emit(eventName, node.userData[key]);
      break;
    }
  }
}

function onCanvasPointerDown(event) {
  const hadSpin = isSpinning360.value;
  cancelMotion();
  if (event.button === 1) {
    event.preventDefault();
    middleDownPos = { x: event.clientX, y: event.clientY, time: performance.now(), hadSpin };
    return;
  }
  pointers.add(event.pointerId);
  if (pointers.size === 1 && (event.button === 0 || event.pointerType === 'touch')) {
    primaryDown = { id: event.pointerId, x: event.clientX, y: event.clientY, time: performance.now() };
  } else primaryDown = null;
}

function resetPointerGesture(event) {
  pointers.delete(event.pointerId);
  primaryDown = null;
}

function onCanvasPointerUp(event) {
  if (event.button === 1) {
    event.preventDefault();
    const distance = Math.hypot(event.clientX - middleDownPos.x, event.clientY - middleDownPos.y);
    if (!middleDownPos.hadSpin && distance < 6 && performance.now() - middleDownPos.time < 500) start360Spin();
    return;
  }
  pointers.delete(event.pointerId);
  if (!primaryDown || primaryDown.id !== event.pointerId) return;
  const distance = Math.hypot(event.clientX - primaryDown.x, event.clientY - primaryDown.y);
  const elapsed = performance.now() - primaryDown.time;
  primaryDown = null;
  if (distance < 10 && elapsed < 500) handlePrimaryCanvasTap(event);
  else emit('map-gesture');
}

const onAuxClick = (event) => {
  if (event.button === 1) event.preventDefault();
};

function onCanvasWheel() {
  cancelMotion();
  emit('map-gesture');
}

function readPoint(point) {
  const { lon, lat } = unprojectWorld(point.x, point.z);
  const elevation = sampleElevation(demRaster, point.x, point.z);
  terrainReticleMesh.position.copy(point);
  terrainReticleMesh.position.y += 0.16;
  terrainReticleMesh.visible = true;
  emit('geo-telemetry', {
    lng: lon.toFixed(4) + '°E',
    lat: lat.toFixed(4) + '°N',
    elevation: elevation === null ? null : Math.round(elevation / 10) * 10,
    region: boundaries ? (findShaanxiCity(lon, lat, boundaries) || '省外范围') : '行政区数据未载入'
  });
  requestRender();
}

function pickMapCenter() {
  if (!controls || !terrainSurface || !isSelecting.value) return;
  const { x, z } = controls.target;
  if (Math.abs(x) > TERRAIN_EXTENT.width / 2 || Math.abs(z) > TERRAIN_EXTENT.depth / 2) return;
  dispatchMapPoint(new THREE.Vector3(x, getTerrainHeightAt(x, z), z));
}

function focusMap() {
  renderer?.domElement.focus({ preventScroll: true });
}

function onMapKeydown(event) {
  if (event.key === 'Enter') {
    pickMapCenter();
    return;
  }
  const change = { ArrowUp: [0, -2], ArrowDown: [0, 2], ArrowLeft: [-2, 0], ArrowRight: [2, 0] }[event.key];
  if (!change) return;
  event.preventDefault();
  cancelMotion();
  const offset = new THREE.Vector3(change[0], 0, change[1]);
  camera.position.add(offset);
  controls.target.add(offset);
  emit('map-gesture');
  requestRender();
}

function makeMarker(color, radius) {
  const ring = new THREE.RingGeometry(radius * 0.75, radius, 25);
  ring.rotateX(-Math.PI / 2);
  const pin = new THREE.Mesh(ring, new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
  macroGroup.add(pin);
  return pin;
}

function positionMarker(marker, point) {
  marker.visible = !!point;
  if (point) marker.position.set(point.x, getTerrainHeightAt(point.x, point.z) + 0.40, point.z);
  requestRender();
}

function setGuidePoint(point) {
  if (!macroGroup) return;
  if (!guideMarker) guideMarker = makeMarker(0xffda8b, 1.05);
  positionMarker(guideMarker, point);
}

function setProfileCursor(point) {
  if (!macroGroup) return;
  if (!cursorMarker) cursorMarker = makeMarker(0xffdf9e, 0.85);
  positionMarker(cursorMarker, point);
}

function drawProfile(start, end) {
  if (!profilingMeasureGroup || !demRaster) return null;
  const result = makeElevationProfile(demRaster, start, end);
  if (!result) return null;
  clearSceneGroup(profilingMeasureGroup);
  const points = result.points.map(({ x, z }) => new THREE.Vector3(x, getTerrainHeightAt(x, z) + 0.28, z));
  const route = new THREE.CatmullRomCurve3(points);
  const material = new THREE.MeshBasicMaterial({ color: 0xf0cd8b });
  profilingMeasureGroup.add(new THREE.Mesh(new THREE.TubeGeometry(route, points.length, 0.10, 5, false), material));
  for (const point of [points[0], points.at(-1)]) {
    const endMarker = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 6), material);
    endMarker.position.copy(point);
    profilingMeasureGroup.add(endMarker);
  }
  requestRender();
  return result;
}

function handleProfilingHit(point) {
  if (!demRaster) return;
  if (profilingPoints.length !== 1) {
    clearProfiling();
    profilingPoints.push(point.clone());
    const marker = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 6), new THREE.MeshBasicMaterial({ color: 0xf0cd8b }));
    marker.position.copy(point);
    marker.position.y += 0.28;
    profilingMeasureGroup.add(marker);
    emit('profile-step', 2);
    requestRender();
    return;
  }
  const result = drawProfile(profilingPoints[0], point);
  if (!result) return;
  profilingPoints.push(point.clone());
  emit('profile-calculated', result);
}

function clearProfiling() {
  profilingPoints = [];
  clearSceneGroup(profilingMeasureGroup);
  setProfileCursor(null);
  emit('profile-step', 1);
  requestRender();
}

watch(() => props.isProbing, (probing) => {
  if (!probing && terrainReticleMesh) {
    terrainReticleMesh.visible = false;
    requestRender();
  }
});

const captureSnapshot = () => {
  if (!renderer || status === 'static') return '';
  renderer.render(scene, camera);
  return renderer.domElement.toDataURL('image/png');
};

// 电影巡航平滑运镜
const flyToWaypoint = (wp) => {
  if (!wp || !wp.camera) return;
  flyTo(wp.camera.pos, wp.camera.target, wp.camera.duration || 3.5);
};

// 获取地形 (x, z) 处物理高度
function getTerrainHeightAt(x, z) {
  return surfaceHeightAt(terrainSurface, x, z);
}

function buildWinterSnowParticles() {
  if (winterSnowParticles || !macroGroup) return;
  const count = 1200;
  const snowGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const velocities = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 80;      // x: -40 ~ 40
    positions[i * 3 + 1] = Math.random() * 45 + 5;     // y: 5 ~ 50
    positions[i * 3 + 2] = (Math.random() - 0.5) * 140; // z: -70 ~ 70
    velocities[i] = Math.random() * 0.12 + 0.05;
  }

  snowGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  snowGeo.setAttribute('velocity', new THREE.BufferAttribute(velocities, 1));

  const snowMat = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.65,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  winterSnowParticles = new THREE.Points(snowGeo, snowMat);
  winterSnowParticles.visible = false;
  macroGroup.add(winterSnowParticles);
}

function setSeason(seasonId) {
  terrainUniforms.seasons.value = seasonCodeMap[seasonId] ?? 0;
  if (seasonId === 'winter' && !winterSnowParticles && macroGroup) buildWinterSnowParticles();
  if (winterSnowParticles) winterSnowParticles.visible = seasonId === 'winter' && !props.reducedMotion;
  requestRender();
}

watch(() => props.seasonMode, setSeason);
watch(() => props.reducedMotion, () => setSeason(props.seasonMode));

// 3D 路书绘制与清理
function clearRoadbook() {
  clearSceneGroup(roadbookGroup);
  currentRoadbookRoute = null;
  requestRender();
}

function drawRoadbookRoute(route) {
  clearRoadbook();
  if (!route || !route.waypoints || route.waypoints.length < 2) return;
  currentRoadbookRoute = route;
  requestRender();

  if (!roadbookGroup) {
    roadbookGroup = new THREE.Group();
    macroGroup.add(roadbookGroup);
  }

  const pts = route.waypoints.map(wp => {
    const px = wp.pos[0];
    const pz = wp.pos[2];
    const py = getTerrainHeightAt(px, pz) + 0.45;
    return new THREE.Vector3(px, py, pz);
  });

  const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.25);
  const tubeGeo = new THREE.TubeGeometry(curve, 160, 0.25, 8, false);
  const tubeMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.9,
    roughness: 0.25,
    metalness: 0.6
  });
  const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
  roadbookGroup.add(tubeMesh);

  // 标绘各站点立体道钉与地面光环
  route.waypoints.forEach((wp, idx) => {
    const pt = pts[idx];
    const isFirst = idx === 0;
    const isLast = idx === route.waypoints.length - 1;
    const colHex = isFirst ? 0x10b981 : isLast ? 0xef4444 : 0xf59e0b;
    const emHex = isFirst ? 0x059669 : isLast ? 0xb91c1c : 0xd97706;

    const pinGeo = new THREE.CylinderGeometry(0.1, 0.1, 2.8, 12);
    const pinMat = new THREE.MeshStandardMaterial({ color: colHex, emissive: emHex, emissiveIntensity: 0.8 });
    const pin = new THREE.Mesh(pinGeo, pinMat);
    pin.position.set(pt.x, pt.y + 1.4, pt.z);
    roadbookGroup.add(pin);

    const sphereGeo = new THREE.SphereGeometry(0.35, 16, 16);
    const sphere = new THREE.Mesh(sphereGeo, pinMat);
    sphere.position.set(pt.x, pt.y + 2.8, pt.z);
    roadbookGroup.add(sphere);

    const ringGeo = new THREE.RingGeometry(0.5, 0.75, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({ color: colHex, transparent: true, opacity: 0.7, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.set(pt.x, pt.y - 0.35, pt.z);
    roadbookGroup.add(ring);
  });
}

// 🚀 FPV 低空贴地飞行控制
function startFPVFlight(options) {
  if (!controls || !terrainSurface || props.reducedMotion) return;
  const route = options.route || currentRoadbookRoute;
  if (!route || !route.waypoints || route.waypoints.length < 2) return;

  preFpvCameraState = {
    pos: camera.position.clone(),
    target: controls.target.clone()
  };

  const pts = route.waypoints.map(wp => {
    const px = wp.pos[0];
    const pz = wp.pos[2];
    const py = getTerrainHeightAt(px, pz);
    return new THREE.Vector3(px, py, pz);
  });

  fpvCurve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.25);
  fpvWaypoints = route.waypoints;
  fpvProgress = 0;
  fpvSpeed = 0.00065;
  fpvPaused = false;
  cancelMotion();
  fpvActive = true;
  requestRender();
  fpvCallback = options;

  controls.enabled = false;
}

function stopFPVFlight(restore = true) {
  if (!fpvActive) return;
  fpvActive = false;
  fpvPaused = false;
  fpvCallback?.onComplete?.();
  fpvCallback = null;
  requestRender();
  controls.enabled = true;
  if (restore && preFpvCameraState) {
    flyTo(
      [preFpvCameraState.pos.x, preFpvCameraState.pos.y, preFpvCameraState.pos.z],
      [preFpvCameraState.target.x, preFpvCameraState.target.y, preFpvCameraState.target.z],
      1.5
    );
  }
}

function setFPVPaused(paused) {
  fpvPaused = paused;
  lastFrameTime = 0;
  requestRender();
}

function setFPVSpeed(multiplier) {
  fpvSpeed = 0.00065 * multiplier;
}

defineExpose({
  flyTo, getCameraState, cancelMotion, pickMapCenter, focusMap, setGuidePoint, drawProfile, setProfileCursor,
  resetNorth,
  setLighting,
  reExtractBonsai,
  clearProfiling,
  captureSnapshot,
  flyToWaypoint,
  drawRoadbookRoute,
  clearRoadbook,
  startFPVFlight,
  stopFPVFlight,
  setFPVPaused,
  setFPVSpeed,
  setSeason,
  setGisMode,
  start360Spin,
  stop360Spin,
  toggle360Spin
});
</script>

<style scoped>
.canvas-container { position: absolute; inset: 0; width: 100%; height: 100%; overflow: hidden; touch-action: none; }
.canvas-container :deep(canvas) { display: block; outline-offset: -3px; }
.poi-overlay { position: absolute; inset: 0; z-index: 1; pointer-events: none; }
.map-place {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 5px;
  min-height: 30px;
  padding: 3px 7px;
  font-size: 12px;
  line-height: 1;
  font-weight: 640;
  color: #f5eee0;
  background: #132b2f;
  border: 1px solid #6c8377;
  border-radius: 5px;
  white-space: nowrap;
  pointer-events: auto;
}
.map-place::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: #e8ce90; }
.map-place:hover, .map-place.current { background: #2b4140; border-color: #eed09a; }
.map-place.current::before { box-shadow: 0 0 0 2px #b79760; }
.selecting .map-place { pointer-events: none; opacity: .8; }
.scene-label {
  position: absolute;
  padding: 2px 5px;
  border-radius: 4px;
  color: var(--map-water);
  background: #152e31;
  transform: translate(5px, -94%);
  font-size: 12px;
  font-weight: 650;
  white-space: nowrap;
}
.scene-label.ridge-label { color: var(--map-gold); transform: translate(-50%, -100%); }
.spin-notice { top: var(--map-top); left: var(--content-left); z-index: 7; }
@media (max-width: 760px) {
  .map-place { min-height: 33px; font-size: 11px; }
  .scene-label { font-size: 10px; }
}
.campaign-badge {
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(26, 10, 10, 0.92);
  border: 1px solid #ef4444;
  border-radius: 14px;
  padding: 3px 10px 3px 6px;
  color: #fff;
  box-shadow: 0 0 16px rgba(239, 68, 68, 0.5);
  transition: opacity 0.25s, transform 0.25s;
}

.campaign-badge.visible {
  opacity: 1;
}

.camp-icon {
  font-size: 13px;
}

.camp-name {
  font-size: 11.5px;
  font-weight: 700;
  color: #fca5a5;
  white-space: nowrap;
}

.camp-role {
  font-size: 9.5px;
  color: #cbd5e1;
  white-space: nowrap;
}
</style>
