<template>
  <header class="hud-header glass-panel">
    <!-- 左区：Eugene Finance 品牌徽章与门户入口 -->
    <div class="header-left">
      <div class="brand-badge-box" @click="$emit('open-portal')" title="返回首页大屏 · EUGENE FINANCE">
        <img src="/images/brand/eugene_logo_badge.png" alt="Eugene Finance" class="brand-logo" />
        <div class="brand-info">
          <span class="brand-name">EUGENE FINANCE</span>
          <span class="brand-sub">三秦三维沙盒</span>
        </div>
      </div>

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
        <span class="mode-tag bonsai-tag" v-if="currentMode === 'bonsai'">🏔️ 微观高精盆景 · Zoom 12</span>
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

    <!-- 右区：核心创新功能、光照时序与拍照海报 -->
    <div class="header-right">
      <!-- 🎬 电影级自动巡航导览 -->
      <button class="feature-pill gold-pill" @click="$emit('open-tour')" title="开启《航拍三秦》纪录片级自动巡航导览">
        <span>🎬 航拍导览</span>
      </button>

      <!-- 📐 任意拉线剖面测绘 -->
      <button
        class="feature-pill cyan-pill"
        :class="{ active: isProfilingActive }"
        @click="$emit('toggle-profiling')"
        title="在沙盘上任意划线测绘真实 DEM 海拔起伏剖面"
      >
        <span>📐 {{ isProfilingActive ? '测绘中...' : '测绘剖面' }}</span>
      </button>

      <!-- 🎯 寻迹探秘挑战 -->
      <button class="feature-pill emerald-pill" @click="$emit('open-detective')" title="开启‘寻迹三秦’空间探秘解谜挑战">
        <span>🎯 寻迹探秘</span>
      </button>

      <!-- ⚔️ 战役兵棋推演 (仅在战役模式显现) -->
      <button
        v-if="currentMode === 'campaign'"
        class="feature-pill red-pill"
        @click="$emit('open-wargame')"
        title="查看诸葛亮北伐/楚汉争霸双路线军事地形推演"
      >
        <span>⚔️ 兵棋对比</span>
      </button>

      <!-- 📸 拍照生成国风海报 -->
      <button class="feature-pill amber-pill" @click="$emit('open-poster')" title="截取沙盘画面并生成 EUGENE FINANCE 认证国风打卡海报">
        <span>📸 拍照打卡</span>
      </button>

      <div class="divider"></div>

      <!-- 晨曦/正午/暮色 -->
      <div class="lighting-group">
        <button
          class="light-btn"
          :class="{ active: lightingMode === 'dawn' }"
          @click="$emit('change-lighting', 'dawn')"
          title="晨曦拂晓"
        >
          🌅
        </button>
        <button
          class="light-btn"
          :class="{ active: lightingMode === 'noon' }"
          @click="$emit('change-lighting', 'noon')"
          title="晴空万里"
        >
          ☀️
        </button>
        <button
          class="light-btn"
          :class="{ active: lightingMode === 'sunset' }"
          @click="$emit('change-lighting', 'sunset')"
          title="落日暮色"
        >
          🌄
        </button>
      </div>

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
  lightingMode: { type: String, default: 'dawn' },
  isProfilingActive: { type: Boolean, default: false }
});

defineEmits([
  'open-portal',
  'change-theme',
  'switch-mode',
  'toggle-fullscreen',
  'change-lighting',
  'open-tour',
  'toggle-profiling',
  'open-detective',
  'open-wargame',
  'open-poster'
]);
</script>

<style scoped>
.hud-header {
  position: absolute;
  top: 14px;
  left: 20px;
  right: 20px;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  z-index: 20;
  border-radius: 12px;
  border: 1px solid rgba(56, 189, 248, 0.28);
  background: rgba(10, 15, 25, 0.88);
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.6);
}

.header-left, .header-center, .header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.brand-badge-box {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 3px 8px;
  border-radius: 8px;
  transition: all 0.2s;
}

.brand-badge-box:hover {
  background: rgba(56, 189, 248, 0.12);
}

.brand-logo {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid rgba(56, 189, 248, 0.4);
}

.brand-info {
  display: flex;
  flex-direction: column;
}

.brand-name {
  font-size: 11px;
  font-weight: 800;
  color: #38bdf8;
  letter-spacing: 0.08em;
  line-height: 1.1;
}

.brand-sub {
  font-size: 10px;
  color: #94a3b8;
  letter-spacing: 0.02em;
}

.divider {
  width: 1px;
  height: 20px;
  background: rgba(255, 255, 255, 0.15);
  margin: 0 4px;
}

.theme-nav {
  display: flex;
  gap: 4px;
}

.theme-tab {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 12px;
  padding: 5px 10px;
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
  font-weight: 700;
}

.mode-tag {
  font-size: 11.5px;
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.mode-tag.camp-tag {
  background: rgba(239, 68, 68, 0.15);
  color: #fca5a5;
  border-color: rgba(239, 68, 68, 0.4);
}

.header-center {
  background: rgba(15, 23, 42, 0.6);
  padding: 3px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.mode-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 11.5px;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-btn:hover {
  color: #fff;
}

.mode-btn.active {
  background: #0284c7;
  color: #fff;
  font-weight: 700;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.35);
}

.camp-mode-btn.active {
  background: #dc2626;
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.4);
}

/* 创新功能按钮组 */
.feature-pill {
  padding: 4px 10px;
  border-radius: 14px;
  font-size: 11.5px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}

.gold-pill {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.2), rgba(217, 119, 6, 0.25));
  border: 1px solid rgba(245, 158, 11, 0.5);
  color: #fef08a;
}
.gold-pill:hover {
  background: rgba(245, 158, 11, 0.4);
  box-shadow: 0 0 10px rgba(245, 158, 11, 0.4);
}

.cyan-pill {
  background: rgba(56, 189, 248, 0.15);
  border: 1px solid rgba(56, 189, 248, 0.4);
  color: #38bdf8;
}
.cyan-pill:hover, .cyan-pill.active {
  background: #0284c7;
  color: #fff;
  border-color: #38bdf8;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.4);
}

.emerald-pill {
  background: rgba(16, 185, 129, 0.15);
  border: 1px solid rgba(16, 185, 129, 0.4);
  color: #34d399;
}
.emerald-pill:hover {
  background: rgba(16, 185, 129, 0.3);
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
}

.red-pill {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.5);
  color: #fca5a5;
}
.red-pill:hover {
  background: rgba(239, 68, 68, 0.4);
}

.amber-pill {
  background: rgba(217, 119, 6, 0.15);
  border: 1px solid rgba(217, 119, 6, 0.4);
  color: #fcd34d;
}
.amber-pill:hover {
  background: rgba(217, 119, 6, 0.35);
  box-shadow: 0 0 10px rgba(217, 119, 6, 0.3);
}

.lighting-group {
  display: flex;
  background: rgba(15, 23, 42, 0.6);
  padding: 2px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.light-btn {
  background: transparent;
  border: none;
  font-size: 13px;
  padding: 3px 6px;
  border-radius: 4px;
  cursor: pointer;
  opacity: 0.65;
  transition: all 0.2s;
}

.light-btn:hover {
  opacity: 1;
}

.light-btn.active {
  opacity: 1;
  background: rgba(255, 255, 255, 0.15);
}

.icon-tool-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #cbd5e1;
  font-size: 13px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.icon-tool-btn:hover {
  border-color: #38bdf8;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.15);
}

@media (max-width: 1024px) {
  .theme-nav, .lighting-group {
    display: none;
  }
}

@media (max-width: 768px) {
  .header-center {
    display: none;
  }
}
</style>
