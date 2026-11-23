<template>
  <aside
    v-if="elevation || slope || layers.rivers || layers.silkRoad || layers.shuRoads || layers.qinZhiDao || layers.qinlingLine"
    class="map-legend map-surface"
    aria-label="地图图例"
  >
    <template v-if="elevation || slope">
      <div>{{ elevation ? '高程（m）' : '坡度（°）' }}</div>
      <div class="legend-ramp" :style="{ background: gradient }"></div>
      <div class="legend-values"><span>{{ elevation ? '150' : '0' }}</span><span>{{ elevation ? '3800' : '35+' }}</span></div>
      <p>灰色为无数据</p>
    </template>
    <template v-else>
      <div v-if="layers.rivers"><i class="legend-river"></i>{{ waterNames ? '渭河、汉江与黄河（概略）' : '主要水系（概略）' }}</div>
      <div v-if="layers.qinlingLine"><i class="legend-ridge"></i>秦岭主脊示意</div>
      <div v-if="layers.silkRoad || layers.shuRoads || layers.qinZhiDao"><i class="legend-road"></i>历史路线示意</div>
    </template>
  </aside>
</template>

<script setup>
import { computed } from 'vue';
import { ELEVATION_STOPS, SLOPE_STOPS } from '../data/mapThemes.js';

const props = defineProps({ layers: { type: Object, required: true }, mode: String, waterNames: Boolean });
const elevation = computed(() => props.mode === 'hypsometric');
const slope = computed(() => props.mode === 'slope');
const gradient = computed(() => {
  const positions = elevation.value ? [0, 15.1, 39.7, 67.1, 100] : [0, 28.6, 57.1, 100];
  const colors = elevation.value ? ELEVATION_STOPS : SLOPE_STOPS;
  return 'linear-gradient(90deg, ' + colors.map((color, index) => color + ' ' + positions[index] + '%').join(', ') + ')';
});
</script>

<style scoped>
.map-legend {
  position: absolute;
  bottom: calc(var(--map-bottom) + 4px);
  right: var(--map-inline);
  z-index: 15;
  padding: 8px 10px;
  font-size: 11px;
  color: var(--map-text);
  line-height: 1.55;
  pointer-events: none;
}
.map-legend > div { display: flex; gap: 6px; align-items: center; }
.legend-river, .legend-ridge, .legend-road { display: inline-block; width: 21px; }
.legend-river { border-top: 2px solid var(--map-water); }
.legend-ridge { border-top: 2px dotted #e0d9a0; }
.legend-road { border-top: 2px dashed #e4ad71; }
.legend-ramp { height: 6px; margin: 5px 0 1px; width: 118px; border-radius: 2px; }
.map-legend .legend-values { justify-content: space-between; font-variant-numeric: tabular-nums; }
.map-legend p { color: var(--map-muted); margin-top: 4px; }
@media (max-width: 760px) and (orientation: portrait) { .map-legend { padding: 5px 7px; font-size: 10px; } }
</style>
