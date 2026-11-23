<template>
  <div class="bonsai-controller" v-if="currentMode === 'bonsai'">
    <!-- 左侧微观盆景专有卡片 (移动端可折叠抽屉) -->
    <aside class="bonsai-info-panel glass-panel" :class="{ 'mobile-open': isMobileDetailOpen }">
      <div class="panel-tag">
        <span>局部地形盆景</span>
      </div>
      <h2 class="bonsai-title">{{ currentBonsai.title }}</h2>
      <div class="bonsai-loc">{{ currentBonsai.location }}</div>

      <div class="bonsai-metrics">
        <div class="b-metric">
          <div class="val">{{ currentBonsai.elevation }}</div>
          <div class="lbl">主特征高程</div>
        </div>
        <div class="b-metric">
          <div class="val">约 {{ widthKm }} × {{ widthKm }} km</div>
          <div class="lbl">瓦片取样范围</div>
        </div>
      </div>

      <p class="bonsai-desc">{{ currentBonsai.desc }}</p>

      <!-- 动作按钮：从沙盘上“再取出来一次” (原视频经典交互) -->
      <button class="extract-btn" @click="$emit('re-extract')">
        <span>重新取出盆景</span>
      </button>

      <!-- 立体海拔标尺图例 -->
      <div class="ruler-legend">
        <div class="ruler-title">标尺以米显示栅格参考高程</div>
      </div>

      <!-- 高差夸大滑动调节器 -->
      <div class="slider-box">
        <div class="slider-header">
          <span>垂直夸张倍数</span>
          <span class="slider-val">{{ exaggeration.toFixed(1) }}×</span>
        </div>
        <input
          type="range"
          min="1"
          max="10"
          step="0.5"
          aria-label="垂直夸张倍数"
          :value="exaggeration"
          @input="$emit('update-exaggeration', $event.target.valueAsNumber)"
          class="custom-slider"
        />
      </div>

      <button class="back-macro-btn" @click="$emit('back-to-macro')">
        ‹ 返回宏观全省沙盘
      </button>
    </aside>

    <!-- 底部盆景切换选择卡片流 -->
    <div class="bonsai-bottom-bar glass-panel">
      <!-- 移动端顶部：盆景速览 + 再取一次 + 详情展开按钮 -->
      <div class="mobile-bar-top" v-if="currentBonsai">
        <div class="m-bar-meta" @click="isMobileDetailOpen = !isMobileDetailOpen">
          <span class="m-bar-title">🏔️ {{ currentBonsai.title }}</span>
          <span class="m-bar-elev">{{ currentBonsai.elevation }}</span>
        </div>
        <div class="m-bar-actions">
          <button class="m-reextract-btn" @click="$emit('re-extract')" title="再取一次">
            🔄 再取
          </button>
          <button
            class="m-detail-toggle"
            :class="{ active: isMobileDetailOpen }"
            @click="isMobileDetailOpen = !isMobileDetailOpen"
          >
            {{ isMobileDetailOpen ? '收起 ▼' : '参数/详情 ▲' }}
          </button>
        </div>
      </div>

      <div class="bar-title">选择局部模型 · Z12 瓦片</div>
      <div class="bonsai-cards-row">
        <button
          v-for="b in bonsais"
          :key="b.id"
          type="button"
          class="b-card"
          :class="{ active: currentBonsaiId === b.id }"
          @click="$emit('select-bonsai', b.id)"
        >
          <div class="b-card-title">{{ b.title }}</div>
          <div class="b-card-sub">{{ b.elevation }}</div>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { bonsaiTileWidthKm } from '../utils/bonsaiTerrain.js';

const props = defineProps({
  currentMode: { type: String, required: true },
  bonsais: { type: Array, required: true },
  currentBonsaiId: { type: String, required: true },
  exaggeration: { type: Number, required: true }
});

defineEmits(['select-bonsai', 'update-exaggeration', 'back-to-macro', 're-extract']);

const isMobileDetailOpen = ref(false);

const currentBonsai = computed(() => {
  return props.bonsais.find(b => b.id === props.currentBonsaiId) || props.bonsais[0];
});
const widthKm = computed(() => Math.round(bonsaiTileWidthKm(currentBonsai.value.id)));
</script>

<style scoped>
.bonsai-info-panel {
  position: absolute;
  top: 80px;
  left: 20px;
  width: 380px;
  max-height: calc(100vh - 185px);
  overflow-y: auto;
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

.extract-btn {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.4);
  color: #6ee7b7;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.extract-btn:hover {
  background: rgba(16, 185, 129, 0.3);
  color: #fff;
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.35);
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
  flex-direction: column;
  gap: 4px;
}

.ruler-tag {
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.25);
  color: #38bdf8;
  font-size: 10.5px;
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

.mobile-bar-top {
  display: none;
}

@media (max-width: 768px) {
  .bonsai-info-panel {
    display: none;
    top: auto;
    bottom: calc(106px + var(--safe-bottom));
    left: 8px;
    right: 8px;
    width: auto;
    max-height: 55dvh;
    padding: 14px;
    z-index: 26;
  }
  .bonsai-info-panel.mobile-open {
    display: flex;
  }
  .bonsai-title {
    font-size: 19px;
  }
  .bonsai-bottom-bar {
    bottom: 0;
    left: 0;
    right: 0;
    border-radius: 16px 16px 0 0;
    padding: 8px 10px calc(10px + var(--safe-bottom));
    gap: 6px;
    z-index: 25;
  }
  .mobile-bar-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }
  .m-bar-meta {
    display: flex;
    align-items: center;
    gap: 6px;
    min-width: 0;
    flex: 1;
    cursor: pointer;
  }
  .m-bar-title {
    font-size: 12.5px;
    font-weight: 700;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .m-bar-elev {
    font-size: 10px;
    color: #38bdf8;
    font-family: monospace;
    flex-shrink: 0;
  }
  .m-bar-actions {
    display: flex;
    align-items: center;
    gap: 5px;
    flex-shrink: 0;
  }
  .m-reextract-btn {
    background: rgba(16, 185, 129, 0.2);
    border: 1px solid rgba(16, 185, 129, 0.45);
    color: #6ee7b7;
    font-size: 10.5px;
    font-weight: 600;
    padding: 4px 8px;
    border-radius: 6px;
    cursor: pointer;
  }
  .m-detail-toggle {
    background: rgba(56, 189, 248, 0.16);
    border: 1px solid rgba(56, 189, 248, 0.4);
    color: #7dd3fc;
    font-size: 10.5px;
    font-weight: 600;
    padding: 4px 8px;
    border-radius: 6px;
    cursor: pointer;
  }
  .m-detail-toggle.active {
    background: rgba(56, 189, 248, 0.32);
    color: #fff;
  }
  .bar-title {
    display: none;
  }
  .bonsai-cards-row {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    flex-wrap: nowrap;
    gap: 8px;
  }
  .b-card {
    flex: 0 0 auto;
    min-width: 130px;
    padding: 6px 10px;
  }
  .b-card-title {
    font-size: 12px;
  }
}
</style>
