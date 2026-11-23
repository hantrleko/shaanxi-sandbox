<template>
  <header class="map-header">
    <button class="header-home" type="button" aria-label="返回首页" @click="$emit('open-portal')">
      <Map :size="20" :stroke-width="1.7" />
      <span>陕西地理沙盘</span>
    </button>
    <span class="header-context">{{ context }}</span>
    <nav class="header-actions" aria-label="沙盘导航" @keydown.esc.stop="closeMenu(true)">
      <button
        type="button"
        class="map-button header-guide"
        :aria-current="guideActive ? 'page' : undefined"
        @click="choose('start-guide')"
      ><BookOpen :size="16" /> 导览</button>
      <div ref="explore" class="explore-wrap">
        <button
          ref="exploreButton"
          type="button"
          class="map-button"
          :aria-expanded="menuOpen"
          aria-controls="explore-options"
          @click="menuOpen = !menuOpen"
        ><Compass :size="16" /> 探索 <ChevronDown :size="13" /></button>
        <div v-if="menuOpen" id="explore-options" class="explore-menu map-surface">
          <section>
            <h2>主题与场景</h2>
            <button
              v-for="theme in themes" :key="theme.id" type="button"
              :aria-current="!guideActive && currentMode === 'macro' && currentThemeId === theme.id ? 'page' : undefined"
              @click="choose('change-theme', theme.id)"
            >{{ theme.title }}</button>
            <button v-for="[mode, label] in scenes" :key="mode" type="button"
              :aria-current="currentMode === mode ? 'page' : undefined"
              @click="choose('switch-mode', mode)"
            >{{ label }}</button>
          </section>
          <section>
            <h2>体验与工具</h2>
            <button v-for="[event, label] in experiences" :key="event" type="button" @click="choose(event)">{{ label }}</button>
          </section>
        </div>
      </div>
      <button type="button" class="map-button search-trigger" aria-label="搜索章节与工具" @click="choose('open-cmd')">
        <Search :size="18" /><span>搜索</span>
      </button>
    </nav>
  </header>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { BookOpen, ChevronDown, Compass, Map, Search } from 'lucide-vue-next';

defineProps({
  themes: { type: Array, required: true },
  currentThemeId: { type: String, required: true },
  currentMode: { type: String, required: true },
  context: { type: String, required: true },
  guideActive: Boolean
});

const scenes = [['campaign', '历史战役'], ['bonsai', '地形盆景'], ['model', '地貌实验']];
const experiences = [
  ['open-tour', '航拍三秦'], ['open-gallery', '实景影集'], ['open-roadbook', '三维路书'],
  ['open-detective', '寻迹三秦'], ['open-wargame', '路线对比'], ['open-poster', '生成明信片'],
  ['toggle-zen-mode', '纯净观赏'], ['toggle-fullscreen', '全屏'], ['open-changelog', '关于项目']
];

const emit = defineEmits([
  'open-portal', 'start-guide', 'change-theme', 'switch-mode', 'open-cmd',
  'open-tour', 'open-gallery', 'open-roadbook', 'open-detective', 'open-wargame',
  'open-poster', 'toggle-zen-mode', 'toggle-fullscreen', 'open-changelog'
]);
const explore = ref(null);
const exploreButton = ref(null);
const menuOpen = ref(false);

function closeMenu(restoreFocus = false) {
  if (!menuOpen.value) return;
  menuOpen.value = false;
  if (restoreFocus) exploreButton.value?.focus();
}

function choose(event, argument) {
  closeMenu(true);
  emit(event, argument);
}

function dismissOutside(event) {
  if (!explore.value?.contains(event.target)) closeMenu();
}

onMounted(() => window.addEventListener('pointerdown', dismissOutside));
onBeforeUnmount(() => window.removeEventListener('pointerdown', dismissOutside));
</script>

<style scoped>
.map-header {
  position: absolute;
  top: var(--safe-top);
  left: 0;
  right: 0;
  z-index: 40;
  height: var(--header-height);
  padding: 0 var(--map-inline);
  display: flex;
  align-items: center;
  gap: clamp(14px, 2.4vw, 30px);
  background: #12292e;
  border-bottom: 1px solid var(--map-line);
  color: var(--map-text);
}
.header-home { display: flex; align-items: center; gap: 9px; font-weight: 700; white-space: nowrap; }
.header-home svg { color: var(--map-gold); }
.header-context { color: var(--map-muted); border-left: 1px solid var(--map-line); padding-inline-start: 16px; font-size: 13px; }
.header-actions { margin-inline-start: auto; display: flex; gap: 6px; }
.header-actions .map-button { padding-inline: 10px; border-color: transparent; background: transparent; }
.header-actions .map-button:hover, .map-button[aria-current="page"] { background: #263f41; color: var(--map-gold); }
.explore-wrap { position: relative; }
.explore-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 1;
  width: min(335px, 90vw);
  max-height: min(450px, calc(100dvh - var(--header-height) - 24px));
  overflow: auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: 12px;
  gap: 8px;
}
.explore-menu section + section { border-left: 1px solid var(--map-line); padding-left: 8px; }
.explore-menu h2 { margin: 4px 6px 5px; color: var(--map-muted); font-size: 12px; font-weight: 550; }
.explore-menu button { display: block; width: 100%; text-align: left; border-radius: 5px; padding-inline: 9px; }
.explore-menu button:hover, .explore-menu button[aria-current="page"] { background: #294749; color: var(--map-gold); }
@media (max-width: 760px) {
  .header-context, .search-trigger span { display: none; }
  .map-header { gap: 4px; }
  .header-home { font-size: 13px; }
  .header-actions { gap: 3px; }
  .header-actions .map-button { padding-inline: 6px; }
  .explore-menu { position: fixed; top: calc(var(--safe-top) + var(--header-height) + 6px); right: var(--map-inline); }
}
@media (max-width: 365px) {
  .header-home svg, .header-actions button svg.lucide-chevron-down { display: none; }
}
</style>
