<template>
  <div v-if="active" class="gallery-overlay" @click.self="$emit('close')">
    <div class="gallery-card glass-panel">
      <!-- 弹窗头部 -->
      <div class="gallery-header">
        <div class="header-info">
          <div class="title-row">
            <span class="gallery-icon">📸</span>
            <h2 class="main-title">三秦实景影集 · 3D空间摄影画廊</h2>
            <span class="count-tag">16 处地标实景</span>
          </div>
          <p class="sub-title">SHAANXI REAL SCENERY PHOTOGRAPHY & GEOGRAPHIC LOCATIONS</p>
        </div>

        <div class="header-right">
          <button class="close-btn" @click="$emit('close')" title="关闭影集">✕</button>
        </div>
      </div>

      <!-- 分类标签过滤器 -->
      <div class="filter-strip">
        <button
          v-for="cat in categories"
          :key="cat.id"
          class="cat-pill"
          :class="{ active: currentCategory === cat.id }"
          @click="currentCategory = cat.id"
        >
          {{ cat.name }} ({{ getCategoryCount(cat.id) }})
        </button>
      </div>

      <!-- 实景照片瀑布流网格 -->
      <div class="gallery-grid custom-scrollbar">
        <div
          v-for="item in filteredList"
          :key="item.id"
          class="photo-card"
          @click="openLightbox(item)"
        >
          <!-- 照片封面与角标 -->
          <div class="photo-img-wrap">
            <img :src="item.url" :alt="item.title" class="photo-img" loading="lazy" />
            <div class="img-gradient"></div>
            <span class="region-tag" :class="item.region">{{ item.region }}</span>
            <span class="elev-tag">海拔 {{ item.elevation }}</span>
          </div>

          <!-- 照片文案与操作 -->
          <div class="photo-meta">
            <div class="meta-title">{{ item.title.split('·')[0].trim() }}</div>
            <div class="meta-sub">{{ item.subtitle }}</div>
            <div class="meta-footer">
              <span class="meta-loc">{{ item.location.split('·')[0].trim() }}</span>
              <button class="fly-btn" @click.stop="flyToScenery(item)">
                <svg class="fly-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="3 11 22 2 13 21 11 13 3 11"></polygon>
                </svg>
                <span>飞往沙盘</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部统计与提示 -->
      <div class="gallery-footer">
        <span class="footer-hint">💡 提示：点击任意照片可放大全屏鉴赏细节；点击“飞往沙盘”镜头将瞬移并聚焦到该实景在陕西省三维地形中的绝对地理坐标。</span>
        <button class="done-btn" @click="$emit('close')">返回三维沙盘</button>
      </div>
    </div>

    <!-- 🔍 全屏大图鉴赏灯箱 (Lightbox) -->
    <div v-if="activeLightboxItem" class="lightbox-overlay" @click.self="activeLightboxItem = null">
      <div class="lightbox-content">
        <button class="lb-close-btn" @click="activeLightboxItem = null">✕</button>

        <div class="lb-img-box">
          <img :src="activeLightboxItem.url" :alt="activeLightboxItem.title" class="lb-img" />
        </div>

        <div class="lb-info-box glass-panel">
          <div class="lb-header-row">
            <div>
              <span class="lb-region-badge">{{ activeLightboxItem.region }}</span>
              <h3 class="lb-title">{{ activeLightboxItem.title }}</h3>
            </div>
            <span class="lb-elevation">物理海拔: {{ activeLightboxItem.elevation }}</span>
          </div>
          <p class="lb-desc">{{ activeLightboxItem.desc }}</p>
          <div class="lb-actions">
            <span class="lb-loc">📍 {{ activeLightboxItem.location }}</span>
            <button class="lb-fly-btn" @click="flyToScenery(activeLightboxItem); activeLightboxItem = null">
              <span>在沙盘中俯瞰此处地理实景 ➔</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { SCENERY_PHOTOS } from '../data/shaanxiData.js';
import { soundscape } from '../utils/soundscape.js';

defineProps({
  active: { type: Boolean, default: false }
});

const emit = defineEmits(['close', 'fly-to']);

const currentCategory = ref('all');
const activeLightboxItem = ref(null);

const categories = [
  { id: 'all', name: '全部实景' },
  { id: '关中', name: '关中名胜' },
  { id: '陕北', name: '陕北风光' },
  { id: '陕南', name: '陕南山水' },
  { id: '秦岭', name: '秦岭主脊' }
];

const getCategoryCount = (catId) => {
  if (catId === 'all') return (SCENERY_PHOTOS || []).length;
  return (SCENERY_PHOTOS || []).filter(item => item.region === catId).length;
};

const filteredList = computed(() => {
  const list = SCENERY_PHOTOS || [];
  if (currentCategory.value === 'all') return list;
  return list.filter(item => item.region === currentCategory.value);
});

const openLightbox = (item) => {
  activeLightboxItem.value = item;
  soundscape.playClick();
};

const flyToScenery = (item) => {
  soundscape.playClick();
  emit('fly-to', item);
  emit('close');
};
</script>

<style scoped>
.gallery-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(3, 7, 18, 0.8);
  backdrop-filter: blur(14px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.gallery-card {
  width: 100%;
  max-width: 980px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: rgba(10, 16, 28, 0.95);
  border: 1px solid rgba(56, 189, 248, 0.35);
  border-radius: 16px;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.85), 0 0 35px rgba(56, 189, 248, 0.15);
  overflow: hidden;
  animation: popIn 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes popIn {
  from { opacity: 0; transform: scale(0.95) translateY(12px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.gallery-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.gallery-icon {
  font-size: 22px;
}

.main-title {
  font-size: 16.5px;
  font-weight: 700;
  color: #f8fafc;
  margin: 0;
}

.count-tag {
  font-size: 10px;
  background: rgba(56, 189, 248, 0.15);
  border: 1px solid rgba(56, 189, 248, 0.4);
  color: #38bdf8;
  padding: 2px 7px;
  border-radius: 10px;
  font-weight: 600;
}

.sub-title {
  font-size: 9.5px;
  color: #64748b;
  margin: 3px 0 0;
  letter-spacing: 0.08em;
}

.close-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  width: 30px;
  height: 30px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.25);
  color: #f87171;
  border-color: rgba(239, 68, 68, 0.4);
}

.filter-strip {
  display: flex;
  gap: 8px;
  padding: 10px 24px;
  background: rgba(6, 10, 20, 0.5);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.cat-pill {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #94a3b8;
  padding: 5px 12px;
  border-radius: 8px;
  font-size: 11.5px;
  cursor: pointer;
  transition: all 0.2s;
}

.cat-pill:hover {
  background: rgba(56, 189, 248, 0.1);
  color: #e2e8f0;
}

.cat-pill.active {
  background: rgba(56, 189, 248, 0.2);
  border-color: #38bdf8;
  color: #38bdf8;
  font-weight: 700;
}

.gallery-grid {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

@media (max-width: 860px) {
  .gallery-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 580px) {
  .gallery-grid {
    grid-template-columns: 1fr;
  }
}

.photo-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.25s ease;
  display: flex;
  flex-direction: column;
}

.photo-card:hover {
  transform: translateY(-4px);
  border-color: rgba(56, 189, 248, 0.45);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.6), 0 0 16px rgba(56, 189, 248, 0.2);
}

.photo-img-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  background: #0b1324;
}

.photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s ease;
}

.photo-card:hover .photo-img {
  transform: scale(1.06);
}

.img-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.1) 0%, rgba(0, 0, 0, 0.65) 100%);
}

.region-tag {
  position: absolute;
  top: 8px;
  left: 8px;
  font-size: 9.5px;
  padding: 2px 7px;
  border-radius: 4px;
  font-weight: 700;
  color: #fff;
  backdrop-filter: blur(4px);
}

.region-tag.关中 { background: rgba(34, 197, 94, 0.75); }
.region-tag.陕北 { background: rgba(234, 179, 8, 0.85); color: #000; }
.region-tag.陕南 { background: rgba(6, 182, 212, 0.8); }
.region-tag.秦岭 { background: rgba(14, 165, 233, 0.85); }

.elev-tag {
  position: absolute;
  bottom: 8px;
  right: 8px;
  font-size: 9.5px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(15, 23, 42, 0.85);
  color: #38bdf8;
  font-weight: 600;
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.photo-meta {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  flex: 1;
}

.meta-title {
  font-size: 13.5px;
  font-weight: 700;
  color: #f1f5f9;
}

.meta-sub {
  font-size: 10.5px;
  color: #94a3b8;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.meta-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.meta-loc {
  font-size: 9.5px;
  color: #64748b;
  max-width: 60%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fly-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.3);
  color: #38bdf8;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.fly-btn:hover {
  background: #0284c7;
  color: #fff;
  border-color: #38bdf8;
}

.fly-ico {
  width: 10px;
  height: 10px;
}

.gallery-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(6, 10, 20, 0.6);
}

.footer-hint {
  font-size: 10.5px;
  color: #64748b;
}

.done-btn {
  background: #0284c7;
  color: #ffffff;
  border: none;
  padding: 7px 18px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.done-btn:hover {
  background: #0369a1;
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.4);
}

/* 🔍 全屏大图灯箱 */
.lightbox-overlay {
  position: fixed;
  inset: 0;
  z-index: 120;
  background: rgba(2, 6, 18, 0.94);
  backdrop-filter: blur(16px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30px;
  animation: fadeIn 0.25s ease-out;
}

.lightbox-content {
  position: relative;
  max-width: 960px;
  width: 100%;
  display: flex;
  flex-direction: column;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.9);
  border: 1px solid rgba(56, 189, 248, 0.35);
}

.lb-close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  background: rgba(15, 23, 42, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #f1f5f9;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.lb-close-btn:hover {
  background: #ef4444;
}

.lb-img-box {
  width: 100%;
  max-height: 560px;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.lb-img {
  width: 100%;
  height: auto;
  max-height: 560px;
  object-fit: contain;
}

.lb-info-box {
  padding: 18px 24px;
  background: rgba(11, 18, 32, 0.96);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.lb-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.lb-region-badge {
  font-size: 10px;
  background: #0284c7;
  color: #fff;
  padding: 2px 7px;
  border-radius: 4px;
  font-weight: 700;
  margin-right: 8px;
}

.lb-title {
  display: inline;
  font-size: 17px;
  font-weight: 700;
  color: #f8fafc;
  margin: 0;
}

.lb-elevation {
  font-size: 12px;
  font-weight: 700;
  color: #38bdf8;
  font-family: monospace;
}

.lb-desc {
  font-size: 12px;
  line-height: 1.6;
  color: #cbd5e1;
  margin: 0;
}

.lb-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 6px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.lb-loc {
  font-size: 10.5px;
  color: #94a3b8;
}

.lb-fly-btn {
  background: linear-gradient(135deg, #0284c7, #0369a1);
  border: 1px solid #38bdf8;
  color: #fff;
  padding: 6px 16px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.lb-fly-btn:hover {
  background: #0369a1;
  box-shadow: 0 0 16px rgba(56, 189, 248, 0.5);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 6px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
}
</style>
