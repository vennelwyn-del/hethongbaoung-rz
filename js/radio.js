// js/radio.js — Bộ phát Radio Hệ Thống 00 (Web Audio Synthesizer + Custom Stream)

const TRACKS = [
  { name: "CH.01 // VOID DRONE", baseFreq: 65.41, harmonic: 98.0, pulseRate: 0.25 },
  { name: "CH.02 // VỌNG NGỮ LO-FI", baseFreq: 82.41, harmonic: 123.47, pulseRate: 0.5 },
  { name: "CH.03 // TINH THỂ Sd.", baseFreq: 110.0, harmonic: 164.81, pulseRate: 0.18 }
];

export class SystemRadio {
  constructor() {
    this.ctx = null;
    this.masterGain = null;
    this.oscA = null;
    this.oscB = null;
    this.lfo = null;
    this.customAudio = null;
    this.customUrl = localStorage.getItem("bao_ung_radio_url") || "";
    this.isPlaying = false;
    this.trackIndex = 0;
    this.volume = 0.35;
  }

  get currentTrackName() {
    return this.customUrl ? "CUSTOM // STREAM" : TRACKS[this.trackIndex].name;
  }

  initAudio() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume * 0.25;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume();
    }
  }

  startSynth() {
    this.stopSynth();
    this.initAudio();
    const track = TRACKS[this.trackIndex];

    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 420;
    filter.connect(this.masterGain);

    this.oscA = this.ctx.createOscillator();
    this.oscA.type = "sawtooth";
    this.oscA.frequency.value = track.baseFreq;

    this.oscB = this.ctx.createOscillator();
    this.oscB.type = "triangle";
    this.oscB.frequency.value = track.harmonic;

    this.lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    this.lfo.frequency.value = track.pulseRate;
    lfoGain.gain.value = 180;
    this.lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    this.oscA.connect(filter);
    this.oscB.connect(filter);

    this.oscA.start();
    this.oscB.start();
    this.lfo.start();
  }

  stopSynth() {
    [this.oscA, this.oscB, this.lfo].forEach((node) => {
      if (node) {
        try { node.stop(); node.disconnect(); } catch (_) {}
      }
    });
    this.oscA = this.oscB = this.lfo = null;
  }

  toggle() {
    if (this.isPlaying) {
      this.stop();
      return false;
    }
    this.play();
    return true;
  }

  play() {
    if (this.customUrl) {
      this.stopSynth();
      if (!this.customAudio) {
        this.customAudio = new Audio(this.customUrl);
        this.customAudio.loop = true;
      }
      this.customAudio.volume = this.volume;
      this.customAudio.play().catch(() => {
        this.customUrl = "";
        this.startSynth();
      });
    } else {
      this.startSynth();
    }
    this.isPlaying = true;
  }

  stop() {
    this.stopSynth();
    if (this.customAudio) {
      this.customAudio.pause();
    }
    this.isPlaying = false;
  }

  nextTrack() {
    this.customUrl = "";
    localStorage.removeItem("bao_ung_radio_url");
    this.trackIndex = (this.trackIndex + 1) % TRACKS.length;
    if (this.isPlaying) this.play();
    return this.currentTrackName;
  }

  setVolume(val) {
    this.volume = Number(val);
    if (this.masterGain) this.masterGain.gain.value = this.volume * 0.25;
    if (this.customAudio) this.customAudio.volume = this.volume;
  }

  setCustomUrl(url) {
    this.customUrl = url.trim();
    if (this.customUrl) {
      localStorage.setItem("bao_ung_radio_url", this.customUrl);
      if (this.customAudio) {
        this.customAudio.pause();
        this.customAudio = null;
      }
    } else {
      localStorage.removeItem("bao_ung_radio_url");
    }
    if (this.isPlaying) this.play();
  }

  // Hiệu ứng âm thanh hóa đơn nhiệt / bấm Gate
  playClickChime() {
    this.initAudio();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(680, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1180, this.ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.16);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.17);
  }
}