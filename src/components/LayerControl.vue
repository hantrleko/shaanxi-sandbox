<template>
  <div class="layer-control-wrap">
    <!-- 图层开关折叠面板 -->
    <div class="layer-panel glass-panel" v-if="isOpen">
      <div class="panel-header">
        <span class="title">图例与图层显隐</span>
        <button class="close-btn" @click="isOpen = false">✕</button>
      </div>

      <div class="layer-list">
        <label class="layer-item">
          <input type="checkbox" v-model="layers.border" @change="emitChange" />
          <span class="color-dot" style="background: #38bdf8;"></span>
          <span class="text">真实省界与十地市境界</span>
        </label>

        <label class="layer-item">
          <input type="checkbox" v-model="layers.rivers" @change="emitChange" />
          <span class="color-dot" style="background: #06b6d4;"></span>
          <span class="text">三大骨干水系 (黄河/渭河/汉江)</span>
        </label>

        <label class="layer-item">
          <input type="checkbox" v-model="layers.qinlingLine" @change="emitChange" />
          <span class="color-dot" style="background: #10b981;"></span>
          <span class="text">秦岭南北地理分界线 (800mm)</span>
        </label>

        <label class="layer-item">
          <input type="checkbox" v-model="layers.silkRoad" @change="emitChange" />
          <span class="color-dot" style="background: #f59e0b;"></span>
          <span class="text">丝绸之路初始出关古道</span>
        </label>

        <label class="layer-item">
          <input type="checkbox" v-model="layers.regions" @change="emitChange" />
          <span class="color-dot" style="background: #a855f7;"></span>
          <span class="text">山脉地貌三维贴地大字</span>
        </label>

        <label class="layer-item">
          <input type="checkbox" v-model="layers.pois" @change="emitChange" />
          <span class="color-dot" style="background: #f43f5e;"></span>
          <span class="text">重点历史人文与名山 POI</span>
        </label>
      </div>
    </div>

    <!-- 悬浮触发按钮与指北针 -->
    <div class="control-bar">
      <!-- 动态旋转指北针 -->
      <button class="compass-btn glass-panel" @click="$emit('reset-north')" title="点击正北复位">
        <div class="compass-dial" :style="{ transform: `rotate(${-azimuth}deg)` }">
          <span class="needle-n">▲ N</span>
        </div>
      </button>

      <!-- 图层面板展开按钮 -->
      <button class="layer-toggle-btn glass-panel" :class="{ active: isOpen }" @click="isOpen = !isOpen">
        <span>🗺️ 图例·图层</span>
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
  regions: true,
  pois: true
});

const emitChange = () => {
  emit('update-layers', { ...layers });
};
</script>

<style scoped>
.layer-control-wrap {
  position: absolute;
  bottom: 60px;
  right: 20px;
  z-index: 18;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.layer-panel {
  width: 220px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  animation: fadeIn 0.2s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  padding-bottom: 6px;
}

.panel-header .title {
  font-size: 11px;
  font-weight: 700;
  color: #38bdf8;
  letter-spacing: 0.05em;
}

.close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 12px;
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
  font-size: 11px;
  color: #cbd5e1;
  cursor: pointer;
  user-select: none;
}

.layer-item input {
  accent-color: #38bdf8;
  cursor: pointer;
}

.color-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.control-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.compass-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.15);
  transition: all 0.2s;
}

.compass-btn:hover {
  border-color: #38bdf8;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
}

.compass-dial {
  font-size: 10px;
  font-weight: 800;
  color: #f43f5e;
  transition: transform 0.1s linear;
}

.needle-n {
  letter-spacing: 1px;
}

.layer-toggle-btn {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  color: #cbd5e1;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.layer-toggle-btn:hover, .layer-toggle-btn.active {
  background: rgba(56, 189, 248, 0.2);
  border-color: #38bdf8;
  color: #fff;
}
</style>
