<template>
  <div v-if="active" class="workshop-modal-overlay">
    <!-- 主窗口卡片 (未处于全屏 FPV 沉浸飞行时呈现) -->
    <div v-if="!isFlying" class="workshop-card glass-panel">
      <!-- 窗口头部 -->
      <div class="card-header">
        <div class="header-title-box">
          <span class="header-icon">🛣️</span>
          <div class="header-titles">
            <div class="main-title">3D 多点研学/自驾路书工坊</div>
            <div class="sub-title">GIS DEM ELEVATION PROFILER & 3D FPV FLYTHROUGH</div>
          </div>
        </div>
        <button class="close-btn" @click="$emit('close')" title="关闭路书工坊">✕</button>
      </div>

      <!-- 模式与路线选择栏 -->
      <div class="route-tabs">
        <button
          v-for="r in presets"
          :key="r.id"
          class="route-tab"
          :class="{ active: currentRouteId === r.id && !isCustomMode }"
          @click="selectPreset(r)"
        >
          <span class="tab-badge">{{ r.badge }}</span>
          <span class="tab-name">{{ r.title.split('·')[0].trim() }}</span>
        </button>
        <button
          class="route-tab custom-tab"
          :class="{ active: isCustomMode }"
          @click="enableCustomMode"
        >
          <span class="tab-badge">自由测绘</span>
          <span class="tab-name">沙盘自定义打点</span>
        </button>
      </div>

      <!-- 路线详述提示 -->
      <div class="route-summary-bar">
        <div class="summary-left">
          <span class="route-tag">{{ activeRoute.tag || '三秦名线' }}</span>
          <span class="route-desc-text">{{ activeRoute.subtitle || '在 3D 沙盘上点击任意位置即可添加连线途经点。' }}</span>
        </div>
        <div class="summary-actions" v-if="isCustomMode">
          <button class="mini-btn" @click="$emit('clear-custom')">清空途经点</button>
          <span class="pts-counter">已选 {{ customPointsCount }} 个点</span>
        </div>
      </div>

      <!-- 核心指标网格 -->
      <div class="metrics-grid">
        <div class="metric-item">
          <div class="m-lbl">路线全程距离</div>
          <div class="m-val">{{ Math.round(activeRoute.totalDistKm || 0) }} <span class="unit">km</span></div>
        </div>
        <div class="metric-item">
          <div class="m-lbl">全程累计爬升</div>
          <div class="m-val peak">+{{ Math.round(activeRoute.climbM || 0) }} <span class="unit">m</span></div>
        </div>
        <div class="metric-item">
          <div class="m-lbl">最高点海拔</div>
          <div class="m-val peak">{{ Math.round(activeRoute.maxElevM || 0) }} <span class="unit">m</span></div>
        </div>
        <div class="metric-item">
          <div class="m-lbl">路书途经站点</div>
          <div class="m-val">{{ (activeRoute.waypoints || []).length }} <span class="unit">站</span></div>
        </div>
      </div>

      <!-- 动态高程剖面图 (SVG) -->
      <div class="chart-wrapper" ref="chartRef" @mousemove="onChartMouseMove" @mouseleave="hoveredPoint = null">
        <svg :viewBox="`0 0 ${chartWidth} ${chartHeight}`" class="profile-svg">
          <defs>
            <linearGradient id="routeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.8" />
              <stop offset="50%" stop-color="#0284c7" stop-opacity="0.4" />
              <stop offset="100%" stop-color="#0b1324" stop-opacity="0.05" />
            </linearGradient>
          </defs>

          <!-- 背景参考标尺线 -->
          <line x1="45" :y1="chartHeight - 32" :x2="chartWidth - 25" :y2="chartHeight - 32" stroke="rgba(255,255,255,0.15)" stroke-width="1" />
          <line x1="45" y1="20" :x2="chartWidth - 25" y2="20" stroke="rgba(255,255,255,0.08)" stroke-dasharray="4,4" />
          <line x1="45" :y1="(chartHeight - 12) / 2" :x2="chartWidth - 25" :y2="(chartHeight - 12) / 2" stroke="rgba(255,255,255,0.08)" stroke-dasharray="4,4" />

          <!-- 海拔标尺文字 -->
          <text x="38" y="24" text-anchor="end" class="scale-text">{{ Math.round(activeRoute.maxElevM || 2500) }}m</text>
          <text x="38" :y="(chartHeight - 12) / 2 + 4" text-anchor="end" class="scale-text">{{ Math.round((activeRoute.maxElevM || 2500) / 2) }}m</text>
          <text x="38" :y="chartHeight - 32" text-anchor="end" class="scale-text">0m</text>

          <!-- 填充区域与曲线 -->
          <polygon :points="polygonPoints" fill="url(#routeGrad)" />
          <polyline :points="polylinePoints" fill="none" stroke="#38bdf8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />

          <!-- 站点高亮圆点与标签 -->
          <g v-for="(wp, wIdx) in waypointChartPositions" :key="wp.name">
            <circle :cx="wp.x" :cy="wp.y" r="4.5" fill="#f59e0b" stroke="#ffffff" stroke-width="1.8" />
            <text :x="wp.x" :y="wp.y - 10" text-anchor="middle" class="wp-chart-label">{{ wp.name }}</text>
          </g>

          <!-- 悬停指示游标 -->
          <g v-if="hoveredPoint">
            <line :x1="hoveredPoint.x" y1="20" :x2="hoveredPoint.x" :y2="chartHeight - 32" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="3,3" />
            <circle :cx="hoveredPoint.x" :cy="hoveredPoint.y" r="5" fill="#38bdf8" stroke="#ffffff" stroke-width="2" />
          </g>
        </svg>

        <!-- 悬停信息浮层 -->
        <div v-if="hoveredPoint" class="chart-tooltip" :style="{ left: hoveredPoint.x + 'px', top: (hoveredPoint.y - 36) + 'px' }">
          <div class="tip-alt">海拔: {{ Math.round(hoveredPoint.elevation) }}m</div>
          <div class="tip-dist">里程: {{ Math.round(hoveredPoint.distKm) }}km</div>
        </div>
      </div>

      <!-- 途经站点流线胶囊 -->
      <div class="waypoints-strip custom-scrollbar">
        <div
          v-for="(wp, idx) in activeRoute.waypoints"
          :key="wp.name"
          class="wp-chip"
          @click="$emit('focus-waypoint', wp)"
          :title="wp.desc"
        >
          <span class="wp-idx">{{ idx + 1 }}</span>
          <span class="wp-name">{{ wp.name }}</span>
          <span class="wp-alt">{{ wp.elevation }}m</span>
        </div>
      </div>

      <!-- 底部操作栏 -->
      <div class="card-footer">
        <div class="footer-left">
          <span class="f-tip">💡 提示：点击站点胶囊可聚焦观察地貌；点击右侧按钮开启第一人称贴地低空飞行。</span>
        </div>
        <div class="footer-right">
          <button class="fly-start-btn" @click="startFPVFlight">
            <svg class="fly-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
            <span>低空飞行预演 (FPV)</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 🚀 第一人称低空飞行座舱 HUD (贴地飞行模式专属) -->
    <div v-else class="flight-cockpit-hud">
      <!-- 顶部仪表条 -->
      <div class="flight-top-bar glass-panel">
        <div class="flight-id-box">
          <span class="flight-blink-dot"></span>
          <span class="flight-title">三秦低空巡航座舱 · FPV</span>
          <span class="flight-route-name">{{ activeRoute.title }}</span>
        </div>

        <div class="flight-gauges">
          <div class="gauge-box">
            <span class="g-lbl">地表真高</span>
            <span class="g-val">{{ currentAltitude }} <span class="g-u">m</span></span>
          </div>
          <div class="gauge-box">
            <span class="g-lbl">巡航地速</span>
            <span class="g-val">{{ Math.round(flightSpeed * 120 + 80) }} <span class="g-u">km/h</span></span>
          </div>
          <div class="gauge-box">
            <span class="g-lbl">飞行进度</span>
            <span class="g-val">{{ Math.round(flightProgress * 100) }} <span class="g-u">%</span></span>
          </div>
        </div>

        <div class="flight-controls">
          <button class="ctrl-btn" @click="toggleFlightPause">
            {{ isFlightPaused ? '▶ 继续' : '⏸ 暂停' }}
          </button>
          <button class="ctrl-btn" @click="cycleSpeed">
            {{ flightSpeed }}x 倍速
          </button>
          <button class="ctrl-btn exit-btn" @click="stopFPVFlight">
            ✕ 退出飞行
          </button>
        </div>
      </div>

      <!-- 中央人工地平仪标线与十字准星 -->
      <div class="crosshair-box">
        <div class="crosshair-h"></div>
        <div class="crosshair-v"></div>
        <div class="horizon-bracket"></div>
      </div>

      <!-- 底部地标接近通知条 -->
      <div class="flight-bottom-hud glass-panel">
        <div class="current-poi-alert" v-if="currentApproachingWp">
          <span class="alert-icon">📍</span>
          <span class="alert-label">当前掠过地标：</span>
          <span class="alert-name">{{ currentApproachingWp.name }} (海拔 {{ currentApproachingWp.elevation }}m)</span>
          <span class="alert-desc">{{ currentApproachingWp.desc }}</span>
        </div>
        <div class="flight-progress-track">
          <div class="track-fill" :style="{ width: (flightProgress * 100) + '%' }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { ROADBOOK_PRESETS } from '../data/shaanxiData.js';
import { soundscape } from '../utils/soundscape.js';

const props = defineProps({
  active: { type: Boolean, default: false },
  customPoints: { type: Array, default: () => [] }
});

const emit = defineEmits([
  'close',
  'select-route',
  'start-fpv',
  'stop-fpv',
  'focus-waypoint',
  'clear-custom'
]);

const presets = ROADBOOK_PRESETS;
const currentRouteId = ref('road_qinling210');
const isCustomMode = ref(false);
const isFlying = ref(false);
const isFlightPaused = ref(false);
const flightSpeed = ref(1);
const flightProgress = ref(0);
const currentAltitude = ref(840);
const currentApproachingWp = ref(null);

const chartRef = ref(null);
const hoveredPoint = ref(null);
const chartWidth = 680;
const chartHeight = 170;

const activeRoute = computed(() => {
  if (isCustomMode.value) {
    // 根据沙盘打点实时构造
    const pts = props.customPoints || [];
    const wps = pts.map((p, i) => ({
      name: `途经点 ${i + 1}`,
      elevation: Math.round(p.y * 180 + 380),
      pos: [p.x, p.y, p.z],
      desc: `坐标: (${p.x.toFixed(1)}, ${p.z.toFixed(1)})`
    }));
    return {
      id: 'custom',
      title: '自由多点测绘路书',
      subtitle: `当前已在三维地形上标绘 ${pts.length} 个途经点。`,
      tag: '自定义测线',
      badge: '自定义',
      totalDistKm: pts.length * 45,
      climbM: pts.length * 320,
      maxElevM: Math.max(...wps.map(w => w.elevation), 1800),
      waypoints: wps
    };
  }
  return presets.find(r => r.id === currentRouteId.value) || presets[0];
});

const customPointsCount = computed(() => (props.customPoints || []).length);

// 剖面 SVG 点阵计算
const waypointChartPositions = computed(() => {
  const wps = activeRoute.value.waypoints || [];
  if (wps.length < 2) return [];

  const leftX = 45;
  const rightX = chartWidth - 25;
  const usableW = rightX - leftX;
  const usableH = chartHeight - 55;
  const maxH = Math.max(activeRoute.value.maxElevM || 2500, 1000);

  return wps.map((wp, i) => {
    const t = i / (wps.length - 1);
    const x = leftX + t * usableW;
    const normH = Math.min(1, Math.max(0, wp.elevation / maxH));
    const y = (chartHeight - 32) - normH * usableH;
    return { name: wp.name, elevation: wp.elevation, x, y };
  });
});

const polylinePoints = computed(() => {
  return waypointChartPositions.value.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
});

const polygonPoints = computed(() => {
  if (!polylinePoints.value) return '';
  const leftX = 45;
  const rightX = chartWidth - 25;
  const bottomY = chartHeight - 32;
  return `${leftX},${bottomY} ${polylinePoints.value} ${rightX},${bottomY}`;
});

const selectPreset = (route) => {
  isCustomMode.value = false;
  currentRouteId.value = route.id;
  soundscape.playClick();
  emit('select-route', route);
};

const enableCustomMode = () => {
  isCustomMode.value = true;
  soundscape.playClick();
};

const onChartMouseMove = (e) => {
  if (!chartRef.value || waypointChartPositions.value.length < 2) return;
  const rect = chartRef.value.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const scale = chartWidth / rect.width;
  const svgX = mouseX * scale;

  const leftX = 45;
  const rightX = chartWidth - 25;
  if (svgX < leftX || svgX > rightX) {
    hoveredPoint.value = null;
    return;
  }

  const t = (svgX - leftX) / (rightX - leftX);
  const wps = activeRoute.value.waypoints;
  const fIdx = t * (wps.length - 1);
  const i0 = Math.floor(fIdx);
  const i1 = Math.min(wps.length - 1, i0 + 1);
  const frac = fIdx - i0;

  const elev = wps[i0].elevation * (1 - frac) + wps[i1].elevation * frac;
  const dist = t * (activeRoute.value.totalDistKm || 200);

  const maxH = Math.max(activeRoute.value.maxElevM || 2500, 1000);
  const normH = Math.min(1, Math.max(0, elev / maxH));
  const svgY = (chartHeight - 32) - normH * (chartHeight - 55);

  hoveredPoint.value = { x: svgX, y: svgY, elevation: elev, distKm: dist };
};

// 飞行预演控制
const startFPVFlight = () => {
  isFlying.value = true;
  isFlightPaused.value = false;
  flightProgress.value = 0;
  flightSpeed.value = 1;
  soundscape.init();
  emit('start-fpv', {
    route: activeRoute.value,
    onProgress: (prog, alt, currentWp) => {
      flightProgress.value = prog;
      currentAltitude.value = Math.round(alt);
      currentApproachingWp.value = currentWp;
    },
    onComplete: () => {
      isFlying.value = false;
    }
  });
};

const stopFPVFlight = () => {
  isFlying.value = false;
  emit('stop-fpv');
};

const toggleFlightPause = () => {
  isFlightPaused.value = !isFlightPaused.value;
  // 通过事件通知 Canvas 暂停/继续
};

const cycleSpeed = () => {
  flightSpeed.value = flightSpeed.value === 1 ? 2 : flightSpeed.value === 2 ? 4 : 1;
};

watch(() => props.active, (val) => {
  if (val) {
    emit('select-route', activeRoute.value);
  } else {
    isFlying.value = false;
  }
});
</script>

<style scoped>
.workshop-modal-overlay {
  position: absolute;
  inset: 0;
  z-index: 25;
  pointer-events: none;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 24px;
}

.workshop-card {
  pointer-events: auto;
  width: 92%;
  max-width: 820px;
  background: rgba(10, 16, 28, 0.94);
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8), 0 0 25px rgba(56, 189, 248, 0.12);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  0% { transform: translateY(30px); opacity: 0; }
  100% { transform: translateY(0); opacity: 1; }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.header-title-box {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-icon {
  font-size: 20px;
}

.main-title {
  font-size: 15px;
  font-weight: 700;
  color: #f8fafc;
}

.sub-title {
  font-size: 9px;
  color: #64748b;
  letter-spacing: 0.06em;
}

.close-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.route-tabs {
  display: flex;
  gap: 6px;
  padding: 10px 20px 6px;
  overflow-x: auto;
}

.route-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 6px 12px;
  border-radius: 8px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.route-tab:hover {
  background: rgba(56, 189, 248, 0.08);
  color: #e2e8f0;
}

.route-tab.active {
  background: rgba(56, 189, 248, 0.18);
  border-color: #38bdf8;
  color: #38bdf8;
  font-weight: 600;
}

.tab-badge {
  font-size: 9px;
  padding: 1px 4px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
}

.tab-name {
  font-size: 11.5px;
}

.route-summary-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 20px 8px;
}

.summary-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.route-tag {
  font-size: 9.5px;
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  padding: 2px 6px;
  border-radius: 4px;
  font-weight: 600;
}

.route-desc-text {
  font-size: 11px;
  color: #94a3b8;
}

.summary-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mini-btn {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  cursor: pointer;
}

.pts-counter {
  font-size: 10px;
  color: #64748b;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 6px 20px 10px;
}

.metric-item {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 6px 12px;
  border-radius: 8px;
}

.m-lbl {
  font-size: 9px;
  color: #64748b;
}

.m-val {
  font-size: 13.5px;
  font-weight: 700;
  color: #f8fafc;
}

.m-val.peak {
  color: #38bdf8;
}

.m-val .unit {
  font-size: 10px;
  font-weight: 400;
  color: #64748b;
}

.chart-wrapper {
  position: relative;
  padding: 0 20px;
}

.profile-svg {
  width: 100%;
  height: 120px;
  display: block;
}

.scale-text {
  font-size: 9.5px;
  fill: #64748b;
  font-family: monospace;
}

.wp-chart-label {
  font-size: 9.5px;
  fill: #cbd5e1;
  font-weight: 600;
}

.chart-tooltip {
  position: absolute;
  transform: translate(-50%, -100%);
  background: rgba(15, 23, 42, 0.95);
  border: 1px solid #38bdf8;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 10px;
  color: #f8fafc;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  white-space: nowrap;
}

.tip-alt {
  color: #38bdf8;
  font-weight: 700;
}

.tip-dist {
  color: #94a3b8;
}

.waypoints-strip {
  display: flex;
  gap: 6px;
  padding: 8px 20px;
  overflow-x: auto;
}

.wp-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 3px 8px;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.wp-chip:hover {
  background: rgba(56, 189, 248, 0.12);
  border-color: rgba(56, 189, 248, 0.3);
}

.wp-idx {
  font-size: 9px;
  font-weight: 700;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.15);
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wp-name {
  font-size: 11px;
  color: #e2e8f0;
}

.wp-alt {
  font-size: 9.5px;
  color: #64748b;
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(6, 10, 20, 0.4);
}

.f-tip {
  font-size: 10px;
  color: #64748b;
}

.fly-start-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background: linear-gradient(135deg, #0284c7, #0369a1);
  border: 1px solid rgba(56, 189, 248, 0.4);
  color: #ffffff;
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 16px rgba(2, 132, 199, 0.35);
}

.fly-start-btn:hover {
  background: linear-gradient(135deg, #0369a1, #075985);
  box-shadow: 0 6px 20px rgba(56, 189, 248, 0.5);
  transform: translateY(-1px);
}

.fly-svg {
  width: 14px;
  height: 14px;
}

/* 🚀 FPV 飞行座舱 HUD 样式 */
.flight-cockpit-hud {
  pointer-events: auto;
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 24px;
  pointer-events: none;
}

.flight-top-bar {
  pointer-events: auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  border-radius: 12px;
  background: rgba(10, 16, 28, 0.88);
  border: 1px solid rgba(56, 189, 248, 0.3);
  backdrop-filter: blur(12px);
}

.flight-id-box {
  display: flex;
  align-items: center;
  gap: 8px;
}

.flight-blink-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 10px #22c55e;
  animation: pulse 1.2s infinite;
}

.flight-title {
  font-size: 11px;
  font-weight: 700;
  color: #38bdf8;
  letter-spacing: 0.05em;
}

.flight-route-name {
  font-size: 11px;
  color: #94a3b8;
  padding-left: 6px;
  border-left: 1px solid rgba(255, 255, 255, 0.15);
}

.flight-gauges {
  display: flex;
  align-items: center;
  gap: 24px;
}

.gauge-box {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.g-lbl {
  font-size: 9px;
  color: #64748b;
}

.g-val {
  font-size: 15px;
  font-weight: 800;
  color: #f8fafc;
  font-family: monospace;
}

.g-u {
  font-size: 10px;
  font-weight: 400;
  color: #38bdf8;
}

.flight-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ctrl-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #f1f5f9;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.ctrl-btn:hover {
  background: rgba(56, 189, 248, 0.2);
  border-color: #38bdf8;
}

.ctrl-btn.exit-btn {
  background: rgba(239, 68, 68, 0.2);
  border-color: rgba(239, 68, 68, 0.4);
  color: #fca5a5;
}

.ctrl-btn.exit-btn:hover {
  background: rgba(239, 68, 68, 0.4);
}

/* 准星地平指示 */
.crosshair-box {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 140px;
  height: 140px;
  pointer-events: none;
  opacity: 0.65;
}

.crosshair-h {
  position: absolute;
  top: 50%;
  left: 10px;
  right: 10px;
  height: 1px;
  background: rgba(56, 189, 248, 0.6);
}

.crosshair-v {
  position: absolute;
  left: 50%;
  top: 10px;
  bottom: 10px;
  width: 1px;
  background: rgba(56, 189, 248, 0.6);
}

.horizon-bracket {
  position: absolute;
  inset: 0;
  border: 1px solid rgba(56, 189, 248, 0.25);
  border-radius: 50%;
}

.flight-bottom-hud {
  pointer-events: auto;
  align-self: center;
  width: 90%;
  max-width: 680px;
  padding: 10px 18px;
  border-radius: 12px;
  background: rgba(10, 16, 28, 0.88);
  border: 1px solid rgba(56, 189, 248, 0.3);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.current-poi-alert {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11.5px;
}

.alert-name {
  font-weight: 700;
  color: #38bdf8;
}

.alert-desc {
  color: #94a3b8;
  font-size: 10.5px;
  margin-left: 4px;
}

.flight-progress-track {
  width: 100%;
  height: 4px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.track-fill {
  height: 100%;
  background: linear-gradient(90deg, #0284c7, #38bdf8);
  transition: width 0.15s ease-out;
}
</style>
