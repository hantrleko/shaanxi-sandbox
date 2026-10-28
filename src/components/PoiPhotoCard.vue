<template>
  <div v-if="poi" class="poi-photo-card glass-panel">
    <button class="card-close" @click="$emit('close')">✕</button>

    <!-- 实景照片图窗 -->
    <div class="card-cover-box" @click="$emit('view-large', matchedScenery || fallbackScenery)">
      <img
        :src="matchedScenery ? matchedScenery.url : defaultPhotoUrl"
        :alt="poi.name"
        class="card-img"
      />
      <div class="card-cover-overlay"></div>
      <span class="card-type-tag">{{ poi.type === 'mountain' ? '名山极顶' : poi.type === 'relic' ? '千古遗迹' : poi.type === 'nature' ? '自然胜景' : '历史名城' }}</span>
      <span class="card-elev-tag" v-if="matchedScenery">{{ matchedScenery.elevation }}</span>
    </div>

    <!-- 文本内容 -->
    <div class="card-body">
      <div class="card-title-row">
        <h4 class="card-title">{{ poi.name }}</h4>
        <span class="card-badge">{{ poi.badge }}</span>
      </div>

      <p class="card-desc">
        {{ matchedScenery ? matchedScenery.desc : (poi.desc || '三秦大地核心地理地标，承载着数千年地貌变迁与文明史诗。') }}
      </p>

      <div class="card-footer-row">
        <span class="card-hint">💡 点击照片可放大全屏实景</span>
        <button class="card-action-btn" @click="$emit('view-gallery')">
          <span>进入实景影集 ➔</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { SCENERY_PHOTOS } from '../data/shaanxiData.js';

const props = defineProps({
  poi: { type: Object, default: null }
});

defineEmits(['close', 'view-large', 'view-gallery']);

const baseUrl = import.meta.env.BASE_URL || './';
const prefix = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
const defaultPhotoUrl = prefix + 'images/scenery/hua_shan.jpg';

const matchedScenery = computed(() => {
  if (!props.poi) return null;
  const pId = props.poi.id;
  const pName = props.poi.name;

  return (SCENERY_PHOTOS || []).find(s => {
    if (pId === 'huashan' && s.id === 'hua_shan') return true;
    if (pId === 'taibai' && s.id === 'taibai_shan') return true;
    if (pId === 'bingmayong' && s.id === 'bingmayong') return true;
    if (pId === 'hukou' && s.id === 'hukou_waterfall') return true;
    if (pId === 'yanan' && s.id === 'baota_shan') return true;
    if (pId === 'xian' && (s.id === 'zhonglou' || s.id === 'dayanta')) return true;
    if (pId === 'yulin' && s.id === 'zhenbeitai') return true;
    if (pId === 'hanzhong' && s.id === 'hanzhong_flower') return true;
    if (pId === 'ankang' && s.id === 'hanjiang_water') return true;
    if (pId === 'baoji' && s.id === 'famen_temple') return true;
    return s.title.includes(pName) || pName.includes(s.title.slice(0, 2));
  });
});

const fallbackScenery = computed(() => {
  return (SCENERY_PHOTOS || [])[0];
});
</script>

<style scoped>
.poi-photo-card {
  position: absolute;
  bottom: 86px;
  right: 20px;
  width: 320px;
  background: rgba(10, 16, 28, 0.94);
  border: 1px solid rgba(56, 189, 248, 0.35);
  border-radius: 14px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(56, 189, 248, 0.2);
  overflow: hidden;
  z-index: 20;
  animation: slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  display: flex;
  flex-direction: column;
}

@keyframes slideInRight {
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
}

.card-close {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #94a3b8;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
}

.card-close:hover {
  background: #ef4444;
  color: #fff;
}

.card-cover-box {
  position: relative;
  width: 100%;
  height: 150px;
  overflow: hidden;
  cursor: pointer;
  background: #020617;
}

.card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.card-cover-box:hover .card-img {
  transform: scale(1.05);
}

.card-cover-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.1) 0%, rgba(10, 16, 28, 0.85) 100%);
}

.card-type-tag {
  position: absolute;
  top: 8px;
  left: 8px;
  font-size: 9px;
  font-weight: 700;
  color: #fff;
  background: rgba(2, 132, 199, 0.85);
  padding: 2px 6px;
  border-radius: 4px;
}

.card-elev-tag {
  position: absolute;
  bottom: 8px;
  right: 8px;
  font-size: 10px;
  font-weight: 700;
  color: #38bdf8;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(56, 189, 248, 0.3);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

.card-body {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.card-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-title {
  font-size: 14.5px;
  font-weight: 700;
  color: #f8fafc;
  margin: 0;
}

.card-badge {
  font-size: 9.5px;
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.06);
  padding: 1px 5px;
  border-radius: 4px;
}

.card-desc {
  font-size: 11px;
  line-height: 1.5;
  color: #cbd5e1;
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.card-hint {
  font-size: 9.5px;
  color: #64748b;
}

.card-action-btn {
  background: transparent;
  border: none;
  color: #38bdf8;
  font-size: 10.5px;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  transition: all 0.2s;
}

.card-action-btn:hover {
  color: #7dd3fc;
  text-decoration: underline;
}
</style>
