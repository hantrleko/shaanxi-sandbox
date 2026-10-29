<template>
  <aside
    class="left-info-panel glass-panel"
    :class="{
      collapsed: isCollapsed,
      'mobile-sheet': isMobile,
      'sheet-half': isMobile && mobileSheetState === 'half',
      'sheet-full': isMobile && mobileSheetState === 'full',
      'sheet-peek': isMobile && mobileSheetState === 'peek'
    }"
  >
    <!-- 移动端抽屉手柄条 (Mobile Bottom Sheet Drag Handle) -->
    <div
      v-if="isMobile"
      class="mobile-drag-handle-bar"
      @click="cycleMobileSheetState"
      role="button"
      title="点击调整抽屉高度 (收起/半屏/全屏)"
    >
      <div class="drag-pill"></div>
    </div>

    <!-- 桌面端侧栏收起/展开微动滑钮 -->
    <button
      v-if="!isMobile"
      class="panel-collapse-toggle"
      @click="isCollapsed = !isCollapsed"
      :title="isCollapsed ? '展开左侧面板 (L)' : '收起面板以纯净浏览 3D 沙盒 (L)'"
      aria-label="展开或收起图文面板"
    >
      <ChevronLeft v-if="!isCollapsed" :size="16" />
      <ChevronRight v-else :size="16" />
      <span class="toggle-v-text" v-if="isCollapsed">展开图文</span>
    </button>

    <!-- 折叠为微轨时的迷你状态 (Micro-rail state) -->
    <div v-if="isCollapsed && !isMobile" class="micro-rail-content" @click="isCollapsed = false">
      <span class="micro-seal-tag">{{ chapter.num }}</span>
      <span class="micro-title-v">{{ chapter.title }}</span>
      <Maximize2 :size="14" class="micro-icon" />
    </div>

    <!-- 正常展开面板主容器 -->
    <div v-show="!isCollapsed || isMobile" class="panel-content-wrap custom-scrollbar">
      <!-- 📸 16:9 置顶真实地理实景大图 -->
      <div
        v-if="currentPhotoUrl"
        class="hero-photo-banner"
        @click="$emit('view-photo', currentPhotoUrl, currentPhotoCaption)"
        title="点击放大查看高清摄影大图"
      >
        <img :src="currentPhotoUrl" :alt="chapter.title" class="hero-photo-img" loading="lazy" />
        <div class="hero-photo-gradient"></div>
        <div class="hero-photo-top-bar">
          <span class="photo-live-badge">
            <span class="pulse-dot"></span>
            {{ showAltPhoto ? (chapter.altBadge || '胜迹/文物') : '真实地理摄影' }}
          </span>
          <div class="banner-actions" @click.stop>
            <button
              v-if="chapter.altPhotoUrl"
              class="photo-toggle-pill"
              @click="showAltPhoto = !showAltPhoto"
              :title="showAltPhoto ? '切换为今日实景摄影' : '切换为胜迹/复原风物'"
            >
              {{ showAltPhoto ? '📸 今日实景 ⇋' : '🏛️ 胜迹风物 ⇋' }}
            </button>
            <button
              class="photo-expand-pill"
              @click="$emit('view-photo', currentPhotoUrl, currentPhotoCaption)"
              title="全屏放大"
            >
              <Maximize2 :size="11" />
              <span>放大</span>
            </button>
          </div>
        </div>
        <div class="hero-photo-caption" v-if="currentPhotoCaption">
          {{ currentPhotoCaption }}
        </div>
      </div>

      <!-- 章节核心信息头 (序号印章 + 主副标题) -->
      <div class="panel-header-block">
        <div class="title-meta-row">
          <span class="chapter-seal-tag">{{ chapter.num }} / {{ totalChapters }}</span>
          <span class="theme-context-lbl">{{ currentThemeTitle }}</span>
        </div>
        <h2 class="main-title">{{ chapter.title }}</h2>
        <div class="sub-title">{{ chapter.subTitle }}</div>
      </div>

      <!-- 四段式分段导航标签 (概览 · 地质剖面 · 实景风物 · 空间地标) -->
      <div class="segmented-nav" role="tablist">
        <button
          class="seg-tab"
          :class="{ active: activeTab === 'overview' }"
          @click="activeTab = 'overview'"
          role="tab"
          :aria-selected="activeTab === 'overview'"
        >
          <BookOpen :size="13" />
          <span>史地概览</span>
        </button>
        <button
          v-if="chapter.diagramTitle"
          class="seg-tab"
          :class="{ active: activeTab === 'diagram' }"
          @click="activeTab = 'diagram'"
          role="tab"
          :aria-selected="activeTab === 'diagram'"
        >
          <Activity :size="13" />
          <span>地质剖面</span>
        </button>
        <button
          class="seg-tab"
          :class="{ active: activeTab === 'scenery' }"
          @click="activeTab = 'scenery'"
          role="tab"
          :aria-selected="activeTab === 'scenery'"
        >
          <Camera :size="13" />
          <span>实景风物</span>
        </button>
        <button
          class="seg-tab"
          :class="{ active: activeTab === 'pois' }"
          @click="activeTab = 'pois'"
          role="tab"
          :aria-selected="activeTab === 'pois'"
        >
          <MapPin :size="13" />
          <span>空间地标</span>
        </button>
      </div>

      <!-- 选项卡 1：史地概览 (逐句朗读高亮与印章指标) -->
      <div v-show="activeTab === 'overview'" class="tab-pane">
        <div class="desc-content">
          <p class="sentence-stream">
            <span
              v-for="(sent, sIdx) in sentences"
              :key="sIdx"
              class="sentence-span"
              :class="{ active: isPlaying && activeSentenceIndex === sIdx }"
            >
              {{ sent }}
            </span>
          </p>
        </div>

        <!-- 时代与核心指标印章卡片 -->
        <div class="badge-row">
          <div class="badge-card" v-if="chapter.timeBadge">
            <div class="badge-val">{{ chapter.timeBadge }}</div>
            <div class="badge-lbl">时代 · 地理特征</div>
          </div>
          <div class="badge-card highlight" v-if="chapter.highlight">
            <div class="badge-val">{{ chapter.highlight }}</div>
            <div class="badge-lbl">核心要点</div>
          </div>
        </div>
      </div>

      <!-- 选项卡 2：交互式地质剖面图解 (修复 { chapter.diagramTitle } 单括号 Bug) -->
      <div v-if="chapter.diagramTitle" v-show="activeTab === 'diagram'" class="tab-pane diagram-tab-pane">
        <div class="diagram-card glass-panel">
          <div class="diagram-card-title">
            <Activity :size="14" class="diag-icon" />
            <span>{{ chapter.diagramTitle }}</span>
          </div>

          <!-- 陕西南北地质大剖面 -->
          <svg
            v-if="chapter.diagramType === 'profile_shaanxi'"
            viewBox="0 0 340 100"
            class="interactive-svg"
          >
            <defs>
              <linearGradient id="loessGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.85" />
                <stop offset="100%" stop-color="#d97706" stop-opacity="0.95" />
              </linearGradient>
              <linearGradient id="qinlingGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.95" />
                <stop offset="100%" stop-color="#0369a1" stop-opacity="0.95" />
              </linearGradient>
            </defs>

            <path d="M 10 50 Q 50 48, 90 55 L 90 90 L 10 90 Z" fill="url(#loessGrad)" class="hotspot" @click="flyTo([8.71, 7.1, -22.19])" />
            <text x="25" y="45" font-size="8" fill="#fbbf24" font-weight="bold" class="svg-lbl" @click="flyTo([8.71, 7.1, -22.19])">陕北黄土高原 ↗</text>

            <path d="M 90 55 L 120 70 L 180 70 L 195 50 L 195 90 L 90 90 Z" fill="#166534" opacity="0.85" class="hotspot" @click="flyTo([3.97, 1.33, 17.31])" />
            <line x1="90" y1="40" x2="110" y2="85" stroke="#ef4444" stroke-width="1.2" stroke-dasharray="2 2" />
            <line x1="195" y1="30" x2="185" y2="85" stroke="#ef4444" stroke-width="1.2" stroke-dasharray="2 2" />
            <text x="120" y="66" font-size="8" fill="#86efac" font-weight="bold" class="svg-lbl" @click="flyTo([3.97, 1.33, 17.31])">关中地堑·渭河 ↗</text>

            <path d="M 195 50 L 225 15 L 260 55 L 260 90 L 195 90 Z" fill="url(#qinlingGrad)" class="hotspot" @click="flyTo([-4.84, 17.33, 22.75])" />
            <polygon points="225,15 218,25 232,25" fill="#ffffff" />
            <text x="206" y="11" font-size="8" fill="#e0f2fe" font-weight="bold" class="svg-lbl" @click="flyTo([-4.84, 17.33, 22.75])">太白山 3771m ↗</text>

            <path d="M 260 55 L 285 68 L 310 45 L 330 50 L 330 90 L 260 90 Z" fill="#047857" opacity="0.85" class="hotspot" @click="flyTo([-11.93, 1.94, 36.04])" />
            <text x="268" y="66" font-size="7.5" fill="#6ee7b7" class="svg-lbl" @click="flyTo([-11.93, 1.94, 36.04])">汉江 ↗</text>
            <text x="305" y="42" font-size="8" fill="#34d399" class="svg-lbl" @click="flyTo([3.02, 6.04, 47.39])">大巴山 ↗</text>

            <line x1="5" y1="90" x2="335" y2="90" stroke="#64748b" stroke-width="1.5" />
            <line x1="225" y1="0" x2="225" y2="90" stroke="#38bdf8" stroke-width="0.8" stroke-dasharray="3 2" />
            <text x="228" y="32" font-size="6.5" fill="#38bdf8">800mm降水分界</text>
          </svg>

          <!-- 秦岭气候水热屏障阻隔 -->
          <svg
            v-else-if="chapter.diagramType === 'profile_qinling'"
            viewBox="0 0 340 100"
            class="interactive-svg"
          >
            <path d="M 40 85 L 170 20 L 300 85 Z" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5" class="hotspot" @click="flyTo([-4.84, 17.33, 22.75])" />
            <polygon points="170,20 160,32 180,32" fill="#ffffff" />
            <text x="135" y="14" font-size="9" fill="#fff" font-weight="bold" class="svg-lbl" @click="flyTo([-4.84, 17.33, 22.75])">秦岭主脊屏障 3771m ↗</text>

            <path d="M 20 30 Q 80 40 125 55" stroke="#38bdf8" stroke-width="2.5" fill="none" class="hotspot" @click="flyTo([3.97, 1.33, 17.31])" />
            <text x="18" y="24" font-size="8" fill="#38bdf8" class="svg-lbl" @click="flyTo([3.97, 1.33, 17.31])">西伯利亚干冷风被阻隔 ⬇</text>

            <path d="M 320 65 Q 260 60 220 40" stroke="#10b981" stroke-width="2.5" fill="none" class="hotspot" @click="flyTo([-11.93, 1.94, 36.04])" />
            <text x="225" y="78" font-size="8" fill="#10b981" class="svg-lbl" @click="flyTo([-11.93, 1.94, 36.04])">暖湿气流迎风成雨 ⬆</text>
            <line x1="230" y1="45" x2="226" y2="52" stroke="#06b6d4" stroke-width="1.5" />
            <line x1="240" y1="48" x2="236" y2="55" stroke="#06b6d4" stroke-width="1.5" />
          </svg>

          <!-- 关中地堑断陷盆地与八水环绕图 -->
          <svg
            v-else-if="chapter.diagramType === 'profile_guanzhong'"
            viewBox="0 0 340 100"
            class="interactive-svg"
          >
            <path d="M 10 35 L 70 45 L 70 85 L 10 85 Z" fill="#334155" class="hotspot" @click="flyTo([3.0, 3.5, 6.0])" />
            <text x="18" y="30" font-size="7.5" fill="#94a3b8">北山断阶</text>
            <path d="M 70 45 L 85 75 L 245 75 L 260 30 L 260 85 L 70 85 Z" fill="#15803d" opacity="0.8" class="hotspot" @click="flyTo([3.97, 1.33, 17.31])" />
            <text x="135" y="70" font-size="8.5" fill="#86efac" font-weight="bold" class="svg-lbl" @click="flyTo([3.97, 1.33, 17.31])">关中地堑·八百里沃野 ↗</text>
            <path d="M 85 73 Q 160 70 245 73" stroke="#38bdf8" stroke-width="2.5" fill="none" class="hotspot" @click="flyTo([3.97, 1.33, 17.31])" />
            <line x1="70" y1="35" x2="85" y2="85" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="2 2" />
            <line x1="260" y1="20" x2="245" y2="85" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="2 2" />
            <path d="M 260 30 L 300 15 L 330 35 L 330 85 L 260 85 Z" fill="#0284c7" class="hotspot" @click="flyTo([-4.84, 17.33, 22.75])" />
            <text x="270" y="12" font-size="8" fill="#e0f2fe" font-weight="bold" class="svg-lbl" @click="flyTo([-4.84, 17.33, 22.75])">秦岭大断崖 ↗</text>
          </svg>

          <!-- 黄土塬梁峁侵蚀演变模式 -->
          <svg
            v-else-if="chapter.diagramType === 'profile_loess'"
            viewBox="0 0 340 100"
            class="interactive-svg"
          >
            <path d="M 10 35 L 80 35 L 80 85 L 10 85 Z" fill="#d97706" opacity="0.9" class="hotspot" @click="flyTo([8.71, 7.1, -22.19])" />
            <text x="28" y="30" font-size="8" fill="#fbbf24" font-weight="bold" class="svg-lbl" @click="flyTo([8.71, 7.1, -22.19])">① 黄土塬 ↗</text>
            <path d="M 95 45 Q 125 35 155 45 L 155 85 L 95 85 Z" fill="#b45309" class="hotspot" @click="flyTo([11.46, 4.2, -17.31])" />
            <text x="110" y="32" font-size="8" fill="#fde68a" font-weight="bold" class="svg-lbl" @click="flyTo([11.46, 4.2, -17.31])">② 黄土梁 ↗</text>
            <path d="M 170 55 Q 195 38 220 55 L 220 85 L 170 85 Z" fill="#92400e" class="hotspot" @click="flyTo([14.0, 3.5, -25.0])" />
            <text x="182" y="35" font-size="8" fill="#fed7aa" font-weight="bold" class="svg-lbl" @click="flyTo([14.0, 3.5, -25.0])">③ 黄土峁 ↗</text>
            <path d="M 235 60 L 255 60 L 255 52 L 280 52 L 280 44 L 305 44 L 330 44 L 330 85 L 235 85 Z" fill="#15803d" class="hotspot" @click="flyTo([13.78, 4.82, -44.8])" />
            <text x="250" y="36" font-size="8" fill="#86efac" font-weight="bold" class="svg-lbl" @click="flyTo([13.78, 4.82, -44.8])">④ 生态梯田 ↗</text>
          </svg>

          <!-- 汉江水系与南水北调中线生态走廊 -->
          <svg
            v-else-if="chapter.diagramType === 'profile_hanjiang'"
            viewBox="0 0 340 100"
            class="interactive-svg"
          >
            <rect x="20" y="45" width="80" height="40" fill="#047857" opacity="0.8" class="hotspot" @click="flyTo([-11.93, 1.94, 36.04])" />
            <text x="32" y="40" font-size="8" fill="#6ee7b7" font-weight="bold" class="svg-lbl" @click="flyTo([-11.93, 1.94, 36.04])">汉中盆地水源 ↗</text>
            <path d="M 20 65 Q 120 60 180 65 T 320 65" stroke="#06b6d4" stroke-width="4" fill="none" class="hotspot" @click="flyTo([7.09, 0.85, 41.71])" />
            <circle cx="180" cy="65" r="14" fill="#0284c7" opacity="0.85" class="hotspot" @click="flyTo([7.09, 0.85, 41.71])" />
            <text x="145" y="46" font-size="8" fill="#e0f2fe" font-weight="bold" class="svg-lbl" @click="flyTo([7.09, 0.85, 41.71])">安康瀛湖水源 ↗</text>
            <path d="M 280 65 L 320 30" stroke="#38bdf8" stroke-width="2.5" stroke-dasharray="3 2" fill="none" />
            <text x="250" y="25" font-size="8" fill="#38bdf8" font-weight="bold">送水京津冀 ➔</text>
          </svg>

          <!-- 古代长安八水水系与引渠复原示意 -->
          <svg
            v-else-if="chapter.diagramType === 'profile_rivers'"
            viewBox="0 0 340 100"
            class="interactive-svg"
          >
            <rect x="140" y="45" width="60" height="40" fill="#1e293b" stroke="#f59e0b" stroke-width="1.5" class="hotspot" @click="flyTo([6.24, 1.32, 16.98])" />
            <text x="148" y="68" font-size="8.5" fill="#fde68a" font-weight="bold" class="svg-lbl" @click="flyTo([6.24, 1.32, 16.98])">长安都城 ↗</text>
            <path d="M 20 28 Q 160 22 320 28" stroke="#06b6d4" stroke-width="3" fill="none" class="hotspot" @click="flyTo([3.97, 1.33, 17.31])" />
            <text x="30" y="22" font-size="7.5" fill="#06b6d4">渭河清流</text>
            <path d="M 220 5 Q 240 18 250 27" stroke="#eab308" stroke-width="2.5" fill="none" class="hotspot" @click="flyTo([6.5, 4.0, 15.2])" />
            <text x="210" y="14" font-size="7.5" fill="#eab308">泾河浊流</text>
            <circle cx="250" cy="27" r="5" fill="#ef4444" class="hotspot" @click="flyTo([6.5, 4.0, 15.2])" />
            <text x="258" y="26" font-size="8" fill="#fca5a5" font-weight="bold" class="svg-lbl" @click="flyTo([6.5, 4.0, 15.2])">泾渭分明 ↗</text>
            <path d="M 80 85 L 140 65" stroke="#38bdf8" stroke-width="1.5" fill="none" />
            <path d="M 240 85 L 200 65" stroke="#38bdf8" stroke-width="1.5" fill="none" />
            <text x="75" y="80" font-size="6.5" fill="#94a3b8">沣涝西来</text>
            <text x="215" y="80" font-size="6.5" fill="#94a3b8">浐灞东流</text>
          </svg>

          <div class="card-caption">点选上方地质单元标签，镜头自动飞越到对应真实地貌</div>
        </div>
      </div>

      <!-- 选项卡 3：实景风物摄影 (大图全景与摄影志) -->
      <div v-show="activeTab === 'scenery'" class="tab-pane">
        <div class="scenery-feature-card glass-panel">
          <div class="feature-img-box" @click="$emit('view-photo', currentPhotoUrl, currentPhotoCaption)">
            <img :src="currentPhotoUrl" :alt="chapter.title" class="feature-img" />
            <span class="preview-tag">点击开启画廊</span>
          </div>
          <div class="feature-meta">
            <span class="meta-title">{{ chapter.title }} · 摄影志</span>
            <p class="meta-desc">{{ currentPhotoCaption }}</p>
          </div>
        </div>
      </div>

      <!-- 选项卡 4：空间地标信标 (本章关联 POI 一键直达) -->
      <div v-show="activeTab === 'pois'" class="tab-pane">
        <div class="poi-quick-list">
          <div
            v-for="poi in relatedPois"
            :key="poi.id"
            class="poi-row-card glass-panel"
            @click="flyToPoi(poi)"
          >
            <div class="poi-row-left">
              <span class="poi-dot-indicator" :class="poi.type"></span>
              <div class="poi-text-col">
                <span class="poi-name-txt">{{ poi.name }}</span>
                <span class="poi-badge-txt">{{ poi.badge }}</span>
              </div>
            </div>
            <span class="poi-fly-arrow">飞向 ➔</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部固定操作栏 (永不被内容滚动遮挡) -->
    <div v-show="!isCollapsed || isMobile" class="fixed-action-footer">
      <button class="footer-btn listen-btn" :class="{ playing: isPlaying }" @click="$emit('listen-current')">
        <Volume2 v-if="!isPlaying" :size="14" />
        <VolumeX v-else :size="14" />
        <span>{{ isPlaying ? '暂停朗读' : '🎧 听这段' }}</span>
      </button>

      <button class="footer-btn focus-btn" @click="$emit('focus-feature')">
        <Crosshair :size="14" />
        <span>聚焦视点</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  BookOpen,
  Activity,
  Camera,
  MapPin,
  Volume2,
  VolumeX,
  Crosshair
} from 'lucide-vue-next';
import { POI_LIST } from '../data/shaanxiData.js';

const props = defineProps({
  chapter: { type: Object, required: true },
  totalChapters: { type: Number, default: 6 },
  currentThemeTitle: { type: String, default: "自然地理" },
  currentThemeId: { type: String, default: "geo" },
  themes: { type: Array, default: () => [] },
  isPlaying: { type: Boolean, default: false }
});

const emit = defineEmits([
  'listen-current',
  'focus-feature',
  'fly-strata',
  'view-photo',
  'change-theme',
  'collapse-change'
]);

const isCollapsed = ref(false);
const activeTab = ref('overview');
const activeSentenceIndex = ref(0);
const showAltPhoto = ref(false);
let timer = null;

// 移动端响应式侦测与 Bottom Sheet 状态 ('peek' | 'half' | 'full')
const isMobile = ref(false);
const mobileSheetState = ref('half');

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768;
};

const cycleMobileSheetState = () => {
  if (mobileSheetState.value === 'peek') mobileSheetState.value = 'half';
  else if (mobileSheetState.value === 'half') mobileSheetState.value = 'full';
  else mobileSheetState.value = 'peek';
};

watch(isCollapsed, (val) => {
  emit('collapse-change', val);
});

const sentences = computed(() => {
  if (!props.chapter || !props.chapter.desc) return [];
  return props.chapter.desc.split(/(?<=[。！？；])/).filter(s => s.trim().length > 0);
});

const currentPhotoUrl = computed(() => {
  if (showAltPhoto.value && props.chapter?.altPhotoUrl) {
    return props.chapter.altPhotoUrl;
  }
  return props.chapter?.photoUrl || '';
});

const currentPhotoCaption = computed(() => {
  if (showAltPhoto.value && props.chapter?.altPhotoCaption) {
    return props.chapter.altPhotoCaption;
  }
  return props.chapter?.photoCaption || '';
});

// 本章节关联的地标点
const relatedPois = computed(() => {
  return POI_LIST.slice(0, 5);
});

const flyTo = (pos) => {
  emit('fly-strata', pos);
};

const flyToPoi = (poi) => {
  emit('fly-strata', [poi.pos[0] + 4, poi.pos[1] + 14, poi.pos[2] + 16], [poi.pos[0], poi.pos[1], poi.pos[2]]);
};

watch(() => props.chapter?.id, () => {
  showAltPhoto.value = false;
  activeTab.value = 'overview';
});

watch(() => props.isPlaying, (playing) => {
  if (playing) {
    activeSentenceIndex.value = 0;
    if (timer) clearInterval(timer);
    const intervalMs = Math.max(2500, Math.floor(18000 / (sentences.value.length || 1)));
    timer = setInterval(() => {
      if (activeSentenceIndex.value < sentences.value.length - 1) {
        activeSentenceIndex.value++;
      } else {
        clearInterval(timer);
      }
    }, intervalMs);
  } else {
    if (timer) clearInterval(timer);
    activeSentenceIndex.value = 0;
  }
}, { immediate: true });

onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile);
  if (timer) clearInterval(timer);
});
</script>

<style scoped>
.left-info-panel {
  position: absolute;
  top: 76px;
  left: 20px;
  width: 370px;
  /* 严格限制最大高度，留出至少 104px 底部空间，坚决不遮挡底部时间轴 */
  max-height: calc(100vh - 180px);
  bottom: 104px;
  z-index: 25;
  display: flex;
  flex-direction: column;
  background: var(--bg-glass-heavy, rgba(11, 26, 43, 0.94));
  border: 1px solid var(--border-light, rgba(56, 189, 248, 0.28));
  border-radius: var(--radius-lg, 16px);
  box-shadow: 0 20px 48px -8px rgba(0, 0, 0, 0.8), 0 0 24px rgba(2, 132, 199, 0.15);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: transform var(--motion-slow, 0.35s), max-height 0.3s ease;
  overflow: hidden;
}

.left-info-panel.collapsed {
  transform: translateX(calc(-100% - 24px));
}

/* 侧栏折叠拉手 */
.panel-collapse-toggle {
  position: absolute;
  top: 16px;
  right: -28px;
  width: 28px;
  height: 52px;
  background: rgba(11, 26, 43, 0.96);
  border: 1px solid rgba(56, 189, 248, 0.35);
  border-left: none;
  border-radius: 0 10px 10px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: var(--brand-cyan, #38bdf8);
  cursor: pointer;
  box-shadow: 4px 0 16px rgba(0, 0, 0, 0.5);
  transition: all 0.2s;
  z-index: 20;
}

.panel-collapse-toggle:hover {
  background: #0284c7;
  color: #fff;
  width: 32px;
  right: -32px;
}

.toggle-v-text {
  writing-mode: vertical-rl;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

/* 滚动主容器 */
.panel-content-wrap {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-bottom: 58px; /* 留出底部操作栏高度 */
}

/* 📸 16:9 比例实景横幅 */
.hero-photo-banner {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  max-height: 190px;
  border-radius: var(--radius-md, 10px);
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.12);
  cursor: pointer;
  background: #060d17;
  flex-shrink: 0;
}

.hero-photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.hero-photo-banner:hover .hero-photo-img {
  transform: scale(1.04);
}

.hero-photo-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(11, 26, 43, 0.2) 0%,
    rgba(11, 26, 43, 0.4) 50%,
    rgba(11, 26, 43, 0.95) 100%
  );
  pointer-events: none;
}

.hero-photo-top-bar {
  position: absolute;
  top: 8px;
  left: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  z-index: 2;
}

.photo-live-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(6, 13, 23, 0.85);
  border: 1px solid rgba(56, 189, 248, 0.35);
  color: var(--brand-cyan, #38bdf8);
  font-size: var(--text-xs, 11px);
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
  backdrop-filter: blur(8px);
}

.pulse-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 6px #22c55e;
}

.banner-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.photo-toggle-pill {
  display: inline-flex;
  align-items: center;
  background: rgba(11, 26, 43, 0.88);
  border: 1px solid rgba(245, 185, 66, 0.45);
  color: #fde68a;
  font-size: 10.5px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}

.photo-toggle-pill:hover {
  background: rgba(245, 185, 66, 0.25);
  border-color: var(--accent-gold, #f5b942);
  color: #fff;
}

.photo-expand-pill {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  background: rgba(6, 13, 23, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #e2e8f0;
  font-size: 10.5px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}

.photo-expand-pill:hover {
  border-color: var(--brand-cyan, #38bdf8);
  color: var(--brand-cyan, #38bdf8);
}

.hero-photo-caption {
  position: absolute;
  bottom: 8px;
  left: 10px;
  right: 10px;
  font-size: var(--text-xs, 11px);
  color: #f1f5f9;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  z-index: 2;
}

/* 章节头部信息 */
.panel-header-block {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.title-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chapter-seal-tag {
  font-family: var(--font-mono, monospace);
  font-size: var(--text-xs, 11px);
  font-weight: 800;
  color: #fff;
  background: rgba(220, 38, 38, 0.35);
  border: 1px solid rgba(220, 38, 38, 0.55);
  padding: 2px 6px;
  border-radius: 4px;
}

.theme-context-lbl {
  font-size: var(--text-xs, 11px);
  color: var(--text-muted, #94a3b8);
  font-weight: 600;
}

.main-title {
  font-family: var(--font-serif);
  font-size: var(--text-xl, 22px);
  font-weight: 800;
  color: #fff;
  letter-spacing: 0.02em;
}

.sub-title {
  font-size: var(--text-xs, 11.5px);
  color: var(--text-muted, #94a3b8);
}

/* 分段标签导航 */
.segmented-nav {
  display: flex;
  align-items: center;
  background: rgba(6, 13, 23, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-sm, 8px);
  padding: 3px;
  gap: 2px;
}

.seg-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 0;
  border-radius: 6px;
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-muted, #94a3b8);
  font-size: var(--text-xs, 11.5px);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.seg-tab:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
}

.seg-tab.active {
  background: rgba(56, 189, 248, 0.2);
  border-color: rgba(56, 189, 248, 0.4);
  color: var(--brand-cyan, #38bdf8);
}

/* 选项卡内容区 */
.tab-pane {
  display: flex;
  flex-direction: column;
  gap: 12px;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.desc-content {
  line-height: 1.65;
  font-size: var(--text-base, 13.5px);
  color: var(--text-sub, #cbd5e1);
}

.sentence-span {
  transition: all 0.25s;
  padding: 1px 2px;
  border-radius: 3px;
}

.sentence-span.active {
  background: rgba(245, 185, 66, 0.25);
  color: #fff;
  font-weight: 600;
  text-shadow: 0 0 8px rgba(245, 185, 66, 0.4);
}

/* 印章指标卡片 */
.badge-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.badge-card {
  padding: 8px 10px;
  border-radius: var(--radius-sm, 6px);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.badge-card.highlight {
  border-color: rgba(245, 185, 66, 0.35);
  background: rgba(245, 185, 66, 0.08);
}

.badge-val {
  font-size: var(--text-sm, 12px);
  font-weight: 700;
  color: #fff;
}

.badge-lbl {
  font-size: 10px;
  color: var(--text-dim, #64748b);
  margin-top: 2px;
}

/* 地质剖面卡片 */
.diagram-card {
  padding: 10px;
  background: rgba(6, 13, 23, 0.5);
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: var(--radius-md, 10px);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.diagram-card-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--text-xs, 11.5px);
  font-weight: 700;
  color: #fff;
}

.diag-icon {
  color: var(--brand-cyan, #38bdf8);
}

.interactive-svg {
  width: 100%;
  border-radius: 6px;
  background: rgba(11, 26, 43, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.hotspot {
  cursor: pointer;
  transition: opacity 0.2s;
}

.hotspot:hover {
  opacity: 1 !important;
}

.svg-lbl {
  cursor: pointer;
}

.card-caption {
  font-size: 10px;
  color: var(--text-muted, #94a3b8);
  text-align: center;
}

/* 实景风物卡片 */
.scenery-feature-card {
  padding: 10px;
  border-radius: var(--radius-md, 10px);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.feature-img-box {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
}

.feature-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-tag {
  position: absolute;
  bottom: 6px;
  right: 6px;
  font-size: 10px;
  padding: 2px 6px;
  background: rgba(0, 0, 0, 0.7);
  color: #fff;
  border-radius: 4px;
}

.feature-meta {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.meta-title {
  font-size: var(--text-sm, 12px);
  font-weight: 700;
  color: #fff;
}

.meta-desc {
  font-size: var(--text-xs, 11px);
  color: var(--text-muted, #94a3b8);
  line-height: 1.5;
}

/* 空间地标列表 */
.poi-quick-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.poi-row-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: var(--radius-sm, 6px);
  cursor: pointer;
  transition: all 0.15s;
}

.poi-row-card:hover {
  background: rgba(56, 189, 248, 0.12);
  border-color: rgba(56, 189, 248, 0.35);
}

.poi-row-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.poi-dot-indicator {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--brand-cyan, #38bdf8);
}

.poi-dot-indicator.mountain { background: #10b981; }
.poi-dot-indicator.nature { background: #06b6d4; }
.poi-dot-indicator.relic { background: #f59e0b; }

.poi-text-col {
  display: flex;
  flex-direction: column;
}

.poi-name-txt {
  font-size: var(--text-sm, 12px);
  font-weight: 600;
  color: #fff;
}

.poi-badge-txt {
  font-size: 10px;
  color: var(--text-dim, #64748b);
}

.poi-fly-arrow {
  font-size: var(--text-xs, 11px);
  color: var(--brand-cyan, #38bdf8);
}

/* 固定底部操作栏 (Fixed Footer) */
.fixed-action-footer {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 52px;
  background: rgba(6, 13, 23, 0.94);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  padding: 0 12px;
  gap: 8px;
  z-index: 10;
}

.footer-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 0;
  border-radius: var(--radius-sm, 6px);
  font-size: var(--text-sm, 12px);
  font-weight: 700;
  cursor: pointer;
  transition: all 0.15s;
}

.listen-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #f1f5f9;
}

.listen-btn:hover,
.listen-btn.playing {
  background: rgba(245, 185, 66, 0.2);
  border-color: var(--accent-gold, #f5b942);
  color: #fde68a;
}

.focus-btn {
  background: rgba(56, 189, 248, 0.2);
  border: 1px solid rgba(56, 189, 248, 0.45);
  color: #fff;
}

.focus-btn:hover {
  background: rgba(56, 189, 248, 0.35);
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.3);
}

/* 移动端底部抽屉 (Bottom Sheet) 样式 */
@media (max-width: 768px) {
  .left-info-panel.mobile-sheet {
    top: auto !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    width: 100% !important;
    border-radius: 20px 20px 0 0 !important;
    border-left: none;
    border-right: none;
    border-bottom: none;
    transform: none !important;
  }

  .mobile-sheet.sheet-peek {
    max-height: 160px;
  }

  .mobile-sheet.sheet-half {
    max-height: 48vh;
  }

  .mobile-sheet.sheet-full {
    max-height: 85vh;
  }

  .mobile-drag-handle-bar {
    width: 100%;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: grab;
    flex-shrink: 0;
    padding-top: 4px;
  }

  .drag-pill {
    width: 36px;
    height: 4px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 2px;
  }
}
</style>
