<template>
  <nav class="bottom-timeline glass-panel" aria-label="三秦时空时间轴">
    <div class="timeline-controls">
      <button
        class="play-all-btn"
        :class="{ active: isAutoPlaying }"
        @click="$emit('toggle-autoplay')"
        :title="isAutoPlaying ? '暂停智能连播' : '一键智能巡航全省'"
        aria-label="智能导览播放控制"
      >
        <span class="btn-symbol">
          <Play v-if="!isAutoPlaying" :size="15" fill="currentColor" />
          <Pause v-else :size="15" fill="currentColor" />
        </span>
        <div class="btn-text-group">
          <span class="main-label">{{ isAutoPlaying ? '暂停连播' : '智能导览' }}</span>
          <span class="sub-label">{{ chapters.length }}个时空节点</span>
        </div>
      </button>

      <div class="nav-arrow-group">
        <button
          class="arrow-btn"
          @click="$emit('prev-chapter')"
          :disabled="currentIndex === 0"
          title="上一章节 (←)"
          aria-label="上一章节"
        >
          <ChevronLeft :size="16" />
        </button>
        <button
          class="arrow-btn"
          @click="$emit('next-chapter')"
          :disabled="currentIndex === chapters.length - 1"
          title="下一章节 (→)"
          aria-label="下一章节"
        >
          <ChevronRight :size="16" />
        </button>
      </div>
    </div>

    <!-- 底部横向滚动的章节卡片流 (支持平滑触控滑动) -->
    <div class="cards-scroll-container custom-scrollbar">
      <div
        v-for="(ch, idx) in chapters"
        :key="ch.id"
        class="chapter-card"
        :class="{ active: currentIndex === idx }"
        @click="$emit('select-chapter', idx)"
        role="button"
        :aria-selected="currentIndex === idx"
      >
        <div class="card-thumb">
          <img :src="ch.photoUrl" :alt="ch.title" loading="lazy" />
          <div class="card-idx">{{ ch.num }}</div>
        </div>
        <div class="card-body">
          <div class="card-title">{{ ch.title }}</div>
          <div class="card-subtitle">{{ ch.subTitle }}</div>
        </div>
        <!-- 自动播放进度条指示 -->
        <div class="card-active-indicator" v-if="currentIndex === idx">
          <div class="progress-fill" v-if="isAutoPlaying"></div>
        </div>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { Play, Pause, ChevronLeft, ChevronRight } from 'lucide-vue-next';

defineProps({
  chapters: { type: Array, required: true },
  currentIndex: { type: Number, default: 0 },
  isAutoPlaying: { type: Boolean, default: false },
  currentMode: { type: String, default: 'macro' }
});

defineEmits(['toggle-autoplay', 'prev-chapter', 'next-chapter', 'select-chapter']);
</script>

<style scoped>
.bottom-timeline {
  position: absolute;
  bottom: 18px;
  left: 395px;
  right: 18px;
  max-width: 740px;
  margin: 0 auto;
  height: 72px;
  display: flex;
  align-items: center;
  padding: 6px 12px;
  gap: 12px;
  z-index: 20;
  background: var(--bg-glass-heavy, rgba(11, 26, 43, 0.92));
  border: 1px solid var(--border-light, rgba(56, 189, 248, 0.28));
  border-radius: var(--radius-md, 14px);
  box-shadow: 0 16px 40px -8px rgba(0, 0, 0, 0.8), 0 0 20px rgba(2, 132, 199, 0.12);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: all 0.25s ease;
}

.timeline-controls {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.play-all-btn {
  background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
  border: 1px solid rgba(56, 189, 248, 0.4);
  color: #fff;
  border-radius: var(--radius-sm, 8px);
  padding: 6px 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);
}

.play-all-btn:hover {
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  box-shadow: 0 4px 16px rgba(2, 132, 199, 0.5);
  transform: translateY(-1px);
}

.play-all-btn.active {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  border-color: rgba(245, 158, 11, 0.5);
  box-shadow: 0 4px 16px rgba(245, 158, 11, 0.4);
}

.btn-symbol {
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-text-group {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.main-label {
  font-size: var(--text-sm, 12px);
  font-weight: 700;
  line-height: 1.2;
}

.sub-label {
  font-size: 9.5px;
  opacity: 0.85;
}

.nav-arrow-group {
  display: flex;
  align-items: center;
  gap: 2px;
}

.arrow-btn {
  width: 26px;
  height: 48px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: var(--text-muted, #94a3b8);
  border-radius: var(--radius-xs, 5px);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.arrow-btn:hover:not(:disabled) {
  background: rgba(56, 189, 248, 0.15);
  color: #fff;
  border-color: rgba(56, 189, 248, 0.4);
}

.arrow-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

/* 横向滚动列表 */
.cards-scroll-container {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-x: auto;
  scroll-behavior: smooth;
  padding: 4px 2px;
}

.chapter-card {
  position: relative;
  flex-shrink: 0;
  width: 138px;
  height: 52px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.09);
  border-radius: var(--radius-sm, 8px);
  padding: 4px 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  overflow: hidden;
}

.chapter-card:hover {
  background: rgba(56, 189, 248, 0.1);
  border-color: rgba(56, 189, 248, 0.35);
  transform: translateY(-2px);
}

.chapter-card.active {
  background: rgba(56, 189, 248, 0.2);
  border-color: var(--brand-cyan, #38bdf8);
  box-shadow: 0 0 16px rgba(56, 189, 248, 0.3);
  transform: translateY(-2px) scale(1.02);
}

.card-thumb {
  position: relative;
  width: 44px;
  height: 44px;
  border-radius: 5px;
  overflow: hidden;
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.card-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-idx {
  position: absolute;
  top: 1px;
  left: 2px;
  font-family: var(--font-mono, monospace);
  font-size: 8.5px;
  font-weight: 800;
  color: #fff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
}

.card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-width: 0;
  gap: 1px;
}

.card-title {
  font-size: var(--text-xs, 11.5px);
  font-weight: 700;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-subtitle {
  font-size: 9.5px;
  color: var(--text-muted, #94a3b8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-active-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2.5px;
  background: rgba(56, 189, 248, 0.3);
}

.progress-fill {
  height: 100%;
  background: var(--brand-cyan, #38bdf8);
  animation: progressRun 12s linear infinite;
}

@keyframes progressRun {
  from { width: 0%; }
  to { width: 100%; }
}

@media (max-width: 1024px) {
  .bottom-timeline {
    left: 18px;
    right: 18px;
    max-width: none;
    bottom: 12px;
  }
}

@media (max-width: 768px) {
  .bottom-timeline {
    display: none; /* 移动端由 Bottom Sheet 接管 */
  }
}
</style>
