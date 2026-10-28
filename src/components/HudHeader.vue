<template>
  <header class="hud-header glass-panel">
    <!-- 左区：Eugene Finance 品牌徽章与版本标识 -->
    <div class="header-left">
      <div class="brand-badge-box" @click="$emit('open-portal')" title="返回首页大屏 · EUGENE FINANCE">
        <img :src="BRAND_LOGO_BADGE" alt="Eugene Finance" class="brand-logo" />
        <div class="brand-info">
          <span class="brand-name">EUGENE FINANCE</span>
          <span class="brand-sub">三秦三维沙盒</span>
        </div>
      </div>

      <!-- V2.0 PRO 版本更新日志入口胶囊 -->
      <button class="ver-pill-badge" @click="$emit('open-changelog')" title="查看 v2.0.0 PRO 架构演进与版本升级日志">
        <span class="ver-pulse-dot"></span>
        <span class="ver-txt">v2.0 PRO</span>
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
        <span class="mode-tag camp-tag" v-if="currentMode === 'campaign'">
          <svg class="tag-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"></path><path d="M13 19l6-6"></path><path d="M16 16l4 4"></path><path d="M19 21l2-2"></path></svg>
          历史战役 · 军事沙盘推演
        </span>
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
        战役演武
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

    <!-- 右区：专业工具集与 V2.0 空间智能模块 -->
    <div class="header-right">
      <!-- 📸 三秦实景影集画廊 -->
      <button class="tool-btn gallery-tool" @click="$emit('open-gallery')" title="开启三秦 16 处地标真实地理高清实景画廊与 3D 定位">
        <svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
        <span>实景影集</span>
      </button>

      <!-- 航拍导览 -->
      <button class="tool-btn tour-tool" @click="$emit('open-tour')" title="开启《航拍三秦》电影级自动巡航导览">
        <svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
        <span>航拍导览</span>
      </button>

      <!-- 🛣️ V2.0 3D 路书工坊 -->
      <button
        class="tool-btn roadbook-tool"
        :class="{ active: isRoadbookActive }"
        @click="$emit('open-roadbook')"
        title="开启 3D 多点研学/自驾路书工坊与 FPV 低空贴地飞行预演"
      >
        <svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="6" cy="19" r="3"></circle>
          <path d="M9 19h8.5a4.5 4.5 0 0 0 4.5-4.5v0a4.5 4.5 0 0 0-4.5-4.5H6"></path>
          <circle cx="6" cy="5" r="3"></circle>
        </svg>
        <span>3D路书</span>
      </button>

      <!-- 寻迹探秘 -->
      <button class="tool-btn" @click="$emit('open-detective')" title="开启‘寻迹三秦’空间探秘解谜挑战">
        <svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="22" y1="12" x2="18" y2="12"></line>
          <line x1="6" y1="12" x2="2" y2="12"></line>
          <line x1="12" y1="6" x2="12" y2="2"></line>
          <line x1="12" y1="22" x2="12" y2="18"></line>
        </svg>
        <span>寻迹探秘</span>
      </button>

      <!-- 拍照打卡海报 -->
      <button class="tool-btn snapshot-tool" @click="$emit('open-poster')" title="生成 EUGENE FINANCE 认证数字地理明信片海报">
        <svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
          <circle cx="12" cy="13" r="4"></circle>
        </svg>
        <span>拍照打卡</span>
      </button>

      <!-- 兵棋推演 (仅在战役模式显现) -->
      <button
        v-if="currentMode === 'campaign'"
        class="tool-btn wargame-tool"
        @click="$emit('open-wargame')"
        title="查看诸葛亮北伐/楚汉争霸双路线军事地形推演"
      >
        <svg class="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M14.5 17.5L3 6V3h3l11.5 11.5"></path>
          <path d="M13 19l6-6"></path>
        </svg>
        <span>兵棋对比</span>
      </button>

      <div class="divider"></div>

      <!-- 🌸 V2.0 四季气候流转切换器 -->
      <div class="season-group">
        <button
          v-for="s in seasons"
          :key="s.id"
          class="season-btn"
          :class="{ active: seasonMode === s.id }"
          @click="$emit('change-season', s.id)"
          :title="`${s.name} · ${s.desc}`"
        >
          <span class="s-icon">{{ s.icon }}</span>
        </button>
      </div>

      <!-- 🎧 V2.0 Web Audio 三维空间自然音景开关 -->
      <button
        class="tool-btn audio-tool-btn"
        :class="{ active: !isAudioMuted }"
        @click="onToggleAudio"
        :title="isAudioMuted ? '点击开启 Web Audio 三维空间自然音景' : `正在播放：${soundZone}（点击静音）`"
      >
        <div class="sound-wave" :class="{ playing: !isAudioMuted }">
          <span class="wave-bar wb-1"></span>
          <span class="wave-bar wb-2"></span>
          <span class="wave-bar wb-3"></span>
        </div>
        <span>{{ isAudioMuted ? '音景' : soundZone }}</span>
      </button>

      <div class="divider"></div>

      <!-- 光照时序预设 -->
      <div class="lighting-group">
        <button
          class="light-btn"
          :class="{ active: lightingMode === 'dawn' }"
          @click="$emit('change-lighting', 'dawn')"
          title="晨曦拂晓 (金色低角光)"
        >
          <svg class="light-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2v4M4.93 4.93l2.83 2.83M2 12h4M4.93 19.07l2.83-2.83"></path>
            <circle cx="12" cy="12" r="4"></circle>
          </svg>
        </button>
        <button
          class="light-btn"
          :class="{ active: lightingMode === 'noon' }"
          @click="$emit('change-lighting', 'noon')"
          title="正午晴空 (高空直射光)"
        >
          <svg class="light-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="12" y1="1" x2="12" y2="3"></line>
            <line x1="12" y1="21" x2="12" y2="23"></line>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
            <line x1="1" y1="12" x2="3" y2="12"></line>
            <line x1="21" y1="12" x2="23" y2="12"></line>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
          </svg>
        </button>
        <button
          class="light-btn"
          :class="{ active: lightingMode === 'sunset' }"
          @click="$emit('change-lighting', 'sunset')"
          title="落日晚霞 (长影余晖)"
        >
          <svg class="light-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 18a5 5 0 0 0-10 0"></path>
            <line x1="12" y1="2" x2="12" y2="9"></line>
            <line x1="4.22" y1="10.22" x2="5.64" y2="11.64"></line>
            <line x1="1" y1="18" x2="23" y2="18"></line>
            <line x1="18.36" y1="11.64" x2="19.78" y2="10.22"></line>
          </svg>
        </button>
      </div>

      <!-- 全屏切换 -->
      <button class="icon-tool-btn" @click="$emit('toggle-fullscreen')" title="全屏查看">
        <svg class="fs-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 3 21 3 21 9"></polyline>
          <polyline points="9 21 3 21 3 15"></polyline>
          <line x1="21" y1="3" x2="14" y2="10"></line>
          <line x1="3" y1="21" x2="10" y2="14"></line>
        </svg>
      </button>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { BRAND_LOGO_BADGE, SEASONS_DATA } from '../data/shaanxiData.js';
import { soundscape } from '../utils/soundscape.js';

defineProps({
  themes: { type: Array, required: true },
  currentThemeId: { type: String, required: true },
  currentMode: { type: String, required: true },
  lightingMode: { type: String, default: 'dawn' },
  seasonMode: { type: String, default: 'natural' },
  isProfilingActive: { type: Boolean, default: false },
  isRoadbookActive: { type: Boolean, default: false }
});

defineEmits([
  'open-portal',
  'change-theme',
  'switch-mode',
  'toggle-fullscreen',
  'change-lighting',
  'change-season',
  'open-tour',
  'open-roadbook',
  'open-gallery',
  'toggle-profiling',
  'open-detective',
  'open-wargame',
  'open-poster',
  'open-changelog'
]);

const seasons = SEASONS_DATA;
const isAudioMuted = ref(true);
const soundZone = ref('高空风吟');
let audioTimer = null;

const onToggleAudio = () => {
  const active = soundscape.toggleMute();
  isAudioMuted.value = !active;
  soundZone.value = soundscape.currentZone || '高空风吟';
};

onMounted(() => {
  audioTimer = setInterval(() => {
    soundZone.value = soundscape.currentZone || '高空风吟';
  }, 1000);
});

onBeforeUnmount(() => {
  if (audioTimer) clearInterval(audioTimer);
});
</script>

<style scoped>
.hud-header {
  position: absolute;
  top: 14px;
  left: 20px;
  right: 20px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  z-index: 20;
  border-radius: 12px;
  border: 1px solid rgba(56, 189, 248, 0.22);
  background: rgba(10, 15, 25, 0.9);
  backdrop-filter: blur(14px);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.65);
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
  width: 26px;
  height: 26px;
  border-radius: 6px;
  border: 1px solid rgba(56, 189, 248, 0.4);
}

.brand-info {
  display: flex;
  flex-direction: column;
}

.brand-name {
  font-size: 10.5px;
  font-weight: 800;
  color: #38bdf8;
  letter-spacing: 0.08em;
  line-height: 1.1;
}

.brand-sub {
  font-size: 9.5px;
  color: #94a3b8;
  letter-spacing: 0.02em;
}

.divider {
  width: 1px;
  height: 18px;
  background: rgba(255, 255, 255, 0.12);
  margin: 0 4px;
}

.theme-nav {
  display: flex;
  gap: 3px;
}

.theme-tab {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 11.5px;
  padding: 4px 8px;
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
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 6px;
  background: rgba(56, 189, 248, 0.12);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.25);
  display: flex;
  align-items: center;
  gap: 5px;
}

.tag-svg {
  width: 12px;
  height: 12px;
}

.mode-tag.camp-tag {
  background: rgba(239, 68, 68, 0.12);
  color: #fca5a5;
  border-color: rgba(239, 68, 68, 0.35);
}

.header-center {
  background: rgba(15, 23, 42, 0.65);
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

/* 专业工具按钮 (统一黑曜石玻璃态 + 矢量图标) */
.tool-btn {
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #cbd5e1;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 11.5px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
}

.tool-icon {
  width: 13px;
  height: 13px;
  stroke-width: 2.2;
}

.tool-btn:hover {
  border-color: #38bdf8;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.12);
}

.tool-btn.active {
  background: #0284c7;
  color: #fff;
  border-color: #38bdf8;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.35);
}

.tour-tool:hover {
  border-color: #f59e0b;
  color: #fef08a;
  background: rgba(245, 158, 11, 0.15);
}

.wargame-tool:hover {
  border-color: #ef4444;
  color: #fca5a5;
  background: rgba(239, 68, 68, 0.15);
}

.lighting-group {
  display: flex;
  background: rgba(15, 23, 42, 0.65);
  padding: 2px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.light-btn {
  background: transparent;
  border: none;
  padding: 3px 6px;
  border-radius: 4px;
  cursor: pointer;
  color: #94a3b8;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.light-svg {
  width: 13px;
  height: 13px;
}

.light-btn:hover {
  color: #fff;
}

.light-btn.active {
  color: #f59e0b;
  background: rgba(245, 158, 11, 0.15);
}

.icon-tool-btn {
  background: rgba(15, 23, 42, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #94a3b8;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.fs-svg {
  width: 13px;
  height: 13px;
}

.icon-tool-btn:hover {
  border-color: #38bdf8;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.15);
}

/* V2.0 版本更迭日志按钮徽章 */
.ver-pill-badge {
  display: flex;
  align-items: center;
  gap: 5px;
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.35);
  padding: 3px 8px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.ver-pill-badge:hover {
  background: rgba(56, 189, 248, 0.22);
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.35);
  transform: translateY(-1px);
}

.ver-pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #38bdf8;
  box-shadow: 0 0 6px #38bdf8;
  animation: pulseVer 1.6s infinite;
}

@keyframes pulseVer {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.35; transform: scale(0.8); }
}

.ver-txt {
  font-size: 10px;
  font-weight: 700;
  color: #38bdf8;
  letter-spacing: 0.04em;
  font-family: monospace;
}

/* V2.0 四季流转选择器 */
.season-group {
  display: flex;
  align-items: center;
  background: rgba(15, 23, 42, 0.65);
  padding: 2px 3px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  gap: 2px;
}

.season-btn {
  background: transparent;
  border: none;
  padding: 2px 5px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.season-btn:hover {
  background: rgba(255, 255, 255, 0.08);
}

.season-btn.active {
  background: rgba(56, 189, 248, 0.2);
  box-shadow: 0 0 8px rgba(56, 189, 248, 0.4);
}

.s-icon {
  font-size: 13px;
  line-height: 1;
}

/* V2.0 Web Audio 音景波形动态条 */
.audio-tool-btn {
  display: flex;
  align-items: center;
  gap: 6px;
}

.sound-wave {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 12px;
}

.wave-bar {
  width: 2px;
  height: 4px;
  background: #94a3b8;
  border-radius: 1px;
  transition: all 0.2s;
}

.sound-wave.playing .wave-bar {
  background: #38bdf8;
}

.sound-wave.playing .wb-1 {
  animation: soundJump 0.8s ease-in-out infinite alternate;
}
.sound-wave.playing .wb-2 {
  animation: soundJump 0.6s ease-in-out 0.2s infinite alternate;
}
.sound-wave.playing .wb-3 {
  animation: soundJump 0.9s ease-in-out 0.4s infinite alternate;
}

@keyframes soundJump {
  0% { height: 3px; }
  100% { height: 11px; }
}

.roadbook-tool.active {
  border-color: #38bdf8;
  background: rgba(56, 189, 248, 0.2);
  color: #38bdf8;
  box-shadow: 0 0 10px rgba(56, 189, 248, 0.35);
}

@media (max-width: 1100px) {
  .theme-nav, .lighting-group {
    display: none;
  }
}

@media (max-width: 820px) {
  .header-center {
    display: none;
  }
}
</style>
