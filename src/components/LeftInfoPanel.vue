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
        <div class="badge-lbl">时代 · 地理特征</div>
      </div>
      <div class="badge-card highlight" v-if="chapter.highlight">
        <div class="badge-val">{{ chapter.highlight }}</div>
        <div class="badge-lbl">核心要点</div>
      </div>
    </div>

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

    <!-- 图解与实景联动展示卡片 (专业交互式 SVG 地质地貌图) -->
    <div class="visual-cards">
      <!-- 剖面示意图 (矢量 SVG 绘制) -->
      <div class="card-item" v-if="chapter.diagramTitle">
        <div class="card-tag">图解 · 专业地质剖面 (点击节点飞往实景)</div>
        <div class="diagram-preview">
          <!-- 1. 陕西南北地质大剖面 SVG -->
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

            <!-- 北侧陕北高原 -->
            <path d="M 10 50 Q 50 48, 90 55 L 90 90 L 10 90 Z" fill="url(#loessGrad)" class="hotspot" @click="flyTo([8.71, 7.1, -22.19])" />
            <text x="25" y="45" font-size="8" fill="#fbbf24" font-weight="bold" class="svg-lbl" @click="flyTo([8.71, 7.1, -22.19])">陕北黄土高原 ↗</text>

            <!-- 关中地堑沉降断陷 -->
            <path d="M 90 55 L 120 70 L 180 70 L 195 50 L 195 90 L 90 90 Z" fill="#166534" opacity="0.85" class="hotspot" @click="flyTo([3.97, 1.33, 17.31])" />
            <line x1="90" y1="40" x2="110" y2="85" stroke="#ef4444" stroke-width="1.2" stroke-dasharray="2 2" />
            <line x1="195" y1="30" x2="185" y2="85" stroke="#ef4444" stroke-width="1.2" stroke-dasharray="2 2" />
            <text x="120" y="66" font-size="8" fill="#86efac" font-weight="bold" class="svg-lbl" @click="flyTo([3.97, 1.33, 17.31])">关中地堑·渭河 ↗</text>

            <!-- 秦岭太白山断块高耸 -->
            <path d="M 195 50 L 225 15 L 260 55 L 260 90 L 195 90 Z" fill="url(#qinlingGrad)" class="hotspot" @click="flyTo([-4.84, 17.33, 22.75])" />
            <polygon points="225,15 218,25 232,25" fill="#ffffff" />
            <text x="206" y="11" font-size="8" fill="#e0f2fe" font-weight="bold" class="svg-lbl" @click="flyTo([-4.84, 17.33, 22.75])">太白山 3771m ↗</text>

            <!-- 汉中盆地与大巴山 -->
            <path d="M 260 55 L 285 68 L 310 45 L 330 50 L 330 90 L 260 90 Z" fill="#047857" opacity="0.85" class="hotspot" @click="flyTo([-11.93, 1.94, 36.04])" />
            <text x="268" y="66" font-size="7.5" fill="#6ee7b7" class="svg-lbl" @click="flyTo([-11.93, 1.94, 36.04])">汉江 ↗</text>
            <text x="305" y="42" font-size="8" fill="#34d399" class="svg-lbl" @click="flyTo([3.02, 6.04, 47.39])">大巴山 ↗</text>

            <!-- 基底岩层线 -->
            <line x1="5" y1="90" x2="335" y2="90" stroke="#64748b" stroke-width="1.5" />
            <line x1="225" y1="0" x2="225" y2="90" stroke="#38bdf8" stroke-width="0.8" stroke-dasharray="3 2" />
            <text x="228" y="32" font-size="6.5" fill="#38bdf8">800mm降水分界</text>
          </svg>

          <!-- 2. 秦岭气候水热屏障阻隔 SVG -->
          <svg
            v-else-if="chapter.diagramType === 'profile_qinling'"
            viewBox="0 0 340 100"
            class="interactive-svg"
          >
            <!-- 秦岭大山脊 -->
            <path d="M 40 85 L 170 20 L 300 85 Z" fill="#1e293b" stroke="#38bdf8" stroke-width="1.5" class="hotspot" @click="flyTo([-4.84, 17.33, 22.75])" />
            <polygon points="170,20 160,32 180,32" fill="#ffffff" />
            <text x="135" y="14" font-size="9" fill="#fff" font-weight="bold" class="svg-lbl" @click="flyTo([-4.84, 17.33, 22.75])">秦岭主脊屏障 3771m ↗</text>

            <!-- 北侧西伯利亚冷空气受阻 -->
            <path d="M 20 30 Q 80 40 125 55" stroke="#38bdf8" stroke-width="2.5" fill="none" class="hotspot" @click="flyTo([3.97, 1.33, 17.31])" />
            <text x="18" y="24" font-size="8" fill="#38bdf8" class="svg-lbl" @click="flyTo([3.97, 1.33, 17.31])">西伯利亚干冷风被阻隔 ⬇</text>

            <!-- 南侧东南暖湿气流抬升降雨 -->
            <path d="M 320 65 Q 260 60 220 40" stroke="#10b981" stroke-width="2.5" fill="none" class="hotspot" @click="flyTo([-11.93, 1.94, 36.04])" />
            <text x="225" y="78" font-size="8" fill="#10b981" class="svg-lbl" @click="flyTo([-11.93, 1.94, 36.04])">暖湿气流迎风成雨 ⬆</text>
            <line x1="230" y1="45" x2="226" y2="52" stroke="#06b6d4" stroke-width="1.5" />
            <line x1="240" y1="48" x2="236" y2="55" stroke="#06b6d4" stroke-width="1.5" />
          </svg>

          <!-- 3. 关中地堑断陷盆地与八水环绕图 SVG -->
          <svg
            v-else-if="chapter.diagramType === 'profile_guanzhong'"
            viewBox="0 0 340 100"
            class="interactive-svg"
          >
            <!-- 北山断阶 -->
            <path d="M 10 35 L 70 45 L 70 85 L 10 85 Z" fill="#334155" class="hotspot" @click="flyTo([3.0, 3.5, 6.0])" />
            <text x="18" y="30" font-size="7.5" fill="#94a3b8">北山断阶</text>
            <!-- 渭河平原深厚沉积 -->
            <path d="M 70 45 L 85 75 L 245 75 L 260 30 L 260 85 L 70 85 Z" fill="#15803d" opacity="0.8" class="hotspot" @click="flyTo([3.97, 1.33, 17.31])" />
            <text x="135" y="70" font-size="8.5" fill="#86efac" font-weight="bold" class="svg-lbl" @click="flyTo([3.97, 1.33, 17.31])">关中地堑·八百里沃野 ↗</text>
            <!-- 渭河水系线 -->
            <path d="M 85 73 Q 160 70 245 73" stroke="#38bdf8" stroke-width="2.5" fill="none" class="hotspot" @click="flyTo([3.97, 1.33, 17.31])" />
            <!-- 正断层指示红虚线 -->
            <line x1="70" y1="35" x2="85" y2="85" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="2 2" />
            <line x1="260" y1="20" x2="245" y2="85" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="2 2" />
            <!-- 秦岭北坡大断崖 -->
            <path d="M 260 30 L 300 15 L 330 35 L 330 85 L 260 85 Z" fill="#0284c7" class="hotspot" @click="flyTo([-4.84, 17.33, 22.75])" />
            <text x="270" y="12" font-size="8" fill="#e0f2fe" font-weight="bold" class="svg-lbl" @click="flyTo([-4.84, 17.33, 22.75])">秦岭大断崖 ↗</text>
          </svg>

          <!-- 4. 黄土塬梁峁侵蚀演变模式 SVG -->
          <svg
            v-else-if="chapter.diagramType === 'profile_loess'"
            viewBox="0 0 340 100"
            class="interactive-svg"
          >
            <!-- 塬面 (平坦完整) -->
            <path d="M 10 35 L 80 35 L 80 85 L 10 85 Z" fill="#d97706" opacity="0.9" class="hotspot" @click="flyTo([8.71, 7.1, -22.19])" />
            <text x="28" y="30" font-size="8" fill="#fbbf24" font-weight="bold" class="svg-lbl" @click="flyTo([8.71, 7.1, -22.19])">① 黄土塬 ↗</text>
            <!-- 梁 (长条垄状) -->
            <path d="M 95 45 Q 125 35 155 45 L 155 85 L 95 85 Z" fill="#b45309" class="hotspot" @click="flyTo([11.46, 4.2, -17.31])" />
            <text x="110" y="32" font-size="8" fill="#fde68a" font-weight="bold" class="svg-lbl" @click="flyTo([11.46, 4.2, -17.31])">② 黄土梁 ↗</text>
            <!-- 峁 (孤立圆丘) -->
            <path d="M 170 55 Q 195 38 220 55 L 220 85 L 170 85 Z" fill="#92400e" class="hotspot" @click="flyTo([14.0, 3.5, -25.0])" />
            <text x="182" y="35" font-size="8" fill="#fed7aa" font-weight="bold" class="svg-lbl" @click="flyTo([14.0, 3.5, -25.0])">③ 黄土峁 ↗</text>
            <!-- 梯田治理生态区 -->
            <path d="M 235 60 L 255 60 L 255 52 L 280 52 L 280 44 L 305 44 L 330 44 L 330 85 L 235 85 Z" fill="#15803d" class="hotspot" @click="flyTo([13.78, 4.82, -44.8])" />
            <text x="250" y="36" font-size="8" fill="#86efac" font-weight="bold" class="svg-lbl" @click="flyTo([13.78, 4.82, -44.8])">④ 生态梯田 ↗</text>
          </svg>

          <!-- 5. 汉江水系与南水北调中线生态走廊 SVG -->
          <svg
            v-else-if="chapter.diagramType === 'profile_hanjiang'"
            viewBox="0 0 340 100"
            class="interactive-svg"
          >
            <!-- 汉中盆地 -->
            <rect x="20" y="45" width="80" height="40" fill="#047857" opacity="0.8" class="hotspot" @click="flyTo([-11.93, 1.94, 36.04])" />
            <text x="32" y="40" font-size="8" fill="#6ee7b7" font-weight="bold" class="svg-lbl" @click="flyTo([-11.93, 1.94, 36.04])">汉中盆地水源 ↗</text>
            <!-- 汉江干流碧水 -->
            <path d="M 20 65 Q 120 60 180 65 T 320 65" stroke="#06b6d4" stroke-width="4" fill="none" class="hotspot" @click="flyTo([7.09, 0.85, 41.71])" />
            <!-- 安康瀛湖深谷 -->
            <circle cx="180" cy="65" r="14" fill="#0284c7" opacity="0.85" class="hotspot" @click="flyTo([7.09, 0.85, 41.71])" />
            <text x="145" y="46" font-size="8" fill="#e0f2fe" font-weight="bold" class="svg-lbl" @click="flyTo([7.09, 0.85, 41.71])">安康瀛湖水源 ↗</text>
            <!-- 南水北调总干渠出陕 -->
            <path d="M 280 65 L 320 30" stroke="#38bdf8" stroke-width="2.5" stroke-dasharray="3 2" fill="none" />
            <text x="250" y="25" font-size="8" fill="#38bdf8" font-weight="bold">送水京津冀 ➔</text>
          </svg>

          <!-- 6. 古代长安八水水系与引渠复原示意 SVG -->
          <svg
            v-else-if="chapter.diagramType === 'profile_rivers'"
            viewBox="0 0 340 100"
            class="interactive-svg"
          >
            <!-- 长安古城核心 -->
            <rect x="140" y="45" width="60" height="40" fill="#1e293b" stroke="#f59e0b" stroke-width="1.5" class="hotspot" @click="flyTo([6.24, 1.32, 16.98])" />
            <text x="148" y="68" font-size="8.5" fill="#fde68a" font-weight="bold" class="svg-lbl" @click="flyTo([6.24, 1.32, 16.98])">长安都城 ↗</text>
            <!-- 渭河干流 (北部横贯) -->
            <path d="M 20 28 Q 160 22 320 28" stroke="#06b6d4" stroke-width="3" fill="none" class="hotspot" @click="flyTo([3.97, 1.33, 17.31])" />
            <text x="30" y="22" font-size="7.5" fill="#06b6d4">渭河清流</text>
            <!-- 泾河汇流 (浊水入渭) -->
            <path d="M 220 5 Q 240 18 250 27" stroke="#eab308" stroke-width="2.5" fill="none" class="hotspot" @click="flyTo([6.5, 4.0, 15.2])" />
            <text x="210" y="14" font-size="7.5" fill="#eab308">泾河浊流</text>
            <circle cx="250" cy="27" r="5" fill="#ef4444" class="hotspot" @click="flyTo([6.5, 4.0, 15.2])" />
            <text x="258" y="26" font-size="8" fill="#fca5a5" font-weight="bold" class="svg-lbl" @click="flyTo([6.5, 4.0, 15.2])">泾渭分明 ↗</text>
            <!-- 环绕诸水流线 (浐灞沣涝) -->
            <path d="M 80 85 L 140 65" stroke="#38bdf8" stroke-width="1.5" fill="none" />
            <path d="M 240 85 L 200 65" stroke="#38bdf8" stroke-width="1.5" fill="none" />
            <text x="75" y="80" font-size="6.5" fill="#94a3b8">沣涝西来</text>
            <text x="215" y="80" font-size="6.5" fill="#94a3b8">浐灞东流</text>
          </svg>

          <div class="card-caption">{{ chapter.diagramTitle }}</div>
        </div>
      </div>

      <!-- 实景卫星/历史图片 -->
      <div class="card-item" v-if="chapter.photoUrl">
        <div class="card-tag">实景 · 权威影像图</div>
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

const emit = defineEmits(['listen-current', 'focus-feature', 'fly-strata']);

const activeSentenceIndex = ref(0);
let timer = null;

const sentences = computed(() => {
  if (!props.chapter || !props.chapter.desc) return [];
  return props.chapter.desc.split(/(?<=[。！？；])/).filter(s => s.trim().length > 0);
});

const flyTo = (pos) => {
  emit('fly-strata', pos);
};

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
  background: rgba(56, 189, 248, 0.08);
  border-color: rgba(56, 189, 248, 0.25);
}

.badge-val {
  font-size: 13px;
  font-weight: 700;
  color: #fff;
}

.badge-card.highlight .badge-val {
  color: #38bdf8;
}

.badge-lbl {
  font-size: 10px;
  color: #64748b;
  margin-top: 2px;
}

.desc-content {
  font-size: 13.5px;
  line-height: 1.7;
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
  padding: 1px 4px;
  border-radius: 4px;
}

.visual-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-item {
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  overflow: hidden;
}

.card-tag {
  font-size: 10px;
  font-weight: 700;
  color: #38bdf8;
  padding: 6px 10px;
  background: rgba(56, 189, 248, 0.1);
  border-bottom: 1px solid rgba(56, 189, 248, 0.15);
}

.diagram-preview {
  padding: 10px;
  background: rgba(10, 15, 24, 0.85);
}

.interactive-svg {
  width: 100%;
  height: auto;
  border-radius: 6px;
  overflow: hidden;
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

.photo-preview {
  position: relative;
}

.preview-img {
  width: 100%;
  height: 160px;
  object-fit: cover;
  display: block;
}

.card-caption {
  font-size: 10.5px;
  color: #94a3b8;
  padding: 6px 10px;
  background: rgba(0, 0, 0, 0.6);
}

.action-footer {
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-hint {
  font-size: 10.5px;
  color: #64748b;
  text-align: center;
}

.action-btn {
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(14, 165, 233, 0.3));
  border: 1px solid #38bdf8;
  color: #38bdf8;
  padding: 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(56, 189, 248, 0.4);
  color: #fff;
  box-shadow: 0 0 15px rgba(56, 189, 248, 0.4);
}
</style>
