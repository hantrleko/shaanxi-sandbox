<template>
  <div v-if="active" class="poster-modal-overlay" @click.self="$emit('close')">
    <div class="poster-card">
      <div class="poster-header">
        <div class="header-title">
          <span class="icon">📸</span>
          <span>三秦地理数字明信片海报生成器</span>
        </div>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <!-- 海报预览画布 -->
      <div class="canvas-preview-wrapper">
        <canvas ref="posterCanvasRef" class="poster-canvas"></canvas>
      </div>

      <!-- 底部操作栏 -->
      <div class="poster-footer">
        <div class="tip-text">
          ✨ 已自动注入 EUGENE FINANCE 品牌认证印章、真实 GIS 经纬高程及经典唐诗题跋
        </div>
        <div class="btns-row">
          <button class="cancel-btn" @click="$emit('close')">取消</button>
          <button class="download-btn" @click="downloadPoster">
            💾 下载保存高清明信片 (PNG)
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';

const props = defineProps({
  active: { type: Boolean, default: false },
  snapshotUrl: { type: String, default: '' },
  telemetry: { type: Object, default: () => ({ pitch: 35, azimuth: 45 }) },
  chapterTitle: { type: String, default: '陕西宏观地貌' }
});

defineEmits(['close']);

const posterCanvasRef = ref(null);

const generatePoster = () => {
  if (!posterCanvasRef.value || !props.snapshotUrl) return;

  const canvas = posterCanvasRef.value;
  const ctx = canvas.getContext('2d');

  // 海报标准 3:4 比例 (1200 x 1600)
  canvas.width = 1200;
  canvas.height = 1600;

  // 1. 背景沉浸深空底色
  const bgGrad = ctx.createLinearGradient(0, 0, 1200, 1600);
  bgGrad.addColorStop(0, '#060a12');
  bgGrad.addColorStop(0.5, '#0b1322');
  bgGrad.addColorStop(1, '#05070d');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1200, 1600);

  // 2. 细金线国风外框
  ctx.strokeStyle = 'rgba(217, 119, 6, 0.45)';
  ctx.lineWidth = 3;
  ctx.strokeRect(36, 36, 1200 - 72, 1600 - 72);

  ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
  ctx.lineWidth = 1;
  ctx.strokeRect(48, 48, 1200 - 96, 1600 - 96);

  // 3. 绘制品牌 Logo 与顶头抬头
  const logoImg = new Image();
  logoImg.src = './images/brand/eugene_logo_badge.png';
  logoImg.onload = () => {
    ctx.drawImage(logoImg, 70, 70, 96, 96);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 22px "Microsoft YaHei", sans-serif';
    ctx.fillText('EUGENE FINANCE 呈现', 185, 105);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '18px "Microsoft YaHei", sans-serif';
    ctx.fillText('三秦大地 · 真实三维地理人文沙盒数字典藏', 185, 140);

    drawSnapshotAndBody();
  };
  logoImg.onerror = () => {
    drawSnapshotAndBody();
  };

  const drawSnapshotAndBody = () => {
    // 4. 绘制 3D 截图主体画面
    const snap = new Image();
    snap.src = props.snapshotUrl;
    snap.onload = () => {
      // 截图区域 (X: 70, Y: 190, W: 1060, H: 960)
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(70, 190, 1060, 960, 16);
      ctx.clip();
      ctx.drawImage(snap, 70, 190, 1060, 960);
      ctx.restore();

      // 截图边框
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(70, 190, 1060, 960, 16);
      ctx.stroke();

      // 5. 章节与诗词配文
      ctx.fillStyle = '#fef08a';
      ctx.font = 'bold 42px "Noto Serif SC", "STSong", "SimSun", serif';
      ctx.fillText(props.chapterTitle || '三秦极目 · 壮美山河', 70, 1230);

      // 经典唐诗配句
      ctx.fillStyle = '#fcd34d';
      ctx.font = 'italic 26px "Noto Serif SC", "STSong", serif';
      const poetry = '“西上太白峰，夕阳穷登攀。太白与我语，为我开天关。” —— 李白';
      ctx.fillText(poetry, 70, 1285);

      ctx.fillStyle = '#cbd5e1';
      ctx.font = '22px "Microsoft YaHei", sans-serif';
      const intro = '横跨长江黄河两大流域，一山分南北，八百里秦川沃野千里，十四朝古都辉映古今。';
      ctx.fillText(intro, 70, 1340);

      // 6. 底部遥测数据条 (Telemetry HUD)
      const barY = 1420;
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(70, barY, 1060, 110);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.strokeRect(70, barY, 1060, 110);

      ctx.fillStyle = '#38bdf8';
      ctx.font = 'bold 20px monospace';
      ctx.fillText(`GEO: 34°16'N, 108°54'E`, 100, barY + 45);
      ctx.fillText(`BEARING: ${props.telemetry.azimuth || 45}° AZIMUTH`, 100, barY + 85);

      ctx.fillStyle = '#10b981';
      ctx.fillText(`PITCH: ${props.telemetry.pitch || 35}° INCLINE`, 480, barY + 45);
      ctx.fillText(`DEM ELEVATION: 3771.2m MAX`, 480, barY + 85);

      // 7. 红色印章
      ctx.save();
      ctx.translate(1010, barY + 55);
      ctx.rotate(-0.1);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3;
      ctx.strokeRect(-40, -40, 80, 80);
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 18px "SimSun", serif';
      ctx.textAlign = 'center';
      ctx.fillText('三秦', 0, -10);
      ctx.fillText('地理', 0, 20);
      ctx.restore();
    };
  };
};

const downloadPoster = () => {
  if (!posterCanvasRef.value) return;
  const link = document.createElement('a');
  link.download = `Shaanxi_Geography_EugeneFinance_${Date.now()}.png`;
  link.href = posterCanvasRef.value.toDataURL('image/png');
  link.click();
};

watch(() => props.active, (val) => {
  if (val) {
    nextTick(() => {
      generatePoster();
    });
  }
});
</script>

<style scoped>
.poster-modal-overlay {
  position: absolute;
  inset: 0;
  background: rgba(4, 7, 12, 0.88);
  backdrop-filter: blur(12px);
  z-index: 90;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.poster-card {
  background: rgba(12, 17, 28, 0.96);
  border: 1px solid rgba(217, 119, 6, 0.5);
  border-radius: 18px;
  max-width: 620px;
  width: 100%;
  max-height: 94vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.9), 0 0 35px rgba(217, 119, 6, 0.25);
  padding: 16px 20px;
  gap: 12px;
  color: #fff;
}

.poster-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14.5px;
  font-weight: 700;
  color: #fef08a;
}

.close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 16px;
  cursor: pointer;
}

.close-btn:hover {
  color: #ef4444;
}

.canvas-preview-wrapper {
  width: 100%;
  height: 65vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(5, 8, 14, 0.8);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  overflow: hidden;
  padding: 10px;
}

.poster-canvas {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
  border-radius: 8px;
}

.poster-footer {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.tip-text {
  font-size: 11px;
  color: #94a3b8;
  text-align: center;
}

.btns-row {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.cancel-btn {
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #cbd5e1;
  padding: 8px 16px;
  border-radius: 18px;
  font-size: 12.5px;
  cursor: pointer;
}

.download-btn {
  background: linear-gradient(135deg, #d97706, #b45309);
  border: 1px solid #f59e0b;
  color: #fff;
  font-weight: 700;
  padding: 8px 20px;
  border-radius: 18px;
  font-size: 12.5px;
  cursor: pointer;
  box-shadow: 0 0 15px rgba(245, 158, 11, 0.4);
}

.download-btn:hover {
  background: #d97706;
}
</style>
