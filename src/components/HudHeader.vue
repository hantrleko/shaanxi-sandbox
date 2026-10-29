<template>
  <header class="hud-header glass-panel" role="banner">
    <!-- 左区：Eugene Finance 品牌徽章与 V4.0 标识 -->
    <div class="header-left">
      <div class="brand-badge-box" @click="$emit('open-portal')" title="返回首页大屏 · EUGENE FINANCE">
        <img :src="BRAND_LOGO_BADGE" alt="Eugene Finance" class="brand-logo" />
        <div class="brand-info">
          <div class="brand-title-row">
            <span class="brand-name">EUGENE FINANCE</span>
            <span class="seal-badge">官方认证</span>
          </div>
          <span class="brand-sub">三秦三维数字地貌与文明探源</span>
        </div>
      </div>

      <!-- V4.0 PRO 旗舰版本升级日志入口 -->
      <button class="ver-pill-badge" @click="$emit('open-changelog')" title="点击查看 V4.0 架构演进与版本升级日志">
        <span class="ver-pulse-dot"></span>
        <span class="ver-txt">v4.0 PRO</span>
      </button>
    </div>

    <!-- 中区：模式切换胶囊坞 (宏观沙盘 · 历史战役 · 微观盆景 · 科学模型) -->
    <div class="header-center">
      <nav class="mode-capsule-nav" aria-label="沙盒主视图模式">
        <button
          class="mode-btn"
          :class="{ active: currentMode === 'macro' }"
          @click="$emit('switch-mode', 'macro')"
        >
          <Globe :size="15" />
          <span>宏观沙盘</span>
        </button>
        <button
          class="mode-btn camp-mode-btn"
          :class="{ active: currentMode === 'campaign' }"
          @click="$emit('switch-mode', 'campaign')"
        >
          <Swords :size="15" />
          <span>战役演武</span>
        </button>
        <button
          class="mode-btn"
          :class="{ active: currentMode === 'bonsai' }"
          @click="$emit('switch-mode', 'bonsai')"
        >
          <Box :size="15" />
          <span>微观切块</span>
        </button>
        <button
          class="mode-btn"
          :class="{ active: currentMode === 'model' }"
          @click="$emit('switch-mode', 'model')"
        >
          <FlaskConical :size="15" />
          <span>科学实验</span>
        </button>
      </nav>
    </div>

    <!-- 右区：三秦大主题标签、探索多维矩阵下拉与 ⌘K 检索 -->
    <div class="header-right">
      <!-- 宏观沙盘下的大主题切换 (自然地理 · 华夏根脉 · 丝路起点) -->
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

      <div class="header-divider"></div>

      <!-- 「探索」综合功能下拉菜单 -->
      <div class="explore-dropdown-wrap" ref="exploreRef">
        <button
          class="explore-btn"
          :class="{ active: isExploreOpen }"
          @click="isExploreOpen = !isExploreOpen"
          title="展开三秦文旅研学、航拍与测绘功能矩阵"
          aria-haspopup="true"
          :aria-expanded="isExploreOpen"
        >
          <Compass :size="16" class="explore-icon" />
          <span>探索矩阵</span>
          <ChevronDown :size="13" class="arrow-icon" :class="{ open: isExploreOpen }" />
        </button>

        <transition name="dropdown">
          <div v-if="isExploreOpen" class="explore-menu glass-panel" role="menu">
            <div class="menu-header">三秦时空探索工具</div>
            <button class="menu-item" @click="handleTool('gallery')" role="menuitem">
              <Images :size="15" class="item-icn gold" />
              <div class="item-text">
                <span class="m-title">实景影集画廊</span>
                <span class="m-desc">16 处国家级地标高清真实自然摄影</span>
              </div>
            </button>
            <button class="menu-item" @click="handleTool('tour')" role="menuitem">
              <Video :size="15" class="item-icn blue" />
              <div class="item-text">
                <span class="m-title">《航拍三秦》巡航</span>
                <span class="m-desc">电影级自动运镜贯穿秦岭陕北</span>
              </div>
            </button>
            <button class="menu-item" @click="handleTool('roadbook')" role="menuitem">
              <Navigation :size="15" class="item-icn cyan" />
              <div class="item-text">
                <span class="m-title">3D 贴地路书工坊</span>
                <span class="m-desc">秦岭 210、褒斜道多点飞行预演</span>
              </div>
            </button>
            <button class="menu-item" @click="handleTool('profiling')" role="menuitem">
              <Activity :size="15" class="item-icn emerald" />
              <div class="item-text">
                <span class="m-title">任意拉线剖面测绘</span>
                <span class="m-desc">两点生成真实物理高程剖面曲线</span>
              </div>
            </button>
            <button class="menu-item" @click="handleTool('detective')" role="menuitem">
              <Crosshair :size="15" class="item-icn purple" />
              <div class="item-text">
                <span class="m-title">寻迹三秦 · 空间探秘</span>
                <span class="m-desc">看图识地理、经纬度测绘答题挑战</span>
              </div>
            </button>
            <button class="menu-item" @click="handleTool('wargame')" role="menuitem">
              <Swords :size="15" class="item-icn rose" />
              <div class="item-text">
                <span class="m-title">战役双路线兵棋推演</span>
                <span class="m-desc">明修暗度陈仓、子午谷战术对比</span>
              </div>
            </button>
            <button class="menu-item" @click="handleTool('poster')" role="menuitem">
              <Camera :size="15" class="item-icn gold" />
              <div class="item-text">
                <span class="m-title">国风地理明信片</span>
                <span class="m-desc">3D 沙盘快照与文旅海报生成</span>
              </div>
            </button>
          </div>
        </transition>
      </div>

      <!-- ⌘K 命令面板呼出按钮 -->
      <button class="cmd-trigger-btn" @click="$emit('open-cmd')" title="全局搜索地标与指令 (⌘K / Ctrl+K)">
        <Search :size="15" />
        <span class="cmd-kbd">⌘K</span>
      </button>

      <!-- 全屏切换 -->
      <button class="icon-tool-btn" @click="$emit('toggle-fullscreen')" title="切换浏览器全屏浏览 (F)">
        <Maximize2 :size="15" />
      </button>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import {
  Globe,
  Swords,
  Box,
  FlaskConical,
  Compass,
  ChevronDown,
  Images,
  Video,
  Navigation,
  Activity,
  Crosshair,
  Camera,
  Search,
  Maximize2
} from 'lucide-vue-next';
import { BRAND_LOGO_BADGE } from '../data/shaanxiData.js';

const props = defineProps({
  themes: { type: Array, required: true },
  currentThemeId: { type: String, required: true },
  currentMode: { type: String, default: 'macro' },
  isProfilingActive: { type: Boolean, default: false },
  isRoadbookActive: { type: Boolean, default: false }
});

const emit = defineEmits([
  'open-portal',
  'change-theme',
  'switch-mode',
  'toggle-fullscreen',
  'open-tour',
  'open-roadbook',
  'open-gallery',
  'toggle-profiling',
  'open-detective',
  'open-wargame',
  'open-poster',
  'open-changelog',
  'open-cmd'
]);

const isExploreOpen = ref(false);
const exploreRef = ref(null);

const handleTool = (tool) => {
  isExploreOpen.value = false;
  if (tool === 'gallery') emit('open-gallery');
  else if (tool === 'tour') emit('open-tour');
  else if (tool === 'roadbook') emit('open-roadbook');
  else if (tool === 'profiling') emit('toggle-profiling');
  else if (tool === 'detective') emit('open-detective');
  else if (tool === 'wargame') emit('open-wargame');
  else if (tool === 'poster') emit('open-poster');
};

const handleOutsideClick = (e) => {
  if (exploreRef.value && !exploreRef.value.contains(e.target)) {
    isExploreOpen.value = false;
  }
};

onMounted(() => {
  window.addEventListener('click', handleOutsideClick);
});

onBeforeUnmount(() => {
  window.removeEventListener('click', handleOutsideClick);
});
</script>

<style scoped>
.hud-header {
  position: absolute;
  top: 14px;
  left: 20px;
  right: 20px;
  height: 54px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  z-index: 40;
  background: var(--bg-glass, rgba(11, 26, 43, 0.88));
  border: 1px solid var(--border-light, rgba(56, 189, 248, 0.22));
  border-radius: var(--radius-md, 12px);
  box-shadow: 0 12px 36px -6px rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}

/* 左区品牌 */
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-badge-box {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius-sm, 6px);
  transition: all 0.2s;
}

.brand-badge-box:hover {
  background: rgba(255, 255, 255, 0.06);
}

.brand-logo {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.brand-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.brand-title-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.brand-name {
  font-size: var(--text-base, 13px);
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #fff;
  font-family: var(--font-sans);
}

.seal-badge {
  font-size: 9px;
  padding: 1px 4px;
  background: rgba(220, 38, 38, 0.18);
  border: 1px solid rgba(220, 38, 38, 0.45);
  color: #fca5a5;
  border-radius: 3px;
  font-family: var(--font-serif);
  font-weight: 700;
}

.brand-sub {
  font-size: 10px;
  color: var(--text-dim, #64748b);
  letter-spacing: 0.02em;
}

/* 版本日志药丸 */
.ver-pill-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  background: linear-gradient(135deg, rgba(2, 132, 199, 0.25), rgba(245, 185, 66, 0.12));
  border: 1px solid rgba(56, 189, 248, 0.4);
  padding: 3px 8px;
  border-radius: var(--radius-full, 999px);
  cursor: pointer;
  transition: all 0.2s;
}

.ver-pill-badge:hover {
  border-color: var(--accent-gold, #f5b942);
  box-shadow: 0 0 10px var(--accent-gold-glow);
  transform: translateY(-1px);
}

.ver-pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #22c55e;
  box-shadow: 0 0 6px #22c55e;
  animation: pulseDot 1.5s infinite;
}

@keyframes pulseDot {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(0.8); opacity: 0.5; }
}

.ver-txt {
  font-size: 10px;
  font-weight: 800;
  color: #fde68a;
  letter-spacing: 0.04em;
  font-family: var(--font-mono, monospace);
}

/* 中区主模式切换 */
.header-center {
  display: flex;
  align-items: center;
}

.mode-capsule-nav {
  display: flex;
  align-items: center;
  background: rgba(6, 13, 23, 0.65);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: var(--radius-sm, 8px);
  padding: 3px;
  gap: 3px;
}

.mode-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 6px;
  background: transparent;
  border: 1px solid transparent;
  color: var(--text-muted, #94a3b8);
  font-size: var(--text-sm, 12px);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--motion-fast, 0.15s);
}

.mode-btn:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.06);
}

.mode-btn.active {
  background: rgba(56, 189, 248, 0.2);
  border-color: rgba(56, 189, 248, 0.45);
  color: var(--brand-cyan, #38bdf8);
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.25);
}

.camp-mode-btn.active {
  background: rgba(220, 38, 38, 0.2);
  border-color: rgba(220, 38, 38, 0.45);
  color: #f87171;
  box-shadow: 0 0 12px rgba(220, 38, 38, 0.3);
}

/* 右区大主题与探索 */
.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.theme-nav {
  display: flex;
  align-items: center;
  gap: 4px;
}

.theme-tab {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-muted, #94a3b8);
  font-size: var(--text-sm, 12px);
  font-weight: 600;
  padding: 5px 10px;
  border-radius: var(--radius-sm, 6px);
  cursor: pointer;
  transition: all 0.15s;
}

.theme-tab:hover {
  color: #fff;
  border-color: rgba(56, 189, 248, 0.35);
}

.theme-tab.active {
  background: rgba(56, 189, 248, 0.2);
  border-color: var(--brand-cyan, #38bdf8);
  color: #fff;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.3);
}

.header-divider {
  width: 1px;
  height: 20px;
  background: rgba(255, 255, 255, 0.12);
}

/* 探索下拉菜单 */
.explore-dropdown-wrap {
  position: relative;
}

.explore-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, rgba(245, 185, 66, 0.15), rgba(217, 119, 6, 0.08));
  border: 1px solid rgba(245, 185, 66, 0.35);
  color: #fde68a;
  padding: 6px 12px;
  border-radius: var(--radius-sm, 6px);
  font-size: var(--text-sm, 12px);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s;
}

.explore-btn:hover,
.explore-btn.active {
  background: linear-gradient(135deg, rgba(245, 185, 66, 0.28), rgba(217, 119, 6, 0.18));
  border-color: var(--accent-gold, #f5b942);
  color: #fff;
  box-shadow: 0 0 12px var(--accent-gold-glow);
}

.arrow-icon {
  transition: transform 0.2s;
}

.arrow-icon.open {
  transform: rotate(180deg);
}

.explore-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 250px;
  background: rgba(11, 26, 43, 0.96);
  border: 1px solid rgba(245, 185, 66, 0.35);
  border-radius: var(--radius-md, 10px);
  box-shadow: 0 18px 48px -6px rgba(0, 0, 0, 0.8), 0 0 24px rgba(245, 185, 66, 0.15);
  overflow: hidden;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 3px;
  animation: menuDrop 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes menuDrop {
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
}

.menu-header {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-dim, #64748b);
  padding: 6px 10px 4px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 6px;
  background: transparent;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: all 0.15s;
}

.menu-item:hover {
  background: rgba(56, 189, 248, 0.14);
}

.item-icn {
  flex-shrink: 0;
}

.item-icn.gold { color: var(--accent-gold, #f5b942); }
.item-icn.blue { color: var(--brand-cyan, #38bdf8); }
.item-icn.cyan { color: #06b6d4; }
.item-icn.emerald { color: #10b981; }
.item-icn.purple { color: #a855f7; }
.item-icn.rose { color: #f43f5e; }

.item-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.m-title {
  font-size: var(--text-sm, 12px);
  font-weight: 600;
  color: #fff;
}

.m-desc {
  font-size: 10.5px;
  color: var(--text-muted, #94a3b8);
}

/* ⌘K 与全屏触发器 */
.cmd-trigger-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: var(--text-muted, #94a3b8);
  padding: 6px 10px;
  border-radius: var(--radius-sm, 6px);
  font-size: var(--text-xs, 11px);
  cursor: pointer;
  transition: all 0.15s;
}

.cmd-trigger-btn:hover {
  background: rgba(56, 189, 248, 0.15);
  border-color: rgba(56, 189, 248, 0.4);
  color: #fff;
}

.cmd-kbd {
  font-family: var(--font-mono, monospace);
  font-size: 9.5px;
  padding: 1px 4px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.icon-tool-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-muted, #94a3b8);
  border-radius: var(--radius-sm, 6px);
  cursor: pointer;
  transition: all 0.15s;
}

.icon-tool-btn:hover {
  color: #fff;
  border-color: rgba(56, 189, 248, 0.4);
  background: rgba(56, 189, 248, 0.15);
}

/* 响应式断点 */
@media (max-width: 1024px) {
  .brand-sub { display: none; }
  .mode-btn span { display: none; }
}

@media (max-width: 768px) {
  .hud-header {
    left: 8px;
    right: 8px;
    top: 8px;
    height: 48px;
    padding: 0 10px;
  }
  .theme-nav { display: none; }
  .header-divider { display: none; }
  .cmd-kbd { display: none; }
}
</style>