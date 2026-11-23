<template>
  <nav class="chapter-strip map-surface" aria-label="章节导航">
    <button class="map-icon" type="button" title="上一章" aria-label="上一章" :disabled="currentIndex === 0" @click="$emit('prev-chapter')"><ChevronLeft :size="18" /></button>
    <ol ref="list">
      <li v-for="(chapter, index) in chapters" :key="chapter.id">
        <button type="button" :aria-current="index === currentIndex ? 'step' : undefined" @click="$emit('select-chapter', index)">
          <span>{{ chapter.title }}</span>
        </button>
      </li>
    </ol>
    <button class="map-icon" type="button" title="下一章" aria-label="下一章" :disabled="currentIndex === chapters.length - 1" @click="$emit('next-chapter')"><ChevronRight :size="18" /></button>
    <button class="map-icon autoplay" type="button" :aria-label="isAutoPlaying ? '停止连播' : '章节连播'" :aria-pressed="isAutoPlaying" @click="$emit('toggle-autoplay')">
      <Pause v-if="isAutoPlaying" :size="16" /><Play v-else :size="16" />
    </button>
  </nav>
</template>

<script setup>
import { nextTick, ref, watch } from 'vue';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-vue-next';

const props = defineProps({
  chapters: { type: Array, required: true },
  currentIndex: { type: Number, required: true },
  isAutoPlaying: Boolean
});
defineEmits(['toggle-autoplay', 'prev-chapter', 'next-chapter', 'select-chapter']);
const list = ref(null);
watch(() => [props.currentIndex, props.chapters], async () => {
  await nextTick();
  const current = list.value?.querySelector('[aria-current="step"]');
  current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
});
</script>

<style scoped>
.chapter-strip {
  position: absolute;
  z-index: 18;
  inset: auto calc(var(--map-inline) + 60px) calc(var(--safe-bottom) + 13px) var(--content-left);
  display: flex;
  gap: 5px;
  align-items: center;
  padding: 4px 5px;
  max-width: 900px;
  margin-inline: auto;
}
.chapter-strip ol {
  display: flex;
  flex: 1;
  min-width: 0;
  gap: 3px;
  overflow: auto;
  list-style: none;
  scrollbar-width: thin;
}
.chapter-strip li { flex: 1 0 auto; }
.chapter-strip li button { width: 100%; border-top: 2px solid transparent; padding: 0 10px; color: var(--map-muted); font-size: 12px; }
.chapter-strip button:hover, .chapter-strip button[aria-current="step"] { color: var(--map-text); background: #29474a; border-top-color: var(--map-gold); }
.autoplay { border-inline-start: 1px solid var(--map-line); border-radius: 0; }
@media (max-width: 760px) and (orientation: portrait) { .chapter-strip { display: none; } }
@media (orientation: landscape) and (max-height: 520px) { .chapter-strip { right: calc(var(--map-inline) + 53px); bottom: calc(var(--safe-bottom) + 5px); } }
</style>
