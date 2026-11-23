// js/main.js — VR 3D Gate, Sóng Oscilloscope, 2 Template Màu & Tài khoản đơn giản Firebase

import { initVRCanvas } from "./canvas-bg.js";
import { SystemRadio } from "./radio.js";
import {
  isFirebaseConfigured,
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
  sfx: localStorage.getItem("bao_ung_sfx") !== "false",
  scanlines: localStorage.getItem("bao_ung_scanlines") !== "false",
  parallax: localStorage.getItem("bao_ung_parallax") !== "false",
  pb: Number(localStorage.getItem("bao_ung_pb") || -1482.75),
  selectedSector: "Đ1 Vọng Ngữ",
  username: getSavedSessionUsername(),
  debtorCode: "#049",
  gateOpened: false,
  isBreaching: false
};

const htmlEl = document.documentElement;
const vrRig = document.getElementById("vr-rig");
const touchCursor = document.getElementById("touch-cursor");
const cursorCoords = document.getElementById("cursor-coords");
const radioToggle = document.getElementById("radio-toggle");
const radioNext = document.getElementById("radio-next");
const radioVol = document.getElementById("radio-vol");
const radioTrackName = document.getElementById("radio-track-name");

const portalGate = document.getElementById("portal-gate");
const gateSection = document.getElementById("gate-section");
const gateTouchCore = document.querySelector(".gate-touch-core");
const coreProgressBar = document.querySelector("#core-progress span");
const gateActionText = document.getElementById("gate-action-text");
const unlockedConsole = document.getElementById("unlocked-console");
const receiptFeed = document.getElementById("receipt-feed");

// 1. CHUYỂN 2 TEMPLATE MÀU
function applyTheme(themeName, syncCloud = true) {
  const safeTheme = VALID_THEMES.includes(themeName) ? themeName : "cyber-violet";
  state.theme = safeTheme;
  htmlEl.setAttribute("data-theme", safeTheme);
  localStorage.setItem("bao_ung_theme", safeTheme);

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

// 2. TƯƠNG TÁC CHẠM 3D & CON TRỎ
window.addEventListener("pointermove", (e) => {
  if (touchCursor) {
    touchCursor.style.left = `${e.clientX}px`;
    touchCursor.style.top = `${e.clientY}px`;
    cursorCoords.textContent = `X:${String(Math.round(e.clientX)).padStart(3, "0")} Y:${String(Math.round(e.clientY)).padStart(3, "0")}`;
  }
  if (!state.parallax || window.innerWidth <= 1140) return;
  const nx = (e.clientX / window.innerWidth - 0.5) * 2;
  const ny = (e.clientY / window.innerHeight - 0.5) * 2;
  vrRig.style.transform = `rotateY(${nx * 6}deg) rotateX(${-ny * 4.5}deg)`;
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

  if (waveCtx) {
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
  document.getElementById("clock-utc").textContent = new Date().toTimeString().slice(0, 8);
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

// 5. RECEIPT & GATE
function pushReceipt(text) {
  const p = document.createElement("p");
  p.textContent = text;
  receiptFeed.prepend(p);
}

function updatePbUI() {
  const formatted = `${state.pb.toFixed(2)} PB`;
  document.getElementById("hud-pb-preview").textContent = formatted;
  document.getElementById("hud-pb-side").textContent = state.pb.toFixed(2);
  const profilePb = document.getElementById("profile-pb");
  if (profilePb) profilePb.textContent = formatted;
}

document.querySelectorAll(".sector-key").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (state.sfx) radio.playClickChime();
    document.querySelectorAll(".sector-key").forEach((b) => b.classList.remove("is-selected"));
    btn.classList.add("is-selected");
    state.selectedSector = btn.dataset.sector;
    document.getElementById("hud-sector-side").textContent = state.selectedSector;
    pushReceipt(`> Khóa tọa độ: [${state.selectedSector}]`);
  });
});

document.querySelectorAll(".holo-switch").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (state.sfx) radio.playClickChime();
    if (btn.dataset.cmd === "PING_RADAR") {
      pushReceipt(`【RADAR】: Quét sóng điện từ tại ${state.selectedSector}.`);
    } else {
      pushReceipt(`【KIỂM TOÁN 00】: Số dư nợ ${state.pb.toFixed(2)} PB.`);
    }
  });
});

portalGate.addEventListener("click", () => {
  if (state.isBreaching) return;
  state.isBreaching = true;
  if (state.sfx) radio.playClickChime();

  gateTouchCore.classList.add("is-scanning");
  gateActionText.textContent = "[ ĐANG QUÉT SINH TRẮC... ]";
  coreProgressBar.style.width = "100%";

  setTimeout(() => {
    state.pb = Number((state.pb - 0.01).toFixed(2));
    localStorage.setItem("bao_ung_pb", String(state.pb));
    updatePbUI();
    if (state.username) saveDebtorState(state.username, { meritBalance: state.pb }).catch(() => {});

    pushReceipt("【Biên lai 00】: -0.01 PB phí chạm màn hình hologram.");
    gateTouchCore.classList.remove("is-scanning");
    coreProgressBar.style.width = "0%";
    gateActionText.textContent = "[ CHẠM ĐỂ TRUY CẬP ]";
    state.isBreaching = false;
    state.gateOpened = true;

    gateSection.classList.add("hidden");
    document.querySelector(".wing-left").classList.add("hidden");
    document.querySelector(".wing-right").classList.add("hidden");
    unlockedConsole.classList.remove("hidden");
  }, 520);
});

document.getElementById("btn-close-console").addEventListener("click", () => {
  if (state.sfx) radio.playClickChime();
  state.gateOpened = false;
  unlockedConsole.classList.add("hidden");
  gateSection.classList.remove("hidden");
  document.querySelector(".wing-left").classList.remove("hidden");
  document.querySelector(".wing-right").classList.remove("hidden");
});

document.getElementById("btn-enter-hub").addEventListener("click", () => {
  if (state.sfx) radio.playClickChime();
  alert(`Gate đã xác thực [${state.selectedSector}]! Dữ liệu tài khoản đã sẵn sàng nối sang trang chơi chính.`);
});

// 6. MODALS & SETTING
const openModal = (id) => document.getElementById(id).classList.remove("hidden");
const closeModal = (id) => document.getElementById(id).classList.add("hidden");

document.querySelectorAll("[data-close-modal]").forEach((btn) =>
  btn.addEventListener("click", () => closeModal(btn.dataset.closeModal))
);
document.getElementById("btn-settings").addEventListener("click", () => openModal("modal-settings"));
document.getElementById("btn-auth").addEventListener("click", () => openModal("modal-auth"));
document.getElementById("btn-open-auth-from-card").addEventListener("click", () => openModal("modal-auth"));

const optScanlines = document.getElementById("opt-scanlines");
const optParallax = document.getElementById("opt-parallax");
const optSfx = document.getElementById("opt-sfx");
const scanLayer = document.getElementById("scanlines-layer");

optScanlines.checked = state.scanlines;
scanLayer.classList.toggle("hidden", !state.scanlines);
optParallax.checked = state.parallax;
optSfx.checked = state.sfx;

optScanlines.addEventListener("change", (e) => {
  state.scanlines = e.target.checked;
  localStorage.setItem("bao_ung_scanlines", String(state.scanlines));
  scanLayer.classList.toggle("hidden", !state.scanlines);
});
optParallax.addEventListener("change", (e) => {
  state.parallax = e.target.checked;
  localStorage.setItem("bao_ung_parallax", String(state.parallax));
  if (!state.parallax) vrRig.style.transform = "none";
});
optSfx.addEventListener("change", (e) => {
  state.sfx = e.target.checked;
  localStorage.setItem("bao_ung_sfx", String(state.sfx));
});
document.getElementById("btn-apply-radio-url").addEventListener("click", () => {
  radio.setCustomUrl(document.getElementById("custom-radio-url").value);
  radioTrackName.textContent = radio.currentTrackName;
});
document.getElementById("firebase-config-status").textContent = isFirebaseConfigured
  ? "Firebase Realtime Database: Kết nối trực tiếp (Không cần Email)."
  : "Chưa cấu hình databaseURL.";

// 7. TÀI KHOẢN TÊN + MẬT KHẨU ĐƠN GIẢN
const authOut = document.getElementById("auth-logged-out");
const authIn = document.getElementById("auth-logged-in");
const authMsg = document.getElementById("auth-msg");

function applyProfileUI(profile) {
  if (!profile) {
    state.username = null;
    document.getElementById("user-dot").classList.remove("online");
    document.getElementById("user-label").textContent = "ĐĂNG NHẬP";
    authOut.classList.remove("hidden");
    authIn.classList.add("hidden");
    return;
  }

  state.username = profile.username;
  state.debtorCode = profile.debtorCode || "#049";
  if (typeof profile.meritBalance === "number") {
    state.pb = profile.meritBalance;
    localStorage.setItem("bao_ung_pb", String(state.pb));
  }
  if (profile.theme && VALID_THEMES.includes(profile.theme)) {
    applyTheme(profile.theme, false);
  }

  document.getElementById("user-dot").classList.add("online");
  document.getElementById("user-label").textContent = profile.displayName || profile.username;
  document.getElementById("profile-name").textContent = `Con nợ ${state.debtorCode}`;
  document.getElementById("profile-username").textContent = `@${profile.username}`;
  authOut.classList.add("hidden");
  authIn.classList.remove("hidden");
  updatePbUI();
}

async function restoreSession() {
  if (!state.username) {
    applyProfileUI(null);
    return;
  }
  try {
    const profile = await fetchDebtorByUsername(state.username);
    if (profile) {
      applyProfileUI(profile);
      pushReceipt(`【Hệ Thống 00】: Tự động khôi phục dữ liệu @${profile.username}.`);
    } else {
      logoutSimpleAccount();
      applyProfileUI(null);
    }
  } catch {
    applyProfileUI(null);
  }
}

document.getElementById("simple-auth-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const uname = document.getElementById("auth-username").value;
  const pass = document.getElementById("auth-pass").value;
  try {
    authMsg.textContent = "Đang đăng nhập...";
    const profile = await loginSimpleAccount(uname, pass);
    applyProfileUI(profile);
    authMsg.textContent = "";
    pushReceipt(`【Hệ Thống 00】: Đã đăng nhập @${profile.username}.`);
  } catch (err) {
    authMsg.textContent = err.message;
  }
});

document.getElementById("btn-register-simple").addEventListener("click", async () => {
  const uname = document.getElementById("auth-username").value;
  const pass = document.getElementById("auth-pass").value;
  try {
    authMsg.textContent = "Đang tạo tài khoản...";
    const profile = await registerSimpleAccount(uname, pass);
    applyProfileUI(profile);
    authMsg.textContent = "";
    pushReceipt(`【Hệ Thống 00】: Tạo mới hồ sơ @${profile.username} (${profile.debtorCode}).`);
  } catch (err) {
    authMsg.textContent = err.message;
  }
});

document.getElementById("btn-sync-now").addEventListener("click", async () => {
  if (!state.username) return;
  await saveDebtorState(state.username, { theme: state.theme, meritBalance: state.pb });
  document.getElementById("auth-sync-msg").textContent = "Đã lưu toàn bộ dữ liệu lên Firebase.";
});

document.getElementById("btn-logout").addEventListener("click", () => {
  logoutSimpleAccount();
  applyProfileUI(null);
});

applyTheme(state.theme, false);
updatePbUI();
restoreSession();