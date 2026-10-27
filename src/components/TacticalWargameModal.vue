<template>
  <div v-if="active && comparisonData" class="wargame-modal-overlay" @click.self="$emit('close')">
    <div class="wargame-card">
      <div class="modal-header">
        <div class="badge-title">
          <span class="swords-icon">⚔️</span>
          <div>
            <div class="title">{{ comparisonData.title }}</div>
            <div class="context">{{ comparisonData.context }}</div>
          </div>
        </div>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <!-- 双路线双列卡片对比 -->
      <div class="routes-comparison-grid">
        <div
          v-for="route in comparisonData.routes"
          :key="route.id"
          class="route-card"
          :style="{ borderColor: route.color }"
        >
          <div class="route-header" :style="{ background: route.color + '22' }">
            <div class="route-name" :style="{ color: route.color }">{{ route.name }}</div>
            <span class="route-status">{{ route.status }}</span>
          </div>

          <!-- 核心地形与后勤指标 -->
          <div class="route-stats">
            <div class="stat-row">
              <span class="stat-k">行军实测里程:</span>
              <span class="stat-v">{{ route.distanceKm }} km</span>
            </div>
            <div class="stat-row">
              <span class="stat-k">最高穿越海拔:</span>
              <span class="stat-v alt">{{ route.maxElevationM }} m</span>
            </div>
            <div class="stat-row">
              <span class="stat-k">累计翻越落差:</span>
              <span class="stat-v">+{{ route.elevationGainM }} m</span>
            </div>
            <div class="stat-row">
              <span class="stat-k">峡谷平均坡度:</span>
              <span class="stat-v">{{ route.averageSlope }}%</span>
            </div>
            <div class="stat-row">
              <span class="stat-k">天险关隘总数:</span>
              <span class="stat-v">{{ route.defendedPasses }} 座天堑</span>
            </div>
            <div class="stat-row">
              <span class="stat-k">粮饷辎重损耗率:</span>
              <span class="stat-v loss">{{ route.supplyLossRate }}%</span>
            </div>
          </div>

          <!-- 战术评析与地理剖析 -->
          <div class="verdict-box">
            <div class="verdict-title">兵法战术评析</div>
            <div class="verdict-text">{{ route.tacticalVerdict }}</div>
          </div>

          <div class="terrain-adv">
            <span class="adv-label">三维地形逻辑:</span>
            <span class="adv-text">{{ route.terrainAdvantage }}</span>
          </div>
        </div>
      </div>

      <!-- 军事推演综合多维对比条 -->
      <div class="metrics-bars-box">
        <div class="box-title">📊 战术多维损耗与胜率对比</div>
        <div class="bars-list">
          <div v-for="m in comparisonData.radarMetrics" :key="m.label" class="metric-bar-item">
            <div class="metric-name">{{ m.label }}</div>
            <div class="bar-track">
              <!-- Route 1 -->
              <div
                class="bar-fill route-1"
                :style="{ width: (m.qishan || m.chencang) + '%', background: comparisonData.routes[0].color }"
                :title="`${comparisonData.routes[0].name}: ${(m.qishan || m.chencang)}分`"
              >
                <span>{{ (m.qishan || m.chencang) }}</span>
              </div>
            </div>
            <div class="bar-track">
              <!-- Route 2 -->
              <div
                class="bar-fill route-2"
                :style="{ width: (m.ziwu || m.baoxie) + '%', background: comparisonData.routes[1].color }"
                :title="`${comparisonData.routes[1].name}: ${(m.ziwu || m.baoxie)}分`"
              >
                <span>{{ (m.ziwu || m.baoxie) }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="legend-row">
          <span class="legend-item" :style="{ color: comparisonData.routes[0].color }">
            ■ {{ comparisonData.routes[0].name }}
          </span>
          <span class="legend-item" :style="{ color: comparisonData.routes[1].color }">
            ■ {{ comparisonData.routes[1].name }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  active: { type: Boolean, default: false },
  comparisonData: { type: Object, default: null }
});

defineEmits(['close']);
</script>

<style scoped>
.wargame-modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(4, 7, 12, 0.85);
  backdrop-filter: blur(10px);
  z-index: 85;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.wargame-card {
  background: rgba(12, 17, 28, 0.96);
  border: 1px solid rgba(239, 68, 68, 0.4);
  border-radius: 18px;
  width: 100%;
  max-width: 820px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(239, 68, 68, 0.2);
  padding: 24px;
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 14px;
}

.badge-title {
  display: flex;
  gap: 12px;
  align-items: center;
}

.swords-icon {
  font-size: 28px;
}

.title {
  font-size: 17px;
  font-weight: 700;
  color: #fca5a5;
  letter-spacing: 0.04em;
}

.context {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;
}

.close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 18px;
  cursor: pointer;
  padding: 4px 8px;
}

.close-btn:hover {
  color: #ef4444;
}

.routes-comparison-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.route-card {
  background: rgba(15, 23, 42, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
}

.route-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-radius: 8px;
}

.route-name {
  font-size: 14px;
  font-weight: 700;
}

.route-status {
  font-size: 10px;
  color: #cbd5e1;
  background: rgba(0, 0, 0, 0.4);
  padding: 2px 8px;
  border-radius: 10px;
}

.route-stats {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: rgba(6, 10, 18, 0.6);
  padding: 10px 12px;
  border-radius: 8px;
}

.stat-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11.5px;
}

.stat-k {
  color: #94a3b8;
}

.stat-v {
  font-family: monospace;
  font-weight: 700;
  color: #f8fafc;
}

.stat-v.alt { color: #f59e0b; }
.stat-v.loss { color: #ef4444; }

.verdict-box {
  background: rgba(30, 41, 59, 0.5);
  padding: 8px 12px;
  border-radius: 8px;
}

.verdict-title {
  font-size: 11px;
  font-weight: 700;
  color: #38bdf8;
  margin-bottom: 4px;
}

.verdict-text {
  font-size: 11.5px;
  color: #cbd5e1;
  line-height: 1.6;
}

.terrain-adv {
  font-size: 11px;
  line-height: 1.5;
  color: #94a3b8;
}

.adv-label {
  color: #10b981;
  font-weight: 700;
  margin-right: 4px;
}

.metrics-bars-box {
  background: rgba(15, 23, 42, 0.7);
  border-radius: 12px;
  padding: 14px 18px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.box-title {
  font-size: 13px;
  font-weight: 700;
  color: #f8fafc;
  margin-bottom: 12px;
}

.bars-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.metric-bar-item {
  display: grid;
  grid-template-columns: 90px 1fr 1fr;
  align-items: center;
  gap: 12px;
}

.metric-name {
  font-size: 11px;
  color: #94a3b8;
}

.bar-track {
  background: rgba(30, 41, 59, 0.8);
  border-radius: 6px;
  height: 16px;
  overflow: hidden;
  position: relative;
}

.bar-fill {
  height: 100%;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 6px;
  font-size: 9.5px;
  font-weight: 700;
  color: #fff;
  font-family: monospace;
  transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.legend-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 18px;
  margin-top: 12px;
  font-size: 11.5px;
}

@media (max-width: 640px) {
  .routes-comparison-grid {
    grid-template-columns: 1fr;
  }
}
</style>
