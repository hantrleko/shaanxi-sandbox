<template>
  <section class="profile-panel map-surface" aria-label="地形高程剖面">
    <header>
      <div>
        <h2>{{ teaching ? '西安至汉中 · 教学剖面' : '地形高程剖面' }}</h2>
        <p>投影直线取样 · 水平距离 · 高程近似值</p>
      </div>
      <button class="map-icon" type="button" aria-label="关闭剖面" @click="$emit('close')"><X :size="17" /></button>
    </header>
    <div class="profile-stat">
      <span>{{ profileData.totalDistanceKm.toFixed(1) }} km</span>
      <span v-if="profileData.minElevation !== null">{{ meters(profileData.minElevation) }}–{{ meters(profileData.maxElevation) }} m</span>
      <span v-else>测线高程缺测</span>
      <button v-if="!teaching" class="map-icon" type="button" aria-label="重新选点" title="重新选点" @click="$emit('reset-line')"><RotateCcw :size="16" /></button>
    </div>
    <svg
      ref="chart" class="profile-chart" :viewBox="'0 0 ' + chartWidth + ' ' + chartHeight"
      role="img" aria-label="高程随水平距离变化的曲线，缺测处留空"
      @pointerdown="onPointerDown" @pointermove="onPointerMove"
    >
      <g v-for="tick in elevationTicks" :key="tick">
        <line :x1="left" :x2="right" :y1="scaleY(tick)" :y2="scaleY(tick)" stroke="#416062" />
        <text :x="left - 5" :y="scaleY(tick) + 3" text-anchor="end">{{ tick }} m</text>
      </g>
      <text :x="left" :y="chartHeight - 3">0 km</text>
      <text :x="right" :y="chartHeight - 3" text-anchor="end">{{ profileData.totalDistanceKm.toFixed(1) }} km</text>
      <g v-for="(segment, index) in segments" :key="index">
        <polygon :points="segment.area" fill="#447879" fill-opacity=".46" />
        <polyline :points="segment.line" fill="none" stroke="#81d3d0" stroke-width="2" stroke-linejoin="round" />
      </g>
      <g v-if="cursor">
        <line :x1="scaleX(cursor)" :x2="scaleX(cursor)" y1="9" :y2="bottom" stroke="#ecc78a" stroke-dasharray="3 3" />
        <circle v-if="cursor.elevationM !== null" :cx="scaleX(cursor)" :cy="scaleY(cursor.elevationM)" r="3.5" fill="#ecc78a" />
      </g>
    </svg>
    <label class="profile-cursor">
      <span class="visually-hidden">沿剖面移动取样点</span>
      <input v-model.number="cursorIndex" type="range" min="0" :max="profileData.points.length - 1" />
      <output v-if="cursor">{{ cursor.distKm.toFixed(1) }} km · {{ cursor.elevationM === null ? '无高程数据' : meters(cursor.elevationM) + ' m' }}</output>
      <span class="profile-help">拖动游标</span>
    </label>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { RotateCcw, X } from 'lucide-vue-next';

const props = defineProps({
  profileData: { type: Object, required: true },
  teaching: Boolean
});
const emit = defineEmits(['close', 'reset-line', 'cursor']);
const chart = ref(null);
const cursorIndex = ref(0);
const cursor = computed(() => props.profileData.points[cursorIndex.value]);
const chartWidth = 600;
const chartHeight = 131;
const left = 48;
const right = 588;
const top = 10;
const bottom = 111;
const meters = (value) => Math.round(value / 10) * 10;

const elevationTicks = computed(() => {
  const low = Math.floor((props.profileData.minElevation ?? 0) / 100) * 100;
  const range = (props.profileData.maxElevation ?? 0) - low;
  const interval = Math.max(100, Math.ceil(range / 400) * 100);
  return Array.from({ length: 5 }, (_, index) => low + interval * index);
});
const scaleX = (point) => left + point.distKm / props.profileData.totalDistanceKm * (right - left);
const scaleY = (height) => {
  const ticks = elevationTicks.value;
  return bottom - (height - ticks[0]) / (ticks[4] - ticks[0]) * (bottom - top);
};

const segments = computed(() => {
  const groups = [];
  let group = [];
  for (const point of props.profileData.points) {
    if (point.elevationM !== null) {
      group.push(point);
    } else if (group.length) {
      groups.push(group);
      group = [];
    }
  }
  if (group.length) groups.push(group);
  return groups.map(points => {
    const line = points.map(point => scaleX(point).toFixed(1) + ',' + scaleY(point.elevationM).toFixed(1)).join(' ');
    return { line, area: scaleX(points[0]) + ',' + bottom + ' ' + line + ' ' + scaleX(points.at(-1)) + ',' + bottom };
  });
});

function chooseAt(event) {
  const svg = chart.value;
  const matrix = svg?.getScreenCTM();
  if (!matrix) return;
  const point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;
  const x = point.matrixTransform(matrix.inverse()).x;
  const dist = Math.min(1, Math.max(0, (x - left) / (right - left))) * props.profileData.totalDistanceKm;
  const nearest = props.profileData.points.reduce((best, candidate, index, points) => (
    Math.abs(candidate.distKm - dist) < Math.abs(points[best].distKm - dist) ? index : best
  ), 0);
  cursorIndex.value = nearest;
}

function onPointerDown(event) {
  chart.value.setPointerCapture?.(event.pointerId);
  chooseAt(event);
}

function onPointerMove(event) {
  if (event.pointerType === 'mouse' || chart.value.hasPointerCapture?.(event.pointerId)) chooseAt(event);
}

watch(() => props.profileData, () => { cursorIndex.value = 0; });
watch(cursor, point => emit('cursor', point), { immediate: true });
onBeforeUnmount(() => emit('cursor', null));
</script>

<style scoped>
.profile-panel {
  position: absolute;
  z-index: 23;
  bottom: calc(var(--safe-bottom) + 14px);
  left: var(--content-left);
  right: calc(var(--map-inline) + 59px);
  max-width: 690px;
  margin-inline: auto;
  padding: 10px 14px;
}
.profile-panel header { display: flex; align-items: center; justify-content: space-between; }
h2 { margin: 0; font-size: 17px; color: var(--map-text); }
header p { margin-top: 3px; color: var(--map-muted); font-size: 11px; }
.profile-stat { display: flex; gap: 14px; align-items: center; color: var(--map-gold); font-variant-numeric: tabular-nums; font-size: 13px; }
.profile-stat .map-icon { margin-left: auto; min-height: 29px; }
.profile-chart { display: block; width: 100%; height: auto; max-height: 131px; touch-action: none; cursor: crosshair; }
.profile-chart text { fill: #d5dfd7; font-size: 10px; font-variant-numeric: tabular-nums; }
.profile-cursor { display: flex; align-items: center; gap: 10px; color: var(--map-muted); font-size: 11px; }
.profile-cursor input { width: 40%; height: 30px; accent-color: var(--map-gold); }
.profile-cursor output { color: var(--map-text); flex: 1; font-variant-numeric: tabular-nums; }
@media (max-width: 760px) and (orientation: portrait) {
  .profile-panel { inset: auto 0 0; padding: 6px 13px max(8px, var(--safe-bottom)); border-radius: 12px 12px 0 0; }
  .profile-chart { min-height: 94px; }
  .profile-help { display: none; }
}
@media (orientation: landscape) and (max-height: 520px) {
  .profile-panel { bottom: calc(var(--safe-bottom) + 4px); }
  .profile-chart { max-height: 84px; }
}
</style>
