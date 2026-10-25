<template>
  <div class="bonsai-controller" v-if="currentMode === 'bonsai'">
    <!-- 左侧微观盆景专有卡片 -->
    <aside class="bonsai-info-panel glass-panel">
      <div class="panel-tag">BONSAI · 微观盆景</div>
      <h2 class="bonsai-title">{{ currentBonsai.title }}</h2>
      <div class="bonsai-loc">{{ currentBonsai.location }}</div>

      <div class="bonsai-metrics">
        <div class="b-metric">
          <div class="val">{{ currentBonsai.elevation }}</div>
          <div class="lbl">主特征高程</div>
        </div>
        <div class="b-metric">
          <div class="val">{{ currentBonsai.scaleRatio }}</div>
          <div class="lbl">高程比例</div>
        </div>
      </div>

      <p class="bonsai-desc">{{ currentBonsai.desc }}</p>

      <!-- 立体海拔标尺图例 -->
      <div class="ruler-legend">
        <div class="ruler-title">三维海拔刻度标尺</div>
        <div class="ruler-items">
          <span v-for="mark in currentBonsai.elevationMarks" :key="mark" class="ruler-tag">
            {{ mark }}
          </span>
        </div>
      </div>

      <!-- 高差夸大滑动调节器 -->
      <div class="slider-box">
        <div class="slider-header">
          <span>垂直高差放大倍数</span>
          <span class="slider-val">{{ exaggeration.toFixed(1) }}x</span>
        </div>
        <input
          type="range"
          min="1.0"
          max="2.5"
          step="0.1"
          v-model.number="exaggeration"
          @input="$emit('update-exaggeration', exaggeration)"
          class="custom-slider"
        />
      </div>

      <button class="back-macro-btn" @click="$emit('back-to-macro')">
        ‹ 返回宏观全省沙盘
      </button>
    </aside>

    <!-- 底部盆景切换选择卡片流 -->
    <div class="bonsai-bottom-bar glass-panel">
      <div class="bar-title">微观盆景选择：从沙盘上“切出”这块地，自由旋转俯仰缩放</div>
      <div class="bonsai-cards-row">
        <div
          v-for="b in bonsais"
          :key="b.id"
          class="b-card"
          :class="{ active: currentBonsaiId === b.id }"
          @click="$emit('select-bonsai', b.id)"
        >
          <div class="b-card-title">{{ b.title }}</div>
          <div class="b-card-sub">{{ b.elevation }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  currentMode: { type: String, required: true },
  bonsais: { type: Array, required: true },
  currentBonsaiId: { type: String, required: true }
});

defineEmits(['select-bonsai', 'update-exaggeration', 'back-to-macro']);

const exaggeration = ref(1.5);

const currentBonsai = computed(() => {
  return props.bonsais.find(b => b.id === props.currentBonsaiId) || props.bonsais[0];
});
</script>

<style scoped>
.bonsai-info-panel {
  position: absolute;
  top: 80px;
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
  color: #10b981;
  letter-spacing: 0.08em;
}

.bonsai-title {
  font-family: var(--font-serif);
  font-size: 24px;
  color: #fff;
  font-weight: 700;
}

.bonsai-loc {
  font-size: 12px;
  color: #94a3b8;
  margin-top: -6px;
}

.bonsai-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.b-metric {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 8px 10px;
}

.b-metric .val {
  font-size: 12px;
  font-weight: 700;
  color: #38bdf8;
}

.b-metric .lbl {
  font-size: 10px;
  color: #64748b;
  margin-top: 2px;
}

.bonsai-desc {
  font-size: 13px;
  line-height: 1.6;
  color: #cbd5e1;
}

.ruler-legend {
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ruler-title {
  font-size: 10px;
  font-weight: 600;
  color: #94a3b8;
}

.ruler-items {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.ruler-tag {
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.25);
  color: #38bdf8;
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
}

.slider-box {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: rgba(255, 255, 255, 0.03);
  padding: 8px 10px;
  border-radius: 8px;
}

.slider-header {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #94a3b8;
}

.slider-val {
  color: #38bdf8;
  font-weight: 600;
}

.custom-slider {
  width: 100%;
  accent-color: #38bdf8;
  cursor: pointer;
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

.bonsai-bottom-bar {
  position: absolute;
  bottom: 16px;
  left: 20px;
  right: 20px;
  padding: 10px 16px;
  z-index: 15;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bar-title {
  font-size: 11px;
  color: #94a3b8;
}

.bonsai-cards-row {
  display: flex;
  gap: 10px;
}

.b-card {
  flex: 1;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.b-card:hover {
  background: rgba(255, 255, 255, 0.08);
}

.b-card.active {
  background: rgba(16, 185, 129, 0.15);
  border-color: #10b981;
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
}

.b-card-title {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
}

.b-card-sub {
  font-size: 10px;
  color: #94a3b8;
  margin-top: 2px;
}
</style>
