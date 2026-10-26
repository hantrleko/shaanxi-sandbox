<template>
  <div class="canvas-container" ref="containerRef">
    <!-- 3D 浮动 POI 标签覆盖层 (智能屏幕避让与视距分级 LOD：彻底告别文字交错) -->
    <div
      v-if="currentMode === 'macro'"
      class="poi-overlay"
      :style="{ pointerEvents: 'none' }"
    >
      <div
        v-for="poi in visibleScreenPois"
        :key="poi.id"
        class="poi-badge"
        :class="{
          active: selectedPoiId === poi.id,
          expanded: hoveredPoiId === poi.id || selectedPoiId === poi.id,
          major: poi.isMajor
        }"
        :style="{
          transform: `translate(${poi.x}px, ${poi.y}px)`,
          pointerEvents: 'auto'
        }"
        @mouseenter="hoveredPoiId = poi.id"
        @mouseleave="hoveredPoiId = null"
        @click="onPoiClick(poi)"
      >
        <div class="poi-dot" :class="poi.type"></div>
        <div class="poi-title">{{ poi.name }}</div>
        <div class="poi-sub" v-if="hoveredPoiId === poi.id || selectedPoiId === poi.id">{{ poi.badge }}</div>
      </div>
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

    <!-- 加载中指示器 -->
    <div v-if="isLoadingData" class="loading-overlay">
      <div class="loading-spinner"></div>
      <div class="loading-text">正在加载高精卫星遥感影像与 DEM 浮雕地形...</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import { POI_LIST } from '../data/shaanxiData.js';
import { CITY_BOUNDARIES, REAL_RIVERS, REAL_POIS, REAL_REGIONS, REAL_CAMPAIGN_ROUTES } from '../data/shaanxiGeoVectors.js';

const props = defineProps({
  currentMode: { type: String, default: 'macro' }, // 'macro' | 'bonsai' | 'model' | 'campaign'
  activeBonsaiId: { type: String, default: 'bonsai_huashan' },
  bonsaiExaggeration: { type: Number, default: 1.5 },
  activeModelStage: { type: Number, default: 1 },
  activeCampaign: { type: Object, default: null },
  activeCampaignStageIndex: { type: Number, default: 0 },
  lightingMode: { type: String, default: 'dawn' }, // 'dawn' | 'noon' | 'sunset'
  layers: {
    type: Object,
    default: () => ({ border: true, rivers: true, qinlingLine: true, silkRoad: true, pois: true })
  },
  activeLabId: { type: String, default: 'loess' },
  currentTectonicStage: { type: Number, default: 0 },
  activeChapterId: { type: String, default: 'geo_01' }
});

const emit = defineEmits(['camera-update', 'select-poi']);

const containerRef = ref(null);
const selectedPoiId = ref('xian');
const hoveredPoiId = ref(null);
const screenPois = ref([]);
const screenCheckpoints = ref([]);
const isLoadingData = ref(true);

let scene, camera, renderer, controls;
let macroGroup, bonsaiGroup, modelGroup, campaignGroup;
let borderSubGroup, riversSubGroup, qinlingSubGroup, silkRoadSubGroup, poisSubGroup;
let terrainMesh, sunLight, skyFillLight;
let silkRoadLine = null;
let qinlingLineMesh = null;
let animFrameId = null;
let flowOffset = 0;
let demCanvas = null;

// 动态模拟系统变量
let loessWaterParticles = null;
let climateNorthParticles = null;
let climateSouthParticles = null;
let globeMesh = null;
let tectonicQinlingMesh = null;
let tectonicGrabenMesh = null;

const visibleScreenPois = computed(() => {
  return screenPois.value.filter(p => p.visible);
});


// 初始化场景
const initThree = () => {
  const width = containerRef.value.clientWidth;
  const height = containerRef.value.clientHeight;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x06090e);
  scene.fog = new THREE.FogExp2(0x06090e, 0.0032);

  camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1500);
  camera.position.set(0, 95, 125);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance'
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.18;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  containerRef.value.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = Math.PI / 2 - 0.03;
  controls.minDistance = 8;
  controls.maxDistance = 350;

  // 电影级分层多光源光照系统
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
  scene.add(ambientLight);

  sunLight = new THREE.DirectionalLight(0xffedd5, 2.2);
  sunLight.position.set(70, 110, 50);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.width = 4096;
  sunLight.shadow.mapSize.height = 4096;
  sunLight.shadow.bias = -0.00008;
  sunLight.shadow.camera.near = 10;
  sunLight.shadow.camera.far = 400;
  sunLight.shadow.camera.left = -90;
  sunLight.shadow.camera.right = 90;
  sunLight.shadow.camera.top = 90;
  sunLight.shadow.camera.bottom = -90;
  scene.add(sunLight);

  skyFillLight = new THREE.DirectionalLight(0x38bdf8, 0.65);
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
  poisSubGroup = new THREE.Group();

  macroGroup.add(borderSubGroup);
  macroGroup.add(riversSubGroup);
  macroGroup.add(qinlingSubGroup);
  macroGroup.add(silkRoadSubGroup);
  macroGroup.add(poisSubGroup);

  scene.add(macroGroup);
  scene.add(bonsaiGroup);
  scene.add(modelGroup);
  scene.add(campaignGroup);

  bonsaiGroup.visible = false;
  modelGroup.visible = false;
  campaignGroup.visible = false;

  loadRealTerrainAssets();

  window.addEventListener('resize', onWindowResize);
  animate();
};

// 异步加载高精影像、Sobel法线贴图与 DEM 高程
function loadRealTerrainAssets() {
  const textureLoader = new THREE.TextureLoader();
  const baseUrl = import.meta.env.BASE_URL || './';
  const prefix = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';

  const satUrl = prefix + 'textures/shaanxi_satellite_spotlight.jpg';
  const normalUrl = prefix + 'textures/shaanxi_normal.png';
  const demUrl = prefix + 'textures/shaanxi_dem.png';

  textureLoader.load(
    satUrl,
    (satTexture) => {
      satTexture.colorSpace = THREE.SRGBColorSpace;
      satTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      satTexture.generateMipmaps = true;

      textureLoader.load(
        normalUrl,
        (normalTexture) => {
          normalTexture.generateMipmaps = true;

          const demImg = new Image();
          demImg.src = demUrl;
          demImg.onload = () => {
            demCanvas = document.createElement('canvas');
            demCanvas.width = demImg.width;
            demCanvas.height = demImg.height;
            const ctx = demCanvas.getContext('2d');
            ctx.drawImage(demImg, 0, 0);

            buildRealMacroTerrain(satTexture, normalTexture, ctx, demCanvas.width, demCanvas.height);
            buildShaanxiBorder();
            buildRivers();
            buildQinlingLine();
            buildSilkRoad();
            buildSpatialPins();
            buildBonsaiBlock();
            buildEvolutionModel();
            buildCampaignVisuals();

            isLoadingData.value = false;
          };
          demImg.onerror = () => {
            buildRealMacroTerrain(satTexture, normalTexture, null, 0, 0);
            isLoadingData.value = false;
          };
        },
        undefined,
        () => {
          buildRealMacroTerrain(satTexture, null, null, 0, 0);
          isLoadingData.value = false;
        }
      );
    },
    undefined,
    () => {
      buildRealMacroTerrain(null, null, null, 0, 0);
      isLoadingData.value = false;
    }
  );
}

// 构建带实心垂直岩层封边 (Terrain Skirt) 的宏观三维地貌沙盘
function buildRealMacroTerrain(satTexture, normalTexture, demCtx, demW, demH) {
  const width = 80;
  const depth = 140;
  const segX = 220;
  const segZ = 300;

  const geo = new THREE.PlaneGeometry(width, depth, segX, segZ);
  geo.rotateX(-Math.PI / 2);

  const pos = geo.attributes.position;
  let demData = null;
  if (demCtx) {
    demData = demCtx.getImageData(0, 0, demW, demH).data;
  }

  // 1. 根据 DEM 置换网格顶部高程
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);

    const u = (x / width) + 0.5;
    const v = (z / depth) + 0.5;

    let h = 0;
    if (demData && u >= 0 && u <= 1 && v >= 0 && v <= 1) {
      const px = Math.floor(u * (demW - 1));
      const py = Math.floor(v * (demH - 1));
      const pIdx = (py * demW + px) * 4;
      const grey = demData[pIdx];
      h = Math.pow(grey / 255.0, 1.1) * 18.5;
    } else {
      h = (z > 12) ? Math.max(0, 1 - Math.abs(z - 18) / 14) * 14 : 1.5;
    }
    pos.setY(i, h);
  }
  geo.computeVertexNormals();

  const mat = new THREE.MeshStandardMaterial({
    map: satTexture || null,
    normalMap: normalTexture || null,
    normalScale: normalTexture ? new THREE.Vector2(1.85, 1.85) : new THREE.Vector2(1, 1),
    color: satTexture ? 0xffffff : 0x78716c,
    roughness: 0.82,
    metalness: 0.08,
    flatShading: false
  });

  terrainMesh = new THREE.Mesh(geo, mat);
  terrainMesh.receiveShadow = true;
  terrainMesh.castShadow = true;
  macroGroup.add(terrainMesh);

  // 2. 严丝合缝的实心垂直地质岩壁 (Terrain Skirt - 根除四周悬空)
  const skirtPositions = [];
  const skirtNormals = [];
  const baseDepth = -2.0;

  const addSkirtSegment = (x1, y1, z1, x2, y2, z2, nx, nz) => {
    skirtPositions.push(x1, y1, z1, x1, baseDepth, z1, x2, y1, z2);
    skirtPositions.push(x2, y1, z2, x1, baseDepth, z1, x2, baseDepth, z2);
    for (let k = 0; k < 6; k++) skirtNormals.push(nx, 0, nz);
  };

  const getIdx = (ix, iz) => iz * (segX + 1) + ix;

  for (let ix = 0; ix < segX; ix++) {
    const idx1 = getIdx(ix, 0), idx2 = getIdx(ix + 1, 0);
    addSkirtSegment(pos.getX(idx1), pos.getY(idx1), pos.getZ(idx1), pos.getX(idx2), pos.getY(idx2), pos.getZ(idx2), 0, -1);
  }
  for (let iz = 0; iz < segZ; iz++) {
    const idx1 = getIdx(segX, iz), idx2 = getIdx(segX, iz + 1);
    addSkirtSegment(pos.getX(idx1), pos.getY(idx1), pos.getZ(idx1), pos.getX(idx2), pos.getY(idx2), pos.getZ(idx2), 1, 0);
  }
  for (let ix = segX; ix > 0; ix--) {
    const idx1 = getIdx(ix, segZ), idx2 = getIdx(ix - 1, segZ);
    addSkirtSegment(pos.getX(idx1), pos.getY(idx1), pos.getZ(idx1), pos.getX(idx2), pos.getY(idx2), pos.getZ(idx2), 0, 1);
  }
  for (let iz = segZ; iz > 0; iz--) {
    const idx1 = getIdx(0, iz), idx2 = getIdx(0, iz - 1);
    addSkirtSegment(pos.getX(idx1), pos.getY(idx1), pos.getZ(idx1), pos.getX(idx2), pos.getY(idx2), pos.getZ(idx2), -1, 0);
  }

  const skirtGeo = new THREE.BufferGeometry();
  skirtGeo.setAttribute('position', new THREE.Float32BufferAttribute(skirtPositions, 3));
  skirtGeo.setAttribute('normal', new THREE.Float32BufferAttribute(skirtNormals, 3));

  const skirtMat = new THREE.MeshStandardMaterial({
    color: 0x0f172a,
    roughness: 0.9,
    metalness: 0.15
  });
  const skirtMesh = new THREE.Mesh(skirtGeo, skirtMat);
  skirtMesh.castShadow = true;
  skirtMesh.receiveShadow = true;
  macroGroup.add(skirtMesh);

  // 3. 黑曜石精密基座与蓝色倒角金线
  const pedestalGeo = new THREE.BoxGeometry(83.6, 2.5, 143.6);
  const pedestalMat = new THREE.MeshStandardMaterial({
    color: 0x080c14,
    roughness: 0.6,
    metalness: 0.85
  });
  const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
  pedestal.position.set(0, -3.25, 0);
  macroGroup.add(pedestal);

  const rimGeo = new THREE.EdgesGeometry(pedestalGeo);
  const rimMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.5 });
  const rimLine = new THREE.LineSegments(rimGeo, rimMat);
  pedestal.add(rimLine);
}

// 绘制全省十地市真实矢量境界 (严格基于 GeoJSON，线宽精致贴地)
function buildShaanxiBorder() {
  while (borderSubGroup.children.length > 0) {
    borderSubGroup.remove(borderSubGroup.children[0]);
  }

  const lineMat = new THREE.LineBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.55,
    linewidth: 1
  });

  CITY_BOUNDARIES.forEach((city) => {
    city.rings.forEach((ring) => {
      const pts = ring.map(p => new THREE.Vector3(p[0], p[1] + 0.25, p[2]));
      if (pts.length > 2) {
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const line = new THREE.LineLoop(geo, lineMat);
        borderSubGroup.add(line);
      }
    });
  });
}


// 构建精细流光河流 (纤细精致的谷底水系，告别粗大管道)
function buildRivers() {
  while (riversSubGroup.children.length > 0) {
    riversSubGroup.remove(riversSubGroup.children[0]);
  }

  const riverMat = new THREE.MeshStandardMaterial({
    color: 0x0284c7,
    emissive: 0x0369a1,
    emissiveIntensity: 0.6,
    roughness: 0.15,
    metalness: 0.8,
    transparent: true,
    opacity: 0.88
  });

  REAL_RIVERS.forEach((river) => {
    if (river.points.length < 2) return;

    // 平滑曲线与细化半径 (主河 0.20，支流 0.14，紧密吸附谷底)
    const curvePoints = river.points.map(p => new THREE.Vector3(p[0], p[1] + 0.12, p[2]));
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    const radius = river.name.includes("黄河") || river.name.includes("渭河") ? 0.20 : 0.14;
    const tubeGeo = new THREE.TubeGeometry(curve, 160, radius, 8, false);

    const mesh = new THREE.Mesh(tubeGeo, riverMat);
    mesh.name = river.name;
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    riversSubGroup.add(mesh);
  });
}

// 绘制秦岭 800mm 气候分界线 (翡翠绿光带与峰脊信标)
function buildQinlingLine() {
  while (qinlingSubGroup.children.length > 0) {
    qinlingSubGroup.remove(qinlingSubGroup.children[0]);
  }

  const pts = [
    new THREE.Vector3(-36, 12.8, 17.5),
    new THREE.Vector3(-26, 14.2, 17.0),
    new THREE.Vector3(-14, 15.6, 16.5),
    new THREE.Vector3(-3, 16.8, 16.0), // 太白峰脊
    new THREE.Vector3(9, 14.8, 16.2),
    new THREE.Vector3(20, 13.5, 16.8),
    new THREE.Vector3(32, 11.2, 17.8),
    new THREE.Vector3(39, 9.8, 18.5)
  ];
  const curve = new THREE.CatmullRomCurve3(pts);
  const qinlingTubeGeo = new THREE.TubeGeometry(curve, 120, 0.16, 8, false);

  const qinlingMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x059669,
    emissiveIntensity: 0.75,
    roughness: 0.2,
    metalness: 0.6
  });

  qinlingLineMesh = new THREE.Mesh(qinlingTubeGeo, qinlingMat);
  qinlingSubGroup.add(qinlingLineMesh);

  // 太白峰顶气候分界金标光柱
  const beaconGeo = new THREE.CylinderGeometry(0.12, 0.12, 3.5, 16);
  const beaconMat = new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.85 });
  const beacon = new THREE.Mesh(beaconGeo, beaconMat);
  beacon.position.set(-3, 18.5, 16.0);
  qinlingSubGroup.add(beacon);
}

// 绘制丝绸之路开拓主干线 (金芒律动脉络)
function buildSilkRoad() {
  while (silkRoadSubGroup.children.length > 0) {
    silkRoadSubGroup.remove(silkRoadSubGroup.children[0]);
  }

  const pts = [
    new THREE.Vector3(0.5, 2.8, 13.2),    // 长安
    new THREE.Vector3(-2.2, 2.9, 11.8),   // 咸阳
    new THREE.Vector3(-14.5, 3.5, 9.8),   // 宝鸡陈仓
    new THREE.Vector3(-28.0, 5.2, 5.0),   // 陇关天水方向
    new THREE.Vector3(-38.0, 4.8, -4.0)   // 河西走廊方向
  ];
  const curve = new THREE.CatmullRomCurve3(pts);
  const silkGeo = new THREE.TubeGeometry(curve, 100, 0.15, 8, false);

  const silkMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    emissive: 0xd97706,
    emissiveIntensity: 0.8,
    roughness: 0.25,
    metalness: 0.7
  });

  silkRoadLine = new THREE.Mesh(silkGeo, silkMat);
  silkRoadSubGroup.add(silkRoadLine);
}

// 构建精致立体 POI 空间信标针 (彻底废弃粗陋的 3D Sprite 黑盒，全由屏幕自适应层托管)
function buildSpatialPins() {
  while (poisSubGroup.children.length > 0) {
    poisSubGroup.remove(poisSubGroup.children[0]);
  }

  POI_LIST.forEach((poi) => {
    const pinGroup = new THREE.Group();
    pinGroup.position.set(poi.pos[0], poi.pos[1], poi.pos[2]);

    const isCity = poi.type === "city";
    const baseColor = isCity ? 0x38bdf8 : (poi.type === "mountain" ? 0x10b981 : 0xf59e0b);

    // 1. 纤细金属针柱
    const stemGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.6, 12);
    const stemMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.9,
      roughness: 0.2
    });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 0.8;
    pinGroup.add(stem);

    // 2. 顶部微光珠宝圆珠
    const jewelGeo = new THREE.SphereGeometry(0.32, 16, 16);
    const jewelMat = new THREE.MeshStandardMaterial({
      color: baseColor,
      emissive: baseColor,
      emissiveIntensity: 0.7,
      metalness: 0.5,
      roughness: 0.2
    });
    const jewel = new THREE.Mesh(jewelGeo, jewelMat);
    jewel.position.y = 1.6;
    pinGroup.add(jewel);

    // 3. 地表脉冲光圈
    const ringGeo = new THREE.RingGeometry(0.18, 0.45, 24);
    ringGeo.rotateX(-Math.PI / 2);
    const ringMat = new THREE.MeshBasicMaterial({
      color: baseColor,
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.05;
    pinGroup.add(ring);

    pinGroup.name = "pin_" + poi.id;
    poisSubGroup.add(pinGroup);
  });
}


// 构建高精度微观盆景切块 (带四壁实心垂直地质切面与三维物理海拔标尺)
function buildBonsaiBlock() {
  while (bonsaiGroup.children.length > 0) {
    bonsaiGroup.remove(bonsaiGroup.children[0]);
  }

  const baseUrl = import.meta.env.BASE_URL || "./";
  const prefix = baseUrl.endsWith("/") ? baseUrl : baseUrl + "/";

  let bonsaiKey = "huashan";
  let marks = [
    { label: "海拔 400m (山麓谷底)", yVal: 2 },
    { label: "海拔 1000m (回心石)", yVal: 8 },
    { label: "海拔 1614m (北峰云台)", yVal: 14 },
    { label: "海拔 2154m (南峰极顶)", yVal: 22 }
  ];

  if (props.activeBonsaiId === "bonsai_taibai") {
    bonsaiKey = "taibai";
    marks = [
      { label: "海拔 800m (黑河峡谷)", yVal: 3 },
      { label: "海拔 1800m (温带针叶林)", yVal: 9 },
      { label: "海拔 2800m (第四纪冰川界)", yVal: 15 },
      { label: "海拔 3771m (拔仙台)", yVal: 24 }
    ];
  } else if (props.activeBonsaiId === "bonsai_hukou") {
    bonsaiKey = "hukou";
    marks = [
      { label: "水深 390m (龙槽深潭)", yVal: 3 },
      { label: "跌水 440m (黄河水面)", yVal: 8 },
      { label: "阶地 520m (两岸崖壁)", yVal: 14 },
      { label: "高台 800m (孟门山)", yVal: 20 }
    ];
  }

  const textureLoader = new THREE.TextureLoader();
  const satUrl = prefix + "textures/bonsai/" + bonsaiKey + "_sat.jpg";
  const demUrl = prefix + "textures/bonsai/" + bonsaiKey + "_dem.png";

  textureLoader.load(satUrl, (bSatTex) => {
    bSatTex.colorSpace = THREE.SRGBColorSpace;
    const demImg = new Image();
    demImg.src = demUrl;
    demImg.onload = () => {
      const bCanvas = document.createElement("canvas");
      bCanvas.width = demImg.width;
      bCanvas.height = demImg.height;
      const bCtx = bCanvas.getContext("2d");
      bCtx.drawImage(demImg, 0, 0);
      const bDemData = bCtx.getImageData(0, 0, bCanvas.width, bCanvas.height).data;

      const size = 32;
      const segs = 100;
      const topGeo = new THREE.PlaneGeometry(size, size, segs, segs);
      topGeo.rotateX(-Math.PI / 2);

      const pos = topGeo.attributes.position;
      const exag = props.bonsaiExaggeration || 1.5;

      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const z = pos.getZ(i);

        const u = (x / size) + 0.5;
        const v = (z / size) + 0.5;

        let h = 2.0;
        if (u >= 0 && u <= 1 && v >= 0 && v <= 1) {
          const px = Math.floor(u * (bCanvas.width - 1));
          const py = Math.floor(v * (bCanvas.height - 1));
          const pIdx = (py * bCanvas.width + px) * 4;
          const grey = bDemData[pIdx];
          h = Math.pow(grey / 255.0, 1.2) * 16.0 * exag;
        }
        pos.setY(i, h);
      }
      topGeo.computeVertexNormals();

      const topMat = new THREE.MeshStandardMaterial({
        map: bSatTex,
        roughness: 0.82,
        metalness: 0.1
      });
      const bonsaiMesh = new THREE.Mesh(topGeo, topMat);
      bonsaiMesh.castShadow = true;
      bonsaiMesh.receiveShadow = true;
      bonsaiGroup.add(bonsaiMesh);

      // 构建微观切块四壁实心垂直地质切面 (彻底杜绝边缘悬空)
      const bSkirtPositions = [];
      const bBaseDepth = -4.0;
      const bGetIdx = (ix, iz) => iz * (segs + 1) + ix;

      const addBSkirt = (idxA, idxB) => {
        const x1 = pos.getX(idxA), y1 = pos.getY(idxA), z1 = pos.getZ(idxA);
        const x2 = pos.getX(idxB), y2 = pos.getY(idxB), z2 = pos.getZ(idxB);
        bSkirtPositions.push(x1, y1, z1, x1, bBaseDepth, z1, x2, y1, z2);
        bSkirtPositions.push(x2, y1, z2, x1, bBaseDepth, z1, x2, bBaseDepth, z2);
      };

      for (let ix = 0; ix < segs; ix++) addBSkirt(bGetIdx(ix, 0), bGetIdx(ix + 1, 0));
      for (let iz = 0; iz < segs; iz++) addBSkirt(bGetIdx(segs, iz), bGetIdx(segs, iz + 1));
      for (let ix = segs; ix > 0; ix--) addBSkirt(bGetIdx(ix, segs), bGetIdx(ix - 1, segs));
      for (let iz = segs; iz > 0; iz--) addBSkirt(bGetIdx(0, iz), bGetIdx(0, iz - 1));

      const bSkirtGeo = new THREE.BufferGeometry();
      bSkirtGeo.setAttribute("position", new THREE.Float32BufferAttribute(bSkirtPositions, 3));
      bSkirtGeo.computeVertexNormals();

      const bSkirtMat = new THREE.MeshStandardMaterial({
        color: 0x18181b,
        roughness: 0.9,
        metalness: 0.1
      });
      bonsaiGroup.add(new THREE.Mesh(bSkirtGeo, bSkirtMat));

      // 底座黑曜石托盘
      const bPedestal = new THREE.Mesh(
        new THREE.BoxGeometry(size + 1.6, 2, size + 1.6),
        new THREE.MeshStandardMaterial({ color: 0x090d16, roughness: 0.5, metalness: 0.8 })
      );
      bPedestal.position.set(0, -5, 0);
      bonsaiGroup.add(bPedestal);

      // 三维物理立柱标尺与海拔标记
      const rulerGroup = new THREE.Group();
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 30),
        new THREE.MeshBasicMaterial({ color: 0x94a3b8 })
      );
      pole.position.set(-17.5, 11, -17.5);
      rulerGroup.add(pole);

      marks.forEach(({ label, yVal }) => {
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.7, 0.08, 8, 24),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.set(-17.5, yVal, -17.5);
        rulerGroup.add(ring);

        const markCanvas = document.createElement("canvas");
        markCanvas.width = 256;
        markCanvas.height = 64;
        const mCtx = markCanvas.getContext("2d");
        mCtx.fillStyle = "rgba(10, 15, 24, 0.88)";
        mCtx.strokeStyle = "#38bdf8";
        mCtx.lineWidth = 2;
        mCtx.beginPath();
        mCtx.roundRect(4, 4, 248, 56, 10);
        mCtx.fill();
        mCtx.stroke();
        mCtx.fillStyle = "#f0f9ff";
        mCtx.font = 'bold 20px "Microsoft YaHei", sans-serif';
        mCtx.textAlign = "center";
        mCtx.textBaseline = "middle";
        mCtx.fillText(label, 128, 32);

        const mTex = new THREE.CanvasTexture(markCanvas);
        const mSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: mTex }));
        mSprite.position.set(-22.5, yVal, -17.5);
        mSprite.scale.set(7.5, 2.0, 1);
        rulerGroup.add(mSprite);
      });

      bonsaiGroup.add(rulerGroup);
    };
  });
}

// 盆景重提取缓动动画
const reExtractBonsai = () => {
  if (!bonsaiGroup) return;
  bonsaiGroup.position.y = -15;
  bonsaiGroup.scale.set(0.7, 0.7, 0.7);
  gsap.to(bonsaiGroup.position, {
    y: 0,
    duration: 1.5,
    ease: "power3.out"
  });
  gsap.to(bonsaiGroup.scale, {
    x: 1, y: 1, z: 1,
    duration: 1.5,
    ease: "power3.out"
  });
};

// 四大科学实验台深度建模与动态仿真
function buildEvolutionModel() {
  while (modelGroup.children.length > 0) {
    modelGroup.remove(modelGroup.children[0]);
  }
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
  while (campaignGroup.children.length > 0) {
    campaignGroup.remove(campaignGroup.children[0]);
  }

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


// 投影 POI 屏幕空间坐标并执行严密的空间碰撞避让 (彻底告别文字重叠)
function updatePoiScreenPositions() {
  if (!camera || !containerRef.value) return;
  const width = containerRef.value.clientWidth;
  const height = containerRef.value.clientHeight;

  if (props.currentMode === "macro") {
    // 1. 初步投影与屏幕裁剪计算
    const projectedPois = POI_LIST.map((poi) => {
      const vec = new THREE.Vector3(poi.pos[0], poi.pos[1] + 1.8, poi.pos[2]);
      vec.project(camera);
      const inFrustum = vec.z < 1.0 && Math.abs(vec.x) <= 0.94 && Math.abs(vec.y) <= 0.92;
      const x = Math.round((vec.x * 0.5 + 0.5) * width);
      const y = Math.round((-vec.y * 0.5 + 0.5) * height);
      const distToCam = camera.position.distanceTo(new THREE.Vector3(poi.pos[0], poi.pos[1], poi.pos[2]));

      // 优先级计算：当前选中最高，鼠标悬停次之，省会及顶级枢纽优先
      let priority = 10;
      if (poi.id === selectedPoiId.value) priority = 100;
      else if (poi.id === hoveredPoiId.value) priority = 90;
      else if (["xian", "yanan", "hanzhong", "taibai", "bingmayong"].includes(poi.id)) priority = 50;

      return {
        ...poi,
        x,
        y,
        distToCam,
        inFrustum,
        priority,
        visible: false
      };
    });

    // 2. 按优先级从高到低排序检测
    const sortedPois = [...projectedPois].sort((a, b) => b.priority - a.priority);
    const placedBoxes = [];

    sortedPois.forEach((poi) => {
      if (!poi.inFrustum) {
        poi.visible = false;
        return;
      }

      // 如果是选中的或悬浮的，强制展示
      if (poi.priority >= 90) {
        poi.visible = true;
        placedBoxes.push({
          x: poi.x,
          y: poi.y,
          w: 80,
          h: 28
        });
        return;
      }

      // 其余点位与已排布的标签进行轴对齐矩形碰撞检测
      let collided = false;
      const checkW = 68;
      const checkH = 26;

      for (let i = 0; i < placedBoxes.length; i++) {
        const b = placedBoxes[i];
        if (Math.abs(poi.x - b.x) < (checkW + b.w) / 2 + 10 &&
            Math.abs(poi.y - b.y) < (checkH + b.h) / 2 + 8) {
          collided = true;
          break;
        }
      }

      if (!collided) {
        poi.visible = true;
        placedBoxes.push({
          x: poi.x,
          y: poi.y,
          w: checkW,
          h: checkH
        });
      } else {
        poi.visible = false;
      }
    });

    screenPois.value = sortedPois;

  } else if (props.currentMode === "campaign" && props.activeCampaign) {
    const stage = props.activeCampaign.stages[props.activeCampaignStageIndex] || props.activeCampaign.stages[0];
    if (stage) {
      screenCheckpoints.value = stage.checkpoints.map(cp => {
        const vec = new THREE.Vector3(cp.pos[0], cp.pos[1] + 2.0, cp.pos[2]);
        vec.project(camera);
        const isVisible = vec.z < 1.0 && Math.abs(vec.x) <= 0.95 && Math.abs(vec.y) <= 0.95;
        return {
          ...cp,
          x: Math.round((vec.x * 0.5 + 0.5) * width),
          y: Math.round((-vec.y * 0.5 + 0.5) * height),
          visible: isVisible
        };
      });
    }
  }
}

// 运镜与控制
const flyTo = (pos, target, duration = 2.0) => {
  if (!camera || !controls) return;
  gsap.to(camera.position, {
    x: pos[0], y: pos[1], z: pos[2], duration, ease: "power3.inOut"
  });
  gsap.to(controls.target, {
    x: target[0], y: target[1], z: target[2], duration, ease: "power3.inOut"
  });
};

const onPoiClick = (poi) => {
  selectedPoiId.value = poi.id;
  emit("select-poi", poi);
  flyTo([poi.pos[0] + 5, poi.pos[1] + 16, poi.pos[2] + 18], [poi.pos[0], poi.pos[1], poi.pos[2]], 1.8);
};

const resetNorth = () => {
  if (!camera || !controls) return;
  const dist = camera.position.distanceTo(controls.target);
  flyTo([controls.target.x, controls.target.y + dist * 0.6, controls.target.z + dist * 0.8], [controls.target.x, controls.target.y, controls.target.z], 1.2);
};

const setLighting = (mode) => {
  if (!sunLight || !skyFillLight) return;
  if (mode === "dawn") {
    sunLight.position.set(70, 45, 60);
    sunLight.color.setHex(0xfbbf24);
    sunLight.intensity = 2.4;
    skyFillLight.color.setHex(0x38bdf8);
  } else if (mode === "noon") {
    sunLight.position.set(20, 130, 20);
    sunLight.color.setHex(0xffffff);
    sunLight.intensity = 2.0;
    skyFillLight.color.setHex(0x93c5fd);
  } else if (mode === "sunset") {
    sunLight.position.set(-80, 35, -40);
    sunLight.color.setHex(0xf43f5e);
    sunLight.intensity = 2.6;
    skyFillLight.color.setHex(0x818cf8);
  }
};

const onWindowResize = () => {
  if (!containerRef.value || !renderer || !camera) return;
  const width = containerRef.value.clientWidth;
  const height = containerRef.value.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
};

const animate = () => {
  animFrameId = requestAnimationFrame(animate);
  controls.update();

  if (silkRoadLine && silkRoadLine.material) {
    flowOffset += 0.03;
    if (silkRoadLine.material.dashOffset !== undefined) {
      silkRoadLine.material.dashOffset = -flowOffset;
    }
  }

  // 黄土高原水流径流粒子动画
  if (loessWaterParticles && loessWaterParticles.geometry) {
    const pPos = loessWaterParticles.geometry.attributes.position.array;
    for (let i = 0; i < pPos.length / 3; i++) {
      pPos[i * 3 + 1] -= 0.05;
      if (pPos[i * 3 + 1] < 1.0) {
        pPos[i * 3 + 1] = 6.0;
      }
    }
    loessWaterParticles.geometry.attributes.position.needsUpdate = true;
  }

  // 秦岭气候屏障动态冷暖气流粒子动画
  if (climateNorthParticles && climateNorthParticles.geometry) {
    const nPos = climateNorthParticles.geometry.attributes.position.array;
    for (let i = 0; i < nPos.length / 3; i++) {
      nPos[i * 3 + 2] += 0.08;
      if (nPos[i * 3 + 2] > -2.2) {
        nPos[i * 3 + 1] += 0.04;
        if (nPos[i * 3 + 2] > 0.0 || nPos[i * 3 + 1] > 14) {
          nPos[i * 3 + 2] = -14.0;
          nPos[i * 3 + 1] = Math.random() * 10 + 2;
        }
      }
    }
    climateNorthParticles.geometry.attributes.position.needsUpdate = true;
  }

  if (climateSouthParticles && climateSouthParticles.geometry) {
    const sPos = climateSouthParticles.geometry.attributes.position.array;
    for (let i = 0; i < sPos.length / 3; i++) {
      sPos[i * 3 + 2] -= 0.06;
      sPos[i * 3 + 1] += 0.05;
      if (sPos[i * 3 + 2] < 2.0 || sPos[i * 3 + 1] > 14) {
        sPos[i * 3 + 2] = 14.0;
        sPos[i * 3 + 1] = 2.0;
      }
    }
    climateSouthParticles.geometry.attributes.position.needsUpdate = true;
  }

  if (globeMesh) {
    globeMesh.rotation.y += 0.003;
  }

  if (camera && controls) {
    const pitch = Math.round((camera.rotation.x * 180) / Math.PI);
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    const azimuth = Math.round(Math.atan2(-dir.x, -dir.z) * (180 / Math.PI));
    emit("camera-update", { pitch: Math.abs(pitch), azimuth });
  }

  updatePoiScreenPositions();
  renderer.render(scene, camera);
};

// 模式与状态监听
watch(() => props.currentMode, (newMode) => {
  if (!macroGroup || !bonsaiGroup || !modelGroup || !campaignGroup) return;

  macroGroup.visible = newMode === "macro" || newMode === "campaign";
  bonsaiGroup.visible = newMode === "bonsai";
  modelGroup.visible = newMode === "model";
  campaignGroup.visible = newMode === "campaign";

  if (newMode === "macro") {
    flyTo([0, 95, 125], [0, 5, 0], 1.5);
  } else if (newMode === "bonsai") {
    flyTo([0, 28, 42], [0, 6, 0], 1.5);
    buildBonsaiBlock();
  } else if (newMode === "model") {
    flyTo([0, 32, 45], [0, 4, 0], 1.5);
    buildEvolutionModel();
  } else if (newMode === "campaign" && props.activeCampaign) {
    const cam = props.activeCampaign.camera;
    flyTo(cam.pos, cam.target, 1.8);
    buildCampaignVisuals();
  }
});

// 图层控制监听
watch(() => props.layers, (newLayers) => {
  if (!newLayers) return;
  if (borderSubGroup) borderSubGroup.visible = !!newLayers.border;
  if (riversSubGroup) riversSubGroup.visible = !!newLayers.rivers;
  if (qinlingSubGroup) qinlingSubGroup.visible = !!newLayers.qinlingLine;
  if (silkRoadSubGroup) silkRoadSubGroup.visible = !!newLayers.silkRoad;
  if (poisSubGroup) poisSubGroup.visible = !!newLayers.pois;
}, { deep: true, immediate: true });

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
  }
});

// 战役监听
watch([() => props.activeCampaign, () => props.activeCampaignStageIndex], () => {
  if (props.currentMode === "campaign") {
    buildCampaignVisuals();
  }
});

// 光照监听
watch(() => props.lightingMode, (mode) => {
  setLighting(mode);
});

// 章节联动摄像机视角
watch(() => props.activeChapterId, (chapId) => {
  if (props.currentMode !== "macro") return;
  const chapterCameraMap = {
    geo_01: { pos: [-3, 35, 36], target: [-3, 16.8, 16.0] },    // 秦岭太白
    geo_02: { pos: [3.2, 38, -2], target: [3.2, 5.0, -18.5] },   // 陕北黄土
    geo_03: { pos: [12, 28, 28], target: [10, 4, 12] },          // 关中平原/华山
    geo_04: { pos: [-14.5, 26, 48], target: [-14.5, 3.2, 33.2] },// 陕南汉中
    geo_05: { pos: [26, 26, 4], target: [24.5, 2.8, -4.2] },    // 壶口黄河瀑布
    geo_06: { pos: [0, 40, 32], target: [-1.2, 2.5, 11.2] },    // 大地原点
    his_01: { pos: [3.6, 22, 26], target: [3.6, 2.7, 12.8] },    // 临潼兵马俑
    his_02: { pos: [0.5, 24, 26], target: [0.5, 2.8, 13.2] },    // 汉长安城
    his_03: { pos: [0.5, 24, 26], target: [0.5, 2.8, 13.2] },    // 唐大雁塔
    his_04: { pos: [3.2, 24, -4], target: [3.2, 5.0, -18.5] },   // 延安宝塔山
    silk_01: { pos: [-8, 30, 24], target: [-10, 3, 10] },        // 丝路起点长安
    silk_02: { pos: [-18, 28, 20], target: [-20, 3.5, 8] }       // 丝绸之路陇关道
  };

  if (chapterCameraMap[chapId]) {
    const c = chapterCameraMap[chapId];
    flyTo(c.pos, c.target, 1.8);
  }
});

onMounted(() => {
  initThree();
});

onBeforeUnmount(() => {
  if (animFrameId) cancelAnimationFrame(animFrameId);
  window.removeEventListener("resize", onWindowResize);
  if (renderer) renderer.dispose();
});

defineExpose({
  flyTo,
  resetNorth,
  setLighting,
  reExtractBonsai
});
</script>

<style scoped>
.canvas-container {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

.poi-overlay {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

/* 紧凑精致单行 POI 胶囊标牌 (0 遮挡，极速避让) */
.poi-badge {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(10, 15, 25, 0.88);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(56, 189, 248, 0.35);
  border-radius: 12px;
  padding: 3px 9px;
  color: #f8fafc;
  cursor: pointer;
  transform: translate(-50%, -50%);
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.55);
  user-select: none;
}

.poi-badge:hover,
.poi-badge.active {
  border-color: #38bdf8;
  background: rgba(14, 23, 42, 0.96);
  transform: translate(-50%, -50%) scale(1.08);
  box-shadow: 0 0 16px rgba(56, 189, 248, 0.5);
  z-index: 20;
}

.poi-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #38bdf8;
  box-shadow: 0 0 8px #38bdf8;
  flex-shrink: 0;
}

.poi-dot.capital { background: #f59e0b; box-shadow: 0 0 8px #f59e0b; }
.poi-dot.mountain { background: #10b981; box-shadow: 0 0 8px #10b981; }
.poi-dot.nature { background: #06b6d4; box-shadow: 0 0 8px #06b6d4; }
.poi-dot.red { background: #ef4444; box-shadow: 0 0 8px #ef4444; }

.poi-title {
  font-size: 11.5px;
  font-weight: 600;
  white-space: nowrap;
  letter-spacing: 0.02em;
}

.poi-sub {
  font-size: 10px;
  color: #94a3b8;
  white-space: nowrap;
  padding-left: 4px;
  border-left: 1px solid rgba(255, 255, 255, 0.15);
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

.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(6, 9, 14, 0.9);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  z-index: 50;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(56, 189, 248, 0.18);
  border-top-color: #38bdf8;
  border-radius: 50%;
  animation: spin 0.9s infinite linear;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 13.5px;
  color: #e2e8f0;
  letter-spacing: 0.04em;
}
</style>
