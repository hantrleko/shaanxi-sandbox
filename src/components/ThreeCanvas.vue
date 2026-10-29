<template>
  <div class="canvas-container" ref="containerRef">
    <!-- 测绘模式实时步骤交互提示栏 -->
    <div v-if="isProfilingActive" class="interactive-step-hud">
      <div class="hud-pill-box">
        <span class="hud-step-badge">{{ profilingStep === 1 ? '步骤 1 / 2' : '步骤 2 / 2' }}</span>
        <span class="hud-step-text">{{ profilingStep === 1 ? '请在 3D 地形表面点击起点 A' : '请点击终点 B 生成高程剖面曲线' }}</span>
        <button class="hud-step-cancel" @click="$emit('cancel-profiling')">退出测绘</button>
      </div>
    </div>
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

        <!-- 悬停即时实景微缩图卡 (150x85 Hover Quick Card) -->
        <div v-if="hoveredPoiId === poi.id && poi.photoUrl" class="poi-hover-preview glass-panel">
          <img :src="poi.photoUrl" :alt="poi.name" class="poi-preview-img" />
          <div class="poi-preview-bar">
            <span class="preview-name">{{ poi.name }}</span>
            <span class="preview-badge">{{ poi.type === 'mountain' ? '名山天险' : (poi.type === 'capital' ? '古都源头' : '胜景地标') }}</span>
          </div>
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
      <div class="loading-text">正在加载高精卫星遥感影像与 DEM 浮雕地形...</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import gsap from 'gsap';
import { POI_LIST, CULTURAL_ITEMS } from '../data/shaanxiData.js';
import { CITY_BOUNDARIES, REAL_RIVERS, REAL_POIS, REAL_REGIONS, REAL_CAMPAIGN_ROUTES } from '../data/shaanxiGeoVectors.js';
import { soundscape } from '../utils/soundscape.js';

const props = defineProps({
  currentMode: { type: String, default: 'macro' }, // 'macro' | 'bonsai' | 'model' | 'campaign'
  activeBonsaiId: { type: String, default: 'bonsai_huashan' },
  bonsaiExaggeration: { type: Number, default: 1.5 },
  activeModelStage: { type: Number, default: 1 },
  activeCampaign: { type: Object, default: null },
  activeCampaignStageIndex: { type: Number, default: 0 },
  lightingMode: { type: String, default: 'dawn' }, // 'dawn' | 'noon' | 'sunset'
  seasonMode: { type: String, default: 'natural' }, // 'natural' | 'spring' | 'summer' | 'autumn' | 'winter'
  layers: {
    type: Object,
    default: () => ({ border: true, rivers: true, qinlingLine: true, silkRoad: true, pois: true })
  },
  activeLabId: { type: String, default: 'loess' },
  currentTectonicStage: { type: Number, default: 0 },
  activeChapterId: { type: String, default: 'geo_01' },
  isProfilingActive: { type: Boolean, default: false },
  isRoadbookActive: { type: Boolean, default: false },
  isChallengeActive: { type: Boolean, default: false },
  isPortalActive: { type: Boolean, default: true },
  isPanelOpen: { type: Boolean, default: false }
});

const emit = defineEmits([
  'camera-update',
  'select-poi',
  'profile-calculated',
  'challenge-click',
  'select-culture',
  'cancel-profiling',
  'roadbook-point-added'
]);

const containerRef = ref(null);
const selectedPoiId = ref('xian');
const hoveredPoiId = ref(null);
const screenPois = ref([]);
const screenCheckpoints = ref([]);
const isLoadingData = ref(true);
const profilingStep = ref(1);
let terrainReticleMesh = null;

let scene, camera, renderer, controls;
let macroGroup, bonsaiGroup, modelGroup, campaignGroup;
let borderSubGroup, riversSubGroup, qinlingSubGroup, silkRoadSubGroup, poisSubGroup, culturalSubGroup, profilingMeasureGroup, citiesSubGroup;
let terrainMesh, sunLight, skyFillLight;
let silkRoadLine = null;
let qinlingLineMesh = null;
let animFrameId = null;
let flowOffset = 0;
let demCanvas = null;

// 动态信标与高阶渲染动画追踪
let animatedCrystals = [];
let animatedSonarRings = [];
let silkRoadParticles = null;
let riverMeshes = [];

// 四季片元着色器 Uniforms
let seasonUniforms = {
  uSeason: { value: 0.0 },
  uPrevSeason: { value: 0.0 },
  uSeasonBlend: { value: 1.0 }
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
    powerPreference: 'high-performance',
    preserveDrawingBuffer: true
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
  culturalSubGroup = new THREE.Group();
  profilingMeasureGroup = new THREE.Group();
  citiesSubGroup = new THREE.Group();

  macroGroup.add(borderSubGroup);
  macroGroup.add(riversSubGroup);
  macroGroup.add(qinlingSubGroup);
  macroGroup.add(silkRoadSubGroup);
  macroGroup.add(poisSubGroup);
  macroGroup.add(culturalSubGroup);
  macroGroup.add(profilingMeasureGroup);
  macroGroup.add(citiesSubGroup);

  renderer.domElement.addEventListener('pointerdown', onCanvasPointerDown);
  renderer.domElement.addEventListener('pointermove', onCanvasPointerMove);

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
  scene.add(terrainReticleMesh);

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

  // 8秒兜底安全计时器，防止在极端弱网或离线环境下遮罩死锁
  setTimeout(() => {
    if (isLoadingData.value) {
      console.warn('Terrain assets load timeout fallback activated.');
      isLoadingData.value = false;
    }
  }, 8000);

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
          demImg.crossOrigin = 'anonymous';
          demImg.src = demUrl;
          demImg.onload = () => {
            try {
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
              buildProceduralCities();
              buildSpatialPins();
              buildCulturalHotspots();
              buildBonsaiBlock();
              buildEvolutionModel();
              buildCampaignVisuals();
            } catch (err) {
              console.error('Error initializing 3D terrain assets:', err);
            } finally {
              isLoadingData.value = false;
            }
          };
          demImg.onerror = () => {
            try {
              buildRealMacroTerrain(satTexture, normalTexture, null, 0, 0);
              buildShaanxiBorder();
              buildRivers();
              buildQinlingLine();
              buildSilkRoad();
              buildProceduralCities();
              buildSpatialPins();
              buildBonsaiBlock();
              buildEvolutionModel();
              buildCampaignVisuals();
            } catch (e) {
              console.error(e);
            } finally {
              isLoadingData.value = false;
            }
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
    try {
      demData = demCtx.getImageData(0, 0, demW, demH).data;
    } catch (e) {
      console.warn('DEM getImageData failed, falling back to analytic formula:', e);
    }
  }

  // 1. 根据 DEM 置换网格顶部高程 (双线性插值消除锯齿阶梯伪影)
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);

    const u = (x / width) + 0.5;
    const v = (z / depth) + 0.5;

    let h = 0;
    if (demData && u >= 0 && u <= 1 && v >= 0 && v <= 1) {
      const fx = u * (demW - 1);
      const fy = v * (demH - 1);
      const x0 = Math.floor(fx);
      const y0 = Math.floor(fy);
      const x1 = Math.min(x0 + 1, demW - 1);
      const y1 = Math.min(y0 + 1, demH - 1);
      const rx = fx - x0;
      const ry = fy - y0;

      const p00 = demData[(y0 * demW + x0) * 4];
      const p10 = demData[(y0 * demW + x1) * 4];
      const p01 = demData[(y1 * demW + x0) * 4];
      const p11 = demData[(y1 * demW + x1) * 4];

      const val = (p00 * (1 - rx) + p10 * rx) * (1 - ry) + (p01 * (1 - rx) + p11 * rx) * ry;
      h = Math.pow(val / 255.0, 1.08) * 18.5;
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

  // 注入四季地貌与电影级天光散射片元着色器 (GLSL Atmospheric Shader)
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uSeason = seasonUniforms.uSeason;
    shader.uniforms.uPrevSeason = seasonUniforms.uPrevSeason;
    shader.uniforms.uSeasonBlend = seasonUniforms.uSeasonBlend;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
       varying vec3 vTerrainWorldPos;`
    );

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       vTerrainWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
       uniform float uSeason;
       uniform float uPrevSeason;
       uniform float uSeasonBlend;
       varying vec3 vTerrainWorldPos;

       vec3 calcSeasonCol(float s, vec3 orig, vec3 pos) {
         if (s < 0.5) return orig;
         float h = pos.y;
         float z = pos.z;
         
         if (s < 1.5) {
           // 春·秦巴花海与关中新绿
           float flowerMask = smoothstep(18.0, 32.0, z) * (1.0 - smoothstep(4.0, 9.0, h));
           vec3 rapeseedGold = vec3(0.96, 0.82, 0.16);
           vec3 springGreen = vec3(0.38, 0.68, 0.28);
           vec3 col = mix(orig, springGreen, 0.35);
           col = mix(col, rapeseedGold, flowerMask * 0.72);
           if (h > 13.5) col = mix(col, vec3(0.92, 0.96, 1.0), 0.4);
           return col;
         } else if (s < 2.5) {
           // 夏·翠峦云海
           vec3 lushEmerald = vec3(0.16, 0.52, 0.20);
           vec3 deepForest = vec3(0.10, 0.40, 0.16);
           float mountainMask = smoothstep(2.5, 9.0, h);
           vec3 forest = mix(lushEmerald, deepForest, mountainMask);
           return mix(orig, forest, 0.48);
         } else if (s < 3.5) {
           // 秋·太白金枫与高原暖阳
           vec3 loessWarm = vec3(0.86, 0.64, 0.28);
           float loessMask = 1.0 - smoothstep(-8.0, 16.0, z);
           float mapleMask = smoothstep(0.0, 16.0, z) * smoothstep(4.2, 7.8, h) * (1.0 - smoothstep(12.5, 15.0, h));
           vec3 mapleRed = vec3(0.86, 0.28, 0.16);
           vec3 larchGold = vec3(0.92, 0.70, 0.18);
           vec3 foliage = mix(larchGold, mapleRed, 0.62);
           vec3 col = mix(orig, loessWarm, loessMask * 0.42);
           col = mix(col, foliage, mapleMask * 0.70);
           return col;
         } else {
           // 冬·北国雪原与秦岭冰封 (动量雪线覆盖)
           float northSnow = 1.0 - smoothstep(-25.0, 10.0, z);
           float altitudeSnow = smoothstep(5.0, 9.8, h);
           float snowMask = clamp(northSnow * 0.88 + altitudeSnow * 0.95, 0.0, 1.0);
           float shannanProtect = smoothstep(24.0, 42.0, z) * (1.0 - smoothstep(3.5, 7.5, h));
           snowMask *= (1.0 - shannanProtect * 0.85);
           vec3 snowCol = vec3(0.95, 0.97, 1.02);
           return mix(orig * vec3(0.82, 0.88, 0.96), snowCol, snowMask * 0.86);
         }
       }`
    );

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `#include <map_fragment>
       // 1. 四季色彩过渡
       vec3 colPrev = calcSeasonCol(uPrevSeason, diffuseColor.rgb, vTerrainWorldPos);
       vec3 colCurr = calcSeasonCol(uSeason, diffuseColor.rgb, vTerrainWorldPos);
       diffuseColor.rgb = mix(colPrev, colCurr, uSeasonBlend);

       // 2. 电影级大气天光 Fresnel 散射边缘微光 (Atmospheric Rim Glow)
       vec3 viewDir = normalize(cameraPosition - vTerrainWorldPos);
       float vDotN = max(dot(viewDir, normalize(vNormal)), 0.0);
       float rimFactor = pow(1.0 - vDotN, 3.2);
       vec3 rimScattering = vec3(0.22, 0.45, 0.72) * rimFactor * 0.38;

       // 3. 高海拔太白/华山花岗岩雪峰极顶高光 (Alpine Hypsometric Crest Highlight)
       float alpineMask = smoothstep(13.8, 18.5, vTerrainWorldPos.y);
       vec3 peakSnowTint = vec3(0.96, 0.98, 1.05);
       diffuseColor.rgb = mix(diffuseColor.rgb, peakSnowTint, alpineMask * 0.28);

       // 4. 陕北暖黄土高原台地微光漫射
       float loessWarmth = (1.0 - smoothstep(-6.0, 12.0, vTerrainWorldPos.z)) * smoothstep(2.5, 8.0, vTerrainWorldPos.y);
       diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.08, 1.02, 0.90), loessWarmth * 0.22);

       diffuseColor.rgb += rimScattering;`
    );
  };

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
    roughness: 0.88,
    metalness: 0.18
  });

  // 沉积岩层地质水平层理纹理 (Geological Strata Shading)
  skirtMat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      `#include <common>
       varying vec3 vSkirtWorldPos;`
    );
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       vSkirtWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;`
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <common>',
      `#include <common>
       varying vec3 vSkirtWorldPos;`
    );
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <dithering_fragment>',
      `#include <dithering_fragment>
       float strataBand = sin(vSkirtWorldPos.y * 3.5) * 0.4 + sin(vSkirtWorldPos.y * 10.0) * 0.2;
       vec3 strataRock = mix(vec3(0.06, 0.10, 0.16), vec3(0.14, 0.20, 0.28), strataBand * 0.5 + 0.5);
       gl_FragColor.rgb = mix(gl_FragColor.rgb, strataRock, 0.65);`
    );
  };
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

  // 4. 极坐标雷达战术底座刻度环 (Tactical Polar Grid)
  const radarGeo = new THREE.PlaneGeometry(240, 240);
  radarGeo.rotateX(-Math.PI / 2);

  const radarCanvas = document.createElement('canvas');
  radarCanvas.width = 1024;
  radarCanvas.height = 1024;
  const rCtx = radarCanvas.getContext('2d');

  rCtx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
  rCtx.lineWidth = 2;
  [180, 320, 440, 490].forEach(r => {
    rCtx.beginPath();
    rCtx.arc(512, 512, r, 0, Math.PI * 2);
    rCtx.stroke();
  });

  rCtx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
  rCtx.beginPath(); rCtx.moveTo(0, 512); rCtx.lineTo(1024, 512); rCtx.stroke();
  rCtx.beginPath(); rCtx.moveTo(512, 0); rCtx.lineTo(512, 1024); rCtx.stroke();

  rCtx.fillStyle = '#38bdf8';
  rCtx.font = 'bold 22px monospace';
  rCtx.textAlign = 'center';
  rCtx.textBaseline = 'middle';
  rCtx.fillText('000° N', 512, 40);
  rCtx.fillText('090° E', 970, 512);
  rCtx.fillText('180° S', 512, 984);
  rCtx.fillText('270° W', 54, 512);

  const radarTex = new THREE.CanvasTexture(radarCanvas);
  const radarMat = new THREE.MeshBasicMaterial({
    map: radarTex,
    transparent: true,
    opacity: 0.65,
    depthWrite: false
  });
  const radarMesh = new THREE.Mesh(radarGeo, radarMat);
  radarMesh.position.set(0, -4.55, 0);
  macroGroup.add(radarMesh);
}

// 绘制全省十地市真实矢量境界 (低噪点细虚线，杜绝粗暴切割)
function buildShaanxiBorder() {
  while (borderSubGroup.children.length > 0) {
    borderSubGroup.remove(borderSubGroup.children[0]);
  }

  // 1. 市级边界采用低视觉噪点的精致微虚线
  const cityLineMat = new THREE.LineDashedMaterial({
    color: 0x38bdf8,
    transparent: true,
    opacity: 0.28,
    dashSize: 1.2,
    gapSize: 0.8,
    scale: 1
  });

  CITY_BOUNDARIES.forEach((city) => {
    city.rings.forEach((ring) => {
      const pts = ring.map(p => new THREE.Vector3(p[0], p[1] + 0.14, p[2]));
      if (pts.length > 2) {
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const line = new THREE.Line(geo, cityLineMat);
        line.computeLineDistances();
        borderSubGroup.add(line);
      }
    });
  });

  // 2. 西安大都市特区金色辉光边界
  const xianCity = CITY_BOUNDARIES.find(c => c.name && c.name.includes("西安"));
  if (xianCity) {
    const xianMat = new THREE.LineBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.65,
      linewidth: 1.5
    });
    xianCity.rings.forEach((ring) => {
      const pts = ring.map(p => new THREE.Vector3(p[0], p[1] + 0.18, p[2]));
      if (pts.length > 2) {
        const geo = new THREE.BufferGeometry().setFromPoints(pts);
        const line = new THREE.LineLoop(geo, xianMat);
        borderSubGroup.add(line);
      }
    });
  }
}


// 构建精细流光河流 (拟真水色：黄河泥金、渭河蔚蓝、汉江碧玉)
function buildRivers() {
  while (riversSubGroup.children.length > 0) {
    riversSubGroup.remove(riversSubGroup.children[0]);
  }
  riverMeshes = [];

  const riverConfigs = {
    yellow_river: {
      color: 0xd97706,
      emissive: 0xb45309,
      emissiveIntensity: 0.85,
      radius: 0.26,
      opacity: 0.94
    },
    wei_river: {
      color: 0x0284c7,
      emissive: 0x0369a1,
      emissiveIntensity: 0.75,
      radius: 0.22,
      opacity: 0.88
    },
    han_river: {
      color: 0x0ea5e9,
      emissive: 0x0284c7,
      emissiveIntensity: 0.82,
      radius: 0.20,
      opacity: 0.90
    },
    jing_river: {
      color: 0xca8a04,
      emissive: 0xa16207,
      emissiveIntensity: 0.78,
      radius: 0.16,
      opacity: 0.92
    }
  };

  Object.entries(REAL_RIVERS).forEach(([key, ptsArray]) => {
    if (!ptsArray || ptsArray.length < 2) return;

    const conf = riverConfigs[key] || {
      color: 0x0284c7,
      emissive: 0x0369a1,
      emissiveIntensity: 0.7,
      radius: 0.16,
      opacity: 0.85
    };

    // 平滑曲线与低剖面微贴地 (仅离地 +0.06，紧致嵌合谷底)
    const curvePoints = ptsArray.map(p => new THREE.Vector3(p[0], p[1] + 0.06, p[2]));
    const curve = new THREE.CatmullRomCurve3(curvePoints);
    const tubeGeo = new THREE.TubeGeometry(curve, 180, conf.radius, 8, false);

    const rMat = new THREE.MeshStandardMaterial({
      color: conf.color,
      emissive: conf.emissive,
      emissiveIntensity: conf.emissiveIntensity,
      roughness: 0.12,
      metalness: 0.85,
      transparent: true,
      opacity: conf.opacity
    });

    const mesh = new THREE.Mesh(tubeGeo, rMat);
    mesh.name = key;
    mesh.castShadow = false;
    mesh.receiveShadow = true;
    riversSubGroup.add(mesh);
    riverMeshes.push(mesh);
  });
}

// 绘制秦岭 800mm 气候分界线 (碧玉山脊气象光脉与峰脊全息信标)
function buildQinlingLine() {
  while (qinlingSubGroup.children.length > 0) {
    qinlingSubGroup.remove(qinlingSubGroup.children[0]);
  }

  // 契合陕西境内秦岭真实主脊走向
  const pts = [
    new THREE.Vector3(-18.5, 12.0, 19.5),  // 凤县秦岭梁西界
    new THREE.Vector3(-12.0, 14.2, 18.2),  // 宝鸡嘉陵江源
    new THREE.Vector3(-4.84, 17.5, 22.75), // 太白山拔仙台巅 (3771.2m)
    new THREE.Vector3(2.5, 15.6, 20.8),    // 终南山翠华山段
    new THREE.Vector3(10.5, 14.5, 18.2),   // 蓝田牛背梁段
    new THREE.Vector3(17.1, 10.8, 15.2),   // 华山南峰东延
    new THREE.Vector3(21.5, 8.5, 16.8)     // 商洛丹凤东界归隐
  ];
  const curve = new THREE.CatmullRomCurve3(pts);
  const qinlingTubeGeo = new THREE.TubeGeometry(curve, 150, 0.14, 8, false);

  const qinlingMat = new THREE.MeshStandardMaterial({
    color: 0x10b981,
    emissive: 0x059669,
    emissiveIntensity: 0.95,
    roughness: 0.15,
    metalness: 0.7
  });

  qinlingLineMesh = new THREE.Mesh(qinlingTubeGeo, qinlingMat);
  qinlingSubGroup.add(qinlingLineMesh);

  // 太白峰顶全息八面体气候界标 (取代粗糙实心圆柱)
  const beaconGroup = new THREE.Group();
  beaconGroup.position.set(-4.84, 17.8, 22.75);

  const crystalGeo = new THREE.OctahedronGeometry(0.42, 0);
  const crystalMat = new THREE.MeshStandardMaterial({
    color: 0x34d399,
    emissive: 0x10b981,
    emissiveIntensity: 1.2,
    roughness: 0.1,
    metalness: 0.9
  });
  const summitCrystal = new THREE.Mesh(crystalGeo, crystalMat);
  summitCrystal.position.y = 1.0;
  beaconGroup.add(summitCrystal);
  animatedCrystals.push({ mesh: summitCrystal, baseY: 1.0, rotSpeed: 0.025, phase: 0 });

  // 垂直天际柔光柱
  const beamGeo = new THREE.CylinderGeometry(0.015, 0.12, 6.0, 16, 1, true);
  const beamMat = new THREE.MeshBasicMaterial({
    color: 0x34d399,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const beamMesh = new THREE.Mesh(beamGeo, beamMat);
  beamMesh.position.y = 3.0;
  beaconGroup.add(beamMesh);

  // 地面脉冲光环
  const ringGeo = new THREE.RingGeometry(0.2, 0.55, 32);
  ringGeo.rotateX(-Math.PI / 2);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x10b981, transparent: true, opacity: 0.75, side: THREE.DoubleSide });
  const ringMesh = new THREE.Mesh(ringGeo, ringMat);
  ringMesh.position.y = 0.05;
  beaconGroup.add(ringMesh);

  qinlingSubGroup.add(beaconGroup);
}

// 绘制丝绸之路开拓主干线 (流金丝带与漫移星尘粒子)
function buildSilkRoad() {
  while (silkRoadSubGroup.children.length > 0) {
    silkRoadSubGroup.remove(silkRoadSubGroup.children[0]);
  }

  const pts = [
    new THREE.Vector3(6.24, 2.5, 16.98),   // 西安 (汉唐长安丝路起点)
    new THREE.Vector3(1.5, 2.7, 15.2),    // 咸阳渭水古渡
    new THREE.Vector3(-4.5, 2.9, 14.0),   // 兴平马嵬
    new THREE.Vector3(-10.78, 3.2, 16.67), // 宝鸡陈仓大散关
    new THREE.Vector3(-18.5, 4.8, 12.0),  // 陇关古道西出
    new THREE.Vector3(-28.0, 5.2, 5.0),   // 天水陇右屏障
    new THREE.Vector3(-38.0, 5.0, -4.0)   // 远向河西走廊
  ];
  const curve = new THREE.CatmullRomCurve3(pts);
  const silkGeo = new THREE.TubeGeometry(curve, 160, 0.18, 8, false);

  const silkMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    emissive: 0xd97706,
    emissiveIntensity: 0.95,
    roughness: 0.15,
    metalness: 0.85
  });

  silkRoadLine = new THREE.Mesh(silkGeo, silkMat);
  silkRoadSubGroup.add(silkRoadLine);

  // 丝路流金星尘粒子系统 (Drifting Stardust along Silk Road)
  const particleCount = 70;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(particleCount * 3);
  const pProgress = new Float32Array(particleCount);

  for (let i = 0; i < particleCount; i++) {
    pProgress[i] = i / particleCount;
    const pt = curve.getPoint(pProgress[i]);
    pPos[i * 3] = pt.x + (Math.random() - 0.5) * 0.3;
    pPos[i * 3 + 1] = pt.y + 0.25 + Math.random() * 0.3;
    pPos[i * 3 + 2] = pt.z + (Math.random() - 0.5) * 0.3;
  }

  pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({
    color: 0xfbbf24,
    size: 0.52,
    transparent: true,
    opacity: 0.85,
    depthWrite: false
  });
  silkRoadParticles = new THREE.Points(pGeo, pMat);
  silkRoadParticles.userData = { curve, progress: pProgress };
  silkRoadSubGroup.add(silkRoadParticles);
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
}

// 构建全息多面体晶棱 POI 空间信标 (高科技钻石微雕 + 天际渐变光柱 + 地面同心声呐脉冲)
function buildSpatialPins() {
  while (poisSubGroup.children.length > 0) {
    poisSubGroup.remove(poisSubGroup.children[0]);
  }
  animatedCrystals = [];
  animatedSonarRings = [];

  POI_LIST.forEach((poi, idx) => {
    const pinGroup = new THREE.Group();
    pinGroup.position.set(poi.pos[0], poi.pos[1], poi.pos[2]);

    const isCity = poi.type === "city" || poi.type === "capital";
    const isPeak = poi.type === "mountain";
    const baseColor = isCity ? 0xf59e0b : (isPeak ? 0x10b981 : 0x38bdf8);

    // 1. 纤细钛金属针立柱
    const stemGeo = new THREE.CylinderGeometry(0.025, 0.025, 1.2, 8);
    const stemMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.95,
      roughness: 0.15
    });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = 0.6;
    pinGroup.add(stem);

    // 2. 浮空全息多面体晶棱信标 (Faceted Holographic Diamond Crystal)
    const crystalGeo = poi.isMajor ? new THREE.OctahedronGeometry(0.36, 0) : new THREE.OctahedronGeometry(0.26, 0);
    const crystalMat = new THREE.MeshStandardMaterial({
      color: baseColor,
      emissive: baseColor,
      emissiveIntensity: 0.9,
      metalness: 0.85,
      roughness: 0.12
    });
    const crystal = new THREE.Mesh(crystalGeo, crystalMat);
    crystal.position.y = 1.35;
    pinGroup.add(crystal);
    animatedCrystals.push({ mesh: crystal, baseY: 1.35, rotSpeed: 0.018 + (idx % 3) * 0.005, phase: idx * 0.45 });

    // 3. 向上延伸的天际光柱束 (Sky Light Pillar)
    const beamH = poi.isMajor ? 5.5 : 3.8;
    const beamGeo = new THREE.CylinderGeometry(0.012, 0.10, beamH, 12, 1, true);
    const beamMat = new THREE.MeshBasicMaterial({
      color: baseColor,
      transparent: true,
      opacity: poi.isMajor ? 0.38 : 0.22,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.y = 1.35 + beamH / 2;
    pinGroup.add(beam);

    // 4. 地表双重同心动态脉冲声呐环 (Pulsing Sonar Rings)
    const r1Geo = new THREE.RingGeometry(0.12, 0.22, 24);
    r1Geo.rotateX(-Math.PI / 2);
    const r1Mat = new THREE.MeshBasicMaterial({ color: baseColor, transparent: true, opacity: 0.75, side: THREE.DoubleSide });
    const ring1 = new THREE.Mesh(r1Geo, r1Mat);
    ring1.position.y = 0.04;
    pinGroup.add(ring1);

    const r2Geo = new THREE.RingGeometry(0.28, 0.38, 24);
    r2Geo.rotateX(-Math.PI / 2);
    const r2Mat = new THREE.MeshBasicMaterial({ color: baseColor, transparent: true, opacity: 0.45, side: THREE.DoubleSide });
    const ring2 = new THREE.Mesh(r2Geo, r2Mat);
    ring2.position.y = 0.04;
    pinGroup.add(ring2);

    animatedSonarRings.push({ ring1, ring2, phase: idx * 0.6 });

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

      // 如果左侧图文面板展开，且 POI 落在左侧遮挡区域（x < 390），且非用户悬停/聚焦，则智能隐匿，杜绝文字底透撞车
      if (props.isPanelOpen && poi.x < 390 && poi.priority < 90) {
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

const updateCameraViewportOffset = () => {
  if (!camera || !containerRef.value) return;
  const width = containerRef.value.clientWidth;
  const height = containerRef.value.clientHeight;
  if (props.isPanelOpen && props.currentMode === 'macro' && width > 900) {
    // 380px 的左侧图文面板展开时，将视口投影向左偏移，使三秦沙盘的主体视觉中心落在右侧开阔区域
    camera.setViewOffset(width, height, -130, 0, width, height);
  } else {
    camera.clearViewOffset();
  }
  camera.updateProjectionMatrix();
};

const onWindowResize = () => {
  if (!containerRef.value || !renderer || !camera) return;
  const width = containerRef.value.clientWidth;
  const height = containerRef.value.clientHeight;
  camera.aspect = width / height;
  updateCameraViewportOffset();
  renderer.setSize(width, height);
};

const animate = () => {
  animFrameId = requestAnimationFrame(animate);
  controls.update();

  // 1. 全息八面体晶棱信标旋转与悬浮微动
  if (animatedCrystals && animatedCrystals.length > 0) {
    const time = performance.now() * 0.001;
    animatedCrystals.forEach(c => {
      c.mesh.rotation.y += c.rotSpeed;
      c.mesh.position.y = c.baseY + Math.sin(time * 2.8 + c.phase) * 0.08;
    });
  }

  // 2. 地表同心声呐脉冲波扩散动效
  if (animatedSonarRings && animatedSonarRings.length > 0) {
    const time = performance.now() * 0.0014;
    animatedSonarRings.forEach(sr => {
      const cycle1 = (time + sr.phase) % 1.5;
      const s1 = 1.0 + cycle1 * 0.75;
      sr.ring1.scale.set(s1, s1, s1);
      sr.ring1.material.opacity = Math.max(0, 0.75 * (1.0 - cycle1 / 1.5));

      const cycle2 = (time + sr.phase + 0.6) % 1.5;
      const s2 = 1.0 + cycle2 * 0.75;
      sr.ring2.scale.set(s2, s2, s2);
      sr.ring2.material.opacity = Math.max(0, 0.45 * (1.0 - cycle2 / 1.5));
    });
  }

  // 3. 丝绸之路流金星尘漫移
  if (silkRoadParticles && silkRoadParticles.geometry) {
    const pData = silkRoadParticles.userData;
    if (pData && pData.curve && pData.progress) {
      const posArr = silkRoadParticles.geometry.attributes.position.array;
      for (let i = 0; i < pData.progress.length; i++) {
        pData.progress[i] += 0.0018;
        if (pData.progress[i] > 1.0) pData.progress[i] = 0.0;
        const pt = pData.curve.getPoint(pData.progress[i]);
        posArr[i * 3] = pt.x;
        posArr[i * 3 + 1] = pt.y + 0.25;
        posArr[i * 3 + 2] = pt.z;
      }
      silkRoadParticles.geometry.attributes.position.needsUpdate = true;
    }
  }

  // 4. 水系微光呼吸律动
  if (riverMeshes && riverMeshes.length > 0) {
    const pulse = 0.75 + Math.sin(performance.now() * 0.003) * 0.18;
    riverMeshes.forEach(rm => {
      if (rm.material) rm.material.emissiveIntensity = pulse;
    });
  }

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

  // 冬季漫天飞雪氛围粒子飘拂模拟
  if (winterSnowParticles && winterSnowParticles.visible && winterSnowParticles.geometry) {
    const snPos = winterSnowParticles.geometry.attributes.position.array;
    const snVel = winterSnowParticles.geometry.attributes.velocity.array;
    for (let i = 0; i < snVel.length; i++) {
      snPos[i * 3 + 1] -= snVel[i];
      snPos[i * 3] += Math.sin(flowOffset + i) * 0.02;
      if (snPos[i * 3 + 1] < 1.0) {
        snPos[i * 3 + 1] = 45.0;
      }
    }
    winterSnowParticles.geometry.attributes.position.needsUpdate = true;
  }

  if (globeMesh) {
    globeMesh.rotation.y += 0.003;
  }

  // 🚀 FPV 贴地低空飞行预演推演
  if (fpvActive && fpvCurve) {
    fpvProgress += fpvSpeed;
    if (fpvProgress >= 1.0) {
      fpvProgress = 1.0;
      stopFPVFlight();
      if (fpvCallback && fpvCallback.onComplete) {
        fpvCallback.onComplete();
      }
    } else {
      const pos = fpvCurve.getPointAt(fpvProgress);
      const lookT = Math.min(1.0, fpvProgress + 0.045);
      const lookPos = fpvCurve.getPointAt(lookT);

      const currentGroundY = getTerrainHeightAt(pos.x, pos.z);
      const camY = Math.max(pos.y, currentGroundY) + 2.2;
      const targetY = Math.max(lookPos.y, getTerrainHeightAt(lookPos.x, lookPos.z)) + 2.0;

      camera.position.set(pos.x, camY, pos.z);
      controls.target.set(lookPos.x, targetY, lookPos.z);
      camera.lookAt(lookPos.x, targetY, lookPos.z);

      const altM = camY * 120 + 380;
      let currentWp = null;
      if (fpvWaypoints && fpvWaypoints.length > 0) {
        const segIdx = Math.min(fpvWaypoints.length - 1, Math.floor(fpvProgress * (fpvWaypoints.length - 1)));
        currentWp = fpvWaypoints[segIdx];
      }

      if (fpvCallback && fpvCallback.onProgress) {
        fpvCallback.onProgress(fpvProgress, altM, currentWp);
      }
    }
  }

  // 🎧 Web Audio 三维空间自然音景空间自适应调制
  if (camera && controls) {
    soundscape.updateCameraSpatial(camera.position, controls.target, fpvActive ? 2.5 : 0);
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
watch([() => props.isPanelOpen, () => props.currentMode], () => {
  updateCameraViewportOffset();
});

watch(() => props.isPortalActive, (isPortal, oldVal) => {
  if (controls) {
    controls.autoRotate = !!isPortal;
    controls.autoRotateSpeed = 0.5;
  }
  // 从门户页首次进入沙盘时，执行高空俯冲入景运镜 (Cinematic dive-in)
  if (oldVal === true && !isPortal && camera && controls) {
    camera.position.set(0, 160, 200);
    controls.target.set(0, 5, 0);
    gsap.to(camera.position, {
      x: -3,
      y: 42,
      z: 48,
      duration: 2.2,
      ease: "power2.out"
    });
    gsap.to(controls.target, {
      x: -3,
      y: 14,
      z: 18,
      duration: 2.2,
      ease: "power2.out"
    });
  }
}, { immediate: true });

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
  if (culturalSubGroup) culturalSubGroup.visible = !!newLayers.cultural;
  if (citiesSubGroup) citiesSubGroup.visible = newLayers.pois !== false;
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


// 构建人文风物地标 (非遗/美食/戏曲 - 高阶三维流光灵境，根除粗糙 Sprite 灰色圆盘)
function buildCulturalHotspots() {
  while (culturalSubGroup.children.length > 0) {
    culturalSubGroup.remove(culturalSubGroup.children[0]);
  }

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
    animatedCrystals.push({ mesh: coreMesh, baseY: 1.4, rotSpeed: 0.028, phase: idx * 0.7 });

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
let profilingPoints = [];
  profilingStep.value = 1;

const onCanvasPointerDown = (e) => {
  if (!renderer || !camera || e.target !== renderer.domElement) return;

  const rect = renderer.domElement.getBoundingClientRect();
  pointerVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointerVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointerVec, camera);

  // 1. 探秘答题模式碰撞
  if (props.isChallengeActive) {
    if (terrainMesh) {
      const hits = raycaster.intersectObject(terrainMesh);
      if (hits.length > 0) {
        const pt = hits[0].point;
        emit('challenge-click', [pt.x, pt.y, pt.z]);
      }
    }
    return;
  }

  // 2. 剖面测绘模式碰撞
  if (props.isProfilingActive) {
    if (terrainMesh) {
      const hits = raycaster.intersectObject(terrainMesh);
      if (hits.length > 0) {
        handleProfilingHit(hits[0].point);
      }
    }
    return;
  }

  // 3. 人文风物图标点击
  if (props.layers?.cultural && culturalSubGroup) {
    const hits = raycaster.intersectObjects(culturalSubGroup.children, true);
    if (hits.length > 0) {
      let obj = hits[0].object;
      while (obj.parent && !obj.userData?.culturalItem) obj = obj.parent;
      if (obj.userData?.culturalItem) {
        emit('select-culture', obj.userData.culturalItem);
      }
    }
  }

  // 4. 自定义 3D 路书打点交互
  if (props.isRoadbookActive) {
    if (terrainMesh) {
      const hits = raycaster.intersectObject(terrainMesh);
      if (hits.length > 0) {
        const pt = hits[0].point;
        emit('roadbook-point-added', { x: pt.x, y: pt.y, z: pt.z });
      }
    }
  }
};

const onCanvasPointerMove = (e) => {
  if (!renderer || !camera || (!props.isProfilingActive && !props.isChallengeActive && !props.isRoadbookActive)) {
    if (terrainReticleMesh) terrainReticleMesh.visible = false;
    return;
  }

  const rect = renderer.domElement.getBoundingClientRect();
  pointerVec.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointerVec.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointerVec, camera);
  if (terrainMesh) {
    const hits = raycaster.intersectObject(terrainMesh);
    if (hits.length > 0) {
      const hit = hits[0].point;
      terrainReticleMesh.position.set(hit.x, hit.y + 0.15, hit.z);
      terrainReticleMesh.visible = true;
      return;
    }
  }
  terrainReticleMesh.visible = false;
};

const handleProfilingHit = (point) => {
  if (profilingPoints.length >= 2) {
    clearProfiling();
  }
  if (profilingPoints.length >= 2) {
    clearProfiling();
  }

  profilingPoints.push(point.clone());
  profilingStep.value = profilingPoints.length === 1 ? 2 : 1;

  // 创建标记针
  const isStart = profilingPoints.length === 1;
  const pinGeo = new THREE.CylinderGeometry(0.1, 0.1, 3.5, 12);
  const pinMat = new THREE.MeshBasicMaterial({ color: isStart ? 0x10b981 : 0xef4444 });
  const pin = new THREE.Mesh(pinGeo, pinMat);
  pin.position.set(point.x, point.y + 1.75, point.z);
  profilingMeasureGroup.add(pin);

  if (profilingPoints.length === 2) {
    const ptA = profilingPoints[0];
    const ptB = profilingPoints[1];

    const sampleCount = 60;
    const sampledPoints = [];
    const curvePts = [];
    const width = 80;
    const depth = 140;

    let demData = null;
    if (demCanvas) {
      try {
        demData = demCanvas.getContext("2d").getImageData(0, 0, demCanvas.width, demCanvas.height).data;
      } catch (e) {}
    }

    let minH = 9999;
    let maxH = -9999;
    let totalAscent = 0;
    let prevH = null;

    for (let i = 0; i <= sampleCount; i++) {
      const t = i / sampleCount;
      const x = ptA.x + t * (ptB.x - ptA.x);
      const z = ptA.z + t * (ptB.z - ptA.z);

      const u = (x / width) + 0.5;
      const v = (z / depth) + 0.5;

      let elevationM = 400;
      let y = 1.0;

      if (demData && u >= 0 && u <= 1 && v >= 0 && v <= 1) {
        const px = Math.floor(u * (demCanvas.width - 1));
        const py = Math.floor(v * (demCanvas.height - 1));
        const pIdx = (py * demCanvas.width + px) * 4;
        const grey = demData[pIdx];
        y = Math.pow(grey / 255.0, 1.1) * 18.5;
        elevationM = Math.round(180 + Math.pow(grey / 255.0, 1.1) * 3591);
      }

      if (elevationM < minH) minH = elevationM;
      if (elevationM > maxH) maxH = elevationM;

      if (prevH !== null && elevationM > prevH) {
        totalAscent += (elevationM - prevH);
      }
      prevH = elevationM;

      curvePts.push(new THREE.Vector3(x, y + 0.25, z));

      const distKm = ptA.distanceTo(new THREE.Vector3(x, y, z)) * 6.21;
      sampledPoints.push({
        distKm,
        elevationM,
        x, y, z
      });
    }

    // 绘制发光测绘激光缎带
    const laserCurve = new THREE.CatmullRomCurve3(curvePts);
    const laserGeo = new THREE.TubeGeometry(laserCurve, 80, 0.22, 8, false);
    const laserMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.9,
      roughness: 0.2
    });
    const laserMesh = new THREE.Mesh(laserGeo, laserMat);
    profilingMeasureGroup.add(laserMesh);

    const totalDistanceKm = ptA.distanceTo(ptB) * 6.21;
    const avgSlope = (Math.abs(maxH - minH) / (totalDistanceKm * 1000)) * 100;

    emit('profile-calculated', {
      points: sampledPoints,
      totalDistanceKm,
      minElevation: minH,
      maxElevation: maxH,
      totalAscent,
      averageSlope: avgSlope
    });
  }
};

const clearProfiling = () => {
  profilingPoints = [];
  while (profilingMeasureGroup.children.length > 0) {
    profilingMeasureGroup.remove(profilingMeasureGroup.children[0]);
  }
};

// 截取当前沙盘超高清画面用于海报生成
const captureSnapshot = () => {
  if (!renderer || !scene || !camera) return "";
  renderer.render(scene, camera);
  return renderer.domElement.toDataURL("image/png");
};

// 电影巡航平滑运镜
const flyToWaypoint = (wp) => {
  if (!wp || !wp.camera) return;
  flyTo(wp.camera.pos, wp.camera.target, wp.camera.duration || 3.5);
};

// 获取地形 (x, z) 处物理高度
function getTerrainHeightAt(x, z) {
  const width = 80;
  const depth = 140;
  const u = (x / width) + 0.5;
  const v = (z / depth) + 0.5;
  if (demCanvas && u >= 0 && u <= 1 && v >= 0 && v <= 1) {
    try {
      const ctx = demCanvas.getContext('2d');
      const px = Math.floor(u * (demCanvas.width - 1));
      const py = Math.floor(v * (demCanvas.height - 1));
      const pData = ctx.getImageData(px, py, 1, 1).data;
      return Math.pow(pData[0] / 255.0, 1.1) * 18.5;
    } catch (_) {}
  }
  return (z > 12) ? Math.max(0, 1 - Math.abs(z - 18) / 14) * 14 : 1.5;
}

// 构建冬季全域漫天飞雪氛围粒子系统
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

// 四季模式平滑切换
function setSeason(seasonId) {
  const targetCode = seasonCodeMap[seasonId] ?? 0.0;
  if (!seasonUniforms) return;
  seasonUniforms.uPrevSeason.value = seasonUniforms.uSeason.value;
  seasonUniforms.uSeason.value = targetCode;
  seasonUniforms.uSeasonBlend.value = 0.0;

  const start = performance.now();
  const duration = 1200;
  function updateBlend(now) {
    const elapsed = now - start;
    const t = Math.min(1.0, elapsed / duration);
    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    seasonUniforms.uSeasonBlend.value = ease;
    if (t < 1.0) {
      requestAnimationFrame(updateBlend);
    }
  }
  requestAnimationFrame(updateBlend);

  if (seasonId === 'winter') {
    if (!winterSnowParticles) buildWinterSnowParticles();
    if (winterSnowParticles) winterSnowParticles.visible = true;
  } else {
    if (winterSnowParticles) winterSnowParticles.visible = false;
  }

  if (sunLight) {
    if (seasonId === 'winter') {
      sunLight.color.setHex(0xe0f2fe);
      sunLight.intensity = 1.15;
    } else if (seasonId === 'autumn') {
      sunLight.color.setHex(0xfef08a);
      sunLight.intensity = 1.35;
    } else if (seasonId === 'spring') {
      sunLight.color.setHex(0xfef9c3);
      sunLight.intensity = 1.4;
    } else if (seasonId === 'summer') {
      sunLight.color.setHex(0xffffff);
      sunLight.intensity = 1.5;
    } else {
      sunLight.color.setHex(0xffffff);
      sunLight.intensity = 1.35;
    }
  }
}

watch(() => props.seasonMode, (newVal) => {
  setSeason(newVal);
});

// 3D 路书绘制与清理
function clearRoadbook() {
  if (roadbookGroup) {
    while (roadbookGroup.children.length > 0) {
      const child = roadbookGroup.children[0];
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach(m => m.dispose());
        else child.material.dispose();
      }
      roadbookGroup.remove(child);
    }
  }
  currentRoadbookRoute = null;
}

function drawRoadbookRoute(route) {
  clearRoadbook();
  if (!route || !route.waypoints || route.waypoints.length < 2) return;
  currentRoadbookRoute = route;

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
  fpvActive = true;
  fpvCallback = options;

  controls.enabled = false;
}

function stopFPVFlight() {
  if (!fpvActive) return;
  fpvActive = false;
  controls.enabled = true;
  if (preFpvCameraState) {
    flyTo(
      [preFpvCameraState.pos.x, preFpvCameraState.pos.y, preFpvCameraState.pos.z],
      [preFpvCameraState.target.x, preFpvCameraState.target.y, preFpvCameraState.target.z],
      1.5
    );
  }
}

defineExpose({
  flyTo,
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
  setSeason
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

/* 紧凑高质感单行 POI 全息晶石标牌 (EUGENE FINANCE 国风朱金与深海蓝光) */
.poi-badge {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  gap: 7px;
  background: rgba(8, 20, 36, 0.90);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(56, 189, 248, 0.38);
  border-radius: 20px;
  padding: 4px 10px;
  color: #f8fafc;
  cursor: pointer;
  transform: translate(-50%, -50%);
  transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.65), inset 0 1px 0 rgba(255, 255, 255, 0.12);
  user-select: none;
}

.poi-badge:hover,
.poi-badge.active {
  border-color: #f59e0b;
  background: rgba(14, 28, 48, 0.96);
  transform: translate(-50%, -50%) scale(1.08);
  box-shadow: 0 0 20px rgba(245, 158, 11, 0.45), 0 6px 20px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.25);
  z-index: 25;
}

.poi-badge.major {
  border-color: rgba(245, 158, 11, 0.45);
}

.poi-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #38bdf8;
  box-shadow: 0 0 8px #38bdf8;
  flex-shrink: 0;
}

.poi-dot.capital { background: #f59e0b; box-shadow: 0 0 10px #f59e0b; }
.poi-dot.mountain { background: #10b981; box-shadow: 0 0 10px #10b981; }
.poi-dot.nature { background: #06b6d4; box-shadow: 0 0 10px #06b6d4; }
.poi-dot.red { background: #ef4444; box-shadow: 0 0 10px #ef4444; }

.poi-title {
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  letter-spacing: 0.03em;
  color: #f1f5f9;
}

.poi-sub {
  font-size: 9.5px;
  color: #93c5fd;
  white-space: nowrap;
  padding: 1px 6px;
  background: rgba(56, 189, 248, 0.14);
  border: 1px solid rgba(56, 189, 248, 0.28);
  border-radius: 8px;
}

.poi-hover-preview {
  position: absolute;
  bottom: calc(100% + 10px);
  left: 50%;
  transform: translateX(-50%);
  width: 154px;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(11, 26, 43, 0.96);
  border: 1px solid rgba(56, 189, 248, 0.4);
  box-shadow: 0 12px 28px -4px rgba(0, 0, 0, 0.8), 0 0 16px rgba(2, 132, 199, 0.3);
  pointer-events: none;
  animation: popPreview 0.18s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 50;
}

@keyframes popPreview {
  from { opacity: 0; transform: translateX(-50%) translateY(6px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

.poi-preview-img {
  width: 100%;
  height: 84px;
  object-fit: cover;
  display: block;
}

.poi-preview-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 7px;
  background: rgba(6, 13, 23, 0.88);
  font-size: 10.5px;
}

.preview-name {
  font-weight: 700;
  color: #fff;
}

.preview-badge {
  font-size: 9px;
  padding: 1px 4px;
  border-radius: 3px;
  background: rgba(56, 189, 248, 0.2);
  color: #38bdf8;
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

.interactive-step-hud {
  position: absolute;
  top: 74px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 30;
  pointer-events: auto;
}

.hud-pill-box {
  background: rgba(10, 15, 25, 0.92);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(56, 189, 248, 0.45);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.7), 0 0 16px rgba(56, 189, 248, 0.3);
  padding: 6px 14px;
  border-radius: 24px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.hud-step-badge {
  background: #0284c7;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 10px;
}

.hud-step-text {
  font-size: 12.5px;
  color: #f0f9ff;
  font-weight: 500;
}

.hud-step-cancel {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: #fca5a5;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.hud-step-cancel:hover {
  background: #ef4444;
  color: #fff;
}
