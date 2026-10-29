<template>
  <div class="bottom-timeline glass-panel" v-if="currentMode === 'macro'">
    <div class="timeline-controls">
      <button
        class="play-all-btn"
        :class="{ active: isAutoPlaying }"
        @click="$emit('toggle-autoplay')"
        :title="isAutoPlaying ? '暂停全省连播' : '一键智能导览全省'"
      >
        <span class="btn-symbol">
          <svg v-if="!isAutoPlaying" class="play-svg" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          <svg v-else class="play-svg" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16"></rect>
            <rect x="14" y="4" width="4" height="16"></rect>
          </svg>
        </span>
        <div class="btn-text-group">
          <span class="main-label">{{ isAutoPlaying ? '暂停连播' : '智能导览' }}</span>
          <span class="sub-label">{{ chapters.length }}个时空节点</span>
        </div>
      </button>

      <div class="nav-arrow-group">
        <button class="arrow-btn" @click="$emit('prev-chapter')" :disabled="currentIndex === 0" title="上一章节">
          ‹
        </button>
        <button class="arrow-btn" @click="$emit('next-chapter')" :disabled="currentIndex === chapters.length - 1" title="下一章节">
          ›
        </button>
      </div>
    </div>

    <!-- 底部横向滚动的章节卡片流 -->
    <div class="cards-scroll-container">
      <div
        v-for="(ch, idx) in chapters"
        :key="ch.id"
        class="chapter-card"
        :class="{ active: currentIndex === idx }"
        @click="$emit('select-chapter', idx)"
      >
        <div class="card-thumb">
          <img :src="ch.photoUrl" :alt="ch.title" />
          <div class="card-idx">{{ ch.num }}</div>
        </div>
        <div class="card-body">
          <div class="card-title">{{ ch.title }}</div>
          <div class="card-subtitle">{{ ch.subTitle }}</div>
        </div>
        <div class="card-active-indicator" v-if="currentIndex === idx"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
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
  left: 400px;
  right: 200px;
  max-width: 760px;
  margin: 0 auto;
  height: 72px;
  display: flex;
  align-items: center;
  padding: 6px 12px;
  gap: 12px;
  z-index: 15;
  border-radius: 14px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
  border: 1px solid rgba(56, 189, 248, 0.25);
  transition: all 0.3s ease;
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
  border-radius: 8px;
  padding: 6px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
}

.play-all-btn:hover {
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.4);
}

.play-all-btn.active {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  border-color: #34d399;
}

.btn-symbol {
  font-size: 14px;
}

.btn-text-group {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.main-label {
  font-size: 11.5px;
  font-weight: 700;
  line-height: 1.2;
}

.sub-label {
  font-size: 9px;
  opacity: 0.8;
}

.nav-arrow-group {
  display: flex;
  gap: 3px;
}

.arrow-btn {
  width: 28px;
  height: 42px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #fff;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.arrow-btn:hover:not(:disabled) {
  background: rgba(56, 189, 248, 0.2);
  border-color: #38bdf8;
}

.arrow-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.cards-scroll-container {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  flex-grow: 1;
  padding: 2px 0;
  scroll-behavior: smooth;
  scrollbar-width: none;
}

.cards-scroll-container::-webkit-scrollbar {
  display: none;
}

.chapter-card {
  flex-shrink: 0;
  width: 170px;
  height: 54px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 5px;
  display: flex;
  gap: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: all 0.2s;
}

.chapter-card:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.2);
}

.chapter-card.active {
  background: rgba(56, 189, 248, 0.15);
  border-color: #38bdf8;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.25);
}

.card-thumb {
  width: 44px;
  height: 100%;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
}

.card-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-idx {
  position: absolute;
  top: 1px;
  left: 1px;
  background: rgba(0, 0, 0, 0.75);
  color: #38bdf8;
  font-size: 8px;
  font-weight: 700;
  padding: 0 3px;
  border-radius: 2px;
}

.card-body {
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
}

.card-title {
  font-size: 11.5px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-subtitle {
  font-size: 9px;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 1px;
}

.card-active-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #38bdf8;
  box-shadow: 0 0 6px #38bdf8;
}

@media (max-width: 1120px) {
  .bottom-timeline {
    left: 390px;
    right: 180px;
    padding: 5px 8px;
    gap: 8px;
  }
  .chapter-card {
    width: 145px;
  }
}
.play-svg {
  width: 14px;
  height: 14px;
}

.card-active-indicator {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #38bdf8, #0284c7);
  box-shadow: 0 0 8px #38bdf8;
  animation: pulseBar 2s infinite ease-in-out;
}

@keyframes pulseBar {
  0%, 100% { opacity: 0.8; }
  50% { opacity: 1; filter: brightness(1.3); }
}
</style>
