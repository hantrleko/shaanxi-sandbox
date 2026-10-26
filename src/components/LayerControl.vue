<template>
  <div class="layer-control-wrap">
    <!-- 图层开关折叠面板 -->
    <div class="layer-panel glass-panel" v-if="isOpen">
      <div class="panel-header">
        <span class="title">地图图层显隐</span>
        <button class="close-btn" @click="isOpen = false">✕</button>
      </div>

      <div class="layer-list">
        <label class="layer-item">
          <input type="checkbox" v-model="layers.border" @change="emitChange" />
          <span class="color-dot" style="background: #38bdf8;"></span>
          <span class="text">真实十地市行政境界</span>
        </label>

        <label class="layer-item">
          <input type="checkbox" v-model="layers.rivers" @change="emitChange" />
          <span class="color-dot" style="background: #06b6d4;"></span>
          <span class="text">四大骨干水系 (黄/渭/汉/泾)</span>
        </label>

        <label class="layer-item">
          <input type="checkbox" v-model="layers.qinlingLine" @change="emitChange" />
          <span class="color-dot" style="background: #10b981;"></span>
          <span class="text">秦岭气候界线 (800mm)</span>
        </label>

        <label class="layer-item">
          <input type="checkbox" v-model="layers.silkRoad" @change="emitChange" />
          <span class="color-dot" style="background: #f59e0b;"></span>
          <span class="text">丝绸之路初始出关古道</span>
        </label>

        <label class="layer-item">
          <input type="checkbox" v-model="layers.pois" @change="emitChange" />
          <span class="color-dot" style="background: #ec4899;"></span>
          <span class="text">重点历史人文与名山地标</span>
        </label>
      </div>
    </div>

    <!-- 紧凑悬浮控制条：指北针 + 图层按钮 -->
    <div class="control-bar">
      <!-- 动态旋转指北针 (点击一键正北复位) -->
      <button class="compass-btn glass-panel" @click="$emit('reset-north')" title="点击正北复位 (Alt+N)">
        <div class="compass-dial" :style="{ transform: `rotate(${-azimuth}deg)` }">
          <span class="needle-n">▲</span>
          <span class="compass-n-text">N</span>
        </div>
      </button>

      <!-- 图层开关按钮 -->
      <button class="layer-toggle-btn glass-panel" :class="{ active: isOpen }" @click="isOpen = !isOpen" title="展开/收起图层显隐">
        <span>🗺️ 图层</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';

defineProps({
  azimuth: { type: Number, default: 0 }
});

const emit = defineEmits(['update-layers', 'reset-north']);

const isOpen = ref(false);

const layers = reactive({
  border: true,
  rivers: true,
  qinlingLine: true,
  silkRoad: true,
  pois: true
});

const emitChange = () => {
  emit('update-layers', { ...layers });
};
</script>

<style scoped>
.layer-control-wrap {
  position: absolute;
  bottom: 18px;
  right: 20px;
  z-index: 18;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.control-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.compass-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: rgba(10, 15, 24, 0.88);
  border: 1px solid rgba(56, 189, 248, 0.35);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  transition: all 0.2s;
}

.compass-btn:hover {
  border-color: #38bdf8;
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.4);
  transform: scale(1.06);
}

.compass-dial {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  transition: transform 0.1s linear;
  line-height: 1;
}

.needle-n {
  color: #ef4444;
  font-size: 11px;
}

.compass-n-text {
  color: #38bdf8;
  font-size: 10px;
  font-weight: 800;
  margin-top: 1px;
}

.layer-toggle-btn {
  height: 44px;
  padding: 0 14px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #f0f9ff;
  cursor: pointer;
  background: rgba(10, 15, 24, 0.88);
  border: 1px solid rgba(56, 189, 248, 0.35);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  transition: all 0.2s;
}

.layer-toggle-btn:hover, .layer-toggle-btn.active {
  border-color: #38bdf8;
  background: rgba(56, 189, 248, 0.18);
  box-shadow: 0 0 14px rgba(56, 189, 248, 0.35);
}

.layer-panel {
  width: 220px;
  padding: 12px;
  border-radius: 12px;
  background: rgba(10, 15, 24, 0.94);
  border: 1px solid rgba(56, 189, 248, 0.4);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.7);
  animation: slide-up 0.2s ease-out;
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  padding-bottom: 6px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.title {
  font-size: 12px;
  font-weight: 700;
  color: #38bdf8;
}

.close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 13px;
}

.close-btn:hover {
  color: #fff;
}

.layer-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.layer-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11.5px;
  color: #cbd5e1;
  cursor: pointer;
}

.layer-item:hover {
  color: #fff;
}

.color-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.text {
  user-select: none;
}
</style>
