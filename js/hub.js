// js/hub.js — Giao diện 2: Hồ sơ Con nợ, Random PB, Thập Điện, Chợ Đen Lục Nha & Báo Ứng Net

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
  selectedSector: "Điện 1 — Khu Vọng Ngữ",
  username: getSavedSessionUsername(),
  lastDossierText: ""
};

const SECTORS = [
  { id: 1, name: "Điện 1 — Khu Vọng Ngữ", sub: "Showbiz & Bạo lực mạng", desc: "Đỉnh lưu trà xanh cướp tác phẩm, mua thủy quân vu khống. Giới hạn: Tung chứng cứ trực tiếp trên sóng Livestream." },
  { id: 2, name: "Điện 2 — Khu Tham Lam", sub: "Hào môn & Thật giả thiên kim", desc: "Con nuôi cướp công, cha mẹ ruột thiên vị ép hiến tạng/gánh nợ. Giới hạn: Cấm nhận tiền bố thí gia tộc." },
  { id: 3, name: "Điện 3 — Khu Ái Dục", sub: "Ngược tra & Thế thân", desc: "Tra nam coi nguyên chủ là túi máu dự trữ cho Bạch nguyệt quang. Giới hạn: Tha thứ dù chỉ 1% → Thanh lý ngay." },
  { id: 4, name: "Điện 4 — Khu Đố Kỵ", sub: "Cung đấu & Quyền mưu cổ đại", desc: "Thứ nữ/Sủng phi hãm hại gia tộc, đầu độc mãn tính mỗi đêm trăng tròn." },
  { id: 5, name: "Điện 5 — Khu Ngạo Mạn", sub: "Tu tiên & Phế vật nghịch tập", desc: "Sư tôn móc Linh căn ghép cho tiểu sư muội. Phải vạch mặt trước Thập Đại Tiên Môn." },
  { id: 6, name: "Điện 6 — Khu Đạo Văn", sub: "Học bá & Nghiên cứu khoa học", desc: "Giáo sư/Con ông cháu cha cướp đề án quốc gia. Phải phản biện thực nghiệm trong 72h." },
  { id: 7, name: "Điện 7 — Khu Phản Bội", sub: "Mạt thế & Zombie", desc: "Đồng đội đâm sau lưng cướp nhẫn Không Gian. Cơ thể nhiễm virus 85%." },
  { id: 8, name: "Điện 8 — Khu Giả Dối", sub: "Y thuật & Huyền học", desc: "Thần y rởm phản sư dùng tà thuật mượn mệnh. Cấm cứu người miễn phí." },
  { id: 9, name: "Điện 9 — Khu Phẫn Nộ", sub: "E-Sports & Đấu trường ngầm", desc: "Đội trưởng bán độ đổ tội lên nguyên chủ. Tay phải chấn thương giới hạn 15 phút/hiệp." },
  { id: 10, name: "Điện 10 — Khu Vô Gian (SSS)", sub: "Nghịch tập Khí Vận Chi Tử", desc: "Đấu trường cấp cao nhất: Đánh sập cặp đôi con cưng Thiên Đạo và lần ra dấu vết Sd." }
];

const MARKET_ITEMS = [
  { name: "Adrenaline & Thuốc cầm cự (6 giờ)", costPB: -50, note: "Hệ Thống 00 (+5 PB phí tiêm) — Giữ tỉnh táo, vết thương vẫn chảy máu." },
  { name: "Khóa Debuff 'Cạn Phước' (3 Turn)", costPB: -200, note: "Hệ Thống 00 — Tránh sự cố vật lý ngớ ngẩn khi tung chứng cứ." },
  { name: "Mở khóa Ký ức tổn thương Nguyên chủ", costPB: -150, note: "Hệ Thống 00 — Nhớ lại mật khẩu/chi tiết chính mắt nguyên chủ từng thấy." },
  { name: "Gia hạn hơi thở / Kích tim cấp cứu", costPB: -350, note: "Hệ Thống 00 — Mua thêm 24h thoi thóp khi suy tạng." },
  { name: "Bộ nghe lén & Mở khóa cơ (Chợ Đen Lục Nha)", costPB: -25, note: "Phí môi giới tọa độ hẻm sau (Đồ nghề trả bằng tiền mặt thế giới)." }
];

const FORUM_POSTS = [
  { author: "@Phòng_Kiểm_Toán [GHIM]", body: "Thông báo: Tuần này có 14 Con nợ tại Điện 3 bị thanh lý vì mềm lòng nghe tra nam khóc lóc dưới mưa. Nhắc lại: Tha thứ = Khấu trừ 10,000 PB." },
  { author: "@Thực_Tập_Sinh_707 (Tiểu Thất)", body: "Cứu em với các đại ca ơi, em chỉ định bưng bát canh cho Ký chủ mà vấp chân hất thẳng vào ổ cắm máy chiếu, tự nhiên màn hình phát luôn clip ngoại tình của cô thiên kim giả..." },
  { author: "@Quạ_Đen_Chợ_Đen (Lục Nha)", body: "Ai xuống Điện 1, 2, 3 cần máy ghi âm siêu nhỏ hoặc thuốc giảm đau không tính lãi 18%/tuần thì ghé tiệm cầm đồ cuối hẻm. Không tiếp kẻ thích khoe bản gốc trong phòng kín." },
  { author: "@Con_Nợ_Ẩn_Danh", body: "Vừa có người thấy vị khách VIP tóc trắng cài hoa bốn cánh màu bạc đứng ở lô trên cùng nhà hát. Lạ thật, sao lần nào có trọng án cũng thấy người này?" }
];

const BUREAU_ENTITIES = [
  { name: "Hệ Thống 00", role: "Kế Toán Viên Kiểm Toán", desc: "Quy đổi mọi bi kịch thành hóa đơn nhiệt chi tiết đến từng xu. Phí dịch vụ cố định: 80%." },
  { name: "Tạ Vô Cữu", role: "Tổng Kiểm Toán Trưởng", desc: "Đồng hồ quả quýt bạc chạy ngược. Thẩm phán/Pháp y lạnh lùng chuyên công chứng bản án phá sản." },
  { name: "Lục Nha", role: "Trùm Chợ Đen Xuyên Không", desc: "Vết sẹo tia sét ở cổ, đồng xu dính máu. Bán vật tư lách luật không tính lãi Hệ thống." },
  { name: "Ngu Hồng Diệp", role: "Giám Ngục Vọng Ngữ & Ái Dục", desc: "Tẩu thuốc bạc hoa bỉ ngạn. Ghét đàn ông cặn bã, thưởng nóng nếu vả mặt đẹp mắt." },
  { name: "Tiểu Thất #707", role: "Thực Tập Sinh Vô Tình Tấu Hài", desc: "Vận đen bẩm sinh nhưng hay vô tình phá hỏng màn kịch đạo đức giả của kẻ thù." },
  { name: "Quý Cô 'Sd.'", role: "[DỮ LIỆU NIÊM PHONG]", desc: "Tuxedo đen, tóc trắng bạc, hoa 4 cánh. Quyền hạn cao nhất — Chân tướng chỉ mở tại Điện 10." }
];

const ARCHETYPE_RANGES = {
  villain: [2500, 3900],
  jinx: [900, 1800],
  scapegoat: [500, 1400],
  slave: [1100, 2200],
  avenger: [3800, 5500]
};

const htmlEl = document.documentElement;
const bgImageLayer = document.getElementById("bg-image-layer");
const receiptFeed = document.getElementById("receipt-feed");
const touchCursor = document.getElementById("touch-cursor");
const cursorCoords = document.getElementById("cursor-coords");

document.getElementById("scanlines-layer").classList.toggle("hidden", !state.scanlines);

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
  if (syncCloud && state.username) saveDebtorState(state.username, { theme: safeTheme }).catch(() => {});
}

document.querySelectorAll("[data-set-theme]").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (state.sfx) radio.playClickChime();
    applyTheme(btn.dataset.setTheme);
  });
});

// 2. CON TRỎ & SÓNG CHẠM
window.addEventListener("pointermove", (e) => {
  if (touchCursor) {
    touchCursor.style.left = `${e.clientX}px`;
    touchCursor.style.top = `${e.clientY}px`;
    cursorCoords.textContent = `X:${String(Math.round(e.clientX)).padStart(3, "0")} Y:${String(Math.round(e.clientY)).padStart(3, "0")}`;
  }
});
window.addEventListener("pointerdown", (e) => vrBg.spawnTouchRipple(e.clientX, e.clientY));

// 3. OSCILLOSCOPE + RADIO
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
  const bytes = Array.from({ length: 7 }, () =>
    Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, "0")
  );
  document.getElementById("hex-matrix").textContent = `0x${bytes.join(" ")}`;
}, 1000);

const radioToggle = document.getElementById("radio-toggle");
const radioTrackName = document.getElementById("radio-track-name");
radioTrackName.textContent = radio.currentTrackName;
radioToggle.addEventListener("click", () => {
  const playing = radio.toggle();
  radioToggle.querySelector(".radio-icon").textContent = playing ? "❚❚" : "▶";
});
document.getElementById("radio-next").addEventListener("click", () => {
  radioTrackName.textContent = radio.nextTrack();
});
document.getElementById("radio-vol").addEventListener("input", (e) => radio.setVolume(e.target.value));

// 4. TIỆN ÍCH UI & CHUYỂN TAB GIAO DIỆN 2
function pushReceipt(text) {
  const p = document.createElement("p");
  p.textContent = text;
  receiptFeed.prepend(p);
}

function updateStatsUI() {
  const fmt = `${state.pb.toFixed(2)} PB`;
  document.getElementById("hud-pb-side").textContent = fmt;
  document.getElementById("hud-code-side").textContent = state.debtorCode;
  document.getElementById("hud-sector-badge").textContent = state.selectedSector;
  const profilePb = document.getElementById("profile-pb");
  if (profilePb) profilePb.textContent = fmt;
}

document.querySelectorAll(".nav-tab").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (state.sfx) radio.playClickChime();
    document.querySelectorAll(".nav-tab").forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    document.querySelectorAll(".hub-panel").forEach((p) => p.classList.add("hidden"));
    document.getElementById(btn.dataset.tab).classList.remove("hidden");
  });
});

// 5. MODULE 1: KÝ HỢP ĐỒNG & RANDOM NỢ PHƯỚC BÁU THEO PROFILE
document.getElementById("contract-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (state.sfx) radio.playClickChime();

  const name = document.getElementById("f-name").value.trim();
  const age = document.getElementById("f-age").value;
  const gender = document.getElementById("f-gender").value.trim();
  const orient = document.getElementById("f-orient").value;
  const arch = document.getElementById("f-archetype").value;
  const sectorChoice = document.getElementById("f-sector").value;
  const skill = document.getElementById("f-skill").value.trim();
  const sin = document.getElementById("f-sin").value.trim();
  const quote = document.getElementById("f-quote").value.trim() || "Nợ có thể trả chậm, nhưng báo ứng thì thu đủ.";

  const [minD, maxD] = ARCHETYPE_RANGES[arch] || [1000, 2200];
  const rawTotal = minD + Math.random() * (maxD - minD);
  const fee1 = Number((rawTotal * 0.42).toFixed(2));
  const fee2 = Number((rawTotal * 0.31).toFixed(2));
  const fee3 = Number((rawTotal - fee1 - fee2).toFixed(2));
  const transferFee = 100.0;
  const finalPB = Number((-(rawTotal + transferFee)).toFixed(2));

  const pickedSector = sectorChoice === "Random Độc Bản"
    ? SECTORS[Math.floor(Math.random() * SECTORS.length)].name
    : sectorChoice;

  state.pb = finalPB;
  state.selectedSector = pickedSector;
  if (!state.debtorCode || state.debtorCode === "#049") {
    state.debtorCode = `#${Math.floor(100 + Math.random() * 899)}`;
  }

  localStorage.setItem("bao_ung_pb", String(state.pb));
  localStorage.setItem("bao_ung_code", state.debtorCode);
  updateStatsUI();

  const receiptText = [
    `【Hệ Thống 00 — HOÀN TẤT KIỂM TOÁN HỒ SƠ ${state.debtorCode}】`,
    `▸ Ký chủ: ${name} (${age}t | ${gender} | ${orient})`,
    `▸ Khấu trừ -${fee1.toFixed(2)} PB: Nghiệp chướng "${sin}"`,
    `▸ Khấu trừ -${fee2.toFixed(2)} PB: Phí khấu hao tinh thần & trục vớt linh hồn`,
    `▸ Khấu trừ -${fee3.toFixed(2)} PB: Phí thẩm định kỹ năng "${skill}"`,
    `▸ Khấu trừ -100.00 PB: Phí truyền tống vào ${pickedSector}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `⚖️ TỔNG SỐ DƯ PHƯỚC BÁU KHỞI ĐIỂM: ${finalPB.toFixed(2)} PB`,
    `▸ Câu thoại ấn định: "${quote}"`
  ].join("\n");

  state.lastDossierText = receiptText;
  document.getElementById("audit-receipt-box").textContent = receiptText;
  document.getElementById("audit-result").classList.remove("hidden");
  document.getElementById("sync-bar-fill").style.width = "100%";

  pushReceipt(`【KIỂM TOÁN 00】: Khởi tạo ${state.debtorCode} → ${finalPB.toFixed(2)} PB.`);

  if (state.username) {
    await saveDebtorState(state.username, {
      meritBalance: state.pb,
      debtorCode: state.debtorCode,
      lastProfile: { name, age, gender, orient, arch, sector: pickedSector, skill, sin, quote }
    }).catch(() => {});
  }
});

document.getElementById("btn-copy-dossier").addEventListener("click", () => {
  if (!state.lastDossierText) return;
  navigator.clipboard?.writeText(state.lastDossierText);
  pushReceipt("> Đã copy biên lai hồ sơ vào Clipboard.");
});

// 6. MODULE 2: BẢN ĐỒ THẬP ĐIỆN
const sectorsGrid = document.getElementById("sectors-grid");
let previewSector = SECTORS[0];

function renderSectors() {
  sectorsGrid.innerHTML = "";
  for (const sec of SECTORS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `sector-card holo-tactile ${previewSector.id === sec.id ? "is-selected" : ""}`;
    btn.innerHTML = `<strong>${sec.name}</strong><span>${sec.sub}</span>`;
    btn.addEventListener("click", () => {
      if (state.sfx) radio.playClickChime();
      previewSector = sec;
      document.getElementById("sd-title").textContent = `${sec.name} — ${sec.sub}`;
      document.getElementById("sd-desc").textContent = sec.desc;
      renderSectors();
    });
    sectorsGrid.appendChild(btn);
  }
}
renderSectors();

document.getElementById("btn-random-case").addEventListener("click", () => {
  if (state.sfx) radio.playClickChime();
  previewSector = SECTORS[Math.floor(Math.random() * SECTORS.length)];
  document.getElementById("sd-title").textContent = `${previewSector.name} — ${previewSector.sub}`;
  document.getElementById("sd-desc").textContent = previewSector.desc;
  renderSectors();
  pushReceipt(`【RANDOM】: Đề xuất trọng án tại ${previewSector.name}.`);
});

document.getElementById("btn-lock-sector").addEventListener("click", () => {
  if (state.sfx) radio.playClickChime();
  state.selectedSector = previewSector.name;
  updateStatsUI();
  pushReceipt(`> Đã khóa mục tiêu: [${state.selectedSector}].`);
});

// 7. MODULE 3: CHỢ ĐEN & HỆ THỐNG 00
const marketList = document.getElementById("market-list");
for (const item of MARKET_ITEMS) {
  const row = document.createElement("div");
  row.className = "market-item";
  row.innerHTML = `
    <div>
      <h4>${item.name}</h4>
      <p>${item.note}</p>
    </div>
    <button type="button" class="btn-secondary holo-tactile market-buy">${item.costPB} PB</button>
  `;
  row.querySelector("button").addEventListener("click", async () => {
    if (state.sfx) radio.playClickChime();
    state.pb = Number((state.pb + item.costPB).toFixed(2));
    localStorage.setItem("bao_ung_pb", String(state.pb));
    updateStatsUI();
    pushReceipt(`【GIAO DỊCH】: ${item.name} (${item.costPB} PB).`);
    if (state.username) await saveDebtorState(state.username, { meritBalance: state.pb }).catch(() => {});
  });
  marketList.appendChild(row);
}

// 8. MODULE 4: BÁO ỨNG NET & HỒ SƠ CỤC
const forumFeed = document.getElementById("forum-feed");
function renderForum() {
  forumFeed.innerHTML = "";
  for (const post of FORUM_POSTS) {
    const div = document.createElement("div");
    div.className = "forum-post";
    div.innerHTML = `<span class="author">${post.author}</span><p>${post.body}</p>`;
    forumFeed.appendChild(div);
  }
}
renderForum();

document.getElementById("btn-refresh-forum").addEventListener("click", async () => {
  if (state.sfx) radio.playClickChime();
  state.pb = Number((state.pb - 0.5).toFixed(2));
  localStorage.setItem("bao_ung_pb", String(state.pb));
  updateStatsUI();
  pushReceipt("【BÁO ỨNG NET】: -0.50 PB phí 3G linh hồn tải lại diễn đàn.");
  if (state.username) await saveDebtorState(state.username, { meritBalance: state.pb }).catch(() => {});
});

const entitiesGrid = document.getElementById("entities-grid");
for (const ent of BUREAU_ENTITIES) {
  const card = document.createElement("div");
  card.className = "entity-card";
  card.innerHTML = `<strong>${ent.name}</strong><small>${ent.role}</small><p>${ent.desc}</p>`;
  entitiesGrid.appendChild(card);
}

// 9. NÚT RADAR & SOI NỢ CỘT PHẢI
document.getElementById("btn-scan-radar").addEventListener("click", () => {
  if (state.sfx) radio.playClickChime();
  pushReceipt(`【RADAR 360°】: Đang quét hào quang lậu tại ${state.selectedSector}...`);
});
document.getElementById("btn-audit-pb").addEventListener("click", () => {
  if (state.sfx) radio.playClickChime();
  pushReceipt(`【KIỂM TOÁN 00】: Nợ hiện tại ${state.pb.toFixed(2)} PB (Trần thanh lý: -5,000 PB).`);
});

// 10. MODAL FIREBASE TÀI KHOẢN ĐƠN GIẢN
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
  if (!profile) {
    state.username = null;
    document.getElementById("user-dot").classList.remove("online");
    document.getElementById("user-label").textContent = "ĐĂNG NHẬP";
    authOut.classList.remove("hidden");
    authIn.classList.add("hidden");
    return;
  }
  state.username = profile.username;
  state.debtorCode = profile.debtorCode || state.debtorCode;
  if (typeof profile.meritBalance === "number") {
    state.pb = profile.meritBalance;
    localStorage.setItem("bao_ung_pb", String(state.pb));
  }
  if (profile.theme && VALID_THEMES.includes(profile.theme)) applyTheme(profile.theme, false);

  document.getElementById("user-dot").classList.add("online");
  document.getElementById("user-label").textContent = profile.displayName || profile.username;
  document.getElementById("profile-name").textContent = `Con nợ ${state.debtorCode}`;
  document.getElementById("profile-username").textContent = `@${profile.username}`;
  authOut.classList.add("hidden");
  authIn.classList.remove("hidden");
  updateStatsUI();
}

async function restoreSession() {
  if (!state.username) { applyProfileUI(null); return; }
  try {
    const profile = await fetchDebtorByUsername(state.username);
    if (profile) applyProfileUI(profile);
    else { logoutSimpleAccount(); applyProfileUI(null); }
  } catch {
    applyProfileUI(null);
  }
}

document.getElementById("simple-auth-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  try {
    authMsg.textContent = "Đang đăng nhập...";
    const p = await loginSimpleAccount(
      document.getElementById("auth-username").value,
      document.getElementById("auth-pass").value
    );
    applyProfileUI(p);
    authMsg.textContent = "";
    pushReceipt(`【Hệ Thống 00】: Đã đăng nhập @${p.username}.`);
  } catch (err) {
    authMsg.textContent = err.message;
  }
});

document.getElementById("btn-register-simple").addEventListener("click", async () => {
  try {
    authMsg.textContent = "Đang tạo tài khoản...";
    const p = await registerSimpleAccount(
      document.getElementById("auth-username").value,
      document.getElementById("auth-pass").value
    );
    applyProfileUI(p);
    authMsg.textContent = "";
    pushReceipt(`【Hệ Thống 00】: Tạo mới @${p.username} (${p.debtorCode}).`);
  } catch (err) {
    authMsg.textContent = err.message;
  }
});

document.getElementById("btn-sync-now").addEventListener("click", async () => {
  if (!state.username) return;
  await saveDebtorState(state.username, { theme: state.theme, meritBalance: state.pb, debtorCode: state.debtorCode });
  document.getElementById("auth-sync-msg").textContent = "Đã đồng bộ lên Firebase.";
});

document.getElementById("btn-logout").addEventListener("click", () => {
  logoutSimpleAccount();
  applyProfileUI(null);
});

applyTheme(state.theme, false);
updateStatsUI();
restoreSession();