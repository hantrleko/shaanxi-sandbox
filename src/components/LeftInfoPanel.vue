<template>
  <aside class="left-info-panel glass-panel" :class="{ collapsed: isCollapsed }">
    <!-- 侧栏收起/展开微动滑钮 (支持全屏纯净模式) -->
    <button
      class="panel-collapse-toggle"
      @click="isCollapsed = !isCollapsed"
      :title="isCollapsed ? '展开左侧面板 (L)' : '收起面板以纯净浏览 3D 沙盒 (L)'"
    >
      <svg class="toggle-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline :points="isCollapsed ? '9 18 15 12 9 6' : '15 18 9 12 15 6'"></polyline>
      </svg>
      <span class="toggle-v-text" v-if="isCollapsed">展开图文</span>
    </button>

    <!-- 📸 章节置顶真实地理实景大图 (核心主焦点，一眼感知真实三秦风貌) -->
    <div
      v-if="chapter.photoUrl"
      class="hero-photo-banner"
      @click="$emit('view-photo', chapter.photoUrl, chapter.photoCaption)"
      title="点击查看高清实景大图"
    >
      <img :src="chapter.photoUrl" :alt="chapter.title" class="hero-photo-img" />
      <div class="hero-photo-gradient"></div>
      <div class="hero-photo-top-bar">
        <span class="photo-live-badge">
          <span class="pulse-dot"></span>
          真实风貌实景
        </span>
        <span class="photo-expand-pill">
          <svg class="pill-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="15 3 21 3 21 9"></polyline>
            <polyline points="9 21 3 21 3 15"></polyline>
            <line x1="21" y1="3" x2="14" y2="10"></line>
            <line x1="3" y1="21" x2="10" y2="14"></line>
          </svg>
          放大全屏
        </span>
      </div>
      <div class="hero-photo-caption" v-if="chapter.photoCaption">
        {{ chapter.photoCaption }}
      </div>
    </div>

    <div class="panel-header">
      <div class="chapter-meta">
        <span class="chapter-num">{{ chapter.num }} / {{ totalChapters }}</span>
        <span class="chapter-theme">{{ currentThemeTitle }}</span>
      </div>
      <button class="listen-btn glass-btn" @click="$emit('listen-current')">
        <span>{{ isPlaying ? '🔊 朗读中...' : '🎧 听这段' }}</span>
      </button>
    </div>

    <!-- 标题与副标题 -->
    <h2 class="main-title">{{ chapter.title }}</h2>
    <div class="sub-title">{{ chapter.subTitle }}</div>

    <!-- 详述文案 (逐句朗读高亮) -->
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

    <!-- 核心特征指标 -->
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

    <!-- 专业地质剖面折叠交互抽屉 (当章节有剖面图解时呈现，不遮挡实景照片) -->
    <div class="diagram-drawer" v-if="chapter.diagramTitle">
      <button
        class="diagram-toggle-bar"
        @click="isDiagramOpen = !isDiagramOpen"
        :class="{ active: isDiagramOpen }"
      >
        <span class="diagram-bar-title">📐 { chapter.diagramTitle }</span>
        <span class="diagram-bar-tag">{{ isDiagramOpen ? '收起剖面 ▲' : '展开地质剖面 ▼' }}</span>
      </button>
      <div class="diagram-body" v-show="isDiagramOpen">

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

          <div class="card-caption">{{ chapter.diagramTitle }} (点选地貌飞向实景)</div>

      </div>
    </div>

    <!-- 底部飞行聚焦按钮 -->
    <div class="action-footer">
      <button class="action-btn" @click="$emit('focus-feature')">
        <span>🔍 飞向当前章节核心视点</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const isCollapsed = ref(false);

const props = defineProps({
  chapter: { type: Object, required: true },
  totalChapters: { type: Number, default: 6 },
  currentThemeTitle: { type: String, default: "自然地理" },
  isPlaying: { type: Boolean, default: false }
});

const emit = defineEmits(['listen-current', 'focus-feature', 'fly-strata', 'view-photo']);

const isDiagramOpen = ref(false);
const activeSentenceIndex = ref(0);
let timer = null;

const sentences = computed(() => {
  if (!props.chapter || !props.chapter.desc) return [];
  return props.chapter.desc.split(/(?<=[。！？；])/).filter(s => s.trim().length > 0);
});

const flyTo = (pos) => {
  emit('fly-strata', pos);
};

// 章节切换时默认收起地质剖面，保持卡片紧凑和实景图优先
watch(() => props.chapter?.id, () => {
  isDiagramOpen.value = false;
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
</script>

<style scoped>
.left-info-panel {
  position: absolute;
  top: 76px;
  left: 20px;
  width: 360px;
  max-height: calc(100vh - 120px);
  padding: 16px;
  z-index: 15;
  display: flex;
  flex-direction: column;
  gap: 10px;
  border-radius: 14px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(56, 189, 248, 0.25);
  overflow-y: auto;
  scrollbar-width: none;
}

.left-info-panel::-webkit-scrollbar {
  display: none;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chapter-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  color: #38bdf8;
}

.chapter-num {
  background: rgba(56, 189, 248, 0.15);
  padding: 2px 7px;
  border-radius: 4px;
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.listen-btn {
  font-size: 11px;
  padding: 3px 8px;
}

.main-title {
  font-family: var(--font-serif);
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  line-height: 1.2;
  margin: 0;
}

.sub-title {
  font-size: 12px;
  color: #94a3b8;
  margin-top: -4px;
}

.desc-content {
  font-size: 12.5px;
  line-height: 1.6;
  color: #cbd5e1;
}

.sentence-stream {
  margin: 0;
}

.sentence-span {
  transition: all 0.3s;
}

.sentence-span.active {
  color: #38bdf8;
  font-weight: 700;
  text-shadow: 0 0 10px rgba(56, 189, 248, 0.6);
  background: rgba(56, 189, 248, 0.15);
  padding: 1px 3px;
  border-radius: 3px;
}

.badge-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.badge-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 6px;
  padding: 6px 8px;
}

.badge-card.highlight {
  background: rgba(56, 189, 248, 0.08);
  border-color: rgba(56, 189, 248, 0.25);
}

.badge-val {
  font-size: 12px;
  font-weight: 700;
  color: #fff;
}

.badge-card.highlight .badge-val {
  color: #38bdf8;
}

.badge-lbl {
  font-size: 9.5px;
  color: #64748b;
  margin-top: 1px;
}

/* 📸 章节置顶高清实景摄影大图 */
.hero-photo-banner {
  position: relative;
  width: 100%;
  height: 180px;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(56, 189, 248, 0.35);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  flex-shrink: 0;
  margin-bottom: 2px;
}

.hero-photo-banner:hover {
  border-color: #38bdf8;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.8), 0 0 20px rgba(56, 189, 248, 0.35);
  transform: translateY(-1px);
}

.hero-photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.4s ease;
}

.hero-photo-banner:hover .hero-photo-img {
  transform: scale(1.04);
}

.hero-photo-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(10, 16, 28, 0.45) 0%,
    transparent 35%,
    rgba(10, 16, 28, 0.82) 80%,
    rgba(10, 16, 28, 0.98) 100%
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
  pointer-events: none;
}

.photo-live-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: rgba(15, 23, 42, 0.88);
  border: 1px solid rgba(56, 189, 248, 0.4);
  color: #38bdf8;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  backdrop-filter: blur(8px);
}

.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 8px #22c55e;
  animation: pulseDot 1.5s infinite;
}

@keyframes pulseDot {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.85); }
}

.photo-expand-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(15, 23, 42, 0.88);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #e2e8f0;
  font-size: 10px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
  backdrop-filter: blur(8px);
  transition: all 0.2s;
}

.hero-photo-banner:hover .photo-expand-pill {
  border-color: #38bdf8;
  color: #38bdf8;
  background: rgba(15, 23, 42, 0.98);
}

.pill-svg {
  width: 11px;
  height: 11px;
}

.hero-photo-caption {
  position: absolute;
  bottom: 8px;
  left: 10px;
  right: 10px;
  font-size: 11px;
  color: #f1f5f9;
  font-weight: 600;
  line-height: 1.4;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.9);
  pointer-events: none;
}

/* 📐 专业地质剖面折叠抽屉 */
.diagram-drawer {
  background: rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  overflow: hidden;
  margin-top: 4px;
}

.diagram-toggle-bar {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.03);
  border: none;
  padding: 8px 10px;
  color: #cbd5e1;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.diagram-toggle-bar:hover {
  background: rgba(56, 189, 248, 0.12);
  color: #38bdf8;
}

.diagram-toggle-bar.active {
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  border-bottom: 1px solid rgba(56, 189, 248, 0.2);
}

.diagram-bar-title {
  display: flex;
  align-items: center;
  gap: 4px;
}

.diagram-bar-tag {
  font-size: 10px;
  color: #94a3b8;
}

.diagram-body {
  padding: 8px;
}

.interactive-svg {
  width: 100%;
  height: auto;
  border-radius: 4px;
  display: block;
}

.hotspot {
  cursor: pointer;
  transition: all 0.2s;
}

.hotspot:hover {
  filter: brightness(1.25);
  stroke: #ffffff;
  stroke-width: 2px;
}

.svg-lbl {
  cursor: pointer;
  user-select: none;
  transition: all 0.2s;
}

.svg-lbl:hover {
  fill: #ffffff;
  font-weight: 900;
}


.card-caption {
  font-size: 10px;
  color: #94a3b8;
  padding: 4px 2px 0 2px;
  text-align: center;
}

.action-footer {
  margin-top: 2px;
}

.action-btn {
  width: 100%;
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(14, 165, 233, 0.3));
  border: 1px solid #38bdf8;
  color: #38bdf8;
  padding: 6px;
  border-radius: 6px;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(56, 189, 248, 0.4);
  color: #fff;
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.4);
}
.left-info-panel {
  transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;
}

.left-info-panel.collapsed {
  transform: translateX(calc(-100% - 20px)) !important;
}

.panel-collapse-toggle {
  position: absolute;
  top: 14px;
  right: -28px;
  width: 28px;
  height: 54px;
  background: rgba(10, 15, 25, 0.94);
  border: 1px solid rgba(56, 189, 248, 0.35);
  border-left: none;
  border-radius: 0 10px 10px 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  color: #38bdf8;
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

.toggle-svg {
  width: 14px;
  height: 14px;
}

.toggle-v-text {
  writing-mode: vertical-rl;
  font-size: 9px;
  letter-spacing: 0.1em;
  font-weight: 700;
}
</style>
