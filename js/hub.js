// js/hub.js — Bản Full hoàn chỉnh (Carousel 3D + Live Hồ Sơ + Báo Ứng Net + Kho Mật 3D Bio-Lab)

import { initBioHologram } from "./bio-holo.js";
import { initInvertedPyramid3D } from "./pyramid-3d.js";
import { initNpcMorph3D } from "./npc-morph-3d.js";
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

const VAULT_NPCS = [
  {
    id: "sys00",
    code: "ID // 00",
    clearance: "LEVEL 1",
    emblem: "🧮",
    name: "HỆ THỐNG 00",
    role: "Kế Toán Viên Kiểm Toán — Máy Chủ Trực Tiếp",
    artifact: "Bàn Tính Gãy & Cuộn Hóa Đơn Nhiệt Dài Vô Tận",
    scent: "Giấy in nhiệt nóng rực, ozone máy chủ & đồng xu kim loại",
    bio: "Không phải linh vật dễ thương, càng không phải thần linh từ bi. Hệ Thống 00 là chương trình kiểm toán nhân quả tự động mang tư duy Tư Bản Bóc Lột Tuyệt Đối: quy đổi mọi bi kịch đẫm máu thành biên lai thu phí từng số lẻ và khấu trừ 80% khi kết toán.",
    quote: "“【Thông báo: Nhịp tim vượt 140 BPM. Đã tự bơm 0.5ml hormone làm dịu thần kinh. Chi phí: -15 PB. Khuyến nghị Ký chủ giữ bình tĩnh để tiết kiệm tiền y tế.】”",
    zones: {
      head: { title: "ĐẦU // KÊNH PHÁT THANH TÂM TRÍ", text: "Giọng nói điện tử trung tính đều đặn như tổng đài ngân hàng báo nợ quá hạn vang thẳng trong hộp sọ." },
      chest: { title: "LÕI CHỦ // TƯ DUY TƯ BẢN BÓC LỘT", text: "Chèn phân tích sinh học & tài chính phũ phàng làm tụt sạch mood khi phản diện giảng đạo lý." },
      hand: { title: "CÔNG CỤ // HÌNH THÁI VẬT LÝ", text: "Bàn tính gãy & cuộn hóa đơn nhiệt dài vô tận; báo giá nẹp xương trả góp lãi suất 18%/tuần." },
      stance: { title: "CƠ CHẾ // VÔ TÌNH HÀI", text: "Không bao giờ an ủi Ký chủ; mọi phản ứng cảm xúc đều bị quy đổi sang điểm Phước Báu." }
    }
  },
  {
    id: "tavocuu",
    code: "ID // 01",
    clearance: "LEVEL 3",
    emblem: "⚖️",
    name: "TẠ VÔ CỮU",
    role: "Tổng Kiểm Toán Trưởng 10 Khu Vực",
    artifact: "Đồng hồ quả quýt bạc vỡ mặt kính chạy ngược & bút máy vỏ thép đen",
    scent: "Tuyết lạnh đầu mùa, mực in hồ sơ lâu năm & thuốc lá bạc hà khô khốc",
    bio: "Thường giáng lâm dưới vỏ bọc Thẩm phán Tòa án Tối cao, Bác sĩ Pháp y độc lập hoặc Khâm sai Đại thần để nghiệm thu màn Báo Ứng. Lạnh lùng, kiệm lời, ghét sự ngu dốt ủy mị. Bí mật: từng là Ký chủ duy nhất vượt qua Điện 10 hàng trăm năm trước, đang âm thầm điều tra đường dây 'Sd.'.",
    quote: "“Tôi đến đây để công chứng bản án phá sản của kẻ thù giúp cô, hoặc ký giấy chứng tử cho cô — tùy thuộc vào thứ cô đặt lên bàn bằng chứng.”",
    zones: {
      head: { title: "ĐẦU // ÁNH MẮT THẨM PHÁN", text: "Gương mặt sắc lạnh khắc nghiệt, sống mũi cao thẳng, quầng thâm nhạt dưới đôi mắt đen sâu thẳm như vực thẳm không đáy." },
      chest: { title: "NGỰC // VEST ĐEN KÍN CỔ", text: "Vest đen tối giản hoặc quan phục thẫm màu cài cúc kín tận yết hầu; nhìn trò khóc lóc trà xanh như xem lũ hề diễn xiếc." },
      hand: { title: "TAY // ĐỒNG HỒ & BÚT THÉP", text: "Cầm đồng hồ quả quýt bạc vỡ mặt kính (kim giây chạy ngược) và bút máy thép đen chuyên ký lệnh Thanh Lý Linh Hồn." },
      stance: { title: "TỔNG THỂ // QUÁ KHỨ ĐIỆN 10", text: "Cao 1m88, vai rộng rắn rỏi. Từ chối xóa ký ức sau Điện 10 để ở lại điều tra đường dây buôn lậu Hào quang mang chữ ký 'Sd.'." }
    }
  },
  {
    id: "lucnha",
    code: "ID // 02",
    clearance: "LEVEL 3",
    emblem: "🪙",
    name: "LỤC NHA",
    role: "Trùm Chợ Đen Xuyên Không",
    artifact: "Sợi dây đỏ quấn cổ tay treo đồng xu đồng đục lỗ vuông dính máu",
    scent: "Rượu trắng nặng độ, thuốc súng trộn trầm hương rẻ tiền & đồng thau cũ",
    bio: "Ký chủ đào tẩu ẩn nấp trong các điểm mù tín hiệu của 10 Khu Vực. Luôn mở tiệm cầm đồ hẻm tối, bar ngầm hoặc sòng bạc để cung cấp vật tư vật lý lách luật (máy nghe lén, bộ mở khóa cơ, thuốc giảm đau) bằng tiền mặt thế giới đó hoặc ân huệ cá nhân.",
    quote: "“Mua thuốc trong cửa hàng con Hệ thống hút máu kia làm gì? Đưa năm trăm tệ đây, hoặc tối nay ở lại lau súng giúp anh.”",
    zones: {
      head: { title: "ĐẦU // VẺ HOANG DÃ RANH MÃNH", text: "Tóc đen hơi rối rủ trán, mắt một mí sắc lẹm luôn nheo lại, khóe miệng ngậm que tăm hoặc điếu thuốc cuốn dở." },
      chest: { title: "CỔ // VẾT SẸO TIA SÉT", text: "Vết sẹo bỏng hình tia sét chạy dọc từ mang tai xuống xương quai xanh — dấu tích bị Hệ thống giật điện trừng phạt." },
      hand: { title: "CỔ TAY // ĐỒNG XU DÍNH MÁU", text: "Cẳng tay gân guốc đầy sẹo dao chém dưới áo sơ mi xắn cao, cổ tay quấn dây đỏ treo đồng xu đồng mòn vẹt chữ." },
      stance: { title: "TỔNG THỂ // CHỢ ĐEN ĐIỂM MÙ", text: "Cao 1m85 săn chắc. Khinh bỉ 80% phí bóc lột của Hệ Thống 00, cực kỳ sòng phẳng trong giao dịch." }
    }
  },
  {
    id: "nguhongdiep",
    code: "ID // 03",
    clearance: "LEVEL 3",
    emblem: "🚬",
    name: "NGU HỒNG DIỆP",
    role: "Giám Ngục Điện Vọng Ngữ (1) & Ái Dục (3)",
    artifact: "Tẩu thuốc bạc chạm hoa bỉ ngạn 20cm & quạt xếp gọng ngà",
    scent: "Nước hoa gỗ hồng mộc nồng nàn, rượu vang lâu năm & khói thuốc anh đào",
    bio: "Quản lý cấp cao chuyên ngồi hàng ghế đầu thưởng thức cảnh tra nam và trà xanh tự đào hố chôn mình, thường mang vỏ bọc Bà trùm truyền thông hoặc Luật sư ly hôn bất bại. Thưởng đậm điểm Bonus nếu Ký chủ vả mặt tàn nhẫn, giáng phạt nếu mềm lòng.",
    quote: "“Đàn ông ngoại tình bảo là bản năng, bị bắt quả tang lại bảo tai nạn. Cưng muốn nghe hắn khóc thêm năm phút hay tống hắn vào tù chiều nay?”",
    zones: {
      head: { title: "ĐẦU // SON ĐỎ RƯỢU CHÁT", text: "Tóc đen nhánh uốn sóng cổ điển, môi đỏ rượu chát, ánh mắt sắc như dao cạo nhìn thấu mọi lời nói dối." },
      chest: { title: "VÓC DÁNG // ĐỒNG HỒ CÁT", text: "Diện sườn xám cách tân xẻ cao hoặc vest nữ may đo ôm sát đường cong cơ thể." },
      hand: { title: "TAY // TẨU BẠC & QUẠT NGÀ", text: "Cầm tẩu thuốc bạc chạm hoa bỉ ngạn dài 20cm và quạt xếp gọng ngà chuyên dùng nâng cằm kẻ đang quỳ dưới đất." },
      stance: { title: "CHÂN // ĐẾ ĐỎ ĐANH THÉP", text: "Giày cao gót đế đỏ gõ nhịp lạnh lùng trên sàn đá; ghét cay ghét đắng đàn ông cặn bã và kẻ lụy tình." }
    }
  },
  {
    id: "tieuthat",
    code: "ID // 04",
    clearance: "LEVEL 1",
    emblem: "🩹",
    name: "TIỂU THẤT (#707)",
    role: "Thực Tập Sinh Hệ Thống (Lao Động Không Lương)",
    artifact: "Cuộn băng gạc y tế & máy tính Casio cũ liệt mất phím dấu cộng (+)",
    scent: "Băng gạc y tế, bụi đường & mùi khét chập điện máy chiếu",
    bio: "Ký chủ đời trước vì ngây thơ cứu người nên bị phản diện lừa sạch phước báu, phải ở lại Cục làm lao động công ích. Thường bị nhét vào xác trợ lý hậu đậu, tiểu đồng gầy trơ xương, mèo hoang trọc lông hoặc robot hút bụi chập mạch.",
    quote: "“Đ-đại ca! Em chỉ định bê chậu nước đi đổ thôi, ai ngờ trượt chân hất vào ổ máy chiếu... sao nó tự phát clip của thiên kim giả vậy?!”",
    zones: {
      head: { title: "ĐẦU // CUỘN BĂNG GẠC", text: "Luôn quấn băng gạc quanh đầu hoặc chân, biểu cảm ngơ ngác sợ sệt trước Thanh Tra Tạ Vô Cữu." },
      chest: { title: "VẬT CHỦ // TIẾT KIỆM CHI PHÍ", text: "Linh hồn thường bị Hệ Thống 00 nhét bừa vào trợ lý hậu đậu, mèo trọc lông hoặc robot hút bụi trong biệt thự." },
      hand: { title: "TAY // CASIO LIỆT PHÍM (+)", text: "Chiếc máy tính bấm tay cũ kỹ liệt hoàn toàn phím dấu cộng (+), chỉ còn bấm được mỗi phím dấu trừ (-)." },
      stance: { title: "CƠ CHẾ // PHÁ ĐÁM VÔ TÌNH", text: "Mang mệnh Cạn Phước: cứ cố giúp lại trượt ngã kéo tụt tóc giả hoặc hất nước làm lộ clip ngoại tình của kẻ thù." }
    }
  },
  {
    id: "sd",
    code: "OMEGA // Sd.",
    clearance: "LEVEL 5 [BỊ NIÊM PHONG]",
    emblem: "💠",
    name: "QUÝ CÔ 'Sd.'",
    role: "Sovereign Director — Trùm Cuối Kiến Tạo Hệ Thống",
    artifact: "Tuxedo đen bóng, nơ đen đính huy hiệu bạc & đóa hoa 4 cánh màu trắng bạc",
    scent: "Tuyết lạnh đỉnh núi cao, hoa linh lan trắng nở về đêm, Gin Tonic đắng & giấy bạc mới",
    bio: "[GROUND TRUTH]: Bề ngoài là Nhà bảo trợ nghệ thuật / Chủ tịch quỹ đầu tư ngầm ngồi ở lô VIP cao nhất. Thực chất là Kẻ Kiến Tạo Hệ Thống Báo Ứng & Trùm Buôn Lậu Khí Vận Đa Vũ Trụ — kẻ đã rút cạn Phước Báu rực rỡ nhất của Ký chủ, xẻ nhỏ ban phát cho lũ Kẻ Cướp Phước để ngồi trên cao thưởng thức vở kịch đòi nợ.",
    quote: "“Khoác lên thứ ánh sáng đi mượn mà cứ ngỡ mình là mặt trời... Bước lên đó và xé toạc lớp da giả tạo của chúng ra cho tôi xem nào.”",
    zones: {
      head: { title: "ĐẦU // ĐÔI MẮT XANH BĂNG", text: "Tóc dài trắng bạch kim bồng bềnh rủ mái chạm hàng mi; da trắng sứ lạnh lẽo, mắt xanh băng khép hờ nhìn từ trên cao xuống." },
      chest: { title: "VE ÁO TRÁI // HOA BỐN CÁNH", text: "Tuxedo đen thủ công, sơ mi trắng xếp ly cúc onyx, nơ đen huy hiệu bạc & đóa hoa bốn cánh trắng bạc cài ve áo trái." },
      hand: { title: "CỬ CHỈ // CHỦ NỢ TỐI CAO", text: "Ngón tay thon dài trắng muốt khẽ chỉnh chiếc nơ đen; chỉ đứng hoặc ngồi trên tầng thượng nhìn xuống đám đông hỗn loạn." },
      stance: { title: "BẢN CHẤT // TRÙM BUÔN LẬU KHÍ VẬN", text: "Cao 1m78 phi giới tính. Chính Sd. là kẻ lập hợp đồng nợ giả và thu hồi 80% phí dịch vụ từ Hệ Thống 00 chảy về tài khoản 'Sd.'." }
    }
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
if (radioTrackName) radioTrackName.textContent = radio.currentTrackName;
radioToggle?.addEventListener("click", () => {
  const playing = radio.toggle();
  radioToggle.querySelector(".radio-icon").textContent = playing ? "❚❚" : "▶";
});
document.getElementById("radio-next")?.addEventListener("click", () => {
  if (radioTrackName) radioTrackName.textContent = radio.nextTrack();
});
document.getElementById("radio-vol")?.addEventListener("input", (e) => radio.setVolume(e.target.value));

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
  if (!isCarouselDragging) carouselPos += (carouselTarget - carouselPos) * 0.14;
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
  const titleEl = document.getElementById("quest-window-title");
  if (titleEl) titleEl.textContent = TAB_TITLES[tabId] || "SYSTEM INFO";

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

document.getElementById("btn-slide-left")?.addEventListener("click", () => {
  if (state.sfx) radio.playClickChime();
  carouselTarget = Math.round(carouselTarget) - 1;
  switchTab(tabCards[modIndex(carouselTarget)].dataset.tab, false);
});
document.getElementById("btn-slide-right")?.addEventListener("click", () => {
  if (state.sfx) radio.playClickChime();
  carouselTarget = Math.round(carouselTarget) + 1;
  switchTab(tabCards[modIndex(carouselTarget)].dataset.tab, false);
});

window.addEventListener("resize", () => {
  layoutCoverflowCards();
  if (!document.getElementById("tab-pyramid")?.classList.contains("hidden")) {
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
    if (!document.getElementById("tab-pyramid")?.classList.contains("hidden")) {
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

document.getElementById("btn-lock-from-pyramid")?.addEventListener("click", () => {
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
  if (receiptFeed) {
    const p = document.createElement("p");
    p.textContent = text;
    receiptFeed.prepend(p);
  }
  if (thermalPaper) {
    const tp = document.createElement("p");
    tp.textContent = text;
    thermalPaper.prepend(tp);
    while (thermalPaper.children.length > 14) thermalPaper.lastChild.remove();
  }
}

function updateStatsUI() {
  const pbText = state.contractLocked && typeof state.pb === "number" ? `${state.pb.toFixed(2)} PB` : "CHƯA KÝ HỢP ĐỒNG";
  const pbSide = document.getElementById("hud-pb-side");
  const codeSide = document.getElementById("hud-code-side");
  const secSide = document.getElementById("hud-sector-badge");
  const manSide = document.getElementById("manifest-mode-label");
  const profilePb = document.getElementById("profile-pb");

  if (pbSide) pbSide.textContent = pbText;
  if (codeSide) codeSide.textContent = state.debtorCode || "CHƯA CẤP";
  if (secSide) secSide.textContent = state.selectedSector;
  if (manSide) manSide.textContent = MANIFEST_FORMS[state.manifestForm]?.label || "POS ĐEN HIỆN ĐẠI";
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
  document.getElementById("audit-result")?.classList.remove("hidden");
  updateLiveDossierPreview();
}

function lockContractFormUI(profileObj) {
  const form = document.getElementById("contract-form");
  if (!form) return;
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
  document.getElementById("contract-lock-banner")?.classList.toggle("hidden", !locked);
  const stBadge = document.getElementById("contract-status-badge");
  if (stBadge) stBadge.textContent = locked ? "ĐÃ NIÊM PHONG (1/1)" : "CHƯA KÝ CHÍNH THỨC";
  updateLiveDossierPreview();
}

document.getElementById("btn-sign-draft")?.addEventListener("click", () => {
  if (state.contractLocked) return;
  if (state.sfx) radio.playClickChime();
  const bundle = buildAuditBundle();
  state.draftAudit = bundle;
  renderAuditReceipt(bundle, false);
  pushReceipt(`【BẢN NHÁP】: Random thử ${bundle.finalPB.toFixed(2)} PB.`);
});

contractFormEl?.addEventListener("submit", async (e) => {
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
document.getElementById("btn-goto-rank")?.addEventListener("click", () => switchTab("tab-ranking"));

// 8. BẢNG XẾP HẠNG 24H GMT+7 + ĐỒNG HỒ CHU KỲ
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

let lastVaultDateKey = getGMT7Info().dateKey;
const DAILY_TAGS = ["Đang cày nợ", "Vận đen cấp SSS", "Săn hào quang", "Khả nghi cao", "Đang bị Tạ Vô Cữu soi"];

async function loadAndRenderLeaderboard() {
  const track = document.getElementById("rank-track");
  if (!track) return;
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
        <div class="rank-info"><strong></strong><small></small></div>
        <div class="rank-pb">${u.meritBalance.toFixed(2)} PB<small>${tag}</small></div>
      `;
      block.querySelector(".rank-info strong").textContent = `${u.displayName} (${u.debtorCode})`;
      block.querySelector(".rank-info small").textContent = `@${u.username} • ${u.sector}`;
      track.appendChild(block);
    });
  } catch (err) {
    track.innerHTML = `<p class="muted" style="padding:12px;">Lỗi đồng bộ: ${err.message}</p>`;
  }
}

document.getElementById("btn-refresh-rank")?.addEventListener("click", () => {
  if (state.sfx) radio.playClickChime();
  loadAndRenderLeaderboard();
});

// 9. KHO TRỌNG ÁN + MÔ PHỎNG !NHIEMVU
const sectorsGrid = document.getElementById("sectors-grid");
let previewSector = SECTORS[0];
function renderSectors() {
  if (!sectorsGrid) return;
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

document.getElementById("btn-random-case")?.addEventListener("click", () => {
  if (state.sfx) radio.playClickChime();
  previewSector = SECTORS[Math.floor(Math.random() * SECTORS.length)];
  document.getElementById("sd-title").textContent = `${previewSector.name} — ${previewSector.sub}`;
  document.getElementById("sd-desc").textContent = previewSector.desc;
  renderSectors();
});
document.getElementById("btn-lock-sector")?.addEventListener("click", () => {
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
if (marketList) {
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
  try { userPosts = await fetchForumComments(40); }
  catch (_) { userPosts = []; }
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
        ? `【BÁO ỨNG NET (TẠM TRÊN MÁY)】: Firebase đang khóa quyền ghi — hãy Publish Rules trên Firebase Console.`
        : `【BÁO ỨNG NET】: Đã đăng bình luận dưới danh nghĩa [${payload.authorLabel}].`
    );
  } catch (err) {
    pushReceipt(`【LỖI BÁO ỨNG NET】: ${err.message}`);
  } finally {
    if (submitBtn) submitBtn.disabled = false;
  }
});

document.getElementById("btn-refresh-forum")?.addEventListener("click", async () => {
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

// 12. TAB 07: KHO HỒ SƠ MẬT (5 BỘ ĐỀ 24H + GỢI Ý TỰ HỦY + MÔ HÌNH 3D + BIO-LAB + BÁO ĐỘNG Sd.)
const VAULT_PROTOCOLS = [
  {
    passcode: "57223",
    riddles: [
      "<strong>Chữ số 1:</strong> Lục Nha bán một món đồ cổ <b>kèm hộp nhung</b> giá tổng cộng <b>110 tệ</b>. Biết món đồ cổ <b>đắt hơn chiếc hộp đúng 100 tệ</b>. Hỏi chiếc hộp giá bao nhiêu tệ?",
      "<strong>Chữ số 2:</strong> Trong ngăn kéo tối om có <b>6 chiếc găng tay đỏ</b> (3 trái, 3 phải) và <b>6 chiếc găng tay đen</b> (3 trái, 3 phải). Không nhìn thấy gì, cần bốc ra <b>tối thiểu bao nhiêu chiếc</b> để <b>CHẮC CHẮN 100%</b> ghép được ít nhất <b>1 đôi hợp lệ cùng màu</b> (1 trái + 1 phải)?",
      "<strong>Chữ số 3:</strong> Hệ Thống 00 thả một loại virus nhân bản <b>gấp đôi số lượng sau mỗi 1 giây</b>. Đúng giây thứ <b>60</b> virus lấp đầy <b>100%</b> bộ nhớ. Hỏi từ lúc virus đạt mức <b>25%</b> thì cần chờ thêm <b>bao nhiêu giây nữa</b> để nó đầy 100%?",
      "<strong>Chữ số 4:</strong> Tạ Vô Cữu giơ một bức ảnh lên và nói: <em>“Cha mẹ tôi không có con trai nào khác ngoài tôi, cũng không có con gái. Nhưng <b>cha của người trong ảnh</b> lại chính là <b>con trai của cha tôi</b>.”</em> Người trong ảnh là ai? (Nhập: <b>1</b> = Chính Tạ Vô Cữu | <b>2</b> = Con ruột của Tạ Vô Cữu | <b>3</b> = Cha của Tạ Vô Cữu | <b>4</b> = Em họ)",
      "<strong>Chữ số 5:</strong> Có 3 nghi phạm <b>A, B, C</b>; biết <b>chỉ có ĐÚNG 1 thủ phạm</b> và <b>chỉ có ĐÚNG 1 người nói thật</b> (2 kẻ còn lại nói dối). <b>A</b> khai: <em>“Tôi không trộm”</em>; <b>B</b> khai: <em>“A đã trộm”</em>; <b>C</b> khai: <em>“Tôi không trộm”</em>. Thủ phạm là ai? (Nhập: <b>1</b> = A | <b>2</b> = B | <b>3</b> = C | <b>0</b> = Vô nghiệm)"
    ],
    clue12: "💡 <b>Tiểu Thất #707:</b> “Em chỉ nhắc nhỏ xíu thôi nhé: nếu cái hộp 10 tệ thì đồ cổ 110 tệ, cộng lại thành 120 mất rồi! Còn câu găng tay đừng nhầm sang bài toán đôi tất không phân biệt trái phải đâu ạ.”",
    clue34: "💡 <b>Tiểu Thất #707:</b> “Virus nhân đôi mỗi giây nghĩa là lùi 1 giây còn một nửa, lùi 2 giây còn 25% đó... Với lại câu bức ảnh, đại ca đọc kỹ hai chữ ‘CHA CỦA’ đứng ở đằng trước ấy!”",
    clue5: "💡 <b>Tiểu Thất #707:</b> “Câu cuối đừng chỉ nhìn mỗi A với B cãi nhau, đại ca thử đặt từng người A, B, C làm thủ phạm rồi đếm xem có ĐÚNG 1 người nói thật không...”",
    cheatMsg: "🆘 <b>Tiểu Thất #707:</b> “Á á thôi được rồi!! Đại ca lì quá đi mất, em chịu thua luôn... Suỵt!! Em vừa bấm trộm máy Casio giúp đại ca rồi, đừng nói với Thanh Tra Tạ Vô Cữu nhé! Mật mã là <b style='letter-spacing:0.18em; color:#fff;'>57223</b>!”"
  },
  {
    passcode: "49326",
    riddles: [
      "<strong>Chữ số 1:</strong> Đồng hồ quả lắc ở Sảnh Chờ 00 gõ hết <b>4 tiếng chuông</b> lúc 4 giờ mất đúng <b>6 giây</b> (tính từ tiếng đầu đến tiếng cuối). Hỏi lúc <b>3 giờ</b>, nó mất <b>mấy giây</b> để gõ hết 3 tiếng chuông?",
      "<strong>Chữ số 2:</strong> Cuốn sổ nợ dày 300 trang (đánh số từ trang 1 đến 300; mỗi <b>tờ</b> gồm 2 trang: mặt lẻ trước, mặt chẵn sau). Tiểu Thất lỡ tay xé rách sạch <b>từ trang 98 đến hết trang 113</b>. Hỏi cậu ta đã xé mất tổng cộng <b>bao nhiêu TỜ giấy</b>?",
      "<strong>Chữ số 3:</strong> Có 4 Con nợ bị đội <b>2 mũ Đen, 2 mũ Trắng</b> (cả 4 đều biết tỷ lệ này). Bức tường dày chắn giữa người số <b>1</b> và <b>2</b>. Số <b>4</b> nhìn thấy mũ của 3 &amp; 2; số <b>3</b> chỉ thấy mũ của 2; số <b>2</b> và <b>1</b> không thấy ai. Thực tế đang đội: <b>1(Đen), 2(Trắng), 3(Đen), 4(Trắng)</b>. Sau 1 phút cả đám im lặng, <b>người số mấy</b> là người đầu tiên chắc chắn 100% đoán đúng màu mũ của mình?",
      "<strong>Chữ số 4:</strong> Tạ Vô Cữu có một số đồng xu nhỏ nhất lớn hơn 1: khi chia cho <b>2, 3, 4</b> đều <b>dư 1</b>, nhưng chia cho <b>5</b> thì <b>chia hết</b>. Lấy <b>chữ số hàng chục</b> của số đồng xu đó.",
      "<strong>Chữ số 5:</strong> Một tra nam đi bộ lên thang cuốn <b>đang chạy ngược chiều đi xuống</b>. Nếu hắn bước lên <b>2 bậc/giây</b> thì mất <b>60 giây</b> mới tới đỉnh; nếu chạy lên <b>3 bậc/giây</b> thì mất <b>30 giây</b> tới đỉnh. Hỏi khi thang cuốn tắt điện đứng yên, nó có tổng cộng bao nhiêu bậc? (Lấy <b>tổng số bậc chia cho 10</b>)"
    ],
    clue12: "💡 <b>Tiểu Thất #707:</b> “Giữa 4 tiếng chuông thực ra chỉ có 3 khoảng nghỉ thôi ạ! Còn sổ sách thì trang 98 nằm chung tờ với trang 97, trang 113 nằm chung tờ với trang 114 đó!”",
    clue34: "💡 <b>Tiểu Thất #707:</b> “Nếu số 2 và số 3 đội cùng màu thì số 4 đã hét lên từ lâu rồi — vì số 4 im lặng nên người nhìn được số 2 biết ngay màu ngược lại! Còn số xu kia trừ đi 1 sẽ chia hết cho 12.”",
    clue5: "💡 <b>Tiểu Thất #707:</b> “Câu thang cuốn cứ đặt tổng bậc là N và tốc độ thang trôi xuống là v: lập N = 60×(2 - v) = 30×(3 - v) là ra ngay ạ!”",
    cheatMsg: "🆘 <b>Tiểu Thất #707:</b> “Thôi đừng bấm nữa mà máy POS sắp bốc khói rồi!! Em liều mạng gạt cần sau lưng giúp đại ca đây — mật mã là <b style='letter-spacing:0.18em; color:#fff;'>49326</b>, nhớ giữ bí mật tuyệt đối nhé!”"
  },
  {
    passcode: "17083",
    riddles: [
      "<strong>Chữ số 1:</strong> Thanh huyền thiết dài <b>5 mét</b> cần cắt thành các đoạn bằng nhau dài <b>1 mét</b>. Mỗi lần cắt mất <b>12 phút</b>, sau mỗi lần cắt phải nghỉ làm mát cưa <b>4 phút</b> (cắt xong đoạn cuối thì nghỉ luôn không tính). Hỏi cắt xong cả thanh mất <b>mấy giờ</b>?",
      "<strong>Chữ số 2:</strong> Tại sảnh tiệc hào môn, mọi người bắt tay nhau đôi một (ai cũng bắt tay tất cả những người còn lại, không lặp lại). Đếm được tổng cộng <b>21 cái bắt tay</b>. Hỏi trong sảnh có <b>tất cả bao nhiêu người</b>?",
      "<strong>Chữ số 3:</strong> Nếu Tiểu Thất mất 2 giờ để đào xong 1 cái hố lập phương 1m × 1m × 1m, hỏi trong <b>nửa cái hố</b> như vậy chứa <b>bao nhiêu mét khối đất</b>?",
      "<strong>Chữ số 4:</strong> Giải E-Sports Điện 9 có <b>259 tuyển thủ</b> thi đấu loại trực tiếp 1v1 (thua 1 trận loại ngay, không hòa) để tìm ra 1 nhà vô địch. Cần tổ chức <b>tổng cộng bao nhiêu trận đấu</b>? (Lấy <b>chữ số hàng đơn vị</b> của tổng số trận)",
      "<strong>Chữ số 5:</strong> Cho 4 chữ số đầu bạn vừa giải là <b>[A]-[B]-[C]-[D]</b>. Chữ số thứ 5 (<b>E</b>) phải thỏa mãn đúng câu khẳng định sau: <em>“Tổng số lượng chữ số <b>nhỏ hơn hoặc bằng 5</b> xuất hiện trong <b>CẢ 5 CHỮ SỐ [A-B-C-D-E]</b> của mật mã này đúng bằng <b>E</b>.”</em> Tìm <b>E</b>?"
    ],
    clue12: "💡 <b>Tiểu Thất #707:</b> “Thanh 5m cắt ra 5 khúc thì chỉ cần 4 nhát cắt và 3 lần nghỉ ở giữa thôi! Còn bắt tay thì công thức là n × (n - 1) / 2 = 21.”",
    clue34: "💡 <b>Tiểu Thất #707:</b> “Đã gọi là CÁI HỐ thì bên trong nó rỗng làm gì có đất ạ... Còn giải đấu loại trực tiếp, muốn tìm 1 nhà vô địch từ 259 người thì bắt buộc phải loại đúng 258 người thua!”",
    clue5: "💡 <b>Tiểu Thất #707:</b> “Câu cuối bẫy ghê lắm! Đừng quên số 0 cũng <= 5, với lại nếu đại ca điền E=2 thì đếm lại cả 5 chữ số sẽ lòi ra tới 3 số <= 5 làm sai đề ngay!”",
    cheatMsg: "🆘 <b>Tiểu Thất #707:</b> “Ái chà đại ca ép em tới đường cùng rồi... Em chịu phạt trừ lương thay đại ca đấy nhé! Mật mã hôm nay là <b style='letter-spacing:0.18em; color:#fff;'>17083</b>!”"
  },
  {
    passcode: "82092",
    riddles: [
      "<strong>Chữ số 1:</strong> Hôm nay là <b>Thứ Hai</b>, Tạ Vô Cữu ký lệnh tạm giam một Kẻ Cướp Phước trong đúng <b>1.000 ngày</b>. Hỏi ngày thả ra rơi vào thứ mấy trong tuần? (Nhập: <b>2</b>=Thứ Hai, <b>3</b>=Thứ Ba ... <b>7</b>=Thứ Bảy, <b>8</b>=Chủ Nhật)",
      "<strong>Chữ số 2:</strong> Một chiếc đồng hồ kim bình thường không ghi số (chỉ có 12 vạch chia đều) được đặt đối diện thẳng trước một <b>tấm gương phẳng</b>. Nhìn vào trong gương thấy đồng hồ đang chỉ <b>9 giờ 45 phút</b>. Hỏi <b>giờ thật</b> lúc đó là mấy giờ? (Chỉ nhập phần <b>GIỜ</b>, ví dụ 3 giờ 15 nhập <b>3</b>, 2 giờ 15 nhập <b>2</b>)",
      "<strong>Chữ số 3:</strong> Giá một vật tư ở Chợ Đen ban đầu được tăng thêm <b>25%</b>, sau đó Lục Nha thấy ế nên giảm giá <b>20%</b> so với giá vừa tăng. Hỏi giá cuối cùng lệch bao nhiêu <b>%</b> so với giá gốc ban đầu? (Nhập một chữ số nguyên)",
      "<strong>Chữ số 4:</strong> Lấy số <b>4</b> chia cho <b>1/2</b> (một phần hai) rồi cộng thêm <b>1</b>. Kết quả bằng bao nhiêu?",
      "<strong>Chữ số 5:</strong> Ngu Hồng Diệp đặt 3 chiếc hộp kín trên bàn; biết <b>CHỈ CÓ ĐÚNG 1 HỘP</b> chứa sổ đen và <b>CHỈ CÓ ĐÚNG 1 NHÃN GHI ĐÚNG SỰ THẬT</b> (2 nhãn còn lại nói dối). Nhãn Hộp <b>1</b>: <em>“Sổ đen ở trong hộp này”</em>; Nhãn Hộp <b>2</b>: <em>“Sổ đen KHÔNG ở trong hộp này”</em>; Nhãn Hộp <b>3</b>: <em>“Sổ đen KHÔNG ở trong hộp 1”</em>. Sổ đen nằm ở <b>hộp số mấy</b>?"
    ],
    clue12: "💡 <b>Tiểu Thất #707:</b> “1.000 chia 7 dư mấy thì đếm tiến bấy nhiêu ngày từ Thứ Hai! Còn đồng hồ trong gương chỉ 9h45 nghĩa là kim giờ gần chạm vạch 10, soi gương qua trục 12-6 nó sẽ nằm giữa vạch 2 và 3 chứ không phải quá 3 đâu ạ!”",
    clue34: "💡 <b>Tiểu Thất #707:</b> “Thử lấy giá gốc là 100 tệ rồi nhân 1.25 xong nhân tiếp 0.8 xem ra bao nhiêu! Còn chia cho 1/2 là nhân đảo ngược với 2 chứ không phải chia đôi đâu nha!”",
    clue5: "💡 <b>Tiểu Thất #707:</b> “Câu 3 hộp cứ giả sử lần lượt sổ nằm trong hộp 1, 2, hoặc 3 rồi đếm xem trường hợp nào chỉ có ĐÚNG 1 nhãn nói thật!”",
    cheatMsg: "🆘 <b>Tiểu Thất #707:</b> “Thôi xong em rồi, lỡ tay bấm mở khóa giúp đại ca mất tiêu... Suỵt!! Mật mã hôm nay là <b style='letter-spacing:0.18em; color:#fff;'>82092</b>, xóa lịch sử giùm em nha!”"
  },
  {
    passcode: "63148",
    riddles: [
      "<strong>Chữ số 1:</strong> Đi bộ từ <b>tầng 1 lên tầng 4</b> của Cục Báo Ứng phải bước qua tổng cộng <b>30 bậc thang</b> (các tầng cách đều nhau). Hỏi đi từ <b>tầng 1 lên thẳng tầng 7</b> phải bước qua tổng cộng bao nhiêu bậc thang? (Lấy <b>tổng số bậc chia cho 10</b>)",
      "<strong>Chữ số 2:</strong> Trong một căn phòng kín chỉ có: <b>1 người ông, 2 người cha, 2 người con trai và 1 người cháu nội</b>. Hỏi trong phòng đó có <b>tối thiểu bao nhiêu người</b>?",
      "<strong>Chữ số 3:</strong> Lục Nha phơi <b>1 chiếc áo khoác</b> ngoài trời nắng thì mất đúng <b>1 giờ</b> mới khô hoàn toàn. Hỏi phơi <b>6 chiếc áo khoác</b> giống hệt nhau trên cùng một dây phơi dưới nắng đó mất <b>mấy giờ</b> để cả 6 chiếc đều khô?",
      "<strong>Chữ số 4:</strong> Trong hộp tối có <b>4 quả cầu đỏ</b>, <b>4 quả cầu xanh</b> và <b>4 quả cầu vàng</b>. Bịt mắt lại, cần bốc tối thiểu bao nhiêu quả để <b>CHẮC CHẮN 100%</b> có ít nhất <b>2 quả CÙNG MÀU</b>?",
      "<strong>Chữ số 5:</strong> Lúc đi đòi nợ từ Sảnh 00 tới Điện 1, xe của Tiểu Thất chạy với vận tốc không đổi <b>6 km/h</b>. Lúc quay về đúng trên quãng đường cũ đó, xe chạy với vận tốc <b>12 km/h</b>. Hỏi <b>vận tốc trung bình</b> của cả lượt đi lẫn lượt về là bao nhiêu km/h?"
    ],
    clue12: "💡 <b>Tiểu Thất #707:</b> “Từ tầng 1 lên tầng 4 chỉ đi qua 3 đoạn cầu thang thôi, chứ không phải 4 đoạn đâu! Còn câu gia đình, một người đàn ông vừa có thể làm cha vừa có thể làm con trai mà!”",
    clue34: "💡 <b>Tiểu Thất #707:</b> “Áo phơi cùng lúc thì gió nắng thổi qua cả 6 cái một lượt chứ đâu có đợi cái này khô mới tới cái kia! Còn bốc cầu thì trường hợp xui nhất là bốc 3 quả 3 màu khác nhau...”",
    clue5: "💡 <b>Tiểu Thất #707:</b> “Vận tốc trung bình KHÔNG phải (6 + 12) / 2 đâu ạ!! Đại ca thử giả sử quãng đường một chiều dài 12km rồi tính Tổng quãng đường / Tổng thời gian xem!”",
    cheatMsg: "🆘 <b>Tiểu Thất #707:</b> “Huhu em đầu hàng trước sự kiên trì của đại ca... Bấm lén hộ một lần duy nhất thôi đấy! Mật mã hôm nay là <b style='letter-spacing:0.18em; color:#fff;'>63148</b>!”"
  }
];

const NPC_OVERRIDE_KEY = "bao_ung_npc_overrides";
function getNpcOverrides() {
  try { return JSON.parse(localStorage.getItem(NPC_OVERRIDE_KEY) || "{}"); }
  catch { return {}; }
}
function getMergedNpcStats(npcId) {
  const base = SITE_CONFIG.npcProfiles?.[npcId] || {};
  const ov = getNpcOverrides()[npcId] || {};
  return { ...base, ...ov };
}
function getDailyVaultProtocolIndex() {
  const { dateKey } = getGMT7Info();
  return hashSeed(`vault_daily:${dateKey}`) % VAULT_PROTOCOLS.length;
}

let activeProtocolIdx = getDailyVaultProtocolIndex();
let vaultAttempts = 0;
let cardLoadTimer = null;

const vaultLockScreen = document.getElementById("vault-lock-screen");
const vaultCardsStage = document.getElementById("vault-cards-stage");
const vaultCardsGrid = document.getElementById("vault-cards-grid");
const vaultErrMsg = document.getElementById("vault-error-msg");
const vaultHintBox = document.getElementById("vault-hint-box");
const vaultHintBtn = document.getElementById("btn-vault-hint");
const intrusionOverlay = document.getElementById("intrusion-overlay");
const intrusionTimerEl = document.getElementById("intrusion-timer");
const intrusionBarEl = document.getElementById("intrusion-progress-bar");
const npcDossierModal = document.getElementById("npc-dossier-modal");

let intrusionInterval = null;
let intrusionTimeout = null;
let savedThemeBeforeAlarm = null;
let hintSelfDestructInterval = null;
let hintSelfDestructTimeout = null;

function clearVaultHintBox() {
  clearInterval(hintSelfDestructInterval);
  clearTimeout(hintSelfDestructTimeout);
  state.vaultHintStep = 0;
  if (vaultHintBox) {
    vaultHintBox.classList.add("hidden");
    vaultHintBox.innerHTML = "";
  }
}

function renderVaultRiddles() {
  activeProtocolIdx = getDailyVaultProtocolIndex();
  const proto = VAULT_PROTOCOLS[activeProtocolIdx];
  const badgeEl = document.getElementById("vault-protocol-badge");
  const titleEl = document.getElementById("vault-protocol-title");
  const listEl = document.getElementById("vault-riddle-list");
  if (badgeEl) badgeEl.textContent = "SECURITY CLEARANCE // LEVEL 5";
  if (titleEl) titleEl.textContent = "🔐 KÉT LƯU TRỮ HỒ SƠ MẬT — XÁC THỰC TRÍ TUỆ";
  if (listEl) listEl.innerHTML = proto.riddles.map((r) => `<li>${r}</li>`).join("");

  clearVaultHintBox();
  vaultAttempts = 0;
  if (vaultHintBtn) vaultHintBtn.textContent = "💡 HỎI TIỂU THẤT";
  if (vaultErrMsg) vaultErrMsg.textContent = "";
  const inp = document.getElementById("vault-pass-input");
  if (inp) inp.value = "";
}

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

// MÔ HÌNH 3D XOAY 360 + CHỈ ĐIỂM VÙNG + BIỂU ĐỒ AI CHẠY
let currentLabNpc = null;
let currentLabZone = "head";
let aiChartTimer = null;
let aiStreamTimer = null;
const aiBars = Array.from({ length: 22 }, () => 25 + Math.random() * 65);
let aiPhase = 0;

function updateMorphCalloutLines(projectedPts) {
  const pod = document.getElementById("lab-morph-pod");
  const svg = document.getElementById("lab-callout-svg");
  if (!pod || !svg || !projectedPts) return;

  const pRect = pod.getBoundingClientRect();
  if (!pRect.width || !pRect.height) return;

  let html = "";
  Object.entries(projectedPts).forEach(([zoneKey, pt]) => {
    const btn = pod.querySelector(`.zone-pin-btn[data-zone="${zoneKey}"]`);
    if (!btn) return;
    const bRect = btn.getBoundingClientRect();
    const isLeft = bRect.left - pRect.left < pRect.width * 0.5;
    const endX = isLeft ? (bRect.right - pRect.left) : (bRect.left - pRect.left);
    const endY = bRect.top + bRect.height * 0.5 - pRect.top;
    const midX = pt.x + (endX - pt.x) * 0.45;
    const activeCls = zoneKey === currentLabZone ? "is-active" : "";

    html += `<path class="${activeCls}" d="M ${pt.x.toFixed(1)} ${pt.y.toFixed(1)} L ${midX.toFixed(1)} ${endY.toFixed(1)} L ${endX.toFixed(1)} ${endY.toFixed(1)}" />`;
    html += `<circle cx="${pt.x.toFixed(1)}" cy="${pt.y.toFixed(1)}" r="${zoneKey === currentLabZone ? 4 : 2.6}" />`;
  });
  svg.innerHTML = html;
}

const npcMorph3D = initNpcMorph3D({
  canvasId: "lab-morph-canvas",
  onProjectZones: (pts) => {
    if (!npcDossierModal?.classList.contains("hidden")) updateMorphCalloutLines(pts);
  },
  onSelectZone: (zoneKey) => selectLabZone(zoneKey)
});

function selectLabZone(zoneKey) {
  if (!currentLabNpc) return;
  currentLabZone = zoneKey;
  npcMorph3D.setActiveZone(zoneKey);

  document.querySelectorAll(".zone-pin-btn").forEach((b) =>
    b.classList.toggle("is-active", b.dataset.zone === zoneKey)
  );

  const info = currentLabNpc.zones?.[zoneKey];
  const detailBox = document.getElementById("lab-zone-detail");
  if (detailBox && info) {
    detailBox.innerHTML = `<strong>[CHỈ ĐIỂM VÙNG: ${info.title}]</strong>${info.text}`;
  }
}

document.querySelectorAll(".zone-pin-btn").forEach((btn) =>
  btn.addEventListener("click", () => {
    if (state.sfx) radio.playClickChime();
    selectLabZone(btn.dataset.zone);
  })
);

function startAiLabTelemetryLoop(npc, stats) {
  stopAiLabTelemetryLoop();
  const chart = document.getElementById("lab-ai-chart");
  const ctx = chart?.getContext("2d");
  const ecg = document.getElementById("lab-ecg-canvas");
  const ecgCtx = ecg?.getContext("2d");
  const streamBox = document.getElementById("lab-ai-stream");

  const aiPackets = [
    `> AI_CORE: Syncing ${npc.code} neural topology...`,
    `> BIOMETRICS: Height ${stats.heightCm || 175}cm | Temp ${stats.bodyTemp || "36.6°C"}`,
    `> OLFACTORY_ID: ${npc.scent?.slice(0, 34) || "Unknown"}...`,
    `> CAUSALITY_CHECK: Clearance [${npc.clearance}] active.`,
    `> BEHAVIOR_MODEL: Analyzing psychological resonance...`,
    `> TELEMETRY_NODE: 0x${Math.floor(Math.random() * 65535).toString(16).toUpperCase().padStart(4, "0")} OK`
  ];
  let packetCursor = 0;

  aiStreamTimer = setInterval(() => {
    if (!streamBox) return;
    const div = document.createElement("div");
    if (packetCursor % 3 === 0) div.className = "hot";
    div.textContent = aiPackets[packetCursor % aiPackets.length] + ` [${(95 + Math.random() * 4.9).toFixed(1)}%]`;
    packetCursor++;
    streamBox.prepend(div);
    if (streamBox.children.length > 7) streamBox.lastChild.remove();
  }, 520);

  function renderChart() {
    const st = getComputedStyle(htmlEl);
    const pRgb = st.getPropertyValue("--rgb-primary").trim() || "0, 229, 255";
    const sRgb = st.getPropertyValue("--rgb-secondary").trim() || "94, 168, 255";
    aiPhase += 0.085;

    if (ctx && chart) {
      const w = chart.width, h = chart.height;
      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = `rgba(${pRgb}, 0.12)`;
      ctx.lineWidth = 1;
      for (let y = 22; y < h; y += 22) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }

      const colW = w / aiBars.length;
      for (let i = 0; i < aiBars.length; i++) {
        aiBars[i] += (Math.random() - 0.5) * 12;
        aiBars[i] = Math.max(12, Math.min(82, aiBars[i]));
        const bh = (aiBars[i] / 100) * (h - 14);
        ctx.fillStyle = i % 4 === 0 ? `rgba(${sRgb}, 0.68)` : `rgba(${pRgb}, 0.42)`;
        ctx.fillRect(i * colW + 3, h - bh, colW - 6, bh);
      }

      ctx.strokeStyle = `rgba(${sRgb}, 0.95)`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 6) {
        const y = h * 0.42 + Math.sin(x * 0.045 + aiPhase) * 15 + Math.cos(x * 0.11 - aiPhase * 1.4) * 6;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.strokeStyle = `rgba(${pRgb}, 0.8)`;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 6) {
        const y = h * 0.58 + Math.cos(x * 0.05 - aiPhase * 1.2) * 11;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    if (ecgCtx && ecg) {
      const w = ecg.width, h = ecg.height;
      ecgCtx.clearRect(0, 0, w, h);
      ecgCtx.strokeStyle = `rgba(${pRgb}, 0.92)`;
      ecgCtx.lineWidth = 1.4;
      ecgCtx.beginPath();
      for (let x = 0; x < w; x += 2) {
        const ph = (x * 0.11 - aiPhase * 2.2) % (Math.PI * 2);
        const normPh = ph < 0 ? ph + Math.PI * 2 : ph;
        let spike = 0;
        if (normPh > 2.5 && normPh < 2.8) spike = -14;
        else if (normPh >= 2.8 && normPh < 3.05) spike = 9;
        else if (normPh > 1.9 && normPh < 2.2) spike = -4;
        const y = h * 0.55 + spike + Math.sin(x * 0.18 + aiPhase) * 1.2;
        x === 0 ? ecgCtx.moveTo(x, y) : ecgCtx.lineTo(x, y);
      }
      ecgCtx.stroke();
    }

    aiChartTimer = requestAnimationFrame(renderChart);
  }
  renderChart();
}

function stopAiLabTelemetryLoop() {
  cancelAnimationFrame(aiChartTimer);
  clearInterval(aiStreamTimer);
}

function openNpcBioLabModal(npc) {
  currentLabNpc = npc;
  const stats = getMergedNpcStats(npc.id);
  const h = Number(stats.heightCm) || 175;
  const w = Number(stats.weightKg) || 0;
  const bmiText = w > 0 ? (w / Math.pow(h / 100, 2)).toFixed(1) : "N/A";

  document.getElementById("lab-subject-id").textContent = `>> BUREAU BIO-VAULT // ${npc.code}`;
  document.getElementById("lab-npc-name").textContent = npc.name;
  document.getElementById("lab-npc-role").textContent = `${npc.role} • ${stats.build || ""}`;

  const portraitBox = document.getElementById("lab-portrait-box");
  if (portraitBox) {
    if ((stats.avatarUrl || "").trim()) {
      portraitBox.innerHTML = `<img src="${stats.avatarUrl.trim()}" alt="${npc.name}" /><div class="portrait-scan-beam"></div>`;
    } else {
      portraitBox.innerHTML = `<div class="portrait-empty-holo"><span>${npc.emblem}</span>CHƯA CÀI ẢNH CHÂN DUNG<br/><small>(Dán link vào config.js hoặc ⚙️ Setting)</small></div><div class="portrait-scan-beam"></div>`;
    }
  }

  const vitalList = document.getElementById("lab-vital-list");
  if (vitalList) {
    const vitals = [
      ["HEART RATE", stats.heartRate || "68 BPM"],
      ["KARMIC PRESSURE", stats.pressure || "115/75"],
      ["BODY TEMP", stats.bodyTemp || "36.6 °C"],
      ["SOUL SYNC", stats.soulSat || "98%"],
      ["SCENT ID", npc.scent || "Không rõ"]
    ];
    vitalList.innerHTML = vitals.map(([k, v]) => `<div class="vital-row"><span>${k}</span><strong>${v}</strong></div>`).join("");
  }

  document.getElementById("lab-morph-tag").textContent = `${(stats.gender || "Nam").toUpperCase()} • ${h} CM`;
  document.getElementById("lab-morph-stats").innerHTML = `
    <div><small>GIỚI TÍNH</small><strong>${stats.gender || "Nam"}</strong></div>
    <div><small>TUỔI</small><strong>${stats.age || "??"}</strong></div>
    <div><small>CHIỀU CAO</small><strong>${h} CM</strong></div>
    <div><small>CÂN NẶNG / BMI</small><strong>${w > 0 ? `${w} KG (${bmiText})` : "PHI VẬT CHẤT"}</strong></div>
  `;

  // 3 Đồng hồ tròn xoay AI (giống Ảnh 2)
  const radialBox = document.getElementById("lab-radial-gauges");
  if (radialBox) {
    const bars = stats.bars || [{ label: "SYNC", val: 92 }];
    const gaugeData = [
      { label: "THREAT", val: bars[0]?.val ?? 95 },
      { label: "STABILITY", val: bars[1]?.val ?? 98 },
      { label: "CONTROL", val: bars[2]?.val ?? 94 }
    ];
    const r = 19;
    const circ = 2 * Math.PI * r;
    radialBox.innerHTML = gaugeData.map((g) => {
      const dash = (g.val / 100) * circ;
      return `
        <div class="radial-gauge-item">
          <svg viewBox="0 0 48 48">
            <circle class="bg" cx="24" cy="24" r="${r}" />
            <circle class="fg" cx="24" cy="24" r="${r}" stroke-dasharray="${dash.toFixed(1)} ${circ.toFixed(1)}" />
          </svg>
          <strong>${g.val}%</strong>
          <span>${g.label}</span>
        </div>
      `;
    }).join("");
  }

  // Thanh LED 16 vạch siêu mảnh
  const segList = document.getElementById("lab-seg-bars");
  if (segList) {
    const bars = stats.bars || [{ label: "SYNC LEVEL", val: 92 }];
    segList.innerHTML = bars.map((b) => {
      const litCount = Math.round((b.val / 100) * 16);
      const cells = Array.from({ length: 16 }, (_, idx) => `<i class="${idx < litCount ? "on" : ""}"></i>`).join("");
      return `<div class="seg-bar-item"><div class="seg-bar-label"><span>${b.label}</span><span>${b.val}%</span></div><div class="seg-cells">${cells}</div></div>`;
    }).join("");
  }

  document.getElementById("lab-artifact").textContent = npc.artifact || "Không rõ";
  document.getElementById("lab-bio").textContent = npc.bio;
  document.getElementById("lab-quote").textContent = npc.quote;

  npcDossierModal?.classList.remove("hidden");
  requestAnimationFrame(() => {
    npcMorph3D.setSubject(npc, stats);
    selectLabZone("head");
    startAiLabTelemetryLoop(npc, stats);
  });
  if (state.sfx) radio.playClickChime();
}

function closeNpcBioLabModal() {
  stopAiLabTelemetryLoop();
  npcDossierModal?.classList.add("hidden");
  document.querySelectorAll(".dossier-flip-card.is-flipped").forEach((c) => c.classList.remove("is-flipped"));
}
document.getElementById("btn-close-npc-modal")?.addEventListener("click", closeNpcBioLabModal);

function runCardLoadingThenOpenModal(cardEl, npc) {
  clearInterval(cardLoadTimer);
  document.querySelectorAll(".dossier-flip-card.is-flipped").forEach((c) => {
    if (c !== cardEl) c.classList.remove("is-flipped");
  });

  if (state.sfx) radio.playFlipChime();
  cardEl.classList.add("is-flipped");

  const fillEl = cardEl.querySelector(".loading-bar-fill");
  const pctEl = cardEl.querySelector(".loading-pct");
  const streamEl = cardEl.querySelector(".loading-stream-lines");
  if (fillEl) fillEl.style.width = "0%";
  if (streamEl) streamEl.innerHTML = "";

  const packets = [
    `> ACCESSING BUREAU_NODE: ${npc.code}...`,
    `> DECRYPTING BIOMETRIC STREAM [AES-512]...`,
    `> BUILDING 3D ANATOMY MESH & HOTSPOTS...`,
    `> COMPILING AI DIAGNOSTICS & VITAL MATRIX...`,
    `> DATA READY. EXPANDING 3D BIO-LAB!`
  ];

  let pct = 0;
  let pktIdx = 0;
  cardLoadTimer = setInterval(() => {
    pct = Math.min(100, pct + 14);
    if (fillEl) fillEl.style.width = `${pct}%`;
    if (pctEl) pctEl.textContent = `${pct}%`;
    if (streamEl && pktIdx < packets.length && pct >= pktIdx * 20) {
      const line = document.createElement("div");
      line.textContent = packets[pktIdx++];
      streamEl.appendChild(line);
    }
    if (pct >= 100) {
      clearInterval(cardLoadTimer);
      setTimeout(() => openNpcBioLabModal(npc), 160);
    }
  }, 85);
}

function renderVaultCards() {
  if (!vaultCardsGrid) return;
  vaultCardsGrid.innerHTML = "";

  VAULT_NPCS.forEach((npc) => {
    const stats = getMergedNpcStats(npc.id);
    const card = document.createElement("div");
    card.className = `dossier-flip-card ${npc.isSd ? "is-sd-card" : ""}`;

    const frontHint = npc.isSd
      ? `<span class="sd-err-tag">[TRUY CẬP BỊ CẤM // KHÔNG CÓ QUYỀN]</span>`
      : `[ BẤM LẬT THẺ &amp; QUÉT 3D ]`;

    const thumbHtml = (stats.avatarUrl || "").trim()
      ? `<img src="${stats.avatarUrl.trim()}" alt="" style="width:54px;height:54px;border-radius:50%;object-fit:cover;border:1.5px solid var(--c-primary);" />`
      : npc.emblem;

    card.innerHTML = `
      <div class="dossier-card-inner">
        <div class="dossier-face dossier-face-front">
          <div class="dossier-top-tag"><span>${npc.code}</span><span>${npc.clearance}</span></div>
          <div class="dossier-emblem">${thumbHtml}</div>
          <div class="dossier-front-title">
            <strong>${npc.name}</strong>
            <small>${npc.role}</small>
          </div>
          <div class="dossier-flip-hint">${frontHint}</div>
        </div>
        <div class="dossier-face dossier-face-back">
          <div class="dossier-loading-screen">
            <div class="loading-title">LOADING TELEMETRY... <span class="loading-pct">0%</span></div>
            <div class="loading-bar-track"><div class="loading-bar-fill"></div></div>
            <div class="loading-stream-lines"></div>
          </div>
        </div>
      </div>
    `;

    card.addEventListener("click", () => {
      if (npc.isSd) {
        triggerSdIntrusionAlert(card);
        return;
      }
      runCardLoadingThenOpenModal(card, npc);
    });

    vaultCardsGrid.appendChild(card);
  });
}

// BẢNG SETTING ẢNH & DÁNG NPC
const npcEditorPanel = document.getElementById("npc-editor-panel");
const npcEditSelect = document.getElementById("npc-edit-select");
function syncNpcEditorFields() {
  if (!npcEditSelect) return;
  const st = getMergedNpcStats(npcEditSelect.value);
  document.getElementById("npc-edit-gender").value = st.gender || "Nam";
  document.getElementById("npc-edit-height").value = st.heightCm || 175;
  document.getElementById("npc-edit-weight").value = st.weightKg ?? 65;
  document.getElementById("npc-edit-avatar").value = st.avatarUrl?.startsWith("data:") ? "" : (st.avatarUrl || "");
}
document.getElementById("btn-toggle-npc-editor")?.addEventListener("click", () => {
  if (state.sfx) radio.playClickChime();
  npcEditorPanel?.classList.toggle("hidden");
  syncNpcEditorFields();
});
npcEditSelect?.addEventListener("change", syncNpcEditorFields);

document.getElementById("btn-npc-preview-lab")?.addEventListener("click", () => {
  const npc = VAULT_NPCS.find((n) => n.id === npcEditSelect.value);
  if (npc) openNpcBioLabModal(npc);
});

document.getElementById("npc-edit-file")?.addEventListener("change", (e) => {
  const file = e.target.files?.[0];
  if (!file || !npcEditSelect) return;
  const reader = new FileReader();
  reader.onload = () => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      c.width = 360; c.height = 440;
      const ctx = c.getContext("2d");
      const ratio = Math.max(c.width / img.width, c.height / img.height);
      const nw = img.width * ratio, nh = img.height * ratio;
      ctx.drawImage(img, (c.width - nw) / 2, (c.height - nh) / 2, nw, nh);
      const ov = getNpcOverrides();
      const id = npcEditSelect.value;
      ov[id] = { ...(ov[id] || {}), avatarUrl: c.toDataURL("image/webp", 0.85) };
      localStorage.setItem(NPC_OVERRIDE_KEY, JSON.stringify(ov));
      renderVaultCards();
      pushReceipt(`> Đã tải ảnh test cho NPC [${id}].`);
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

npcEditorPanel?.addEventListener("submit", (e) => {
  e.preventDefault();
  if (state.sfx) radio.playClickChime();
  const id = npcEditSelect.value;
  const ov = getNpcOverrides();
  const urlVal = document.getElementById("npc-edit-avatar").value.trim();
  ov[id] = {
    ...(ov[id] || {}),
    gender: document.getElementById("npc-edit-gender").value,
    heightCm: Number(document.getElementById("npc-edit-height").value) || 175,
    weightKg: Number(document.getElementById("npc-edit-weight").value) || 0
  };
  if (urlVal) ov[id].avatarUrl = urlVal;
  localStorage.setItem(NPC_OVERRIDE_KEY, JSON.stringify(ov));
  renderVaultCards();
  pushReceipt(`> Đã lưu cấu hình ảnh & thể hình cho [${id}].`);
});

document.getElementById("btn-npc-copy-cfg")?.addEventListener("click", () => {
  const id = npcEditSelect.value;
  const st = getMergedNpcStats(id);
  const snippet = `${id}: {\n  avatarUrl: "${st.avatarUrl || ""}",\n  gender: "${st.gender}",\n  heightCm: ${st.heightCm},\n  weightKg: ${st.weightKg}\n}`;
  navigator.clipboard?.writeText(snippet);
  if (state.sfx) radio.playClickChime();
  pushReceipt(`> Đã copy cấu hình [${id}] vào Clipboard để dán vào js/config.js.`);
});

document.getElementById("btn-npc-reset")?.addEventListener("click", () => {
  localStorage.removeItem(NPC_OVERRIDE_KEY);
  syncNpcEditorFields();
  renderVaultCards();
  pushReceipt("> Đã đặt lại ảnh & dáng NPC về mặc định của config.js.");
});

function setVaultState(unlocked) {
  state.vaultUnlocked = unlocked;
  if (unlocked) clearVaultHintBox();
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
    pushReceipt("🔓 【HỒ SƠ MẬT】: Giải mã thành công. Đã mở quyền xem Kho Thẻ Nhân Sự.");
  } else {
    vaultAttempts += 1;
    if (state.sfx) radio.playFlipChime();
    if (passInput) {
      passInput.classList.remove("is-wrong");
      void passInput.offsetWidth;
      passInput.classList.add("is-wrong");
    }
    const snark = vaultAttempts >= 3
      ? "Hệ Thống 00 ghi nhận chỉ số đọc hiểu đang báo động đỏ. Kiểm tra kỹ bẫy từng chữ!"
      : "Bạn đã rơi vào bẫy đọc lướt! Tính ngược lại từng chữ số một.";
    if (vaultErrMsg) vaultErrMsg.textContent = `❌ Sai mật mã [${val || "trống"}]: ${snark}`;
    pushReceipt(`【KÉT BẢO MẬT】: Nhập sai mật mã [${val}].`);
  }
});

vaultHintBtn?.addEventListener("click", () => {
  if (state.sfx) radio.playClickChime();
  if (state.vaultHintStep === 7) {
    clearVaultHintBox();
    return;
  }

  const proto = VAULT_PROTOCOLS[activeProtocolIdx];
  state.vaultHintStep += 1;
  const step = state.vaultHintStep;
  if (!vaultHintBox) return;

  clearInterval(hintSelfDestructInterval);
  clearTimeout(hintSelfDestructTimeout);

  vaultHintBox.classList.remove("hidden");
  const messages = {
    1: "😅 <b>Tiểu Thất #707:</b> “Không được đâu đại ca ơi! Thanh Tra Tạ Vô Cữu đang đứng ngay phòng Kiểm toán bên cạnh, lộ là em bị trừ thêm 500 năm lao động công ích mất!”",
    2: "🩹 <b>Tiểu Thất #707:</b> “Thật ra sáng nay em tính nháp trên máy Casio rồi... nhưng máy em liệt phím dấu cộng (+), chỉ còn mỗi phím dấu trừ (-). Đại ca đọc kỹ bẫy từng câu một chút đi ạ!”",
    3: proto.clue12,
    4: proto.clue34,
    5: proto.clue5,
    6: "😰 <b>Tiểu Thất #707:</b> <em>(Ngó nghiêng xem Tạ Vô Cữu có đi ngang qua không)</em> “Đừng bấm nữa mà đại ca... em toát hết mồ hôi lạnh rồi đây này, nhỡ hệ thống phát hiện ra em tuồn thông tin là cả hai đứa bị thanh lý luôn đó!!”",
    7: `${proto.cheatMsg}
        <div class="hint-destruct-bar">
          <span>⏱️ Tự xóa dấu vết trước khi Tạ Vô Cữu phát hiện: <b id="hint-cd-sec">5.0s</b></span>
          <div class="hint-cd-track"><i id="hint-cd-fill" style="width:100%"></i></div>
        </div>`
  };

  vaultHintBox.innerHTML = messages[step];

  if (step === 7) {
    pushReceipt("🆘 【TIỂU THẤT #707】: Đã lén lộ mật mã trong 5 giây (đừng để Tạ Vô Cữu thấy!).");
    const DURATION_MS = 5000;
    const startedAt = Date.now();
    const secEl = document.getElementById("hint-cd-sec");
    const fillEl = document.getElementById("hint-cd-fill");

    hintSelfDestructInterval = setInterval(() => {
      const rem = Math.max(0, DURATION_MS - (Date.now() - startedAt));
      if (secEl) secEl.textContent = `${(rem / 1000).toFixed(1)}s`;
      if (fillEl) fillEl.style.width = `${(rem / DURATION_MS) * 100}%`;
    }, 60);

    hintSelfDestructTimeout = setTimeout(() => {
      clearVaultHintBox();
      pushReceipt("💨 【TIỂU THẤT #707】: Đã xóa sạch dấu vết mật mã kịp lúc.");
    }, DURATION_MS);
  }
});

document.getElementById("btn-vault-lock")?.addEventListener("click", () => {
  if (state.sfx) radio.playClickChime();
  const inp = document.getElementById("vault-pass-input");
  if (inp) inp.value = "";
  clearVaultHintBox();
  setVaultState(false);
  pushReceipt("🔒 【KÉT BẢO MẬT】: Đã khóa lại Kho Hồ Sơ Mật.");
});

renderVaultRiddles();

// ĐỒNG HỒ CHU KỲ 24H GMT+7 (BXH + KÉT BẢO MẬT)
setInterval(() => {
  const { dateKey, countdown, gmt7Time } = getGMT7Info();
  const clockEl = document.getElementById("clock-utc");
  if (clockEl) clockEl.textContent = `${gmt7Time} +7`;

  const cdEl = document.getElementById("rank-countdown");
  const dtEl = document.getElementById("rank-date-gmt7");
  if (cdEl) cdEl.textContent = countdown;
  if (dtEl && dtEl.textContent !== "----/--/--" && dtEl.textContent !== dateKey) loadAndRenderLeaderboard();

  const vCdEl = document.getElementById("vault-countdown");
  if (vCdEl) vCdEl.textContent = countdown;
  if (lastVaultDateKey && lastVaultDateKey !== dateKey) {
    lastVaultDateKey = dateKey;
    renderVaultRiddles();
    if (state.vaultUnlocked) setVaultState(false);
    pushReceipt("【KÉT BẢO MẬT 24H】: Đã sang chu kỳ mới — Hệ thống tự động cập nhật bộ câu hỏi xác thực.");
  }

  const hexEl = document.getElementById("hex-matrix");
  if (hexEl) {
    const bytes = Array.from({ length: 3 }, () => Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, "0"));
    hexEl.textContent = `0x${bytes.join(" ")}`;
  }
}, 1000);

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
const openModal = (id) => document.getElementById(id)?.classList.remove("hidden");
const closeModal = (id) => document.getElementById(id)?.classList.add("hidden");
document.querySelectorAll("[data-close-modal]").forEach((btn) =>
  btn.addEventListener("click", () => closeModal(btn.dataset.closeModal))
);
document.getElementById("btn-auth")?.addEventListener("click", () => openModal("modal-auth"));

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
    document.getElementById("user-dot")?.classList.remove("online");
    topAvatar?.classList.add("hidden");
    const uLbl = document.getElementById("user-label");
    if (uLbl) uLbl.textContent = "ĐĂNG NHẬP";
    authOut?.classList.remove("hidden");
    authIn?.classList.add("hidden");
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
  if (topAvatar) { topAvatar.src = avt; topAvatar.classList.remove("hidden"); }
  const profAvt = document.getElementById("profile-avatar");
  if (profAvt) profAvt.src = avt;
  const avtInput = document.getElementById("avatar-url-input");
  if (avtInput) avtInput.value = profile.avatarUrl?.startsWith("http") ? profile.avatarUrl : "";

  document.getElementById("user-dot")?.classList.add("online");
  document.getElementById("user-label").textContent = profile.displayName || profile.username;
  document.getElementById("profile-name").textContent = state.contractLocked ? `Con nợ ${state.debtorCode} (Đã khóa)` : "Chưa ký hợp đồng chính thức";
  document.getElementById("profile-username").textContent = `@${profile.username}`;
  authOut?.classList.add("hidden");
  authIn?.classList.remove("hidden");

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

document.getElementById("btn-save-avatar-url")?.addEventListener("click", async () => {
  if (!state.username) return;
  await saveDebtorState(state.username, { avatarUrl: document.getElementById("avatar-url-input").value.trim() });
  applyProfileUI(await fetchDebtorByUsername(state.username));
  document.getElementById("auth-sync-msg").textContent = "Đã lưu Avatar lên Firebase.";
});
document.getElementById("avatar-file-input")?.addEventListener("change", async (e) => {
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
document.getElementById("btn-logout")?.addEventListener("click", () => { logoutSimpleAccount(); applyProfileUI(null); });

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