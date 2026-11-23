// js/firebase.js — Tài khoản Tên + Mật khẩu đơn giản lưu trực tiếp lên Realtime Database

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  set,
  update,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyB4FWI8zc2ZpclY0bDTiwZg8Krd5wsArHA",
  authDomain: "baoungdoinhau.firebaseapp.com",
  databaseURL: "https://baoungdoinhau-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "baoungdoinhau",
  storageBucket: "baoungdoinhau.firebasestorage.app",
  messagingSenderId: "950637415083",
  appId: "1:950637415083:web:04e6cc9984a27f113f45ee",
  measurementId: "G-H56LCMMX26"
};

const DB_ROOT = "hethongbaoung_debtors";
const SESSION_KEY = "bao_ung_session_user";
export const isFirebaseConfigured = Boolean(firebaseConfig.databaseURL);

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

function sanitizeUsername(raw) {
  return raw.trim().toLowerCase().replace(/[^a-z0-9._-]/g, "");
}

async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function getSavedSessionUsername() {
  return localStorage.getItem(SESSION_KEY) || null;
}

export async function registerSimpleAccount(rawUsername, password) {
  const username = sanitizeUsername(rawUsername);
  if (username.length < 3) {
    throw new Error("Tên tài khoản tối thiểu 3 ký tự (chữ không dấu, số, _ hoặc .).");
  }
  if (password.length < 4) {
    throw new Error("Mật khẩu tối thiểu 4 ký tự.");
  }

  const userRef = ref(db, `${DB_ROOT}/${username}`);
  const snap = await get(userRef);
  if (snap.exists()) {
    throw new Error("Tên tài khoản này đã có người dùng. Vui lòng chọn tên khác hoặc bấm Đăng nhập.");
  }

  const passHash = await hashPassword(password);
  const profile = {
    username,
    displayName: rawUsername.trim(),
    passHash,
    debtorCode: `#${Math.floor(100 + Math.random() * 899)}`,
    meritBalance: Number((-1200 - Math.random() * 1500).toFixed(2)),
    theme: localStorage.getItem("bao_ung_theme") || "cyber-violet",
    createdAt: serverTimestamp()
  };

  await set(userRef, profile);
  localStorage.setItem(SESSION_KEY, username);
  return profile;
}

export async function loginSimpleAccount(rawUsername, password) {
  const username = sanitizeUsername(rawUsername);
  if (!username || !password) {
    throw new Error("Vui lòng nhập đủ tên tài khoản và mật khẩu.");
  }

  const userRef = ref(db, `${DB_ROOT}/${username}`);
  const snap = await get(userRef);
  if (!snap.exists()) {
    throw new Error("Không tìm thấy tài khoản này. Bấm 'Tạo tài khoản mới' nếu chưa có.");
  }

  const data = snap.val();
  const passHash = await hashPassword(password);
  if (data.passHash !== passHash) {
    throw new Error("Sai mật khẩu.");
  }

  localStorage.setItem(SESSION_KEY, username);
  return data;
}

export async function fetchDebtorByUsername(username) {
  if (!username) return null;
  const userRef = ref(db, `${DB_ROOT}/${username}`);
  const snap = await get(userRef);
  return snap.exists() ? snap.val() : null;
}

export async function saveDebtorState(username, partialData) {
  if (!username) return;
  const userRef = ref(db, `${DB_ROOT}/${username}`);
  await update(userRef, {
    ...partialData,
    updatedAt: serverTimestamp()
  });
}

export function logoutSimpleAccount() {
  localStorage.removeItem(SESSION_KEY);
}