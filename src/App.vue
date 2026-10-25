<template>
  <div class="app-root">
    <!-- 3D 核心视口 (支持真实 DEM 与高精卫星贴图) -->
    <ThreeCanvas
      ref="threeRef"
      :current-mode="currentMode"
      :active-bonsai-id="activeBonsaiId"
      :bonsai-exaggeration="bonsaiExaggeration"
      :active-model-stage="activeModelStage"
      :active-campaign="currentCampaign"
      :active-campaign-stage-index="activeCampaignStageIndex"
      :lighting-mode="lightingMode"
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
      />

      <!-- 宏观沙盘模式：左侧图文卡片 -->
      <LeftInfoPanel
        v-if="currentMode === 'macro' && currentChapter"
        :chapter="currentChapter"
        :total-chapters="currentChapters.length"
        :current-theme-title="currentTheme.title"
        @listen-current="onListenCurrent"
        @focus-feature="onFocusFeature"
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

      <!-- 微观盆景专属控制器 -->
      <BonsaiModal
        :current-mode="currentMode"
        :bonsais="BONSAIS"
        :current-bonsai-id="activeBonsaiId"
        @select-bonsai="onSelectBonsai"
        @update-exaggeration="val => bonsaiExaggeration = val"
        @back-to-macro="currentMode = 'macro'"
      />

      <!-- 地貌演变专属控制器 -->
      <ModelModal
        :current-mode="currentMode"
        :stages="EVOLUTION_STAGES"
        :current-stage="activeModelStage"
        @select-stage="stage => activeModelStage = stage"
        @prev-stage="onPrevStage"
        @next-stage="onNextStage"
        @back-to-macro="currentMode = 'macro'"
      />

      <!-- 右下角姿态罗盘与倾角指示器 -->
      <div class="hud-telemetry glass-panel">
        <div class="tele-item">
          <span class="tele-lbl">遥感高程源</span>
          <span class="tele-val">AWS DEM + ESRI</span>
        </div>
        <div class="tele-item">
          <span class="tele-lbl">俯仰视角</span>
          <span class="tele-val">{{ cameraPitch }}°</span>
        </div>
        <div class="tele-item">
          <span class="tele-lbl">比例尺</span>
          <span class="tele-val">50 km</span>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import ThreeCanvas from './components/ThreeCanvas.vue';
import HomePortal from './components/HomePortal.vue';
import HudHeader from './components/HudHeader.vue';
import LeftInfoPanel from './components/LeftInfoPanel.vue';
import BottomTimeline from './components/BottomTimeline.vue';
import BonsaiModal from './components/BonsaiModal.vue';
import ModelModal from './components/ModelModal.vue';
import CampaignModal from './components/CampaignModal.vue';
import { THEMES, BONSAIS, EVOLUTION_STAGES, CAMPAIGNS } from './data/shaanxiData.js';
import { narrator } from './utils/speech.js';

const threeRef = ref(null);
const showPortal = ref(true);

const currentMode = ref('macro'); // 'macro' | 'bonsai' | 'model' | 'campaign'
const currentThemeId = ref('geo');
const currentChapterIndex = ref(0);

const activeBonsaiId = ref('bonsai_huashan');
const bonsaiExaggeration = ref(1.5);
const activeModelStage = ref(1);

const activeCampaignId = ref('camp_chencang');
const activeCampaignStageIndex = ref(0);
const lightingMode = ref('dawn'); // 'dawn' | 'noon' | 'sunset'

const isPlaying = ref(false);
const isMuted = ref(false);
const isAutoPlaying = ref(false);
const cameraPitch = ref(35);

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
  if (mode === 'campaign') {
    activeCampaignStageIndex.value = 0;
  }
};

const onLightingChange = (mode) => {
  lightingMode.value = mode;
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
  narrator.speak(text, () => {
    isPlaying.value = false;
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
  }
};

const onToggleVoice = () => {
  isMuted.value = narrator.toggleMute();
  if (isMuted.value) isPlaying.value = false;
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
};

const onPoiSelected = (poi) => {
  console.log('POI clicked:', poi.name);
};

const onSelectBonsai = (id) => {
  activeBonsaiId.value = id;
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
