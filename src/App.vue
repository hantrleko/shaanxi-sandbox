<template>
  <div class="app-root">
    <!-- 3D 核心视口 (真实遥感 DEM + 实心地质切面 + 四季气候着色 + 3D路书 + 智能避让) -->
    <ThreeCanvas
      ref="threeRef"
      :current-mode="currentMode"
      :active-bonsai-id="activeBonsaiId"
      :bonsai-exaggeration="bonsaiExaggeration"
      :active-model-stage="activeModelStage"
      :active-campaign="currentCampaign"
      :active-campaign-stage-index="activeCampaignStageIndex"
      :lighting-mode="lightingMode"
      :season-mode="seasonMode"
      :layers="layers"
      :active-lab-id="activeLabId"
      :current-tectonic-stage="currentTectonicStage"
      :active-chapter-id="currentChapter?.id"
      :is-profiling-active="isProfilingActive"
      :is-roadbook-active="isRoadbookActive"
      :is-challenge-active="isDetectiveActive"
      :is-portal-active="showPortal"
      :is-panel-open="!isPanelCollapsed && currentMode === 'macro' && !isTourActive && !showPortal"
      @camera-update="onCameraUpdate"
      @select-poi="onPoiSelected"
      @profile-calculated="onProfileCalculated"
      @cancel-profiling="onToggleProfiling"
      @challenge-click="onChallengeClick"
      @select-culture="onSelectCulture"
      @roadbook-point-added="onRoadbookPointAdded"
    />

    <!-- 首页门户大屏欢迎遮罩 (带 EUGENE FINANCE 品牌徽章、V2.0 标识与沉浸入口) -->
    <HomePortal
      v-if="showPortal"
      @enter-sandbox="closePortal"
      @select-mode="onPortalSelectMode"
      @start-tour="onOpenTour"
      @start-detective="onOpenDetective"
      @start-roadbook="onOpenRoadbook"
      @open-changelog="onOpenChangelog"
      @open-gallery="onOpenGallery"
    />

    <!-- HUD 界面层 (非门户模式时呈现) -->
    <template v-else>
      <!-- 顶部 HUD 导航 (带品牌徽章、V2.0 演更日志、四季流转与 3D 路书) -->
      <HudHeader
        v-if="!isTourActive"
        :themes="THEMES"
        :current-theme-id="currentThemeId"
        :current-mode="currentMode"
        :lighting-mode="lightingMode"
        :season-mode="seasonMode"
        :is-profiling-active="isProfilingActive"
        :is-roadbook-active="isRoadbookActive"
        @open-portal="showPortal = true"
        @change-theme="onChangeTheme"
        @switch-mode="onSwitchMode"
        @toggle-fullscreen="onToggleFullscreen"
        @change-lighting="onLightingChange"
        @change-season="onChangeSeason"
        @open-tour="onOpenTour"
        @open-roadbook="onOpenRoadbook"
        @open-gallery="onOpenGallery"
        @toggle-profiling="onToggleProfiling"
        @open-detective="onOpenDetective"
        @open-wargame="onOpenWargame"
        @open-poster="onOpenPoster"
        @open-changelog="onOpenChangelog"
      />

      <!-- 宏观沙盘模式：左侧图文卡片 (选项卡媒体 + 剖面联动) -->
      <LeftInfoPanel
        v-if="currentMode === 'macro' && currentChapter && !isTourActive && !isProfilingActive && !isDetectiveActive"
        :chapter="currentChapter"
        :total-chapters="currentChapters.length"
        :current-theme-title="currentTheme.title"
        :current-theme-id="currentThemeId"
        :themes="THEMES"
        :is-playing="isPlaying"
        @change-theme="onChangeTheme"
        @collapse-change="isPanelCollapsed = $event"
        @listen-current="onListenCurrent"
        @focus-feature="onFocusFeature"
        @fly-strata="onFlyToStrata"
        @view-photo="onViewChapterPhoto"
      />

      <!-- 宏观沙盘模式：底部居中自适应浮动坞 (零遮挡、零撞车) -->
      <BottomTimeline
        v-if="currentMode === 'macro' && !isTourActive && !isProfilingActive && !isDetectiveActive"
        :chapters="currentChapters"
        :current-index="currentChapterIndex"
        :is-auto-playing="isAutoPlaying"
        @toggle-autoplay="onToggleAutoplay"
        @prev-chapter="onPrevChapter"
        @next-chapter="onNextChapter"
        @select-chapter="onSelectChapter"
      />

      <!-- 历史战役沙盘推演专属控制器 -->
      <CampaignModal
        v-if="!isTourActive"
        :current-mode="currentMode"
        :campaigns="CAMPAIGNS"
        :current-campaign-id="activeCampaignId"
        :current-stage-index="activeCampaignStageIndex"
        @select-campaign="onSelectCampaign"
        @select-stage="idx => activeCampaignStageIndex = idx"
        @prev-stage="onPrevCampaignStage"
        @next-stage="onNextCampaignStage"
        @back-to-macro="currentMode = 'macro'"
      />

      <!-- 微观盆景专属控制器 (Zoom 12 实体切块与再次提取) -->
      <BonsaiModal
        v-if="!isTourActive"
        :current-mode="currentMode"
        :bonsais="BONSAIS"
        :current-bonsai-id="activeBonsaiId"
        @select-bonsai="onSelectBonsai"
        @update-exaggeration="val => bonsaiExaggeration = val"
        @re-extract="onReExtractBonsai"
        @back-to-macro="currentMode = 'macro'"
      />

      <!-- 科学演化实验台控制器 (4大实验台) -->
      <ModelModal
        v-if="!isTourActive"
        :current-mode="currentMode"
        :stages="EVOLUTION_STAGES"
        :current-stage="activeModelStage"
        :active-lab-id="activeLabId"
        :current-tectonic-stage="currentTectonicStage"
        @select-stage="stage => activeModelStage = stage"
        @prev-stage="onPrevStage"
        @next-stage="onNextStage"
        @change-lab="onChangeLab"
        @change-tectonic-stage="onChangeTectonicStage"
        @back-to-macro="currentMode = 'macro'"
      />

      <!-- 🎬 电影级自动巡航导览模式浮层 -->
      <CinematicTour
        :active="isTourActive"
        :current-index="currentTourIndex"
        @close-tour="isTourActive = false"
        @next-station="onNextTourStation"
        @prev-station="onPrevTourStation"
        @select-station="flyToTourStation"
      />

      <!-- 📐 沙盘任意拉线剖面测绘分析仪 -->
      <ElevationProfiler
        :active="isProfilingActive && !!profileData"
        :profile-data="profileData"
        @close="isProfilingActive = false; profileData = null"
        @reset-line="onResetProfileLine"
      />

      <!-- 🛣️ V2.0 3D 多点研学/自驾路书工坊与 FPV 低空贴地飞行预演 -->
      <RouteWorkshopModal
        :active="isRoadbookActive"
        :custom-points="customRoadbookPoints"
        @close="isRoadbookActive = false; onClearCustomRoadbook()"
        @select-route="onSelectRoadbookRoute"
        @start-fpv="onStartFPV"
        @stop-fpv="onStopFPV"
        @focus-waypoint="onFocusWaypoint"
        @clear-custom="onClearCustomRoadbook"
      />

      <!-- ⚔️ 历史战役双路线兵棋推演多维对比模态框 -->
      <TacticalWargameModal
        :active="isWargameActive"
        :comparison-data="currentWargameData"
        @close="isWargameActive = false"
      />

      <!-- 🎯 寻迹三秦空间探秘挑战模态框 -->
      <GeoDetectiveModal
        ref="detectiveRef"
        :active="isDetectiveActive"
        @close="isDetectiveActive = false"
        @focus-target="onFocusChallengeTarget"
      />

      <!-- 📸 国风 3D 地理明信片海报生成器 -->
      <PosterModal
        :active="isPosterActive"
        :snapshot-url="snapshotUrl"
        :telemetry="{ pitch: cameraPitch, azimuth: cameraAzimuth }"
        :chapter-title="currentChapter?.title"
        @close="isPosterActive = false"
      />

      <!-- 🍜 人文风物详情交互浮窗 -->
      <CulturalCard
        :cultural-item="selectedCulturalItem"
        @close="selectedCulturalItem = null"
        @fly-to="onFlyToCulture"
      />

      <!-- 右下角图层控制与指北针 -->
      <LayerControl
        v-if="currentMode === 'macro' && !isTourActive"
        :azimuth="cameraAzimuth"
        @update-layers="onUpdateLayers"
        @reset-north="onResetNorth"
      />

      <!-- 右下角紧凑遥测数据栈 -->
      <div v-if="!isTourActive" class="hud-telemetry glass-panel">
        <div class="tele-item">
          <span class="tele-lbl">遥感源</span>
          <span class="tele-val">DEM 30m</span>
        </div>
        <div class="tele-item">
          <span class="tele-lbl">视角</span>
          <span class="tele-val">{{ cameraPitch }}°</span>
        </div>
        <div class="tele-item">
          <span class="tele-lbl">航向</span>
          <span class="tele-val">{{ cameraAzimuth }}°</span>
        </div>
      </div>
    </template>

    <!-- 🖼️ POI 点击地标实景图卡浮窗 (随时感知真实地理风貌) -->
    <PoiPhotoCard
      v-if="selectedPoi && !isTourActive && !isRoadbookActive"
      :poi="selectedPoi"
      @close="selectedPoi = null"
      @view-large="onViewLargePhoto"
      @view-gallery="onOpenGallery"
    />

    <!-- 📸 三秦 16 处地标真实地理高清摄影画廊 -->
    <SceneryGalleryModal
      :active="isGalleryActive"
      :initial-item="activeGalleryItem"
      @close="onCloseGallery"
      @fly-to="onFlyToScenery"
    />

    <!-- 📜 V2.0 版本更迭历史与架构升级日志中心 (全场景可随时呼出) -->
    <ChangelogModal
      :active="isChangelogActive"
      @close="isChangelogActive = false"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue';
import ThreeCanvas from './components/ThreeCanvas.vue';
import HomePortal from './components/HomePortal.vue';
import HudHeader from './components/HudHeader.vue';
import LeftInfoPanel from './components/LeftInfoPanel.vue';
import BottomTimeline from './components/BottomTimeline.vue';
import BonsaiModal from './components/BonsaiModal.vue';
import ModelModal from './components/ModelModal.vue';
import CampaignModal from './components/CampaignModal.vue';
import LayerControl from './components/LayerControl.vue';
import CinematicTour from './components/CinematicTour.vue';
import ElevationProfiler from './components/ElevationProfiler.vue';
import RouteWorkshopModal from './components/RouteWorkshopModal.vue';
import TacticalWargameModal from './components/TacticalWargameModal.vue';
import GeoDetectiveModal from './components/GeoDetectiveModal.vue';
import PosterModal from './components/PosterModal.vue';
import CulturalCard from './components/CulturalCard.vue';
import ChangelogModal from './components/ChangelogModal.vue';
import SceneryGalleryModal from './components/SceneryGalleryModal.vue';
import PoiPhotoCard from './components/PoiPhotoCard.vue';
import { THEMES, BONSAIS, EVOLUTION_STAGES, CAMPAIGNS, WARGAME_COMPARISONS, CINEMATIC_WAYPOINTS, SCENERY_PHOTOS } from './data/shaanxiData.js';
import { narrator } from './utils/speech.js';
import { soundscape } from './utils/soundscape.js';

const threeRef = ref(null);
const detectiveRef = ref(null);
const showPortal = ref(true);
const isPanelCollapsed = ref(false);

const currentMode = ref('macro'); // 'macro' | 'bonsai' | 'model' | 'campaign'
const currentThemeId = ref('geo');
const currentChapterIndex = ref(0);

const activeBonsaiId = ref('bonsai_huashan');
const bonsaiExaggeration = ref(1.5);

const activeLabId = ref('loess'); // 'loess' | 'tectonic' | 'climate' | 'globe'
const currentTectonicStage = ref(0);
const activeModelStage = ref(1);

const activeCampaignId = ref('camp_chencang');
const activeCampaignStageIndex = ref(0);
const lightingMode = ref('dawn'); // 'dawn' | 'noon' | 'sunset'

const isPlaying = ref(false);
const isAutoPlaying = ref(false);
const cameraPitch = ref(35);
const cameraAzimuth = ref(0);

// 新增功能状态
const isTourActive = ref(false);
const currentTourIndex = ref(0);
const isProfilingActive = ref(false);
const profileData = ref(null);
const isWargameActive = ref(false);
const isDetectiveActive = ref(false);
const isPosterActive = ref(false);
const snapshotUrl = ref('');
const selectedCulturalItem = ref(null);

// V2.0 旗舰版状态 (四季气候流转、3D路书工坊、版本更迭中心、实景画廊)
const seasonMode = ref('natural');
const isChangelogActive = ref(false);
const isRoadbookActive = ref(false);
const customRoadbookPoints = ref([]);
const isGalleryActive = ref(false);
const activeGalleryItem = ref(null);
const selectedPoi = ref(null);

const layers = reactive({
  border: true,
  rivers: true,
  qinlingLine: true,
  silkRoad: true,
  pois: true,
  cultural: true
});

const currentTheme = computed(() => {
  return THEMES.find(t => t.id === currentThemeId.value) || THEMES[0];
});

const currentChapters = computed(() => {
  return currentTheme.value.chapters || [];
});

const currentChapter = computed(() => {
  return currentChapters.value[currentChapterIndex.value] || currentChapters.value[0];
});

const currentCampaign = computed(() => {
  return CAMPAIGNS.find(c => c.id === activeCampaignId.value) || CAMPAIGNS[0];
});

const currentWargameData = computed(() => {
  if (activeCampaignId.value === 'camp_chencang') return WARGAME_COMPARISONS.camp_chencang;
  return WARGAME_COMPARISONS.camp_north;
});

const closePortal = () => {
  showPortal.value = false;
  flyToCurrentChapter();
};

const onPortalSelectMode = (mode, param) => {
  currentMode.value = mode;
  if (mode === 'macro') {
    currentThemeId.value = param || 'geo';
    currentChapterIndex.value = 0;
  } else if (mode === 'campaign') {
    activeCampaignId.value = param || 'camp_chencang';
    activeCampaignStageIndex.value = 0;
  } else if (mode === 'bonsai') {
    activeBonsaiId.value = param || 'bonsai_huashan';
  } else if (mode === 'model') {
    activeLabId.value = param || 'loess';
  }
  showPortal.value = false;
};

// 🎬 电影级自动巡航
const onOpenTour = () => {
  showPortal.value = false;
  isTourActive.value = true;
  currentMode.value = 'macro';
  currentTourIndex.value = 0;
  flyToTourStation(0);
};

const flyToTourStation = (idx) => {
  currentTourIndex.value = idx;
  const st = CINEMATIC_WAYPOINTS[idx];
  if (st && threeRef.value) {
    threeRef.value.flyToWaypoint(st);
  }
};

const onNextTourStation = () => {
  if (currentTourIndex.value < CINEMATIC_WAYPOINTS.length - 1) {
    flyToTourStation(currentTourIndex.value + 1);
  }
};

const onPrevTourStation = () => {
  if (currentTourIndex.value > 0) {
    flyToTourStation(currentTourIndex.value - 1);
  }
};

// 📐 剖面测绘
const onToggleProfiling = () => {
  isProfilingActive.value = !isProfilingActive.value;
  if (!isProfilingActive.value) {
    profileData.value = null;
    if (threeRef.value) threeRef.value.clearProfiling();
  }
};

const onProfileCalculated = (data) => {
  profileData.value = data;
};

const onResetProfileLine = () => {
  profileData.value = null;
  if (threeRef.value) threeRef.value.clearProfiling();
};

// ⚔️ 兵棋推演
const onOpenWargame = () => {
  isWargameActive.value = true;
};

// 🎯 寻迹探秘挑战
const onOpenDetective = () => {
  showPortal.value = false;
  isDetectiveActive.value = true;
  currentMode.value = 'macro';
};

const onChallengeClick = (coords) => {
  if (detectiveRef.value) {
    detectiveRef.value.handleTerrainClick(coords);
  }
};

const onFocusChallengeTarget = (target) => {
  if (threeRef.value) {
    threeRef.value.flyTo([target[0] + 5, target[1] + 16, target[2] + 18], target, 2.0);
  }
};

// 📸 拍照打卡与海报
const onOpenPoster = () => {
  if (threeRef.value) {
    snapshotUrl.value = threeRef.value.captureSnapshot();
    isPosterActive.value = true;
  }
};

// 🍜 人文风物
const onSelectCulture = (item) => {
  selectedCulturalItem.value = item;
};

const onFlyToCulture = (pos) => {
  if (threeRef.value) {
    threeRef.value.flyTo([pos[0] + 4, pos[1] + 14, pos[2] + 16], pos, 1.8);
  }
};

const onChangeTheme = (themeId) => {
  currentThemeId.value = themeId;
  currentChapterIndex.value = 0;
  flyToCurrentChapter();
};

// 🌸 V2.0 四季地貌与气候流转
const onChangeSeason = (sId) => {
  seasonMode.value = sId;
  if (threeRef.value) {
    threeRef.value.setSeason(sId);
  }
};

// 📜 V2.0 版本更迭与演化日志
const onOpenChangelog = () => {
  isChangelogActive.value = true;
};

// 🛣️ V2.0 3D 多点研学/自驾路书工坊
const onOpenRoadbook = () => {
  showPortal.value = false;
  currentMode.value = 'macro';
  isTourActive.value = false;
  isProfilingActive.value = false;
  isDetectiveActive.value = false;
  isRoadbookActive.value = true;
};

const onSelectRoadbookRoute = (route) => {
  if (threeRef.value) {
    threeRef.value.drawRoadbookRoute(route);
  }
};

const onRoadbookPointAdded = (pt) => {
  customRoadbookPoints.value.push(pt);
  if (threeRef.value) {
    threeRef.value.drawRoadbookRoute({
      id: 'custom',
      title: '自由多点测绘路书',
      waypoints: customRoadbookPoints.value.map((p, i) => ({
        name: `途经点 ${i + 1}`,
        elevation: Math.round(p.y * 180 + 380),
        pos: [p.x, p.y, p.z],
        desc: `坐标: (${p.x.toFixed(1)}, ${p.z.toFixed(1)})`
      }))
    });
  }
};

const onClearCustomRoadbook = () => {
  customRoadbookPoints.value = [];
  if (threeRef.value) {
    threeRef.value.clearRoadbook();
  }
};

const onStartFPV = (options) => {
  if (threeRef.value) {
    threeRef.value.startFPVFlight(options);
  }
};

const onStopFPV = () => {
  if (threeRef.value) {
    threeRef.value.stopFPVFlight();
  }
};

const onFocusWaypoint = (wp) => {
  if (threeRef.value && wp && wp.pos) {
    threeRef.value.flyTo([wp.pos[0] + 4, wp.pos[1] + 12, wp.pos[2] + 16], wp.pos, 2.0);
  }
};

// 📸 三秦实景影集与摄影联动
const onOpenGallery = () => {
  activeGalleryItem.value = null;
  isGalleryActive.value = true;
};

const onCloseGallery = () => {
  isGalleryActive.value = false;
  activeGalleryItem.value = null;
};

const onFlyToScenery = (item) => {
  if (threeRef.value && item && item.camera) {
    threeRef.value.flyTo(item.camera.pos, item.camera.target, 2.0);
  }
  selectedPoi.value = {
    id: item.id,
    name: item.title.split('·')[0].trim(),
    badge: item.subtitle,
    desc: item.desc,
    type: item.region === '秦岭' ? 'mountain' : 'nature'
  };
};

const onViewChapterPhoto = (photoUrl, caption) => {
  let found = (SCENERY_PHOTOS || []).find(s => s.url === photoUrl);
  if (!found && currentChapter.value) {
    found = (SCENERY_PHOTOS || []).find(s => s.id === currentChapter.value.id || s.title.includes(currentChapter.value.title.slice(0, 2)));
  }
  if (!found) {
    found = {
      id: currentChapter.value?.id || 'chapter_photo',
      title: currentChapter.value?.title || '地标实景',
      subtitle: currentChapter.value?.subTitle || '',
      url: photoUrl,
      desc: caption || currentChapter.value?.desc || '',
      region: currentTheme.value?.title || '三秦大地',
      elevation: '实景照片',
      location: '陕西地理实景'
    };
  }
  activeGalleryItem.value = found;
  isGalleryActive.value = true;
};

const onViewLargePhoto = (item) => {
  activeGalleryItem.value = item;
  isGalleryActive.value = true;
};

const onSwitchMode = (mode) => {
  currentMode.value = mode;
  narrator.stop();
  isPlaying.value = false;
  isAutoPlaying.value = false;
  isTourActive.value = false;
  isProfilingActive.value = false;
  isDetectiveActive.value = false;
  isRoadbookActive.value = false;
  selectedPoi.value = null;
};

const onLightingChange = (mode) => {
  lightingMode.value = mode;
};

const onUpdateLayers = (newLayers) => {
  Object.assign(layers, newLayers);
};

const flyToCurrentChapter = () => {
  if (!threeRef.value || !currentChapter.value) return;
  const cam = currentChapter.value.camera;
  if (cam) {
    threeRef.value.flyTo(cam.pos, cam.target, 2.0);
  }
};

const onSelectChapter = (idx) => {
  currentChapterIndex.value = idx;
  flyToCurrentChapter();
};

const onPrevChapter = () => {
  if (currentChapterIndex.value > 0) {
    onSelectChapter(currentChapterIndex.value - 1);
  }
};

const onNextChapter = () => {
  if (currentChapterIndex.value < currentChapters.value.length - 1) {
    onSelectChapter(currentChapterIndex.value + 1);
  }
};

const playCurrentNarration = () => {
  if (!currentChapter.value) return;
  const text = `${currentChapter.value.title}。${currentChapter.value.desc}`;
  isPlaying.value = true;
  narrator.speak(text, () => {
    isPlaying.value = false;
    if (isAutoPlaying.value) {
      setTimeout(() => {
        if (isAutoPlaying.value) {
          if (currentChapterIndex.value < currentChapters.value.length - 1) {
            onNextChapter();
            playCurrentNarration();
          } else {
            onSelectChapter(0);
            playCurrentNarration();
          }
        }
      }, 1500);
    }
  });
};

const onListenCurrent = () => {
  playCurrentNarration();
};

const onToggleAutoplay = () => {
  isAutoPlaying.value = !isAutoPlaying.value;
  if (isAutoPlaying.value) {
    playCurrentNarration();
  } else {
    narrator.stop();
    isPlaying.value = false;
  }
};

const onFocusFeature = () => {
  flyToCurrentChapter();
};

const onResetNorth = () => {
  if (threeRef.value) {
    threeRef.value.resetNorth();
  }
};

const onToggleFullscreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
};

const onCameraUpdate = (data) => {
  cameraPitch.value = data.pitch;
  if (data.azimuth !== undefined) {
    cameraAzimuth.value = data.azimuth;
  }
};

const onPoiSelected = (poi) => {
  selectedPoi.value = poi;
};

const onSelectBonsai = (id) => {
  activeBonsaiId.value = id;
};

const onReExtractBonsai = () => {
  if (threeRef.value) {
    threeRef.value.reExtractBonsai();
  }
};

const onChangeLab = (labId) => {
  activeLabId.value = labId;
};

const onChangeTectonicStage = (stageIdx) => {
  currentTectonicStage.value = stageIdx;
};

const onFlyToStrata = (pos) => {
  if (threeRef.value && pos) {
    threeRef.value.flyTo([pos[0] + 5, pos[1] + 18, pos[2] + 22], [pos[0], pos[1], pos[2]], 2.0);
  }
};

const onSelectCampaign = (id) => {
  activeCampaignId.value = id;
  activeCampaignStageIndex.value = 0;
  if (threeRef.value && currentCampaign.value) {
    const cam = currentCampaign.value.camera;
    threeRef.value.flyTo(cam.pos, cam.target, 1.8);
  }
};

const onPrevCampaignStage = () => {
  if (activeCampaignStageIndex.value > 0) {
    activeCampaignStageIndex.value--;
  }
};

const onNextCampaignStage = () => {
  if (currentCampaign.value && activeCampaignStageIndex.value < currentCampaign.value.stages.length - 1) {
    activeCampaignStageIndex.value++;
  }
};

const onPrevStage = () => {
  if (activeModelStage.value > 1) activeModelStage.value--;
};

const onNextStage = () => {
  if (activeModelStage.value < EVOLUTION_STAGES.length) activeModelStage.value++;
};
</script>

<style scoped>
.app-root {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background: #06090e;
}

.hud-telemetry {
  position: absolute;
  bottom: 74px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 5px 12px;
  border-radius: 8px;
  z-index: 15;
  background: rgba(10, 15, 24, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.tele-item {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.tele-lbl {
  font-size: 8.5px;
  color: #64748b;
}

.tele-val {
  font-size: 10.5px;
  font-weight: 700;
  color: #38bdf8;
}
</style>

/* Vue 模态框与浮层进入/离开丝滑阻尼动效 */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.28s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0 !important;
  transform: scale(0.96) !important;
}
