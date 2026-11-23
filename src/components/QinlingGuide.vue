<template>
  <aside class="guide-panel map-surface" :class="['sheet-' + sheet, { 'water-station': step === 3 }]" aria-label="秦岭南北导览">
    <button
      type="button" class="sheet-handle" :aria-label="'切换导览抽屉高度'"
      :aria-expanded="sheet !== 'peek'" @click="cycleSheet"
      @touchstart.passive="touchStart = $event.touches[0].clientY"
      @touchend="endSwipe"
    ><span></span></button>
    <div class="guide-kicker">
      <span>秦岭南北 <span class="guide-count">{{ step + 1 }} / {{ QINLING_STATIONS.length }}</span></span>
      <button class="map-icon" type="button" aria-label="退出秦岭导览" title="退出导览" @click="$emit('close')"><X :size="18" /></button>
    </div>
    <h2>{{ station.title }}</h2>
    <p class="guide-prompt" aria-live="polite">{{ prompt }}</p>
    <div class="guide-body">
      <p class="station-details">{{ station.description }}</p>
      <template v-if="step === 1">
        <button
          v-if="!guess && canPick"
          class="map-button primary"
          type="button"
          :aria-pressed="picking"
          @click="$emit('pick')"
        >{{ picking ? '取消选点' : '开始选点' }}</button>
        <button
          v-if="picking"
          class="map-button"
          type="button"
          @click="$emit('pick-center')"
        >标记地图中心</button>
        <template v-if="guess">
          <p class="guide-feedback">已在地图上标记你的判断。</p>
          <div class="guide-buttons">
            <button class="map-button" type="button" @click="$emit('pick')">重选</button>
            <button v-if="!revealed" class="map-button primary" type="button" @click="$emit('reveal')">显示参照线</button>
          </div>
        </template>
        <p v-if="revealed" class="guide-feedback">点线表示秦岭主脊的概略走向。</p>
        <p v-if="!canPick" class="guide-feedback">地图选点暂不可用。观察静态地形后继续。</p>
      </template>
      <template v-if="step === 2">
        <button class="map-button primary" type="button" :disabled="!canMeasure" @click="$emit('profile')">
          {{ hasProfile ? '再次查看剖面' : '生成教学剖面' }}
        </button>
        <p v-if="!canMeasure" class="guide-feedback">高程栅格未就绪。可以稍候重试或查看水系。</p>
      </template>
      <template v-if="step === 3">
        <div class="guide-buttons quiz-options" aria-label="选择水系归属">
          <button class="map-button" type="button" :aria-pressed="answer === 'yellow'" @click="$emit('answer', 'yellow')">渭河入黄河 · 汉江入长江</button>
          <button class="map-button" type="button" :aria-pressed="answer === 'yangtze'" @click="$emit('answer', 'yangtze')">渭河入长江 · 汉江入黄河</button>
        </div>
        <a class="guide-source" :href="QINLING_SOURCE" target="_blank" rel="noopener">水系关系来源 · 陕西省秦岭污染防治专项规划</a>
      </template>
      <button type="button" class="narration" :aria-pressed="speaking" @click="$emit('narrate')">
        <VolumeX v-if="speaking" :size="16" /><Volume2 v-else :size="16" /> {{ speaking ? '停止解说' : '播放解说' }}
      </button>
    </div>
    <nav class="guide-nav" aria-label="导览站点">
      <ol>
        <li v-for="(item, index) in QINLING_STATIONS" :key="item.label" :class="{ current: index === step, passed: index < step }">
          <span :aria-current="index === step ? 'step' : undefined">{{ item.label }}</span>
        </li>
      </ol>
      <div class="station-controls">
        <button class="map-button" type="button" :disabled="step === 0" @click="$emit('step', step - 1)"><ChevronLeft :size="16" /> 上一站</button>
        <button v-if="step < 3" class="map-button next-station" type="button" :disabled="!canAdvance" @click="$emit('step', step + 1)">下一站 <ChevronRight :size="16" /></button>
        <button v-else class="map-button next-station" type="button" :disabled="answer !== 'yellow'" @click="$emit('close')">完成</button>
      </div>
    </nav>
  </aside>
</template>

<script setup>
import { computed } from 'vue';
import { ChevronLeft, ChevronRight, Volume2, VolumeX, X } from 'lucide-vue-next';
import { QINLING_SOURCE, QINLING_STATIONS } from '../data/qinlingGuide.js';

const props = defineProps({
  step: { type: Number, required: true },
  sheet: { type: String, required: true },
  picking: Boolean,
  guess: Boolean,
  revealed: Boolean,
  speaking: Boolean,
  hasProfile: Boolean,
  canPick: Boolean,
  canMeasure: Boolean,
  canAdvance: Boolean,
  answer: String
});
const emit = defineEmits(['step', 'close', 'pick', 'pick-center', 'reveal', 'profile', 'narrate', 'answer', 'update:sheet']);
const station = computed(() => QINLING_STATIONS[props.step]);
const prompt = computed(() => {
  if (props.step !== 3 || !props.answer) return station.value.prompt;
  return props.answer === 'yellow' ? '判断正确。渭河入黄河，汉江入长江。' : '再观察一次。比较秦岭南北两条河。';
});
const sheets = ['peek', 'half', 'full'];
let touchStart = 0;
let lastSwipe = -Infinity;

function cycleSheet() {
  if (performance.now() - lastSwipe < 350) return;
  emit('update:sheet', sheets[(sheets.indexOf(props.sheet) + 1) % sheets.length]);
}

function endSwipe(event) {
  const delta = event.changedTouches[0].clientY - touchStart;
  if (Math.abs(delta) < 28) return;
  lastSwipe = performance.now();
  const index = sheets.indexOf(props.sheet) + (delta > 0 ? -1 : 1);
  emit('update:sheet', sheets[Math.min(sheets.length - 1, Math.max(0, index))]);
}
</script>

<style scoped>
.guide-panel {
  position: absolute;
  z-index: 18;
  inset: var(--map-top) auto auto var(--map-inline);
  width: var(--chapter-width);
  max-height: calc(100dvh - var(--map-top) - var(--safe-bottom) - 18px);
  display: flex;
  flex-direction: column;
  overflow: auto;
  padding: 13px 16px 12px;
}
.guide-kicker { display: flex; align-items: center; justify-content: space-between; color: var(--map-muted); font-size: 12px; }
.guide-kicker .map-icon { margin: -5px -5px -4px 0; }
.guide-count { color: var(--map-gold); margin-left: 8px; font-variant-numeric: tabular-nums; }
h2 { margin-top: 6px; color: var(--map-text); font-size: clamp(22px, 2vw, 28px); line-height: 1.16; font-family: var(--font-serif); }
.guide-prompt { margin-top: 13px; font-size: 16px; line-height: 1.55; font-weight: 630; color: #f2dbad; }
.guide-body { display: grid; justify-items: start; gap: 10px; margin-top: 15px; }
.guide-body p { color: var(--map-muted); font-size: 14px; line-height: 1.6; }
.guide-buttons { width: 100%; display: flex; flex-wrap: wrap; gap: 6px; }
.quiz-options button { width: 100%; }
.guide-body .guide-feedback { color: var(--map-text); }
.guide-source { font-size: 11px; color: var(--map-water); text-underline-offset: 3px; line-height: 1.4; }
.narration { display: inline-flex; align-items: center; gap: 6px; color: var(--map-muted); }
.narration:hover { color: var(--map-gold); }
.guide-nav { display: grid; gap: 9px; margin-top: 12px; }
.guide-nav ol { display: flex; align-items: stretch; gap: 5px; list-style: none; min-width: 0; }
.guide-nav li { flex: 1; text-align: center; min-width: 0; white-space: nowrap; border-top: 2px solid #44615f; color: var(--map-muted); padding-top: 4px; }
.guide-nav li span { font-size: 10px; }
.guide-nav li.current { border-color: var(--map-gold); color: var(--map-gold); }
.guide-nav li.passed { border-color: #789584; }
.station-controls { display: flex; justify-content: space-between; gap: 8px; }
.station-controls button { font-size: 12px; }
.station-controls .next-station { background: #314d4d; border-color: #ad9165; color: #f3d8a8; }
.station-controls .next-station:hover { background: #3b5652; }
.quiz-options button[aria-pressed="true"] { border-color: var(--map-gold); color: #f3d8a8; }
.sheet-handle { display: none; }
@media (max-width: 760px) and (orientation: portrait) {
  .guide-panel {
    inset: auto 0 0;
    width: auto;
    max-height: none;
    height: var(--sheet-size);
    padding: 0 var(--map-inline) var(--safe-bottom);
    border-radius: 13px 13px 0 0;
  }
  .guide-kicker .map-icon { margin: 0; }
  .guide-panel h2 { font-size: 20px; margin-top: -3px; }
  .guide-prompt { font-size: 13px; margin-top: 5px; }
  .guide-body { margin-top: 9px; }
  .sheet-handle { display: grid; min-height: 23px; width: 100%; place-items: center; }
  .sheet-handle span { width: 32px; height: 3px; background: #8ca19a; border-radius: 4px; }
  .sheet-peek .guide-body { display: none; }
  .sheet-peek .guide-nav { margin-top: 4px; }
  .sheet-peek .guide-nav ol { display: none; }
  .sheet-peek .guide-kicker .map-icon { min-height: 30px; }
  .guide-panel .guide-body { min-height: 0; overflow-y: auto; padding: 2px; align-content: start; }
  .guide-nav { flex-shrink: 0; background: var(--map-panel); margin-top: auto; padding-top: 8px; }
  .water-station.sheet-half .station-details { display: none; }
}
@media (orientation: landscape) and (max-height: 520px) {
  .guide-panel { padding: 8px 12px; }
  h2 { font-size: 21px; }
  .guide-prompt, .guide-body { margin-top: 6px; }
}
</style>
