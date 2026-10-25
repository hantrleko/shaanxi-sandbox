// 语音旁白播报工具（基于 Web Speech API）
class VoiceNarrator {
  constructor() {
    this.synth = window.speechSynthesis || null;
    this.currentUtterance = null;
    this.isPlaying = false;
    this.isMuted = false;
    this.onEndCallback = null;
  }

  speak(text, onEnd) {
    if (!this.synth || this.isMuted) return;

    this.stop();
    this.onEndCallback = onEnd;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "zh-CN";
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // 优选高质中文声音
    const voices = this.synth.getVoices();
    const zhVoice = voices.find(v => v.lang.includes("zh") || v.name.includes("Chinese") || v.name.includes("Xiaoxiao"));
    if (zhVoice) {
      utterance.voice = zhVoice;
    }

    utterance.onend = () => {
      this.isPlaying = false;
      if (this.onEndCallback) {
        this.onEndCallback();
      }
    };

    utterance.onerror = (e) => {
      console.warn("TTS narration error:", e);
      this.isPlaying = false;
    };

    this.currentUtterance = utterance;
    this.isPlaying = true;
    this.synth.speak(utterance);
  }

  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.isPlaying = false;
  }

  pause() {
    if (this.synth && this.isPlaying) {
      this.synth.pause();
      this.isPlaying = false;
    }
  }

  resume() {
    if (this.synth && this.currentUtterance) {
      this.synth.resume();
      this.isPlaying = true;
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stop();
    }
    return this.isMuted;
  }
}

export const narrator = new VoiceNarrator();
