<template>
  <div class="bottom-timeline glass-panel" v-if="currentMode === 'macro'">
    <div class="timeline-controls">
      <button
        class="play-all-btn"
        :class="{ active: isAutoPlaying }"
        @click="$emit('toggle-autoplay')"
      >
        <span class="btn-symbol">{{ isAutoPlaying ? '⏸' : '▶' }}</span>
        <div class="btn-text-group">
          <span class="main-label">{{ isAutoPlaying ? '暂停连播' : '讲解全部' }}</span>
          <span class="sub-label">{{ chapters.length }}段 · 智能导览</span>
        </div>
      </button>

      <div class="nav-arrow-group">
        <button class="arrow-btn" @click="$emit('prev-chapter')" :disabled="currentIndex === 0" title="上一段">
          ‹
        </button>
        <button class="arrow-btn" @click="$emit('next-chapter')" :disabled="currentIndex === chapters.length - 1" title="下一段">
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
  bottom: 16px;
  left: 20px;
  right: 20px;
  height: 84px;
  display: flex;
  align-items: center;
  padding: 8px 12px;
  gap: 16px;
  z-index: 15;
}

.timeline-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.play-all-btn {
  background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
  border: 1px solid rgba(56, 189, 248, 0.4);
  color: #fff;
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
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
  font-size: 16px;
}

.btn-text-group {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.main-label {
  font-size: 12px;
  font-weight: 700;
  line-height: 1.2;
}

.sub-label {
  font-size: 9px;
  opacity: 0.8;
}

.nav-arrow-group {
  display: flex;
  gap: 4px;
}

.arrow-btn {
  width: 32px;
  height: 48px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #fff;
  border-radius: 6px;
  font-size: 18px;
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
  gap: 10px;
  overflow-x: auto;
  flex-grow: 1;
  padding: 4px 0;
  scroll-behavior: smooth;
}

.chapter-card {
  flex-shrink: 0;
  width: 200px;
  height: 64px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 6px;
  display: flex;
  gap: 8px;
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
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.25);
}

.card-thumb {
  width: 52px;
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
  top: 2px;
  left: 2px;
  background: rgba(0, 0, 0, 0.7);
  color: #38bdf8;
  font-size: 9px;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 3px;
}

.card-body {
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
}

.card-title {
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-subtitle {
  font-size: 10px;
  color: #94a3b8;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
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
</style>
