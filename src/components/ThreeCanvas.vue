<template>
  <div class="canvas-container" ref="containerRef">
    <!-- 3D 浮动 POI 标签覆盖层 (宏观模式) -->
    <div
      v-if="currentMode === 'macro'"
      class="poi-overlay"
      :style="{ pointerEvents: 'none' }"
    >
      <div
        v-for="poi in screenPois"
        :key="poi.id"
        class="poi-badge"
        :class="{ active: selectedPoiId === poi.id, visible: poi.visible }"
        :style="{
          transform: `translate(${poi.x}px, ${poi.y}px)`,
          pointerEvents: 'auto'
        }"
        @click="onPoiClick(poi)"
      >
        <div class="poi-dot"></div>
        <div class="poi-content">
          <div class="poi-title">{{ poi.name }}</div>
          <div class="poi-sub">{{ poi.badge }}</div>
        </div>
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
      <div class="loading-text">正在加载高精遥感影像与真实 DEM 物理地形...</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
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
    default: () => ({ border: true, rivers: true, qinlingLine: true, silkRoad: true, regions: true, pois: true })
  },
  activeLabId: { type: String, default: 'loess' },
  currentTectonicStage: { type: Number, default: 0 }
});

const emit = defineEmits(['camera-update', 'select-poi']);

const containerRef = ref(null);
const selectedPoiId = ref('xian');
const screenPois = ref([]);
const screenCheckpoints = ref([]);
const isLoadingData = ref(true);

let scene, camera, renderer, controls;
let macroGroup, bonsaiGroup, modelGroup, campaignGroup;
let borderSubGroup, riversSubGroup, qinlingSubGroup, silkRoadSubGroup, regionsSubGroup, poisSubGroup;
let terrainMesh, sunLight, skyFillLight;
let silkRoadLine = null;
let animFrameId = null;
let flowOffset = 0;
let demCanvas = null;
let climateParticles = null;
let globeMesh = null;

// 初始化 Three 场景
const initThree = () => {
  const width = containerRef.value.clientWidth;
  const height = containerRef.value.clientHeight;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x06090e);
  scene.fog = new THREE.FogExp2(0x06090e, 0.0032);

  camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1500);
  camera.position.set(0, 95, 125);

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance'
  });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  containerRef.value.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = Math.PI / 2 - 0.02;
  controls.minDistance = 8;
  controls.maxDistance = 350;

  // 电影级多层次光照系统
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
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

  skyFillLight = new THREE.DirectionalLight(0x38bdf8, 0.7);
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
  regionsSubGroup = new THREE.Group();
  poisSubGroup = new THREE.Group();

  macroGroup.add(borderSubGroup);
  macroGroup.add(riversSubGroup);
  macroGroup.add(qinlingSubGroup);
  macroGroup.add(silkRoadSubGroup);
  macroGroup.add(regionsSubGroup);
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

// 异步加载高精影像、法线贴图与 DEM 高程
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
            buildSpatialFloatingLabels();
            buildBonsaiBlock();
            buildEvolutionModel();
            buildCampaignVisuals();

            isLoadingData.value = false;
          };
          demImg.onerror = () => {
            console.warn('Failed to load DEM image, fallback');
            buildRealMacroTerrain(satTexture, normalTexture, null, 0, 0);
            isLoadingData.value = false;
          };
        },
        undefined,
        () => {
          // 法线加载失败容错
          buildRealMacroTerrain(satTexture, null, null, 0, 0);
          isLoadingData.value = false;
        }
      );
    },
    undefined,
    () => {
      // 备用基础纹理
      buildRealMacroTerrain(null, null, null, 0, 0);
      isLoadingData.value = false;
    }
  );
}

// 构建由真实 DEM 驱动的高精度三维沙盘地貌
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
    normalScale: normalTexture ? new THREE.Vector2(1.8, 1.8) : new THREE.Vector2(1, 1),
    color: satTexture ? 0xffffff : 0x78716c,
    roughness: 0.82,
    metalness: 0.08,
    flatShading: false
  });

  terrainMesh = new THREE.Mesh(geo, mat);
  terrainMesh.receiveShadow = true;
  terrainMesh.castShadow = true;
  macroGroup.add(terrainMesh);

  // 精雕黑曜石倒角底座
  const pedestalGeo = new THREE.BoxGeometry(84, 4, 144);
  const pedestalMat = new THREE.MeshStandardMaterial({
    color: 0x0a0f16,
    roughness: 0.5,
    metalness: 0.8
  });
  const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
  pedestal.position.set(0, -2.01, 0);
  macroGroup.add(pedestal);

  const rimGeo = new THREE.EdgesGeometry(pedestalGeo);
  const rimMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.45 });
  const rimLine = new THREE.LineSegments(rimGeo, rimMat);
  pedestal.add(rimLine);
}

// 绘制省界与十地市真实矢量境界
function buildShaanxiBorder() {
  while (borderSubGroup.children.length > 0) {
    borderSubGroup.remove(borderSubGroup.children[0]);
  }

  // 1. 十地市界线
  const lineMat = new THREE.LineBasicMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.55,
    linewidth: 1.5
  });

  CITY_BOUNDARIES.forEach((city) => {
    city.rings.forEach((ring) => {
      const pts = ring.map(p => new THREE.Vector3(p[0], p[1] + 0.3, p[2]));
      if (pts.length > 2) {
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const line = new THREE.LineLoop(geo, lineMat);
        borderSubGroup.add(line);
      }
    });
  });

  // 2. 省级主轮廓发光外环
  const outerBorderPts = [
    new THREE.Vector3(-15, 6.5, -60),
    new THREE.Vector3(12, 6.2, -60),
    new THREE.Vector3(26, 5.2, -45),
    new THREE.Vector3(28, 4.2, -20),
    new THREE.Vector3(24, 3.5, 0),
    new THREE.Vector3(22, 6.8, 18),
    new THREE.Vector3(18, 6.2, 55),
    new THREE.Vector3(-8, 5.6, 62),
    new THREE.Vector3(-22, 6.0, 45),
    new THREE.Vector3(-28, 6.5, 15),
    new THREE.Vector3(-24, 3.8, -5),
    new THREE.Vector3(-20, 5.5, -35),
    new THREE.Vector3(-15, 6.5, -60)
  ];
  const curve = new THREE.CatmullRomCurve3(outerBorderPts, true);
  const tubeGeo = new THREE.TubeGeometry(curve, 180, 0.45, 8, true);
  const outerBorderMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.95,
    roughness: 0.2
  });
  borderSubGroup.add(new THREE.Mesh(tubeGeo, outerBorderMat));
}

// 真实骨干水系网络
function buildRivers() {
  while (riversSubGroup.children.length > 0) {
    riversSubGroup.remove(riversSubGroup.children[0]);
  }

  const riverConfigs = [
    { key: 'yellow_river', color: 0xf59e0b, emissive: 0xd97706, radius: 0.55 },
    { key: 'wei_river', color: 0x06b6d4, emissive: 0x0891b2, radius: 0.45 },
    { key: 'han_river', color: 0x2563eb, emissive: 0x1d4ed8, radius: 0.45 },
    { key: 'jing_river', color: 0xeab308, emissive: 0xca8a04, radius: 0.38 }
  ];

  riverConfigs.forEach(({ key, color, emissive, radius }) => {
    const rawPts = REAL_RIVERS[key];
    if (rawPts && rawPts.length > 1) {
      const pts = rawPts.map(p => new THREE.Vector3(p[0], p[1] + 0.35, p[2]));
      const curve = new THREE.CatmullRomCurve3(pts);
      const geo = new THREE.TubeGeometry(curve, pts.length * 8, radius, 8, false);
      const mat = new THREE.MeshStandardMaterial({
        color,
        emissive,
        emissiveIntensity: 0.85,
        roughness: 0.1,
        metalness: 0.4
      });
      riversSubGroup.add(new THREE.Mesh(geo, mat));
    }
  });
}

// 秦岭 800mm 分界线
function buildQinlingLine() {
  while (qinlingSubGroup.children.length > 0) {
    qinlingSubGroup.remove(qinlingSubGroup.children[0]);
  }

  const qinlingPts = [
    new THREE.Vector3(-24, 7.5, 23.5),
    new THREE.Vector3(-14, 8.2, 23.0),
    new THREE.Vector3(-4.84, 18.8, 22.75),
    new THREE.Vector3(3.5, 12.5, 23.2),
    new THREE.Vector3(14.0, 9.2, 23.0),
    new THREE.Vector3(18.5, 10.5, 23.5),
    new THREE.Vector3(26.0, 8.0, 24.0)
  ];

  const curve = new THREE.CatmullRomCurve3(qinlingPts);
  const pts = curve.getPoints(120);
  const geo = new THREE.BufferGeometry().setFromPoints(pts);
  const mat = new THREE.LineDashedMaterial({
    color: 0x10b981,
    dashSize: 2.0,
    gapSize: 1.0,
    linewidth: 3
  });
  const line = new THREE.Line(geo, mat);
  line.computeLineDistances();
  qinlingSubGroup.add(line);

  const tagCanvas = createTextBillboardCanvas('800mm 等降水量线 · 1月 0℃ 等温线', '#10b981');
  const tagTexture = new THREE.CanvasTexture(tagCanvas);
  const spriteMat = new THREE.SpriteMaterial({ map: tagTexture, transparent: true });
  const sprite = new THREE.Sprite(spriteMat);
  sprite.position.set(2.0, 21.0, 23.0);
  sprite.scale.set(28, 7, 1);
  qinlingSubGroup.add(sprite);
}

// 丝绸之路起始脉冲流光线
function buildSilkRoad() {
  while (silkRoadSubGroup.children.length > 0) {
    silkRoadSubGroup.remove(silkRoadSubGroup.children[0]);
  }

  const silkPts = [
    new THREE.Vector3(6.34, 1.45, 15.8),
    new THREE.Vector3(3.0, 1.5, 16.0),
    new THREE.Vector3(-4.0, 1.8, 16.5),
    new THREE.Vector3(-10.73, 2.5, 16.7),
    new THREE.Vector3(-18.0, 3.8, 14.5),
    new THREE.Vector3(-28.0, 4.6, 10.0),
    new THREE.Vector3(-38.0, 5.2, 5.0)
  ];

  const curve = new THREE.CatmullRomCurve3(silkPts);
  const points = curve.getPoints(140);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  const mat = new THREE.LineDashedMaterial({
    color: 0xf59e0b,
    dashSize: 2.2,
    gapSize: 1.0,
    linewidth: 3.5
  });

  silkRoadLine = new THREE.Line(geometry, mat);
  silkRoadLine.computeLineDistances();
  silkRoadSubGroup.add(silkRoadLine);
}

// 空间地标与三维大字标签
function buildSpatialFloatingLabels() {
  while (regionsSubGroup.children.length > 0) {
    regionsSubGroup.remove(regionsSubGroup.children[0]);
  }
  while (poisSubGroup.children.length > 0) {
    poisSubGroup.remove(poisSubGroup.children[0]);
  }

  // 1. 地貌三维贴地大字
  REAL_REGIONS.forEach((reg) => {
    const canvas = createTextBillboardCanvas(reg.name, '#a855f7', reg.sub);
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    const scaleFactor = reg.size === 'large' ? 26 : 20;
    sprite.position.set(reg.pos[0], reg.pos[1] + 7.5, reg.pos[2]);
    sprite.scale.set(scaleFactor, scaleFactor * 0.25, 1);
    regionsSubGroup.add(sprite);
  });

  // 2. POI 标杆
  const createMarker = (x, y, z, color = 0x38bdf8) => {
    const pinGroup = new THREE.Group();
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.7, 16, 16),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.7 })
    );
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 2.6),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7 })
    );
    sphere.position.y = 2.6;
    stem.position.y = 1.3;
    pinGroup.add(sphere);
    pinGroup.add(stem);
    pinGroup.position.set(x, y, z);
    return pinGroup;
  };

  REAL_POIS.forEach(poi => {
    let pinColor = 0x38bdf8;
    if (poi.type === 'capital') pinColor = 0xf59e0b;
    if (poi.type === 'mountain') pinColor = 0xec4899;
    if (poi.type === 'nature') pinColor = 0x10b981;
    if (poi.type === 'red') pinColor = 0xf43f5e;
    const pin = createMarker(poi.pos[0], poi.pos[1] + 0.4, poi.pos[2], pinColor);
    poisSubGroup.add(pin);
  });
}

function createTextBillboardCanvas(text, color = '#38bdf8', subtitle = '') {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = 'rgba(10, 15, 24, 0.88)';
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.roundRect(10, 10, 492, 108, 22);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 36px "Microsoft YaHei", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, subtitle ? 48 : 64);

  if (subtitle) {
    ctx.fillStyle = color;
    ctx.font = '22px "Microsoft YaHei", sans-serif';
    ctx.fillText(subtitle, 256, 88);
  }

  return canvas;
}

// 构建真实 Zoom 12 微观盆景切块
function buildBonsaiBlock() {
  while (bonsaiGroup.children.length > 0) {
    bonsaiGroup.remove(bonsaiGroup.children[0]);
  }

  const baseUrl = import.meta.env.BASE_URL || './';
  const prefix = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';

  // 映射当前盆景切块数据
  let bonsaiKey = 'huashan';
  let marks = ['0m', '800m', '1614m(北峰)', '2154m(南峰)'];
  if (props.activeBonsaiId === 'bonsai_taibai') {
    bonsaiKey = 'taibai';
    marks = ['800m', '1800m', '2800m', '3771m(拔仙台)'];
  } else if (props.activeBonsaiId === 'bonsai_hukou') {
    bonsaiKey = 'hukou';
    marks = ['400m', '600m', '800m', '1100m(孟门山)'];
  }

  const textureLoader = new THREE.TextureLoader();
  const satUrl = prefix + `textures/bonsai/${bonsaiKey}_sat.jpg`;
  const demUrl = prefix + `textures/bonsai/${bonsaiKey}_dem.png`;

  textureLoader.load(satUrl, (bSatTex) => {
    bSatTex.colorSpace = THREE.SRGBColorSpace;
    const demImg = new Image();
    demImg.src = demUrl;
    demImg.onload = () => {
      const bCanvas = document.createElement('canvas');
      bCanvas.width = demImg.width;
      bCanvas.height = demImg.height;
      const bCtx = bCanvas.getContext('2d');
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

      // 四周垂直切削岩层底座
      const sideBox = new THREE.Mesh(
        new THREE.BoxGeometry(size, 8, size),
        new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9 })
      );
      sideBox.position.set(0, -4, 0);
      bonsaiGroup.add(sideBox);

      // 三维立体物理标尺
      const rulerGroup = new THREE.Group();
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 34),
        new THREE.MeshBasicMaterial({ color: 0x94a3b8 })
      );
      pole.position.set(-17, 17, -17);
      rulerGroup.add(pole);

      const ringHeights = [2, 10, 18, 26];
      marks.forEach((mark, mIdx) => {
        const y = ringHeights[mIdx] || 20;
        const ring = new THREE.Mesh(
          new THREE.TorusGeometry(0.8, 0.08, 8, 24),
          new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
        );
        ring.rotation.x = Math.PI / 2;
        ring.position.set(-17, y, -17);
        rulerGroup.add(ring);
      });
      bonsaiGroup.add(rulerGroup);
    };
  });
}

// 重新提取动画 (再取出来一次)
const reExtractBonsai = () => {
  if (!bonsaiGroup) return;
  bonsaiGroup.position.y = -15;
  bonsaiGroup.scale.set(0.7, 0.7, 0.7);
  gsap.to(bonsaiGroup.position, {
    y: 0,
    duration: 1.5,
    ease: 'power3.out'
  });
  gsap.to(bonsaiGroup.scale, {
    x: 1, y: 1, z: 1,
    duration: 1.5,
    ease: 'power3.out'
  });
};

// 四大科学实验台模型渲染
let evolutionMesh = null;
function buildEvolutionModel() {
  while (modelGroup.children.length > 0) {
    modelGroup.remove(modelGroup.children[0]);
  }
  climateParticles = null;
  globeMesh = null;

  const labId = props.activeLabId || 'loess';

  if (labId === 'loess') {
    // 1. 黄土高原侵蚀演化模型
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
    evolutionMesh = new THREE.Mesh(geo, mat);
    evolutionMesh.receiveShadow = true;
    evolutionMesh.castShadow = true;
    modelGroup.add(evolutionMesh);

    const box = new THREE.Mesh(
      new THREE.BoxGeometry(size + 1, 4, size + 1),
      new THREE.MeshStandardMaterial({ color: 0x1f2937 })
    );
    box.position.set(0, -2, 0);
    modelGroup.add(box);
  } else if (labId === 'tectonic') {
    // 2. 秦岭板块造山与地堑断陷模型
    const size = 34;
    const tStage = props.currentTectonicStage || 0;

    // 扬子板块 (南侧)
    const southGeo = new THREE.BoxGeometry(size, 8, 14);
    const southMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.7 });
    const southMesh = new THREE.Mesh(southGeo, southMat);
    southMesh.position.set(0, -4, 10);
    modelGroup.add(southMesh);

    // 秦岭中央造山抬升断块
    const upliftHeight = tStage >= 1 ? 16 : 8;
    const qinlingGeo = new THREE.ConeGeometry(8, upliftHeight, 4);
    qinlingGeo.rotateY(Math.PI / 4);
    const qinlingMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.4 });
    const qinlingMesh = new THREE.Mesh(qinlingGeo, qinlingMat);
    qinlingMesh.position.set(0, upliftHeight / 2 - 2, 2);
    modelGroup.add(qinlingMesh);

    // 渭河断陷地堑 (北侧陷落带)
    const grabenDrop = tStage === 2 ? -3 : 0;
    const grabenGeo = new THREE.BoxGeometry(size, 4, 10);
    const grabenMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.8 });
    const grabenMesh = new THREE.Mesh(grabenGeo, grabenMat);
    grabenMesh.position.set(0, -2 + grabenDrop, -10);
    modelGroup.add(grabenMesh);

    // 断裂带发光切线
    const faultMat = new THREE.LineBasicMaterial({ color: 0xef4444, linewidth: 2 });
    const fPts = [new THREE.Vector3(-17, 0, -4), new THREE.Vector3(17, 0, -4)];
    const fLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(fPts), faultMat);
    modelGroup.add(fLine);
  } else if (labId === 'climate') {
    // 3. 秦岭一山分南北气候模拟
    const wallGeo = new THREE.BoxGeometry(32, 14, 4);
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.5 });
    const wallMesh = new THREE.Mesh(wallGeo, wallMat);
    wallMesh.position.set(0, 7, 0);
    modelGroup.add(wallMesh);

    // 粒子系统：北侧冷气流 (蓝色) 与南侧暖湿气流 (绿色)
    const particleCount = 200;
    const pGeo = new THREE.BufferGeometry();
    const pPositions = new Float32Array(particleCount * 3);
    const pColors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const isNorth = i < particleCount / 2;
      const x = (Math.random() - 0.5) * 30;
      const y = Math.random() * 12 + 2;
      const z = isNorth ? -Math.random() * 14 - 2 : Math.random() * 14 + 2;

      pPositions[i * 3] = x;
      pPositions[i * 3 + 1] = y;
      pPositions[i * 3 + 2] = z;

      if (isNorth) {
        pColors[i * 3] = 0.22;
        pColors[i * 3 + 1] = 0.74;
        pColors[i * 3 + 2] = 0.97;
      } else {
        pColors[i * 3] = 0.06;
        pColors[i * 3 + 1] = 0.73;
        pColors[i * 3 + 2] = 0.51;
      }
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPositions, 3));
    pGeo.setAttribute('color', new THREE.BufferAttribute(pColors, 3));

    const pMat = new THREE.PointsMaterial({ size: 0.8, vertexColors: true, transparent: true, opacity: 0.8 });
    climateParticles = new THREE.Points(pGeo, pMat);
    modelGroup.add(climateParticles);
  } else if (labId === 'globe') {
    // 4. 地球视角与大地原点
    const sphereGeo = new THREE.SphereGeometry(14, 32, 32);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      wireframe: true,
      roughness: 0.8
    });
    globeMesh = new THREE.Mesh(sphereGeo, sphereMat);
    modelGroup.add(globeMesh);

    // 经纬原点标杆
    const beacon = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.2, 8),
      new THREE.MeshBasicMaterial({ color: 0xf59e0b })
    );
    beacon.position.set(0, 16, 0);
    modelGroup.add(beacon);

    const bTextCanvas = createTextBillboardCanvas('中华人民共和国大地原点', '#f59e0b', "陕西省泾阳县永乐镇 · 34°32'N 108°55'E");
    const bTexture = new THREE.CanvasTexture(bTextCanvas);
    const bSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: bTexture }));
    bSprite.position.set(0, 22, 0);
    bSprite.scale.set(24, 6, 1);
    modelGroup.add(bSprite);
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
      color: new THREE.Color(stage.routeColor || '#ef4444'),
      emissive: new THREE.Color(stage.routeColor || '#ef4444'),
      emissiveIntensity: 0.9,
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

// 投影 POI 屏幕空间坐标
function updatePoiScreenPositions() {
  if (!camera) return;
  const width = containerRef.value.clientWidth;
  const height = containerRef.value.clientHeight;

  if (props.currentMode === 'macro') {
    screenPois.value = POI_LIST.map(poi => {
      const vec = new THREE.Vector3(poi.pos[0], poi.pos[1] + 3.2, poi.pos[2]);
      vec.project(camera);
      const isVisible = vec.z < 1.0 && Math.abs(vec.x) <= 1.1 && Math.abs(vec.y) <= 1.1;
      return {
        ...poi,
        x: Math.round((vec.x * 0.5 + 0.5) * width),
        y: Math.round((-vec.y * 0.5 + 0.5) * height),
        visible: isVisible
      };
    });
  } else if (props.currentMode === 'campaign' && props.activeCampaign) {
    const stage = props.activeCampaign.stages[props.activeCampaignStageIndex] || props.activeCampaign.stages[0];
    if (stage) {
      screenCheckpoints.value = stage.checkpoints.map(cp => {
        const vec = new THREE.Vector3(cp.pos[0], cp.pos[1] + 3.0, cp.pos[2]);
        vec.project(camera);
        const isVisible = vec.z < 1.0 && Math.abs(vec.x) <= 1.1 && Math.abs(vec.y) <= 1.1;
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

// 运镜与视角控制
const flyTo = (pos, target, duration = 2.0) => {
  if (!camera || !controls) return;
  gsap.to(camera.position, {
    x: pos[0], y: pos[1], z: pos[2], duration, ease: 'power3.inOut'
  });
  gsap.to(controls.target, {
    x: target[0], y: target[1], z: target[2], duration, ease: 'power3.inOut'
  });
};

const onPoiClick = (poi) => {
  selectedPoiId.value = poi.id;
  emit('select-poi', poi);
  flyTo([poi.pos[0] + 5, poi.pos[1] + 16, poi.pos[2] + 18], [poi.pos[0], poi.pos[1], poi.pos[2]], 1.8);
};

const resetNorth = () => {
  if (!camera || !controls) return;
  const dist = camera.position.distanceTo(controls.target);
  flyTo([controls.target.x, controls.target.y + dist * 0.6, controls.target.z + dist * 0.8], [controls.target.x, controls.target.y, controls.target.z], 1.2);
};

const setLighting = (mode) => {
  if (!sunLight || !skyFillLight) return;
  if (mode === 'dawn') {
    sunLight.position.set(70, 45, 60);
    sunLight.color.setHex(0xfbbf24);
    sunLight.intensity = 2.4;
    skyFillLight.color.setHex(0x38bdf8);
  } else if (mode === 'noon') {
    sunLight.position.set(20, 130, 20);
    sunLight.color.setHex(0xffffff);
    sunLight.intensity = 2.0;
    skyFillLight.color.setHex(0x93c5fd);
  } else if (mode === 'sunset') {
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
    flowOffset += 0.04;
    silkRoadLine.material.dashOffset = -flowOffset;
  }

  if (globeMesh) {
    globeMesh.rotation.y += 0.003;
  }

  if (camera && controls) {
    const pitch = Math.round((camera.rotation.x * 180) / Math.PI);
    const dir = new THREE.Vector3();
    camera.getWorldDirection(dir);
    const azimuth = Math.round(Math.atan2(-dir.x, -dir.z) * (180 / Math.PI));
    emit('camera-update', { pitch: Math.abs(pitch), azimuth });
  }

  updatePoiScreenPositions();
  renderer.render(scene, camera);
};

// 监听模式切换
watch(() => props.currentMode, (newMode) => {
  if (!macroGroup || !bonsaiGroup || !modelGroup || !campaignGroup) return;

  macroGroup.visible = newMode === 'macro' || newMode === 'campaign';
  bonsaiGroup.visible = newMode === 'bonsai';
  modelGroup.visible = newMode === 'model';
  campaignGroup.visible = newMode === 'campaign';

  if (newMode === 'macro') {
    flyTo([0, 95, 125], [0, 0, 0], 1.5);
  } else if (newMode === 'bonsai') {
    flyTo([0, 28, 42], [0, 6, 0], 1.5);
    buildBonsaiBlock();
  } else if (newMode === 'model') {
    flyTo([0, 32, 45], [0, 4, 0], 1.5);
    buildEvolutionModel();
  } else if (newMode === 'campaign' && props.activeCampaign) {
    const cam = props.activeCampaign.camera;
    flyTo(cam.pos, cam.target, 1.8);
    buildCampaignVisuals();
  }
});

// 监听图层显隐
watch(() => props.layers, (newLayers) => {
  if (!newLayers) return;
  if (borderSubGroup) borderSubGroup.visible = !!newLayers.border;
  if (riversSubGroup) riversSubGroup.visible = !!newLayers.rivers;
  if (qinlingSubGroup) qinlingSubGroup.visible = !!newLayers.qinlingLine;
  if (silkRoadSubGroup) silkRoadSubGroup.visible = !!newLayers.silkRoad;
  if (regionsSubGroup) regionsSubGroup.visible = !!newLayers.regions;
  if (poisSubGroup) poisSubGroup.visible = !!newLayers.pois;
}, { deep: true, immediate: true });

// 监听微观盆景切换与放大倍数
watch([() => props.activeBonsaiId, () => props.bonsaiExaggeration], () => {
  if (props.currentMode === 'bonsai') {
    buildBonsaiBlock();
  }
});

// 监听科学实验台切换
watch([() => props.activeLabId, () => props.currentTectonicStage, () => props.activeModelStage], () => {
  if (props.currentMode === 'model') {
    buildEvolutionModel();
  }
});

watch([() => props.activeCampaign, () => props.activeCampaignStageIndex], () => {
  if (props.currentMode === 'campaign') {
    buildCampaignVisuals();
  }
});

watch(() => props.lightingMode, (mode) => {
  setLighting(mode);
});

onMounted(() => {
  initThree();
});

onBeforeUnmount(() => {
  if (animFrameId) cancelAnimationFrame(animFrameId);
  window.removeEventListener('resize', onWindowResize);
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

.poi-badge {
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(10, 15, 22, 0.88);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(56, 189, 248, 0.45);
  border-radius: 20px;
  padding: 4px 12px 4px 6px;
  color: #fff;
  cursor: pointer;
  transition: opacity 0.25s, transform 0.25s;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
}

.poi-badge.visible {
  opacity: 0.95;
}

.poi-badge:hover, .poi-badge.active {
  opacity: 1;
  border-color: #38bdf8;
  transform: translate(-50%, -50%) scale(1.1);
  box-shadow: 0 0 20px rgba(56, 189, 248, 0.6);
}

.poi-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #38bdf8;
  box-shadow: 0 0 10px #38bdf8;
}

.poi-title {
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
}

.poi-sub {
  font-size: 10px;
  color: #94a3b8;
  white-space: nowrap;
}

.campaign-badge {
  position: absolute;
  top: 0;
  left: 0;
  opacity: 0;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(26, 10, 10, 0.9);
  border: 1px solid #ef4444;
  border-radius: 20px;
  padding: 4px 12px 4px 8px;
  color: #fff;
  box-shadow: 0 0 18px rgba(239, 68, 68, 0.5);
  transition: opacity 0.25s, transform 0.25s;
}

.campaign-badge.visible {
  opacity: 1;
}

.camp-icon {
  font-size: 14px;
}

.camp-name {
  font-size: 12px;
  font-weight: 700;
  color: #fca5a5;
}

.camp-role {
  font-size: 10px;
  color: #94a3b8;
}

.loading-overlay {
  position: absolute;
  inset: 0;
  background: rgba(10, 14, 20, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  z-index: 40;
}

.loading-spinner {
  width: 44px;
  height: 44px;
  border: 3px solid rgba(56, 189, 248, 0.2);
  border-top-color: #38bdf8;
  border-radius: 50%;
  animation: spin 1s infinite linear;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-text {
  font-size: 14px;
  color: #cbd5e1;
  letter-spacing: 0.05em;
}
</style>
