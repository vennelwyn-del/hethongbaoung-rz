// js/main.js — Đọc cấu hình từ js/config.js, Giao diện 1 (Gate) -> Giao diện 2 (Console VR)

import { SITE_CONFIG } from "./config.js";
import { initVRCanvas } from "./canvas-bg.js";
import { SystemRadio } from "./radio.js";
import {
  getSavedSessionUsername,
  registerSimpleAccount,
  loginSimpleAccount,
  fetchDebtorByUsername,
  saveDebtorState,
  logoutSimpleAccount
} from "./firebase.js";

const vrBg = initVRCanvas();
const radio = new SystemRadio();

const VALID_THEMES = ["cyber-violet", "acid"];
let savedTheme = localStorage.getItem("bao_ung_theme") || "cyber-violet";
if (!VALID_THEMES.includes(savedTheme)) savedTheme = "cyber-violet";

const state = {
  theme: savedTheme,
  sfx: SITE_CONFIG.effects.sfx,
  scanlines: SITE_CONFIG.effects.scanlines,
  parallax: SITE_CONFIG.effects.parallax3D,
  pb: Number(localStorage.getItem("bao_ung_pb") || -1482.75),
  selectedSector: "Đ1 Vọng Ngữ",
  username: getSavedSessionUsername(),
  debtorCode: "#049",
  isBreaching: false
};

const htmlEl = document.documentElement;
const bgImageLayer = document.getElementById("bg-image-layer");
const screenGate = document.getElementById("screen-gate");
const screenConsole = document.getElementById("screen-console");
const touchCursor = document.getElementById("touch-cursor");
const cursorCoords = document.getElementById("cursor-coords");

const radioToggle = document.getElementById("radio-toggle");
const radioNext = document.getElementById("radio-next");
const radioVol = document.getElementById("radio-vol");
const radioTrackName = document.getElementById("radio-track-name");

const portalGate = document.getElementById("portal-gate");
const gateTouchCore = document.querySelector(".gate-touch-core");
const coreProgressBar = document.querySelector("#core-progress span");
const gateActionText = document.getElementById("gate-action-text");
const receiptFeed = document.getElementById("receipt-feed");

// ÁP DỤNG SCANLINES TỪ config.js
document.getElementById("scanlines-layer").classList.toggle("hidden", !state.scanlines);

// 1. ÁP DỤNG THEME + ẢNH NỀN TỪ js/config.js
function updateBackgroundImage(themeName) {
  const cfg = SITE_CONFIG.backgroundImage;
  const imgUrl = (cfg.byTheme && cfg.byTheme[themeName]) || cfg.defaultUrl || "";
  if (imgUrl.trim()) {
    bgImageLayer.style.backgroundImage = `url("${imgUrl.trim()}")`;
    bgImageLayer.style.opacity = String(cfg.opacity ?? 0.35);
  } else {
    bgImageLayer.style.backgroundImage = "none";
    bgImageLayer.style.opacity = "0";
  }
}

function applyTheme(themeName, syncCloud = true) {
  const safeTheme = VALID_THEMES.includes(themeName) ? themeName : "cyber-violet";
  state.theme = safeTheme;
  htmlEl.setAttribute("data-theme", safeTheme);
  localStorage.setItem("bao_ung_theme", safeTheme);
  updateBackgroundImage(safeTheme);

  document.querySelectorAll(".theme-dot").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.setTheme === safeTheme);
  });

  if (syncCloud && state.username) {
    saveDebtorState(state.username, { theme: safeTheme }).catch(() => {});
  }
}

document.querySelectorAll("[data-set-theme]").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (state.sfx) radio.playClickChime();
    applyTheme(btn.dataset.setTheme);
  });
});

// 2. CON TRỎ & PARALLAX 3D CHO GIAO DIỆN 2
window.addEventListener("pointermove", (e) => {
  if (touchCursor) {
    touchCursor.style.left = `${e.clientX}px`;
    touchCursor.style.top = `${e.clientY}px`;
    cursorCoords.textContent = `X:${String(Math.round(e.clientX)).padStart(3, "0")} Y:${String(Math.round(e.clientY)).padStart(3, "0")}`;
  }
  if (!state.parallax || window.innerWidth <= 1140 || screenConsole.classList.contains("hidden")) return;
  const nx = (e.clientX / window.innerWidth - 0.5) * 2;
  const ny = (e.clientY / window.innerHeight - 0.5) * 2;
  screenConsole.style.transform = `rotateY(${nx * 6}deg) rotateX(${-ny * 4.5}deg)`;
});

window.addEventListener("pointerdown", (e) => {
  vrBg.spawnTouchRipple(e.clientX, e.clientY);
});

// 3. OSCILLOSCOPE SÓNG ĐIỆN & RADIO
const waveCanvas = document.getElementById("telemetry-wave");
const waveCtx = waveCanvas ? waveCanvas.getContext("2d") : null;
const rScope = document.getElementById("radio-scope");
const rCtx = rScope ? rScope.getContext("2d") : null;
let wavePhase = 0;

function drawScopes() {
  const styles = getComputedStyle(htmlEl);
  const p = styles.getPropertyValue("--rgb-primary").trim() || "59, 184, 248";
  const s = styles.getPropertyValue("--rgb-secondary").trim() || "247, 135, 248";
  wavePhase += 0.1;

  if (waveCtx && !screenConsole.classList.contains("hidden")) {
    waveCtx.clearRect(0, 0, waveCanvas.width, waveCanvas.height);
    waveCtx.strokeStyle = `rgba(${p}, 0.92)`;
    waveCtx.lineWidth = 1.6;
    waveCtx.beginPath();
    for (let x = 0; x < waveCanvas.width; x++) {
      const y = 29 + Math.sin(x * 0.06 + wavePhase) * 13 + Math.cos(x * 0.16 - wavePhase * 1.7) * 8;
      x === 0 ? waveCtx.moveTo(x, y) : waveCtx.lineTo(x, y);
    }
    waveCtx.stroke();
  }

  if (rCtx) {
    rCtx.clearRect(0, 0, rScope.width, rScope.height);
    rCtx.fillStyle = `rgba(${radio.isPlaying ? s : p}, 0.85)`;
    for (let i = 0; i < 9; i++) {
      const barH = radio.isPlaying ? 4 + Math.abs(Math.sin(wavePhase * 1.6 + i * 0.7)) * 12 : 3;
      rCtx.fillRect(i * 6, 16 - barH, 3.5, barH);
    }
  }
  requestAnimationFrame(drawScopes);
}
drawScopes();

setInterval(() => {
  const clockEl = document.getElementById("clock-utc");
  if (clockEl) clockEl.textContent = new Date().toTimeString().slice(0, 8);
  const hexEl = document.getElementById("hex-matrix");
  if (hexEl) {
    const bytes = Array.from({ length: 7 }, () =>
      Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, "0")
    );
    hexEl.textContent = `0x${bytes.join(" ")}`;
  }
}, 1000);

// 4. RADIO
radioTrackName.textContent = radio.currentTrackName;
radioToggle.addEventListener("click", () => {
  const playing = radio.toggle();
  radioToggle.querySelector(".radio-icon").textContent = playing ? "❚❚" : "▶";
});
radioNext.addEventListener("click", () => {
  radioTrackName.textContent = radio.nextTrack();
});
radioVol.addEventListener("input", (e) => radio.setVolume(e.target.value));

// 5. CHUYỂN GIAO DIỆN 1 (GATE) -> GIAO DIỆN 2 (CONSOLE QUÉT & HỒ SƠ)
function pushReceipt(text) {
  const p = document.createElement("p");
  p.textContent = text;
  receiptFeed.prepend(p);
}

function updatePbUI() {
  const formatted = `${state.pb.toFixed(2)} PB`;
  document.get