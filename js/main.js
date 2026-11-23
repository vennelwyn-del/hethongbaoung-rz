// js/main.js — Logic sạch dành riêng cho Giao diện 1 (Gate -> chuyển thẳng sang hub.html)

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
  pb: Number(localStorage.getItem("bao_ung_pb") || -1482.75),
  debtorCode: localStorage.getItem("bao_ung_code") || "#049",
  username: getSavedSessionUsername(),
  isBreaching: false
};

const htmlEl = document.documentElement;
const bgImageLayer = document.getElementById("bg-image-layer");
const touchCursor = document.getElementById("touch-cursor");
const cursorCoords = document.getElementById("cursor-coords");
const portalGate = document.getElementById("portal-gate");
const gateTouchCore = document.querySelector(".gate-touch-core");
const coreProgressBar = document.querySelector("#core-progress span");
const gateActionText = document.getElementById("gate-action-text");

document.getElementById("scanlines-layer")?.classList.toggle("hidden", !state.scanlines);

// 1. THEME + ẢNH NỀN TỪ js/config.js
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

  document.querySelectorAll(".theme-dot").forEach((btn) =>
    btn.classList.toggle("active", btn.dataset.setTheme === safeTheme)
  );

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

// 2. CON TRỎ & SÓNG CHẠM 3D
window.addEventListener("pointermove", (e) => {
  if (touchCursor && cursorCoords) {
    touchCursor.style.left = `${e.clientX}px`;
    touchCursor.style.top = `${e.clientY}px`;
    cursorCoords.textContent = `X:${String(Math.round(e.clientX)).padStart(3, "0")} Y:${String(Math.round(e.clientY)).padStart(3, "0")}`;
  }
});

window.addEventListener("pointerdown", (e) => {
  vrBg.spawnTouchRipple(e.clientX, e.clientY);
});

// 3. RADIO + OSCILLOSCOPE MINI
const radioToggle = document.getElementById("radio-toggle");
const radioTrackName = document.getElementById("radio-track-name");
const rScope = document.getElementById("radio-scope");
const rCtx = rScope ? rScope.getContext("2d") : null;
let wavePhase = 0;

function drawRadioScope() {
  if (rCtx) {
    const styles = getComputedStyle(htmlEl);
    const p = styles.getPropertyValue("--rgb-primary").trim() || "59, 184, 248";
    const s = styles.getPropertyValue("--rgb-secondary").trim() || "247, 135, 248";
    wavePhase += 0.1;
    rCtx.clearRect(0, 0, rScope.width, rScope.height);
    rCtx.fillStyle = `rgba(${radio.isPlaying ? s : p}, 0.85)`;
    for (let i = 0; i < 9; i++) {
      const barH = radio.isPlaying ? 4 + Math.abs(Math.sin(wavePhase * 1.6 + i * 0.7)) * 12 : 3;
      rCtx.fillRect(i * 6, 16 - barH, 3.5, barH);
    }
  }
  requestAnimationFrame(drawRadioScope);
}
drawRadioScope();

radioTrackName.textContent = radio.currentTrackName;
radioToggle.addEventListener("click", () => {
  const playing = radio.toggle();
  radioToggle.querySelector(".radio-icon").textContent = playing ? "❚❚" : "▶";
});
document.getElementById("radio-next").addEventListener("click", () => {
  radioTrackName.textContent = radio.nextTrack();
});
document.getElementById("radio-vol").addEventListener("input", (e) => radio.setVolume(e.target.value));

// 4. NHẤN VÀO GATE -> CHUYỂN THẲNG SANG GIAO DIỆN 2 (hub.html)
// Thay trong js/main.js (giữ nguyên phần trên, thay từ đoạn portalGate trở xuống)

const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' fill='%23221A6C'/><text x='32' y='40' font-size='28' text-anchor='middle' fill='%233BB8F8'>⚖️</text></svg>";

portalGate.addEventListener("click", () => {
  if (state.isBreaching) return;
  state.isBreaching = true;
  if (state.sfx) radio.playClickChime();

  gateTouchCore.classList.add("is-scanning");
  gateActionText.textContent = "[ ĐANG TRUYỀN TỐNG... ]";
  coreProgressBar.style.width = "100%";

  setTimeout(() => {
    window.location.href = "./hub.html";
  }, 520);
});

const openModal = (id) => document.getElementById(id).classList.remove("hidden");
const closeModal = (id) => document.getElementById(id).classList.add("hidden");
document.querySelectorAll("[data-close-modal]").forEach((btn) =>
  btn.addEventListener("click", () => closeModal(btn.dataset.closeModal))
);
document.getElementById("btn-auth").addEventListener("click", () => openModal("modal-auth"));

const authOut = document.getElementById("auth-logged-out");
const authIn = document.getElementById("auth-logged-in");
const authMsg = document.getElementById("auth-msg");

function applyProfileUI(profile) {
  const topAvatar = document.getElementById("topbar-avatar");
  if (!profile) {
    state.username = null;
    document.getElementById("user-dot").classList.remove("online");
    topAvatar.classList.add("hidden");
    document.getElementById("user-label").textContent = "ĐĂNG NHẬP";
    authOut.classList.remove("hidden");
    authIn.classList.add("hidden");
    return;
  }

  state.username = profile.username;
  if (profile.theme && VALID_THEMES.includes(profile.theme)) applyTheme(profile.theme, false);

  const avt = profile.avatarUrl || DEFAULT_AVATAR;
  topAvatar.src = avt;
  topAvatar.classList.remove("hidden");
  document.getElementById("profile-avatar").src = avt;
  document.getElementById("avatar-url-input").value = profile.avatarUrl?.startsWith("http") ? profile.avatarUrl : "";

  document.getElementById("user-dot").classList.add("online");
  document.getElementById("user-label").textContent = profile.displayName || profile.username;
  document.getElementById("profile-name").textContent = profile.contractLocked
    ? `Con nợ ${profile.debtorCode} (Đã khóa hồ sơ)`
    : "Chưa ký hợp đồng chính thức";
  document.getElementById("profile-username").textContent = `@${profile.username}`;
  document.getElementById("profile-pb").textContent =
    profile.contractLocked && typeof profile.meritBalance === "number"
      ? `${profile.meritBalance.toFixed(2)} PB`
      : "Chưa ký hợp đồng (-- PB)";

  authOut.classList.add("hidden");
  authIn.classList.remove("hidden");
}

function compressImageToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Không đọc được ảnh."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("File không phải ảnh hợp lệ."));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext("2d");
        const minSide = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - minSide) / 2, (img.height - minSide) / 2, minSide, minSide, 0, 0, 128, 128);
        resolve(canvas.toDataURL("image/webp", 0.8));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

document.getElementById("btn-save-avatar-url").addEventListener("click", async () => {
  if (!state.username) return;
  const url = document.getElementById("avatar-url-input").value.trim();
  await saveDebtorState(state.username, { avatarUrl: url });
  const updated = await fetchDebtorByUsername(state.username);
  applyProfileUI(updated);
  document.getElementById("auth-sync-msg").textContent = "Đã cập nhật Avatar lên Firebase.";
});

document.getElementById("avatar-file-input").addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file || !state.username) return;
  try {
    const dataUrl = await compressImageToDataUrl(file);
    await saveDebtorState(state.username, { avatarUrl: dataUrl });
    const updated = await fetchDebtorByUsername(state.username);
    applyProfileUI(updated);
    document.getElementById("auth-sync-msg").textContent = "Đã tải Avatar lên Firebase.";
  } catch (err) {
    document.getElementById("auth-sync-msg").textContent = err.message;
  }
});

async function restoreSession() {
  if (!state.username) { applyProfileUI(null); return; }
  try {
    const profile = await fetchDebtorByUsername(state.username);
    if (profile) applyProfileUI(profile);
    else { logoutSimpleAccount(); applyProfileUI(null); }
  } catch { applyProfileUI(null); }
}

document.getElementById("simple-auth-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    authMsg.textContent = "Đang đăng nhập...";
    const p = await loginSimpleAccount(document.getElementById("auth-username").value, document.getElementById("auth-pass").value);
    applyProfileUI(p);
    authMsg.textContent = "";
  } catch (err) { authMsg.textContent = err.message; }
});

document.getElementById("btn-register-simple").addEventListener("click", async () => {
  try {
    authMsg.textContent = "Đang tạo tài khoản...";
    const p = await registerSimpleAccount(document.getElementById("auth-username").value, document.getElementById("auth-pass").value);
    applyProfileUI(p);
    authMsg.textContent = "";
  } catch (err) { authMsg.textContent = err.message; }
});

document.getElementById("btn-logout").addEventListener("click", () => {
  logoutSimpleAccount();
  applyProfileUI(null);
});

applyTheme(state.theme, false);
restoreSession();