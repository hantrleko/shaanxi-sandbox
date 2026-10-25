<template>
  <div class="model-controller" v-if="currentMode === 'model'">
    <!-- 顶部演变阶段横向步骤条 -->
    <div class="model-top-stepper glass-panel">
      <div class="stepper-title">地貌演化阶段（点选切换观察 3D 网格变形与水蚀演变）：</div>
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

    <!-- 左侧演变科普面板 -->
    <aside class="model-info-panel glass-panel">
      <div class="panel-tag">EVOLUTION · 科学演化模型</div>
      <h2 class="stage-title">{{ currentStageData.name }}</h2>
      <div class="stage-period">地质年代：{{ currentStageData.period }}</div>

      <div class="stage-desc-box">
        <p>{{ currentStageData.subText }}</p>
      </div>

      <div class="stage-arrow-hint">
        <span class="hint-icon">↘</span>
        <span>青色动态箭头示意降雨坡面汇流与流水下切侵蚀方向</span>
      </div>

      <div class="step-actions">
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
import { computed } from 'vue';

const props = defineProps({
  currentMode: { type: String, required: true },
  stages: { type: Array, required: true },
  currentStage: { type: Number, default: 1 }
});

defineEmits(['select-stage', 'prev-stage', 'next-stage', 'back-to-macro']);

const currentStageData = computed(() => {
  return props.stages.find(s => s.stage === props.currentStage) || props.stages[0];
});
</script>

<style scoped>
.model-top-stepper {
  position: absolute;
  top: 80px;
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
  font-size: 12px;
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
  top: 150px;
  left: 20px;
  width: 360px;
  padding: 20px;
  z-index: 15;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-tag {
  font-size: 11px;
  font-weight: 700;
  color: #f59e0b;
  letter-spacing: 0.08em;
}

.stage-title {
  font-family: var(--font-serif);
  font-size: 24px;
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
  line-height: 1.6;
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
