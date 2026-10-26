<template>
  <aside class="left-info-panel glass-panel">
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

    <!-- 关键指标与年代徽章 -->
    <div class="badge-row">
      <div class="badge-card" v-if="chapter.timeBadge">
        <div class="badge-val">{{ chapter.timeBadge }}</div>
        <div class="badge-lbl">时代 · 特征</div>
      </div>
      <div class="badge-card highlight" v-if="chapter.highlight">
        <div class="badge-val">{{ chapter.highlight }}</div>
        <div class="badge-lbl">地理核心要点</div>
      </div>
    </div>

    <!-- 详述文案 (支持逐句高亮白字) -->
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

    <!-- 图解与实景联动展示卡片 (专业交互式 SVG 地质地貌图) -->
    <div class="visual-cards">
      <!-- 剖面示意图 (矢量 SVG 绘制) -->
      <div class="card-item" v-if="chapter.diagramTitle">
        <div class="card-tag">图解 · 专业地质地貌剖面 (点击节点飞往实景)</div>
        <div class="diagram-preview">
          <!-- 陕西南北地质大剖面 SVG -->
          <svg
            v-if="chapter.diagramType === 'profile_shaanxi'"
            viewBox="0 0 340 100"
            class="interactive-svg"
          >
            <!-- 渐变定义 -->
            <defs>
              <linearGradient id="loessGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.8" />
                <stop offset="100%" stop-color="#d97706" stop-opacity="0.9" />
              </linearGradient>
              <linearGradient id="qinlingGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.9" />
                <stop offset="100%" stop-color="#0369a1" stop-opacity="0.9" />
              </linearGradient>
            </defs>

            <!-- 北侧陕北高原 -->
            <path d="M 10 50 Q 50 48, 90 55 L 90 90 L 10 90 Z" fill="url(#loessGrad)" />
            <text x="35" y="45" font-size="8" fill="#fbbf24" font-weight="bold">陕北黄土高原</text>

            <!-- 关中地堑沉降断陷 -->
            <path d="M 90 55 L 120 70 L 180 70 L 195 50 L 195 90 L 90 90 Z" fill="#166534" opacity="0.8" />
            <!-- 断层线 -->
            <line x1="90" y1="40" x2="110" y2="85" stroke="#ef4444" stroke-width="1.2" stroke-dasharray="2 2" />
            <line x1="195" y1="30" x2="185" y2="85" stroke="#ef4444" stroke-width="1.2" stroke-dasharray="2 2" />
            <text x="125" y="66" font-size="8" fill="#86efac" font-weight="bold">关中地堑·渭河</text>

            <!-- 秦岭太白山断块高耸 -->
            <path d="M 195 50 L 225 15 L 260 55 L 260 90 L 195 90 Z" fill="url(#qinlingGrad)" />
            <!-- 太白山主峰雪冠 -->
            <polygon points="225,15 218,25 232,25" fill="#ffffff" />
            <text x="210" y="11" font-size="8" fill="#e0f2fe" font-weight="bold">太白山 3771m</text>

            <!-- 汉中盆地与大巴山 -->
            <path d="M 260 55 L 285 68 L 310 45 L 330 50 L 330 90 L 260 90 Z" fill="#047857" opacity="0.8" />
            <text x="270" y="65" font-size="7" fill="#6ee7b7">汉水</text>
            <text x="305" y="40" font-size="8" fill="#34d399">大巴山</text>

            <!-- 基底岩层线 -->
            <line x1="5" y1="90" x2="335" y2="90" stroke="#64748b" stroke-width="1.5" />
            <!-- 800mm 分界线标柱 -->
            <line x1="225" y1="0" x2="225" y2="90" stroke="#38bdf8" stroke-width="0.8" stroke-dasharray="3 2" />
            <text x="228" y="35" font-size="6.5" fill="#38bdf8">800mm降水分界</text>
          </svg>

          <!-- 秦岭气候屏障阻隔 SVG -->
          <svg
            v-else-if="chapter.diagramType === 'profile_qinling'"
            viewBox="0 0 340 100"
            class="interactive-svg"
          >
            <!-- 秦岭大山脊 -->
            <path d="M 40 85 L 170 20 L 300 85 Z" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5" />
            <polygon points="170,20 160,32 180,32" fill="#ffffff" />
            <text x="145" y="14" font-size="9" fill="#fff" font-weight="bold">秦岭主脊屏障</text>

            <!-- 北侧西伯利亚冷空气受阻 -->
            <path d="M 20 30 Q 80 40 120 55" stroke="#38bdf8" stroke-width="2.5" fill="none" marker-end="url(#arrowBlue)" />
            <text x="20" y="24" font-size="8" fill="#38bdf8">西伯利亚干冷风被阻挡 ⬇</text>

            <!-- 南侧东南暖湿气流抬升降雨 -->
            <path d="M 320 65 Q 260 60 220 40" stroke="#10b981" stroke-width="2.5" fill="none" />
            <text x="235" y="78" font-size="8" fill="#10b981">暖湿气流迎风成雨 ⬆</text>
            <!-- 雨滴 -->
            <line x1="230" y1="45" x2="226" y2="52" stroke="#06b6d4" stroke-width="1.5" />
            <line x1="240" y1="48" x2="236" y2="55" stroke="#06b6d4" stroke-width="1.5" />
          </svg>

          <!-- 默认图解 -->
          <div v-else class="diagram-generic">
            <div class="generic-banner">陕西地理空间格局示意图</div>
          </div>

          <div class="card-caption">{{ chapter.diagramTitle }}</div>
        </div>
      </div>

      <!-- 实景卫星/历史图片 -->
      <div class="card-item" v-if="chapter.photoUrl">
        <div class="card-tag">实景 · 影像图</div>
        <div class="photo-preview">
          <img :src="chapter.photoUrl" :alt="chapter.title" class="preview-img" />
          <div class="card-caption">{{ chapter.photoCaption }}</div>
        </div>
      </div>
    </div>

    <!-- 互动指令：在沙盘上看一看 -->
    <div class="action-footer">
      <div class="action-hint">在沙盘上看一看：点一下，镜头跟进探索</div>
      <button class="action-btn" @click="$emit('focus-feature')">
        <span>🔍 飞向当前章节特征区域</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  chapter: { type: Object, required: true },
  totalChapters: { type: Number, default: 6 },
  currentThemeTitle: { type: String, default: "自然地理" },
  isPlaying: { type: Boolean, default: false }
});

defineEmits(['listen-current', 'focus-feature']);

const activeSentenceIndex = ref(0);
let timer = null;

// 拆分句子用于逐句高亮白字
const sentences = computed(() => {
  if (!props.chapter || !props.chapter.desc) return [];
  return props.chapter.desc.split(/(?<=[。！？；])/).filter(s => s.trim().length > 0);
});

// 模拟随着播放进度逐句推进高亮
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
});
</script>

<style scoped>
.left-info-panel {
  position: absolute;
  top: 80px;
  left: 20px;
  width: 390px;
  max-height: calc(100vh - 185px);
  overflow-y: auto;
  padding: 20px;
  z-index: 15;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chapter-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #38bdf8;
}

.chapter-num {
  background: rgba(56, 189, 248, 0.15);
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.listen-btn {
  font-size: 11px;
  padding: 4px 10px;
}

.main-title {
  font-family: var(--font-serif);
  font-size: 26px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.02em;
  line-height: 1.2;
}

.sub-title {
  font-size: 13px;
  color: #94a3b8;
  margin-top: -6px;
}

.badge-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.badge-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 10px;
}

.badge-card.highlight {
  border-color: rgba(56, 189, 248, 0.3);
  background: rgba(56, 189, 248, 0.06);
}

.badge-val {
  font-size: 13px;
  font-weight: 700;
  color: #f1f5f9;
  line-height: 1.3;
}

.badge-card.highlight .badge-val {
  color: #38bdf8;
}

.badge-lbl {
  font-size: 10px;
  color: #64748b;
  margin-top: 4px;
}

.desc-content {
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 12px;
}

.sentence-stream {
  font-size: 13px;
  line-height: 1.8;
  color: #94a3b8;
  text-align: justify;
}

.sentence-span {
  transition: all 0.3s;
}

.sentence-span.active {
  color: #ffffff;
  font-weight: 600;
  background: rgba(56, 189, 248, 0.15);
  padding: 2px 4px;
  border-radius: 4px;
  box-shadow: 0 0 8px rgba(56, 189, 248, 0.3);
}

.visual-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-item {
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 10px;
}

.card-tag {
  font-size: 10px;
  font-weight: 600;
  color: #38bdf8;
  margin-bottom: 6px;
}

.interactive-svg {
  width: 100%;
  height: 95px;
  background: linear-gradient(180deg, #090e17 0%, #030712 100%);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
}

.diagram-generic {
  height: 70px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #64748b;
}

.photo-preview {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preview-img {
  width: 100%;
  height: 115px;
  object-fit: cover;
  border-radius: 6px;
}

.card-caption {
  font-size: 11px;
  color: #94a3b8;
  line-height: 1.4;
  margin-top: 4px;
}

.action-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-hint {
  font-size: 11px;
  color: #94a3b8;
}

.action-btn {
  width: 100%;
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.2) 0%, rgba(14, 165, 233, 0.3) 100%);
  border: 1px solid rgba(56, 189, 248, 0.4);
  color: #38bdf8;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(56, 189, 248, 0.35);
  color: #fff;
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.4);
}
</style>
