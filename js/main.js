// js/main.js — Điều khiển AI 3D Stage, 5 Template Màu, Gate Giải Mã, Radio & Firebase

import { initNeuralCanvas } from "./canvas-bg.js";
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

initNeuralCanvas();
const radio = new SystemRadio();

const state = {
  theme: localStorage.getItem("bao_ung_theme") || "acid",
  sfx: localStorage.getItem("bao_ung_sfx") !== "false",
  scanlines: localStorage.getItem("bao_ung_scanlines") !== "false",
  parallax: localStorage.getItem("bao_ung_parallax") !== "false",
  pb: Number(localStorage.getItem("bao_ung_pb") || -1482.75),
  user: null,
  debtorCode: "#049",
  gateOpened: false,
  isBreaching: false
};

const htmlEl = document.documentElement;
const radioWrap = document.getElementById("sys-radio");
const radioToggle = document.getElementById("radio-toggle");
const radioNext = document.getElementById("radio-next");
const radioVol = document.getElementById("radio-vol");
const radioTrackName = document.getElementById("radio-track-name");

const portalGate = document.getElementById("portal-gate");
const gateSection = document.getElementById("gate-section");
const unlockedConsole = document.getElementById("unlocked-console");
const coreProgressBar = document.querySelector("#core-progress span");
const gateActionText = document.getElementById("gate-action-text");
const receiptFeed = document.getElementById("receipt-feed");
const hudPbPreview = document.getElementById("hud-pb-preview");

// 1. CHUYỂN 5 TEMPLATE MÀU
function applyTheme(themeName, syncCloud = true) {
  state.theme = themeName;
  htmlEl.setAttribute("data-theme", themeName);
  localStorage.setItem("bao_ung_theme", themeName);
  document.querySelectorAll(".theme-dot").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.setTheme === themeName);
  });
  if (syncCloud && state.user) {
    saveDebtorState(state.user.uid, { theme: themeName }).catch(() => {});
  }
}

document.querySelectorAll("[data-set-theme]").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (state.sfx) radio.playClickChime();
    applyTheme(btn.dataset.setTheme);
  });
});

// 2. HIỆU ỨNG PARALLAX 3D CHO CÁC CỬA SỔ AI & ĐỒNG HỒ TELEMETRY
const clusters = document.querySelectorAll(".holo-cluster");
window.addEventListener("mousemove", (e) => {
  if (!state.parallax || window.innerWidth <= 1120) return;
  const nx = (e.clientX / window.innerWidth - 0.5) * 2;
  const ny = (e.clientY / window.innerHeight - 0.5) * 2;
  clusters.forEach((el) => {
    const baseRotY = el.classList.contains("cluster-left") ? 10 : -10;
    el.style.transform = `rotateY(${baseRotY + nx * 6}deg) rotateX(${-ny * 5}deg)`;
  });
});

setInterval(() => {
  const now = new Date();
  document.getElementById("clock-utc").textContent = `SYS.TIME: ${now.toTimeString().slice(0, 8)}`;
  const hexEl = document.getElementById("hex-matrix");
  if (hexEl) {
    const bytes = Array.from({ length: 7 }, () =>
      Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, "0")
    );
    hexEl.textContent = `0x${bytes.join(" ")}`;
  }
}, 1000);

// 3. RADIO
radioTrackName.textContent = radio.currentTrackName;
radioToggle.addEventListener("click", () => {
  const playing = radio.toggle();
  radioWrap.classList.toggle("is-playing", playing);
  radioToggle.querySelector(".radio-icon").textContent = playing ? "❚❚" : "▶";
});
radioNext.addEventListener("click", () => {
  radioTrackName.textContent = radio.nextTrack();
});
radioVol.addEventListener("input", (e) => radio.setVolume(e.target.value));

// 4. GATE GIẢI MÃ & MỞ CỔNG
function pushReceipt(text) {
  const p = document.createElement("p");
  p.textContent = text;
  receiptFeed.prepend(p);
}

function updatePbUI() {
  const formatted = `${state.pb.toFixed(2)} PB`;
  hudPbPreview.textContent = formatted;
  const profilePb = document.getElementById("profile-pb");
  if (profilePb) profilePb.textContent = formatted;
}

portalGate.addEventListener("click", () => {
  if (state.isBreaching) return;
  state.isBreaching = true;
  if (state.sfx) radio.playClickChime();

  gateActionText.textContent = "[ ĐANG GIẢI MÃ... ]";
  coreProgressBar.style.width = "100%";
  pushReceipt("【Hệ Thống 00】: Đang xác thực chữ ký linh hồn qua 10 Điện...");

  setTimeout(() => {
    state.pb = Number((state.pb - 0.01).toFixed(2));
    localStorage.setItem("bao_ung_pb", String(state.pb));
    updatePbUI();
    if (state.user) {
      saveDebtorState(state.user.uid, { meritBalance: state.pb }).catch(() => {});
    }

    pushReceipt("【Biên lai 00】: -0.01 PB (Phí khởi chạy cổng AI-00).");
    state.gateOpened = true;
    state.isBreaching = false;
    coreProgressBar.style.width = "0%";
    gateActionText.textContent = "[ ẤN VÀO CỔNG ]";

    gateSection.classList.add("hidden");
    document.querySelector(".cluster-left").classList.add("hidden");
    document.querySelector(".cluster-right").classList.add("hidden");
    unlockedConsole.classList.remove("hidden");
  }, 520);
});

document.getElementById("btn-close-console").addEventListener("click", () => {
  if (state.sfx) radio.playClickChime();
  state.gateOpened = false;
  unlockedConsole.classList.add("hidden");
  gateSection.classList.remove("hidden");
  document.querySelector(".cluster-left").classList.remove("hidden");
  document.querySelector(".cluster-right").classList.remove("hidden");
});

document.getElementById("btn-enter-hub").addEventListener("click", () => {
  if (state.sfx) radio.playClickChime();
  alert("Gate AI-00 đã mở! Khi sẵn sàng, mình sẽ tạo tiếp trang Hồ Sơ & Giao Diện Chơi Hệ Thống Báo Ứng nối vào nút này.");
});

// 5. MODALS & SETTINGS
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

// 6. FIREBASE AUTH
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
      if (data.theme) applyTheme(data.theme, false);
      updatePbUI();
    }
    pushReceipt(`【Hệ Thống 00】: Đã đồng bộ hồ sơ (${state.debtorCode}).`);
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