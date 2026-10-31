<template>
  <div v-if="poetrySpot" class="poetry-popup" role="dialog" aria-label="唐诗宋词地理空间卡">
    <div class="poetry-card glass-panel">
      <!-- 头部：朱砂印章与关闭按钮 -->
      <div class="card-head">
        <div class="head-left">
          <div class="poetry-seal">诗</div>
          <div>
            <div class="poetry-title">{{ poetrySpot.title }}</div>
            <div class="poetry-meta">
              <span class="dynasty-badge">{{ poetrySpot.dynasty }}</span>
              <span class="poet-name">{{ poetrySpot.poet }}</span>
              <span class="spot-loc">📍 {{ poetrySpot.name }}</span>
            </div>
          </div>
        </div>
        <button class="close-btn" @click="$emit('close')" title="关闭诗词卡片">✕</button>
      </div>

      <!-- 诗文经典名句排版 (仿宣纸竖排风骨) -->
      <div class="verse-box">
        <div class="verse-text">{{ poetrySpot.verse }}</div>
        <div class="verse-decoration">
          <span class="seal-mark">三秦雅韵</span>
        </div>
      </div>

      <!-- 地理时空解析 -->
      <div class="geo-note-box">
        <div class="note-label">
          <span class="sparkle-icon">🧭</span>
          <span>地理解读与时空背景</span>
        </div>
        <p class="note-content">{{ poetrySpot.geoNote }}</p>
      </div>

      <!-- 操作底部 -->
      <div class="card-actions">
        <button class="action-btn read-btn" @click="readVerse">
          <span>🔊</span>
          <span>朗读诗篇</span>
        </button>
        <button class="action-btn fly-btn" @click="$emit('fly-to', poetrySpot.pos)">
          <span>🎯</span>
          <span>聚焦此诗境</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { narrator } from '../utils/speech.js';

const props = defineProps({
  poetrySpot: { type: Object, default: null }
});

defineEmits(['close', 'fly-to']);

const readVerse = () => {
  if (!props.poetrySpot) return;
  const text = `${props.poetrySpot.title}，${props.poetrySpot.poet}。${props.poetrySpot.verse}`;
  narrator.speak(text);
};
</script>

<style scoped>
.poetry-popup {
  position: absolute;
  bottom: 85px;
  left: 20px;
  z-index: 65;
  pointer-events: auto;
  max-width: 380px;
  width: calc(100% - 40px);
  animation: poetryPop 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes poetryPop {
  from { opacity: 0; transform: translateY(20px) scale(0.96); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.poetry-card {
  background: rgba(10, 16, 28, 0.96);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid rgba(245, 185, 66, 0.45);
  border-radius: 16px;
  padding: 16px;
  color: #f8fafc;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.8), 0 0 24px rgba(245, 185, 66, 0.2);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.head-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.poetry-seal {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  background: linear-gradient(135deg, #dc2626, #991b1b);
  border: 1px solid rgba(254, 202, 202, 0.4);
  color: #fff;
  font-family: var(--font-title, "Noto Serif SC", serif);
  font-size: 20px;
  font-weight: 900;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
  flex-shrink: 0;
}

.poetry-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--accent-gold, #f5b942);
  letter-spacing: 0.04em;
}

.poetry-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
  font-size: 11px;
}

.dynasty-badge {
  padding: 1px 6px;
  background: rgba(220, 38, 38, 0.25);
  border: 1px solid rgba(220, 38, 38, 0.4);
  border-radius: 4px;
  color: #fca5a5;
  font-weight: 600;
}

.poet-name {
  color: #cbd5e1;
  font-weight: 600;
}

.spot-loc {
  color: var(--brand-cyan, #38bdf8);
}

.close-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #94a3b8;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.3);
  color: #fff;
  border-color: #ef4444;
}

/* 宣纸古风名句框 */
.verse-box {
  background: rgba(246, 240, 219, 0.06);
  border: 1px solid rgba(245, 185, 66, 0.25);
  border-radius: 10px;
  padding: 14px 16px;
  position: relative;
}

.verse-text {
  font-family: var(--font-title, "Noto Serif SC", "Songti SC", serif);
  font-size: 13.5px;
  line-height: 1.85;
  color: #fef08a;
  letter-spacing: 0.08em;
  white-space: pre-line;
  text-align: center;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.6);
}

.verse-decoration {
  display: flex;
  justify-content: flex-end;
  margin-top: 6px;
}

.seal-mark {
  font-size: 9px;
  color: #dc2626;
  border: 1px solid rgba(220, 38, 38, 0.5);
  padding: 1px 4px;
  border-radius: 2px;
  font-family: "Noto Serif SC", serif;
}

/* 地理解析框 */
.geo-note-box {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 8px;
  padding: 10px 12px;
}

.note-label {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  color: #38bdf8;
  margin-bottom: 4px;
}

.note-content {
  margin: 0;
  font-size: 11px;
  line-height: 1.6;
  color: #cbd5e1;
}

/* 底部操作 */
.card-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: 8px;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.read-btn {
  background: rgba(56, 189, 248, 0.15);
  border: 1px solid rgba(56, 189, 248, 0.35);
  color: #38bdf8;
}

.read-btn:hover {
  background: rgba(56, 189, 248, 0.3);
  color: #fff;
}

.fly-btn {
  background: linear-gradient(135deg, rgba(245, 185, 66, 0.3), rgba(217, 119, 6, 0.4));
  border: 1px solid rgba(245, 185, 66, 0.5);
  color: #fef08a;
}

.fly-btn:hover {
  background: linear-gradient(135deg, rgba(245, 185, 66, 0.5), rgba(217, 119, 6, 0.6));
  color: #fff;
}
</style>
