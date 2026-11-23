// js/main.js — Điều khiển Gate, Theme, Setting, Radio & Đồng bộ Firebase

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

const radio = new SystemRadio();

const state = {
  theme: localStorage.getItem("bao_ung_theme") || "obsidian",
  sfx: localStorage.getItem("bao_ung_sfx") !== "false",
  scanlines: localStorage.getItem("bao_ung_scanlines") !== "false",
  pb: Number(localStorage.getItem("bao_ung_pb") || -1482.75),
  user: null,
  debtorCode: "#049",
  gateOpened: false
};

// DOM refs
const htmlEl = document.documentElement;
const radioWrap = document.getElementById("sys-radio");
const radioToggle = document.getElementById("radio-toggle");
const radioNext = document.getElementById("radio-next");
const radioVol = document.getElementById("radio-vol");
const radioTrackName = document.getElementById("radio-track-name");

const portalGate = document.getElementById("portal-gate");
const gateSection = document.getElementById("gate-section");
const unlockedConsole = document.getElementById("unlocked-console");
const receiptFeed = document.getElementById("receipt-feed");
const hudPbPreview = document.getElementById("hud-pb-preview");

const btnSettings = document.getElementById("btn-settings");
const btnAuth = document.getElementById("btn-auth");
const userDot = document.getElementById("user-dot");
const userLabel = document.getElementById("user-label");

// 1. ÁP DỤNG THEME
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

// 2. RADIO CONTROLS
radioTrackName.textContent = radio.currentTrackName;

radioToggle.addEventListener("click", () => {
  const playing = radio.toggle();
  radioWrap.classList.toggle("is-playing", playing);
  radioToggle.querySelector(".radio-icon").textContent = playing ? "❚❚" : "▶";
});

radioNext.addEventListener("click", () => {
  radioTrackName.textContent = radio.nextTrack();
});

radioVol.addEventListener("input", (e) => {
  radio.setVolume(e.target.value);
});

// 3. GATE INTERACTION (ẤN VÀO CỔNG)
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
  if (state.sfx) radio.playClickChime();
  state.pb = Number((state.pb - 0.01).toFixed(2));
  localStorage.setItem("bao_ung_pb", String(state.pb));
  updatePbUI();

  if (state.user) {
    saveDebtorState(state.user.uid, { meritBalance: state.pb }).catch(() => {});
  }

  pushReceipt(`【Biên lai 00】: Khấu trừ -0.01 PB phí chạm vào Cổng Truyền Tống.`);
  pushReceipt(`> Đang mở khóa Sảnh Chờ Con Nợ ${state.debtorCode}...`);

  state.gateOpened = true;
  gateSection.classList.add("hidden");
  unlockedConsole.classList.remove("hidden");
});

document.getElementById("btn-close-console").addEventListener("click", () => {
  if (state.sfx) radio.playClickChime();
  state.gateOpened = false;
  unlockedConsole.classList.add("hidden");
  gateSection.classList.remove("hidden");
});

document.getElementById("btn-home").addEventListener("click", (e) => {
  // Nếu đang ở trang chủ và đã mở console thì đưa về Gate ban đầu
  if (state.gateOpened) {
    e.preventDefault();
    unlockedConsole.classList.add("hidden");
    gateSection.classList.remove("hidden");
    state.gateOpened = false;
  }
});

document.getElementById("btn-enter-hub").addEventListener("click", () => {
  if (state.sfx) radio.playClickChime();
  pushReceipt("【Thông báo】: Module Hồ Sơ Con Nợ sẵn sàng kết nối tới app.html / AI Engine.");
  alert("Gate đã xác thực xong! Bước tiếp theo bạn có thể gắn link tới trang tạo Hồ sơ / Giao diện chơi chính.");
});

// 4. MODALS (SETTING & AUTH)
function openModal(id) {
  document.getElementById(id).classList.remove("hidden");
}
function closeModal(id) {
  document.getElementById(id).classList.add("hidden");
}

document.querySelectorAll("[data-close-modal]").forEach((btn) => {
  btn.addEventListener("click", () => closeModal(btn.dataset.closeModal));
});

btnSettings.addEventListener("click", () => openModal("modal-settings"));
btnAuth.addEventListener("click", () => openModal("modal-auth"));
document.getElementById("btn-open-auth-from-card").addEventListener("click", () => openModal("modal-auth"));

// Setting toggles
const optScanlines = document.getElementById("opt-scanlines");
const optSfx = document.getElementById("opt-sfx");
const scanLayer = document.getElementById("scanlines-layer");

optScanlines.checked = state.scanlines;
scanLayer.classList.toggle("hidden", !state.scanlines);
optSfx.checked = state.sfx;

optScanlines.addEventListener("change", (e) => {
  state.scanlines = e.target.checked;
  localStorage.setItem("bao_ung_scanlines", String(state.scanlines));
  scanLayer.classList.toggle("hidden", !state.scanlines);
});

optSfx.addEventListener("change", (e) => {
  state.sfx = e.target.checked;
  localStorage.setItem("bao_ung_sfx", String(state.sfx));
});

document.getElementById("btn-apply-radio-url").addEventListener("click", () => {
  const url = document.getElementById("custom-radio-url").value;
  radio.setCustomUrl(url);
  radioTrackName.textContent = radio.currentTrackName;
});

document.getElementById("firebase-config-status").textContent = isFirebaseConfigured
  ? "Trạng thái Firebase: Đã cấu hình sẵn sàng."
  : "Trạng thái Firebase: Chưa điền apiKey trong js/firebase.js (Đang chạy chế độ lưu LocalStorage).";

// 5. FIREBASE AUTH FLOW
const authOut = document.getElementById("auth-logged-out");
const authIn = document.getElementById("auth-logged-in");
const authMsg = document.getElementById("auth-msg");

subscribeAuth(async (user) => {
  state.user = user;
  if (user) {
    userDot.classList.add("online");
    userLabel.textContent = user.displayName || user.email.split("@")[0];
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
    pushReceipt(`【Hệ Thống 00】: Đã đồng bộ hồ sơ Firebase (${state.debtorCode}).`);
  } else {
    userDot.classList.remove("online");
    userLabel.textContent = "ĐĂNG NHẬP";
    authOut.classList.remove("hidden");
    authIn.classList.add("hidden");
  }
});

document.getElementById("btn-google-login").addEventListener("click", async () => {
  try {
    authMsg.textContent = "Đang kết nối Google...";
    await loginWithGoogle();
    authMsg.textContent = "";
  } catch (err) {
    authMsg.textContent = err.message;
  }
});

document.getElementById("email-auth-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("auth-email").value.trim();
  const pass = document.getElementById("auth-pass").value;
  try {
    authMsg.textContent = "Đang xác thực...";
    await loginWithEmail(email, pass);
    authMsg.textContent = "";
  } catch (err) {
    authMsg.textContent = err.message;
  }
});

document.getElementById("btn-register-email").addEventListener("click", async () => {
  const email = document.getElementById("auth-email").value.trim();
  const pass = document.getElementById("auth-pass").value;
  try {
    authMsg.textContent = "Đang khởi tạo hợp đồng Con nợ...";
    await registerWithEmail(email, pass);
    authMsg.textContent = "";
  } catch (err) {
    authMsg.textContent = err.message;
  }
});

document.getElementById("btn-sync-now").addEventListener("click", async () => {
  if (!state.user) return;
  await saveDebtorState(state.user.uid, {
    theme: state.theme,
    meritBalance: state.pb
  });
  document.getElementById("auth-sync-msg").textContent = "Đã đồng bộ thành công lên Firestore.";
});

document.getElementById("btn-logout").addEventListener("click", () => logoutUser());

// Khởi chạy ban đầu
applyTheme(state.theme, false);
updatePbUI();