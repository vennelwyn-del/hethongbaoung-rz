// js/main.js — Điều khiển VR 3D Rig, Chạm màn hình ảo, Oscilloscope, 2 Template Màu & Firebase

import { initVRCanvas } from "./canvas-bg.js";
import { SystemRadio } from "./radio.js";
import {
  isFirebaseConfigured,
  subscribeAuth,
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  logoutUser,
  loadDebtorProfile,
  saveDebtorState
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
  user: null,
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

// 1. CHUYỂN ĐỔI 2 TEMPLATE MÀU
function applyTheme(themeName, syncCloud = true) {
  const safeTheme = VALID_THEMES.includes(themeName) ? themeName : "cyber-violet";
  state.theme = safeTheme;
  htmlEl.setAttribute("data-theme", safeTheme);
  localStorage.setItem("bao_ung_theme", safeTheme);

  document.querySelectorAll(".theme-dot").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.setTheme === safeTheme);
  });

  if (syncCloud && state.user) {
    saveDebtorState(state.user.uid, { theme: safeTheme }).catch(() => {});
  }
}

document.querySelectorAll("[data-set-theme]").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (state.sfx) radio.playClickChime();
    applyTheme(btn.dataset.setTheme);
  });
});

// 2. TƯƠNG TÁC CHẠM MÀN HÌNH VR & GÓC NHÌN 3D
window.addEventListener("pointermove", (e) => {
  if (touchCursor) {
    touchCursor.style.left = `${e.clientX}px`;
    touchCursor.style.top = `${e.clientY}px`;
    cursorCoords.textContent = `X:${String(Math.round(e.clientX)).padStart(3, "0")} Y:${String(Math.round(e.clientY)).padStart(3, "0")}`;
  }
  if (!state.parallax || window.innerWidth <= 1140) return;
  const nx = (e.clientX / window.innerWidth - 0.5) * 2;
  const ny = (e.clientY / window.innerHeight - 0.5) * 2;
  vrRig.style.transform = `rotateY(${nx * 5.5}deg) rotateX(${-ny * 4}deg)`;
});

window.addEventListener("pointerdown", (e) => {
  vrBg.spawnTouchRipple(e.clientX, e.clientY);
});

// 3. OSCILLOSCOPE SÓNG AI & RADIO SCOPE
const waveCanvas = document.getElementById("telemetry-wave");
const waveCtx = waveCanvas ? waveCanvas.getContext("2d") : null;
const rScope = document.getElementById("radio-scope");
const rCtx = rScope ? rScope.getContext("2d") : null;
let wavePhase = 0;

function drawScopes() {
  const styles = getComputedStyle(htmlEl);
  const p = styles.getPropertyValue("--rgb-primary").trim() || "59, 184, 248";
  const s = styles.getPropertyValue("--rgb-secondary").trim() || "247, 135, 248";
  wavePhase += 0.09;

  if (waveCtx) {
    waveCtx.clearRect(0, 0, waveCanvas.width, waveCanvas.height);
    waveCtx.strokeStyle = `rgba(${p}, 0.9)`;
    waveCtx.lineWidth = 1.6;
    waveCtx.beginPath();
    for (let x = 0; x < waveCanvas.width; x++) {
      const y = 29 + Math.sin(x * 0.05 + wavePhase) * 12 + Math.cos(x * 0.13 - wavePhase * 1.4) * 7;
      x === 0 ? waveCtx.moveTo(x, y) : waveCtx.lineTo(x, y);
    }
    waveCtx.stroke();
  }

  if (rCtx) {
    rCtx.clearRect(0, 0, rScope.width, rScope.height);
    rCtx.fillStyle = `rgba(${radio.isPlaying ? s : p}, 0.85)`;
    for (let i = 0; i < 9; i++) {
      const barH = radio.isPlaying
        ? 4 + Math.abs(Math.sin(wavePhase * 1.6 + i * 0.7)) * 12
        : 3;
      rCtx.fillRect(i * 6, 16 - barH, 3.5, barH);
    }
  }
  requestAnimationFrame(drawScopes);
}
drawScopes();

setInterval(() => {
  const now = new Date();
  document.getElementById("clock-utc").textContent = now.toTimeString().slice(0, 8);
  const hexEl = document.getElementById("hex-matrix");
  if (hexEl) {
    const bytes = Array.from({ length: 7 }, () =>
      Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, "0")
    );
    hexEl.textContent = `0x${bytes.join(" ")}`;
  }
}, 1000);

// 4. RADIO CONTROLS
radioTrackName.textContent = radio.currentTrackName;
radioToggle.addEventListener("click", () => {
  const playing = radio.toggle();
  radioToggle.querySelector(".radio-icon").textContent = playing ? "❚❚" : "▶";
});
radioNext.addEventListener("click", () => {
  radioTrackName.textContent = radio.nextTrack();
});
radioVol.addEventListener("input", (e) => radio.setVolume(e.target.value));

// 5. CHỌN ĐIỆN & TƯƠNG TÁC NÚT TRÊN MÀN HÌNH ẢO
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
    pushReceipt(`> Đã khóa tọa độ cổng: [${state.selectedSector}]`);
  });
});

document.querySelectorAll(".holo-switch").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (state.sfx) radio.playClickChime();
    const cmd = btn.dataset.cmd;
    if (cmd === "PING_RADAR") {
      pushReceipt(`【RADAR】: Phát hiện 4 luồng hào quang lậu tại ${state.selectedSector}.`);
    } else if (cmd === "AUDIT_DEBT") {
      pushReceipt(`【KIỂM TOÁN 00】: Số dư nợ hiện tại ${state.pb.toFixed(2)} PB (Lãi kỳ sau +10%).`);
    }
  });
});

// 6. CHẠM LÕI GATE ĐỂ QUÉT LASER & MỞ CỔNG
portalGate.addEventListener("click", () => {
  if (state.isBreaching) return;
  state.isBreaching = true;
  if (state.sfx) radio.playClickChime();

  gateTouchCore.classList.add("is-scanning");
  gateActionText.textContent = "[ ĐANG QUÉT SINH TRẮC... ]";
  coreProgressBar.style.width = "100%";
  pushReceipt(`【Hệ Thống 00】: Đang mở khóa kênh truyền tống -> ${state.selectedSector}...`);

  setTimeout(() => {
    state.pb = Number((state.pb - 0.01).toFixed(2));
    localStorage.setItem("bao_ung_pb", String(state.pb));
    updatePbUI();
    if (state.user) saveDebtorState(state.user.uid, { meritBalance: state.pb }).catch(() => {});

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
  }, 560);
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
  alert(`Đã xác thực Gate tại [${state.selectedSector}]! Khi bạn chốt giao diện Gate này, mình sẽ code tiếp trang Hồ Sơ & Nhập Vai nối thẳng vào đây.`);
});

// 7. MODALS & SETTING
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
  ? "Firebase Realtime Database: Đã kết nối sẵn sàng."
  : "Firebase: Chưa cấu hình.";

// 8. FIREBASE AUTH
const authOut = document.getElementById("auth-logged-out");
const authIn = document.getElementById("auth-logged-in");
const authMsg = document.getElementById("auth-msg");

subscribeAuth(async (user) => {
  state.user = user;
  if (user) {
    document.getElementById("user-dot").classList.add("online");
    document.getElementById("user-label").textContent = user.displayName || user.email.split("@")[0];
    authOut.classList.add("hidden");
    authIn.classList.remove("hidden");
    document.getElementById("profile-email").textContent = user.email || "";

    const avatar = document.getElementById("profile-avatar");
    if (user.photoURL) {
      avatar.src = user.photoURL;
      avatar.classList.remove("hidden");
    }

    const data = await loadDebtorProfile(user.uid);
    if (data) {
      state.debtorCode = data.debtorCode || "#049";
      state.pb = typeof data.meritBalance === "number" ? data.meritBalance : state.pb;
      document.getElementById("profile-name").textContent = `Con nợ ${state.debtorCode}`;
      if (data.theme && VALID_THEMES.includes(data.theme)) applyTheme(data.theme, false);
      updatePbUI();
    }
    pushReceipt(`【Hệ Thống 00】: Đồng bộ Firebase thành công (${state.debtorCode}).`);
  } else {
    document.getElementById("user-dot").classList.remove("online");
    document.getElementById("user-label").textContent = "ĐĂNG NHẬP";
    authOut.classList.remove("hidden");
    authIn.classList.add("hidden");
  }
});

document.getElementById("btn-google-login").addEventListener("click", async () => {
  try { authMsg.textContent = "Đang kết nối Google..."; await loginWithGoogle(); authMsg.textContent = ""; }
  catch (err) { authMsg.textContent = err.message; }
});
document.getElementById("email-auth-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    authMsg.textContent = "Đang xác thực...";
    await loginWithEmail(document.getElementById("auth-email").value.trim(), document.getElementById("auth-pass").value);
    authMsg.textContent = "";
  } catch (err) { authMsg.textContent = err.message; }
});
document.getElementById("btn-register-email").addEventListener("click", async () => {
  try {
    authMsg.textContent = "Đang tạo hồ sơ...";
    await registerWithEmail(document.getElementById("auth-email").value.trim(), document.getElementById("auth-pass").value);
    authMsg.textContent = "";
  } catch (err) { authMsg.textContent = err.message; }
});
document.getElementById("btn-sync-now").addEventListener("click", async () => {
  if (!state.user) return;
  await saveDebtorState(state.user.uid, { theme: state.theme, meritBalance: state.pb });
  document.getElementById("auth-sync-msg").textContent = "Đã đồng bộ thành công lên Firebase.";
});
document.getElementById("btn-logout").addEventListener("click", () => logoutUser());

applyTheme(state.theme, false);
updatePbUI();