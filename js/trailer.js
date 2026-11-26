// js/trailer.js — Kịch Bản & NPC Tự Chế cho Trailer Dọc 9:16 (Auto-Director + Vuốt Tay)

import { initVRCanvas } from "./canvas-bg.js";
import { SystemRadio } from "./radio.js";
import { SITE_CONFIG } from "./config.js";

// ============================================================================
// DANH SÁCH 6 NHÂN VẬT & KỊCH BẢN TỰ CHẾ
// Sau này có ảnh, bạn chỉ cần dán link hoặc "./assets/..." vào trường avatarUrl!
// ============================================================================
const TRAILER_CAST = [
  {
    id: "tham-tich-nguyet",
    code: "ID // #404",
    badge: "KÝ CHỦ MỚI",
    emblem: "⚖️",
    avatarUrl: "./assets/assets/OPW/Hethongbaoung/01.png", // <-- DÁN LINK ẢNH NHÂN VẬT 1 VÀO ĐÂY
    name: "THẨM TỊCH NGUYỆT",
    role: "Kiểm Toán Viên Đột Tử • Ký Chủ Khế Ước Máu",
    theme: "orbital-cyan",
    sector: "ĐIỆN 1 — KHU VỌNG NGỮ",
    scenarioTag: "KỊCH BẢN 01 // SHOWBIZ",
    pbTag: "-2,180.00 PB",
    scenarioTitle: "ÁN TRÁO BẢN THẢO TRƯỚC SÓNG TRỰC TIẾP",
    story: "Bị đỉnh lưu trà xanh đánh tráo kịch bản rồi thuê thủy quân ép tự sát. Mang theo kỹ năng đọc vi biểu cảm và bản ghi âm RAW, cô lật ngược bàn tiệc ngay trên thảm đỏ.",
    quote: "“Khóc thêm hai giây nữa đi, tiền bồi thường tổn thất tinh thần tôi tính theo từng giọt nước mắt.”"
  },
  {
    id: "co-han-thuong",
    code: "ID // AUDIT-09",
    badge: "THANH TRA",
    emblem: "⚔️",
    avatarUrl: "./assets/assets/OPW/Hethongbaoung/02.png", // <-- DÁN LINK ẢNH NHÂN VẬT 2 VÀO ĐÂY
    name: "CỐ HÀN THƯƠNG",
    role: "Phán Quan Kỷ Luật • Đội Thanh Trừng Tầng 3",
    theme: "orbital-cyan",
    sector: "ĐIỆN 3 — KHU ÁI DỤC",
    scenarioTag: "KỊCH BẢN 02 // NGƯỢC TRA",
    pbTag: "PHẠT -10,000 PB",
    scenarioTitle: "KHẾ ƯỚC THẾ THÂN & LỆNH RÚT ỐNG THỞ",
    story: "Cựu bác sĩ pháp y lạnh như băng. Chỉ cần Ký chủ mềm lòng tha thứ tra nam quá 3 giây, hắn sẽ tự tay công chứng lệnh thanh lý linh hồn ngay tại bệnh viện.",
    quote: "“Tình cảm là món nợ xấu không tài sản đảm bảo. Ký giấy phá sản hay ký giấy chứng tử?”"
  },
  {
    id: "mac-cuu-ca",
    code: "ID // BLACK-77",
    badge: "CHỢ ĐEN",
    emblem: "🦊",
    avatarUrl: "./assets/assets/OPW/Hethongbaoung/03.png", // <-- DÁN LINK ẢNH NHÂN VẬT 3 VÀO ĐÂY
    name: "MẶC CỬU CA",
    role: "Chủ Tiệm Cầm Đồ Điểm Mù • Trùm Buôn Lậu",
    theme: "acid",
    sector: "ĐIỆN 7 — KHU PHẢN BỘI",
    scenarioTag: "KỊCH BẢN 03 // MẠT THẾ",
    pbTag: "GIÁ: 1 BÍ MẬT",
    scenarioTitle: "KHO ĐẠN CHỢ ĐEN GIỮA VÙNG NHIỄU SÓNG",
    story: "Kẻ đào tẩu chuyên bán thuốc giảm đau lách luật và chip phá sóng cho Con nợ bị đồng đội đâm sau lưng — không nhận điểm Phước Báu, chỉ đổi bằng bí mật đời tư.",
    quote: "“Hệ thống thu 80% phí máu. Còn tôi chỉ lấy thứ bạn không dám kể lúc nửa đêm.”"
  },
  {
    id: "diep-thanh-yen",
    code: "ID // VIP-04",
    badge: "GIÁM NGỤC",
    emblem: "🦩",
    avatarUrl: "./assets/assets/OPW/Hethongbaoung/04.png", // <-- DÁN LINK ẢNH NHÂN VẬT 4 VÀO ĐÂY
    name: "DIỆP THANH YÊN",
    role: "Độc Hậu Truyền Thông • Giám Ngục Điện Đố Kỵ",
    theme: "cyber-violet",
    sector: "ĐIỆN 4 — KHU ĐỐ KỴ",
    scenarioTag: "KỊCH BẢN 04 // HÀO MÔN",
    pbTag: "THƯỞNG +4,800 PB",
    scenarioTitle: "SẢNH ĐẤU GIÁ PHÁT SÓNG TRỰC TIẾP SỔ ĐEN",
    story: "Nắm quyền điều khiển mọi màn hình LED. Cô không triệt hạ kẻ phản bội trong bóng tối — cô phát thẳng đoạn ghi âm bán đứng người thân của chúng trước triệu khán giả.",
    quote: "“Đừng xin lỗi trong phòng kín. Ra trước ống kính 4K rồi quỳ cho đúng góc máy.”"
  },
  {
    id: "a-luc-808",
    code: "ID // #808",
    badge: "XUI XẺO S+",
    emblem: "🦜",
    avatarUrl: "./assets/assets/OPW/Hethongbaoung/05.png", // <-- DÁN LINK ẢNH NHÂN VẬT 5 VÀO ĐÂY
    name: "A LỤC (#808)",
    role: "Thực Tập Sinh Sao Quả Tạ • Cục Tầng Dưới",
    theme: "acid",
    sector: "ĐIỆN 2 — KHU THAM LAM",
    scenarioTag: "KỊCH BẢN 05 // HÀI HƯỚC ĐEN",
    pbTag: "VẬN MAY: -999%",
    scenarioTitle: "TIỆC CƯỚI HÀO MÔN & CÚ TRƯỢT CHÂN ĐỊNH MỆNH",
    story: "Bị Debuff Cạn Phước đeo bám vĩnh viễn: chỉ định bưng khay rượu vang dọn bàn nhưng lại trượt chân kéo sập màn chiếu, làm lộ nguyên clip ngoại tình của thiên kim giả.",
    quote: "“Ơ... em thề em chỉ định lau sàn thôi mà, sao ổ cứng ngoại tình lại cắm sẵn vào máy chiếu thế?!”"
  },
  {
    id: "quy-co-v00",
    code: "OMEGA // ???",
    badge: "NIÊM PHONG",
    emblem: "🦈",
    avatarUrl: "./assets/assets/OPW/Hethongbaoung/06.png", // <-- DÁN LINK ẢNH NHÂN VẬT 6 VÀO ĐÂY
    name: "QUÝ CÔ [V.00]",
    role: "Chủ Nợ Tối Cao • Người Viết Lại Luật Nhân Quả",
    theme: "crimson-karma",
    sector: "ĐIỆN 10 — KHU VÔ GIAN",
    scenarioTag: "KỊCH BẢN 06 // ERROR 403",
    pbTag: "CLEARANCE OMEGA",
    scenarioTitle: "HỒ SƠ BỊ XÓA & LỖ HỔNG TÀI KHOẢN 80%",
    story: "Toàn bộ 80% phí dịch vụ thu từ mọi Con nợ đều đổ về tài khoản vô danh của cô. Chạm vào thẻ này sẽ kích hoạt lệnh báo động xâm nhập cấp Omega toàn hệ thống.",
    quote: "“Ngươi tưởng mình đang đi đòi nợ nhân quả? Không — ngươi chính là món hàng trong sổ cái của ta.”",
    isTwist: true
  }
];

const vrBg = initVRCanvas();
const radio = new SystemRadio();

const htmlEl = document.documentElement;
const stageFrame = document.getElementById("trailer-stage");
const bgImageLayer = document.getElementById("bg-image-layer");

const sceneIntro = document.getElementById("scene-intro");
const sceneShowcase = document.getElementById("scene-showcase");
const sceneOutro = document.getElementById("scene-outro");

const carouselViewport = document.getElementById("tr-carousel-viewport");
const carouselTrack = document.getElementById("tr-carousel-track");
const dotsBar = document.getElementById("tr-dots-bar");

const badgeScene = document.getElementById("tr-scene-badge");
const cardCounter = document.getElementById("tr-card-counter");
const sectorKicker = document.getElementById("tr-sector-kicker");
const scenarioTag = document.getElementById("tr-scenario-tag");
const pbTag = document.getElementById("tr-pb-tag");
const scenarioTitle = document.getElementById("tr-scenario-title");
const scenarioStory = document.getElementById("tr-scenario-story");
const scenarioQuote = document.getElementById("tr-scenario-quote");
const autoProgressFill = document.getElementById("tr-auto-progress");
const twistFlash = document.getElementById("tr-twist-flash");
const countdownOverlay = document.getElementById("tr-countdown-overlay");
const countdownNum = document.getElementById("tr-countdown-num");

const dockCurrentNpc = document.getElementById("dock-current-npc");
const rngDwell = document.getElementById("rng-dwell");
const lblDwellSec = document.getElementById("lbl-dwell-sec");
const chkBgm = document.getElementById("chk-bgm");

let activeIdx = 0;
let carouselPos = 0;
let carouselTarget = 0;
let carouselRaf = null;
let isDragging = false;
let activePointerId = null;
let dragAxis = null;
let dragStartX = 0, dragStartY = 0, dragLastX = 0, dragStartPos = 0, dragVel = 0, dragMoved = 0;

let typeTimer = null;
let autoTimers = [];
let autoProgressRaf = null;
let isAutoRunning = false;
let dwellMs = 3800;

function syncBgForTheme(themeName) {
  const cfg = SITE_CONFIG.backgroundImage;
  const imgUrl = (cfg?.byTheme && cfg.byTheme[themeName]) || cfg?.defaultUrl || "";
  if (imgUrl.trim()) {
    bgImageLayer.style.backgroundImage = `url("${imgUrl.trim()}")`;
    bgImageLayer.style.opacity = String(cfg.opacity ?? 0.42);
  } else {
    bgImageLayer.style.backgroundImage = "none";
    bgImageLayer.style.opacity = "0";
  }
}

function setTrailerTheme(themeName) {
  htmlEl.setAttribute("data-theme", themeName || "orbital-cyan");
  syncBgForTheme(themeName || "orbital-cyan");
}

function playSfxIfAllowed(fnName) {
  if (chkBgm && !chkBgm.checked) return;
  try { radio[fnName]?.(); } catch (_) {}
}

// Dựng các thẻ nhân vật vào Carousel 3D
const cardElements = [];
const dotElements = [];

function buildCastCards() {
  carouselTrack.innerHTML = "";
  dotsBar.innerHTML = "";
  cardElements.length = 0;
  dotElements.length = 0;

  TRAILER_CAST.forEach((npc, idx) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = `tr-char-card ${idx === 0 ? "is-active" : ""}`;
    card.innerHTML = `
      <div class="tr-card-meta">
        <span>${npc.code}</span>
        <em>${npc.badge}</em>
      </div>
      <div class="tr-portrait-slot">
        ${
          (npc.avatarUrl || "").trim()
            ? `<img src="${npc.avatarUrl.trim()}" alt="${npc.name}" />`
            : `<div class="tr-portrait-placeholder"><span>${npc.emblem}</span><small>[ CHỜ ẢNH NHÂN VẬT ]</small></div>`
        }
        <div class="tr-scan-beam"></div>
      </div>
      <strong class="tr-char-name">${npc.name}</strong>
      <small class="tr-char-role">${npc.role}</small>
    `;
    card.addEventListener("click", () => {
      if (dragMoved > 10) return;
      stopAutoDirector(false);
      selectCard(idx, true);
    });
    carouselTrack.appendChild(card);
    cardElements.push(card);

    const dot = document.createElement("button");
    dot.type = "button";
    dot.className = `tr-dot ${idx === 0 ? "is-active" : ""}`;
    dot.setAttribute("aria-label", npc.name);
    dot.addEventListener("click", () => {
      stopAutoDirector(false);
      selectCard(idx, true);
    });
    dotsBar.appendChild(dot);
    dotElements.push(dot);
  });
}

function getWrappedDelta(index, centerPos) {
  const n = TRAILER_CAST.length;
  let d = (((index - centerPos) % n) + n) % n;
  if (d > n / 2) d -= n;
  return d;
}

function layoutCards() {
  const vpW = carouselViewport?.clientWidth || 320;
  const spacing = Math.max(150, vpW * 0.54);
  cardElements.forEach((card, i) => {
    const d = getWrappedDelta(i, carouselPos);
    const absD = Math.abs(d);
    const x = d * spacing;
    const z = 24 - (absD * absD * 34 + absD * 64);
    const rotY = Math.max(-42, Math.min(42, -d * 24));
    const scale = Math.max(0.68, 1.02 - absD * 0.16);
    const opacity = absD > 1.85 ? Math.max(0, 1 - (absD - 1.85) * 2.2) : Math.max(0.38, 1 - absD * 0.28);

    card.style.transform = `translate3d(calc(-50% + ${x.toFixed(1)}px), -50%, ${z.toFixed(1)}px) rotateY(${rotY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
    card.style.opacity = opacity.toFixed(3);
    card.style.zIndex = String(Math.round(60 - absD * 12));
    card.style.pointerEvents = opacity < 0.12 ? "none" : "auto";
  });
}

function ensureCarouselLoop() {
  if (!carouselRaf) carouselRaf = requestAnimationFrame(animateCarousel);
}

function animateCarousel() {
  carouselRaf = null;
  if (!isDragging) {
    const diff = carouselTarget - carouselPos;
    if (Math.abs(diff) < 0.001) {
      carouselPos = carouselTarget;
      layoutCards();
      return;
    }
    carouselPos += diff * 0.15;
  }
  layoutCards();
  if (isDragging || Math.abs(carouselTarget - carouselPos) >= 0.001) {
    carouselRaf = requestAnimationFrame(animateCarousel);
  }
}

function typewriteStory(text) {
  clearInterval(typeTimer);
  scenarioStory.textContent = "";
  let i = 0;
  typeTimer = setInterval(() => {
    scenarioStory.textContent = text.slice(0, (i += 2));
    if (i >= text.length) clearInterval(typeTimer);
  }, 16);
}

function selectCard(idx, withSfx = false) {
  const n = TRAILER_CAST.length;
  activeIdx = ((idx % n) + n) % n;
  const npc = TRAILER_CAST[activeIdx];

  carouselTarget += getWrappedDelta(activeIdx, carouselTarget);
  ensureCarouselLoop();

  cardElements.forEach((c, i) => c.classList.toggle("is-active", i === activeIdx));
  dotElements.forEach((d, i) => d.classList.toggle("is-active", i === activeIdx));

  setTrailerTheme(npc.theme);
  if (withSfx) playSfxIfAllowed("playClickChime");

  cardCounter.textContent = `${String(activeIdx + 1).padStart(2, "0")} / ${String(n).padStart(2, "0")}`;
  sectorKicker.textContent = npc.sector;
  scenarioTag.textContent = npc.scenarioTag;
  pbTag.textContent = npc.pbTag;
  scenarioTitle.textContent = npc.scenarioTitle;
  scenarioQuote.textContent = npc.quote;
  if (dockCurrentNpc) dockCurrentNpc.textContent = npc.name;

  typewriteStory(npc.story);

  const cx = (stageFrame.clientWidth || 360) * 0.5;
  const cy = (stageFrame.clientHeight || 640) * 0.4;
  vrBg.spawnTouchRipple(cx, cy);
}

function showScene(name) {
  sceneIntro.classList.toggle("hidden", name !== "intro");
  sceneShowcase.classList.toggle("hidden", name !== "showcase");
  sceneOutro.classList.toggle("hidden", name !== "outro");
  if (name === "intro") badgeScene.textContent = "INTRO // 00";
  if (name === "showcase") badgeScene.textContent = "CHỌN KỊCH BẢN // 9:16";
  if (name === "outro") badgeScene.textContent = "OUTRO // VR-00";
  if (name === "showcase") requestAnimationFrame(layoutCards);
}

function triggerTwistGlitch(durationMs = 1500) {
  twistFlash.classList.remove("hidden");
  playSfxIfAllowed("playFlipChime");
  if (chkBgm?.checked) radio.playWarningSiren(durationMs / 1000);
  const t = setTimeout(() => {
    twistFlash.classList.add("hidden");
    radio.stopWarningSiren();
  }, durationMs);
  autoTimers.push(t);
}

function clearAutoTimers() {
  autoTimers.forEach((t) => clearTimeout(t));
  autoTimers = [];
  cancelAnimationFrame(autoProgressRaf);
  autoProgressFill.style.width = "0%";
  twistFlash.classList.add("hidden");
  radio.stopWarningSiren();
}

function stopAutoDirector(exitCleanMode = true) {
  isAutoRunning = false;
  clearAutoTimers();
  countdownOverlay.classList.add("hidden");
  if (exitCleanMode) {
    stageFrame.classList.remove("is-clean-rec");
    document.getElementById("btn-clean-exit")?.classList.add("hidden");
    radio.stop();
  }
}

function startDwellProgress(durationMs) {
  const startAt = performance.now();
  function step(now) {
    if (!isAutoRunning) return;
    const pct = Math.min(100, ((now - startAt) / durationMs) * 100);
    autoProgressFill.style.width = `${pct.toFixed(1)}%`;
    if (pct < 100) autoProgressRaf = requestAnimationFrame(step);
  }
  autoProgressRaf = requestAnimationFrame(step);
}

function runAutoSequence(withCountdown = true) {
  stopAutoDirector(false);
  isAutoRunning = true;
  stageFrame.classList.add("is-clean-rec");
  document.getElementById("btn-clean-exit")?.classList.remove("hidden");

  if (chkBgm?.checked && !radio.isPlaying) {
    radio.play();
  }

  const beginTimeline = () => {
    if (!isAutoRunning) return;
    countdownOverlay.classList.add("hidden");
    setTrailerTheme("orbital-cyan");
    showScene("intro");

    // Sau Intro 2.8s -> sang Cảnh Lướt Thẻ Nhân Vật & Kịch Bản
    autoTimers.push(setTimeout(() => {
      if (!isAutoRunning) return;
      showScene("showcase");
      playSfxIfAllowed("playFlipChime");

      let stepIdx = 0;
      const runCardStep = () => {
        if (!isAutoRunning) return;
        const npc = TRAILER_CAST[stepIdx];
        selectCard(stepIdx, true);

        const thisDwell = npc.isTwist ? dwellMs + 800 : dwellMs;
        startDwellProgress(thisDwell);

        if (npc.isTwist) {
          autoTimers.push(setTimeout(() => {
            if (isAutoRunning) triggerTwistGlitch(1450);
          }, 1100));
        }

        autoTimers.push(setTimeout(() => {
          if (!isAutoRunning) return;
          stepIdx += 1;
          if (stepIdx < TRAILER_CAST.length) {
            runCardStep();
          } else {
            setTrailerTheme("orbital-cyan");
            showScene("outro");
            playSfxIfAllowed("playClickChime");
            autoTimers.push(setTimeout(() => {
              if (!isAutoRunning) return;
              // Kết thúc đẹp, giữ màn outro thêm 1.5s rồi trả lại nút
              stopAutoDirector(true);
            }, 3400));
          }
        }, thisDwell));
      };

      runCardStep();
    }, 2800));
  };

  if (!withCountdown) {
    beginTimeline();
    return;
  }

  let count = 3;
  countdownNum.textContent = String(count);
  countdownOverlay.classList.remove("hidden");
  const cdTick = () => {
    if (!isAutoRunning) return;
    count -= 1;
    if (count > 0) {
      countdownNum.textContent = String(count);
      playSfxIfAllowed("playClickChime");
      autoTimers.push(setTimeout(cdTick, 800));
    } else {
      beginTimeline();
    }
  };
  playSfxIfAllowed("playClickChime");
  autoTimers.push(setTimeout(cdTick, 800));
}

// Kéo / vuốt trái-phải 3D trên màn hình cảm ứng & chuột
carouselViewport?.addEventListener("pointerdown", (e) => {
  stopAutoDirector(false);
  isDragging = true;
  activePointerId = e.pointerId;
  dragAxis = null;
  dragStartX = dragLastX = e.clientX;
  dragStartY = e.clientY;
  dragStartPos = carouselPos;
  dragVel = 0;
  dragMoved = 0;
  carouselViewport.classList.add("is-dragging");
  ensureCarouselLoop();
});

window.addEventListener("pointermove", (e) => {
  if (!isDragging || e.pointerId !== activePointerId) return;
  const dxTotal = e.clientX - dragStartX;
  const dyTotal = e.clientY - dragStartY;
  if (!dragAxis && (Math.abs(dxTotal) > 6 || Math.abs(dyTotal) > 6)) {
    dragAxis = Math.abs(dyTotal) > Math.abs(dxTotal) ? "y" : "x";
  }
  if (dragAxis === "y") {
    isDragging = false;
    activePointerId = null;
    carouselViewport.classList.remove("is-dragging");
    carouselTarget = Math.round(carouselPos);
    ensureCarouselLoop();
    return;
  }
  const dxStep = e.clientX - dragLastX;
  dragLastX = e.clientX;
  dragMoved = Math.abs(dxTotal);
  const stepPx = Math.max(150, (carouselViewport?.clientWidth || 320) * 0.54);
  carouselPos = dragStartPos - dxTotal / stepPx;
  dragVel = -dxStep / stepPx;
});

function finishDrag(e) {
  if (!isDragging || (activePointerId !== null && e.pointerId !== activePointerId)) return;
  isDragging = false;
  activePointerId = null;
  carouselViewport.classList.remove("is-dragging");
  if (dragMoved > 10) {
    const targetIdx = Math.round(carouselPos + dragVel * 1.8);
    selectCard(targetIdx, true);
  }
  ensureCarouselLoop();
  setTimeout(() => { dragMoved = 0; }, 45);
}
window.addEventListener("pointerup", finishDrag);
window.addEventListener("pointercancel", finishDrag);

// Nút bấm trái / phải & bàn phím
document.getElementById("tr-btn-prev")?.addEventListener("click", () => { stopAutoDirector(false); selectCard(activeIdx - 1, true); });
document.getElementById("tr-btn-next")?.addEventListener("click", () => { stopAutoDirector(false); selectCard(activeIdx + 1, true); });
window.addEventListener("keydown", (e) => {
  if (sceneShowcase.classList.contains("hidden")) return;
  if (e.key === "ArrowLeft") { stopAutoDirector(false); selectCard(activeIdx - 1, true); }
  if (e.key === "ArrowRight") { stopAutoDirector(false); selectCard(activeIdx + 1, true); }
});

// Nút Intro / Mobile / Director Dock
document.getElementById("btn-intro-start")?.addEventListener("click", () => {
  showScene("showcase");
  selectCard(0, true);
});
document.getElementById("btn-play-auto")?.addEventListener("click", () => runAutoSequence(true));
document.getElementById("btn-mobile-auto")?.addEventListener("click", () => runAutoSequence(true));
document.getElementById("btn-mobile-manual")?.addEventListener("click", () => {
  stopAutoDirector(true);
  showScene("showcase");
  selectCard(activeIdx, true);
});
document.getElementById("btn-stop-auto")?.addEventListener("click", () => stopAutoDirector(true));
document.getElementById("btn-clean-exit")?.addEventListener("click", () => stopAutoDirector(true));
document.getElementById("btn-outro-replay")?.addEventListener("click", () => runAutoSequence(false));

document.getElementById("btn-jump-intro")?.addEventListener("click", () => { stopAutoDirector(true); showScene("intro"); });
document.getElementById("btn-jump-cards")?.addEventListener("click", () => { stopAutoDirector(true); showScene("showcase"); selectCard(activeIdx, false); });
document.getElementById("btn-jump-outro")?.addEventListener("click", () => { stopAutoDirector(true); showScene("outro"); });

rngDwell?.addEventListener("input", () => {
  const sec = Number(rngDwell.value);
  dwellMs = Math.round(sec * 1000);
  if (lblDwellSec) lblDwellSec.textContent = `${sec.toFixed(1)}s`;
});

// Nạp thử ảnh từ máy ngay trong Director Dock để quay video nhanh
document.getElementById("dock-upload-avatar")?.addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  e.target.value = "";
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    TRAILER_CAST[activeIdx].avatarUrl = String(reader.result || "");
    const keepIdx = activeIdx;
    buildCastCards();
    showScene("showcase");
    selectCard(keepIdx, true);
  };
  reader.readAsDataURL(file);
});

window.addEventListener("resize", layoutCards);

// Khởi tạo
buildCastCards();
setTrailerTheme("orbital-cyan");
showScene("intro");
selectCard(0, false);