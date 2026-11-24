// js/radio.js — Nhạc nền, Âm thanh lật thẻ 3D & Còi báo động xâm nhập hệ thống (4.2 giây)

import { SITE_CONFIG } from "./config.js";

const FALLBACK_SYNTH = [
  { baseFreq: 65.41, harmonic: 98.0, pulseRate: 0.25 },
  { baseFreq: 82.41, harmonic: 123.47, pulseRate: 0.5 },
  { baseFreq: 110.0, harmonic: 164.81, pulseRate: 0.18 }
];

export class SystemRadio {
  constructor() {
    this.playlist = SITE_CONFIG.musicPlaylist?.length
      ? SITE_CONFIG.musicPlaylist
      : [{ title: "CH.01 // VOID DRONE", url: "" }];
    this.ctx = null;
    this.masterGain = null;
    this.oscA = null;
    this.oscB = null;
    this.lfo = null;
    this.audioEl = null;
    this.isPlaying = false;
    this.trackIndex = 0;
    this.volume = 0.35;
    this.sirenStopFn = null;
  }

  get currentTrack() {
    return this.playlist[this.trackIndex] || this.playlist[0];
  }

  get currentTrackName() {
    return this.currentTrack.title;
  }

  initAudio() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.volume * 0.25;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
  }

  startSynth() {
    this.stopSynth();
    this.initAudio();
    const t = FALLBACK_SYNTH[this.trackIndex % FALLBACK_SYNTH.length];
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 420;
    filter.connect(this.masterGain);

    this.oscA = this.ctx.createOscillator();
    this.oscA.type = "sawtooth";
    this.oscA.frequency.value = t.baseFreq;

    this.oscB = this.ctx.createOscillator();
    this.oscB.type = "triangle";
    this.oscB.frequency.value = t.harmonic;

    this.lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    this.lfo.frequency.value = t.pulseRate;
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
    [this.oscA, this.oscB, this.lfo].forEach((n) => {
      if (n) try { n.stop(); n.disconnect(); } catch (_) {}
    });
    this.oscA = this.oscB = this.lfo = null;
  }

  play() {
    const url = (this.currentTrack.url || "").trim();
    if (url) {
      this.stopSynth();
      if (!this.audioEl) {
        this.audioEl = new Audio();
        this.audioEl.loop = true;
      }
      if (this.audioEl.src !== url) this.audioEl.src = url;
      this.audioEl.volume = this.volume;
      this.audioEl.play().catch(() => this.startSynth());
    } else {
      if (this.audioEl) this.audioEl.pause();
      this.startSynth();
    }
    this.isPlaying = true;
  }

  stop() {
    this.stopSynth();
    if (this.audioEl) this.audioEl.pause();
    this.isPlaying = false;
  }

  toggle() {
    if (this.isPlaying) { this.stop(); return false; }
    this.play();
    return true;
  }

  nextTrack() {
    this.trackIndex = (this.trackIndex + 1) % this.playlist.length;
    if (this.isPlaying) this.play();
    return this.currentTrackName;
  }

  setVolume(val) {
    this.volume = Number(val);
    if (this.masterGain) this.masterGain.gain.value = this.volume * 0.25;
    if (this.audioEl) this.audioEl.volume = this.volume;
  }

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

  playFlipChime() {
    this.initAudio();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(340, now);
    osc.frequency.exponentialRampToValueAtTime(840, now + 0.09);
    gain.gain.setValueAtTime(0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  stopWarningSiren() {
    if (this.sirenStopFn) {
      this.sirenStopFn();
      this.sirenStopFn = null;
    }
  }

  // Còi báo động xâm nhập hệ thống kéo dài ~4.2 giây
  playWarningSiren(durationSec = 4.2) {
    this.stopWarningSiren();
    this.initAudio();

    const now = this.ctx.currentTime;
    const endTime = now + durationSec;

    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1100;
    filter.Q.value = 1.8;

    const alarmGain = this.ctx.createGain();
    const baseLevel = Math.max(0.14, this.volume * 0.42);
    alarmGain.gain.setValueAtTime(0.001, now);
    alarmGain.gain.exponentialRampToValueAtTime(baseLevel, now + 0.08);
    alarmGain.gain.setValueAtTime(baseLevel, Math.max(now + 0.1, endTime - 0.35));
    alarmGain.gain.exponentialRampToValueAtTime(0.0001, endTime);

    filter.connect(alarmGain);
    alarmGain.connect(this.ctx.destination);

    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    osc1.type = "sawtooth";
    osc2.type = "square";

    // LFO quét tần số còi hụ liên tục + nhịp đập cảnh báo
    const sweepLfo = this.ctx.createOscillator();
    const sweepDepth = this.ctx.createGain();
    sweepLfo.type = "sine";
    sweepLfo.frequency.value = 2.4; // ~2.4 nhịp hú mỗi giây
    sweepDepth.gain.value = 230;

    osc1.frequency.value = 690;
    osc2.frequency.value = 696; // Lệch pha nhẹ tạo độ gắt sci-fi
    sweepLfo.connect(sweepDepth);
    sweepDepth.connect(osc1.frequency);
    sweepDepth.connect(osc2.frequency);

    osc1.connect(filter);
    osc2.connect(filter);

    osc1.start(now);
    osc2.start(now);
    sweepLfo.start(now);

    osc1.stop(endTime + 0.02);
    osc2.stop(endTime + 0.02);
    sweepLfo.stop(endTime + 0.02);

    this.sirenStopFn = () => {
      try {
        osc1.stop();
        osc2.stop();
        sweepLfo.stop();
        osc1.disconnect();
        osc2.disconnect();
        sweepLfo.disconnect();
        alarmGain.disconnect();
      } catch (_) {}
    };

    return this.sirenStopFn;
  }
}