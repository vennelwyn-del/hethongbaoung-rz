// js/radio.js — Phát danh sách nhạc từ js/config.js (tự fallback sang AI Synth nếu url rỗng)

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
}