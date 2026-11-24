// js/firebase.js — Tài khoản, Khóa hợp đồng 1 lần, Avatar, BXH & Bình luận Báo Ứng Net Realtime DB

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  set,
  push,
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
const FORUM_ROOT = "hethongbaoung_forum";
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
  if (username.length < 3) throw new Error("Tên tài khoản tối thiểu 3 ký tự (không dấu).");
  if (password.length < 4) throw new Error("Mật khẩu tối thiểu 4 ký tự.");

  const userRef = ref(db, `${DB_ROOT}/${username}`);
  const snap = await get(userRef);
  if (snap.exists()) throw new Error("Tài khoản đã tồn tại. Hãy bấm Đăng nhập hoặc chọn tên khác.");

  const passHash = await hashPassword(password);
  const profile = {
    username,
    displayName: rawUsername.trim(),
    passHash,
    avatarUrl: "",
    debtorCode: "CHƯA CẤP",
    meritBalance: null,
    contractLocked: false,
    lastProfile: null,
    theme: localStorage.getItem("bao_ung_theme") || "orbital-cyan",
    createdAt: serverTimestamp()
  };

  await set(userRef, profile);
  localStorage.setItem(SESSION_KEY, username);
  return profile;
}

export async function loginSimpleAccount(rawUsername, password) {
  const username = sanitizeUsername(rawUsername);
  if (!username || !password) throw new Error("Vui lòng nhập đủ tài khoản và mật khẩu.");

  const userRef = ref(db, `${DB_ROOT}/${username}`);
  const snap = await get(userRef);
  if (!snap.exists()) throw new Error("Không tìm thấy tài khoản này.");

  const data = snap.val();
  const passHash = await hashPassword(password);
  if (data.passHash !== passHash) throw new Error("Sai mật khẩu.");

  localStorage.setItem(SESSION_KEY, username);
  return data;
}

export async function fetchDebtorByUsername(username) {
  if (!username) return null;
  const snap = await get(ref(db, `${DB_ROOT}/${username}`));
  return snap.exists() ? snap.val() : null;
}

export async function saveDebtorState(username, partialData) {
  if (!username) return;
  await update(ref(db, `${DB_ROOT}/${username}`), {
    ...partialData,
    updatedAt: serverTimestamp()
  });
}

export async function signOfficialContract(username, payload) {
  if (!username) throw new Error("Bạn cần đăng nhập/tạo tài khoản trước khi ký chính thức.");
  const userRef = ref(db, `${DB_ROOT}/${username}`);
  const snap = await get(userRef);
  if (!snap.exists()) throw new Error("Không tìm thấy tài khoản trên hệ thống.");

  const current = snap.val();
  if (current.contractLocked) {
    throw new Error("Tài khoản này đã ký Hợp đồng chính thức! Muốn sửa bắt buộc tạo tài khoản mới.");
  }

  const sealed = {
    contractLocked: true,
    debtorCode: payload.debtorCode,
    meritBalance: payload.meritBalance,
    lastProfile: payload.lastProfile,
    signedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  await update(ref(db, `${DB_ROOT}/${username}`), sealed);
  return { ...current, ...sealed };
}

export async function fetchLeaderboardUsers() {
  const snap = await get(ref(db, DB_ROOT));
  if (!snap.exists()) return [];
  const raw = snap.val();
  return Object.values(raw)
    .filter((u) => u && u.contractLocked === true && typeof u.meritBalance === "number")
    .map((u) => ({
      username: u.username,
      displayName: u.lastProfile?.name || u.displayName || u.username,
      debtorCode: u.debtorCode || "#000",
      avatarUrl: u.avatarUrl || "",
      meritBalance: u.meritBalance,
      sector: u.lastProfile?.sector || "Thập Điện"
    }));
}

// BÁO ỨNG NET: Đọc & Đăng bình luận (Ẩn danh hoặc Tài khoản login)
export async function fetchForumComments(limit = 40) {
  const snap = await get(ref(db, FORUM_ROOT));
  if (!snap.exists()) return [];
  const raw = snap.val();
  return Object.entries(raw)
    .map(([id, val]) => ({ id, ...val }))
    .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
    .slice(0, limit);
}

export async function postForumComment(payload) {
  const newRef = push(ref(db, FORUM_ROOT));
  const entry = {
    authorLabel: payload.authorLabel,
    authorSub: payload.authorSub || "",
    avatarUrl: payload.avatarUrl || "",
    isAnonymous: Boolean(payload.isAnonymous),
    sector: payload.sector || "Sảnh Chờ 00",
    body: String(payload.body || "").trim().slice(0, 500),
    timestamp: Date.now(),
    createdAt: serverTimestamp()
  };
  await set(newRef, entry);
  return { id: newRef.key, ...entry };
}

export function logoutSimpleAccount() {
  localStorage.removeItem(SESSION_KEY);
}