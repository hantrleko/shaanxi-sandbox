<template>
  <div class="right-toolbar-root">
    <!-- 垂直主微轨 (Glass 悬浮柱) -->
    <aside class="right-rail glass-panel" aria-label="沙盒环境与图层控制轨">
      <!-- 1. 图层控制展开按钮 -->
      <button
        class="rail-btn"
        :class="{ active: activeFlyout === 'layers' }"
        @click="toggleFlyout('layers')"
        title="图层控制 (L) - 切换省界、水系、秦岭线与丝路"
        aria-label="图层控制"
      >
        <Layers :size="17" />
        <span class="rail-lbl">图层</span>
      </button>

      <!-- 2. 四季气候流转按钮 -->
      <button
        class="rail-btn season-btn"
        :class="{ active: activeFlyout === 'season' }"
        @click="toggleFlyout('season')"
        title="四季气候 (S) - 春花、夏翠、秋枫、冬雪流转"
        aria-label="四季气候"
      >
        <Sparkles :size="17" />
        <span class="rail-lbl">四季</span>
        <span class="season-dot" :class="seasonMode"></span>
      </button>

      <!-- 3. 时段光照调节按钮 -->
      <button
        class="rail-btn"
        :class="{ active: activeFlyout === 'lighting' }"
        @click="toggleFlyout('lighting')"
        title="光影时间 - 晨曦、正午、夕照氛围切换"
        aria-label="光影时间"
      >
        <SunMedium :size="17" />
        <span class="rail-lbl">光照</span>
      </button>

      <div class="rail-divider"></div>

      <!-- 4. 三维罗盘与复位正北 -->
      <button
        class="rail-btn compass-btn"
        @click="$emit('reset-north')"
        :title="`航向 ${azimuth}° · 点击重置正北 (N)`"
        aria-label="重置正北"
      >
        <div class="compass-dial" :style="{ transform: `rotate(${-azimuth}deg)` }">
          <div class="pointer-north">N</div>
          <div class="pointer-south"></div>
        </div>
        <span class="rail-lbl">{{ azimuth }}°</span>
      </button>

      <!-- 5. 遥测信息速览气泡 -->
      <div class="rail-telemetry" :title="`遥感源: DEM 30m · 仰角: ${pitch}°`">
        <span class="tele-tag">3D</span>
        <span class="tele-pitch">{{ pitch }}°</span>
      </div>
    </aside>

    <!-- 飞出式详情交互抽屉 (Flyout Panels) -->
    <transition name="flyout">
      <div v-if="activeFlyout" class="flyout-card glass-panel">
        <div class="flyout-header">
          <div class="flyout-title">
            <component :is="flyoutIcon" :size="15" class="flyout-icon" />
            <span>{{ flyoutTitle }}</span>
          </div>
          <button class="flyout-close" @click="activeFlyout = null" title="关闭面板">
            <X :size="14" />
          </button>
        </div>

        <!-- 飞出内容 1: 图层控制 -->
        <div v-if="activeFlyout === 'layers'" class="flyout-body">
          <label
            v-for="ly in LAYER_ITEMS"
            :key="ly.key"
            class="layer-toggle-row"
            :class="{ active: layers[ly.key] }"
          >
            <div class="ly-left">
              <span class="ly-color-dot" :style="{ background: ly.color }"></span>
              <span class="ly-name">{{ ly.name }}</span>
            </div>
            <input
              type="checkbox"
              :checked="layers[ly.key]"
              @change="toggleLayer(ly.key)"
              class="ly-checkbox"
            />
          </label>
        </div>

        <!-- 飞出内容 2: 四季气候 -->
        <div v-if="activeFlyout === 'season'" class="flyout-body seasons-grid">
          <button
            v-for="s in SEASON_ITEMS"
            :key="s.id"
            class="season-tile"
            :class="{ active: seasonMode === s.id }"
            @click="$emit('change-season', s.id)"
          >
            <span class="s-icon">{{ s.icon }}</span>
            <div class="s-info">
              <span class="s-name">{{ s.name }}</span>
              <span class="s-desc">{{ s.desc }}</span>
            </div>
          </button>
        </div>

        <!-- 飞出内容 3: 光照时段 -->
        <div v-if="activeFlyout === 'lighting'" class="flyout-body lighting-grid">
          <button
            v-for="l in LIGHTING_ITEMS"
            :key="l.id"
            class="light-tile"
            :class="{ active: lightingMode === l.id }"
            @click="$emit('change-lighting', l.id)"
          >
            <component :is="l.icon" :size="18" class="light-icon" />
            <div class="l-info">
              <span class="l-name">{{ l.name }}</span>
              <span class="l-desc">{{ l.desc }}</span>
            </div>
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import {
  Layers,
  Sparkles,
  SunMedium,
  Sun,
  Sunset,
  Sunrise,
  X
} from 'lucide-vue-next';

const props = defineProps({
  layers: {
    type: Object,
    default: () => ({ border: true, rivers: true, qinlingLine: true, silkRoad: true, pois: true, cultural: false })
  },
  seasonMode: { type: String, default: 'natural' },
  lightingMode: { type: String, default: 'dawn' },
  azimuth: { type: Number, default: 0 },
  pitch: { type: Number, default: 35 }
});

const emit = defineEmits([
  'update-layers',
  'change-season',
  'change-lighting',
  'reset-north'
]);

const activeFlyout = ref(null);

const LAYER_ITEMS = [
  { key: 'border', name: '三秦省界与政区轮廓', color: '#38bdf8' },
  { key: 'rivers', name: '黄河/长江水系脉络', color: '#06b6d4' },
  { key: 'qinlingLine', name: '秦岭 800mm 气候分界线', color: '#10b981' },
  { key: 'silkRoad', name: '丝绸之路流金干线', color: '#f59e0b' },
  { key: 'pois', name: '3D 空间地标信标 (POI)', color: '#a855f7' }
];

const SEASON_ITEMS = [
  { id: 'natural', name: '自然遥感', icon: '🛰️', desc: '真实高精卫星地貌' },
  { id: 'spring', name: '春 · 秦巴花海', icon: '🌸', desc: '汉中金黄油菜花微光' },
  { id: 'summer', name: '夏 · 翠峦云海', icon: '🌲', desc: '秦岭翡翠高饱和浓绿' },
  { id: 'autumn', name: '秋 · 太白金枫', icon: '🍁', desc: '层林尽染与落叶松' },
  { id: 'winter', name: '冬 · 北国雪原', icon: '❄️', desc: '太白覆雪与漫天飞雪' }
];

const LIGHTING_ITEMS = [
  { id: 'dawn', name: '晨曦朝霞', icon: Sunrise, desc: '金光初照 · 温暖晨辉' },
  { id: 'noon', name: '正午纯阳', icon: Sun, desc: '通透高亮 · 真实光影' },
  { id: 'sunset', name: '夕照霞光', icon: Sunset, desc: '残阳如血 · 紫霞映山' }
];

const flyoutTitle = computed(() => {
  if (activeFlyout.value === 'layers') return '沙盒地质与地理图层';
  if (activeFlyout.value === 'season') return '四季气候流转着色器';
  if (activeFlyout.value === 'lighting') return '太阳高度角与时序光照';
  return '';
});

const flyoutIcon = computed(() => {
  if (activeFlyout.value === 'layers') return Layers;
  if (activeFlyout.value === 'season') return Sparkles;
  if (activeFlyout.value === 'lighting') return SunMedium;
  return Layers;
});

const toggleFlyout = (key) => {
  activeFlyout.value = activeFlyout.value === key ? null : key;
};

const toggleLayer = (key) => {
  const updated = { ...props.layers, [key]: !props.layers[key] };
  emit('update-layers', updated);
};
</script>

<style scoped>
.right-toolbar-root {
  position: absolute;
  top: 76px;
  right: 18px;
  z-index: 30;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  pointer-events: auto;
}

.right-rail {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 8px 6px;
  background: rgba(11, 26, 43, 0.88);
  border: 1px solid rgba(56, 189, 248, 0.28);
  border-radius: var(--radius-md, 12px);
  box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

.rail-btn {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-sm, 8px);
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--text-muted, #94a3b8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  cursor: pointer;
  transition: all var(--motion-fast, 0.15s);
}

.rail-btn:hover {
  background: rgba(56, 189, 248, 0.15);
  border-color: rgba(56, 189, 248, 0.4);
  color: #fff;
  transform: translateX(-1px);
}

.rail-btn.active {
  background: rgba(56, 189, 248, 0.25);
  border-color: var(--brand-cyan, #38bdf8);
  color: var(--brand-cyan, #38bdf8);
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.35);
}

.rail-lbl {
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.season-dot {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #38bdf8;
}

.season-dot.spring { background: #fbbf24; }
.season-dot.summer { background: #22c55e; }
.season-dot.autumn { background: #f97316; }
.season-dot.winter { background: #e0f2fe; }

.rail-divider {
  width: 24px;
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 3px 0;
}

/* 罗盘样式 */
.compass-btn {
  height: 48px;
}

.compass-dial {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 1px solid rgba(56, 189, 248, 0.35);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease-out;
}

.pointer-north {
  width: 0;
  height: 0;
  border-left: 3.5px solid transparent;
  border-right: 3.5px solid transparent;
  border-bottom: 7px solid #ef4444;
  font-size: 7px;
  font-weight: 800;
  color: #ef4444;
  line-height: 0;
}

.pointer-south {
  width: 0;
  height: 0;
  border-left: 3.5px solid transparent;
  border-right: 3.5px solid transparent;
  border-top: 6px solid #cbd5e1;
}

.rail-telemetry {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4px;
  gap: 1px;
  font-family: var(--font-mono, monospace);
  font-size: 9px;
  color: var(--text-dim, #64748b);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  width: 100%;
}

.tele-tag {
  color: var(--brand-cyan, #38bdf8);
  font-weight: 700;
}

/* 飞出式抽屉面板 (Flyout) */
.flyout-card {
  width: 260px;
  background: rgba(11, 26, 43, 0.95);
  border: 1px solid rgba(56, 189, 248, 0.35);
  border-radius: var(--radius-md, 12px);
  box-shadow: 0 16px 40px -8px rgba(0, 0, 0, 0.8), 0 0 24px rgba(2, 132, 199, 0.2);
  overflow: hidden;
  animation: slideLeft 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideLeft {
  from { opacity: 0; transform: translateX(12px); }
  to { opacity: 1; transform: translateX(0); }
}

.flyout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(6, 13, 23, 0.4);
}

.flyout-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--text-base, 13px);
  font-weight: 700;
  color: #fff;
}

.flyout-icon {
  color: var(--brand-cyan, #38bdf8);
}

.flyout-close {
  background: transparent;
  border: none;
  color: var(--text-muted, #94a3b8);
  cursor: pointer;
  padding: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.15s;
}

.flyout-close:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

.flyout-body {
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 380px;
  overflow-y: auto;
}

/* 图层选择行 */
.layer-toggle-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: var(--radius-sm, 6px);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  cursor: pointer;
  transition: all 0.15s;
}

.layer-toggle-row:hover {
  background: rgba(56, 189, 248, 0.1);
  border-color: rgba(56, 189, 248, 0.3);
}

.layer-toggle-row.active {
  border-color: rgba(56, 189, 248, 0.4);
}

.ly-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ly-color-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  box-shadow: 0 0 6px currentColor;
}

.ly-name {
  font-size: var(--text-sm, 12px);
  color: #f1f5f9;
  font-weight: 500;
}

.ly-checkbox {
  accent-color: var(--brand-cyan, #38bdf8);
  cursor: pointer;
}

/* 四季网格卡片 */
.seasons-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.season-tile {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--radius-sm, 6px);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #fff;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;
}

.season-tile:hover {
  background: rgba(56, 189, 248, 0.12);
  border-color: rgba(56, 189, 248, 0.35);
}

.season-tile.active {
  background: rgba(56, 189, 248, 0.22);
  border-color: var(--brand-cyan, #38bdf8);
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.3);
}

.s-icon {
  font-size: 18px;
}

.s-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.s-name {
  font-size: var(--text-sm, 12px);
  font-weight: 600;
  color: #fff;
}

.s-desc {
  font-size: var(--text-xs, 11px);
  color: var(--text-muted, #94a3b8);
}

/* 光照网格卡片 */
.lighting-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.light-tile {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  border-radius: var(--radius-sm, 6px);
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #fff;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;
}

.light-tile:hover {
  background: rgba(245, 185, 66, 0.12);
  border-color: rgba(245, 185, 66, 0.35);
}

.light-tile.active {
  background: rgba(245, 185, 66, 0.2);
  border-color: var(--accent-gold, #f5b942);
  box-shadow: 0 0 12px var(--accent-gold-glow);
}

.light-icon {
  color: var(--accent-gold, #f5b942);
}

.l-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.l-name {
  font-size: var(--text-sm, 12px);
  font-weight: 600;
  color: #fff;
}

.l-desc {
  font-size: var(--text-xs, 11px);
  color: var(--text-muted, #94a3b8);
}

@media (max-width: 768px) {
  .right-toolbar-root {
    top: 60px;
    right: 8px;
  }
  .rail-btn {
    width: 38px;
    height: 38px;
  }
  .flyout-card {
    width: 220px;
    right: 48px;
  }
}
</style>
