<template>
  <div v-if="active" class="cinematic-container">
    <!-- 顶部电影黑边与品牌徽章 -->
    <div class="letterbox letterbox-top">
      <div class="brand-bar">
        <div class="brand-emblem">
          <img src="/images/brand/eugene_logo_badge.png" alt="Eugene Finance" class="brand-img" />
          <div class="brand-text">
            <span class="brand-corp">EUGENE FINANCE 呈现</span>
            <span class="brand-title">陕西地理沙盘 · 航拍三秦沉浸导览</span>
          </div>
        </div>

        <!-- 站点进度航标 -->
        <div class="waypoints-nav">
          <div
            v-for="(st, idx) in waypoints"
            :key="st.id"
            class="waypoint-pill"
            :class="{ active: idx === currentIndex, passed: idx < currentIndex }"
            @click="onSelectStation(idx)"
          >
            <span class="pill-dot"></span>
            <span class="pill-name">{{ st.title.split('·')[1]?.trim() || st.title }}</span>
          </div>
        </div>

        <button class="exit-btn" @click="$emit('close-tour')" title="退出电影巡航">
          <span>✕ 退出巡航</span>
        </button>
      </div>
    </div>

    <!-- 底部电影黑边与动态人文字幕 -->
    <div class="letterbox letterbox-bottom">
      <div class="subtitle-wrapper" v-if="currentStation">
        <div class="meta-row">
          <span class="station-tag">{{ currentStation.title }}</span>
          <span class="geo-loc">📍 {{ currentStation.location }}</span>
          <span class="alt-tag">🏔️ {{ currentStation.elevation }}</span>
        </div>

        <div class="poetry-quote">
          “{{ currentStation.poetry }}”
        </div>

        <div class="narration-text">
          {{ currentStation.narration }}
        </div>

        <!-- 控制栏 -->
        <div class="tour-controls">
          <button class="ctrl-btn" @click="$emit('prev-station')" :disabled="currentIndex === 0">
            ⏮ 上一站
          </button>
          
          <button class="ctrl-btn play-btn" @click="togglePlay">
            {{ isPaused ? '▶ 继续播放' : '⏸ 暂停' }}
          </button>

          <button class="ctrl-btn" @click="$emit('next-station')" :disabled="currentIndex >= waypoints.length - 1">
            下一站 ⏭
          </button>

          <div class="audio-toggle" @click="toggleAudio">
            <span class="audio-icon">{{ isAudioEnabled ? '🔊 语音解说' : '🔇 静音' }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { CINEMATIC_WAYPOINTS } from '../data/shaanxiData.js';

const props = defineProps({
  active: { type: Boolean, default: false },
  currentIndex: { type: Number, default: 0 }
});

const emit = defineEmits(['close-tour', 'next-station', 'prev-station', 'select-station']);

const waypoints = CINEMATIC_WAYPOINTS;
const isPaused = ref(false);
const isAudioEnabled = ref(true);
let autoTimer = null;
let speechUtterance = null;

const currentStation = computed(() => waypoints[props.currentIndex] || waypoints[0]);

const speakNarration = () => {
  if (!isAudioEnabled.value || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();

  if (!currentStation.value) return;
  const text = `${currentStation.value.title}。${currentStation.value.narration}`;
  speechUtterance = new SpeechSynthesisUtterance(text);
  speechUtterance.lang = 'zh-CN';
  speechUtterance.rate = 0.95;
  speechUtterance.pitch = 1.0;

  speechUtterance.onend = () => {
    // 朗读完后稍作停留，自动下一站
    if (!isPaused.value && props.active) {
      autoTimer = setTimeout(() => {
        if (props.currentIndex < waypoints.length - 1) {
          emit('next-station');
        } else {
          // 循环回到第一站或提示完成
          emit('select-station', 0);
        }
      }, 2500);
    }
  };

  window.speechSynthesis.speak(speechUtterance);
};

const togglePlay = () => {
  isPaused.value = !isPaused.value;
  if (isPaused.value) {
    if (window.speechSynthesis) window.speechSynthesis.pause();
    if (autoTimer) clearTimeout(autoTimer);
  } else {
    if (window.speechSynthesis) window.speechSynthesis.resume();
    // 如果没有正在播放的语音，启动定时
    if (!window.speechSynthesis || !window.speechSynthesis.speaking) {
      speakNarration();
    }
  }
};

const toggleAudio = () => {
  isAudioEnabled.value = !isAudioEnabled.value;
  if (!isAudioEnabled.value) {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  } else {
    speakNarration();
  }
};

const onSelectStation = (idx) => {
  emit('select-station', idx);
};

watch(() => props.currentIndex, () => {
  if (autoTimer) clearTimeout(autoTimer);
  if (props.active && !isPaused.value) {
    speakNarration();
  }
});

watch(() => props.active, (newVal) => {
  if (newVal) {
    isPaused.value = false;
    speakNarration();
  } else {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (autoTimer) clearTimeout(autoTimer);
  }
});

onBeforeUnmount(() => {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  if (autoTimer) clearTimeout(autoTimer);
});
</script>

<style scoped>
.cinematic-container {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 80;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.letterbox {
  background: linear-gradient(to bottom, rgba(5, 8, 14, 0.96) 60%, rgba(5, 8, 14, 0.8) 85%, transparent 100%);
  pointer-events: auto;
  box-sizing: border-box;
}

.letterbox-top {
  padding: 14px 28px;
  border-bottom: 1px solid rgba(56, 189, 248, 0.15);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7);
}

.brand-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.brand-emblem {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-img {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  border: 1px solid rgba(56, 189, 248, 0.4);
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.3);
}

.brand-text {
  display: flex;
  flex-direction: column;
}

.brand-corp {
  font-size: 10px;
  letter-spacing: 0.1em;
  color: #38bdf8;
  font-weight: 700;
  text-transform: uppercase;
}

.brand-title {
  font-size: 14px;
  font-weight: 700;
  color: #f8fafc;
  letter-spacing: 0.05em;
}

.waypoints-nav {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(15, 23, 42, 0.6);
  padding: 4px 10px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.waypoint-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 14px;
  font-size: 11.5px;
  color: #94a3b8;
  cursor: pointer;
  transition: all 0.25s;
}

.waypoint-pill:hover {
  color: #e2e8f0;
  background: rgba(255, 255, 255, 0.06);
}

.waypoint-pill.active {
  color: #38bdf8;
  font-weight: 700;
  background: rgba(56, 189, 248, 0.18);
  border: 1px solid rgba(56, 189, 248, 0.4);
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
}

.waypoint-pill.passed {
  color: #cbd5e1;
}

.pill-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #64748b;
}

.waypoint-pill.active .pill-dot {
  background: #38bdf8;
  box-shadow: 0 0 6px #38bdf8;
}

.waypoint-pill.passed .pill-dot {
  background: #10b981;
}

.exit-btn {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #fca5a5;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.exit-btn:hover {
  background: rgba(239, 68, 68, 0.3);
  color: #fff;
  border-color: #ef4444;
}

.letterbox-bottom {
  padding: 24px 36px 20px;
  background: linear-gradient(to top, rgba(5, 8, 14, 0.98) 70%, rgba(5, 8, 14, 0.8) 88%, transparent 100%);
  border-top: 1px solid rgba(56, 189, 248, 0.15);
  box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.7);
}

.subtitle-wrapper {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: center;
}

.meta-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.station-tag {
  background: linear-gradient(135deg, #0284c7, #0369a1);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  padding: 3px 12px;
  border-radius: 12px;
  letter-spacing: 0.05em;
}

.geo-loc {
  font-size: 12px;
  color: #cbd5e1;
}

.alt-tag {
  font-size: 12px;
  color: #f59e0b;
  font-family: monospace;
  font-weight: 700;
}

.poetry-quote {
  font-size: 16px;
  font-weight: 600;
  color: #fef08a;
  letter-spacing: 0.06em;
  font-family: "Noto Serif SC", "STSong", "SimSun", serif;
  text-shadow: 0 0 12px rgba(254, 240, 138, 0.4);
}

.narration-text {
  font-size: 13.5px;
  line-height: 1.7;
  color: #e2e8f0;
  max-width: 820px;
  margin: 0 auto;
  letter-spacing: 0.03em;
}

.tour-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-top: 8px;
}

.ctrl-btn {
  background: rgba(30, 41, 59, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #f8fafc;
  padding: 5px 14px;
  border-radius: 18px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.ctrl-btn:hover:not(:disabled) {
  border-color: #38bdf8;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.15);
}

.ctrl-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.play-btn {
  background: #0284c7;
  border-color: #38bdf8;
  color: #fff;
  font-weight: 600;
}

.play-btn:hover {
  background: #0369a1;
}

.audio-toggle {
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(56, 189, 248, 0.3);
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 11.5px;
  color: #38bdf8;
  cursor: pointer;
  user-select: none;
}

.audio-toggle:hover {
  background: rgba(56, 189, 248, 0.2);
}

@media (max-width: 768px) {
  .waypoints-nav {
    display: none;
  }
  .poetry-quote {
    font-size: 14px;
  }
  .narration-text {
    font-size: 12px;
  }
}
</style>
