<template>
  <div class="portal-overlay">
    <!-- 半透明电影暗角景深背景 (使后方缓缓自转的 3D 陕西沙盘清晰透出) -->
    <div class="portal-backdrop"></div>

    <div class="portal-content">
      <!-- Eugene Finance 官方品牌微标 -->
      <div class="portal-brand-badge">
        <img :src="BRAND_LOGO_BADGE" class="portal-brand-img" alt="Eugene Finance" />
        <div class="portal-brand-titles">
          <span class="corp-name">EUGENE FINANCE 呈现</span>
          <span class="sys-name">三秦三维数字地貌与文明探源</span>
        </div>
      </div>

      <!-- 主标题区 (杂志级大标题排版) -->
      <div class="title-group">
        <h1 class="portal-title">陕西地理沙盘</h1>
        <div class="portal-en-title">SHAANXI GEOGRAPHY & HUMANITIES 3D SANDBOX</div>
        <p class="portal-desc">
          三秦大地，华夏之根。集成真实遥感卫星影像与 30m 物理 DEM 高程，融汇自然地理大格局、经典军事战役、大秦盛唐史诗与古丝绸之路。
        </p>
      </div>

      <!-- 核心省情指标 (横向极简流线排布) -->
      <div class="metrics-row">
        <div class="metric-chip">
          <span class="m-val">20.56<span class="m-unit">万km²</span></span>
          <span class="m-lbl">全省总面积 · 纵贯两大流域</span>
        </div>
        <div class="metric-chip">
          <span class="m-val">3954<span class="m-unit">万人</span></span>
          <span class="m-lbl">常住人口 · 三秦儿女</span>
        </div>
        <div class="metric-chip highlight">
          <span class="m-val">14<span class="m-unit">个朝代</span></span>
          <span class="m-lbl">建都古长安 · 周秦汉唐之源</span>
        </div>
        <div class="metric-chip">
          <span class="m-val">10<span class="m-unit">个地级市</span></span>
          <span class="m-lbl">陕北 · 关中 · 陕南三大单元</span>
        </div>
      </div>

      <!-- 沉浸式特色探索捷径 (2大高阶体验) -->
      <div class="hero-actions-row">
        <button class="hero-action-btn tour-btn" @click="$emit('start-tour')">
          <div class="btn-glow-bar"></div>
          <div class="btn-icon-wrap">
            <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="5 3 19 12 5 21 5 3"></polygon>
            </svg>
          </div>
          <div class="btn-text-wrap">
            <span class="btn-main-label">开启《航拍三秦》电影级巡航导览</span>
            <span class="btn-sub-label">自动运镜 · 空间音场 · 纪录片有声叙事 ➔</span>
          </div>
        </button>

        <button class="hero-action-btn detective-btn" @click="$emit('start-detective')">
          <div class="btn-glow-bar"></div>
          <div class="btn-icon-wrap">
            <svg class="svg-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="22" y1="12" x2="18" y2="12"></line>
              <line x1="6" y1="12" x2="2" y2="12"></line>
              <line x1="12" y1="6" x2="12" y2="2"></line>
              <line x1="12" y1="22" x2="12" y2="18"></line>
            </svg>
          </div>
          <div class="btn-text-wrap">
            <span class="btn-main-label">开启“寻迹三秦”空间探秘挑战</span>
            <span class="btn-sub-label">5大地理历史空间谜题 · 赢取荣誉文牒 ➔</span>
          </div>
        </button>
      </div>

      <!-- 四大核心篇章晶格舱 (紧凑单行排布) -->
      <div class="themes-grid-compact">
        <div class="theme-card" @click="$emit('select-mode', 'macro', 'geo')">
          <div class="card-num">01</div>
          <div class="card-content">
            <div class="card-title">自然地理</div>
            <div class="card-sub">秦岭 · 秦川 · 黄土高原</div>
          </div>
        </div>

        <div class="theme-card camp-card" @click="$emit('select-mode', 'campaign', 'camp_chencang')">
          <div class="card-num">02</div>
          <div class="card-content">
            <div class="card-title">经典战役</div>
            <div class="card-sub">暗度陈仓 · 五丈原 · 延安</div>
          </div>
        </div>

        <div class="theme-card" @click="$emit('select-mode', 'macro', 'history')">
          <div class="card-num">03</div>
          <div class="card-content">
            <div class="card-title">华夏史诗</div>
            <div class="card-sub">周秦礼乐 · 兵马俑 · 盛唐</div>
          </div>
        </div>

        <div class="theme-card" @click="$emit('select-mode', 'macro', 'silkroad')">
          <div class="card-num">04</div>
          <div class="card-content">
            <div class="card-title">丝路起点</div>
            <div class="card-sub">凿空西域 · 万国商都</div>
          </div>
        </div>
      </div>

      <!-- 快速进入 3D 核心沙盘主按钮 -->
      <div class="portal-footer">
        <button class="enter-btn animate-pulse-glow" @click="$emit('enter-sandbox')">
          <span>进入三维遥感互动沙盘</span>
          <svg class="enter-arrow-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { BRAND_LOGO_BADGE } from '../data/shaanxiData.js';
defineEmits(['enter-sandbox', 'select-mode', 'start-tour', 'start-detective']);
</script>

<style scoped>
.portal-overlay {
  position: absolute;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 20px;
}

/* 半透明电影暗角景深背景 (使后方缓缓自转的 3D 陕西沙盘清晰透出) */
.portal-backdrop {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at center, rgba(8, 14, 24, 0.42) 0%, rgba(6, 10, 18, 0.74) 55%, rgba(4, 7, 12, 0.95) 100%);
  backdrop-filter: blur(8px);
}

.portal-content {
  position: relative;
  z-index: 2;
  max-width: 880px;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
  animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(14px); }
  to { opacity: 1; transform: translateY(0); }
}

.portal-brand-badge {
  display: flex;
  align-items: center;
  gap: 10px;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(12px);
  padding: 5px 16px 5px 6px;
  border-radius: 30px;
  border: 1px solid rgba(56, 189, 248, 0.35);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5), 0 0 15px rgba(56, 189, 248, 0.15);
}

.portal-brand-img {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid rgba(56, 189, 248, 0.5);
}

.portal-brand-titles {
  display: flex;
  flex-direction: column;
  text-align: left;
}

.corp-name {
  font-size: 11px;
  font-weight: 800;
  color: #38bdf8;
  letter-spacing: 0.1em;
  line-height: 1.1;
}

.sys-name {
  font-size: 10.5px;
  color: #cbd5e1;
}

.title-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.portal-title {
  font-size: 38px;
  font-weight: 900;
  letter-spacing: 0.12em;
  background: linear-gradient(135deg, #ffffff 40%, #e0f2fe 70%, #38bdf8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-family: "Noto Serif SC", "STSong", "SimSun", serif;
  text-shadow: 0 4px 24px rgba(56, 189, 248, 0.25);
}

.portal-en-title {
  font-size: 10.5px;
  letter-spacing: 0.24em;
  color: #64748b;
  font-family: monospace;
  margin-top: 2px;
}

.portal-desc {
  font-size: 13.5px;
  line-height: 1.6;
  color: #94a3b8;
  max-width: 680px;
  margin-top: 6px;
}

/* 核心省情指标 (极简横排流线) */
.metrics-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  width: 100%;
}

.metric-chip {
  background: rgba(15, 23, 42, 0.65);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  transition: all 0.25s;
}

.metric-chip:hover {
  border-color: rgba(56, 189, 248, 0.4);
  background: rgba(15, 23, 42, 0.85);
  transform: translateY(-2px);
}

.metric-chip.highlight {
  border-color: rgba(245, 158, 11, 0.35);
}

.metric-chip.highlight .m-val {
  color: #fbbf24;
}

.m-val {
  font-size: 17px;
  font-weight: 800;
  font-family: monospace;
  color: #38bdf8;
}

.m-unit {
  font-size: 10px;
  font-weight: normal;
  color: #94a3b8;
  margin-left: 2px;
}

.m-lbl {
  font-size: 10.5px;
  color: #94a3b8;
}

/* 沉浸式特色探索捷径 */
.hero-actions-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  width: 100%;
}

.hero-action-btn {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 18px;
  border-radius: 14px;
  cursor: pointer;
  text-align: left;
  transition: all 0.25s;
  overflow: hidden;
}

.tour-btn {
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(217, 119, 6, 0.22));
  border: 1px solid rgba(245, 158, 11, 0.4);
  color: #fef08a;
}

.tour-btn:hover {
  background: rgba(245, 158, 11, 0.28);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(245, 158, 11, 0.3);
}

.detective-btn {
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(5, 150, 105, 0.22));
  border: 1px solid rgba(16, 185, 129, 0.4);
  color: #a7f3d0;
}

.detective-btn:hover {
  background: rgba(16, 185, 129, 0.28);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
}

.btn-icon-wrap {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.svg-icon {
  width: 18px;
  height: 18px;
}

.btn-text-wrap {
  display: flex;
  flex-direction: column;
}

.btn-main-label {
  font-size: 13.5px;
  font-weight: 700;
  color: #fff;
}

.btn-sub-label {
  font-size: 10.5px;
  opacity: 0.85;
  margin-top: 2px;
}

/* 四大篇章紧凑排布 */
.themes-grid-compact {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
  width: 100%;
}

.theme-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 10px 12px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  text-align: left;
  transition: all 0.25s;
}

.theme-card:hover {
  border-color: rgba(56, 189, 248, 0.4);
  background: rgba(15, 23, 42, 0.85);
  transform: translateY(-2px);
}

.theme-card.camp-card:hover {
  border-color: rgba(239, 68, 68, 0.5);
}

.card-num {
  font-size: 14px;
  font-family: monospace;
  font-weight: 800;
  color: #64748b;
}

.theme-card:hover .card-num {
  color: #38bdf8;
}

.card-title {
  font-size: 12.5px;
  font-weight: 700;
  color: #f8fafc;
}

.card-sub {
  font-size: 10px;
  color: #94a3b8;
  margin-top: 1px;
}

.portal-footer {
  margin-top: 4px;
}

.enter-btn {
  background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
  border: 1px solid #38bdf8;
  color: #fff;
  padding: 10px 32px;
  border-radius: 24px;
  font-size: 14.5px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  box-shadow: 0 0 20px rgba(56, 189, 248, 0.4);
  transition: all 0.25s;
}

.enter-btn:hover {
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  transform: scale(1.04);
  box-shadow: 0 0 30px rgba(56, 189, 248, 0.6);
}

.enter-arrow-svg {
  width: 16px;
  height: 16px;
  transition: transform 0.2s;
}

.enter-btn:hover .enter-arrow-svg {
  transform: translateX(4px);
}

@media (max-width: 768px) {
  .metrics-row, .themes-grid-compact, .hero-actions-row {
    grid-template-columns: 1fr;
  }
  .portal-title {
    font-size: 28px;
  }
}
</style>
