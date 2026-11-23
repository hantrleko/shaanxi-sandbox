<template>
  <aside class="map-tools" aria-label="地图工具" @keydown.esc.stop="closePanel(true)">
    <div class="tool-rail map-surface">
      <button ref="layersButton" class="tool" type="button" :aria-expanded="panelOpen" aria-controls="layer-panel" @click="panelOpen = !panelOpen" aria-label="图层与外观" title="图层与外观">
        <Layers :size="18" /><span>图层</span>
      </button>
      <button v-if="!guideActive && macro" class="tool" type="button" :disabled="!canMeasure" :aria-pressed="isProfiling" @click="act('toggle-profiling')" aria-label="两点剖面测量" title="两点剖面测量">
        <Ruler :size="18" /><span>测量</span>
      </button>
      <button v-if="!guideActive && macro" class="tool" type="button" :disabled="!canPick" :aria-pressed="isProbing" @click="act('toggle-probe')" aria-label="查询此点" title="查询此点">
        <Crosshair :size="18" /><span>查询</span>
      </button>
      <button class="tool compass-tool" type="button" :disabled="!canPick" @click="act('reset-north')" aria-label="重置正北" title="重置正北">
        <Navigation :size="18" :style="{ transform: 'rotate(' + (azimuth - 45) + 'deg)' }" /><span>正北</span>
      </button>
    </div>

    <section v-if="panelOpen" id="layer-panel" class="layer-panel map-surface" aria-label="图层与外观">
      <div class="layer-head">
        <button class="map-button" type="button" :aria-pressed="layersTab" @click="layersTab = true">图层</button>
        <button class="map-button" type="button" :aria-pressed="!layersTab" @click="layersTab = false">外观</button>
        <button class="map-icon" type="button" aria-label="关闭图层面板" @click="closePanel(true)"><X :size="17" /></button>
      </div>
      <div class="layer-options">
        <template v-if="layersTab">
          <p v-if="guideActive">地图图层随导览站点调整。</p>
          <template v-else>
            <label v-for="(label, key) in LAYER_LABELS" :key="key" class="layer-row">
              <span>{{ label }}</span>
              <input type="checkbox" :checked="layers[key]" :disabled="!macro || (analysis && key === 'valleyMist')" @change="$emit('update-layers', { [key]: $event.target.checked })" />
            </label>
          </template>
        </template>
        <template v-else>
          <label class="layer-row">着色
            <select :value="gisMode" :disabled="!canMeasure || !macro || guideActive" @change="$emit('change-gis', $event.target.value)">
              <option value="natural">自然影像</option><option value="hypsometric">高程分层</option>
              <option value="slope">地形坡度</option><option value="ink">青绿山水</option>
            </select>
          </label>
          <label class="layer-row">时段
            <select :value="lightingMode" :disabled="guideActive || analysis" @change="$emit('change-lighting', $event.target.value)">
              <option value="noon">白昼</option><option value="dawn">晨曦</option>
              <option value="sunset">夕照</option><option value="night">夜景</option>
            </select>
          </label>
          <label class="layer-row">季节
            <select :value="seasonMode" :disabled="guideActive || analysis" @change="$emit('change-season', $event.target.value)">
              <option v-for="season in SEASONS_DATA" :key="season.id" :value="season.id">{{ season.name }}</option>
            </select>
          </label>
          <button v-if="!guideActive" class="map-button spin-button" type="button" :aria-pressed="isSpinning" :disabled="!canPick" @click="act('toggle-360-spin')">
            {{ isSpinning ? '停止环绕' : '环绕观赏' }}
          </button>
        </template>
      </div>
    </section>
  </aside>
</template>

<script setup>
import { ref, watch } from 'vue';
import { Crosshair, Layers, Navigation, Ruler, X } from 'lucide-vue-next';
import { LAYER_LABELS } from '../data/mapThemes.js';
import { SEASONS_DATA } from '../data/shaanxiData.js';

const props = defineProps({
  layers: { type: Object, required: true },
  seasonMode: String,
  lightingMode: String,
  gisMode: String,
  azimuth: Number,
  macro: Boolean,
  guideActive: Boolean,
  analysis: Boolean,
  canPick: Boolean,
  canMeasure: Boolean,
  isProfiling: Boolean,
  isProbing: Boolean,
  isSpinning: Boolean
});
const emit = defineEmits(['update-layers', 'change-gis', 'change-lighting', 'change-season',
  'toggle-profiling', 'toggle-probe', 'reset-north', 'toggle-360-spin']);
const panelOpen = ref(false);
const layersTab = ref(true);
const layersButton = ref(null);

function closePanel(restoreFocus = false) {
  if (!panelOpen.value) return;
  panelOpen.value = false;
  if (restoreFocus) layersButton.value?.focus();
}

function act(event) {
  closePanel();
  emit(event);
}

watch(() => [props.isProfiling, props.isProbing, props.guideActive, props.macro], () => closePanel());
</script>

<style scoped>
.map-tools { position: absolute; z-index: 24; top: var(--map-top); right: var(--map-inline); }
.tool-rail { display: grid; padding: 3px; gap: 2px; }
.tool {
  color: var(--map-muted);
  min-width: 47px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  border-radius: 6px;
}
.tool span { font-size: 10px; }
.tool:hover, .tool[aria-pressed="true"], .tool[aria-expanded="true"] { color: var(--map-gold); background: #29474a; }
.compass-tool svg { color: var(--map-gold); }
.layer-panel {
  position: absolute;
  right: 100%;
  top: 0;
  margin-right: 10px;
  width: min(255px, calc(100vw - 84px));
  max-height: calc(100dvh - var(--map-top) - 28px);
  overflow: auto;
  padding: 10px;
}
.layer-head { display: flex; gap: 4px; align-items: center; padding-bottom: 7px; border-bottom: 1px solid var(--map-line); }
.layer-head .map-button, .layer-head .map-icon { min-height: 36px; }
.layer-head .map-icon { margin-inline-start: auto; }
.layer-options { padding: 7px 3px; }
.layer-options p { color: var(--map-muted); padding: 8px 4px; line-height: 1.5; }
.layer-row { display: flex; align-items: center; justify-content: space-between; min-height: 39px; gap: 10px; font-size: 13px; }
.layer-row input { width: 18px; height: 18px; accent-color: var(--map-gold); }
.layer-row select { background: #243d3f; border: 1px solid var(--map-line); padding: 5px 8px; color: inherit; border-radius: 5px; font: inherit; }
.spin-button { margin-top: 8px; width: 100%; }
@media (max-width: 760px) and (orientation: portrait) {
  .tool-rail { padding: 2px; }
  .tool span { display: none; }
  .tool { min-width: 44px; }
}
@media (orientation: landscape) and (max-height: 520px) {
  .tool span { display: none; }
}
</style>
