<template>
  <div v-if="active" class="changelog-modal-overlay" @click.self="$emit('close')">
    <div class="changelog-card glass-panel">
      <!-- 头部 -->
      <div class="modal-header">
        <div class="header-left">
          <div class="ver-badge-glow">
            <span class="pulse-dot"></span>
            <span class="ver-title">v2.0.0 PRO</span>
          </div>
          <div class="title-text">
            <h2 class="main-title">版本演化与升级日志</h2>
            <p class="sub-title">SHAANXI SANDBOX ARCHITECTURE & CHANGELOG</p>
          </div>
        </div>
        <button class="close-btn" @click="$emit('close')" title="关闭日志">✕</button>
      </div>

      <!-- 核心指标统计带 -->
      <div class="metrics-strip">
        <div class="strip-item">
          <span class="s-label">当前运行版本</span>
          <span class="s-val highlight">v2.0.0 PRO (2026.10)</span>
        </div>
        <div class="strip-item">
          <span class="s-label">渲染引擎核心</span>
          <span class="s-val">WebGL / Three.js r128</span>
        </div>
        <div class="strip-item">
          <span class="s-label">空间声学引擎</span>
          <span class="s-val">Web Audio API 0-Latency</span>
        </div>
        <div class="strip-item">
          <span class="s-label">品牌认证</span>
          <span class="s-val">EUGENE FINANCE</span>
        </div>
      </div>

      <!-- 版本轴内容区 -->
      <div class="timeline-container custom-scrollbar">
        <div
          v-for="(ver, vIdx) in changelogData"
          :key="ver.version"
          class="version-block"
          :class="{ 'latest-version': ver.isLatest }"
        >
          <!-- 轴节点与标识 -->
          <div class="ver-marker">
            <div class="marker-dot"></div>
            <div class="marker-line" v-if="vIdx < changelogData.length - 1"></div>
          </div>

          <div class="ver-body">
            <div class="ver-header-row">
              <div class="ver-name-box">
                <span class="ver-tag" :class="{ 'tag-pro': ver.isLatest }">{{ ver.version }}</span>
                <span class="ver-subname">{{ ver.name }}</span>
              </div>
              <span class="ver-date">{{ ver.date }}</span>
            </div>

            <p class="ver-summary">{{ ver.summary }}</p>

            <!-- 升级细则列表 -->
            <div class="feature-grid">
              <div
                v-for="feat in ver.features"
                :key="feat.title"
                class="feature-card"
              >
                <div class="feat-top">
                  <span class="feat-badge">{{ feat.tag }}</span>
                  <span class="feat-title">{{ feat.title }}</span>
                </div>
                <p class="feat-desc">{{ feat.desc }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 底部架构愿景 -->
        <div class="architecture-seal-box">
          <div class="seal-icon">🌐</div>
          <div class="seal-info">
            <div class="seal-title">EUGENE FINANCE 数字三秦数字孪生战略</div>
            <div class="seal-desc">
              本项目致力于构建集物理地理真实性、历史时空叙事与沉浸人机交互于一体的下一代三维空间计算典范。
            </div>
          </div>
        </div>
      </div>

      <!-- 底部控制 -->
      <div class="modal-footer">
        <span class="footer-tip">已通过 GitHub Actions CI/CD 自动化构建与 GitHub Pages 全球 CDN 加速部署</span>
        <button class="confirm-btn" @click="$emit('close')">了解并返回沙盘</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { CHANGELOG_DATA } from '../data/shaanxiData.js';

defineProps({
  active: { type: Boolean, default: false }
});

defineEmits(['close']);

const changelogData = CHANGELOG_DATA;
</script>

<style scoped>
.changelog-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(3, 7, 18, 0.75);
  backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.changelog-card {
  width: 100%;
  max-width: 860px;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  background: rgba(11, 18, 32, 0.94);
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 16px;
  box-shadow: 0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 30px rgba(56, 189, 248, 0.15);
  overflow: hidden;
  animation: modalPop 0.28s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalPop {
  0% { opacity: 0; transform: scale(0.95) translateY(12px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.ver-badge-glow {
  display: flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(14, 165, 233, 0.08));
  border: 1px solid rgba(56, 189, 248, 0.4);
  padding: 5px 10px;
  border-radius: 20px;
}

.pulse-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #38bdf8;
  box-shadow: 0 0 8px #38bdf8;
  animation: pulse 1.6s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.4; transform: scale(0.85); }
}

.ver-title {
  font-size: 11px;
  font-weight: 800;
  color: #38bdf8;
  letter-spacing: 0.06em;
}

.main-title {
  font-size: 17px;
  font-weight: 700;
  color: #f1f5f9;
  margin: 0;
  letter-spacing: 0.03em;
}

.sub-title {
  font-size: 9.5px;
  color: #64748b;
  margin: 2px 0 0;
  letter-spacing: 0.08em;
}

.close-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
  border-color: rgba(239, 68, 68, 0.35);
}

.metrics-strip {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  padding: 10px 24px;
  background: rgba(6, 10, 20, 0.6);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.strip-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.s-label {
  font-size: 9px;
  color: #64748b;
}

.s-val {
  font-size: 11px;
  font-weight: 600;
  color: #cbd5e1;
}

.s-val.highlight {
  color: #38bdf8;
  font-weight: 700;
}

.timeline-container {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.version-block {
  display: flex;
  gap: 18px;
  position: relative;
}

.ver-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 16px;
  flex-shrink: 0;
  padding-top: 4px;
}

.marker-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #1e293b;
  border: 2px solid #64748b;
  transition: all 0.3s;
}

.latest-version .marker-dot {
  background: #0284c7;
  border-color: #38bdf8;
  box-shadow: 0 0 10px #38bdf8;
}

.marker-line {
  flex: 1;
  width: 2px;
  background: rgba(255, 255, 255, 0.1);
  margin-top: 6px;
}

.ver-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ver-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ver-name-box {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ver-tag {
  background: rgba(255, 255, 255, 0.08);
  color: #cbd5e1;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  font-family: monospace;
}

.ver-tag.tag-pro {
  background: rgba(56, 189, 248, 0.2);
  color: #38bdf8;
  border: 1px solid rgba(56, 189, 248, 0.4);
}

.ver-subname {
  font-size: 13.5px;
  font-weight: 600;
  color: #f8fafc;
}

.ver-date {
  font-size: 10.5px;
  color: #64748b;
}

.ver-summary {
  font-size: 12px;
  line-height: 1.6;
  color: #94a3b8;
  margin: 0;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.feature-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  padding: 10px 12px;
  transition: all 0.2s;
}

.feature-card:hover {
  background: rgba(56, 189, 248, 0.05);
  border-color: rgba(56, 189, 248, 0.25);
}

.feat-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 5px;
}

.feat-badge {
  font-size: 9.5px;
  background: rgba(56, 189, 248, 0.15);
  color: #38bdf8;
  padding: 2px 6px;
  border-radius: 4px;
}

.feat-title {
  font-size: 11.5px;
  font-weight: 600;
  color: #e2e8f0;
}

.feat-desc {
  font-size: 10.5px;
  color: #94a3b8;
  line-height: 1.5;
  margin: 0;
}

.architecture-seal-box {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.4), rgba(15, 23, 42, 0.6));
  border: 1px solid rgba(56, 189, 248, 0.2);
  border-radius: 12px;
  margin-top: 10px;
}

.seal-icon {
  font-size: 26px;
}

.seal-title {
  font-size: 12px;
  font-weight: 700;
  color: #38bdf8;
  margin-bottom: 3px;
}

.seal-desc {
  font-size: 10.5px;
  color: #94a3b8;
  line-height: 1.5;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(6, 10, 20, 0.7);
}

.footer-tip {
  font-size: 10.5px;
  color: #64748b;
}

.confirm-btn {
  background: #0284c7;
  color: #ffffff;
  border: none;
  padding: 8px 18px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.confirm-btn:hover {
  background: #0369a1;
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.4);
}

.custom-scrollbar::-webkit-scrollbar {
  width: 5px;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 4px;
}
</style>
