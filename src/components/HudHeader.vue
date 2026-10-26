<template>
  <header class="hud-header glass-panel">
    <div class="header-left">
      <!-- 首页入口 -->
      <button class="nav-btn home-btn" @click="$emit('open-portal')">
        <span class="btn-icon">‹</span>
        <span class="btn-text">首页</span>
      </button>

      <div class="divider"></div>

      <!-- 主题切换下拉/菜单 (宏观沙盘模式) -->
      <div class="theme-nav" v-if="currentMode === 'macro'">
        <button
          v-for="theme in themes"
          :key="theme.id"
          class="theme-tab"
          :class="{ active: currentThemeId === theme.id }"
          @click="$emit('change-theme', theme.id)"
        >
          {{ theme.title }}
        </button>
      </div>

      <!-- 各模式专有标签指示 -->
      <div class="mode-indicator" v-else>
        <span class="mode-tag camp-tag" v-if="currentMode === 'campaign'">⚔️ 历史战役 · 军事沙盘推演</span>
        <span class="mode-tag bonsai-tag" v-if="currentMode === 'bonsai'">🏔️ 微观高精盆景 · Zoom 12 切块</span>
        <span class="mode-tag" v-if="currentMode === 'model'">🔬 科学演化 · 4大互动实验台</span>
      </div>
    </div>

    <!-- 顶部中央模式切换胶囊 -->
    <div class="header-center">
      <button
        class="mode-btn"
        :class="{ active: currentMode === 'macro' }"
        @click="$emit('switch-mode', 'macro')"
      >
        宏观沙盘
      </button>
      <button
        class="mode-btn camp-mode-btn"
        :class="{ active: currentMode === 'campaign' }"
        @click="$emit('switch-mode', 'campaign')"
      >
        ⚔️ 战役演武 3
      </button>
      <button
        class="mode-btn"
        :class="{ active: currentMode === 'bonsai' }"
        @click="$emit('switch-mode', 'bonsai')"
      >
        微观盆景 3
      </button>
      <button
        class="mode-btn"
        :class="{ active: currentMode === 'model' }"
        @click="$emit('switch-mode', 'model')"
      >
        科学模型 4台
      </button>
    </div>

    <!-- 顶部右侧状态、地标图鉴、光照与语音控制器 -->
    <div class="header-right">
      <!-- 地标图鉴与测验入口 (原视频同款特色) -->
      <button class="special-feature-btn" @click="$emit('open-quiz')" title="陕西之最地标图鉴与探究测验">
        <span>📖 图鉴与测验</span>
      </button>

      <!-- 光照时序切换 (晨曦 / 正午 / 暮色) -->
      <div class="lighting-group">
        <button
          class="light-btn"
          :class="{ active: lightingMode === 'dawn' }"
          @click="$emit('change-lighting', 'dawn')"
          title="晨曦拂晓 (金色低角侧光)"
        >
          🌅
        </button>
        <button
          class="light-btn"
          :class="{ active: lightingMode === 'noon' }"
          @click="$emit('change-lighting', 'noon')"
          title="晴空万里 (高空纯净阳光)"
        >
          ☀️
        </button>
        <button
          class="light-btn"
          :class="{ active: lightingMode === 'sunset' }"
          @click="$emit('change-lighting', 'sunset')"
          title="落日暮色 (晚霞余晖长影)"
        >
          🌄
        </button>
      </div>

      <div class="divider"></div>

      <div class="status-pill" :class="{ playing: isPlaying }">
        <span class="status-dot"></span>
        <span class="status-text">{{ isPlaying ? '讲解中' : '待播放' }}</span>
      </div>

      <button class="icon-tool-btn" :class="{ muted: isMuted }" @click="$emit('toggle-voice')" title="讲解语音开关">
        <span v-if="!isMuted">🔊</span>
        <span v-else>🔇</span>
      </button>

      <button class="icon-tool-btn" @click="$emit('reset-north')" title="镜头复位至正北">
        🧭 复位
      </button>

      <button class="icon-tool-btn" @click="$emit('toggle-fullscreen')" title="全屏查看">
        ⛶
      </button>
    </div>
  </header>
</template>

<script setup>
defineProps({
  themes: { type: Array, required: true },
  currentThemeId: { type: String, required: true },
  currentMode: { type: String, required: true },
  isPlaying: { type: Boolean, default: false },
  isMuted: { type: Boolean, default: false },
  lightingMode: { type: String, default: 'dawn' }
});

defineEmits([
  'open-portal',
  'change-theme',
  'switch-mode',
  'toggle-voice',
  'reset-north',
  'toggle-fullscreen',
  'change-lighting',
  'open-quiz'
]);
</script>

<style scoped>
.hud-header {
  position: absolute;
  top: 16px;
  left: 20px;
  right: 20px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 20;
}

.header-left, .header-center, .header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.nav-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  border-radius: 8px;
  padding: 6px 14px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn:hover {
  background: rgba(56, 189, 248, 0.2);
  border-color: #38bdf8;
}

.btn-icon {
  font-size: 16px;
  line-height: 1;
}

.divider {
  width: 1px;
  height: 20px;
  background: rgba(255, 255, 255, 0.15);
  margin: 0 2px;
}

.theme-nav {
  display: flex;
  align-items: center;
  gap: 6px;
}

.theme-tab {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 13px;
  font-weight: 500;
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.theme-tab:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
}

.theme-tab.active {
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.15);
  font-weight: 600;
}

.mode-tag {
  font-size: 12px;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.12);
  padding: 4px 10px;
  border-radius: 6px;
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.mode-tag.camp-tag {
  color: #f87171;
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.35);
}

.mode-tag.bonsai-tag {
  color: #34d399;
  background: rgba(16, 185, 129, 0.15);
  border-color: rgba(16, 185, 129, 0.35);
}

.header-center {
  background: rgba(0, 0, 0, 0.35);
  padding: 3px;
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.mode-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 500;
  padding: 6px 14px;
  border-radius: 7px;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-btn.active {
  background: rgba(56, 189, 248, 0.25);
  color: #fff;
  border: 1px solid rgba(56, 189, 248, 0.5);
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.25);
}

.mode-btn.camp-mode-btn.active {
  background: rgba(239, 68, 68, 0.25);
  border-color: rgba(239, 68, 68, 0.55);
  color: #fca5a5;
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.3);
}

.special-feature-btn {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.3));
  border: 1px solid rgba(245, 158, 11, 0.5);
  color: #fbbf24;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.special-feature-btn:hover {
  background: rgba(245, 158, 11, 0.35);
  color: #fff;
  box-shadow: 0 0 10px rgba(245, 158, 11, 0.4);
}

.lighting-group {
  display: flex;
  background: rgba(0, 0, 0, 0.25);
  padding: 2px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.light-btn {
  background: transparent;
  border: none;
  font-size: 13px;
  padding: 4px 6px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}

.light-btn.active {
  background: rgba(255, 255, 255, 0.15);
}

.status-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 11px;
  color: #94a3b8;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #64748b;
}

.status-pill.playing .status-dot {
  background: #10b981;
  box-shadow: 0 0 8px #10b981;
  animation: pulse-green 1.5s infinite;
}

@keyframes pulse-green {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.icon-tool-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #cbd5e1;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-tool-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

.icon-tool-btn.muted {
  color: #f43f5e;
  border-color: rgba(244, 63, 94, 0.3);
}
</style>
