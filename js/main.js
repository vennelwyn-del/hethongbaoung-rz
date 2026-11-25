// js/main.js — Logic Cổng Quỹ Đạo VR (index.html -> chuyển sang hub.html)

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

const VALID_THEMES = ["orbital-cyan", "cyber-violet", "acid", "crimson-karma"];
let savedTheme = localStorage.getItem("bao_ung_theme") || "orbital-cyan";
if (!VALID_THEMES.includes(savedTheme)) savedTheme = "orbital-cyan";

const state = {
  theme: savedTheme,
  sfx: SITE_CONFIG.effects.sfx,
  scanlines: SITE_CONFIG.effects.scanlines,
  username: getSavedSessionUsername(),
  isBreaching: false
};

const htmlEl = document.documentElement;
const bgImageLayer = document.getElementById("bg-image-layer");
const touchCursor = document.getElementById("touch-cursor");
const cursorCoords = document.getElementById("cursor-coords");
const gateStage = document.getElementById("screen-gate");
const portalGate = document.getElementById("portal-gate");
const gateTouchCore = document.querySelector(".gate-touch-core");
const coreProgressBar = document.querySelector("#core-progress span");
const gateActionText = document.getElementById("gate-action-text");

document.getElementById("scanlines-layer")?.classList.toggle("hidden", !state.scanlines);

// 1. TẠO TEXTURE ĐƯỜNG HẦM NHỊ PHÂN PHỦ KÍNH MỜ CHO CÁC BLOCK + THEME + ẢNH NỀN
function updateMatrixBlockTexture() {
  const s = getComputedStyle(htmlEl);
  const p = s.getPropertyValue("--c-primary").trim() || "#00E5FF";
  const sec = s.getPropertyValue("--c-secondary").trim() || "#5EA8FF";
  const c = document.createElement("canvas");
  c.width = 480;
  c.height = 320;
  const ctx = c.getContext("2d");

  ctx.fillStyle = "#020612";
  ctx.fillRect(0, 0, 480, 320);

  const flare = ctx.createRadialGradient(240, 172, 4, 240, 172, 220);
  flare.addColorStop(0, "#ffffff");
  flare.addColorStop(0.14, p);
  flare.addColorStop(0.45, "rgba(0,110,255,0.18)");
  flare.addColorStop(1, "transparent");
  ctx.fillStyle = flare;
  ctx.fillRect(0, 0, 480, 320);

  ctx.strokeStyle = p;
  ctx.globalAlpha = 0.22;
  for (let i = -6; i <= 6; i++) {
    ctx.beginPath();
    ctx.moveTo(240 + i * 52, 320);
    ctx.lineTo(240, 172);
    ctx.stroke();
  }

  ctx.font = "bold 15px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  for (let x = 22; x < 470; x += 34) {
    for (let y = 18; y < 310; y += 22) {
      if (Math.hypot(x - 240, y - 172) < 42) continue;
      ctx.fillStyle = (x + y) % 3 === 0 ? sec : p;
      ctx.globalAlpha = 0.16 + Math.random() * 0.34;
      ctx.fillText(Math.random() > 0.5 ? "1" : "0", x, y);
    }
  }

  htmlEl.style.setProperty("--matrix-panel-bg", `url("${c.toDataURL("image/png")}")`);
}

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
  const safeTheme = VALID_THEMES.includes(themeName) ? themeName : "orbital-cyan";
  state.theme = safeTheme;
  htmlEl.setAttribute("data-theme", safeTheme);
  localStorage.setItem("bao_ung_theme", safeTheme);
  updateBackgroundImage(safeTheme);
  requestAnimationFrame(updateMatrixBlockTexture);

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

// 2. CON TRỎ TỌA ĐỘ, PARALLAX 3D & SÓNG CHẠM
window.addEventListener("pointermove", (e) => {
  if (touchCursor && cursorCoords) {
    touchCursor.style.left = `${e.clientX}px`;
    touchCursor.style.top = `${e.clientY}px`;
    cursorCoords.textContent = `X:${String(Math.round(e.clientX)).padStart(3, "0")} Y:${String(Math.round(e.clientY)).padStart(3, "0")}`;
  }
  if (SITE_CONFIG.effects.parallax3D && gateStage && window.innerWidth > 980) {
    const rx = (e.clientY / window.innerHeight - 0.5) * -5.5;
    const ry = (e.clientX / window.innerWidth - 0.5) * 7.5;
    gateStage.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
  }
});

window.addEventListener("pointerdown", (e) => {
  vrBg.spawnTouchRipple(e.clientX, e.clientY);
});

// 3. RADIO + OSCILLOSCOPE
const radioToggle = document.getElementById("radio-toggle");
const radioTrackName = document.getElementById("radio-track-name");
const rScope = document.getElementById("radio-scope");
const rCtx = rScope ? rScope.getContext("2d") : null;
let wavePhase = 0;

function drawRadioScope() {
  if (rCtx) {
    const styles = getComputedStyle(htmlEl);
    const p = styles.getPropertyValue("--rgb-primary").trim() || "0, 229, 255";
    const s = styles.getPropertyValue("--rgb-secondary").trim() || "94, 168, 255";
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

if (radioTrackName) radioTrackName.textContent = radio.currentTrackName;
radioToggle?.addEventListener("click", () => {
  const playing = radio.toggle();
  const icon = radioToggle.querySelector(".radio-icon");
  if (icon) icon.textContent = playing ? "❚❚" : "▶";
});
document.getElementById("radio-next")?.addEventListener("click", () => {
  if (radioTrackName) radioTrackName.textContent = radio.nextTrack();
});
document.getElementById("radio-vol")?.addEventListener("input", (e) => radio.setVolume(e.target.value));

// 4. NHẤN CỔNG -> CHUYỂN SANG HUB.HTML
const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' fill='%23041634'/><text x='32' y='40' font-size='28' text-anchor='middle' fill='%2300E5FF'>⚖️</text></svg>";

portalGate?.addEventListener("click", () => {
  if (state.isBreaching) return;
  state.isBreaching = true;
  if (state.sfx) radio.playClickChime();

  gateTouchCore?.classList.add("is-scanning");
  if (gateActionText) gateActionText.textContent = "[ ĐANG TRUYỀN TỐNG... ]";
  if (coreProgressBar) coreProgressBar.style.width = "100%";

  setTimeout(() => {
    window.location.href = "./hub.html";
  }, 500);
});

// 5. MODAL TÀI KHOẢN FIREBASE
const openModal = (id) => document.getElementById(id)?.classList.remove("hidden");
const closeModal = (id) => document.getElementById(id)?.classList.add("hidden");
document.querySelectorAll("[data-close-modal]").forEach((btn) =>
  btn.addEventListener("click", () => closeModal(btn.dataset.closeModal))
);
document.getElementById("btn-auth")?.addEventListener("click", () => openModal("modal-auth"));
document.getElementById("modal-auth")?.addEventListener("click", (e) => {
  if (e.target.id === "modal-auth") closeModal("modal-auth");
});

const authOut = document.getElementById("auth-logged-out");
const authIn = document.getElementById("auth-logged-in");
const authMsg = document.getElementById("auth-msg");

function applyProfileUI(profile) {
  const topAvatar = document.getElementById("topbar-avatar");
  if (!profile) {
    state.username = null;
    document.getElementById("user-dot")?.classList.remove("online");
    topAvatar?.classList.add("hidden");
    const uLbl = document.getElementById("user-label");
    if (uLbl) uLbl.textContent = "ĐĂNG NHẬP";
    authOut?.classList.remove("hidden");
    authIn?.classList.add("hidden");
    return;
  }

  state.username = profile.username;
  if (profile.theme && VALID_THEMES.includes(profile.theme)) applyTheme(profile.theme, false);

  const avt = profile.avatarUrl || DEFAULT_AVATAR;
  if (topAvatar) {
    topAvatar.src = avt;
    topAvatar.classList.remove("hidden");
  }
  const profAvt = document.getElementById("profile-avatar");
  if (profAvt) profAvt.src = avt;
  const avtInput = document.getElementById("avatar-url-input");
  if (avtInput) avtInput.value = profile.avatarUrl?.startsWith("http") ? profile.avatarUrl : "";

  document.getElementById("user-dot")?.classList.add("online");
  document.getElementById("user-label").textContent = profile.displayName || profile.username;
  document.getElementById("profile-name").textContent = profile.contractLocked
    ? `Con nợ ${profile.debtorCode} (Đã khóa hồ sơ)`
    : "Chưa ký hợp đồng chính thức";
  document.getElementById("profile-username").textContent = `@${profile.username}`;
  document.getElementById("profile-pb").textContent =
    profile.contractLocked && typeof profile.meritBalance === "number"
      ? `${profile.meritBalance.toFixed(2)} PB`
      : "Chưa ký hợp đồng (-- PB)";

  authOut?.classList.add("hidden");
  authIn?.classList.remove("hidden");
}

function compressImageToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Không đọc được ảnh."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("File không phải ảnh hợp lệ."));
      img.onload = () => {
        const c = document.createElement("canvas");
        c.width = 128;
        c.height = 128;
        const ctx = c.getContext("2d");
        const minSide = Math.min(img.width, img.height);
        ctx.drawImage(img, (img.width - minSide) / 2, (img.height - minSide) / 2, minSide, minSide, 0, 0, 128, 128);
        resolve(c.toDataURL("image/webp", 0.8));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

document.getElementById("btn-save-avatar-url")?.addEventListener("click", async () => {
  if (!state.username) return;
  const url = document.getElementById("avatar-url-input").value.trim();
  await saveDebtorState(state.username, { avatarUrl: url });
  applyProfileUI(await fetchDebtorByUsername(state.username));
  document.getElementById("auth-sync-msg").textContent = "Đã cập nhật Avatar lên Firebase.";
});

document.getElementById("avatar-file-input")?.addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file || !state.username) return;
  try {
    const dataUrl = await compressImageToDataUrl(file);
    await saveDebtorState(state.username, { avatarUrl: dataUrl });
    applyProfileUI(await fetchDebtorByUsername(state.username));
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

document.getElementById("simple-auth-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    authMsg.textContent = "Đang đăng nhập...";
    applyProfileUI(await loginSimpleAccount(document.getElementById("auth-username").value, document.getElementById("auth-pass").value));
    authMsg.textContent = "";
    closeModal("modal-auth");
  } catch (err) { authMsg.textContent = err.message; }
});

document.getElementById("btn-register-simple")?.addEventListener("click", async () => {
  try {
    authMsg.textContent = "Đang tạo tài khoản...";
    applyProfileUI(await registerSimpleAccount(document.getElementById("auth-username").value, document.getElementById("auth-pass").value));
    authMsg.textContent = "";
    closeModal("modal-auth");
  } catch (err) { authMsg.textContent = err.message; }
});

document.getElementById("btn-logout")?.addEventListener("click", () => {
  logoutSimpleAccount();
  applyProfileUI(null);
});

applyTheme(state.theme, false);
restoreSession();