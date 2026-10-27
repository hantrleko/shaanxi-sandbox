<template>
  <div v-if="active" class="detective-overlay">
    <!-- 答题挑战进行时浮窗 -->
    <div v-if="!isCompleted" class="question-card">
      <div class="card-top">
        <div class="brand-tag">
          <img src="/images/brand/eugene_logo_badge.png" alt="Logo" class="badge-icon" />
          <span>寻迹三秦 · 空间探秘挑战</span>
        </div>
        <div class="progress-pill">第 {{ currentIdx + 1 }} / {{ questions.length }} 关</div>
        <button class="exit-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="question-body">
        <div class="q-title">{{ currentQ.question }}</div>
        
        <div v-if="feedback" class="feedback-banner" :class="feedback.type">
          <div class="feedback-icon">{{ feedback.type === 'success' ? '🎯' : '⚠️' }}</div>
          <div class="feedback-text">
            <div class="feedback-main">{{ feedback.msg }}</div>
            <div class="feedback-sub" v-if="feedback.detail">{{ feedback.detail }}</div>
          </div>
        </div>

        <div v-if="!feedback || feedback.type !== 'success'" class="action-prompt">
          👉 请在 3D 三维沙盘上直接点击目标所在地理位置！
        </div>

        <div v-if="showHint" class="hint-box">
          {{ currentQ.hint }}
        </div>
      </div>

      <div class="card-actions">
        <button class="hint-btn" @click="showHint = !showHint">
          {{ showHint ? '隐藏线索' : '💡 查看地貌线索' }}
        </button>
        <button v-if="feedback && feedback.type === 'success'" class="next-btn" @click="nextQuestion">
          {{ currentIdx < questions.length - 1 ? '挑战下一关 ➔' : '查看通关荣誉文牒 🏆' }}
        </button>
      </div>
    </div>

    <!-- 5关通关荣誉文牒大奖状 -->
    <div v-else class="diploma-card">
      <div class="diploma-border">
        <div class="diploma-header">
          <img src="/images/brand/eugene_logo_white.png" alt="Eugene Finance" class="diploma-logo" />
          <div class="diploma-title">三秦地理通 · 荣誉通关文牒</div>
          <div class="diploma-subtitle">EUGENE FINANCE 数字人文地理认证</div>
        </div>

        <div class="diploma-body">
          <div class="congrats-text">
            恭喜探险家！您已在全省真实三维沙盘中精准寻获五大地理历史地标，以卓越的空间洞察力成功通关！
          </div>

          <div class="summary-grid">
            <div class="sum-item">
              <span class="sum-k">通关成绩</span>
              <span class="sum-v gold">100 分 (满分)</span>
            </div>
            <div class="sum-item">
              <span class="sum-k">平均定位误差</span>
              <span class="sum-v">5.8 km</span>
            </div>
            <div class="sum-item">
              <span class="sum-k">封号荣誉</span>
              <span class="sum-v cyan">国之栋梁 · 三秦地理大师</span>
            </div>
          </div>

          <div class="seal-box">
            <div class="seal-mark">
              <div class="seal-text">三秦大地</div>
              <div class="seal-text">地理认证</div>
            </div>
          </div>
        </div>

        <div class="diploma-footer">
          <button class="action-btn replay" @click="restartChallenge">🔄 重新挑战</button>
          <button class="action-btn finish" @click="$emit('close')">完成并返回沙盒</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { GEO_DETECTIVE_QUESTIONS } from '../data/shaanxiData.js';

const props = defineProps({
  active: { type: Boolean, default: false }
});

const emit = defineEmits(['close', 'focus-target']);

const questions = GEO_DETECTIVE_QUESTIONS;
const currentIdx = ref(0);
const showHint = ref(false);
const feedback = ref(null);
const isCompleted = ref(false);

const currentQ = computed(() => questions[currentIdx.value] || questions[0]);

// 由外部传入沙盘点击的 3D 坐标并计算距离
const handleTerrainClick = (coords) => {
  if (isCompleted.value || (feedback.value && feedback.value.type === 'success')) return;

  const target = currentQ.value.targetPos;
  // 计算世界坐标距离转换为公里 (1单位 ≈ 6.2km)
  const dx = coords[0] - target[0];
  const dz = coords[2] - target[2];
  const distWorld = Math.sqrt(dx * dx + dz * dz);
  const distKm = distWorld * 6.2;

  if (distKm <= currentQ.value.toleranceKm) {
    feedback.value = {
      type: 'success',
      msg: `🎯 命中目标【${currentQ.value.targetName}】！误差仅 ${distKm.toFixed(1)} km！`,
      detail: currentQ.value.explanation
    };
    emit('focus-target', target);
  } else {
    feedback.value = {
      type: 'error',
      msg: `未击中目标！距离目标还有约 ${distKm.toFixed(0)} km。`,
      detail: '请结合提示，缩放沙盘仔细寻找对应山川或平原位置！'
    };
  }
};

const nextQuestion = () => {
  feedback.value = null;
  showHint.value = false;
  if (currentIdx.value < questions.length - 1) {
    currentIdx.value++;
  } else {
    isCompleted.value = true;
  }
};

const restartChallenge = () => {
  currentIdx.value = 0;
  showHint.value = false;
  feedback.value = null;
  isCompleted.value = false;
};

defineExpose({
  handleTerrainClick
});
</script>

<style scoped>
.detective-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 75;
  display: flex;
  align-items: center;
  justify-content: center;
}

.question-card {
  position: absolute;
  top: 75px;
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 580px;
  background: rgba(10, 15, 25, 0.94);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(56, 189, 248, 0.45);
  border-radius: 16px;
  padding: 16px 20px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.8), 0 0 25px rgba(56, 189, 248, 0.25);
  pointer-events: auto;
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.brand-tag {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #38bdf8;
}

.badge-icon {
  width: 22px;
  height: 22px;
  border-radius: 5px;
}

.progress-pill {
  background: rgba(56, 189, 248, 0.15);
  border: 1px solid rgba(56, 189, 248, 0.35);
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  color: #f8fafc;
  font-weight: 600;
}

.exit-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 16px;
  cursor: pointer;
}

.exit-btn:hover {
  color: #ef4444;
}

.q-title {
  font-size: 14px;
  font-weight: 700;
  line-height: 1.6;
  color: #f8fafc;
}

.action-prompt {
  font-size: 12px;
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.12);
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px dashed rgba(245, 158, 11, 0.4);
}

.feedback-banner {
  display: flex;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 8px;
}

.feedback-banner.success {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.4);
  color: #a7f3d0;
}

.feedback-banner.error {
  background: rgba(239, 68, 68, 0.15);
  border: 1px solid rgba(239, 68, 68, 0.4);
  color: #fca5a5;
}

.feedback-main {
  font-weight: 700;
  font-size: 12.5px;
}

.feedback-sub {
  font-size: 11px;
  opacity: 0.9;
  margin-top: 3px;
  line-height: 1.5;
}

.hint-box {
  background: rgba(15, 23, 42, 0.7);
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 11.5px;
  color: #cbd5e1;
  border-left: 3px solid #38bdf8;
}

.card-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 4px;
}

.hint-btn {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #94a3b8;
  padding: 5px 12px;
  border-radius: 14px;
  font-size: 11.5px;
  cursor: pointer;
}

.hint-btn:hover {
  color: #38bdf8;
  border-color: #38bdf8;
}

.next-btn {
  background: linear-gradient(135deg, #10b981, #059669);
  border: 1px solid #34d399;
  color: #fff;
  padding: 6px 16px;
  border-radius: 14px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 0 12px rgba(16, 185, 129, 0.4);
}

/* 通关文牒荣誉大卡 */
.diploma-card {
  pointer-events: auto;
  width: 90%;
  max-width: 560px;
  background: #090e18;
  border-radius: 20px;
  padding: 12px;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.9), 0 0 40px rgba(245, 158, 11, 0.25);
}

.diploma-border {
  border: 2px solid #d97706;
  border-radius: 14px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  text-align: center;
  background: radial-gradient(circle at center, rgba(30, 24, 15, 0.5) 0%, rgba(9, 14, 24, 0.95) 100%);
}

.diploma-logo {
  height: 34px;
  object-fit: contain;
  margin-bottom: 8px;
}

.diploma-title {
  font-size: 20px;
  font-weight: 700;
  color: #fef08a;
  letter-spacing: 0.1em;
  font-family: "Noto Serif SC", "STSong", serif;
}

.diploma-subtitle {
  font-size: 11px;
  color: #f59e0b;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.congrats-text {
  font-size: 13px;
  color: #e2e8f0;
  line-height: 1.7;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  background: rgba(15, 23, 42, 0.7);
  padding: 12px;
  border-radius: 10px;
  border: 1px solid rgba(245, 158, 11, 0.2);
}

.sum-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.sum-k {
  font-size: 10.5px;
  color: #94a3b8;
}

.sum-v {
  font-size: 13px;
  font-weight: 700;
  color: #fff;
}

.sum-v.gold { color: #facc15; }
.sum-v.cyan { color: #38bdf8; }

.seal-box {
  display: flex;
  justify-content: center;
  margin: 6px 0;
}

.seal-mark {
  width: 76px;
  height: 76px;
  border: 3px solid #ef4444;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #ef4444;
  font-weight: 900;
  font-size: 13px;
  letter-spacing: 0.15em;
  transform: rotate(-10deg);
  box-shadow: 0 0 16px rgba(239, 68, 68, 0.35);
}

.diploma-footer {
  display: flex;
  gap: 12px;
  justify-content: center;
}

.action-btn {
  padding: 8px 18px;
  border-radius: 20px;
  font-size: 12.5px;
  cursor: pointer;
}

.action-btn.replay {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #cbd5e1;
}

.action-btn.finish {
  background: linear-gradient(135deg, #0284c7, #0369a1);
  border: 1px solid #38bdf8;
  color: #fff;
  font-weight: 700;
}
</style>
