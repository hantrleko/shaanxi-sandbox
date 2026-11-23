<template>
  <main class="portal">
    <header class="portal-header">
      <div class="wordmark">
        <span class="wordmark-icon"><Map :size="19" :stroke-width="1.5" /></span>
        <span>陕西地理沙盘</span>
      </div>
      <button type="button" class="about-button" @click="$emit('open-changelog')">关于项目</button>
    </header>

    <div class="portal-main">
      <div class="portal-intro">
        <h1>秦岭南北</h1>
        <p class="portal-question">从西安到汉中，<br />秦岭两侧的水流向哪里？</p>
        <p class="portal-details">沿着山脊、河谷和高程剖面，在三维地形上找答案。</p>
        <div class="portal-actions">
          <button type="button" class="map-button primary" @click="$emit('start-guide')">
            开始导览 <ArrowRight :size="17" />
          </button>
          <button type="button" class="map-button" @click="$emit('enter-sandbox')">
            自由探索
          </button>
        </div>
      </div>
      <div class="portal-figure">
        <div class="north-mark" aria-hidden="true"><span>北</span><ArrowUp :size="18" :stroke-width="1.45" /></div>
        <TerrainPoster />
      </div>
    </div>

    <footer class="portal-footer">
      <span>卫星影像与高程数据绘制</span>
      <span>EUGENE FINANCE</span>
    </footer>
  </main>
</template>

<script setup>
import { ArrowRight, ArrowUp, Map } from 'lucide-vue-next';
import TerrainPoster from './TerrainPoster.vue';

defineEmits(['enter-sandbox', 'start-guide', 'open-changelog']);
</script>

<style scoped>
.portal {
  position: absolute;
  inset: 0;
  z-index: 20;
  overflow: auto;
  display: grid;
  grid-template-rows: auto 1fr auto;
  color: var(--map-text);
  background: radial-gradient(ellipse at 69% 47%, #2e4847 0%, #193437 35%, #10272b 64%, #0c1c21 100%);
  padding: max(16px, var(--safe-top)) clamp(20px, 5vw, 86px) max(14px, var(--safe-bottom));
}

.portal-header, .portal-footer {
  max-width: 1320px;
  width: 100%;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.portal-header { border-bottom: 1px solid var(--map-line); padding-bottom: 12px; }
.portal-footer { border-top: 1px solid var(--map-line); padding-block: 14px 4px; }
.portal-footer span { color: var(--map-muted); font-size: 11px; }
.portal-footer span:last-child { letter-spacing: .13em; }
.wordmark { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 15px; }
.wordmark-icon {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  border: 1px solid #a7885d;
  border-radius: 8px;
  color: var(--map-gold);
}

.about-button { color: var(--map-muted); padding: 0 6px; }
.about-button:hover { color: var(--map-text); }
.portal-main {
  width: min(100%, 1280px);
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, .84fr) minmax(0, 1.16fr);
  gap: clamp(20px, 5vw, 70px);
  align-items: center;
}
.portal-intro { padding: 36px 0 38px clamp(0px, 2.8vw, 42px); }
.portal-intro h1 {
  font-family: var(--font-serif);
  font-size: clamp(58px, 6.5vw, 110px);
  font-weight: 750;
  line-height: 1.12;
  letter-spacing: .04em;
  color: #f4ead4;
  margin-bottom: 25px;
}
.portal-question { font-size: clamp(21px, 2.2vw, 35px); line-height: 1.44; font-family: var(--font-serif); }
.portal-details { margin-top: 22px; line-height: 1.65; font-size: 14px; color: var(--map-muted); }
.portal-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 33px; }
.portal-actions button { padding-inline: 18px; }
.portal-figure {
  width: min(100%, 73dvh, 680px);
  justify-self: center;
  position: relative;
  padding: 14px 20px;
}
.north-mark {
  position: absolute;
  top: 8%;
  right: 6%;
  display: grid;
  justify-items: center;
  gap: 4px;
  z-index: 1;
  color: var(--map-muted);
  font-size: 11px;
}
.north-mark svg { transform: rotate(-10deg); }

@media (max-width: 760px) and (orientation: portrait) {
  .portal { padding-inline: 22px; background-position: 50% 70%; }
  .portal-main { display: flex; flex-direction: column; align-items: stretch; gap: 6px; }
  .portal-intro { padding: 23px 0 2px; }
  .portal-intro h1 { font-size: clamp(47px, 13vw, 68px); margin-bottom: 9px; }
  .portal-question { font-size: clamp(17px, 5.5vw, 23px); }
  .portal-details { font-size: 12px; margin-top: 9px; }
  .portal-actions { margin-top: 15px; }
  .portal-figure { align-self: center; width: min(100%, 41dvh, 420px); padding: 4px 18px 10px; }
  .portal-footer { padding-top: 8px; }
}

@media (orientation: landscape) and (max-height: 520px) {
  .portal-intro { padding-block: 10px; }
  .portal-intro h1 { font-size: clamp(33px, 8vh, 54px); margin-bottom: 8px; }
  .portal-question { font-size: 19px; }
  .portal-details { margin-top: 8px; }
  .portal-actions { margin-top: 12px; }
}
</style>
