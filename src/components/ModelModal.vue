<template>
  <div class="model-controller" v-if="currentMode === 'model'">
    <!-- 顶部科学模型实验台选择器 -->
    <div class="model-lab-tabs glass-panel">
      <button
        v-for="lab in LABS"
        :key="lab.id"
        class="lab-tab-btn"
        :class="{ active: activeLabId === lab.id }"
        @click="selectLab(lab.id)"
      >
        <span class="lab-icon">{{ lab.icon }}</span>
        <span>{{ lab.name }}</span>
      </button>
    </div>

    <!-- 演变阶段横向步骤条 (黄土高原侵蚀模式) -->
    <div class="model-top-stepper glass-panel" v-if="activeLabId === 'loess'">
      <div class="stepper-title">地貌演化阶段（点选切换观察 3D 网格微观变形）：</div>
      <div class="stepper-buttons">
        <button
          v-for="s in stages"
          :key="s.stage"
          class="step-btn"
          :class="{ active: currentStage === s.stage }"
          @click="$emit('select-stage', s.stage)"
        >
          <span class="step-num">{{ s.stage }}</span>
          <span class="step-name">{{ s.name }}</span>
        </button>
      </div>
    </div>

    <!-- 秦岭地质板块挤压阶段步骤条 -->
    <div class="model-top-stepper glass-panel" v-if="activeLabId === 'tectonic'">
      <div class="stepper-title">秦岭造山构造阶段（观察板块碰撞与地堑断陷）：</div>
      <div class="stepper-buttons">
        <button
          v-for="(ts, tIdx) in TECTONIC_STAGES"
          :key="tIdx"
          class="step-btn"
          :class="{ active: currentTectonicStage === tIdx }"
          @click="selectTectonicStage(tIdx)"
        >
          <span class="step-num">{{ tIdx + 1 }}</span>
          <span class="step-name">{{ ts.name }}</span>
        </button>
      </div>
    </div>

    <!-- 左侧演变科学解析面板 -->
    <aside class="model-info-panel glass-panel">
      <div class="panel-tag">
        <span class="tag-icon">🔬</span>
        <span>{{ currentLabInfo.tag }}</span>
      </div>

      <h2 class="stage-title">{{ currentStageTitle }}</h2>
      <div class="stage-period">{{ currentStagePeriod }}</div>

      <div class="stage-desc-box">
        <p>{{ currentStageDesc }}</p>
      </div>

      <!-- 动态指示说明 -->
      <div class="stage-arrow-hint" v-if="activeLabId === 'loess'">
        <span class="hint-icon">↘</span>
        <span>青色动态箭头示意暴雨坡面汇流与下切侵蚀方向</span>
      </div>

      <div class="stage-arrow-hint tectonic" v-if="activeLabId === 'tectonic'">
        <span class="hint-icon">⬆</span>
        <span>红色断裂带示意扬子板块北向俯冲推挤与秦岭断块抬升</span>
      </div>

      <div class="stage-arrow-hint climate" v-if="activeLabId === 'climate'">
        <span class="hint-icon">❄️</span>
        <span>蓝色粒子流：西伯利亚寒流北向阻隔；绿色粒子流：南风迎风降水</span>
      </div>

      <!-- 步进按钮 -->
      <div class="step-actions" v-if="activeLabId === 'loess'">
        <button class="step-nav-btn" @click="$emit('prev-stage')" :disabled="currentStage === 1">
          ‹ 上一阶段
        </button>
        <button class="step-nav-btn" @click="$emit('next-stage')" :disabled="currentStage === stages.length">
          下一阶段 ›
        </button>
      </div>

      <button class="back-macro-btn" @click="$emit('back-to-macro')">
        ‹ 返回宏观全省沙盘
      </button>
    </aside>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  currentMode: { type: String, required: true },
  stages: { type: Array, required: true },
  currentStage: { type: Number, default: 1 }
});

const emit = defineEmits(['select-stage', 'prev-stage', 'next-stage', 'back-to-macro', 'change-lab', 'change-tectonic-stage']);

const activeLabId = ref('loess'); // 'loess' | 'tectonic' | 'climate' | 'globe'
const currentTectonicStage = ref(0);

const LABS = [
  { id: 'loess', name: '黄土高原侵蚀演化 (7阶)', icon: '🌾', tag: 'GEOMORPHOLOGY · 黄土塬梁峁' },
  { id: 'tectonic', name: '秦岭板块造山与地堑剖面', icon: '⛰️', tag: 'TECTONICS · 板块挤压与断陷' },
  { id: 'climate', name: '秦岭一山分南北气候模拟', icon: '🌦️', tag: 'CLIMATE · 800mm气候屏障' },
  { id: 'globe', name: '地球视角与大地原点', icon: '🌏', tag: 'GLOBE · 几何中心与温带' }
];

const TECTONIC_STAGES = [
  {
    name: "华北与扬子地块拼合",
    period: "中生代印支期 (约2亿年前)",
    desc: "华北地块与扬子地块强烈碰撞拼合，古秦岭洋闭合，沿商丹缝合带开始发生强烈的褶皱挤压与花岗岩岩浆侵入。"
  },
  {
    name: "喜马拉雅期秦岭强烈抬升",
    period: "新生代喜马拉雅造山运动",
    desc: "印度洋板块向北推挤亚欧板块，应力向北传导。古老秦岭拼合带断块重新急剧抬升，太白山、华山拔地而起，形成巨大天然生态屏障。"
  },
  {
    name: "关中地堑断陷与渭河填平",
    period: "晚新生代第四纪",
    desc: "秦岭北坡发生巨大正断层陷落，北部北山亦断裂下沉，中间形成深厚的关中地堑断陷盆地。渭河冲积扇与黄土泥沙不断沉积填平，造就八百里沃野。"
  }
];

const currentLabInfo = computed(() => {
  return LABS.find(l => l.id === activeLabId.value) || LABS[0];
});

const currentStageData = computed(() => {
  return props.stages.find(s => s.stage === props.currentStage) || props.stages[0];
});

const currentStageTitle = computed(() => {
  if (activeLabId.value === 'loess') return currentStageData.value.name;
  if (activeLabId.value === 'tectonic') return TECTONIC_STAGES[currentTectonicStage.value].name;
  if (activeLabId.value === 'climate') return "一山分南北 · 气候水热双重阻隔";
  return "地球视角下的陕西 · 大地原点";
});

const currentStagePeriod = computed(() => {
  if (activeLabId.value === 'loess') return `地质年代：${currentStageData.value.period}`;
  if (activeLabId.value === 'tectonic') return `演化纪元：${TECTONIC_STAGES[currentTectonicStage.value].period}`;
  if (activeLabId.value === 'climate') return "现代地理气候常年环流模式";
  return "经纬度：105°E ~ 111°E, 31°N ~ 39°N";
});

const currentStageDesc = computed(() => {
  if (activeLabId.value === 'loess') return currentStageData.value.subText;
  if (activeLabId.value === 'tectonic') return TECTONIC_STAGES[currentTectonicStage.value].desc;
  if (activeLabId.value === 'climate') return "秦岭山体高耸巍峨（平均海拔2000-3000米），横亘东西阻挡冬季来自蒙古西伯利亚的极地干冷气团南下，同时拦截夏季来自太平洋与印度洋的暖湿水汽，使陕南湿润多雨、关中干湿适中、陕北干旱少雨。";
  return "陕西地处中国地理版图中心。位于泾阳的大地原点（国家地理坐标系起算点）见证了这一特殊地理区位。横跨北亚热带与暖温带两大热量带，长江与黄河两大母亲河纵贯南北。";
});

const selectLab = (labId) => {
  activeLabId.value = labId;
  emit('change-lab', labId);
};

const selectTectonicStage = (idx) => {
  currentTectonicStage.value = idx;
  emit('change-tectonic-stage', idx);
};
</script>

<style scoped>
.model-lab-tabs {
  position: absolute;
  top: 76px;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px;
  border-radius: 12px;
  z-index: 15;
  display: flex;
  gap: 6px;
}

.lab-tab-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.lab-tab-btn:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

.lab-tab-btn.active {
  background: rgba(56, 189, 248, 0.2);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.4);
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
}

.model-top-stepper {
  position: absolute;
  top: 126px;
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 16px;
  z-index: 15;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.stepper-title {
  font-size: 11px;
  color: #94a3b8;
  text-align: center;
}

.stepper-buttons {
  display: flex;
  gap: 6px;
}

.step-btn {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 11.5px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.step-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.step-btn.active {
  background: rgba(217, 119, 6, 0.25);
  border-color: #d97706;
  color: #fbbf24;
  box-shadow: 0 0 10px rgba(217, 119, 6, 0.3);
}

.step-num {
  font-size: 10px;
  font-weight: 700;
  background: rgba(0, 0, 0, 0.4);
  padding: 1px 4px;
  border-radius: 3px;
}

.model-info-panel {
  position: absolute;
  top: 180px;
  left: 20px;
  width: 380px;
  padding: 20px;
  z-index: 15;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  color: #f59e0b;
  letter-spacing: 0.08em;
}

.stage-title {
  font-family: var(--font-serif);
  font-size: 23px;
  color: #fff;
  font-weight: 700;
}

.stage-period {
  font-size: 12px;
  color: #94a3b8;
  margin-top: -6px;
}

.stage-desc-box {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 12px;
}

.stage-desc-box p {
  font-size: 13px;
  line-height: 1.65;
  color: #cbd5e1;
}

.stage-arrow-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #06b6d4;
  background: rgba(6, 182, 212, 0.1);
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid rgba(6, 182, 212, 0.2);
}

.stage-arrow-hint.tectonic {
  color: #f87171;
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.25);
}

.stage-arrow-hint.climate {
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.1);
  border-color: rgba(56, 189, 248, 0.25);
}

.hint-icon {
  font-size: 14px;
}

.step-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.step-nav-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #fff;
  padding: 8px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.step-nav-btn:hover:not(:disabled) {
  background: rgba(217, 119, 6, 0.2);
  border-color: #d97706;
}

.step-nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.back-macro-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  padding: 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.back-macro-btn:hover {
  background: rgba(56, 189, 248, 0.2);
  border-color: #38bdf8;
  color: #38bdf8;
}
</style>
