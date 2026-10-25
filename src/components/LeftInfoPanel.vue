<template>
  <aside class="left-info-panel glass-panel">
    <div class="panel-header">
      <div class="chapter-meta">
        <span class="chapter-num">{{ chapter.num }} / {{ totalChapters }}</span>
        <span class="chapter-theme">{{ currentThemeTitle }}</span>
      </div>
      <button class="listen-btn glass-btn" @click="$emit('listen-current')">
        <span>🎧 听这段</span>
      </button>
    </div>

    <!-- 标题与副标题 -->
    <h2 class="main-title">{{ chapter.title }}</h2>
    <div class="sub-title">{{ chapter.subTitle }}</div>

    <!-- 关键指标与年代徽章 -->
    <div class="badge-row">
      <div class="badge-card" v-if="chapter.timeBadge">
        <div class="badge-val">{{ chapter.timeBadge }}</div>
        <div class="badge-lbl">时代 · 特征</div>
      </div>
      <div class="badge-card highlight" v-if="chapter.highlight">
        <div class="badge-val">{{ chapter.highlight }}</div>
        <div class="badge-lbl">地理核心要点</div>
      </div>
    </div>

    <!-- 详述文案 -->
    <div class="desc-content">
      <p>{{ chapter.desc }}</p>
    </div>

    <!-- 图解与实景联动展示卡片 -->
    <div class="visual-cards">
      <!-- 剖面示意图 -->
      <div class="card-item" v-if="chapter.diagramTitle">
        <div class="card-tag">图解 · 示意图</div>
        <div class="diagram-preview">
          <div class="diagram-art" :class="chapter.diagramType">
            <!-- 矢量简绘剖面 -->
            <div class="art-layer top-layer"></div>
            <div class="art-layer mid-layer"></div>
            <div class="art-layer btm-layer"></div>
          </div>
          <div class="card-caption">{{ chapter.diagramTitle }}</div>
        </div>
      </div>

      <!-- 实景卫星/历史图片 -->
      <div class="card-item" v-if="chapter.photoUrl">
        <div class="card-tag">实景 · 影像图</div>
        <div class="photo-preview">
          <img :src="chapter.photoUrl" :alt="chapter.title" class="preview-img" />
          <div class="card-caption">{{ chapter.photoCaption }}</div>
        </div>
      </div>
    </div>

    <!-- 互动指令：在沙盘上看一看 -->
    <div class="action-footer">
      <div class="action-hint">在沙盘上看一看：点一下，镜头跟进探索</div>
      <button class="action-btn" @click="$emit('focus-feature')">
        <span>🔍 飞向特征细节</span>
      </button>
    </div>
  </aside>
</template>

<script setup>
defineProps({
  chapter: { type: Object, required: true },
  totalChapters: { type: Number, default: 6 },
  currentThemeTitle: { type: String, default: "自然地理" }
});

defineEmits(['listen-current', 'focus-feature']);
</script>

<style scoped>
.left-info-panel {
  position: absolute;
  top: 80px;
  left: 20px;
  width: 380px;
  max-height: calc(100vh - 185px);
  overflow-y: auto;
  padding: 20px;
  z-index: 15;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.chapter-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  color: #38bdf8;
}

.chapter-num {
  background: rgba(56, 189, 248, 0.15);
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid rgba(56, 189, 248, 0.3);
}

.listen-btn {
  font-size: 11px;
  padding: 4px 10px;
}

.main-title {
  font-family: var(--font-serif);
  font-size: 26px;
  font-weight: 700;
  color: #fff;
  letter-spacing: 0.02em;
  line-height: 1.2;
}

.sub-title {
  font-size: 13px;
  color: #94a3b8;
  margin-top: -6px;
}

.badge-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.badge-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 10px;
}

.badge-card.highlight {
  border-color: rgba(56, 189, 248, 0.3);
  background: rgba(56, 189, 248, 0.06);
}

.badge-val {
  font-size: 13px;
  font-weight: 700;
  color: #f1f5f9;
  line-height: 1.3;
}

.badge-card.highlight .badge-val {
  color: #38bdf8;
}

.badge-lbl {
  font-size: 10px;
  color: #64748b;
  margin-top: 4px;
}

.desc-content p {
  font-size: 13px;
  line-height: 1.7;
  color: #cbd5e1;
  text-align: justify;
}

.visual-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.card-item {
  background: rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  padding: 10px;
}

.card-tag {
  font-size: 10px;
  font-weight: 600;
  color: #94a3b8;
  margin-bottom: 6px;
}

.diagram-art {
  height: 60px;
  background: linear-gradient(180deg, #1e293b 0%, #0f172a 100%);
  border-radius: 6px;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.art-layer {
  position: absolute;
  left: 0;
  right: 0;
  height: 20px;
}

.top-layer {
  top: 10px;
  background: rgba(56, 189, 248, 0.15);
  clip-path: polygon(0 40%, 30% 10%, 65% 70%, 100% 20%, 100% 100%, 0 100%);
}

.mid-layer {
  top: 25px;
  background: rgba(245, 158, 11, 0.2);
  clip-path: polygon(0 60%, 40% 30%, 80% 50%, 100% 40%, 100% 100%, 0 100%);
}

.btm-layer {
  top: 40px;
  background: rgba(16, 185, 129, 0.2);
}

.photo-preview {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.preview-img {
  width: 100%;
  height: 110px;
  object-fit: cover;
  border-radius: 6px;
}

.card-caption {
  font-size: 11px;
  color: #94a3b8;
  line-height: 1.4;
}

.action-footer {
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-hint {
  font-size: 11px;
  color: #94a3b8;
}

.action-btn {
  width: 100%;
  background: linear-gradient(90deg, rgba(56, 189, 248, 0.2) 0%, rgba(14, 165, 233, 0.3) 100%);
  border: 1px solid rgba(56, 189, 248, 0.4);
  color: #38bdf8;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: rgba(56, 189, 248, 0.35);
  color: #fff;
  box-shadow: 0 0 12px rgba(56, 189, 248, 0.4);
}
</style>
