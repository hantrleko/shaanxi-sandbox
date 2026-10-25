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
      <div class="loading-text">正在加载高精卫星遥感与真实 DEM 物理地形...</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import { POI_LIST } from '../data/shaanxiData.js';

const props = defineProps({
  currentMode: { type: String, default: 'macro' }, // 'macro' | 'bonsai' | 'model' | 'campaign'
  activeBonsaiId: { type: String, default: 'bonsai_huashan' },
  bonsaiExaggeration: { type: Number, default: 1.5 },
  activeModelStage: { type: Number, default: 1 },
  activeCampaign: { type: Object, default: null },
  activeCampaignStageIndex: { type: Number, default: 0 },
  lightingMode: { type: String, default: 'dawn' } // 'dawn' | 'noon' | 'sunset'
});

const emit = defineEmits(['camera-update', 'select-poi']);

const containerRef = ref(null);
const selectedPoiId = ref('xian');
const screenPois = ref([]);
const screenCheckpoints = ref([]);
const isLoadingData = ref(true);

let scene, camera, renderer, controls;
let macroGroup, bonsaiGroup, modelGroup, campaignGroup;
let terrainMesh, sunLight, skyFillLight;
let campaignRouteLines = [];
let animFrameId = null;
let flowOffset = 0;
let demCanvas = null;

// 初始化场景
const initThree = () => {
  const width = containerRef.value.clientWidth;
  const height = containerRef.value.clientHeight;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x06090e);
  scene.fog = new THREE.FogExp2(0x06090e, 0.0035);

  camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 1200);
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
  controls.maxDistance = 320;

  // 电影级多层次光照系统
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
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

  // 场景节点分组
  macroGroup = new THREE.Group();
  bonsaiGroup = new THREE.Group();
  modelGroup = new THREE.Group();
  campaignGroup = new THREE.Group();

  scene.add(macroGroup);
  scene.add(bonsaiGroup);
  scene.add(modelGroup);
  scene.add(campaignGroup);

  bonsaiGroup.visible = false;
  modelGroup.visible = false;
  campaignGroup.visible = false;

  // 异步加载真实 DEM 与卫星影像并创建影院级沙盘
  loadRealTerrainAssets();

  window.addEventListener('resize', onWindowResize);
  animate();
};

// 异步加载真实 DEM 高程图与卫星影像
function loadRealTerrainAssets() {
  const textureLoader = new THREE.TextureLoader();
  const baseUrl = import.meta.env.BASE_URL || './';
  const prefix = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';

  // 1. 加载卫星航拍纹理
  textureLoader.load(
    prefix + 'textures/shaanxi_satellite.jpg',
    (satTexture) => {
      satTexture.colorSpace = THREE.SRGBColorSpace;
      satTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
      satTexture.generateMipmaps = true;

      // 2. 加载 DEM 图像并读取像素置换高度
      const demImg = new Image();
      demImg.src = prefix + 'textures/shaanxi_dem.png';
      demImg.onload = () => {
        demCanvas = document.createElement('canvas');
        demCanvas.width = demImg.width;
        demCanvas.height = demImg.height;
        const ctx = demCanvas.getContext('2d');
        ctx.drawImage(demImg, 0, 0);

        buildRealMacroTerrain(satTexture, ctx, demCanvas.width, demCanvas.height);
        buildShaanxiBorder();
        buildRivers();
        buildSilkRoad();
        buildSpatialFloatingLabels();
        buildBonsaiBlock(satTexture);
        buildEvolutionModel();
        buildCampaignVisuals();

        isLoadingData.value = false;
      };
      demImg.onerror = () => {
        console.warn('Failed to load DEM image, fallback to procedural height');
        buildRealMacroTerrain(satTexture, null, 0, 0);
        isLoadingData.value = false;
      };
    },
    undefined,
    (err) => {
      console.warn('Failed to load satellite texture, fallback to procedural', err);
      buildRealMacroTerrain(null, null, 0, 0);
      isLoadingData.value = false;
    }
  );
}

// 构建由真实 DEM 驱动的超高精度三维地貌
function buildRealMacroTerrain(satTexture, demCtx, demW, demH) {
  const width = 80;
  const depth = 140;
  const segX = 220; // 220x300 高密网格
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

    // 将网格三维坐标 (x, z) 映射到 DEM 图片 UV (u, v)
    const u = (x / width) + 0.5;
    const v = (z / depth) + 0.5;

    let h = 0;
    if (demData && u >= 0 && u <= 1 && v >= 0 && v <= 1) {
      const px = Math.floor(u * (demW - 1));
      const py = Math.floor(v * (demH - 1));
      const pIdx = (py * demW + px) * 4;
      const grey = demData[pIdx]; // 0 ~ 255 (对应 150m ~ 3800m)

      // 物理高程映射到 3D 高度 (秦岭最高约 18 单位，平原约 2 单位)
      h = Math.pow(grey / 255.0, 1.1) * 18.5;
    } else {
      // 容错后备程序化高度
      h = (z > 12) ? Math.max(0, 1 - Math.abs(z - 18) / 14) * 14 : 1.5;
    }

    pos.setY(i, h);
  }

  geo.computeVertexNormals();

  // 影院级 PBR 地形材质
  const mat = new THREE.MeshStandardMaterial({
    map: satTexture || null,
    color: satTexture ? 0xffffff : 0x78716c,
    roughness: 0.82,
    metalness: 0.08,
    flatShading: false
  });

  terrainMesh = new THREE.Mesh(geo, mat);
  terrainMesh.receiveShadow = true;
  terrainMesh.castShadow = true;
  macroGroup.add(terrainMesh);

  // 精雕黑曜石倒角底座 (Obsidian Precision Pedestal)
  const pedestalGeo = new THREE.BoxGeometry(84, 4, 144);
  const pedestalMat = new THREE.MeshStandardMaterial({
    color: 0x0a0f16,
    roughness: 0.5,
    metalness: 0.8
  });
  const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
  pedestal.position.set(0, -2.01, 0);
  macroGroup.add(pedestal);

  // 边框发光倒角金线
  const rimGeo = new THREE.EdgesGeometry(pedestalGeo);
  const rimMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.35 });
  const rimLine = new THREE.LineSegments(rimGeo, rimMat);
  pedestal.add(rimLine);
}

// 绘制发光省界多边形
function buildShaanxiBorder() {
  const borderPoints = [
    new THREE.Vector3(-15, 6.2, -60),
    new THREE.Vector3(12, 5.8, -60),
    new THREE.Vector3(26, 4.8, -45),
    new THREE.Vector3(28, 3.8, -20),
    new THREE.Vector3(24, 3.2, 0),
    new THREE.Vector3(22, 6.5, 18),
    new THREE.Vector3(18, 5.8, 55),
    new THREE.Vector3(-8, 5.2, 62),
    new THREE.Vector3(-22, 5.6, 45),
    new THREE.Vector3(-28, 6.2, 15),
    new THREE.Vector3(-24, 3.5, -5),
    new THREE.Vector3(-20, 5.2, -35),
    new THREE.Vector3(-15, 6.2, -60)
  ];

  const curve = new THREE.CatmullRomCurve3(borderPoints, true);
  const tubeGeo = new THREE.TubeGeometry(curve, 180, 0.4, 8, true);
  const borderMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x0284c7,
    emissiveIntensity: 0.85,
    roughness: 0.2
  });

  const borderLine = new THREE.Mesh(tubeGeo, borderMat);
  macroGroup.add(borderLine);
}

// 水系网络
function buildRivers() {
  const riversMesh = new THREE.Group();

  // 黄河
  const yellowRiverPts = [];
  for (let z = -60; z <= 8; z += 4) {
    const x = 24 + Math.sin(z * 0.2) * 2.5;
    yellowRiverPts.push(new THREE.Vector3(x, 2.2, z));
  }
  const yrCurve = new THREE.CatmullRomCurve3(yellowRiverPts);
  const yrGeo = new THREE.TubeGeometry(yrCurve, 64, 0.65, 8, false);
  const yrMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xd97706,
    emissiveIntensity: 0.65,
    roughness: 0.1,
    metalness: 0.5
  });
  riversMesh.add(new THREE.Mesh(yrGeo, yrMat));

  // 渭河
  const weiRiverPts = [];
  for (let x = -24; x <= 22; x += 4) {
    const z = 5 + Math.sin(x * 0.25) * 1.8;
    weiRiverPts.push(new THREE.Vector3(x, 2.0, z));
  }
  const weiCurve = new THREE.CatmullRomCurve3(weiRiverPts);
  const weiGeo = new THREE.TubeGeometry(weiCurve, 48, 0.5, 8, false);
  const weiMat = new THREE.MeshStandardMaterial({
    color: 0x06b6d4,
    emissive: 0x0891b2,
    emissiveIntensity: 0.8,
    roughness: 0.1,
    metalness: 0.4
  });
  riversMesh.add(new THREE.Mesh(weiGeo, weiMat));

  // 汉江
  const hanRiverPts = [];
  for (let x = -20; x <= 22; x += 4) {
    const z = 32 + Math.cos(x * 0.2) * 3.0;
    hanRiverPts.push(new THREE.Vector3(x, 2.1, z));
  }
  const hanCurve = new THREE.CatmullRomCurve3(hanRiverPts);
  const hanGeo = new THREE.TubeGeometry(hanCurve, 48, 0.55, 8, false);
  const hanMat = new THREE.MeshStandardMaterial({
    color: 0x2563eb,
    emissive: 0x1d4ed8,
    emissiveIntensity: 0.8,
    roughness: 0.1,
    metalness: 0.4
  });
  riversMesh.add(new THREE.Mesh(hanGeo, hanMat));

  macroGroup.add(riversMesh);
}

// 丝绸之路起始脉冲流光线
let silkRoadLine = null;
function buildSilkRoad() {
  const silkPts = [
    new THREE.Vector3(0, 2.5, 5),
    new THREE.Vector3(-6, 2.8, 5.5),
    new THREE.Vector3(-14, 3.0, 6.5),
    new THREE.Vector3(-22, 4.2, 5.0),
    new THREE.Vector3(-36, 5.5, 0.0)
  ];

  const curve = new THREE.CatmullRomCurve3(silkPts);
  const points = curve.getPoints(100);
  const geometry = new THREE.BufferGeometry().setFromPoints(points);

  const mat = new THREE.LineDashedMaterial({
    color: 0xf59e0b,
    dashSize: 1.8,
    gapSize: 0.8,
    linewidth: 3
  });

  silkRoadLine = new THREE.Line(geometry, mat);
  silkRoadLine.computeLineDistances();
  macroGroup.add(silkRoadLine);
}

// 空间地标 POI
function buildSpatialFloatingLabels() {
  const createMarker = (x, y, z, color = 0x38bdf8) => {
    const pinGroup = new THREE.Group();
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(0.8, 16, 16),
      new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.6 })
    );
    const stem = new THREE.Mesh(
      new THREE.CylinderGeometry(0.08, 0.08, 2.5),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.6 })
    );
    sphere.position.y = 2.5;
    stem.position.y = 1.25;
    pinGroup.add(sphere);
    pinGroup.add(stem);
    pinGroup.position.set(x, y, z);
    return pinGroup;
  };

  POI_LIST.forEach(poi => {
    let pinColor = 0x38bdf8;
    if (poi.type === 'capital') pinColor = 0xf59e0b;
    if (poi.type === 'mountain') pinColor = 0xec4899;
    if (poi.type === 'nature') pinColor = 0x10b981;
    if (poi.type === 'red') pinColor = 0xf43f5e;
    const pin = createMarker(poi.pos[0], poi.pos[1] + 1.0, poi.pos[2], pinColor);
    macroGroup.add(pin);
  });
}

// 构建微观盆景
function buildBonsaiBlock(satTexture) {
  while (bonsaiGroup.children.length > 0) {
    bonsaiGroup.remove(bonsaiGroup.children[0]);
  }

  const size = 30;
  const segs = 80;
  const topGeo = new THREE.PlaneGeometry(size, size, segs, segs);
  topGeo.rotateX(-Math.PI / 2);

  const pos = topGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const dist = Math.sqrt(x * x + z * z);
    let h = (dist < 12)
      ? Math.pow(Math.max(0, 1 - dist / 12), 0.7) * 17 + Math.sin(x * 0.9) * Math.cos(z * 0.9) * 2.0
      : Math.max(0, 1 - dist / 15) * 2.5;
    pos.setY(i, h * (props.bonsaiExaggeration || 1.5));
  }
  topGeo.computeVertexNormals();

  const topMat = new THREE.MeshStandardMaterial({
    map: satTexture || null,
    color: satTexture ? 0xffffff : 0x78716c,
    roughness: 0.8,
    metalness: 0.1
  });
  const bonsaiMesh = new THREE.Mesh(topGeo, topMat);
  bonsaiMesh.castShadow = true;
  bonsaiMesh.receiveShadow = true;
  bonsaiGroup.add(bonsaiMesh);

  // 四周地质岩层垂直剖面
  const sideBox = new THREE.Mesh(
    new THREE.BoxGeometry(size, 8, size),
    new THREE.MeshStandardMaterial({ color: 0x1c1917, roughness: 0.9 })
  );
  sideBox.position.set(0, -4, 0);
  bonsaiGroup.add(sideBox);

  // 海拔标尺
  const elevationRuler = new THREE.Group();
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.2, 30),
    new THREE.MeshBasicMaterial({ color: 0x94a3b8 })
  );
  pole.position.set(-16, 15, -16);
  elevationRuler.add(pole);

  [6, 14, 22, 28].forEach((y) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.8, 0.08, 8, 24),
      new THREE.MeshBasicMaterial({ color: 0x38bdf8 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(-16, y, -16);
    elevationRuler.add(ring);
  });
  bonsaiGroup.add(elevationRuler);
}

// 演变模型
let evolutionMesh = null;
function buildEvolutionModel() {
  while (modelGroup.children.length > 0) {
    modelGroup.remove(modelGroup.children[0]);
  }

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
  campaignRouteLines = [];

  if (!props.activeCampaign) return;

  const stage = props.activeCampaign.stages[props.activeCampaignStageIndex] || props.activeCampaign.stages[0];
  if (!stage) return;

  // 1. 绘制军团进军动态发光折线
  stage.routes.forEach((routePts) => {
    const pts = routePts.map(p => new THREE.Vector3(p[0], p[1] + 1.2, p[2]));
    const curve = new THREE.CatmullRomCurve3(pts);
    const tubeGeo = new THREE.TubeGeometry(curve, 60, 0.35, 8, false);
    const tubeMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color(stage.routeColor || '#ef4444'),
      emissive: new THREE.Color(stage.routeColor || '#ef4444'),
      emissiveIntensity: 0.9,
      roughness: 0.2
    });
    const tubeMesh = new THREE.Mesh(tubeGeo, tubeMat);
    campaignGroup.add(tubeMesh);
    campaignRouteLines.push(tubeMesh);
  });

  // 2. 战场关键冲突点 3D 战斗标志物
  stage.checkpoints.forEach((cp) => {
    const cpMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16),
      new THREE.MeshStandardMaterial({ color: 0xef4444, emissive: 0xb91c1c, emissiveIntensity: 0.8 })
    );
    cpMesh.position.set(cp.pos[0], cp.pos[1] + 1.5, cp.pos[2]);
    campaignGroup.add(cpMesh);
  });
}

// 投影 POI 与 战役 Checkpoints 屏幕空间
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

// 飞行运镜
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
  const dist = camera.position.distanceTo(controls.target);
  flyTo([controls.target.x, controls.target.y + dist * 0.6, controls.target.z + dist * 0.8], [controls.target.x, controls.target.y, controls.target.z], 1.2);
};

// 切换电影级光照模式
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

  if (camera && controls) {
    const pitch = Math.round((camera.rotation.x * 180) / Math.PI);
    emit('camera-update', { pitch: Math.abs(pitch) });
  }

  updatePoiScreenPositions();
  renderer.render(scene, camera);
};

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
  } else if (newMode === 'model') {
    flyTo([0, 32, 45], [0, 4, 0], 1.5);
  } else if (newMode === 'campaign' && props.activeCampaign) {
    const cam = props.activeCampaign.camera;
    flyTo(cam.pos, cam.target, 1.8);
    buildCampaignVisuals();
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

watch(() => props.activeModelStage, (newStage) => {
  if (evolutionMesh && evolutionMesh.geometry) {
    updateEvolutionGeometry(evolutionMesh.geometry, newStage);
    evolutionMesh.material.color.setHex(newStage === 7 ? 0x2d6a4f : 0xd97706);
  }
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
  setLighting
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

/* 战役冲突标记 */
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

/* 加载遮罩 */
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
