<template>
  <div
    class="app-root"
    :data-theme="currentThemeId"
    :data-terrain="terrainStatus"
    :class="{
      'has-sidebar': showGuide || (showChapters && !isPanelCollapsed),
      'guide-active': showGuide,
      'has-chapters': showChapters,
      'has-cinema': isTourActive,
      'has-special-scene': currentMode !== 'macro',
      'has-profile': showProfile,
      'has-workshop': activeTool === 'roadbook' || activeTool === 'detective',
      'is-zen': isZenMode,
      'photo-open': selectedPoi !== null,
      ['sheet-' + visibleSheet]: true
    }"
  >
    <div ref="safeFrame" class="map-safe-frame" aria-hidden="true"></div>
    <div v-if="!showPortal && !hasMap" class="static-map"><TerrainPoster /></div>
    <ThreeCanvas
      v-if="hasEntered"
      :key="mapVersion"
      ref="threeRef"
      class="map-scene"
      :class="{ 'scene-loading': !hasMap }"
      :safe-frame="safeFrame"
      :current-mode="currentMode"
      :active-bonsai-id="activeBonsaiId"
      :bonsai-exaggeration="bonsaiExaggeration"
      :active-model-stage="activeModelStage"
      :active-campaign="currentCampaign"
      :active-campaign-stage-index="activeCampaignStageIndex"
      :active-lab-id="activeLabId"
      :current-tectonic-stage="currentTectonicStage"
      :camera-request="cameraRequest"
      :lighting-mode="displayLighting"
      :season-mode="displaySeason"
      :gis-mode="displayStyle"
      :layers="displayedLayers"
      :history="!showGuide && currentThemeId === 'history'"
      :guide-step="showGuide ? guide.step : -1"
      :guide-labels="showGuide ? QINLING_STATIONS[guide.step].labels : null"
      :is-guide-picking="guide.picking"
      :is-probing="activeTool === 'probe'"
      :is-profiling-active="activeTool === 'profile' && !showProfile"
      :is-profile-visible="showProfile"
      :is-roadbook-active="activeTool === 'roadbook' && roadbookDrawing"
      :is-challenge-active="activeTool === 'detective'"
      :is-portal-active="showPortal"
      :reduced-motion="reducedMotion"
      @terrain-status="onTerrainStatus"
      @camera-update="onCameraUpdate"
      @select-poi="onPoiSelected"
      @profile-calculated="profileData = $event"
      @profile-step="profileStep = $event"
      @guide-point="markGuideGuess"
      @map-gesture="onMapGesture"
      @challenge-click="detectiveRef?.handleTerrainClick($event)"
      @select-culture="onSelectCulture"
      @select-poetry="onSelectPoetry"
      @spin-360-status="isSpinning = $event"
      @roadbook-point-added="onRoadbookPointAdded"
      @geo-telemetry="telemetry = $event"
    />

    <HomePortal v-if="showPortal" @enter-sandbox="closePortal" @start-guide="startGuide" @open-changelog="isChangelogActive = true" />
    <template v-else>
      <div v-if="terrainStatus !== 'ready'" class="map-status terrain-notice" role="status">
        <span>{{ terrainMessage }}</span>
        <button v-if="terrainStatus === 'static' || terrainStatus === 'limited'" type="button" class="map-button" @click="retryMap">重试</button>
      </div>

      <button v-if="isZenMode" class="map-button map-status zen-restore" type="button" @click="isZenMode = false">退出纯净观赏</button>
      <HudHeader
        v-if="!isZenMode && !isTourActive"
        :themes="THEMES" :current-theme-id="currentThemeId" :current-mode="currentMode"
        :context="headerContext" :guide-active="showGuide"
        @open-portal="openPortal"
        @start-guide="startGuide"
        @change-theme="onChangeTheme"
        @switch-mode="onSwitchMode"
        @open-cmd="isCmdOpen = true"
        @open-tour="onOpenTour"
        @open-roadbook="onOpenRoadbook"
        @open-gallery="onOpenGallery"
        @open-detective="onOpenDetective"
        @open-wargame="isWargameActive = true"
        @open-poster="onOpenPoster"
        @open-changelog="isChangelogActive = true"
        @toggle-zen-mode="toggleZen"
        @toggle-fullscreen="onToggleFullscreen"
      />

      <template v-if="!isZenMode && !isTourActive">
        <QinlingGuide
          v-if="showGuide"
          v-model:sheet="guide.sheet"
          :step="guide.step" :picking="guide.picking"
          :guess="!!guide.guess" :revealed="guide.revealed"
          :has-profile="!!guide.profile" :answer="guide.answer"
          :speaking="isPlaying" :can-pick="hasMap" :can-measure="canMeasure" :can-advance="canAdvanceGuide"
          @close="closeGuide()"
          @step="openGuideStep"
          @pick="toggleGuidePicking"
          @pick-center="threeRef?.pickMapCenter()"
          @reveal="guide.revealed = true"
          @profile="openGuideProfile"
          @narrate="onListenCurrent"
          @answer="guide.answer = $event"
        />
        <LeftInfoPanel
          v-if="currentMode === 'macro' && currentChapter && !showGuide"
          v-show="showChapters"
          :chapter="currentChapter" :total-chapters="currentChapters.length"
          :starting-sheet="chapterSheet" :starting-collapsed="isPanelCollapsed"
          :current-theme-title="currentTheme.title" :current-theme-id="currentThemeId"
          :themes="THEMES" :chapters="currentChapters" :current-chapter-index="currentChapterIndex"
          :is-auto-playing="isAutoPlaying" :is-playing="isPlaying"
          @change-theme="onChangeTheme" @prev-chapter="onPrevChapter" @next-chapter="onNextChapter"
          @select-chapter="onSelectChapter" @toggle-autoplay="onToggleAutoplay"
          @collapse-change="isPanelCollapsed = $event" @sheet-change="chapterSheet = $event" @listen-current="onListenCurrent"
          @focus-feature="flyToCurrentChapter" @fly-strata="onFlyToStrata" @view-photo="onViewChapterPhoto"
        />
        <BottomTimeline
          v-if="showChapters"
          :chapters="currentChapters" :current-index="currentChapterIndex" :is-auto-playing="isAutoPlaying"
          @toggle-autoplay="onToggleAutoplay" @prev-chapter="onPrevChapter" @next-chapter="onNextChapter" @select-chapter="onSelectChapter"
        />

        <CampaignModal
          v-if="!showGuide && currentMode === 'campaign'"
          :current-mode="currentMode" :campaigns="CAMPAIGNS" :current-campaign-id="activeCampaignId"
          :current-stage-index="activeCampaignStageIndex"
          @select-campaign="onSelectCampaign" @select-stage="activeCampaignStageIndex = $event"
          @prev-stage="onPrevCampaignStage" @next-stage="onNextCampaignStage" @back-to-macro="onSwitchMode('macro')"
        />
        <BonsaiModal
          v-if="!showGuide && currentMode === 'bonsai'"
          :current-mode="currentMode" :bonsais="BONSAIS" :current-bonsai-id="activeBonsaiId"
          :exaggeration="bonsaiExaggeration"
          @select-bonsai="activeBonsaiId = $event" @update-exaggeration="bonsaiExaggeration = $event"
          @re-extract="threeRef?.reExtractBonsai()" @back-to-macro="onSwitchMode('macro')"
        />
        <ModelModal
          v-if="!showGuide && currentMode === 'model'"
          :current-mode="currentMode" :stages="EVOLUTION_STAGES" :current-stage="activeModelStage"
          :active-lab-id="activeLabId" :current-tectonic-stage="currentTectonicStage"
          @select-stage="activeModelStage = $event" @prev-stage="activeModelStage = Math.max(1, activeModelStage - 1)"
          @next-stage="activeModelStage = Math.min(EVOLUTION_STAGES.length, activeModelStage + 1)"
          @change-lab="activeLabId = $event" @change-tectonic-stage="currentTectonicStage = $event" @back-to-macro="onSwitchMode('macro')"
        />

        <RightToolbar
          :layers="displayedLayers" :season-mode="displaySeason" :lighting-mode="displayLighting"
          :gis-mode="displayStyle" :analysis="analysisActive" :azimuth="cameraAzimuth" :is-spinning="isSpinning"
          :macro="currentMode === 'macro' || currentMode === 'campaign'" :guide-active="showGuide"
          :can-pick="hasMap" :can-measure="canMeasure" :is-profiling="activeTool === 'profile'" :is-probing="activeTool === 'probe'"
          @update-layers="Object.assign(layers, $event)" @change-season="seasonMode = $event" @change-lighting="lightingMode = $event"
          @change-gis="gisMode = $event" @reset-north="threeRef?.resetNorth()" @toggle-360-spin="threeRef?.toggle360Spin()"
          @toggle-profiling="toggleTool('profile')" @toggle-probe="toggleTool('probe')"
        />
        <MapLegend
          v-if="hasMap && !showProfile && currentMode === 'macro' && !guide.picking"
          :layers="displayedLayers" :mode="showGuide || !canMeasure ? 'natural' : gisMode" :water-names="showGuide && guide.step === 3"
        />
        <div v-if="pickingMessage" class="map-status picking-notice" role="status">
          <span>{{ pickingMessage }}</span>
          <button class="map-button" type="button" @click="threeRef?.pickMapCenter()">选地图中心</button>
          <button class="map-button" type="button" @click="guide.picking ? toggleGuidePicking() : closeTools()">取消</button>
        </div>

        <aside v-if="activeTool === 'probe' && telemetry" class="map-surface probe-card" aria-label="地形查询结果">
          <div><strong>{{ telemetry.region }}</strong><button type="button" class="map-icon" aria-label="关闭查询" @click="closeTools()"><X :size="17" /></button></div>
          <p>{{ telemetry.lng }} · {{ telemetry.lat }}</p>
          <p>{{ telemetry.elevation === null ? '高程不可用' : '参考海拔约 ' + telemetry.elevation + ' m' }}</p>
        </aside>
        <ElevationProfiler
          v-if="showProfile" :profile-data="showGuide ? guide.profile : profileData" :teaching="showGuide"
          @cursor="threeRef?.setProfileCursor($event)"
          @close="showGuide ? guide.profileOpen = false : closeTools()"
          @reset-line="resetProfile"
        />
      </template>

      <CinematicTour
        v-if="isTourActive" ref="cinematicRef" :active="true" :current-index="currentTourIndex"
        :reduced-motion="reducedMotion"
        @close-tour="closeCinematic" @next-station="flyToTourStation(currentTourIndex + 1)"
        @prev-station="flyToTourStation(currentTourIndex - 1)" @select-station="flyToTourStation"
      />
      <RouteWorkshopModal
        v-if="activeTool === 'roadbook'" :active="true" :custom-points="customRoadbookPoints"
        :can-fly="hasMap && !reducedMotion"
        @close="closeTools()" @select-route="roadbookRoute = $event" @drawing="roadbookDrawing = $event"
        @start-fpv="threeRef?.startFPVFlight($event)" @stop-fpv="threeRef?.stopFPVFlight()"
        @pause-fpv="threeRef?.setFPVPaused($event)" @change-fpv-speed="threeRef?.setFPVSpeed($event)"
        @focus-waypoint="onFocusWaypoint" @clear-custom="onClearCustomRoadbook"
      />
      <GeoDetectiveModal
        v-if="activeTool === 'detective'" ref="detectiveRef" :active="true"
        @close="closeTools()" @focus-target="onFlyToStrata"
      />
      <PoiPhotoCard
        v-if="selectedPoi && !showGuide && !activeTool && !isZenMode && !isTourActive"
        :poi="selectedPoi" @close="selectedPoi = null" @view-large="onViewLargePhoto" @view-gallery="onOpenGallery"
      />
      <CulturalCard
        v-if="selectedCulturalItem" :cultural-item="selectedCulturalItem"
        @close="selectedCulturalItem = null" @fly-to="onFlyToStrata"
      />
      <PoetryCard
        v-if="selectedPoetrySpot" :poetry-spot="selectedPoetrySpot"
        @close="selectedPoetrySpot = null" @fly-to="onFlyToStrata"
      />
    </template>

    <TacticalWargameModal v-if="isWargameActive" :active="true" :comparison-data="currentWargameData" @close="isWargameActive = false" />
    <PosterModal
      v-if="isPosterActive" :active="true" :snapshot-url="snapshotUrl"
      :telemetry="{ pitch: cameraPitch, azimuth: cameraAzimuth }" :chapter-title="currentChapter?.title"
      @close="isPosterActive = false"
    />
    <SceneryGalleryModal
      v-if="isGalleryActive" :active="true" :initial-item="activeGalleryItem"
      @close="onCloseGallery" @fly-to="onFlyToScenery"
    />
    <ChangelogModal v-if="isChangelogActive" :active="true" @close="isChangelogActive = false" />
    <CommandPaletteModal
      v-if="isCmdOpen" :active="true" :chapters="currentChapters" :themes="THEMES"
      @close="isCmdOpen = false" @select-chapter="onSelectChapterItem"
      @open-gallery="onOpenGallery" @open-tour="onOpenTour" @open-roadbook="onOpenRoadbook"
      @open-detective="onOpenDetective" @open-poster="onOpenPoster" @open-changelog="isChangelogActive = true"
      @switch-mode="onSwitchMode" @change-lighting="lightingMode = $event" @change-season="seasonMode = $event"
      @toggle-360-spin="threeRef?.toggle360Spin()"
    />
    <div v-if="voiceNotice" class="map-status voice-notice" role="status">{{ voiceNotice }}</div>
  </div>
</template>

<script setup>
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowRef, watch } from 'vue';
import { X } from 'lucide-vue-next';
import HomePortal from './components/HomePortal.vue';
import TerrainPoster from './components/TerrainPoster.vue';
import HudHeader from './components/HudHeader.vue';
import QinlingGuide from './components/QinlingGuide.vue';
import BottomTimeline from './components/BottomTimeline.vue';
import MapLegend from './components/MapLegend.vue';
import RightToolbar from './components/RightToolbar.vue';
import { THEMES, BONSAIS, EVOLUTION_STAGES, CAMPAIGNS, WARGAME_COMPARISONS, CINEMATIC_WAYPOINTS, SCENERY_PHOTOS } from './data/shaanxiData.js';
import { QINLING_STATIONS, QINLING_TRANSECT } from './data/qinlingGuide.js';
import { chapterLayers, guideLayers } from './data/mapThemes.js';
import { narrator } from './utils/speech.js';

const ThreeCanvas = defineAsyncComponent(() => import('./components/ThreeCanvas.vue'));
const LeftInfoPanel = defineAsyncComponent(() => import('./components/LeftInfoPanel.vue'));
const BonsaiModal = defineAsyncComponent(() => import('./components/BonsaiModal.vue'));
const ModelModal = defineAsyncComponent(() => import('./components/ModelModal.vue'));
const CampaignModal = defineAsyncComponent(() => import('./components/CampaignModal.vue'));
const CinematicTour = defineAsyncComponent(() => import('./components/CinematicTour.vue'));
const ElevationProfiler = defineAsyncComponent(() => import('./components/ElevationProfiler.vue'));
const RouteWorkshopModal = defineAsyncComponent(() => import('./components/RouteWorkshopModal.vue'));
const TacticalWargameModal = defineAsyncComponent(() => import('./components/TacticalWargameModal.vue'));
const GeoDetectiveModal = defineAsyncComponent(() => import('./components/GeoDetectiveModal.vue'));
const PosterModal = defineAsyncComponent(() => import('./components/PosterModal.vue'));
const CulturalCard = defineAsyncComponent(() => import('./components/CulturalCard.vue'));
const PoetryCard = defineAsyncComponent(() => import('./components/PoetryCard.vue'));
const ChangelogModal = defineAsyncComponent(() => import('./components/ChangelogModal.vue'));
const SceneryGalleryModal = defineAsyncComponent(() => import('./components/SceneryGalleryModal.vue'));
const PoiPhotoCard = defineAsyncComponent(() => import('./components/PoiPhotoCard.vue'));
const CommandPaletteModal = defineAsyncComponent(() => import('./components/CommandPaletteModal.vue'));

const safeFrame = ref(null);
const threeRef = ref(null);
const detectiveRef = ref(null);
const cinematicRef = ref(null);
const showPortal = ref(true);
const hasEntered = ref(false);
const terrainStatus = ref('loading');
const mapVersion = ref(0);
const cameraRequest = shallowRef(null);
const hasMap = computed(() => ['preview', 'ready', 'limited'].includes(terrainStatus.value));
const canMeasure = computed(() => terrainStatus.value === 'ready' && currentMode.value === 'macro');
const terrainMessage = computed(() => ({
  loading: '正在加载三维地形',
  preview: '正在读取完整高程',
  limited: '三维预览可用 · 高程测量待恢复',
  static: '静态地形预览'
})[terrainStatus.value]);
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const reducedMotion = ref(motionPreference.matches);
const isPanelCollapsed = ref(false);
const chapterSheet = ref('peek');
const currentMode = ref('macro');
const currentThemeId = ref('geo');
const currentChapterIndex = ref(0);
const layers = reactive(chapterLayers('geo', 'geo_01'));
const seasonMode = ref('natural');
const lightingMode = ref('noon');
const gisMode = ref('natural');
const displayStyle = computed(() => showGuide.value || !canMeasure.value ? 'natural' : gisMode.value);
const analysisActive = computed(() => ['hypsometric', 'slope'].includes(displayStyle.value));
const displayLighting = computed(() => showGuide.value || analysisActive.value ? 'noon' : lightingMode.value);
const displaySeason = computed(() => showGuide.value || analysisActive.value ? 'natural' : seasonMode.value);
const isZenMode = ref(false);
const activeBonsaiId = ref('bonsai_huashan');
const bonsaiExaggeration = ref(5);
const activeLabId = ref('loess');
const currentTectonicStage = ref(0);
const activeModelStage = ref(1);
const activeCampaignId = ref('camp_chencang');
const activeCampaignStageIndex = ref(0);
const cameraPitch = ref(35);
const cameraAzimuth = ref(0);
const isSpinning = ref(false);
const selectedPoi = ref(null);
const selectedCulturalItem = ref(null);
const selectedPoetrySpot = ref(null);
const activeTool = ref('');
const profileData = shallowRef(null);
const profileStep = ref(1);
const telemetry = ref(null);
const customRoadbookPoints = ref([]);
const roadbookRoute = shallowRef(null);
const roadbookDrawing = ref(false);
const isWargameActive = ref(false);
const isPosterActive = ref(false);
const snapshotUrl = ref('');
const isGalleryActive = ref(false);
const activeGalleryItem = ref(null);
const isChangelogActive = ref(false);
const isCmdOpen = ref(false);
const isTourActive = ref(false);
const currentTourIndex = ref(0);
const isPlaying = ref(false);
const isAutoPlaying = ref(false);
const voiceNotice = ref('');
let autoTimer;
let noticeTimer;
let previousToolCamera;
let previousCinemaCamera;

const guide = reactive({
  active: false, step: 0, sheet: 'half', picking: false,
  guess: null, revealed: false, profile: null, profileOpen: false, answer: ''
});
let guideReturn = null;
let guideSelectionSheet = 'half';
const showGuide = computed(() => guide.active && !showPortal.value);
const showChapters = computed(() => !isZenMode.value && !showPortal.value && currentMode.value === 'macro'
  && !showGuide.value && !isTourActive.value && !['profile', 'roadbook', 'detective'].includes(activeTool.value));
const showProfile = computed(() => !isZenMode.value && (showGuide.value ? guide.profileOpen && !!guide.profile : !!profileData.value));
const visibleSheet = computed(() => showGuide.value ? guide.sheet : (showChapters.value ? chapterSheet.value : 'none'));
const displayedLayers = computed(() => {
  if (showGuide.value) return guideLayers(guide.step, guide.step >= 1 && guide.revealed);
  return analysisActive.value ? { ...layers, valleyMist: false } : layers;
});
const canAdvanceGuide = computed(() => {
  if (guide.step === 1) return guide.revealed || terrainStatus.value === 'static';
  if (guide.step === 2) return !!guide.profile || ['limited', 'static'].includes(terrainStatus.value);
  return true;
});
const pickingMessage = computed(() => {
  if (guide.picking) return '在地形上标记你判断的分水岭';
  if (activeTool.value === 'profile' && !profileData.value) return profileStep.value === 1 ? '在地形上选起点' : '在地形上选终点';
  if (activeTool.value === 'probe' && !telemetry.value) return '点按地形查询此点';
  return '';
});

const currentTheme = computed(() => THEMES.find(theme => theme.id === currentThemeId.value) || THEMES[0]);
const currentChapters = computed(() => currentTheme.value.chapters);
const currentChapter = computed(() => currentChapters.value[currentChapterIndex.value]);
const currentCampaign = computed(() => CAMPAIGNS.find(campaign => campaign.id === activeCampaignId.value) || CAMPAIGNS[0]);
const currentWargameData = computed(() => activeCampaignId.value === 'camp_chencang' ? WARGAME_COMPARISONS.camp_chencang : WARGAME_COMPARISONS.camp_north);
const headerContext = computed(() => showGuide.value ? '秦岭南北' : (
  { campaign: '历史战役', bonsai: '地形盆景', model: '地貌实验' }[currentMode.value] || currentTheme.value.title
));

function requestCamera(camera, duration = 1.25, fit = false, ground = false) {
  if (camera?.pos && camera.target) cameraRequest.value = { ...camera, duration, fit, ground };
}

function closePortal() {
  showPortal.value = false;
  hasEntered.value = true;
  if (currentMode.value === 'macro') flyToCurrentChapter();
}

function openPortal() {
  closeGuide(false);
  closeCinematic(false);
  closeTools(false);
  stopNarration();
  clearCards();
  isZenMode.value = false;
  showPortal.value = true;
}

function onTerrainStatus(status) {
  terrainStatus.value = status;
  if (status === 'static') {
    closeTools(false);
    if (guide.picking) toggleGuidePicking();
    guide.profileOpen = false;
  }
}

function retryMap() {
  terrainStatus.value = 'loading';
  mapVersion.value++;
}

function startGuide() {
  if (guide.active) return;
  closeCinematic(false);
  closeTools();
  clearCards();
  isZenMode.value = false;
  guideReturn = { mode: currentMode.value, camera: threeRef.value?.getCameraState() };
  currentMode.value = 'macro';
  showPortal.value = false;
  hasEntered.value = true;
  Object.assign(guide, { active: true, step: 0, sheet: 'half', picking: false, guess: null, revealed: false, profile: null, profileOpen: false, answer: '' });
  openGuideStep(0);
}

function closeGuide(restore = true) {
  if (!guide.active) return;
  guide.active = false;
  guide.picking = false;
  guide.profileOpen = false;
  stopNarration();
  threeRef.value?.setGuidePoint(null);
  threeRef.value?.clearProfiling();
  if (restore && guideReturn) {
    currentMode.value = guideReturn.mode;
    if (guideReturn.camera) requestCamera(guideReturn.camera, 0.9);
    else flyToCurrentChapter();
  }
  guideReturn = null;
}

function openGuideStep(index) {
  if (!QINLING_STATIONS[index]) return;
  stopNarration();
  if (guide.picking) toggleGuidePicking();
  guide.step = index;
  guide.profileOpen = false;
  guide.sheet = index === 0 ? 'peek' : 'half';
  threeRef.value?.clearProfiling();
  threeRef.value?.setGuidePoint(index === 1 || index === 2 ? guide.guess : null);
  requestCamera(QINLING_STATIONS[index].camera, index === 0 ? 1.1 : 1.35, index === 0, true);
}

function toggleGuidePicking() {
  if (guide.picking) {
    guide.picking = false;
    guide.sheet = guideSelectionSheet;
    return;
  }
  if (!hasMap.value) return;
  guideSelectionSheet = guide.sheet;
  guide.sheet = 'peek';
  guide.picking = true;
  threeRef.value?.focusMap();
}

function markGuideGuess(point) {
  guide.guess = point;
  threeRef.value?.setGuidePoint(point);
  if (guide.picking) toggleGuidePicking();
}

function openGuideProfile() {
  if (!canMeasure.value) return;
  const result = threeRef.value?.drawProfile(...QINLING_TRANSECT);
  if (!result) return;
  guide.profile = result;
  guide.profileOpen = true;
}

function onOpenTour() {
  closeGuide();
  closeTools();
  stopNarration();
  clearCards();
  previousCinemaCamera = threeRef.value?.getCameraState();
  isZenMode.value = false;
  showPortal.value = false;
  hasEntered.value = true;
  currentMode.value = 'macro';
  isTourActive.value = true;
  flyToTourStation(0);
}

function flyToTourStation(index) {
  const station = CINEMATIC_WAYPOINTS[index];
  if (!station) return;
  currentTourIndex.value = index;
  requestCamera(station.camera, station.camera.duration || 3, false, true);
}

function closeCinematic(restore = true) {
  if (!isTourActive.value) return;
  isTourActive.value = false;
  if (restore) {
    if (previousCinemaCamera) requestCamera(previousCinemaCamera, 0.9);
    else flyToCurrentChapter();
  }
  previousCinemaCamera = null;
}

function clearCards() {
  selectedPoi.value = null;
  selectedCulturalItem.value = null;
  selectedPoetrySpot.value = null;
}

function closeTools(restore = true) {
  if (!activeTool.value) return;
  if (activeTool.value === 'profile') resetProfile();
  if (activeTool.value === 'roadbook') {
    threeRef.value?.stopFPVFlight(false);
    threeRef.value?.clearRoadbook();
    onClearCustomRoadbook();
    roadbookDrawing.value = false;
  }
  activeTool.value = '';
  telemetry.value = null;
  if (restore && previousToolCamera) requestCamera(previousToolCamera, 0.8);
  previousToolCamera = null;
}

function openTool(name) {
  closeGuide();
  closeCinematic(false);
  closeTools();
  stopNarration();
  clearCards();
  const wasMacro = currentMode.value === 'macro';
  previousToolCamera = wasMacro ? threeRef.value?.getCameraState() : null;
  currentMode.value = 'macro';
  hasEntered.value = true;
  showPortal.value = false;
  isZenMode.value = false;
  activeTool.value = name;
  if (!wasMacro) flyToCurrentChapter();
  if (name === 'profile' || name === 'probe') nextTick(() => threeRef.value?.focusMap());
}

function toggleTool(name) {
  if (activeTool.value === name) closeTools();
  else if (name === 'profile' ? canMeasure.value : hasMap.value) openTool(name);
}

const onOpenRoadbook = () => openTool('roadbook');
const onOpenDetective = () => openTool('detective');

function resetProfile() {
  profileData.value = null;
  profileStep.value = 1;
  threeRef.value?.clearProfiling();
}

function onRoadbookPointAdded(point) {
  customRoadbookPoints.value.push(point);
}

function onClearCustomRoadbook() {
  customRoadbookPoints.value = [];
  roadbookRoute.value = null;
}

function onFocusWaypoint(waypoint) {
  if (waypoint?.pos) onFlyToStrata(waypoint.pos);
}

function onOpenPoster() {
  snapshotUrl.value = threeRef.value?.captureSnapshot() || '';
  if (snapshotUrl.value) isPosterActive.value = true;
}

function onPoiSelected(poi) { clearCards(); selectedPoi.value = poi; }
function onSelectCulture(item) { clearCards(); selectedCulturalItem.value = item; }
function onSelectPoetry(item) { clearCards(); selectedPoetrySpot.value = item; }

function onFlyToStrata(pos, target) {
  if (!pos) return;
  if (target) requestCamera({ pos, target }, 1.25, false, true);
  else requestCamera({ pos: [pos[0] + 5, pos[1] + 17, pos[2] + 22], target: pos }, 1.25, false, true);
}

function onOpenGallery() {
  stopNarration();
  activeGalleryItem.value = null;
  isGalleryActive.value = true;
}

function onCloseGallery() {
  isGalleryActive.value = false;
  activeGalleryItem.value = null;
}

function onFlyToScenery(item) {
  closeGuide(false);
  closeCinematic(false);
  closeTools(false);
  clearCards();
  currentMode.value = 'macro';
  hasEntered.value = true;
  showPortal.value = false;
  requestCamera(item.camera, 1.25, false, true);
}

function onViewChapterPhoto(photoUrl, caption, media) {
  const item = SCENERY_PHOTOS.find(photo => photo.url === photoUrl);
  activeGalleryItem.value = item || {
    id: currentChapter.value.id, title: currentChapter.value.title, subtitle: currentChapter.value.subTitle,
    url: photoUrl, desc: caption, region: currentTheme.value.title, location: '章节配图', media
  };
  isGalleryActive.value = true;
}

function onViewLargePhoto(item) {
  activeGalleryItem.value = item;
  isGalleryActive.value = true;
}

function onSwitchMode(mode) {
  closeGuide(false);
  closeCinematic(false);
  closeTools(false);
  clearCards();
  stopNarration();
  isZenMode.value = false;
  hasEntered.value = true;
  showPortal.value = false;
  currentMode.value = mode;
  if (mode === 'macro') flyToCurrentChapter();
}

function onChangeTheme(themeId, index = 0) {
  const theme = THEMES.find(item => item.id === themeId);
  if (!theme?.chapters[index]) return;
  closeGuide(false);
  closeCinematic(false);
  closeTools(false);
  clearCards();
  stopNarration();
  isZenMode.value = false;
  hasEntered.value = true;
  showPortal.value = false;
  currentMode.value = 'macro';
  currentThemeId.value = themeId;
  currentChapterIndex.value = index;
  Object.assign(layers, chapterLayers(themeId, theme.chapters[index].id));
  flyToCurrentChapter();
}

function flyToCurrentChapter() {
  requestCamera(currentChapter.value?.camera, 1.25, currentChapter.value?.id === 'geo_01', true);
}

function onSelectChapter(index, fromAutoplay = false) {
  const chapter = currentChapters.value[index];
  if (!chapter) return;
  clearCards();
  stopNarration(!fromAutoplay);
  currentChapterIndex.value = index;
  Object.assign(layers, chapterLayers(currentThemeId.value, chapter.id));
  flyToCurrentChapter();
}
const onPrevChapter = () => onSelectChapter(currentChapterIndex.value - 1);
const onNextChapter = () => onSelectChapter(currentChapterIndex.value + 1);

function onSelectChapterItem(item) {
  const theme = THEMES.find(theme => theme.id === item.themeId || theme.chapters.some(chapter => chapter.id === item.id));
  if (theme) onChangeTheme(theme.id, theme.chapters.findIndex(chapter => chapter.id === item.id));
}

function onSelectCampaign(id) {
  activeCampaignId.value = id;
  activeCampaignStageIndex.value = 0;
  requestCamera(currentCampaign.value.camera);
}
const onPrevCampaignStage = () => { activeCampaignStageIndex.value = Math.max(0, activeCampaignStageIndex.value - 1); };
const onNextCampaignStage = () => { activeCampaignStageIndex.value = Math.min(currentCampaign.value.stages.length - 1, activeCampaignStageIndex.value + 1); };

function stopNarration(stopAutoplay = true) {
  clearTimeout(autoTimer);
  narrator.stop();
  isPlaying.value = false;
  if (stopAutoplay) isAutoPlaying.value = false;
}

function announceVoiceUnavailable() {
  isAutoPlaying.value = false;
  voiceNotice.value = '此设备暂无法朗读，可阅读当前讲解。';
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => { voiceNotice.value = ''; }, 3200);
}

function playCurrentNarration() {
  const content = showGuide.value ? QINLING_STATIONS[guide.step] : currentChapter.value;
  if (!content) return;
  const text = content.title + '。' + (content.description || content.desc);
  isPlaying.value = narrator.speak(text, (finished) => {
    isPlaying.value = false;
    if (!finished) { announceVoiceUnavailable(); return; }
    if (isAutoPlaying.value) {
      autoTimer = setTimeout(() => {
        onSelectChapter((currentChapterIndex.value + 1) % currentChapters.value.length, true);
        playCurrentNarration();
      }, 1200);
    }
  });
  if (!isPlaying.value) announceVoiceUnavailable();
}

function onListenCurrent() {
  if (isPlaying.value) stopNarration();
  else playCurrentNarration();
}

function onToggleAutoplay() {
  if (isAutoPlaying.value) stopNarration();
  else { isAutoPlaying.value = true; playCurrentNarration(); }
}

function onCameraUpdate({ pitch, azimuth }) { cameraPitch.value = pitch; cameraAzimuth.value = azimuth; }

function toggleZen() {
  if (showGuide.value || showPortal.value) return;
  if (!isZenMode.value) {
    closeTools();
    stopNarration();
    clearCards();
  }
  isZenMode.value = !isZenMode.value;
}

function onToggleFullscreen() {
  if (document.fullscreenElement) void document.exitFullscreen?.().catch(() => {});
  else void document.documentElement.requestFullscreen?.().catch(() => {});
}

function onKeydown(event) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    isCmdOpen.value = !isCmdOpen.value;
    return;
  }
  if (event.key === 'Escape') {
    if (isCmdOpen.value) isCmdOpen.value = false;
    else if (isGalleryActive.value) onCloseGallery();
    else if (isChangelogActive.value) isChangelogActive.value = false;
    else if (isPosterActive.value) isPosterActive.value = false;
    else if (isWargameActive.value) isWargameActive.value = false;
    else if (activeTool.value) closeTools();
    else if (guide.picking) toggleGuidePicking();
    else if (guide.profileOpen) guide.profileOpen = false;
    else if (showGuide.value) closeGuide();
    else if (isTourActive.value) closeCinematic();
    else if (isZenMode.value) isZenMode.value = false;
    else clearCards();
    return;
  }
  if (event.target?.matches('input, textarea, select, [contenteditable]')) return;
  if (event.key === '?') isCmdOpen.value = true;
  if (event.key.toLowerCase() === 'h') toggleZen();
  if (event.key.toLowerCase() === 'f' && !showPortal.value) onToggleFullscreen();
}

function onVisibilityChange() {
  if (document.hidden) onMapGesture();
}

function onMapGesture() {
  stopNarration();
  cinematicRef.value?.pausePlayback();
}

function onMotionChange(event) { reducedMotion.value = event.matches; }

watch(() => guide.profileOpen, (open) => { if (!open) threeRef.value?.setProfileCursor(null); });
watch(() => [hasMap.value, roadbookRoute.value], ([ready, route]) => {
  if (ready && activeTool.value === 'roadbook') threeRef.value?.drawRoadbookRoute(route);
});

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
  document.addEventListener('visibilitychange', onVisibilityChange);
  motionPreference.addEventListener('change', onMotionChange);
});
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
  document.removeEventListener('visibilitychange', onVisibilityChange);
  motionPreference.removeEventListener('change', onMotionChange);
  stopNarration();
  clearTimeout(noticeTimer);
});
</script>
