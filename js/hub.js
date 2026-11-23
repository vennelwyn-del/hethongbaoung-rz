// js/hub.js — Kho Tệp Dữ Liệu 3D nổi, Phóng cửa sổ tệp, Ký thử/Chính thức & BXH 24h GMT+7

import { SITE_CONFIG } from "./config.js";
import { initVRCanvas } from "./canvas-bg.js";
import { SystemRadio } from "./radio.js";
import {
  getSavedSessionUsername,
  registerSimpleAccount,
  loginSimpleAccount,
  fetchDebtorByUsername,
  saveDebtorState,
  signOfficialContract,
  fetchLeaderboardUsers,
  logoutSimpleAccount
} from "./firebase.js";

const vrBg = initVRCanvas();
const radio = new SystemRadio();

const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' fill='%23221A6C'/><text x='32' y='40' font-size='28' text-anchor='middle' fill='%233BB8F8'>⚖️</text></svg>";
const VALID_THEMES = ["cyber-violet", "acid"];
let savedTheme = localStorage.getItem("bao_ung_theme") || "cyber-violet";
if (!VALID_THEMES.includes(savedTheme)) savedTheme = "cyber-violet";

const state = {
  theme: savedTheme,
  sfx: SITE_CONFIG.effects.sfx,
  scanlines: SITE_CONFIG.effects.scanlines,
  parallax: SITE_CONFIG.effects.parallax3D,
  pb: null,
  debtorCode: "CHƯA CẤP",
  contractLocked: false,
  selectedSector: "Điện 1 — Khu Vọng Ngữ",
  username: getSavedSessionUsername(),
  lastDossierText: "",
  rankItems: [],
  rankIndex: 0
};

const SECTORS = [
  { id: 1, name: "Điện 1 — Khu Vọng Ngữ", sub: "Showbiz & Bạo lực mạng", desc: "Đỉnh lưu trà xanh cướp tác phẩm, mua thủy quân vu khống. Giới hạn: Tung chứng cứ trực tiếp trên sóng Livestream." },
  { id: 2, name: "Điện 2 — Khu Tham Lam", sub: "Hào môn & Thật giả thiên kim", desc: "Con nuôi cướp công, cha mẹ ruột ép hiến tạng/gánh nợ. Giới hạn: Cấm nhận tiền bố thí gia tộc." },
  { id: 3, name: "Điện 3 — Khu Ái Dục", sub: "Ngược tra & Thế thân", desc: "Tra nam coi nguyên chủ là túi máu dự trữ. Giới hạn: Tha thứ dù chỉ 1% → Thanh lý ngay." },
  { id: 4, name: "Điện 4 — Khu Đố Kỵ", sub: "Cung đấu & Quyền mưu cổ đại", desc: "Thứ nữ/Sủng phi hãm hại gia tộc, đầu độc mãn tính mỗi đêm trăng tròn." },
  { id: 5, name: "Điện 5 — Khu Ngạo Mạn", sub: "Tu tiên & Phế vật nghịch tập", desc: "Sư tôn móc Linh căn ghép cho tiểu sư muội. Phải vạch mặt trước Thập Đại Tiên Môn." },
  { id: 6, name: "Điện 6 — Khu Đạo Văn", sub: "Học bá & Nghiên cứu khoa học", desc: "Cướp đề án quốc gia. Phải phản biện thực nghiệm trong 72h." },
  { id: 7, name: "Điện 7 — Khu Phản Bội", sub: "Mạt thế & Zombie", desc: "Đồng đội đâm sau lưng cướp nhẫn Không Gian. Cơ thể nhiễm virus 85%." },
  { id: 8, name: "Điện 8 — Khu Giả Dối", sub: "Y thuật & Huyền học", desc: "Thần y rởm phản sư dùng tà thuật mượn mệnh. Cấm cứu người miễn phí." },
  { id: 9, name: "Điện 9 — Khu Phẫn Nộ", sub: "E-Sports & Đấu trường ngầm", desc: "Đội trưởng bán độ đổ tội lên nguyên chủ. Tay phải chấn thương giới hạn 15 phút/hiệp." },
  { id: 10, name: "Điện 10 — Khu Vô Gian (SSS)", sub: "Nghịch tập Khí Vận Chi Tử", desc: "Đấu trường cấp cao nhất: Đánh sập cặp đôi con cưng Thiên Đạo và lần ra dấu vết Sd." }
];

const MARKET_ITEMS = [
  { name: "Adrenaline & Thuốc cầm cự (6 giờ)", costPB: -50, note: "Hệ Thống 00 (+5 PB phí tiêm) — Giữ tỉnh táo." },
  { name: "Khóa Debuff 'Cạn Phước' (3 Turn)", costPB: -200, note: "Hệ Thống 00 — Tránh tai nạn vật lý ngớ ngẩn." },
  { name: "Mở khóa Ký ức tổn thương Nguyên chủ", costPB: -150, note: "Hệ Thống 00 — Nhớ lại mật khẩu cũ." },
  { name: "Gia hạn hơi thở / Kích tim cấp cứu", costPB: -350, note: "Hệ Thống 00 — Mua thêm 24h thoi thóp." },
  { name: "Bộ nghe lén & Mở khóa cơ (Chợ Đen Lục Nha)", costPB: -25, note: "Phí môi giới tọa độ hẻm sau." }
];

const FORUM_POSTS = [
  { author: "@Phòng_Kiểm_Toán [GHIM]", body: "Thông báo: Tuần này có 14 Con nợ tại Điện 3 bị thanh lý vì mềm lòng nghe tra nam khóc lóc dưới mưa." },
  { author: "@Thực_Tập_Sinh_707 (Tiểu Thất)", body: "Cứu em với các đại ca ơi, em trượt chân hất chậu nước vào ổ cắm máy chiếu, tự nhiên phát luôn clip ngoại tình của thiên kim giả..." },
  { author: "@Quạ_Đen_Chợ_Đen (Lục Nha)", body: "Ai xuống Điện 1, 2, 3 cần máy ghi âm siêu nhỏ thì ghé tiệm cầm đồ cuối hẻm." }
];

const BUREAU_ENTITIES = [
  { name: "Hệ Thống 00", role: "Kế Toán Viên Kiểm Toán", desc: "Quy đổi mọi bi kịch thành hóa đơn nhiệt. Phí dịch vụ: 80%." },
  { name: "Tạ Vô Cữu", role: "Tổng Kiểm Toán Trưởng", desc: "Đồng hồ quả quýt bạc chạy ngược. Thẩm phán/Pháp y lạnh lùng." },
  { name: "Lục Nha", role: "Trùm Chợ Đen Xuyên Không", desc: "Vết sẹo tia sét ở cổ. Bán vật tư lách luật không tính lãi Hệ thống." },
  { name: "Ngu Hồng Diệp", role: "Giám Ngục Vọng Ngữ & Ái Dục", desc: "Tẩu thuốc bạc hoa bỉ ngạn. Ghét đàn ông cặn bã." },
  { name: "Tiểu Thất #707", role: "Thực Tập Sinh Hậu Đậu", desc: "Vận đen bẩm sinh nhưng hay vô tình phá hỏng kịch bản kẻ thù." },
  { name: "Quý Cô 'Sd.'", role: "[DỮ LIỆU NIÊM PHONG]", desc: "Tuxedo đen, tóc trắng bạc, hoa 4 cánh. Chân tướng mở tại Điện 10." }
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
const vaultRack = document.getElementById("vault-rack");
const popoutOverlay = document.getElementById("popout-overlay");
const receiptFeed = document.getElementById("receipt-feed");
const touchCursor = document.getElementById("touch-cursor");
const cursorCoords = document.getElementById("cursor-coords");
document.getElementById("scanlines-layer")?.classList.toggle("hidden", !state.scanlines);

// 1. THEME + BG IMAGE
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

document.querySelectorAll("[data-set-theme]").forEach((btn) =>
  btn.addEventListener("click", () => {
    if (state.sfx) radio.playClickChime();
    applyTheme(btn.dataset.setTheme);
  })
);

// 2. CON TRỎ + NGHIÊNG KHO TỆP 3D THEO CHUỘT + SÓNG CHẠM
window.addEventListener("pointermove", (e) => {
  if (touchCursor) {
    touchCursor.style.left = `${e.clientX}px`;
    touchCursor.style.top = `${e.clientY}px`;
    cursorCoords.textContent = `X:${String(Math.round(e.clientX)).padStart(3, "0")} Y:${String(Math.round(e.clientY)).padStart(3, "0")}`;
  }
  if (!state.parallax || window.innerWidth <= 1120 || !popoutOverlay.classList.contains("hidden")) return;
  const nx = (e.clientX / window.innerWidth - 0.5) * 2;
  const ny = (e.clientY / window.innerHeight - 0.5) * 2;
  vaultRack.style.transform = `rotateY(${nx * 7}deg) rotateX(${-ny * 5}deg)`;
});
window.addEventListener("pointerdown", (e) => vrBg.spawnTouchRipple(e.clientX, e.clientY));

// 3. RADIO SCOPE
const rScope = document.getElementById("radio-scope");
const rCtx = rScope?.getContext("2d");
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

// 4. MỞ / THU TỆP DỮ LIỆU 3D
function pushReceipt(text) {
  const p = document.createElement("p");
  p.textContent = text;
  receiptFeed.prepend(p);
}

function updateStatsUI() {
  const pbText = state.contractLocked && typeof state.pb === "number"
    ? `${state.pb.toFixed(2)} PB`
    : "CHƯA KÝ HỢP ĐỒNG";
  document.getElementById("hud-pb-side").textContent = pbText;
  document.getElementById("hud-code-side").textContent = state.debtorCode || "CHƯA CẤP";
  document.getElementById("hud-sector-badge").textContent = state.selectedSector;
  const profilePb = document.getElementById("profile-pb");
  if (profilePb) profilePb.textContent = pbText;
}

function openFileWindow(tabId) {
  if (state.sfx) radio.playClickChime();
  vaultRack.classList.add("is-dimmed");
  popoutOverlay.classList.remove("hidden");

  document.querySelectorAll(".win-tab").forEach((b) => b.classList.toggle("is-active", b.dataset.tab === tabId));
  document.querySelectorAll(".hub-panel").forEach((p) => p.classList.toggle("hidden", p.id !== tabId));

  if (tabId === "tab-ranking") loadAndRenderLeaderboard();
}

function closeFileWindow() {
  if (state.sfx) radio.playClickChime();
  popoutOverlay.classList.add("hidden");
  vaultRack.classList.remove("is-dimmed");
}

document.querySelectorAll("[data-open-file]").forEach((folderBtn) => {
  folderBtn.addEventListener("click", () => openFileWindow(folderBtn.dataset.openFile));
});
document.querySelectorAll(".win-tab").forEach((tabBtn) => {
  tabBtn.addEventListener("click", () => openFileWindow(tabBtn.dataset.tab));
});
document.getElementById("btn-close-file").addEventListener("click", closeFileWindow);
popoutOverlay.addEventListener("click", (e) => {
  if (e.target === popoutOverlay) closeFileWindow();
});
document.getElementById("btn-goto-rank").addEventListener("click", () => openFileWindow("tab-ranking"));

// 5. HỢP ĐỒNG: CHỖ 1 (KÝ THỬ SỬA ĐƯỢC) vs CHỖ 2 (KÝ CHÍNH THỨC KHÓA CỨNG)
function buildAuditBundle() {
  const name = document.getElementById("f-name").value.trim() || "Ký chủ vô danh";
  const age = document.getElementById("f-age").value || 24;
  const gender = document.getElementById("f-gender").value.trim() || "Tự do";
  const orient = document.getElementById("f-orient").value;
  const arch = document.getElementById("f-archetype").value;
  const sectorChoice = document.getElementById("f-sector").value;
  const skill = document.getElementById("f-skill").value.trim() || "Ứng biến sinh tồn";
  const sin = document.getElementById("f-sin").value.trim() || "Thức khuya & khẩu nghiệp";
  const quote = document.getElementById("f-quote").value.trim() || "Nợ có thể trả chậm, nhưng báo ứng thì thu đủ.";

  const [minD, maxD] = ARCHETYPE_RANGES[arch] || [1000, 2200];
  const rawTotal = minD + Math.random() * (maxD - minD);
  const fee1 = Number((rawTotal * 0.42).toFixed(2));
  const fee2 = Number((rawTotal * 0.31).toFixed(2));
  const fee3 = Number((rawTotal - fee1 - fee2).toFixed(2));
  const finalPB = Number((-(rawTotal + 100)).toFixed(2));
  const pickedSector = sectorChoice === "Random Độc Bản"
    ? SECTORS[Math.floor(Math.random() * SECTORS.length)].name
    : sectorChoice;
  const code = `#${Math.floor(100 + Math.random() * 899)}`;

  return {
    code,
    finalPB,
    pickedSector,
    profileData: { name, age, gender, orient, arch, sector: pickedSector, skill, sin, quote },
    fees: { fee1, fee2, fee3 }
  };
}

function renderAuditReceipt(bundle, isOfficial) {
  const p = bundle.profileData;
  const text = [
    isOfficial
      ? `⚖️ 【HỢP ĐỒNG CHÍNH THỨC ĐÃ NIÊM PHONG — ${bundle.code}】`
      : `📝 【BẢN NHÁP KÝ THỬ (CÓ THỂ SỬA LẠI) — TẠM TÍNH】`,
    `▸ Ký chủ: ${p.name} (${p.age}t | ${p.gender} | ${p.orient})`,
    `▸ Khấu trừ -${bundle.fees.fee1.toFixed(2)} PB: Nghiệp chướng "${p.sin}"`,
    `▸ Khấu trừ -${bundle.fees.fee2.toFixed(2)} PB: Phí khấu hao & trục vớt linh hồn`,
    `▸ Khấu trừ -${bundle.fees.fee3.toFixed(2)} PB: Thẩm định kỹ năng "${p.skill}"`,
    `▸ Khấu trừ -100.00 PB: Phí truyền tống vào ${bundle.pickedSector}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `⚖️ TỔNG PHƯỚC BÁU KHỞI ĐIỂM: ${bundle.finalPB.toFixed(2)} PB`,
    `▸ Câu thoại: "${p.quote}"`
  ].join("\n");
  state.lastDossierText = text;
  document.getElementById("audit-receipt-box").textContent = text;
  document.getElementById("audit-result").classList.remove("hidden");
}

function lockContractFormUI(profileObj) {
  const form = document.getElementById("contract-form");
  if (profileObj.lastProfile) {
    const lp = profileObj.lastProfile;
    document.getElementById("f-name").value = lp.name || "";
    document.getElementById("f-age").value = lp.age || 24;
    document.getElementById("f-gender").value = lp.gender || "";
    document.getElementById("f-orient").value = lp.orient || "Tự do";
    document.getElementById("f-archetype").value = lp.arch || "villain";
    document.getElementById("f-sector").value = lp.sector || "Random Độc Bản";
    document.getElementById("f-skill").value = lp.skill || "";
    document.getElementById("f-sin").value = lp.sin || "";
    document.getElementById("f-quote").value = lp.quote || "";
  }

  const locked = Boolean(profileObj.contractLocked);
  form.querySelectorAll("input, select, button").forEach((el) => { el.disabled = locked; });
  document.getElementById("contract-lock-banner").classList.toggle("hidden", !locked);
  document.getElementById("contract-status-badge").textContent = locked ? "ĐÃ NIÊM PHONG (1/1)" : "CHƯA KÝ CHÍNH THỨC";

  if (locked && profileObj.lastProfile) {
    const lp = profileObj.lastProfile;
    const sealedText = [
      `⚖️ 【HỢP ĐỒNG CHÍNH THỨC ĐÃ NIÊM PHONG — ${profileObj.debtorCode}】`,
      `▸ Ký chủ: ${lp.name} (${lp.age}t | ${lp.gender} | ${lp.orient})`,
      `▸ Điện tiếp nhận: ${lp.sector}`,
      `▸ Kỹ năng: ${lp.skill} | Nghiệp cũ: ${lp.sin}`,
      `▸ Số dư Phước Báu đã đồng bộ: ${Number(profileObj.meritBalance).toFixed(2)} PB`,
      `▸ Câu thoại: "${lp.quote}"`
    ].join("\n");
    state.lastDossierText = sealedText;
    document.getElementById("audit-receipt-box").textContent = sealedText;
    document.getElementById("audit-result").classList.remove("hidden");
  }
}

document.getElementById("btn-sign-draft").addEventListener("click", () => {
  if (state.contractLocked) return;
  if (state.sfx) radio.playClickChime();
  const bundle = buildAuditBundle();
  renderAuditReceipt(bundle, false);
  pushReceipt(`【BẢN NHÁP】: Random thử ${bundle.finalPB.toFixed(2)} PB.`);
});

document.getElementById("contract-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (state.contractLocked) return;
  if (state.sfx) radio.playClickChime();

  if (!state.username) {
    pushReceipt("【CẢNH BÁO】: Hãy đăng nhập / tạo tài khoản trước khi Ký Chính Thức.");
    openModal("modal-auth");
    return;
  }
  if (!confirm("XÁC NHẬN KÝ HỢP ĐỒNG CHÍNH THỨC?\nSau khi ký, hồ sơ sẽ KHÓA VĨNH VIỄN. Muốn sửa bắt buộc tạo tài khoản mới!")) return;

  try {
    const bundle = buildAuditBundle();
    const updated = await signOfficialContract(state.username, {
      debtorCode: bundle.code,
      meritBalance: bundle.finalPB,
      lastProfile: bundle.profileData
    });
    renderAuditReceipt(bundle, true);
    applyProfileUI(updated);
    pushReceipt(`【CHÍNH THỨC】: Đã ký ${bundle.code} (${bundle.finalPB.toFixed(2)} PB).`);
  } catch (err) {
    alert(err.message);
  }
});

document.getElementById("btn-copy-dossier").addEventListener("click", () => {
  if (!state.lastDossierText) return;
  navigator.clipboard?.writeText(state.lastDossierText);
  pushReceipt("> Đã copy hồ sơ vào Clipboard.");
});

// 6. BẢNG XẾP HẠNG 24H GMT+7 (BLOCK + NÚT TRƯỢT LÊN/XUỐNG)
function getGMT7Info() {
  const gmt7Ms = Date.now() + 7 * 3600 * 1000;
  const d = new Date(gmt7Ms);
  const dateKey = d.toISOString().slice(0, 10);
  const nextMidnightMs = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1, 0, 0, 0);
  const diffSec = Math.max(0, Math.floor((nextMidnightMs - gmt7Ms) / 1000));
  const hh = String(Math.floor(diffSec / 3600)).padStart(2, "0");
  const mm = String(Math.floor((diffSec % 3600) / 60)).padStart(2, "0");
  const ss = String(diffSec % 60).padStart(2, "0");
  return { dateKey, countdown: `${hh}:${mm}:${ss}`, gmt7Time: d.toISOString().slice(11, 19) };
}

function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const DAILY_TAGS = ["Đang cày nợ", "Vận đen cấp SSS", "Săn hào quang", "Khả nghi cao", "Đang bị Tạ Vô Cữu soi"];

async function loadAndRenderLeaderboard() {
  const track = document.getElementById("rank-track");
  const { dateKey } = getGMT7Info();
  document.getElementById("rank-date-gmt7").textContent = dateKey;
  track.innerHTML = `<p class="muted" style="padding:12px;">Đang đồng bộ danh sách Con nợ từ Firebase...</p>`;

  try {
    const users = await fetchLeaderboardUsers();
    users.sort((a, b) => hashSeed(`${dateKey}:${a.username}`) - hashSeed(`${dateKey}:${b.username}`));
    state.rankItems = users;
    state.rankIndex = 0;
    document.getElementById("rank-total-count").textContent = String(users.length);
    renderRankBlocks();
  } catch (err) {
    track.innerHTML = `<p class="muted" style="padding:12px;">Lỗi đồng bộ: ${err.message}</p>`;
  }
}

function renderRankBlocks() {
  const track = document.getElementById("rank-track");
  const { dateKey } = getGMT7Info();
  if (!state.rankItems.length) {
    track.innerHTML = `<p class="muted" style="padding:16px;">Chưa có tài khoản nào ký Hợp đồng chính thức để lên bảng.</p>`;
    document.getElementById("rank-page-info").textContent = "BLOCK 0 / 0";
    return;
  }

  track.innerHTML = "";
  state.rankItems.forEach((u, idx) => {
    const tag = DAILY_TAGS[hashSeed(`${dateKey}:tag:${u.username}`) % DAILY_TAGS.length];
    const block = document.createElement("div");
    block.className = `rank-block ${u.username === state.username ? "is-me" : ""}`;
    block.innerHTML = `
      <div class="rank-num">#${String(idx + 1).padStart(2, "0")}</div>
      <img class="rank-avt" src="${u.avatarUrl || DEFAULT_AVATAR}" alt="Avatar" />
      <div class="rank-info">
        <strong>${u.displayName} (${u.debtorCode})</strong>
        <small>@${u.username} • ${u.sector}</small>
      </div>
      <div class="rank-pb">
        ${u.meritBalance.toFixed(2)} PB
        <small>${tag}</small>
      </div>
    `;
    track.appendChild(block);
  });
  applyRankSlide();
}

function applyRankSlide() {
  const track = document.getElementById("rank-track");
  const total = state.rankItems.length;
  const maxIdx = Math.max(0, total - 4);
  state.rankIndex = Math.max(0, Math.min(state.rankIndex, maxIdx));
  track.style.transform = `translateY(-${state.rankIndex * 90}px)`;
  document.getElementById("rank-page-info").textContent =
    total ? `BLOCK ${state.rankIndex + 1}–${Math.min(state.rankIndex + 4, total)} / ${total}` : "BLOCK 0 / 0";
}

document.getElementById("btn-rank-up").addEventListener("click", () => {
  if (state.sfx) radio.playClickChime();
  state.rankIndex -= 1;
  applyRankSlide();
});
document.getElementById("btn-rank-down").addEventListener("click", () => {
  if (state.sfx) radio.playClickChime();
  state.rankIndex += 1;
  applyRankSlide();
});
document.getElementById("btn-refresh-rank").addEventListener("click", () => {
  if (state.sfx) radio.playClickChime();
  loadAndRenderLeaderboard();
});

setInterval(() => {
  const { dateKey, countdown, gmt7Time } = getGMT7Info();
  document.getElementById("clock-utc").textContent = `${gmt7Time} +7`;
  const cdEl = document.getElementById("rank-countdown");
  const dtEl = document.getElementById("rank-date-gmt7");
  if (cdEl) cdEl.textContent = countdown;
  if (dtEl && dtEl.textContent !== "----/--/--" && dtEl.textContent !== dateKey) {
    loadAndRenderLeaderboard();
  }
  const bytes = Array.from({ length: 3 }, () =>
    Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, "0")
  );
  document.getElementById("hex-matrix").textContent = `0x${bytes.join(" ")}`;
}, 1000);

// 7. THẬP ĐIỆN, CHỢ ĐEN & DIỄN ĐÀN
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
});
document.getElementById("btn-lock-sector").addEventListener("click", () => {
  if (state.sfx) radio.playClickChime();
  state.selectedSector = previewSector.name;
  updateStatsUI();
  pushReceipt(`> Đã khóa mục tiêu: [${state.selectedSector}].`);
});

const marketList = document.getElementById("market-list");
for (const item of MARKET_ITEMS) {
  const row = document.createElement("div");
  row.className = "market-item";
  row.innerHTML = `<div><h4>${item.name}</h4><p>${item.note}</p></div><button type="button" class="btn-secondary holo-tactile market-buy">${item.costPB} PB</button>`;
  row.querySelector("button").addEventListener("click", async () => {
    if (state.sfx) radio.playClickChime();
    if (!state.contractLocked) {
      pushReceipt("【CẢNH BÁO】: Phải ký Hợp đồng chính thức mới có PB để giao dịch.");
      return;
    }
    state.pb = Number((state.pb + item.costPB).toFixed(2));
    updateStatsUI();
    pushReceipt(`【GIAO DỊCH】: ${item.name} (${item.costPB} PB).`);
    if (state.username) await saveDebtorState(state.username, { meritBalance: state.pb }).catch(() => {});
  });
  marketList.appendChild(row);
}

const forumFeed = document.getElementById("forum-feed");
for (const post of FORUM_POSTS) {
  const div = document.createElement("div");
  div.className = "forum-post";
  div.innerHTML = `<span class="author">${post.author}</span><p>${post.body}</p>`;
  forumFeed.appendChild(div);
}
document.getElementById("btn-refresh-forum").addEventListener("click", async () => {
  if (state.sfx) radio.playClickChime();
  if (!state.contractLocked) {
    pushReceipt("【BÁO ỨNG NET】: Chế độ khách xem miễn phí.");
    return;
  }
  state.pb = Number((state.pb - 0.5).toFixed(2));
  updateStatsUI();
  pushReceipt("【BÁO ỨNG NET】: -0.50 PB phí 3G linh hồn.");
  if (state.username) await saveDebtorState(state.username, { meritBalance: state.pb }).catch(() => {});
});

const entitiesGrid = document.getElementById("entities-grid");
for (const ent of BUREAU_ENTITIES) {
  const card = document.createElement("div");
  card.className = "entity-card";
  card.innerHTML = `<strong>${ent.name}</strong><small>${ent.role}</small><p>${ent.desc}</p>`;
  entitiesGrid.appendChild(card);
}

// 8. MODAL TÀI KHOẢN & ĐỔI AVATAR
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
    state.contractLocked = false;
    state.pb = null;
    state.debtorCode = "CHƯA CẤP";
    document.getElementById("user-dot").classList.remove("online");
    topAvatar.classList.add("hidden");
    document.getElementById("user-label").textContent = "ĐĂNG NHẬP";
    authOut.classList.remove("hidden");
    authIn.classList.add("hidden");
    lockContractFormUI({ contractLocked: false });
    updateStatsUI();
    return;
  }

  state.username = profile.username;
  state.contractLocked = Boolean(profile.contractLocked);
  state.debtorCode = profile.contractLocked ? (profile.debtorCode || "#000") : "CHƯA CẤP";
  state.pb = profile.contractLocked && typeof profile.meritBalance === "number" ? profile.meritBalance : null;
  if (profile.lastProfile?.sector) state.selectedSector = profile.lastProfile.sector;
  if (profile.theme && VALID_THEMES.includes(profile.theme)) applyTheme(profile.theme, false);

  const avt = profile.avatarUrl || DEFAULT_AVATAR;
  topAvatar.src = avt;
  topAvatar.classList.remove("hidden");
  document.getElementById("profile-avatar").src = avt;
  document.getElementById("avatar-url-input").value = profile.avatarUrl?.startsWith("http") ? profile.avatarUrl : "";

  document.getElementById("user-dot").classList.add("online");
  document.getElementById("user-label").textContent = profile.displayName || profile.username;
  document.getElementById("profile-name").textContent = state.contractLocked
    ? `Con nợ ${state.debtorCode} (Đã khóa hồ sơ)`
    : "Chưa ký hợp đồng chính thức";
  document.getElementById("profile-username").textContent = `@${profile.username}`;
  authOut.classList.add("hidden");
  authIn.classList.remove("hidden");

  lockContractFormUI(profile);
  updateStatsUI();
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
  document.getElementById("auth-sync-msg").textContent = "Đã lưu Avatar lên Firebase.";
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
updateStatsUI();
restoreSession();