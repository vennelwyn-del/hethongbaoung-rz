// js/firebase.js — Kết nối Firebase Auth + Realtime Database cho hethongbaoung

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
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
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.databaseURL);

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const googleProvider = new GoogleAuthProvider();

export function subscribeAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function loginWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export async function loginWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function registerWithEmail(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function logoutUser() {
  return signOut(auth);
}

export async function loadDebtorProfile(uid) {"cyber-violet"
  if (!uid) return null;
  const userRef = ref(db, `${DB_ROOT}/${uid}`);
  const snap = await get(userRef);
  if (snap.exists()) return snap.val();

  const initialData = {
    app: "hethongbaoung",
    debtorCode: `#${Math.floor(100 + Math.random() * 899)}`,
    meritBalance: Number((-1200 - Math.random() * 1500).toFixed(2)),
    theme: localStorage.getItem("bao_ung_theme") || "acid",
    createdAt: serverTimestamp()
  };
  await set(userRef, initialData);
  return initialData;
}

export async function saveDebtorState(uid, partialData) {
  if (!uid) return;
  const userRef = ref(db, `${DB_ROOT}/${uid}`);
  await update(userRef, {
    ...partialData,
    updatedAt: serverTimestamp()
  });
}