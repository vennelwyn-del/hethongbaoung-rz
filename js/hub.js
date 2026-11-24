// js/hub.js — Full Hub VR 3D + Live Preview + Báo Ứng Net + Tab 07 Hồ Sơ Mật (Giải đố & Lỗi Xâm Nhập Sd.)

import { initBioHologram } from "./bio-holo.js";
import { initInvertedPyramid3D } from "./pyramid-3d.js";
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
  fetchForumComments,
  postForumComment,
  logoutSimpleAccount
} from "./firebase.js";

initBioHologram();
const vrBg = initVRCanvas();
const radio = new SystemRadio();

const DEFAULT_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' fill='%23041634'/><text x='32' y='40' font-size='28' text-anchor='middle' fill='%2300E5FF'>⚖️</text></svg>";
const ANON_AVATAR = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><rect width='64' height='64' fill='%23081226'/><text x='32' y='41' font-size='28' text-anchor='middle' fill='%235EA8FF'>🎭</text></svg>";
const VALID_THEMES = ["orbital-cyan", "cyber-violet", "acid", "crimson-karma"];

let savedTheme = localStorage.getItem("bao_ung_theme") || "orbital-cyan";
if (!VALID_THEMES.includes(savedTheme)) savedTheme = "orbital-cyan";

const state = {
  theme: savedTheme,
  sfx: SITE_CONFIG.effects.sfx,
  scanlines: SITE_CONFIG.effects.scanlines,
  pb: null,
  debtorCode: "CHƯA CẤP",
  contractLocked: false,
  selectedSector: "Điện 1 — Khu Vọng Ngữ",
  selectedPkg: "Gói Báo Ứng Pháp Đình",
  manifestForm: "pos",
  username: getSavedSessionUsername(),
  currentProfile: null,
  forumPostMode: "account",
  extraForumSysPosts: [],
  lastDossierText: "",
  draftAudit: null,
  selectedPyramidTier: 1,
  activeTabId: "tab-profile",
  vaultUnlocked: false,
  vaultHintStep: 0
};

const SECTORS = [
  { id: 1, zone: "KHỐI HIỆN ĐẠI", name: "Điện 1 — Khu Vọng Ngữ", sub: "Showbiz & Bạo lực mạng", region: "Thảm đỏ, hậu trường, phòng livestream lúc 3h sáng.", desc: "Đỉnh lưu trà xanh cướp tác phẩm, mua thủy quân vu khống ép nguyên chủ tự sát.", rule: "Bắt buộc tung bằng chứng trực tiếp trên sóng truyền hình trước Đêm trao giải." },
  { id: 2, zone: "KHỐI HIỆN ĐẠI", name: "Điện 2 — Khu Tham Lam", sub: "Hào môn & Thật giả thiên kim", region: "Biệt thự cẩm thạch, bàn tiệc cổ đông & phòng mổ tư nhân.", desc: "Con nuôi cướp công, cha mẹ ruột ép hiến tạng/gánh nợ.", rule: "Cấm nhận một đồng tiền bố thí gia tộc; phải thu hồi tín vật gốc." },
  { id: 3, zone: "KHỐI HIỆN ĐẠI", name: "Điện 3 — Khu Ái Dục", sub: "Ngược tra & Thế thân", region: "Biệt thự tân hôn lạnh lẽo & phòng lấy máu bệnh viện.", desc: "Tra nam coi nguyên chủ là túi máu dự trữ cho Bạch nguyệt quang.", rule: "Mềm lòng tha thứ dù chỉ 1% → Trừ 10,000 PB & Thanh lý ngay." },
  { id: 4, zone: "KHỐI CỔ ĐẠI", name: "Điện 4 — Khu Đố Kỵ", sub: "Cung đấu & Quyền mưu", region: "Lãnh cung tuyết trắng, mái hiên son thếp vàng.", desc: "Thứ nữ/Sủng phi đầu độc mãn tính & vu oan hại sạch gia tộc nguyên chủ.", rule: "Độc phát tác mỗi đêm trăng tròn; cấm phạm tội khi quân khi chưa nắm binh quyền." },
  { id: 5, zone: "KHỐI CỔ ĐẠI", name: "Điện 5 — Khu Ngạo Mạn", sub: "Tu tiên & Phế vật nghịch tập", region: "Đài Trảm Tiên, Đại điện Tông môn & Hàn Băng Ngục.", desc: "Sư tôn móc Linh căn ghép cho tiểu sư muội rồi ném xuống đáy ngục.", rule: "Phải vạch trần Linh căn giả bị phản phệ trước Thập Đại Tiên Môn." },
  { id: 6, zone: "KHỐI HỌC THUẬT", name: "Điện 6 — Khu Đạo Văn", sub: "Học bá & Khoa học", region: "Phòng thí nghiệm hóa chất, giảng đường đại học.", desc: "Giáo sư/Con ông cháu cha cướp đề án quốc gia.", rule: "Cấm dùng bạo lực; phải chứng minh thực nghiệm trong 72h." },
  { id: 7, zone: "KHỐI SINH TỒN", name: "Điện 7 — Khu Phản Bội", sub: "Mạt thế & Zombie", region: "Thành phố đổ nát ngập mùi máu & căn cứ thép gai.", desc: "Đồng đội đâm sau lưng cướp nhẫn Không Gian rồi đẩy ra ngoài.", rule: "Cơ thể nhiễm virus 85%, cần tinh hạch kìm hãm mỗi 48h." },
  { id: 8, zone: "KHỐI ĐẶC THÙ", name: "Điện 8 — Khu Giả Dối", sub: "Y thuật & Huyền học", region: "Phố đồ cổ hương trầm giả & phòng VIP bệnh viện.", desc: "Thần y rởm phản sư dùng tà thuật mượn mệnh trục lợi.", rule: "Cấm cứu người miễn phí; bắt kẻ thù dập đầu nhận sai trước." },
  { id: 9, zone: "KHỐI ĐẶC THÙ", name: "Điện 9 — Khu Phẫn Nộ", sub: "E-Sports & Đấu trường", region: "Sân vận động Chung kết Thế giới rực đèn LED.", desc: "Đội trưởng bán độ đổ tội lên nguyên chủ và đánh gãy tay.", rule: "Tay phải chấn thương chỉ chịu được cường độ cao 15 phút/hiệp." },
  { id: 10, zone: "ĐÁY CHÓP TỐI THƯỢNG (SSS)", name: "Điện 10 — Khu Vô Gian", sub: "Nghịch tập Khí Vận Chi Tử", region: "Trung tâm Lõi Cục Báo Ứng — Nơi ẩn giấu chân tướng Sd.", desc: "Đấu trường cấp SSS: Đánh sập cặp đôi con cưng Thiên Đạo tiêu chuẩn kép.", rule: "Bị Thiên Đạo ghét bỏ (vận đen x2). Mở khóa 3 tầng manh mối Sd." }
];

const TAB_TITLES = {
  "tab-profile": "HỢP ĐỒNG LAO ĐỘNG & TẠO PROMPT",
  "tab-pyramid": "SƠ ĐỒ THÁP BÁO ỨNG 3D",
  "tab-ranking": "BẢNG XẾP HẠNG CON NỢ 24H",
  "tab-sectors": "KHO TRỌNG ÁN & MÔ PHỎNG !NHIEMVU",
  "tab-market": "CHỢ ĐEN LỤC NHA & HÌNH THÁI !HETHONG",
  "tab-forum": "BÁO ỨNG NET v4.0 (!DIENDAN)",
  "tab-vault": "KHO HỒ SƠ MẬT NHÂN SỰ CỤC (BẢO MẬT)"
};

const CONTRACT_PACKAGES = [
  {
    id: "ta-vo-cuu",
    title: "⚖️ GÓI BÁO ỨNG PHÁP ĐÌNH (Tạ Vô Cữu)",
    desc: "100% dùng chứng cứ pháp lý & kiểm toán công khai. Giảm phí Hệ thống 80% → 65%; phạm pháp bị phạt gấp đôi."
  },
  {
    id: "ngu-hong-diep",
    title: "🩸 GÓI HỎA TÁNG TRÀNG (Ngu Hồng Diệp)",
    desc: "Ép Kẻ Cướp Phước phản bội lẫn nhau và tự thú 100%. Thưởng nóng +1,000 PB; thời hạn nhiệm vụ rút ngắn 20%."
  },
  {
    id: "sd-double",
    title: "🎲 GÓI CƯỢC MẠNG NHÂN ĐÔI (Quỹ Sd.)",
    desc: "Nhân đôi tần suất Debuff Cạn Phước suốt nhiệm vụ. Thu hồi PB x2.0; thua thuộc sở hữu trực tiếp của Chủ nợ tối cao Sd."
  }
];

const UNIQUE_CASE_POOL = [
  { sector: "ĐIỆN 1 — VỌNG NGỮ", rank: "S", reward: "+3,400 PB", title: "Đoạn Phim Hiện Trường Bị Đánh Tráo", body: "Phó đạo diễn tài liệu điều tra sai phạm tập đoàn, bị đỉnh lưu mua chuộc ê-kíp ghép mặt AI bôi nhọ. Giới hạn: Phải giải mã file RAW trước lễ trao giải 60 giờ." },
  { sector: "ĐIỆN 2 — THAM LAM", rank: "S", reward: "+4,100 PB", title: "Khế Ước Cầu Vượt Bê Tông Rút Ruột", body: "Kỹ sư trưởng bị em nuôi giả mạo chữ ký gánh tội sập cầu. Giới hạn: Không được rời khu vực quản thúc quá 5km; thu hồi mẫu lõi bê tông thật." },
  { sector: "ĐIỆN 3 — ÁI DỤC", rank: "A", reward: "+2,950 PB", title: "Khứu Giác Bị Đầu Độc Của Nhà Điều Hương", body: "Nhà chế tác nước hoa bị vị hôn phu dùng dung môi độc làm tê liệt khứu giác để giả chết rồi đấu giá tác phẩm của nguyên chủ giá gấp trăm lần. Giới hạn: Cấm tha thứ." },
  { sector: "ĐIỆN 4 — ĐỐ KỴ", rank: "S", reward: "+4,800 PB", title: "Sổ Thuế Muối Lãnh Cung Đêm Trừ Tịch", body: "Đích nữ bị vu oan dùng cổ trùng, bị đày lãnh cung giữ nửa cuốn mật chiếu sổ muối. Giới hạn: Độc hàn phát tác mỗi canh ba." },
  { sector: "ĐIỆN 6 — ĐẠO VĂN", rank: "A", reward: "+2,600 PB", title: "Thuật Toán Mã Lõi Sai Số 0.03%", body: "Nghiên cứu sinh bị giáo sư hướng dẫn cướp trắng thuật toán lượng tử trước hội đồng quốc tế. Giới hạn: Cấm bạo lực, chứng minh thực nghiệm trong 72h." },
  { sector: "ĐIỆN 8 — GIẢ DỐI", rank: "S", reward: "+3,750 PB", title: "Trận Pháp Đổi Mệnh Dưới Chậu Lan Đột Biến", body: "Truyền nhân phong thủy bị gãy tay vì từ chối đổi mệnh giúp kẻ phản sư. Giới hạn: Kẻ thù phải tự dập đầu nhận sai trước ống kính mới được phá trận." },
  { sector: "ĐIỆN 9 — PHẪN NỘ", rank: "A", reward: "+3,150 PB", title: "Bản Ghi Voice Chat Bán Độ Phút 28", body: "Xạ thủ chủ lực bị đội trưởng bỏ thuốc tê thần kinh cổ tay trước chung kết. Giới hạn: Tay phải chỉ chịu được APM tối đa 15 phút/ván." },
  { sector: "ĐIỆN 10 — VÔ GIAN", rank: "SSS", reward: "+9,500 PB", title: "Hồ Sơ Dấu Mực Hoa Bốn Cánh", body: "Phản diện bị Thiên Đạo ép gánh tội diệt môn thay đôi nam-nữ chính tiêu chuẩn kép. Giới hạn: Vận đen nhân đôi; thu thập mảnh hào quang có hình chìm Sd." }
];

const MANIFEST_FORMS = {
  pos: {
    label: "POS ĐEN HIỆN ĐẠI",
    desc: "【HÌNH THÁI VẬT LÝ — KHỐI HIỆN ĐẠI】: Một chiếc máy quẹt thẻ POS vỏ đen bóng lạnh toát tự xuất hiện trên mặt bàn gần nhất. Người ngoài nhìn vào chỉ thấy cục nhựa vô tri; riêng bạn nghe rõ tiếng mô-tơ “rẹt… rẹt…” nhả cuộn hóa đơn nhiệt in mực đỏ máu từng khoản phí nhỏ nhặt (-1.00 PB phí hao mòn phần cứng)."
  },
  abacus: {
    label: "BÀN TÍNH & QUẠ ĐEN",
    desc: "【HÌNH THÁI VẬT LÝ — KHỐI CỔ ĐẠI / TU TIÊN】: Bàn tính gỗ mun mất một hạt hoặc con quạ đen đeo thẻ đồng ở chân sà xuống mổ “cộc, cộc” lên trán Ký chủ mỗi khi trừ điểm, rồi nhả ra cuộn khế ước giấy dó đóng triện đỏ."
  },
  radio: {
    label: "RADIO QUÂN ĐỘI RỈ SÉT",
    desc: "【HÌNH THÁI VẬT LÝ — MẠT THẾ / VÔ GIAN】: Chiếc radio sắt quân đội rỉ sét rè rè tần số nhiễu 50Hz giữa đống đổ nát, đọc vang biên lai trừ nợ không sót một số lẻ nào bằng giọng tổng đài viên vô cảm."
  }
};

const MARKET_ITEMS = [
  { name: "Adrenaline & Thuốc cầm cự (6 giờ)", costPB: -50, note: "Hệ Thống 00 (+5 PB phí tiêm) — Giữ tỉnh táo, vết thương vật lý vẫn nguyên vẹn." },
  { name: "Khóa Debuff 'Cạn Phước' tạm thời (3 Turn)", costPB: -200, note: "Hệ Thống 00 — Tránh hỏng micro, gãy gót giày khi tung bằng chứng." },
  { name: "Mở khóa Ký ức bị tổn thương của Nguyên chủ", costPB: -150, note: "Hệ Thống 00 — Chỉ nhớ lại dữ kiện chính mắt nguyên chủ từng thấy." },
  { name: "Phí Gia Hạn Hơi Thở / Kích Tim Cấp Cứu (24h)", costPB: -350, note: "Hệ Thống 00 — Mua thêm 24h thoi thóp kèm hóa đơn tiền điện." },
  { name: "Máy ghi âm mini & Bộ mở khóa cơ (Chợ Đen Lục Nha)", costPB: -25, note: "Phí môi giới tọa độ hẻm sau; Ký chủ tự tay đi gài máy & chịu rủi ro." }
];

const FORUM_POSTS_BASE = [
  { authorLabel: "@Phòng_Kiểm_Toán [GHIM]", authorSub: "Hệ Thống • Ghim toàn server", avatarUrl: DEFAULT_AVATAR, body: "Cảnh báo kỷ luật: Tuần này có 14 Con nợ tại Điện 3 bị thanh lý thẳng tay vì mềm lòng nghe tra nam khóc lóc dưới mưa." },
  { authorLabel: "@Thực_Tập_Sinh_707 (Tiểu Thất)", authorSub: "Thực tập sinh Cục Báo Ứng", avatarUrl: DEFAULT_AVATAR, body: "Đại ca ơi em thề là em chỉ định bê chậu nước đi đổ thôi, ai ngờ trượt chân hất trúng ổ cắm máy chiếu... tự nhiên phát luôn clip ngoại tình của thiên kim giả trong nhà kho!" },
  { authorLabel: "@Quạ_Đen_Chợ_Đen (Lục Nha)", authorSub: "Chợ Đen Tầng Dưới", avatarUrl: DEFAULT_AVATAR, body: "Ai đang kẹt ở Điện 1, 2, 3 cần máy ghi âm giấu kín hay thuốc giảm đau không tính lãi Hệ thống thì ghé tiệm cầm đồ cuối hẻm." }
];

const FORUM_EXTRA_POOL = [
  { authorLabel: "@Lão_Làng_Thập_Điện", authorSub: "Ký chủ vượt 7 Điện", avatarUrl: ANON_AVATAR, body: "Mẹo sống còn: Đừng bao giờ cầm USB bản gốc vào phòng kín đe dọa kẻ thù khi chưa có camera trực tiếp hoặc người của Tạ Vô Cữu ở ngoài. Nó đánh cướp bản gốc ngay tại chỗ đấy!" },
  { authorLabel: "@Con_Nợ_Ẩn_Danh", authorSub: "Ẩn danh", avatarUrl: ANON_AVATAR, body: "Vừa thắng kiện tống cổ gã tổng tài vào tù xong, bước ra cổng tòa án oai phong lẫm liệt thì gãy gót giày lăn xuống cầu thang. Hệ Thống 00 lập tức trừ -2 PB phí làm trầy đá hoa cương bậc thềm." },
  { authorLabel: "@Tin_Đồn_Tầng_Thượng", authorSub: "Tin mật nội bộ", avatarUrl: ANON_AVATAR, body: "Đêm qua lại thấy Quý Cô tóc trắng cài hoa bốn cánh đứng ở lô VIP cao nhất sảnh đấu giá. Không ai tra ra nổi dòng tiền 80% phí dịch vụ chảy về tài khoản mang chữ ký Sd. cả..." }
];

// DỮ LIỆU 6 THẺ LẬT 3D KHO HỒ SƠ MẬT (THẺ 06 Sd. KHÓA BÁO ĐỘNG ĐỎ)
const VAULT_NPCS = [
  {
    id: "sys00",
    code: "ID // 00",
    clearance: "LEVEL 1",
    emblem: "🧮",
    name: "HỆ THỐNG 00",
    role: "Kế Toán Viên Kiểm Toán",
    artifact: "Bàn Tính Gãy & Cuộn Hóa Đơn Nhiệt",
    scent: "Mùi giấy in nhiệt nóng rực & đồng xu kim loại",
    bio: "Chương trình kiểm toán tự động mang tư duy tư bản tuyệt đối. Không an ủi, chỉ báo giá nẹp xương trả góp 18%/tuần và trừ thẳng 80% phí dịch vụ khi kết toán.",
    quote: "“Khuyến nghị Ký chủ giữ bình tĩnh để tiết kiệm chi phí y tế.”"
  },
  {
    id: "tavocuu",
    code: "ID // 01",
    clearance: "LEVEL 3",
    emblem: "⚖️",
    name: "TẠ VÔ CỮU",
    role: "Tổng Kiểm Toán Trưởng",
    artifact: "Đồng hồ quả quýt bạc vỡ mặt kính chạy ngược",
    scent: "Tuyết lạnh đầu mùa, mực hồ sơ cũ & bạc hà khô",
    bio: "Cao 1m88, thường giáng lâm dưới vỏ bọc Thẩm phán Tòa án Tối cao hoặc Pháp y độc lập. Cực ghét ủy mị cẩu huyết; chỉ công chứng đòn vả mặt khi có đủ bằng chứng thép.",
    quote: "“Tôi đến để công chứng bản án kẻ thù giúp cô, hoặc ký giấy chứng tử cho cô.”"
  },
  {
    id: "lucnha",
    code: "ID // 02",
    clearance: "LEVEL 3",
    emblem: "🪙",
    name: "LỤC NHA",
    role: "Trùm Chợ Đen Xuyên Không",
    artifact: "Sợi dây đỏ treo đồng xu cổ dính máu & sẹo tia sét",
    scent: "Rượu trắng nặng độ, thuốc súng & đồng thau cũ",
    bio: "Ký chủ đào tẩu sống trong các điểm mù tín hiệu, chuyên mở tiệm cầm đồ hẻm tối. Bán vật tư vật lý lách luật (máy nghe lén, mở khóa cơ, thuốc giảm đau) lấy tiền mặt.",
    quote: "“Mua của con Hệ thống hút máu kia làm gì? Đưa năm trăm tệ đây anh lo cho.”"
  },
  {
    id: "nguhongdiep",
    code: "ID // 03",
    clearance: "LEVEL 3",
    emblem: "🚬",
    name: "NGU HỒNG DIỆP",
    role: "Giám Ngục Vọng Ngữ & Ái Dục",
    artifact: "Tẩu thuốc bạc chạm hoa bỉ ngạn & quạt ngà",
    scent: "Gỗ hồng mộc, rượu vang lâu năm & thuốc lá anh đào",
    bio: "Quản lý Điện 1 & Điện 3, thường xuất hiện với vỏ bọc Luật sư ly hôn bất bại hoặc Bà trùm truyền thông. Thưởng đậm cho màn Hỏa táng tràng tàn nhẫn, ghét cay kẻ lụy tình.",
    quote: "“Cưng định nghe hắn khóc thêm năm phút nữa hay tống hắn vào tù luôn chiều nay?”"
  },
  {
    id: "tieuthat",
    code: "ID // 04",
    clearance: "LEVEL 1",
    emblem: "🩹",
    name: "TIỂU THẤT (#707)",
    role: "Thực Tập Sinh Hậu Đậu",
    artifact: "Cuộn băng gạc & máy Casio liệt phím dấu cộng (+)",
    scent: "Băng y tế, bụi đất & mùi chập điện",
    bio: "Ký chủ đời trước vỡ nợ nên bị giữ lại làm lao động không lương. Thường nhập vào trợ lý hậu đậu hoặc mèo hoang; tai nạn vật lý của cậu hay vô tình bóc phốt kẻ thù.",
    quote: "“Đại ca ơi em trượt chân hất chậu nước trúng ổ máy chiếu... sao nó lại phát clip của ả vậy?!”"
  },
  {
    id: "sd",
    code: "OMEGA // Sd.",
    clearance: "LEVEL 5 [LOCKED]",
    emblem: "💠",
    name: "QUÝ CÔ 'Sd.'",
    role: "[DỮ LIỆU BỊ NIÊM PHONG]",
    isSd: true,
    bio: "ACCESS DENIED",
    quote: ""
  }
];

const ARCHETYPE_RANGES = { villain: [2500, 3900], jinx: [900, 1800], scapegoat: [500, 1400], slave: [1100, 2200], avenger: [3800, 5500] };

const htmlEl = document.documentElement;
const bgImageLayer = document.getElementById("bg-image-layer");
const receiptFeed = document.getElementById("receipt-feed");
const thermalPaper = document.getElementById("thermal-paper");
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
  const safeTheme = VALID_THEMES.includes(themeName) ? themeName : "orbital-cyan";
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
  btn.addEventListener("click", () => { if (state.sfx) radio.playClickChime(); applyTheme(btn.dataset.setTheme); })
);

// 2. CON TRỎ, SÓNG NỔ & NGHIÊNG CÁNH BUỒNG LÁI 3D
const wingLeft = document.querySelector(".wing-l");
const wingRight = document.querySelector(".wing-r");
const centerShell = document.getElementById("system-quest-shell");

window.addEventListener("pointermove", (e) => {
  if (touchCursor && cursorCoords) {
    touchCursor.style.left = `${e.clientX}px`;
    touchCursor.style.top = `${e.clientY}px`;
    cursorCoords.textContent = `X:${String(Math.round(e.clientX)).padStart(3, "0")} Y:${String(Math.round(e.clientY)).padStart(3, "0")}`;
  }
  if (SITE_CONFIG.effects.parallax3D && window.innerWidth > 1220) {
    const nx = (e.clientX / window.innerWidth - 0.5) * 2;
    const ny = (e.clientY / window.innerHeight - 0.5) * 2;
    if (wingLeft) wingLeft.style.transform = `rotateY(${(9 + nx * 2.5).toFixed(2)}deg) rotateX(${(-ny * 2).toFixed(2)}deg)`;
    if (wingRight) wingRight.style.transform = `rotateY(${(-9 + nx * 2.5).toFixed(2)}deg) rotateX(${(-ny * 2).toFixed(2)}deg)`;
    if (centerShell) centerShell.style.transform = `rotateY(${(nx * 1.1).toFixed(2)}deg) rotateX(${(-ny * 0.9).toFixed(2)}deg)`;
  }
});
window.addEventListener("pointerdown", (e) => vrBg.spawnTouchRipple(e.clientX, e.clientY));

// 3. RADIO SCOPE
const rScope = document.getElementById("radio-scope");
const rCtx = rScope?.getContext("2d");
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

const radioToggle = document.getElementById("radio-toggle");
const radioTrackName = document.getElementById("radio-track-name");
radioTrackName.textContent = radio.currentTrackName;
radioToggle.addEventListener("click", () => {
  const playing = radio.toggle();
  radioToggle.querySelector(".radio-icon").textContent = playing ? "❚❚" : "▶";
});
document.getElementById("radio-next").addEventListener("click", () => { radioTrackName.textContent = radio.nextTrack(); });
document.getElementById("radio-vol").addEventListener("input", (e) => radio.setVolume(e.target.value));

// 4. VÒNG XOAY THẺ CHỮ NHẬT DỌC 3D KHÉP KÍN (7 THẺ)
const galleryViewport = document.getElementById("gallery-viewport");
const tabCards = Array.from(document.querySelectorAll(".holo-tab-card"));
const TOTAL_TABS = tabCards.length;

let carouselPos = 0;
let carouselTarget = 0;
let isCarouselDragging = false;
let dragStartX = 0;
let dragLastX = 0;
let dragStartPos = 0;
let dragVelocity = 0;
let dragMoved = 0;

function getWrappedDelta(index, centerPos) {
  let d = (((index - centerPos) % TOTAL_TABS) + TOTAL_TABS) % TOTAL_TABS;
  if (d > TOTAL_TABS / 2) d -= TOTAL_TABS;
  return d;
}

function modIndex(val) {
  return ((Math.round(val) % TOTAL_TABS) + TOTAL_TABS) % TOTAL_TABS;
}

function layoutCoverflowCards() {
  const isMobile = window.innerWidth <= 680;
  const spacing = isMobile ? 196 : 254;

  tabCards.forEach((card, i) => {
    const d = getWrappedDelta(i, carouselPos);
    const absD = Math.abs(d);
    const x = d * spacing;
    const z = 34 - (absD * absD * 34 + absD * 68);
    const rotY = Math.max(-42, Math.min(42, -d * 21));
    const scale = Math.max(0.68, 1.04 - absD * 0.12);
    const opacity = absD > 2.25 ? Math.max(0, 1 - (absD - 2.25) * 2.5) : Math.max(0.32, 1 - absD * 0.22);

    card.style.transform = `translate3d(calc(-50% + ${x.toFixed(1)}px), -50%, ${z.toFixed(1)}px) rotateY(${rotY.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
    card.style.opacity = opacity.toFixed(3);
    card.style.zIndex = String(Math.round(80 - absD * 15));
    card.style.pointerEvents = opacity < 0.1 ? "none" : "auto";
  });
}

function animateCarousel() {
  if (!isCarouselDragging) {
    carouselPos += (carouselTarget - carouselPos) * 0.14;
  }
  layoutCoverflowCards();
  requestAnimationFrame(animateCarousel);
}
animateCarousel();

function switchTab(tabId, snapCarousel = true) {
  state.activeTabId = tabId;
  const idx = tabCards.findIndex((c) => c.dataset.tab === tabId);
  if (snapCarousel && idx >= 0) {
    const delta = getWrappedDelta(idx, carouselTarget);
    carouselTarget += delta;
  }

  tabCards.forEach((c) => c.classList.toggle("is-active", c.dataset.tab === tabId));
  document.querySelectorAll(".hub-panel").forEach((p) => p.classList.toggle("hidden", p.id !== tabId));
  document.getElementById("quest-window-title").textContent = TAB_TITLES[tabId] || "SYSTEM INFO";

  if (tabId === "tab-ranking") loadAndRenderLeaderboard();
  if (tabId === "tab-forum") loadAndRenderForum();
  if (tabId === "tab-pyramid") {
    requestAnimationFrame(() => {
      pyramid3D.resize();
      updateLaserPointerFrom3D();
    });
  }
}

tabCards.forEach((card) => {
  card.addEventListener("click", () => {
    if (dragMoved > 8) return;
    if (state.sfx) radio.playClickChime();
    switchTab(card.dataset.tab, true);
  });
});

if (galleryViewport) {
  galleryViewport.addEventListener("pointerdown", (e) => {
    isCarouselDragging = true;
    dragStartX = e.clientX;
    dragLastX = e.clientX;
    dragStartPos = carouselPos;
    dragVelocity = 0;
    dragMoved = 0;
    galleryViewport.classList.add("is-dragging");
  });

  window.addEventListener("pointermove", (e) => {
    if (!isCarouselDragging) return;
    const dxTotal = e.clientX - dragStartX;
    const dxStep = e.clientX - dragLastX;
    dragLastX = e.clientX;
    dragMoved = Math.abs(dxTotal);

    const stepPx = window.innerWidth <= 680 ? 196 : 254;
    carouselPos = dragStartPos - dxTotal / stepPx;
    dragVelocity = -dxStep / stepPx;
  });

  window.addEventListener("pointerup", () => {
    if (!isCarouselDragging) return;
    isCarouselDragging = false;
    galleryViewport.classList.remove("is-dragging");

    if (dragMoved > 8) {
      carouselTarget = Math.round(carouselPos + dragVelocity * 2.2);
      const snappedIdx = modIndex(carouselTarget);
      if (state.sfx) radio.playClickChime();
      switchTab(tabCards[snappedIdx].dataset.tab, false);
    }
    setTimeout(() => { dragMoved = 0; }, 40);
  });

  let wheelTimer = null;
  galleryViewport.addEventListener("wheel", (e) => {
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(delta) < 2) return;
    e.preventDefault();
    carouselTarget += delta * 0.0038;
    clearTimeout(wheelTimer);
    wheelTimer = setTimeout(() => {
      carouselTarget = Math.round(carouselTarget);
      const snappedIdx = modIndex(carouselTarget);
      switchTab(tabCards[snappedIdx].dataset.tab, false);
    }, 105);
  }, { passive: false });
}

document.getElementById("btn-slide-left").addEventListener("click", () => {
  if (state.sfx) radio.playClickChime();
  carouselTarget = Math.round(carouselTarget) - 1;
  switchTab(tabCards[modIndex(carouselTarget)].dataset.tab, false);
});
document.getElementById("btn-slide-right").addEventListener("click", () => {
  if (state.sfx) radio.playClickChime();
  carouselTarget = Math.round(carouselTarget) + 1;
  switchTab(tabCards[modIndex(carouselTarget)].dataset.tab, false);
});

window.addEventListener("resize", () => {
  layoutCoverflowCards();
  if (!document.getElementById("tab-pyramid").classList.contains("hidden")) {
    pyramid3D.resize();
    updateLaserPointerFrom3D();
  }
});

// 5. MÔ HÌNH 3D TAM GIÁC NGƯỢC THẬT + LASER SVG
let pyramidOriginScreen = null;

function updateLaserPointerFrom3D() {
  const layout = document.getElementById("pyramid-layout");
  const card = document.getElementById("tier-flip-card");
  const path = document.getElementById("pyramid-pointer-path");
  const originDot = document.getElementById("pyramid-pointer-origin");
  if (!layout || !card || !path || !pyramidOriginScreen) return;

  const lRect = layout.getBoundingClientRect();
  const cRect = card.getBoundingClientRect();
  const startX = pyramidOriginScreen.x - lRect.left;
  const startY = pyramidOriginScreen.y - lRect.top;
  const endX = cRect.left - lRect.left - 8;
  const endY = cRect.top - lRect.top + 48;
  const midX = startX + (endX - startX) * 0.5;

  originDot.setAttribute("cx", String(startX));
  originDot.setAttribute("cy", String(startY));
  path.setAttribute("d", `M ${startX} ${startY} L ${midX} ${startY} L ${midX} ${endY} L ${endX} ${endY}`);
}

const pyramid3D = initInvertedPyramid3D({
  canvasId: "pyramid-3d-canvas",
  onSelectTier: (tierId) => selectPyramidTier(tierId, true),
  onProjectOrigin: (sx, sy) => {
    pyramidOriginScreen = { x: sx, y: sy };
    if (!document.getElementById("tab-pyramid").classList.contains("hidden")) {
      updateLaserPointerFrom3D();
    }
  }
});

function selectPyramidTier(tierId, playEffect = false) {
  if (playEffect && state.sfx) radio.playClickChime();
  state.selectedPyramidTier = tierId;
  pyramid3D.setSelectedTier(tierId);

  const sec = SECTORS.find((s) => s.id === tierId) || SECTORS[0];
  const flipInner = document.getElementById("tier-flip-inner");
  if (playEffect && flipInner) {
    flipInner.classList.remove("is-flipping");
    void flipInner.offsetWidth;
    flipInner.classList.add("is-flipping");
  }

  document.getElementById("tier-depth-tag").textContent = `ĐỘ SÂU: TẦNG ${String(sec.id).padStart(2, "0")} / 10`;
  document.getElementById("tier-zone-tag").textContent = sec.zone;
  document.getElementById("tier-name").textContent = `${sec.name} — ${sec.sub}`;
  document.getElementById("tier-region").textContent = sec.region;
  document.getElementById("tier-crime").textContent = sec.desc;
  document.getElementById("tier-rule").textContent = sec.rule;
}

document.getElementById("btn-lock-from-pyramid").addEventListener("click", () => {
  if (state.sfx) radio.playClickChime();
  const sec = SECTORS.find((s) => s.id === state.selectedPyramidTier) || SECTORS[0];
  state.selectedSector = sec.name;
  if (!state.contractLocked) {
    const secSel = document.getElementById("f-sector");
    if (secSel) secSel.value = sec.name;
    updateLiveDossierPreview();
  }
  updateStatsUI();
  pushReceipt(`> Khóa tầng ${sec.id}/10 từ Mô hình 3D: [${sec.name}].`);
});
selectPyramidTier(1, false);

// 6. RECEIPT, MÁY IN HÓA ĐƠN NHIỆT & STATS
function pushReceipt(text) {
  const p = document.createElement("p");
  p.textContent = text;
  receiptFeed.prepend(p);

  if (thermalPaper) {
    const tp = document.createElement("p");
    tp.textContent = text;
    thermalPaper.prepend(tp);
    while (thermalPaper.children.length > 14) thermalPaper.lastChild.remove();
  }
}

function updateStatsUI() {
  const pbText = state.contractLocked && typeof state.pb === "number" ? `${state.pb.toFixed(2)} PB` : "CHƯA KÝ HỢP ĐỒNG";
  document.getElementById("hud-pb-side").textContent = pbText;
  document.getElementById("hud-code-side").textContent = state.debtorCode || "CHƯA CẤP";
  document.getElementById("hud-sector-badge").textContent = state.selectedSector;
  document.getElementById("manifest-mode-label").textContent = MANIFEST_FORMS[state.manifestForm]?.label || "POS ĐEN HIỆN ĐẠI";
  const profilePb = document.getElementById("profile-pb");
  if (profilePb) profilePb.textContent = pbText;
}

// 7. HỢP ĐỒNG + LIVE PREVIEW TỨC THÌ KHI GÕ -> COPY THẲNG SANG GG AI
function readFormSnapshot() {
  const archSelect = document.getElementById("f-archetype");
  const arch = archSelect?.value || "villain";
  const archLabel = archSelect?.options[archSelect.selectedIndex]?.text || arch;
  const sectorVal = document.getElementById("f-sector")?.value || "Random Độc Bản";

  return {
    name: document.getElementById("f-name")?.value.trim() || "",
    codename: document.getElementById("f-codename")?.value.trim() || "",
    age: document.getElementById("f-age")?.value || "24",
    gender: document.getElementById("f-gender")?.value.trim() || "",
    orient: document.getElementById("f-orient")?.value || "Tự do",
    arch,
    archLabel,
    sectorChoice: sectorVal,
    appearance: document.getElementById("f-appearance")?.value.trim() || "",
    scent: document.getElementById("f-scent")?.value.trim() || "",
    personality: document.getElementById("f-personality")?.value.trim() || "",
    sin: document.getElementById("f-sin")?.value.trim() || "",
    skill: document.getElementById("f-skill")?.value.trim() || "",
    relations: document.getElementById("f-relations")?.value.trim() || "",
    worldReq: document.getElementById("f-world-req")?.value.trim() || "",
    quote: document.getElementById("f-quote")?.value.trim() || ""
  };
}

function updateLiveDossierPreview() {
  const previewEl = document.getElementById("live-dossier-preview");
  const badgeEl = document.getElementById("live-dossier-badge");
  if (!previewEl) return;

  const p = readFormSnapshot();

  let codeText = p.codename || "[Để trống hoặc bấm Random]";
  let debtNote = "";
  let actualSector = p.sectorChoice;

  if (state.contractLocked && typeof state.pb === "number") {
    codeText = `${state.debtorCode}${p.codename ? ` (${p.codename})` : ""}`;
    debtNote = ` | Số dư đã niêm phong: ${state.pb.toFixed(2)} PB`;
    if (badgeEl) badgeEl.textContent = `ĐÃ NIÊM PHONG CHÍNH THỨC (${state.debtorCode}) — Sẵn sàng Copy`;
  } else if (state.draftAudit) {
    codeText = `${state.draftAudit.code}${p.codename ? ` (${p.codename})` : ""}`;
    debtNote = ` | Số dư dự kiến đã random: ${state.draftAudit.finalPB.toFixed(2)} PB`;
    if (p.sectorChoice === "Random Độc Bản") actualSector = state.draftAudit.pickedSector;
    if (badgeEl) badgeEl.textContent = `Đã gắn số nợ Random (${state.draftAudit.finalPB.toFixed(2)} PB) — Tự cập nhật khi gõ`;
  } else {
    if (badgeEl) badgeEl.textContent = "Đang đồng bộ theo từng phím gõ (Có thể Copy ngay sang GG AI)";
  }

  const templateText = [
    `║ HỒ SƠ HỢP ĐỒNG LAO ĐỘNG — CỤC BÁO ỨNG ║`,
    ``,
    `**Họ và tên Ký chủ:** ${p.name || "[Chưa điền họ tên]"}`,
    `**Mã số Con nợ / Biệt danh:** ${codeText}`,
    `**Tuổi:** ${p.age || "24"}`,
    `**Giới tính & Đại từ xưng hô:** ${p.gender || "[Chưa điền giới tính / xưng hô]"}`,
    `**Xu hướng tính dục:** ${p.orient}`,
    `**Thân phận Con nợ & Khung Random Nợ Phước Báu:** ${p.archLabel}${debtNote}`,
    `**Khu Vực (Điện Báo Ứng) muốn bắt đầu tại Thế giới 1:** ${actualSector}`,
    `**Gói Hợp Đồng Đề Cử:** ${state.selectedPkg}`,
    ``,
    `---`,
    ``,
    `**Ngoại hình & Khí chất linh hồn gốc (Vẫn phảng phất qua ánh mắt dù nhập vào xác nguyên chủ nào):**`,
    `  * Đặc điểm nhận diện & Ánh mắt: ${p.appearance || "[Chưa điền ngoại hình / ánh mắt]"}`,
    `  * Mùi hương linh hồn đặc trưng: ${p.scent || "[Chưa điền mùi hương đặc trưng]"}`,
    ``,
    `**Tính cách, Thói xấu & Phong cách Vả Mặt (Cơ sở để Hệ thống random biên lai phạt Phước Báu đầu game):**`,
    `  * Tính cách chủ đạo: ${p.personality || "[Chưa điền tính cách & phong cách vả mặt]"}`,
    `  * Thói xấu / Nghiệp chướng kiếp trước: ${p.sin || "[Chưa điền thói xấu / nghiệp chướng]"}`,
    ``,
    `**Mối quan hệ khởi điểm với Nhân vật Cục Báo Ứng:**`,
    `  * ${p.relations || "Chạm trán ngẫu nhiên theo quy trình Cục Báo Ứng (Sd, Tạ Vô Cữu, Lục Nha, Ngu Hồng Diệp, Tiểu Thất #707)"}`,
    ``,
    `**Kỹ năng sinh tồn thực tế mang theo từ kiếp trước (Không có bàn tay vàng ma thuật):**`,
    `  * ${p.skill || "[Chưa điền kỹ năng thực tế]"}`,
    ``,
    `**Yêu cầu Kịch bản Thế giới 1 (Tùy chọn):**`,
    `  * ${p.worldReq || "Random Độc Bản"}`,
    ``,
    `**Câu thoại cửa miệng khi đi đòi nợ báo ứng:**`,
    `> **"${p.quote || "Nợ có thể trả chậm, nhưng cái tát này thì trả đứt."}"**`
  ].join("\n");

  state.lastDossierText = templateText;
  previewEl.textContent = templateText;
}

const contractFormEl = document.getElementById("contract-form");
contractFormEl?.addEventListener("input", () => updateLiveDossierPreview());
contractFormEl?.addEventListener("change", () => updateLiveDossierPreview());

document.getElementById("btn-fill-sample")?.addEventListener("click", () => {
  if (state.contractLocked) return;
  if (state.sfx) radio.playClickChime();
  document.getElementById("f-name").value = "Thẩm Mặc";
  document.getElementById("f-codename").value = "Kẻ Đòi Nợ Máu";
  document.getElementById("f-age").value = "25";
  document.getElementById("f-gender").value = "Nữ / Cô - Tôi";
  document.getElementById("f-orient").value = "Tự do";
  document.getElementById("f-archetype").value = "slave";
  document.getElementById("f-sector").value = "Random Độc Bản";
  document.getElementById("f-appearance").value = "Ánh mắt đen lạnh lùng không gợn sóng, khóe môi nhếch nhẹ đầy giễu cợt";
  document.getElementById("f-scent").value = "Mùi cà phê đen cháy, mùi giấy hồ sơ cũ, mùi tuyết lạnh";
  document.getElementById("f-personality").value = "Tỉnh bơ cà khịa, lấy hợp đồng pháp lý và bằng chứng thép nghiền ép đối thủ";
  document.getElementById("f-sin").value = "Tăng ca 996 tự hủy hoại gan thận, hay chửi thầm sếp và mặc cả từng xu với Hệ thống";
  document.getElementById("f-skill").value = "Kiểm toán tài chính, soi lỗ hổng hợp đồng, thu thập vi bằng và đọc vi biểu cảm";
  document.getElementById("f-relations").value = "Cò kè từng đồng với Lục Nha; dùng thái độ công việc tiếp Tạ Vô Cữu; cảnh giác Quý Cô Sd.";
  document.getElementById("f-world-req").value = "Random Độc Bản";
  document.getElementById("f-quote").value = "Mời nói chuyện bằng hóa đơn và trát tòa, đừng khóc làm loãng trà của tôi.";
  updateLiveDossierPreview();
  pushReceipt("> Đã điền nhanh Hồ Sơ Mẫu vào bảng Live Preview.");
});

function buildAuditBundle() {
  const p = readFormSnapshot();
  const [minD, maxD] = ARCHETYPE_RANGES[p.arch] || [1000, 2200];
  const rawTotal = minD + Math.random() * (maxD - minD);
  const fee1 = Number((rawTotal * 0.42).toFixed(2));
  const fee2 = Number((rawTotal * 0.31).toFixed(2));
  const fee3 = Number((rawTotal - fee1 - fee2).toFixed(2));
  const finalPB = Number((-(rawTotal + 100)).toFixed(2));
  const pickedSector = p.sectorChoice === "Random Độc Bản"
    ? SECTORS[Math.floor(Math.random() * SECTORS.length)].name
    : p.sectorChoice;
  const code = `#${Math.floor(100 + Math.random() * 899)}`;

  return {
    code,
    finalPB,
    pickedSector,
    profileData: {
      name: p.name || "Ký chủ vô danh",
      codename: p.codename || `Con nợ ${code}`,
      age: p.age || 24,
      gender: p.gender || "Tự do",
      orient: p.orient,
      arch: p.arch,
      archLabel: p.archLabel,
      sector: pickedSector,
      appearance: p.appearance || "Ánh mắt sắc lạnh",
      scent: p.scent || "Cà phê cháy & thuốc sát trùng",
      personality: p.personality || "Tỉnh bơ châm biếm",
      skill: p.skill || "Kiểm toán & ứng biến sinh tồn",
      sin: p.sin || "Thức khuya & khẩu nghiệp",
      relations: p.relations || "Sòng phẳng với Lục Nha, cảnh giác Quý Cô Sd.",
      worldReq: p.worldReq || "Random Độc Bản",
      quote: p.quote || "Nợ có thể trả chậm, nhưng cái tát này thì trả đứt."
    },
    fees: { fee1, fee2, fee3 }
  };
}

function renderAuditReceipt(bundle, isOfficial) {
  const p = bundle.profileData;
  const receiptHeader = isOfficial
    ? `⚖️ 【HỢP ĐỒNG CHÍNH THỨC ĐÃ NIÊM PHONG — ${bundle.code}】`
    : `📝 【BẢN NHÁP KÝ THỬ (ĐÃ GẮN VÀO BẢNG MẪU LIVE BÊN DƯỚI)】`;

  const displayReceipt = [
    receiptHeader,
    `▸ Ký chủ: ${p.name} (${p.age}t | ${p.gender} | ${p.orient})`,
    `▸ Khấu trừ -${bundle.fees.fee1.toFixed(2)} PB: Nghiệp chướng "${p.sin}"`,
    `▸ Khấu trừ -${bundle.fees.fee2.toFixed(2)} PB: Phí khấu hao & trục vớt linh hồn`,
    `▸ Khấu trừ -${bundle.fees.fee3.toFixed(2)} PB: Thẩm định kỹ năng "${p.skill}"`,
    `▸ Khấu trừ -100.00 PB: Phí truyền tống vào ${bundle.pickedSector}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `⚖️ TỔNG PHƯỚC BÁU KHỞI ĐIỂM: ${bundle.finalPB.toFixed(2)} PB`
  ].join("\n");

  document.getElementById("audit-receipt-box").textContent = displayReceipt;
  document.getElementById("audit-result").classList.remove("hidden");
  updateLiveDossierPreview();
}

function lockContractFormUI(profileObj) {
  const form = document.getElementById("contract-form");
  if (profileObj.lastProfile) {
    const lp = profileObj.lastProfile;
    document.getElementById("f-name").value = lp.name || "";
    document.getElementById("f-codename").value = lp.codename || "";
    document.getElementById("f-age").value = lp.age || 24;
    document.getElementById("f-gender").value = lp.gender || "";
    document.getElementById("f-orient").value = lp.orient || "Tự do";
    document.getElementById("f-archetype").value = lp.arch || "villain";
    document.getElementById("f-sector").value = lp.sector || "Random Độc Bản";
    document.getElementById("f-appearance").value = lp.appearance || "";
    document.getElementById("f-scent").value = lp.scent || "";
    document.getElementById("f-personality").value = lp.personality || "";
    document.getElementById("f-skill").value = lp.skill || "";
    document.getElementById("f-sin").value = lp.sin || "";
    document.getElementById("f-relations").value = lp.relations || "";
    document.getElementById("f-world-req").value = lp.worldReq || "Random Độc Bản";
    document.getElementById("f-quote").value = lp.quote || "";
  }
  const locked = Boolean(profileObj.contractLocked);
  form.querySelectorAll("input, select, button").forEach((el) => { el.disabled = locked; });
  const fillBtn = document.getElementById("btn-fill-sample");
  if (fillBtn) fillBtn.disabled = locked;
  document.getElementById("contract-lock-banner").classList.toggle("hidden", !locked);
  document.getElementById("contract-status-badge").textContent = locked ? "ĐÃ NIÊM PHONG (1/1)" : "CHƯA KÝ CHÍNH THỨC";
  updateLiveDossierPreview();
}

document.getElementById("btn-sign-draft").addEventListener("click", () => {
  if (state.contractLocked) return;
  if (state.sfx) radio.playClickChime();
  const bundle = buildAuditBundle();
  state.draftAudit = bundle;
  renderAuditReceipt(bundle, false);
  pushReceipt(`【BẢN NHÁP】: Random thử ${bundle.finalPB.toFixed(2)} PB.`);
});

document.getElementById("contract-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (state.contractLocked) return;
  if (state.sfx) radio.playClickChime();
  if (!state.username) { openModal("modal-auth"); return; }
  if (!confirm("XÁC NHẬN KÝ HỢP ĐỒNG CHÍNH THỨC?\nSau khi ký, hồ sơ sẽ KHÓA VĨNH VIỄN. Muốn sửa bắt buộc tạo tài khoản mới!")) return;

  try {
    const bundle = buildAuditBundle();
    const updated = await signOfficialContract(state.username, {
      debtorCode: bundle.code,
      meritBalance: bundle.finalPB,
      lastProfile: bundle.profileData
    });
    state.draftAudit = null;
    applyProfileUI(updated);
    renderAuditReceipt(bundle, true);
    pushReceipt(`【CHÍNH THỨC】: Đã ký ${bundle.code} (${bundle.finalPB.toFixed(2)} PB).`);
  } catch (err) { alert(err.message); }
});

function copyDossierWithFeedback(triggerBtn) {
  updateLiveDossierPreview();
  if (!state.lastDossierText) return;
  navigator.clipboard?.writeText(state.lastDossierText);
  if (state.sfx) radio.playClickChime();
  const prevText = triggerBtn.textContent;
  triggerBtn.textContent = "✓ ĐÃ COPY! DÁN SANG GG AI NGAY";
  setTimeout(() => { triggerBtn.textContent = prevText; }, 2000);
  pushReceipt("> Đã copy trọn bộ Hồ Sơ Live vào Clipboard — sẵn sàng dán vào Google AI Studio.");
}

document.getElementById("btn-copy-dossier")?.addEventListener("click", (e) => copyDossierWithFeedback(e.currentTarget));
document.getElementById("btn-copy-live")?.addEventListener("click", (e) => copyDossierWithFeedback(e.currentTarget));
document.getElementById("btn-goto-rank").addEventListener("click", () => switchTab("tab-ranking"));

// 8. BẢNG XẾP HẠNG 24H GMT+7
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
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
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
    document.getElementById("rank-total-count").textContent = String(users.length);
    if (!users.length) { track.innerHTML = `<p class="muted" style="padding:14px;">Chưa có tài khoản nào ký Hợp đồng chính thức.</p>`; return; }
    track.innerHTML = "";
    users.forEach((u, idx) => {
      const tag = DAILY_TAGS[hashSeed(`${dateKey}:tag:${u.username}`) % DAILY_TAGS.length];
      const block = document.createElement("div");
      block.className = `rank-block ${u.username === state.username ? "is-me" : ""}`;
      block.innerHTML = `
        <div class="rank-num">#${String(idx + 1).padStart(2, "0")}</div>
        <img class="rank-avt" src="${u.avatarUrl || DEFAULT_AVATAR}" alt="Avatar" />
        <div class="rank-info"><strong>${u.displayName} (${u.debtorCode})</strong><small>@${u.username} • ${u.sector}</small></div>
        <div class="rank-pb">${u.meritBalance.toFixed(2)} PB<small>${tag}</small></div>
      `;
      track.appendChild(block);
    });
  } catch (err) {
    track.innerHTML = `<p class="muted" style="padding:12px;">Lỗi đồng bộ: ${err.message}</p>`;
  }
}

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
  if (dtEl && dtEl.textContent !== "----/--/--" && dtEl.textContent !== dateKey) loadAndRenderLeaderboard();
  const bytes = Array.from({ length: 3 }, () => Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, "0"));
  document.getElementById("hex-matrix").textContent = `0x${bytes.join(" ")}`;
}, 1000);

// 9. KHO TRỌNG ÁN + MÔ PHỎNG !NHIEMVU
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
  if (!state.contractLocked) {
    const secSel = document.getElementById("f-sector");
    if (secSel) secSel.value = previewSector.name;
    updateLiveDossierPreview();
  }
  updateStatsUI();
  pushReceipt(`> Đã khóa mục tiêu: [${state.selectedSector}].`);
});

const pkgGrid = document.getElementById("contracts-pkg-grid");
function renderPackages() {
  if (!pkgGrid) return;
  pkgGrid.innerHTML = "";
  CONTRACT_PACKAGES.forEach((pkg) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `pkg-card holo-tactile ${state.selectedPkg === pkg.title ? "is-selected" : ""}`;
    btn.innerHTML = `<strong>${pkg.title}</strong><p>${pkg.desc}</p>`;
    btn.addEventListener("click", () => {
      if (state.sfx) radio.playClickChime();
      state.selectedPkg = pkg.title;
      renderPackages();
      updateLiveDossierPreview();
      pushReceipt(`> Đã chọn gói chỉ tiêu: [${pkg.title}].`);
    });
    pkgGrid.appendChild(btn);
  });
}
renderPackages();

const uniqueCasesList = document.getElementById("unique-cases-list");
function generateUniqueCases() {
  if (!uniqueCasesList) return;
  const shuffled = [...UNIQUE_CASE_POOL].sort(() => Math.random() - 0.5).slice(0, 3);
  uniqueCasesList.innerHTML = "";
  shuffled.forEach((c, idx) => {
    const div = document.createElement("div");
    div.className = "unique-case-card";
    div.innerHTML = `
      <strong>▸ HỒ SƠ ĐỘC BẢN #${idx + 1} [${c.sector}] — Hạng ${c.rank} | Thưởng: ${c.reward}</strong>
      <p><b>${c.title}:</b> ${c.body}</p>
    `;
    uniqueCasesList.appendChild(div);
  });
}
generateUniqueCases();
document.getElementById("btn-gen-contracts")?.addEventListener("click", () => {
  if (state.sfx) radio.playClickChime();
  generateUniqueCases();
  pushReceipt("【!NHIEMVU】: Đã khởi tạo 3 Hồ sơ Trọng án Độc bản mới.");
});

// 10. CHỢ ĐEN & HÌNH THÁI VẬT LÝ !HETHONG
const manifestPreview = document.getElementById("manifest-preview-box");
function setManifestForm(key) {
  state.manifestForm = MANIFEST_FORMS[key] ? key : "pos";
  if (manifestPreview) manifestPreview.textContent = MANIFEST_FORMS[state.manifestForm].desc;
  document.querySelectorAll(".manifest-btn").forEach((b) =>
    b.classList.toggle("is-active", b.dataset.manifest === state.manifestForm)
  );
  updateStatsUI();
}
document.querySelectorAll(".manifest-btn").forEach((btn) =>
  btn.addEventListener("click", () => {
    if (state.sfx) radio.playClickChime();
    setManifestForm(btn.dataset.manifest);
    pushReceipt(`【!HETHONG】: Triệu hồi hình thái [${MANIFEST_FORMS[btn.dataset.manifest].label}].`);
  })
);
setManifestForm("pos");

const marketList = document.getElementById("market-list");
for (const item of MARKET_ITEMS) {
  const row = document.createElement("div");
  row.className = "market-item";
  row.innerHTML = `<div><h4>${item.name}</h4><p>${item.note}</p></div><button type="button" class="btn-secondary holo-tactile market-buy">${item.costPB} PB</button>`;
  row.querySelector("button").addEventListener("click", async () => {
    if (state.sfx) radio.playClickChime();
    if (!state.contractLocked) { pushReceipt("【CẢNH BÁO】: Phải ký Hợp đồng chính thức mới có PB để giao dịch."); return; }
    state.pb = Number((state.pb + item.costPB).toFixed(2));
    updateStatsUI();
    pushReceipt(`【GIAO DỊCH】: ${item.name} (${item.costPB} PB).`);
    if (state.username) await saveDebtorState(state.username, { meritBalance: state.pb }).catch(() => {});
  });
  marketList.appendChild(row);
}

// 11. DIỄN ĐÀN !DIENDAN + BÌNH LUẬN USER
const forumFeed = document.getElementById("forum-feed");
const btnModeAccount = document.getElementById("btn-mode-account");
const btnModeAnon = document.getElementById("btn-mode-anon");
const forumAccountPreview = document.getElementById("forum-account-preview");
const forumPostHint = document.getElementById("forum-post-hint");
const forumCommentInput = document.getElementById("forum-comment-input");
const forumCharCount = document.getElementById("forum-char-count");

function getAccountIdentityInfo() {
  if (!state.username || !state.currentProfile) return null;
  const prof = state.currentProfile;
  const name = prof.lastProfile?.name || prof.displayName || prof.username;
  const code = prof.contractLocked && prof.debtorCode ? ` (${prof.debtorCode})` : "";
  return {
    authorLabel: `${name}${code}`,
    authorSub: `@${prof.username} • ${state.selectedSector}`,
    avatarUrl: prof.avatarUrl || DEFAULT_AVATAR
  };
}

function updateForumIdentityUI() {
  const accInfo = getAccountIdentityInfo();
  if (forumAccountPreview) {
    forumAccountPreview.textContent = accInfo ? accInfo.authorLabel : "Đăng nhập để dùng tài khoản";
  }

  btnModeAccount?.classList.toggle("is-active", state.forumPostMode === "account");
  btnModeAnon?.classList.toggle("is-active", state.forumPostMode === "anon");

  if (forumPostHint) {
    if (state.forumPostMode === "anon") {
      forumPostHint.textContent = "Chế độ: 🎭 Đang ẩn danh (@Con_Nợ_Ẩn_Danh — giấu hoàn toàn tên & mã)";
    } else if (accInfo) {
      forumPostHint.textContent = `Chế độ mặc định: 👤 Đăng bằng tài khoản [${accInfo.authorLabel}]`;
    } else {
      forumPostHint.textContent = "Chưa đăng nhập — bấm 'Đăng Ẩn Danh' để viết ngay hoặc đăng nhập để dùng tên thật";
    }
  }
}

btnModeAccount?.addEventListener("click", () => {
  if (state.sfx) radio.playClickChime();
  if (!state.username) { openModal("modal-auth"); return; }
  state.forumPostMode = "account";
  updateForumIdentityUI();
});

btnModeAnon?.addEventListener("click", () => {
  if (state.sfx) radio.playClickChime();
  state.forumPostMode = "anon";
  updateForumIdentityUI();
});

forumCommentInput?.addEventListener("input", () => {
  if (forumCharCount) forumCharCount.textContent = `${forumCommentInput.value.length}/500`;
});

function formatGMT7Timestamp(ms) {
  if (!ms) return "Hệ thống";
  const d = new Date(ms + 7 * 3600 * 1000);
  return `${d.toISOString().slice(5, 10)} ${d.toISOString().slice(11, 16)} GMT+7`;
}

function createForumPostElement(post) {
  const div = document.createElement("div");
  div.className = `forum-post ${post.isAnonymous ? "is-anon" : post.timestamp ? "is-user" : ""}`;

  const head = document.createElement("div");
  head.className = "forum-post-head";

  const avt = document.createElement("img");
  avt.className = "forum-post-avt";
  avt.src = post.avatarUrl || (post.isAnonymous ? ANON_AVATAR : DEFAULT_AVATAR);
  avt.alt = "Avatar";

  const meta = document.createElement("div");
  meta.className = "forum-post-meta";

  const authorSpan = document.createElement("span");
  authorSpan.className = "author";
  authorSpan.textContent = post.authorLabel || "@Con_Nợ_Ẩn_Danh";

  const subSmall = document.createElement("small");
  const timeTxt = post.timestamp ? `${formatGMT7Timestamp(post.timestamp)} • ` : "";
  subSmall.textContent = `${timeTxt}${post.authorSub || post.sector || "Báo Ứng Net"}`;

  meta.append(authorSpan, subSmall);
  head.append(avt, meta);

  const bodyP = document.createElement("p");
  bodyP.textContent = post.body || "";

  div.append(head, bodyP);
  return div;
}

async function loadAndRenderForum() {
  if (!forumFeed) return;
  let userPosts = [];
  try {
    userPosts = await fetchForumComments(40);
  } catch (_) {
    userPosts = [];
  }
  const allPosts = [...state.extraForumSysPosts, ...userPosts, ...FORUM_POSTS_BASE];
  forumFeed.innerHTML = "";
  allPosts.forEach((p) => forumFeed.appendChild(createForumPostElement(p)));
}

document.getElementById("forum-composer")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const bodyText = forumCommentInput?.value.trim();
  if (!bodyText) return;

  if (state.forumPostMode === "account" && !state.username) {
    openModal("modal-auth");
    return;
  }

  const submitBtn = document.getElementById("btn-post-forum");
  if (submitBtn) submitBtn.disabled = true;

  try {
    const isAnon = state.forumPostMode === "anon";
    const acc = getAccountIdentityInfo();
    const anonCode = `#${Math.floor(100 + Math.random() * 899)}`;

    const payload = isAnon
      ? {
          authorLabel: `@Con_Nợ_Ẩn_Danh ${anonCode}`,
          authorSub: `Ẩn danh • ${state.selectedSector}`,
          avatarUrl: ANON_AVATAR,
          isAnonymous: true,
          sector: state.selectedSector,
          body: bodyText
        }
      : {
          authorLabel: acc.authorLabel,
          authorSub: acc.authorSub,
          avatarUrl: acc.avatarUrl,
          isAnonymous: false,
          sector: state.selectedSector,
          body: bodyText
        };

    const saved = await postForumComment(payload);
    if (state.sfx) radio.playClickChime();
    forumCommentInput.value = "";
    if (forumCharCount) forumCharCount.textContent = "0/500";
    await loadAndRenderForum();
    pushReceipt(
      saved.localOnly
        ? `【BÁO ỨNG NET (TẠM TRÊN MÁY)】: Firebase đang khóa quyền ghi — hãy Publish Rules trên Firebase Console để đồng bộ mọi người.`
        : `【BÁO ỨNG NET】: Đã đăng bình luận dưới danh nghĩa [${payload.authorLabel}].`
    );
  } catch (err) {
    pushReceipt(`【LỖI BÁO ỨNG NET】: ${err.message}`);
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
});

document.getElementById("btn-refresh-forum").addEventListener("click", async () => {
  if (state.sfx) radio.playClickChime();
  const extra = FORUM_EXTRA_POOL[Math.floor(Math.random() * FORUM_EXTRA_POOL.length)];
  const livePost = {
    authorLabel: `@Tình_Báo_${state.selectedSector.slice(0, 6).replace(/\s+/g, "_")}`,
    authorSub: "Tin quét trực tiếp",
    avatarUrl: DEFAULT_AVATAR,
    body: `Cập nhật nóng tại [${state.selectedSector}]: Kẻ Cướp Phước đang thuê thủy quân dọn sạch lịch sử giao dịch. Con nợ nào chuẩn bị vả mặt nhớ chụp vi bằng trước khi vào phòng kín!`
  };
  state.extraForumSysPosts = [livePost, extra];
  await loadAndRenderForum();

  if (!state.contractLocked) { pushReceipt("【BÁO ỨNG NET】: Chế độ khách quét tin miễn phí."); return; }
  state.pb = Number((state.pb - 0.5).toFixed(2));
  updateStatsUI();
  pushReceipt("【BÁO ỨNG NET】: -0.50 PB phí 3G linh hồn.");
  if (state.username) await saveDebtorState(state.username, { meritBalance: state.pb }).catch(() => {});
});

document.getElementById("btn-goto-vault")?.addEventListener("click", () => {
  if (state.sfx) radio.playClickChime();
  switchTab("tab-vault", true);
});

// 12. TAB 07: KHO HỒ SƠ MẬT (3 BỘ ĐỀ ĐỐ MẸO + LOGIC VẶN VẸO + LẬT THẺ 3D + BÁO ĐỘNG Sd.)
const VAULT_PROTOCOLS = [
  {
    badge: "PROTOCOL ALPHA // CẤP ĐỘ: HẠI NÃO",
    title: "🔐 BỘ ĐỀ 1: BẪY NGÔN TỪ, XÁC SUẤT & LOGIC THẨM VẤN",
    passcode: "57223",
    riddles: [
      "<strong>Chữ số 1 (Bẫy đại số):</strong> Lục Nha bán một món đồ cổ <b>kèm hộp nhung</b> giá tổng cộng <b>110 tệ</b>. Biết món đồ cổ <b>đắt hơn chiếc hộp đúng 100 tệ</b>. Hỏi chiếc hộp giá bao nhiêu tệ?",
      "<strong>Chữ số 2 (Bẫy găng tay):</strong> Trong ngăn kéo tối om có <b>6 chiếc găng tay đỏ</b> (3 trái, 3 phải) và <b>6 chiếc găng tay đen</b> (3 trái, 3 phải). Trong bóng tối không nhìn thấy gì, cần bốc ra <b>tối thiểu bao nhiêu chiếc</b> để <b>CHẮC CHẮN 100%</b> ghép được ít nhất <b>1 đôi hợp lệ cùng màu</b> (1 trái + 1 phải)?",
      "<strong>Chữ số 3 (Bẫy lũy thừa):</strong> Hệ Thống 00 thả một loại virus nhân bản <b>gấp đôi số lượng sau mỗi 1 giây</b>. Đúng giây thứ <b>60</b> virus lấp đầy <b>100%</b> bộ nhớ. Hỏi từ lúc virus đạt mức <b>25%</b> thì cần chờ thêm <b>bao nhiêu giây nữa</b> để nó đầy 100%?",
      "<strong>Chữ số 4 (Bẫy huyết thống):</strong> Tạ Vô Cữu giơ một bức ảnh lên và nói: <em>“Cha mẹ tôi không có con trai nào khác ngoài tôi, cũng không có con gái. Nhưng <b>cha của người trong ảnh</b> lại chính là <b>con trai của cha tôi</b>.”</em> Người trong ảnh là ai? (Nhập: <b>1</b> = Chính Tạ Vô Cữu | <b>2</b> = Con ruột của Tạ Vô Cữu | <b>3</b> = Cha của Tạ Vô Cữu | <b>4</b> = Em họ)",
      "<strong>Chữ số 5 (Bẫy nói dối):</strong> Có 3 nghi phạm <b>A, B, C</b>; biết <b>chỉ có ĐÚNG 1 thủ phạm</b> và <b>chỉ có ĐÚNG 1 người nói thật</b> (2 kẻ còn lại nói dối). <b>A</b> khai: <em>“Tôi không trộm”</em>; <b>B</b> khai: <em>“A đã trộm”</em>; <b>C</b> khai: <em>“Tôi không trộm”</em>. Thủ phạm là ai? (Nhập: <b>1</b> = A | <b>2</b> = B | <b>3</b> = C | <b>0</b> = Vô nghiệm)"
    ],
    hint1: "💡 Tiểu Thất gợi ý: (1) Nếu hộp 10 tệ thì đồ cổ phải 110 tệ => tổng thành 120 mất rồi!; (2) Đừng nhầm với bài toán ĐÔI TẤT — găng tay có phân biệt Trái/Phải nên xui nhất là bốc hết 3 trái đỏ + 3 trái đen; (3) Virus gấp đôi mỗi giây nên lùi 1 giây là còn một nửa; (4) Đọc kỹ chữ “CHA CỦA người trong ảnh”; (5) Thử giả sử từng người là thủ phạm rồi đếm xem có đúng 1 người nói thật không!",
    hint2: "🆘 Tiểu Thất bấm máy Casio lén hộ bạn: Đáp án bộ Alpha là <b>57223</b> (Hộp 5 tệ • 7 chiếc găng • 2 giây cuối • Con ruột = 2 • Thủ phạm C = 3)."
  },
  {
    badge: "PROTOCOL BETA // CẤP ĐỘ: VẶN VẸO",
    title: "🔐 BỘ ĐỀ 2: NGHỊCH LÝ SỔ SÁCH, THANG CUỐN & BỨC TƯỜNG",
    passcode: "49326",
    riddles: [
      "<strong>Chữ số 1 (Bẫy khoảng cách):</strong> Đồng hồ quả lắc ở Sảnh Chờ 00 gõ hết <b>4 tiếng chuông</b> lúc 4 giờ mất đúng <b>6 giây</b> (tính từ tiếng đầu đến tiếng cuối). Hỏi lúc <b>3 giờ</b>, nó mất <b>mấy giây</b> để gõ hết 3 tiếng chuông?",
      "<strong>Chữ số 2 (Bẫy tờ vs trang):</strong> Cuốn sổ nợ dày 300 trang (đánh số từ trang 1 đến 300; mỗi <b>tờ</b> gồm 2 trang: mặt lẻ trước, mặt chẵn sau). Tiểu Thất lỡ tay xé rách sạch <b>từ trang 98 đến hết trang 113</b>. Hỏi cậu ta đã xé mất tổng cộng <b>bao nhiêu TỜ giấy</b>?",
      "<strong>Chữ số 3 (Bẫy suy luận im lặng):</strong> Có 4 Con nợ bị đội <b>2 mũ Đen, 2 mũ Trắng</b> (cả 4 đều biết tỷ lệ này). Bức tường dày chắn giữa người số <b>1</b> và <b>2</b>. Số <b>4</b> nhìn thấy mũ của 3 &amp; 2; số <b>3</b> chỉ thấy mũ của 2; số <b>2</b> và <b>1</b> không thấy ai. Thực tế đang đội: <b>1(Đen), 2(Trắng), 3(Đen), 4(Trắng)</b>. Sau 1 phút cả đám im lặng, <b>người số mấy</b> là người đầu tiên chắc chắn 100% đoán đúng màu mũ của mình?",
      "<strong>Chữ số 4 (Bẫy chia dư):</strong> Tạ Vô Cữu có một số đồng xu nhỏ nhất lớn hơn 1: khi chia cho <b>2, 3, 4</b> đều <b>dư 1</b>, nhưng chia cho <b>5</b> thì <b>chia hết</b>. Lấy <b>chữ số hàng chục</b> của số đồng xu đó.",
      "<strong>Chữ số 5 (Bẫy thang cuốn):</strong> Một tra nam đi bộ lên thang cuốn <b>đang chạy ngược chiều đi xuống</b>. Nếu hắn bước lên <b>2 bậc/giây</b> thì mất <b>60 giây</b> mới tới đỉnh; nếu chạy lên <b>3 bậc/giây</b> thì mất <b>30 giây</b> tới đỉnh. Hỏi khi thang cuốn tắt điện đứng yên, nó có tổng cộng bao nhiêu bậc? (Lấy <b>tổng số bậc chia cho 10</b>)"
    ],
    hint1: "💡 Tiểu Thất gợi ý: (1) 4 tiếng chuông chỉ có 3 khoảng nghỉ ở giữa; (2) Trang 98 nằm chung tờ với trang 97, còn trang 113 nằm chung tờ với trang 114!; (3) Nếu số 2 và 3 đội cùng màu thì số 4 đã hét lên ngay rồi — vì 4 im lặng nên 3 biết mình khác màu 2; (4) Số đó trừ 1 chia hết cho 12; (5) Gọi N là số bậc, v là tốc độ thang chạy xuống: N = 60(2-v) = 30(3-v).",
    hint2: "🆘 Tiểu Thất bấm máy Casio lén hộ bạn: Đáp án bộ Beta là <b>49326</b> (4 giây • 9 tờ • Người số 3 • 25 xu -> hàng chục là 2 • 60 bậc / 10 = 6)."
  },
  {
    badge: "PROTOCOL GAMMA // CẤP ĐỘ: ĐỘC ÁC (TỰ THAM CHIẾU)",
    title: "🔐 BỘ ĐỀ 3: CẮT SẮT, ĐẤU LOẠI & NGHỊCH LÝ TỰ THAM CHIẾU",
    passcode: "17083",
    riddles: [
      "<strong>Chữ số 1 (Bẫy nhát cắt):</strong> Thanh huyền thiết dài <b>5 mét</b> cần cắt thành các đoạn bằng nhau dài <b>1 mét</b>. Mỗi lần cắt mất <b>12 phút</b>, sau mỗi lần cắt phải nghỉ làm mát cưa <b>4 phút</b> (cắt xong đoạn cuối thì nghỉ luôn không tính). Hỏi cắt xong cả thanh mất <b>mấy giờ</b>?",
      "<strong>Chữ số 2 (Bẫy bắt tay):</strong> Tại sảnh tiệc hào môn, mọi người bắt tay nhau đôi một (ai cũng bắt tay tất cả những người còn lại, không lặp lại). Đếm được tổng cộng <b>21 cái bắt tay</b>. Hỏi trong sảnh có <b>tất cả bao nhiêu người</b>?",
      "<strong>Chữ số 3 (Bẫy kinh điển):</strong> Nếu Tiểu Thất mất 2 giờ để đào xong 1 cái hố lập phương 1m × 1m × 1m, hỏi trong <b>nửa cái hố</b> như vậy chứa <b>bao nhiêu mét khối đất</b>?",
      "<strong>Chữ số 4 (Bẫy giải đấu):</strong> Giải E-Sports Điện 9 có <b>259 tuyển thủ</b> thi đấu loại trực tiếp 1v1 (thua 1 trận loại ngay, không hòa) để tìm ra 1 nhà vô địch. Cần tổ chức <b>tổng cộng bao nhiêu trận đấu</b>? (Lấy <b>chữ số hàng đơn vị</b> của tổng số trận)",
      "<strong>Chữ số 5 (Nghịch lý Tự Tham Chiếu — Siêu khó):</strong> Cho 4 chữ số đầu bạn vừa giải là <b>[A]-[B]-[C]-[D]</b>. Chữ số thứ 5 (<b>E</b>) phải thỏa mãn đúng câu khẳng định sau: <em>“Tổng số lượng chữ số <b>nhỏ hơn hoặc bằng 5</b> xuất hiện trong <b>CẢ 5 CHỮ SỐ [A-B-C-D-E]</b> của mật mã này đúng bằng <b>E</b>.”</em> Tìm <b>E</b>?"
    ],
    hint1: "💡 Tiểu Thất gợi ý: (1) Thanh 5m cắt 1m chỉ có 4 nhát cắt và 3 lần nghỉ; (2) Công thức n(n-1)/2 = 21; (3) Đã gọi là CÁI HỐ thì bên trong rỗng làm gì có đất!; (4) Để 1 người vô địch thì phải loại đúng 258 người thua (mỗi trận loại 1 người); (5) Đừng quên số 0 cũng <= 5! Và nếu điền E=2 thì đếm lại cả 5 số sẽ thành 3 số <= 5 mất rồi!",
    hint2: "🆘 Tiểu Thất bấm máy Casio lén hộ bạn: Đáp án bộ Gamma là <b>17083</b> (1 giờ • 7 người • 0 đất • 258 trận -> 8 • E=3 vì 1,0,3 có đúng 3 số <= 5)."
  }
];

let activeProtocolIdx = 0;
let vaultAttempts = 0;

const vaultLockScreen = document.getElementById("vault-lock-screen");
const vaultCardsStage = document.getElementById("vault-cards-stage");
const vaultCardsGrid = document.getElementById("vault-cards-grid");
const vaultErrMsg = document.getElementById("vault-error-msg");
const vaultHintBox = document.getElementById("vault-hint-box");
const intrusionOverlay = document.getElementById("intrusion-overlay");
const intrusionTimerEl = document.getElementById("intrusion-timer");
const intrusionBarEl = document.getElementById("intrusion-progress-bar");

let intrusionInterval = null;
let intrusionTimeout = null;
let savedThemeBeforeAlarm = null;

function renderVaultRiddles() {
  const proto = VAULT_PROTOCOLS[activeProtocolIdx];
  const badgeEl = document.getElementById("vault-protocol-badge");
  const titleEl = document.getElementById("vault-protocol-title");
  const listEl = document.getElementById("vault-riddle-list");
  if (badgeEl) badgeEl.textContent = proto.badge;
  if (titleEl) titleEl.textContent = proto.title;
  if (listEl) {
    listEl.innerHTML = proto.riddles.map((r) => `<li>${r}</li>`).join("");
  }
  state.vaultHintStep = 0;
  vaultAttempts = 0;
  if (vaultErrMsg) vaultErrMsg.textContent = "";
  vaultHintBox?.classList.add("hidden");
  const inp = document.getElementById("vault-pass-input");
  if (inp) inp.value = "";
}

document.getElementById("btn-switch-protocol")?.addEventListener("click", () => {
  if (state.sfx) radio.playClickChime();
  activeProtocolIdx = (activeProtocolIdx + 1) % VAULT_PROTOCOLS.length;
  renderVaultRiddles();
  pushReceipt(`【KÉT BẢO MẬT】: Đã chuyển sang ${VAULT_PROTOCOLS[activeProtocolIdx].badge}.`);
});

function stopSdIntrusionAlert() {
  clearInterval(intrusionInterval);
  clearTimeout(intrusionTimeout);
  radio.stopWarningSiren();
  intrusionOverlay?.classList.add("hidden");
  if (savedThemeBeforeAlarm) {
    htmlEl.setAttribute("data-theme", savedThemeBeforeAlarm);
    savedThemeBeforeAlarm = null;
  }
  document.querySelector(".dossier-flip-card.is-sd-card")?.classList.remove("is-sd-glitch");
}

function triggerSdIntrusionAlert(cardEl) {
  stopSdIntrusionAlert();
  cardEl.classList.add("is-sd-glitch");

  const statusTag = cardEl.querySelector(".sd-err-tag");
  if (statusTag) statusTag.textContent = "ERROR 403 // KHÔNG CÓ QUYỀN TRUY CẬP";

  savedThemeBeforeAlarm = state.theme;
  htmlEl.setAttribute("data-theme", "crimson-karma");

  const DURATION_MS = 4200;
  const startedAt = Date.now();
  intrusionOverlay?.classList.remove("hidden");
  if (intrusionBarEl) intrusionBarEl.style.width = "100%";

  radio.playWarningSiren(4.2);
  pushReceipt("🚨 【ERROR 403 — XÂM NHẬP HỒ SƠ Sd.】: Không có quyền truy cập! Kích hoạt báo động toàn hệ thống 4.2s.");

  intrusionInterval = setInterval(() => {
    const elapsed = Date.now() - startedAt;
    const rem = Math.max(0, DURATION_MS - elapsed);
    if (intrusionTimerEl) intrusionTimerEl.textContent = `${(rem / 1000).toFixed(1)}s`;
    if (intrusionBarEl) intrusionBarEl.style.width = `${(rem / DURATION_MS) * 100}%`;
    if (rem <= 0) stopSdIntrusionAlert();
  }, 60);

  intrusionTimeout = setTimeout(() => stopSdIntrusionAlert(), DURATION_MS + 40);
}

document.getElementById("btn-dismiss-intrusion")?.addEventListener("click", () => {
  stopSdIntrusionAlert();
  pushReceipt("> Đã ngắt tín hiệu báo động thủ công.");
});

function renderVaultCards() {
  if (!vaultCardsGrid) return;
  vaultCardsGrid.innerHTML = "";

  VAULT_NPCS.forEach((npc) => {
    const card = document.createElement("div");
    card.className = `dossier-flip-card ${npc.isSd ? "is-sd-card" : ""}`;

    const frontHint = npc.isSd
      ? `<span class="sd-err-tag">[TRUY CẬP BỊ CẤM // KHÔNG CÓ QUYỀN]</span>`
      : `[ NHẤN ĐỂ LẬT HỒ SƠ 3D ]`;

    card.innerHTML = `
      <div class="dossier-card-inner">
        <div class="dossier-face dossier-face-front">
          <div class="dossier-top-tag"><span>${npc.code}</span><span>${npc.clearance}</span></div>
          <div class="dossier-emblem">${npc.emblem}</div>
          <div class="dossier-front-title">
            <strong>${npc.name}</strong>
            <small>${npc.role}</small>
          </div>
          <div class="dossier-flip-hint">${frontHint}</div>
        </div>
        <div class="dossier-face dossier-face-back">
          <h5>${npc.name}</h5>
          <p><b>Biểu tượng:</b> ${npc.artifact || "Không rõ"}</p>
          <p><b>Mùi hương:</b> ${npc.scent || "Không rõ"}</p>
          <p>${npc.bio}</p>
          <div class="dossier-quote">${npc.quote}</div>
        </div>
      </div>
    `;

    card.addEventListener("click", () => {
      if (npc.isSd) {
        triggerSdIntrusionAlert(card);
        return;
      }
      if (state.sfx) radio.playFlipChime();
      card.classList.toggle("is-flipped");
    });

    vaultCardsGrid.appendChild(card);
  });
}

function setVaultState(unlocked) {
  state.vaultUnlocked = unlocked;
  vaultLockScreen?.classList.toggle("hidden", unlocked);
  vaultCardsStage?.classList.toggle("hidden", !unlocked);
  const vaultTabNode = document.querySelector('.holo-tab-card[data-tab="tab-vault"] .card-top-meta em');
  if (vaultTabNode) vaultTabNode.textContent = unlocked ? "UNLOCKED" : "LOCKED";
  if (unlocked) renderVaultCards();
}

document.getElementById("vault-riddle-form")?.addEventListener("submit", (e) => {
  e.preventDefault();
  const proto = VAULT_PROTOCOLS[activeProtocolIdx];
  const passInput = document.getElementById("vault-pass-input");
  const val = (passInput?.value || "").trim();

  if (val === proto.passcode) {
    if (state.sfx) radio.playClickChime();
    if (vaultErrMsg) vaultErrMsg.textContent = "";
    setVaultState(true);
    pushReceipt(`🔓 【HỒ SƠ MẬT】: Giải mã thành công ${proto.badge} (${proto.passcode}). Đã mở quyền xem 6 thẻ Nhân sự.`);
  } else {
    vaultAttempts += 1;
    if (state.sfx) radio.playFlipChime();
    if (passInput) {
      passInput.classList.remove("is-wrong");
      void passInput.offsetWidth;
      passInput.classList.add("is-wrong");
    }
    const snark = vaultAttempts >= 3
      ? "Hệ Thống 00 ghi nhận chỉ số đọc hiểu đang báo động đỏ. Thử bấm Gợi ý của Tiểu Thất hoặc đọc kỹ từng chữ bẫy!"
      : "Bạn đã rơi vào bẫy đọc lướt! Kiểm tra lại từng chữ số một.";
    if (vaultErrMsg) vaultErrMsg.textContent = `❌ Sai mật mã [${val || "trống"}] (Lần ${vaultAttempts}): ${snark}`;
    pushReceipt(`【KÉT BẢO MẬT】: Nhập sai mật mã [${val}] (Lần ${vaultAttempts}).`);
  }
});

document.getElementById("btn-vault-hint")?.addEventListener("click", () => {
  if (state.sfx) radio.playClickChime();
  const proto = VAULT_PROTOCOLS[activeProtocolIdx];
  state.vaultHintStep = (state.vaultHintStep + 1) % 3;
  if (!vaultHintBox) return;

  if (state.vaultHintStep === 1) {
    vaultHintBox.classList.remove("hidden");
    vaultHintBox.innerHTML = proto.hint1;
  } else if (state.vaultHintStep === 2) {
    vaultHintBox.classList.remove("hidden");
    vaultHintBox.innerHTML = proto.hint2;
  } else {
    vaultHintBox.classList.add("hidden");
  }
});

document.getElementById("btn-vault-lock")?.addEventListener("click", () => {
  if (state.sfx) radio.playClickChime();
  activeProtocolIdx = (activeProtocolIdx + 1) % VAULT_PROTOCOLS.length; // Khóa lại tự đổi sang bộ đề mới
  renderVaultRiddles();
  setVaultState(false);
  pushReceipt("🔒 【KÉT BẢO MẬT】: Đã khóa két và xoay vòng sang Bộ Đề Bảo Mật kế tiếp.");
});

renderVaultRiddles();

// 13. MÁY IN HÓA ĐƠN NHIỆT & LỆNH NHANH CÁNH PHẢI
document.getElementById("btn-print-receipt")?.addEventListener("click", async () => {
  if (state.sfx) radio.playClickChime();
  const fee = state.contractLocked ? -1 : 0;
  if (state.contractLocked) {
    state.pb = Number((state.pb + fee).toFixed(2));
    updateStatsUI();
    if (state.username) await saveDebtorState(state.username, { meritBalance: state.pb }).catch(() => {});
  }
  pushReceipt(`【IN BIÊN LAI ${MANIFEST_FORMS[state.manifestForm].label}】: ${fee ? "-1.00 PB phí giấy nhiệt" : "Bản in thử miễn phí"} | Mục tiêu: ${state.selectedSector}.`);
});

document.querySelectorAll("[data-cmd]").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (state.sfx) radio.playClickChime();
    const cmd = btn.dataset.cmd;
    if (cmd === "!hethong") {
      switchTab("tab-market");
      pushReceipt("【LỆNH !HETHONG】: Đã triệu hồi bảng điều chỉnh Hình thái Vật lý.");
    } else if (cmd === "!nhiemvu") {
      switchTab("tab-sectors");
      generateUniqueCases();
      pushReceipt("【LỆNH !NHIEMVU】: Đã mở Sảnh Trọng Án Độc Bản.");
    } else if (cmd === "!diendan") {
      switchTab("tab-forum");
      pushReceipt("【LỆNH !DIENDAN】: Đã kết nối Mạng nội bộ Báo Ứng Net v4.0.");
    } else if (cmd === "!kiemtoan") {
      const pbTxt = state.contractLocked && typeof state.pb === "number" ? `${state.pb.toFixed(2)} PB` : "Chưa ký chính thức";
      pushReceipt(`🗂️ 【KIỂM TOÁN NHANH】: Mã ${state.debtorCode} | Số dư: ${pbTxt} | Mục tiêu: ${state.selectedSector} | Gói: ${state.selectedPkg}.`);
    }
  });
});

// 14. MODAL TÀI KHOẢN & AVATAR
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
    state.currentProfile = null;
    state.contractLocked = false;
    state.pb = null;
    state.debtorCode = "CHƯA CẤP";
    state.forumPostMode = "anon";
    document.getElementById("user-dot").classList.remove("online");
    topAvatar.classList.add("hidden");
    document.getElementById("user-label").textContent = "ĐĂNG NHẬP";
    authOut.classList.remove("hidden"); authIn.classList.add("hidden");
    lockContractFormUI({ contractLocked: false });
    updateStatsUI();
    updateForumIdentityUI();
    return;
  }

  state.username = profile.username;
  state.currentProfile = profile;
  state.forumPostMode = "account";
  state.contractLocked = Boolean(profile.contractLocked);
  state.debtorCode = profile.contractLocked ? (profile.debtorCode || "#000") : "CHƯA CẤP";
  state.pb = profile.contractLocked && typeof profile.meritBalance === "number" ? profile.meritBalance : null;
  if (profile.lastProfile?.sector) state.selectedSector = profile.lastProfile.sector;
  if (profile.theme && VALID_THEMES.includes(profile.theme)) applyTheme(profile.theme, false);

  const avt = profile.avatarUrl || DEFAULT_AVATAR;
  topAvatar.src = avt; topAvatar.classList.remove("hidden");
  document.getElementById("profile-avatar").src = avt;
  document.getElementById("avatar-url-input").value = profile.avatarUrl?.startsWith("http") ? profile.avatarUrl : "";

  document.getElementById("user-dot").classList.add("online");
  document.getElementById("user-label").textContent = profile.displayName || profile.username;
  document.getElementById("profile-name").textContent = state.contractLocked ? `Con nợ ${state.debtorCode} (Đã khóa)` : "Chưa ký hợp đồng chính thức";
  document.getElementById("profile-username").textContent = `@${profile.username}`;
  authOut.classList.add("hidden"); authIn.classList.remove("hidden");

  lockContractFormUI(profile);
  updateStatsUI();
  updateForumIdentityUI();
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
        c.width = 128; c.height = 128;
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

document.getElementById("btn-save-avatar-url").addEventListener("click", async () => {
  if (!state.username) return;
  await saveDebtorState(state.username, { avatarUrl: document.getElementById("avatar-url-input").value.trim() });
  applyProfileUI(await fetchDebtorByUsername(state.username));
  document.getElementById("auth-sync-msg").textContent = "Đã lưu Avatar lên Firebase.";
});
document.getElementById("avatar-file-input").addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file || !state.username) return;
  try {
    const dataUrl = await compressImageToDataUrl(file);
    await saveDebtorState(state.username, { avatarUrl: dataUrl });
    applyProfileUI(await fetchDebtorByUsername(state.username));
    document.getElementById("auth-sync-msg").textContent = "Đã tải Avatar lên Firebase.";
  } catch (err) { document.getElementById("auth-sync-msg").textContent = err.message; }
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
    applyProfileUI(await loginSimpleAccount(document.getElementById("auth-username").value, document.getElementById("auth-pass").value));
    authMsg.textContent = "";
    closeModal("modal-auth");
  } catch (err) { authMsg.textContent = err.message; }
});
document.getElementById("btn-register-simple").addEventListener("click", async () => {
  try {
    authMsg.textContent = "Đang tạo tài khoản...";
    applyProfileUI(await registerSimpleAccount(document.getElementById("auth-username").value, document.getElementById("auth-pass").value));
    authMsg.textContent = "";
    closeModal("modal-auth");
  } catch (err) { authMsg.textContent = err.message; }
});
document.getElementById("btn-logout").addEventListener("click", () => { logoutSimpleAccount(); applyProfileUI(null); });

// 15. DỮ LIỆU CHẠY VIỀN & ĐỒNG HỒ SINH TRẮC HỌC
const railL = document.getElementById("stream-rail-left");
const railR = document.getElementById("stream-rail-right");

setInterval(() => {
  if (!railL || !railR) return;
  const lineL = document.createElement("span");
  if (Math.random() < 0.18) lineL.className = "hot";
  lineL.textContent = `${Math.floor(1000 + Math.random() * 8999)}.${Math.floor(10 + Math.random() * 89)} // 0x${Math.floor(Math.random() * 65535).toString(16).toUpperCase().padStart(4, "0")}`;
  railL.prepend(lineL);
  if (railL.children.length > 34) railL.lastChild.remove();

  const lineR = document.createElement("span");
  if (Math.random() < 0.16) lineR.className = "hot";
  lineR.textContent = `SYNC:${(94 + Math.random() * 5.9).toFixed(2)}% [${Math.floor(Math.random() * 2)}${Math.floor(Math.random() * 2)}${Math.floor(Math.random() * 2)}${Math.floor(Math.random() * 2)}]`;
  railR.prepend(lineR);
  if (railR.children.length > 34) railR.lastChild.remove();
}, 240);

setInterval(() => {
  const bpm = Math.floor(68 + Math.random() * 14);
  const sync = (96.5 + Math.random() * 3.2).toFixed(1);
  const bpmEl = document.getElementById("bio-bpm-readout");
  if (bpmEl) bpmEl.textContent = `SOUL_BPM: ${bpm} • SYNC: ${sync}%`;

  const syn = document.getElementById("m-synapse");
  const cort = document.getElementById("m-cortisol");
  const flux = document.getElementById("m-flux");
  const tickEl = document.getElementById("live-number-ticker");
  if (syn) syn.textContent = `${sync}%`;
  if (cort) cort.textContent = `${(12 + Math.random() * 5).toFixed(1)} ng`;
  if (flux) flux.textContent = `-${(0.2 + Math.random() * 0.7).toFixed(2)} Hz`;
  if (tickEl) {
    tickEl.textContent = `${(Math.random() * 99).toFixed(2)} | 0x${Math.floor(Math.random() * 255).toString(16).toUpperCase().padStart(2, "0")} | ${sync}%`;
  }
}, 900);

applyTheme(state.theme, false);
updateStatsUI();
updateLiveDossierPreview();
updateForumIdentityUI();
loadAndRenderForum();
switchTab("tab-profile", true);
restoreSession();