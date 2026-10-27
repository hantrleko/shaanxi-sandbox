<template>
  <div v-if="active && profileData" class="profiler-modal">
    <div class="profiler-card">
      <div class="card-header">
        <div class="title-box">
          <span class="icon">📐</span>
          <div class="text">
            <div class="main-title">地表测绘剖面分析仪</div>
            <div class="sub-title">GIS DEM 物理海拔采样与起伏剖面</div>
          </div>
        </div>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <!-- 统计指标网格 -->
      <div class="metrics-grid">
        <div class="metric-item">
          <div class="metric-label">测线实地距离</div>
          <div class="metric-val">{{ (profileData.totalDistanceKm || 0).toFixed(1) }} <span class="unit">km</span></div>
        </div>
        <div class="metric-item">
          <div class="metric-label">最高点海拔</div>
          <div class="metric-val peak">{{ Math.round(profileData.maxElevation || 0) }} <span class="unit">m</span></div>
        </div>
        <div class="metric-item">
          <div class="metric-label">最低点海拔</div>
          <div class="metric-val valley">{{ Math.round(profileData.minElevation || 0) }} <span class="unit">m</span></div>
        </div>
        <div class="metric-item">
          <div class="metric-label">极端高差 / 坡度</div>
          <div class="metric-val">{{ Math.round((profileData.maxElevation || 0) - (profileData.minElevation || 0)) }} <span class="unit">m</span> <span class="slope">({{ (profileData.averageSlope || 0).toFixed(1) }}%)</span></div>
        </div>
      </div>

      <!-- SVG 剖面图表 -->
      <div class="chart-container" ref="chartRef" @mousemove="onChartMouseMove" @mouseleave="hoveredPoint = null">
        <svg :viewBox="`0 0 ${chartWidth} ${chartHeight}`" class="profile-svg">
          <defs>
            <linearGradient id="profileGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.75" />
              <stop offset="60%" stop-color="#0284c7" stop-opacity="0.35" />
              <stop offset="100%" stop-color="#0f172a" stop-opacity="0.05" />
            </linearGradient>
          </defs>

          <!-- 背景参考标尺线 -->
          <line x1="40" :y1="chartHeight - 30" :x2="chartWidth - 20" :y2="chartHeight - 30" stroke="rgba(255,255,255,0.15)" stroke-width="1" />
          <line x1="40" y1="20" :x2="chartWidth - 20" y2="20" stroke="rgba(255,255,255,0.08)" stroke-dasharray="4,4" />
          <line x1="40" :y1="(chartHeight - 10) / 2" :x2="chartWidth - 20" :y2="(chartHeight - 10) / 2" stroke="rgba(255,255,255,0.08)" stroke-dasharray="4,4" />

          <!-- 海拔刻度标注 -->
          <text x="34" y="24" text-anchor="end" class="scale-text">{{ Math.round(profileData.maxElevation || 3500) }}m</text>
          <text x="34" :y="(chartHeight - 10) / 2 + 4" text-anchor="end" class="scale-text">{{ Math.round(((profileData.maxElevation || 3500) + (profileData.minElevation || 0)) / 2) }}m</text>
          <text x="34" :y="chartHeight - 30" text-anchor="end" class="scale-text">{{ Math.round(profileData.minElevation || 0) }}m</text>

          <!-- 填充区域与曲线 -->
          <polygon :points="polygonPoints" fill="url(#profileGrad)" />
          <polyline :points="polylinePoints" fill="none" stroke="#38bdf8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" />

          <!-- 悬停指示游标 -->
          <g v-if="hoveredPoint">
            <line :x1="hoveredPoint.svgX" y1="20" :x2="hoveredPoint.svgX" :y2="chartHeight - 30" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="3,3" />
            <circle :cx="hoveredPoint.svgX" :cy="hoveredPoint.svgY" r="4.5" fill="#f59e0b" stroke="#fff" stroke-width="1.5" />
          </g>
        </svg>

        <!-- 悬停信息浮层 -->
        <div v-if="hoveredPoint" class="hover-tooltip" :style="{ left: hoveredPoint.svgX + 'px', top: (hoveredPoint.svgY - 35) + 'px' }">
          <div class="tip-alt">海拔: {{ Math.round(hoveredPoint.elevationM) }}m</div>
          <div class="tip-dist">距起点: {{ hoveredPoint.distKm.toFixed(1) }}km</div>
        </div>
      </div>

      <!-- 操作按钮栏 -->
      <div class="card-footer">
        <div class="guide-text">
          💡 提示：在三维沙盘上再次点击起点与终点即可更新测绘路线。
        </div>
        <div class="action-btns">
          <button class="reset-btn" @click="$emit('reset-line')">🔄 重新拉线</button>
          <button class="done-btn" @click="$emit('close')">完成测绘</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  active: { type: Boolean, default: false },
  profileData: { type: Object, default: null }
});

defineEmits(['close', 'reset-line']);

const chartRef = ref(null);
const hoveredPoint = ref(null);
const chartWidth = 580;
const chartHeight = 150;

const polylinePoints = computed(() => {
  if (!props.profileData || !props.profileData.points || props.profileData.points.length < 2) return '';
  const pts = props.profileData.points;
  const minH = props.profileData.minElevation;
  const maxH = Math.max(props.profileData.maxElevation, minH + 10);
  const leftX = 40;
  const rightX = chartWidth - 20;
  const usableW = rightX - leftX;
  const usableH = chartHeight - 50;

  return pts.map((p, i) => {
    const t = i / (pts.length - 1);
    const x = leftX + t * usableW;
    const normH = (p.elevationM - minH) / (maxH - minH);
    const y = (chartHeight - 30) - normH * usableH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
});

const polygonPoints = computed(() => {
  if (!polylinePoints.value) return '';
  const leftX = 40;
  const rightX = chartWidth - 20;
  const bottomY = chartHeight - 30;
  return `${leftX},${bottomY} ${polylinePoints.value} ${rightX},${bottomY}`;
});

const onChartMouseMove = (e) => {
  if (!chartRef.value || !props.profileData || !props.profileData.points) return;
  const rect = chartRef.value.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const scale = chartWidth / rect.width;
  const svgMouseX = mouseX * scale;

  const leftX = 40;
  const rightX = chartWidth - 20;
  if (svgMouseX < leftX || svgMouseX > rightX) {
    hoveredPoint.value = null;
    return;
  }

  const t = (svgMouseX - leftX) / (rightX - leftX);
  const pts = props.profileData.points;
  const idx = Math.min(pts.length - 1, Math.max(0, Math.round(t * (pts.length - 1))));
  const p = pts[idx];

  const minH = props.profileData.minElevation;
  const maxH = Math.max(props.profileData.maxElevation, minH + 10);
  const normH = (p.elevationM - minH) / (maxH - minH);
  const svgY = (chartHeight - 30) - normH * (chartHeight - 50);

  hoveredPoint.value = {
    ...p,
    svgX: leftX + (idx / (pts.length - 1)) * (rightX - leftX),
    svgY
  };
};
</script>

<style scoped>
.profiler-modal {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 60;
  pointer-events: auto;
  width: 90%;
  max-width: 640px;
}

.profiler-card {
  background: rgba(10, 15, 25, 0.94);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(56, 189, 248, 0.45);
  border-radius: 16px;
  padding: 16px 20px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(56, 189, 248, 0.2);
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.title-box {
  display: flex;
  align-items: center;
  gap: 10px;
}

.title-box .icon {
  font-size: 20px;
}

.main-title {
  font-size: 14px;
  font-weight: 700;
  color: #f8fafc;
}

.sub-title {
  font-size: 11px;
  color: #94a3b8;
}

.close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
}

.close-btn:hover {
  color: #f43f5e;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  background: rgba(15, 23, 42, 0.7);
  padding: 8px 12px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.metric-label {
  font-size: 10px;
  color: #94a3b8;
}

.metric-val {
  font-size: 14px;
  font-weight: 700;
  font-family: monospace;
  color: #38bdf8;
}

.metric-val .unit {
  font-size: 10px;
  color: #64748b;
  font-weight: normal;
}

.metric-val.peak { color: #f43f5e; }
.metric-val.valley { color: #10b981; }
.metric-val .slope { font-size: 11px; color: #f59e0b; margin-left: 2px; }

.chart-container {
  position: relative;
  width: 100%;
  height: 140px;
  background: rgba(6, 10, 18, 0.65);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  overflow: hidden;
  cursor: crosshair;
}

.profile-svg {
  width: 100%;
  height: 100%;
}

.scale-text {
  font-size: 9px;
  fill: #64748b;
  font-family: monospace;
}

.hover-tooltip {
  position: absolute;
  transform: translate(-50%, -100%);
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid #f59e0b;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  color: #fff;
  white-space: nowrap;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6);
}

.tip-alt { color: #fef08a; font-weight: 700; }
.tip-dist { color: #94a3b8; font-size: 9.5px; }

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.guide-text {
  font-size: 11px;
  color: #94a3b8;
}

.action-btns {
  display: flex;
  align-items: center;
  gap: 8px;
}

.reset-btn {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #cbd5e1;
  padding: 4px 12px;
  border-radius: 14px;
  font-size: 11.5px;
  cursor: pointer;
}

.reset-btn:hover {
  border-color: #38bdf8;
  color: #38bdf8;
}

.done-btn {
  background: #0284c7;
  border: 1px solid #38bdf8;
  color: #fff;
  padding: 4px 14px;
  border-radius: 14px;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
}

.done-btn:hover {
  background: #0369a1;
}

@media (max-width: 600px) {
  .metrics-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
