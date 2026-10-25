<template>
  <div class="campaign-controller" v-if="currentMode === 'campaign'">
    <!-- 左侧战役沙盘作战简报面板 -->
    <aside class="campaign-panel glass-panel" v-if="currentCampaign">
      <div class="panel-tag">
        <span class="tag-icon">⚔️</span>
        <span>HISTORICAL CAMPAIGN · 军事战役沙盘推演</span>
      </div>

      <h2 class="camp-title">{{ currentCampaign.title }}</h2>
      <div class="camp-period">{{ currentCampaign.period }}</div>

      <!-- 双方军团阵营 -->
      <div class="belligerents-box">
        <div class="b-label">交战双方与统帅：</div>
        <div class="b-val">{{ currentCampaign.belligerents }}</div>
      </div>

      <!-- 战略结果评价 -->
      <div class="outcome-box">
        <div class="o-label">战役结局与战略影响：</div>
        <div class="o-val">{{ currentCampaign.strategicOutcome }}</div>
      </div>

      <!-- 战况综述 -->
      <p class="camp-overview">{{ currentCampaign.overview }}</p>

      <!-- 阶段式战术推演步进器 -->
      <div class="stepper-box">
        <div class="stepper-header">
          <span>战术推演进程</span>
          <span class="step-badge">阶段 {{ currentStageIndex + 1 }} / {{ currentCampaign.stages.length }}</span>
        </div>

        <div class="step-pills">
          <button
            v-for="(st, idx) in currentCampaign.stages"
            :key="st.step"
            class="pill-btn"
            :class="{ active: currentStageIndex === idx }"
            @click="$emit('select-stage', idx)"
          >
            {{ idx + 1 }}. {{ st.title.split('：')[1] || st.title }}
          </button>
        </div>

        <!-- 当前阶段战况 -->
        <div class="stage-detail-card" v-if="currentStage">
          <div class="stage-name">{{ currentStage.title }}</div>
          <div class="stage-highlight">🎯 {{ currentStage.highlight }}</div>
          <p class="stage-desc">{{ currentStage.desc }}</p>

          <!-- 重点冲突据点 -->
          <div class="cp-list">
            <div class="cp-title">本阶段关键要塞与战场：</div>
            <div class="cp-tags">
              <span v-for="cp in currentStage.checkpoints" :key="cp.name" class="cp-tag">
                📍 {{ cp.name }} ({{ cp.role }})
              </span>
            </div>
          </div>
        </div>

        <div class="step-nav-row">
          <button
            class="nav-btn"
            :disabled="currentStageIndex === 0"
            @click="$emit('prev-stage')"
          >
            ‹ 上一战术阶段
          </button>
          <button
            class="nav-btn"
            :disabled="currentStageIndex === currentCampaign.stages.length - 1"
            @click="$emit('next-stage')"
          >
            下一战术阶段 ›
          </button>
        </div>
      </div>

      <button class="back-btn" @click="$emit('back-to-macro')">
        ‹ 返回全省地理沙盘
      </button>
    </aside>

    <!-- 底部战役选择器 -->
    <div class="campaign-bar glass-panel">
      <div class="bar-hint">陕西经典历史战役推演：点击切换兵力部署路线与秦岭/黄土古战场</div>
      <div class="campaign-items">
        <div
          v-for="c in campaigns"
          :key="c.id"
          class="camp-card"
          :class="{ active: currentCampaignId === c.id }"
          @click="$emit('select-campaign', c.id)"
        >
          <div class="camp-card-title">{{ c.title }}</div>
          <div class="camp-card-sub">{{ c.period }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  currentMode: { type: String, required: true },
  campaigns: { type: Array, required: true },
  currentCampaignId: { type: String, required: true },
  currentStageIndex: { type: Number, default: 0 }
});

defineEmits(['select-campaign', 'select-stage', 'prev-stage', 'next-stage', 'back-to-macro']);

const currentCampaign = computed(() => {
  return props.campaigns.find(c => c.id === props.currentCampaignId) || props.campaigns[0];
});

const currentStage = computed(() => {
  if (!currentCampaign.value) return null;
  return currentCampaign.value.stages[props.currentStageIndex] || currentCampaign.value.stages[0];
});
</script>

<style scoped>
.campaign-panel {
  position: absolute;
  top: 80px;
  left: 20px;
  width: 400px;
  max-height: calc(100vh - 185px);
  overflow-y: auto;
  padding: 20px;
  z-index: 15;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-tag {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  color: #ef4444;
  letter-spacing: 0.08em;
}

.camp-title {
  font-family: var(--font-serif);
  font-size: 24px;
  color: #fff;
  font-weight: 700;
  line-height: 1.25;
}

.camp-period {
  font-size: 12px;
  color: #94a3b8;
  margin-top: -6px;
}

.belligerents-box, .outcome-box {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 8px 12px;
}

.b-label, .o-label {
  font-size: 10px;
  color: #64748b;
  margin-bottom: 2px;
}

.b-val {
  font-size: 12px;
  font-weight: 600;
  color: #fca5a5;
}

.o-val {
  font-size: 12px;
  font-weight: 600;
  color: #38bdf8;
}

.camp-overview {
  font-size: 12.5px;
  line-height: 1.6;
  color: #cbd5e1;
}

.stepper-box {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stepper-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: #94a3b8;
}

.step-badge {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.4);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
}

.step-pills {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pill-btn {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #94a3b8;
  padding: 6px 10px;
  border-radius: 6px;
  font-size: 12px;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
}

.pill-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
}

.pill-btn.active {
  background: rgba(239, 68, 68, 0.2);
  border-color: #ef4444;
  color: #fff;
  font-weight: 600;
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.3);
}

.stage-detail-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: rgba(255, 255, 255, 0.02);
  padding: 10px;
  border-radius: 8px;
}

.stage-name {
  font-size: 13px;
  font-weight: 700;
  color: #fca5a5;
}

.stage-highlight {
  font-size: 11px;
  color: #fbbf24;
  font-weight: 600;
}

.stage-desc {
  font-size: 12px;
  color: #cbd5e1;
  line-height: 1.6;
}

.cp-list {
  margin-top: 4px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cp-title {
  font-size: 10px;
  color: #64748b;
}

.cp-tags {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cp-tag {
  font-size: 10px;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid rgba(56, 189, 248, 0.2);
}

.step-nav-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-top: 4px;
}

.nav-btn {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #fff;
  padding: 8px;
  border-radius: 6px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-btn:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.2);
  border-color: #ef4444;
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.back-btn {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #fff;
  padding: 8px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: rgba(56, 189, 248, 0.2);
  border-color: #38bdf8;
  color: #38bdf8;
}

.campaign-bar {
  position: absolute;
  bottom: 16px;
  left: 20px;
  right: 20px;
  padding: 10px 16px;
  z-index: 15;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bar-hint {
  font-size: 11px;
  color: #94a3b8;
}

.campaign-items {
  display: flex;
  gap: 10px;
}

.camp-card {
  flex: 1;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.camp-card:hover {
  background: rgba(255, 255, 255, 0.08);
}

.camp-card.active {
  background: rgba(239, 68, 68, 0.15);
  border-color: #ef4444;
  box-shadow: 0 0 10px rgba(239, 68, 68, 0.3);
}

.camp-card-title {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
}

.camp-card-sub {
  font-size: 10px;
  color: #94a3b8;
  margin-top: 2px;
}
</style>
