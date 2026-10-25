<template>
  <div class="portal-overlay">
    <div class="portal-backdrop"></div>

    <div class="portal-content">
      <!-- 顶部标注 -->
      <div class="top-tagline">
        <span class="tag-dot"></span>
        <span>陕西地理人文沙盘 · 探究式三维交互系统 (卫星遥感 DEM 实景增强版)</span>
      </div>

      <!-- 主标题 -->
      <div class="title-group">
        <h1 class="portal-title">陕西地理沙盘</h1>
        <div class="portal-en-title">SHAANXI GEOGRAPHY & HUMANITIES SANDBOX</div>
        <p class="portal-desc">
          三秦大地，华夏之根。集成真实卫星遥感影像与物理 DEM 高程地形，融汇自然地理、军事战役、大秦盛唐与古丝绸之路。
        </p>
      </div>

      <!-- 核心省情指标看板 -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-value">20.56<span class="metric-unit">万km²</span></div>
          <div class="metric-label">全省总面积 · 纵跨两大流域</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">3954<span class="metric-unit">万人</span></div>
          <div class="metric-label">常住人口 · 三秦儿女</div>
        </div>
        <div class="metric-card highlight">
          <div class="metric-value">14<span class="metric-unit">个朝代</span></div>
          <div class="metric-label">建都古长安 · 周秦汉唐之源</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">10<span class="metric-unit">个地级市</span></div>
          <div class="metric-label">陕北、关中、陕南三大板块</div>
        </div>
      </div>

      <!-- 主题探索入口卡片阵列 (新增军事战役) -->
      <div class="themes-grid">
        <div class="theme-card" @click="$emit('select-mode', 'macro', 'geo')">
          <div class="theme-card-tag">01 · 自然地理</div>
          <div class="theme-card-title">自然地理大格局</div>
          <div class="theme-card-desc">真实 DEM 还原秦岭巍峨、八百里秦川沃野、陕北黄土千沟万壑。</div>
          <div class="theme-card-action">从这里开始 ➔</div>
        </div>

        <div class="theme-card campaign-theme" @click="$emit('select-mode', 'campaign', 'camp_chencang')">
          <div class="theme-card-tag camp-tag">02 · 历史战役</div>
          <div class="theme-card-title">⚔️ 经典战役沙盘推演</div>
          <div class="theme-card-desc">明修栈道暗度陈仓、诸葛亮五丈原对峙、转战陕北青化砭大捷。</div>
          <div class="theme-card-action camp-action">推演军事进军 ➔</div>
        </div>

        <div class="theme-card" @click="$emit('select-mode', 'macro', 'history')">
          <div class="theme-card-tag">03 · 历史人文</div>
          <div class="theme-card-title">华夏文明发祥史诗</div>
          <div class="theme-card-desc">蓝田猿人、周原礼乐、大秦一统兵马俑、盛唐万国衣冠。</div>
          <div class="theme-card-action">从这里开始 ➔</div>
        </div>

        <div class="theme-card" @click="$emit('select-mode', 'macro', 'silkroad')">
          <div class="theme-card-tag">04 · 丝路起点</div>
          <div class="theme-card-title">凿空西域与万国商都</div>
          <div class="theme-card-desc">张骞持节出未央、大唐西市金市开埠、玄奘西行取经归来。</div>
          <div class="theme-card-action">从这里开始 ➔</div>
        </div>

        <div class="theme-card special" @click="$emit('select-mode', 'bonsai', 'geo')">
          <div class="theme-card-tag">05 · 微观盆景</div>
          <div class="theme-card-title">名山大川 3D 地形切块</div>
          <div class="theme-card-desc">西岳华山垂直天险、壶口瀑布十里龙槽、太白山拔仙台第四纪冰川。</div>
          <div class="theme-card-action">探索微观切块 ➔</div>
        </div>

        <div class="theme-card special" @click="$emit('select-mode', 'model', 'geo')">
          <div class="theme-card-tag">06 · 科学演变</div>
          <div class="theme-card-title">黄土高原地貌演化</div>
          <div class="theme-card-desc">深厚沉积 → 原始塬面 → 细沟侵蚀 → 梁峁割裂 → 现代退耕还林 7阶互动。</div>
          <div class="theme-card-action">观察动态演变 ➔</div>
        </div>
      </div>

      <!-- 快速进入探索按钮 -->
      <div class="portal-footer">
        <button class="enter-btn animate-pulse-glow" @click="$emit('enter-sandbox')">
          <span>进入三维遥感互动沙盘</span>
          <span class="enter-arrow">➔</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineEmits(['enter-sandbox', 'select-mode']);
</script>

<style scoped>
.portal-overlay {
  position: absolute;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow-y: auto;
  padding: 40px 20px;
}

.portal-backdrop {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at center, rgba(10, 15, 24, 0.94) 0%, rgba(6, 9, 14, 0.98) 100%);
  backdrop-filter: blur(20px);
}

.portal-content {
  position: relative;
  z-index: 2;
  max-width: 1040px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
  text-align: center;
}

.top-tagline {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin: 0 auto;
  background: rgba(56, 189, 248, 0.12);
  border: 1px solid rgba(56, 189, 248, 0.3);
  padding: 4px 14px;
  border-radius: 20px;
  font-size: 12px;
  color: #38bdf8;
  font-weight: 600;
  letter-spacing: 0.08em;
}

.tag-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #38bdf8;
  box-shadow: 0 0 8px #38bdf8;
}

.title-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.portal-title {
  font-family: var(--font-serif);
  font-size: 52px;
  font-weight: 900;
  color: #fff;
  letter-spacing: 0.12em;
  text-shadow: 0 4px 24px rgba(0, 0, 0, 0.7);
}

.portal-en-title {
  font-size: 13px;
  color: #94a3b8;
  letter-spacing: 0.25em;
  font-weight: 600;
}

.portal-desc {
  max-width: 720px;
  margin: 6px auto 0;
  font-size: 13.5px;
  color: #cbd5e1;
  line-height: 1.6;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.metric-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transition: all 0.2s;
}

.metric-card:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(56, 189, 248, 0.3);
}

.metric-card.highlight {
  border-color: rgba(245, 158, 11, 0.4);
  background: rgba(245, 158, 11, 0.05);
}

.metric-value {
  font-family: var(--font-serif);
  font-size: 30px;
  font-weight: 700;
  color: #fff;
}

.metric-card.highlight .metric-value {
  color: #fbbf24;
}

.metric-unit {
  font-size: 13px;
  font-weight: 400;
  margin-left: 4px;
  color: #94a3b8;
}

.metric-label {
  font-size: 11px;
  color: #64748b;
}

.themes-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.theme-card {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 16px;
  text-align: left;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: all 0.25s;
}

.theme-card:hover {
  background: rgba(56, 189, 248, 0.08);
  border-color: #38bdf8;
  transform: translateY(-3px);
  box-shadow: 0 10px 25px -5px rgba(56, 189, 248, 0.2);
}

.theme-card.campaign-theme {
  background: rgba(239, 68, 68, 0.05);
  border-color: rgba(239, 68, 68, 0.25);
}

.theme-card.campaign-theme:hover {
  background: rgba(239, 68, 68, 0.12);
  border-color: #ef4444;
  box-shadow: 0 10px 25px -5px rgba(239, 68, 68, 0.3);
}

.theme-card-tag.camp-tag {
  color: #f87171;
}

.camp-action {
  color: #f87171 !important;
}

.theme-card.special {
  background: rgba(16, 185, 129, 0.04);
  border-color: rgba(16, 185, 129, 0.2);
}

.theme-card.special:hover {
  background: rgba(16, 185, 129, 0.1);
  border-color: #10b981;
  box-shadow: 0 10px 25px -5px rgba(16, 185, 129, 0.2);
}

.theme-card-tag {
  font-size: 10px;
  color: #38bdf8;
  font-weight: 700;
  letter-spacing: 0.05em;
}

.theme-card.special .theme-card-tag {
  color: #10b981;
}

.theme-card-title {
  font-size: 15px;
  font-weight: 700;
  color: #fff;
}

.theme-card-desc {
  font-size: 11.5px;
  color: #94a3b8;
  line-height: 1.5;
  flex-grow: 1;
}

.theme-card-action {
  font-size: 11px;
  color: #38bdf8;
  font-weight: 600;
  margin-top: 4px;
}

.theme-card.special .theme-card-action {
  color: #10b981;
}

.portal-footer {
  margin-top: 4px;
}

.enter-btn {
  background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
  border: 1px solid rgba(56, 189, 248, 0.5);
  color: #fff;
  padding: 12px 38px;
  border-radius: 30px;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 12px;
  letter-spacing: 0.05em;
  transition: all 0.25s;
}

.enter-btn:hover {
  background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
  transform: scale(1.04);
}

.enter-arrow {
  font-size: 18px;
}
</style>
