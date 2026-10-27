<template>
  <div v-if="culturalItem" class="cultural-popup">
    <div class="popup-card">
      <div class="card-head">
        <div class="head-left">
          <span class="cult-icon">{{ culturalItem.icon }}</span>
          <div>
            <div class="cult-name">{{ culturalItem.name }}</div>
            <div class="cult-meta">
              <span class="region-pill">{{ culturalItem.region }}</span>
              <span class="cat-pill">{{ culturalItem.category }}</span>
            </div>
          </div>
        </div>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="cult-badge-row">
        <span class="badge-tag">🔖 {{ culturalItem.badge }}</span>
      </div>

      <div class="cult-desc">
        {{ culturalItem.desc }}
      </div>

      <div class="cult-tags">
        <span v-for="t in culturalItem.tags" :key="t" class="tag-pill"># {{ t }}</span>
      </div>

      <div class="card-bot">
        <button class="fly-btn" @click="$emit('fly-to', culturalItem.pos)">
          🎯 镜头聚焦此风物
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  culturalItem: { type: Object, default: null }
});

defineEmits(['close', 'fly-to']);
</script>

<style scoped>
.cultural-popup {
  position: absolute;
  bottom: 85px;
  left: 20px;
  z-index: 65;
  pointer-events: auto;
  max-width: 360px;
  width: calc(100% - 40px);
  animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.popup-card {
  background: rgba(12, 18, 28, 0.95);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(245, 158, 11, 0.45);
  border-radius: 16px;
  padding: 16px;
  color: #fff;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(245, 158, 11, 0.2);
  display: flex;
  flex-direction: column;
  gap: 10px;
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

.cult-icon {
  font-size: 26px;
  background: rgba(245, 158, 11, 0.15);
  padding: 6px;
  border-radius: 10px;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.cult-name {
  font-size: 14.5px;
  font-weight: 700;
  color: #fef08a;
}

.cult-meta {
  display: flex;
  gap: 6px;
  margin-top: 3px;
}

.region-pill {
  font-size: 10px;
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  padding: 1px 6px;
  border-radius: 6px;
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.cat-pill {
  font-size: 10px;
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  padding: 1px 6px;
  border-radius: 6px;
  border: 1px solid rgba(16, 185, 129, 0.3);
}

.close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 16px;
  cursor: pointer;
}

.close-btn:hover {
  color: #ef4444;
}

.cult-badge-row {
  font-size: 11px;
  color: #f59e0b;
  font-weight: 600;
}

.cult-desc {
  font-size: 12px;
  line-height: 1.6;
  color: #cbd5e1;
}

.cult-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.tag-pill {
  font-size: 10px;
  background: rgba(255, 255, 255, 0.06);
  color: #94a3b8;
  padding: 2px 8px;
  border-radius: 10px;
}

.card-bot {
  display: flex;
  justify-content: flex-end;
  margin-top: 4px;
}

.fly-btn {
  background: linear-gradient(135deg, #d97706, #b45309);
  border: 1px solid #f59e0b;
  color: #fff;
  padding: 5px 14px;
  border-radius: 14px;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.fly-btn:hover {
  background: #d97706;
}
</style>
