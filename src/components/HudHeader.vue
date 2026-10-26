<template>
  <header class="hud-header glass-panel">
    <!-- 左区：首页入口与主题切换 -->
    <div class="header-left">
      <button class="nav-btn home-btn" @click="$emit('open-portal')" title="返回首页大屏">
        <span class="btn-icon">‹</span>
        <span class="btn-text">首页</span>
      </button>

      <div class="divider"></div>

      <!-- 主题标签 (宏观沙盘模式) -->
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

      <!-- 模式状态徽标 -->
      <div class="mode-indicator" v-else>
        <span class="mode-tag camp-tag" v-if="currentMode === 'campaign'">⚔️ 历史战役 · 军事沙盘推演</span>
        <span class="mode-tag bonsai-tag" v-if="currentMode === 'bonsai'">🏔️ 微观高精盆景 · Zoom 12 切块</span>
        <span class="mode-tag" v-if="currentMode === 'model'">🔬 科学演变 · 4大互动实验台</span>
      </div>
    </div>

    <!-- 中区：模式切换胶囊坞 -->
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
        ⚔️ 战役演武
      </button>
      <button
        class="mode-btn"
        :class="{ active: currentMode === 'bonsai' }"
        @click="$emit('switch-mode', 'bonsai')"
      >
        微观盆景
      </button>
      <button
        class="mode-btn"
        :class="{ active: currentMode === 'model' }"
        @click="$emit('switch-mode', 'model')"
      >
        科学模型
      </button>
    </div>

    <!-- 右区：图鉴测验、光照时序、语音与全屏 -->
    <div class="header-right">
      <!-- 地标图鉴与测验入口 -->
      <button class="special-feature-btn" @click="$emit('open-quiz')" title="陕西之最地标图鉴与探究测验">
        <span>📖 图鉴与测验</span>
      </button>

      <!-- 晨曦/正午/暮色 -->
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

      <!-- 语音朗读控制 -->
      <button class="icon-tool-btn" :class="{ muted: isMuted, active: isPlaying }" @click="$emit('toggle-voice')" title="语音讲解">
        <span v-if="!isMuted">🔊</span>
        <span v-else>🔇</span>
      </button>

      <!-- 全屏切换 -->
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
  top: 14px;
  left: 20px;
  right: 20px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  z-index: 20;
  border-radius: 12px;
  border: 1px solid rgba(56, 189, 248, 0.25);
}

.header-left, .header-center, .header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.nav-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  border-radius: 7px;
  padding: 4px 10px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn:hover {
  background: rgba(56, 189, 248, 0.2);
  border-color: #38bdf8;
}

.btn-icon {
  font-size: 15px;
  line-height: 1;
}

.divider {
  width: 1px;
  height: 18px;
  background: rgba(255, 255, 255, 0.12);
  margin: 0 2px;
}

.theme-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.theme-tab {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 500;
  padding: 4px 10px;
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
  font-size: 11px;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.12);
  padding: 3px 8px;
  border-radius: 5px;
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
  background: rgba(0, 0, 0, 0.4);
  padding: 3px;
  border-radius: 9px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.mode-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 11.5px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-btn:hover {
  color: #fff;
}

.mode-btn.active {
  background: rgba(56, 189, 248, 0.22);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.4);
}

.mode-btn.camp-mode-btn.active {
  background: rgba(239, 68, 68, 0.22);
  color: #fca5a5;
  border-color: rgba(239, 68, 68, 0.4);
}

.special-feature-btn {
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(14, 165, 233, 0.3));
  border: 1px solid rgba(56, 189, 248, 0.5);
  color: #38bdf8;
  padding: 4px 10px;
  border-radius: 7px;
  font-size: 11.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
}

.special-feature-btn:hover {
  background: rgba(56, 189, 248, 0.4);
  color: #fff;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.4);
}

.lighting-group {
  display: flex;
  background: rgba(0, 0, 0, 0.35);
  padding: 2px;
  border-radius: 7px;
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.light-btn {
  background: transparent;
  border: none;
  font-size: 12px;
  padding: 3px 6px;
  border-radius: 5px;
  cursor: pointer;
  transition: all 0.2s;
}

.light-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.light-btn.active {
  background: rgba(56, 189, 248, 0.25);
}

.icon-tool-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #fff;
  border-radius: 6px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-tool-btn:hover {
  background: rgba(56, 189, 248, 0.2);
  border-color: #38bdf8;
}

.icon-tool-btn.active {
  border-color: #38bdf8;
  box-shadow: 0 0 8px rgba(56, 189, 248, 0.4);
}

.icon-tool-btn.muted {
  opacity: 0.6;
}
</style>
