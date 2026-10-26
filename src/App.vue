<template>
  <div class="app-root">
    <!-- 3D 核心视口 (支持真实 DEM 与高精遥感贴图) -->
    <ThreeCanvas
      ref="threeRef"
      :current-mode="currentMode"
      :active-bonsai-id="activeBonsaiId"
      :bonsai-exaggeration="bonsaiExaggeration"
      :active-model-stage="activeModelStage"
      :active-campaign="currentCampaign"
      :active-campaign-stage-index="activeCampaignStageIndex"
      :lighting-mode="lightingMode"
      :layers="layers"
      :active-lab-id="activeLabId"
      :current-tectonic-stage="currentTectonicStage"
      @camera-update="onCameraUpdate"
      @select-poi="onPoiSelected"
    />

    <!-- 首页门户大屏欢迎遮罩 -->
    <HomePortal
      v-if="showPortal"
      @enter-sandbox="closePortal"
      @select-mode="onPortalSelectMode"
    />

    <!-- HUD 界面层 (非门户模式时呈现) -->
    <template v-else>
      <!-- 顶部 HUD 导航 -->
      <HudHeader
        :themes="THEMES"
        :current-theme-id="currentThemeId"
        :current-mode="currentMode"
        :is-playing="isPlaying"
        :is-muted="isMuted"
        :lighting-mode="lightingMode"
        @open-portal="showPortal = true"
        @change-theme="onChangeTheme"
        @switch-mode="onSwitchMode"
        @toggle-voice="onToggleVoice"
        @reset-north="onResetNorth"
        @toggle-fullscreen="onToggleFullscreen"
        @change-lighting="onLightingChange"
        @open-quiz="isQuizOpen = true"
      />

      <!-- 宏观沙盘模式：左侧图文卡片 (含专业地质剖面与逐句高亮) -->
      <LeftInfoPanel
        v-if="currentMode === 'macro' && currentChapter"
        :chapter="currentChapter"
        :total-chapters="currentChapters.length"
        :current-theme-title="currentTheme.title"
        :is-playing="isPlaying"
        @listen-current="onListenCurrent"
        @focus-feature="onFocusFeature"
        @fly-strata="onFlyToStrata"
      />

      <!-- 宏观沙盘模式：底部时间轴流 -->
      <BottomTimeline
        v-if="currentMode === 'macro'"
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

      <!-- 微观盆景专属控制器 (支持 Zoom 12 与再次提取) -->
      <BonsaiModal
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

      <!-- 陕西之最地标图鉴与互动测验模态框 -->
      <LandmarkQuizModal
        :is-open="isQuizOpen"
        @close="isQuizOpen = false"
        @fly-to="onFlyToLandmark"
      />

      <!-- 地图图层开关与动态指北针控制器 (原视频同款功能) -->
      <LayerControl
        v-if="currentMode === 'macro'"
        :azimuth="cameraAzimuth"
        @update-layers="onUpdateLayers"
        @reset-north="onResetNorth"
      />

      <!-- 沉浸式语音讲解横幅字幕条 -->
      <div v-if="isPlaying && narrationSubtitle" class="voice-marquee glass-panel">
        <span class="speaker-icon">🔊</span>
        <span class="voice-text">{{ narrationSubtitle }}</span>
      </div>

      <!-- 右下角遥感高程遥测信息 -->
      <div class="hud-telemetry glass-panel">
        <div class="tele-item">
          <span class="tele-lbl">遥感高程源</span>
          <span class="tele-val">DEM 30m + 遥感正射</span>
        </div>
        <div class="tele-item">
          <span class="tele-lbl">俯仰视角</span>
          <span class="tele-val">{{ cameraPitch }}°</span>
        </div>
        <div class="tele-item">
          <span class="tele-lbl">方位角</span>
          <span class="tele-val">{{ cameraAzimuth }}°</span>
        </div>
      </div>
    </template>
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
import LandmarkQuizModal from './components/LandmarkQuizModal.vue';
import LayerControl from './components/LayerControl.vue';
import { THEMES, BONSAIS, EVOLUTION_STAGES, CAMPAIGNS } from './data/shaanxiData.js';
import { narrator } from './utils/speech.js';

const threeRef = ref(null);
const showPortal = ref(true);

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

const isQuizOpen = ref(false);
const isPlaying = ref(false);
const isMuted = ref(false);
const isAutoPlaying = ref(false);
const narrationSubtitle = ref('');
const cameraPitch = ref(35);
const cameraAzimuth = ref(0);

const layers = reactive({
  border: true,
  rivers: true,
  qinlingLine: true,
  silkRoad: true,
  regions: true,
  pois: true
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

const onChangeTheme = (themeId) => {
  currentThemeId.value = themeId;
  currentChapterIndex.value = 0;
  flyToCurrentChapter();
  if (isAutoPlaying.value) playCurrentNarration();
};

const onSwitchMode = (mode) => {
  currentMode.value = mode;
  narrator.stop();
  isPlaying.value = false;
  isAutoPlaying.value = false;
  narrationSubtitle.value = '';
  if (mode === 'campaign') {
    activeCampaignStageIndex.value = 0;
  }
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
  if (isAutoPlaying.value) {
    playCurrentNarration();
  }
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
  narrationSubtitle.value = text;
  narrator.speak(text, () => {
    isPlaying.value = false;
    narrationSubtitle.value = '';
    if (isAutoPlaying.value) {
      if (currentChapterIndex.value < currentChapters.value.length - 1) {
        onNextChapter();
      } else {
        isAutoPlaying.value = false;
      }
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
    narrationSubtitle.value = '';
  }
};

const onToggleVoice = () => {
  isMuted.value = narrator.toggleMute();
  if (isMuted.value) {
    isPlaying.value = false;
    narrationSubtitle.value = '';
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
  console.log('POI clicked:', poi.name);
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

const onFlyToLandmark = (pos) => {
  if (threeRef.value) {
    threeRef.value.flyTo([pos[0] + 6, pos[1] + 16, pos[2] + 20], [pos[0], pos[1], pos[2]], 2.0);
  }
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

.voice-marquee {
  position: absolute;
  top: 76px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 25;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 24px;
  border-radius: 30px;
  max-width: 680px;
  background: rgba(10, 15, 24, 0.88);
  border: 1px solid rgba(56, 189, 248, 0.4);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  animation: pulse-glow 2s infinite ease-in-out;
}

@keyframes pulse-glow {
  0%, 100% { border-color: rgba(56, 189, 248, 0.35); box-shadow: 0 4px 20px rgba(56, 189, 248, 0.2); }
  50% { border-color: rgba(56, 189, 248, 0.75); box-shadow: 0 4px 28px rgba(56, 189, 248, 0.45); }
}

.speaker-icon {
  font-size: 16px;
  animation: bounce 1s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}

.voice-text {
  font-size: 13.5px;
  color: #f0f9ff;
  letter-spacing: 0.04em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.hud-telemetry {
  position: absolute;
  bottom: 16px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 6px 14px;
  z-index: 15;
}

.tele-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tele-lbl {
  font-size: 9px;
  color: #64748b;
}

.tele-val {
  font-size: 11px;
  font-weight: 600;
  color: #38bdf8;
}
</style>
