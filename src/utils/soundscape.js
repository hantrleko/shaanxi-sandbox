// 陕西地理沙盘 · Web Audio 三维空间自然音景系统 (Procedural 3D Spatial Audioscape)
// 100% 原生浏览器音频合成，0 外部音频文件体积，0 网络加载延迟

class ShaanxiSoundscape {
  constructor() {
    this.ctx = null;
    this.isMuted = true;
    this.masterGain = null;
    this.windGain = null;
    this.windFilter = null;
    this.noiseSource = null;
    this.ambientDrone = null;
    this.initialized = false;
    this.currentZone = '高空大漠风吟';
    this.lastChirpTime = 0;
    this.lastBellTime = 0;
    this.flightSpeedFactor = 0;
  }

  // 用户首次交互时初始化 AudioContext (符合现代浏览器自动播放策略)
  init() {
    if (this.initialized) {
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      // 总音量节点
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.35, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // 1. 生成 3 秒无缝循环粉红/布朗自然风声噪声源
      const bufferSize = this.ctx.sampleRate * 3;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.06;
        b6 = white * 0.115926;
      }

      this.noiseSource = this.ctx.createBufferSource();
      this.noiseSource.buffer = noiseBuffer;
      this.noiseSource.loop = true;

      // 自然风动态双二阶低通/带通滤波器
      this.windFilter = this.ctx.createBiquadFilter();
      this.windFilter.type = 'lowpass';
      this.windFilter.frequency.setValueAtTime(420, this.ctx.currentTime);
      this.windFilter.Q.setValueAtTime(1.8, this.ctx.currentTime);

      this.windGain = this.ctx.createGain();
      this.windGain.gain.setValueAtTime(0.5, this.ctx.currentTime);

      this.noiseSource.connect(this.windFilter);
      this.windFilter.connect(this.windGain);
      this.windGain.connect(this.masterGain);
      this.noiseSource.start(0);

      // 2. 远古苍茫氛围次低音共鸣 (Sub-harmonic Drone 65.4Hz / C2)
      this.ambientDrone = this.ctx.createOscillator();
      this.ambientDrone.type = 'sine';
      this.ambientDrone.frequency.setValueAtTime(65.4, this.ctx.currentTime);

      const droneGain = this.ctx.createGain();
      droneGain.gain.setValueAtTime(0.04, this.ctx.currentTime);
      this.ambientDrone.connect(droneGain);
      droneGain.connect(this.masterGain);
      this.ambientDrone.start(0);

      this.initialized = true;
    } catch (err) {
      console.warn('Web Audio Soundscape init failed:', err);
    }
  }

  // 静音 / 解除静音切换
  toggleMute() {
    this.init();
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const targetGain = this.isMuted ? 0 : 0.35;
      this.masterGain.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 0.3);
    }
    return !this.isMuted;
  }

  setMuted(muted) {
    if (this.isMuted === muted) return;
    this.toggleMute();
  }

  // 根据沙盘相机三维坐标空间动态调制音频环境 (Spatial Modulation)
  updateCameraSpatial(camPos, camTarget, flightSpeed = 0) {
    if (!this.initialized || this.isMuted || !this.ctx) return;

    const t = this.ctx.currentTime;
    const px = camPos.x || camPos[0] || 0;
    const py = camPos.y || camPos[1] || 50;
    const pz = camPos.z || camPos[2] || 50;

    // 1. 根据飞行速度增加破空风声
    let targetFreq = 380;
    let targetWindGain = 0.45;

    if (flightSpeed > 0) {
      targetFreq = 580 + flightSpeed * 220;
      targetWindGain = 0.75;
      this.currentZone = '低空穿梭风啸';
    } else if (py > 75) {
      // 高空巡航
      targetFreq = 260;
      targetWindGain = 0.35;
      this.currentZone = '高空大漠风吟';
    } else if (pz < -10) {
      // 陕北黄土高原 (呼啸苍凉的高原长风)
      targetFreq = 480 + (Math.sin(t * 0.8) * 60);
      targetWindGain = 0.6;
      this.currentZone = '陕北高原长风';
    } else if (pz > 15 && py < 45) {
      // 秦岭 / 汉江秦巴山脉 (松涛山岚与鸟鸣)
      targetFreq = 340;
      targetWindGain = 0.4;
      this.currentZone = '秦岭松涛与山涧';
      this.triggerMountainBirdChirp(t);
    } else {
      // 关中平原与渭河走廊 (温暖晨暮与偶现古钟)
      targetFreq = 360;
      targetWindGain = 0.42;
      this.currentZone = '关中沃野钟韵';
      this.triggerTempleBellChime(t);
    }

    if (this.windFilter) {
      this.windFilter.frequency.setTargetAtTime(targetFreq, t, 0.4);
    }
    if (this.windGain) {
      this.windGain.gain.setTargetAtTime(targetWindGain, t, 0.4);
    }
  }

  // 偶尔在秦岭深处触发自然清脆山鸟鸣叫 (程序化高频调频合成)
  triggerMountainBirdChirp(now) {
    if (now - this.lastChirpTime < 8.0) return;
    if (Math.random() > 0.015) return; // 偶发几率
    this.lastChirpTime = now;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';

      // 快速双声调频滑音
      osc.frequency.setValueAtTime(2600, now);
      osc.frequency.exponentialRampToValueAtTime(3600, now + 0.07);
      osc.frequency.exponentialRampToValueAtTime(2800, now + 0.16);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.05, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (_) {}
  }

  // 偶尔在关中长安古城上空触发深远古刹晨钟 (泛音叠加物理模拟)
  triggerTempleBellChime(now) {
    if (now - this.lastBellTime < 24.0) return;
    if (Math.random() > 0.01) return;
    this.lastBellTime = now;

    this.playBell();
  }

  playBell() {
    if (!this.initialized || this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    try {
      const baseFreq = 196.0; // G3 沉稳古朴音高
      const harmonics = [1.0, 2.02, 3.05, 4.1];
      const gains = [0.08, 0.04, 0.02, 0.01];

      harmonics.forEach((h, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(baseFreq * h, now);

        gain.gain.setValueAtTime(gains[i], now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8 + i * 0.4);

        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 4.5);
      });
    } catch (_) {}
  }

  // UI 交互音效 (点击打卡/切换节点轻击声)
  playClick() {
    if (!this.initialized || this.isMuted || !this.ctx) return;
    const now = this.ctx.currentTime;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.06);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.08);
    } catch (_) {}
  }
}

export const soundscape = new ShaanxiSoundscape();
