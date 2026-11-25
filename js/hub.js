// js/hub.js — Full Hub (Động vật 3D Thật GLB + Chỉ điểm 4 vùng Động vật + Kính mờ nhị phân + Đầy đủ 6 NPC)

import { initBioHologram } from "./bio-holo.js";
import { initInvertedPyramid3D } from "./pyramid-3d.js";
import { initNpcMorph3D } from "./npc-morph-3d.js";
import { initSystemMascot3D } from "./sys-mascot-3d.js";
import { SITE_CONFIG, ANIMAL_PRESETS } from "./config.js";
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
  vaultHintStep: 0,
  cart: [],
  inventory: []
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
  "tab-vault": "KHO HỒ SƠ MẬT & LINH THÚ 3D"
};

const CONTRACT_PACKAGES = [
  { id: "ta-vo-cuu", title: "⚖️ GÓI BÁO ỨNG PHÁP ĐÌNH (Tạ Vô Cữu)", desc: "100% dùng chứng cứ pháp lý & kiểm toán công khai. Giảm phí Hệ thống 80% → 65%; phạm pháp bị phạt gấp đôi." },
  { id: "ngu-hong-diep", title: "🩸 GÓI HỎA TÁNG TRÀNG (Ngu Hồng Diệp)", desc: "Ép Kẻ Cướp Phước phản bội lẫn nhau và tự thú 100%. Thưởng nóng +1,000 PB; thời hạn nhiệm vụ rút ngắn 20%." },
  { id: "sd-double", title: "🎲 GÓI CƯỢC MẠNG NHÂN ĐÔI (Quỹ Sd.)", desc: "Nhân đôi tần suất Debuff Cạn Phước suốt nhiệm vụ. Thu hồi PB x2.0; thua thuộc sở hữu trực tiếp của Chủ nợ tối cao Sd." }
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
  pos: { label: "POS ĐEN HIỆN ĐẠI", desc: "【HÌNH THÁI VẬT LÝ — KHỐI HIỆN ĐẠI】: Một chiếc máy quẹt thẻ POS vỏ đen bóng lạnh toát tự xuất hiện trên mặt bàn gần nhất. Người ngoài nhìn vào chỉ thấy cục nhựa vô tri; riêng bạn nghe rõ tiếng mô-tơ “rẹt… rẹt…” nhả cuộn hóa đơn nhiệt in mực đỏ máu từng khoản phí nhỏ nhặt (-1.00 PB phí hao mòn phần cứng)." },
  abacus: { label: "BÀN TÍNH & QUẠ ĐEN", desc: "【HÌNH THÁI VẬT LÝ — KHỐI CỔ ĐẠI / TU TIÊN】: Bàn tính gỗ mun mất một hạt hoặc con quạ đen đeo thẻ đồng ở chân sà xuống mổ “cộc, cộc” lên trán Ký chủ mỗi khi trừ điểm, rồi nhả ra cuộn khế ước giấy dó đóng triện đỏ." },
  radio: { label: "RADIO QUÂN ĐỘI RỈ SÉT", desc: "【HÌNH THÁI VẬT LÝ — MẠT THẾ / VÔ GIAN】: Chiếc radio sắt quân đội rỉ sét rè rè tần số nhiễu 50Hz giữa đống đổ nát, đọc vang biên lai trừ nợ không sót một số lẻ nào bằng giọng tổng đài viên vô cảm." }
};

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
    emblem: "🦢",
    name: "HỆ THỐNG 00",
    role: "Kế Toán Viên Kiểm Toán — Máy Chủ Trực Tiếp",
    artifact: "Bàn Tính Gãy & Cuộn Hóa Đơn Nhiệt Dài Vô Tận",
    scent: "Giấy in nhiệt nóng rực, ozone máy chủ & đồng xu kim loại",
    bio: "Chương trình kiểm toán nhân quả tự động mang tư duy Tư Bản Bóc Lột Tuyệt Đối. Giọng tổng đài ngân hàng đều đặn vang trực tiếp trong não Ký chủ; quy đổi mọi bi kịch thành hóa đơn thu phí và báo giá nẹp xương trả góp 18%/tuần.",
    quote: "“【Thông báo: Nhịp tim vượt 140 BPM. Đã tự bơm 0.5ml hormone làm dịu thần kinh. Chi phí: -15 PB. Khuyến nghị giữ bình tĩnh để tiết kiệm tiền y tế.】”",
    zones: {
      head: { title: "MỎ NHỌN & MẮT QUANG HỌC (HẮC HẠC)", text: "Chiếc mỏ dài sắc như ngòi bút kiểm toán chuyên mổ thẳng vào trán Con nợ mỗi khi trừ điểm; đồng tử quét mọi chấn thương để lập hóa đơn." },
      chest: { title: "LỒNG NGỰC & BỘ ĐẾM LÃI SUẤT", text: "Khoang ngực rỗng chứa cuộn hóa đơn nhiệt dài vô tận; nhịp tim 00 BPM lạnh lẽo quy đổi mọi cảm xúc bi thương thành phần trăm nợ." },
      limb: { title: "SẢI CÁNH DỮ LIỆU (215 CM)", text: "Đôi cánh Hạc đen sải rộng bao phủ 10 Khu Vực, thu hồi tự động 80% phí dịch vụ ngay giây phút Ký chủ vả mặt xong." },
      tail: { title: "ĐUÔI & CHÂN THẺ ĐỒNG", text: "Đôi chân dài gắn thẻ đồng mã số 00; giẫm tắt mọi hy vọng được an ủi miễn phí trong Sảnh Chờ Con Nợ." }
    }
  },
  {
    id: "tavocuu",
    code: "ID // 01",
    clearance: "LEVEL 3",
    emblem: "🐎",
    name: "TẠ VÔ CỮU",
    role: "Tổng Kiểm Toán Trưởng 10 Khu Vực",
    artifact: "Đồng hồ quả quýt bạc vỡ mặt kính chạy ngược & bút máy thép đen",
    scent: "Tuyết lạnh đầu mùa, mực hồ sơ lưu trữ lâu năm & bạc hà khô khốc",
    bio: "Cao 1m88, thường giáng lâm dưới vỏ bọc Thẩm phán Tòa án Tối cao hoặc Pháp y độc lập. Lạnh lùng, kiệm lời, nhìn đám trà xanh khóc lóc như xem lũ hề diễn xiếc. Bí mật: từng vượt Điện Thứ 10 hàng trăm năm trước, đang ngầm điều tra đường dây buôn lậu Hào quang mang chữ ký 'Sd.'.",
    quote: "“Tôi đến đây để công chứng bản án phá sản của kẻ thù giúp cô, hoặc ký giấy chứng tử cho cô — tùy thuộc vào thứ cô đặt lên bàn bằng chứng.”",
    zones: {
      head: { title: "SỌ CHIẾN MÃ & MẮT ĐEN KHÔNG ĐÁY", text: "Ánh mắt sâu thẳm quầng thâm nhạt của kẻ đã đọc hàng triệu hồ sơ tội ác; đôi tai vểnh nghe thấu từng lời khai gian trước tòa." },
      chest: { title: "NGỰC DÀY & GIÁP VEST ĐEN", text: "Bờ ngực rộng phẳng phiu cài kín đến yết hầu, nhịp tim 52 BPM chậm rãi bình thản giữa chốn công đường sặc mùi máu." },
      limb: { title: "TỨ CHI & MÓNG SẮT PHÁN QUYẾT", text: "Tứ chi Chiến Mã lao vun vút giữa hiện trường; vó sắt kẹp chặt cây bút máy thép đen sẵn sàng ký lệnh Thanh Lý Linh Hồn." },
      tail: { title: "BỜM & ĐUÔI TUYẾT LẠNH", text: "Cuốn phăng mùi tuyết lạnh đầu mùa và bạc hà khô; biểu tượng cho Ký chủ duy nhất từ chối xóa ký ức sau Điện 10." }
    }
  },
  {
    id: "lucnha",
    code: "ID // 02",
    clearance: "LEVEL 3",
    emblem: "🦊",
    name: "LỤC NHA",
    role: "Trùm Chợ Đen Xuyên Không",
    artifact: "Dây đỏ quấn cổ tay treo đồng xu cổ dính máu & sẹo tia sét",
    scent: "Rượu trắng nặng độ, thuốc súng trộn trầm hương rẻ tiền & đồng thau cũ",
    bio: "Ký chủ đào tẩu ẩn nấp trong các điểm mù tín hiệu của 10 Khu Vực, mở tiệm cầm đồ hẻm tối và bar ngầm. Khinh bỉ kiểu thu phí 80% của Hệ Thống 00; bán máy nghe lén, bộ mở khóa cơ, thuốc giảm đau bằng tiền mặt hoặc ân huệ cá nhân.",
    quote: "“Mua thuốc trong cửa hàng con Hệ thống hút máu kia làm gì? Đưa năm trăm tệ đây, hoặc tối nay ở lại lau súng giúp anh.”",
    zones: {
      head: { title: "MÕM NHỌN & MẮT MỘT MÍ RANH MÃNH", text: "Đôi mắt cáo sắc lẹm luôn nheo lại đầy bất cần, đánh hơi cực nhạy mọi lỗ hổng tín hiệu và những kẻ đang cần hàng lách luật." },
      chest: { title: "VÙNG CỔ & VẾT SẸO TIA SÉT", text: "Chạy dọc từ mang tai xuống xương quai xanh là vết sẹo bỏng hình tia sét — dấu tích bị Hệ thống giật điện trừng phạt vì buôn lậu." },
      limb: { title: "VUỐT TRƯỚC & DÂY ĐỎ ĐỒNG XU", text: "Cẳng tay gân guốc đầy sẹo dao chém, quấn sợi dây đỏ treo đồng xu đồng dính máu; nhanh tay tuồn máy nghe lén vào chợ đen." },
      tail: { title: "ĐUÔI XÙ XÓA DẤU VẾT", text: "Chiếc đuôi Hồ Ly luồn lách xóa sạch dấu chân trong hẻm tối; cực kỳ sòng phẳng, không bao giờ làm ăn lỗ vốn." }
    }
  },
  {
    id: "nguhongdiep",
    code: "ID // 03",
    clearance: "LEVEL 3",
    emblem: "🦩",
    name: "NGU HỒNG DIỆP",
    role: "Giám Ngục Điện Vọng Ngữ (1) & Ái Dục (3)",
    artifact: "Tẩu thuốc bạc chạm hoa bỉ ngạn 20cm & quạt xếp gọng ngà",
    scent: "Nước hoa gỗ hồng mộc nồng nàn, rượu vang lâu năm & khói thuốc anh đào",
    bio: "Quản lý cấp cao chuyên ngồi hàng ghế đầu thưởng thức cảnh đàn ông bội bạc và trà xanh tự đào hố chôn mình, thường mang vỏ bọc Bà trùm truyền thông hoặc Luật sư ly hôn bất bại. Thưởng đậm điểm Bonus nếu Ký chủ vả mặt tàn nhẫn, trừng phạt ngay nếu mềm lòng.",
    quote: "“Đàn ông ngoại tình bảo bản năng, bị bắt quả tang bảo tai nạn. Cưng muốn nghe hắn khóc thêm năm phút hay tống vào tù luôn chiều nay?”",
    zones: {
      head: { title: "MỎ CONG KIÊU KỲ & SON RƯỢU CHÁT", text: "Ánh mắt sắc như dao cạo nhìn thấu mọi lời nói dối; chiếc mỏ nâng nhẹ cằm những kẻ phản bội đang quỳ rạp dưới đất." },
      chest: { title: "CỔ UỐN LƯỢN & HƯƠNG ANH ĐÀO", text: "Thân hình đồng hồ cát uyển chuyển tỏa hương gỗ hồng mộc và làn khói thuốc vị anh đào từ tẩu bạc hoa bỉ ngạn." },
      limb: { title: "SẢI CÁNH ĐỎ THẪM (165 CM)", text: "Đôi cánh xòe rộng như tà sườn xám xẻ cao; sẵn sàng tung tập hồ sơ trốn thuế tiễn tra nam vào tù trong một nốt nhạc." },
      tail: { title: "CHÂN DÀI ĐẾ ĐỎ ĐANH THÉP", text: "Giày cao gót đế đỏ gõ nhịp lạnh lùng trên sàn đá; tuyên án Hỏa táng tràng tuyệt đối không khoan nhượng." }
    }
  },
  {
    id: "tieuthat",
    code: "ID // 04",
    clearance: "LEVEL 1",
    emblem: "🦜",
    name: "TIỂU THẤT (#707)",
    role: "Thực Tập Sinh Hệ Thống (Lao Động Không Lương)",
    artifact: "Cuộn băng gạc y tế & máy tính Casio cũ liệt phím dấu cộng (+)",
    scent: "Băng gạc y tế, bụi đường & mùi khét chập điện máy chiếu",
    bio: "Ký chủ đời trước vì quá ngây thơ cứu người nên bị phản diện lừa sạch phước báu, phải ở lại Cục làm lao động công ích. Thường bị nhét vào xác trợ lý hậu đậu, tiểu đồng gầy trơ xương, mèo hoang trọc lông hoặc robot hút bụi chập mạch.",
    quote: "“Đ-đại ca! Em chỉ định bê chậu nước đi đổ thôi, ai ngờ trượt chân hất vào ổ máy chiếu... sao nó tự phát clip của thiên kim giả vậy?!”",
    zones: {
      head: { title: "MỎ VẸT LẮP BẮP & CUỘN BĂNG GẠC", text: "Cái đầu quấn băng y tế luôn ngơ ngác canh chừng Thanh Tra Tạ Vô Cữu; cái mỏ hay vô tình buột miệng bóc phốt bí mật." },
      chest: { title: "NGỰC ĐẬP LOẠN 126 BPM", text: "Lúc nào cũng hồi hộp sợ bị trừ lương; linh hồn thường bị Hệ Thống 00 nhét bừa vào những vật chủ trớ trêu nhất." },
      limb: { title: "ĐÔI CÁNH HẬU ĐẬU & CASIO LIỆT (+)", text: "Đập cánh cuống quýt là làm đổ xô nước rửa chân vào ổ điện hoặc đánh rơi máy Casio chỉ bấm được dấu trừ (-)." },
      tail: { title: "ĐUÔI SAO QUẢ TẠ CẠN PHƯỚC", text: "Mỗi lần vẫy đuôi chạy tới giúp đều vô tình kéo tụt tóc giả hoặc bật nhầm clip ngoại tình của kẻ thù lên màn hình lớn." }
    }
  },
  {
    id: "sd",
    code: "OMEGA // Sd.",
    clearance: "LEVEL 5 [NIÊM PHONG]",
    emblem: "🔒",
    name: "QUÝ CÔ 'Sd.'",
    role: "[DỮ LIỆU MẬT — KHÔNG CÓ QUYỀN TRUY CẬP]",
    isSd: true,
    artifact: "[BỊ KHÓA]",
    scent: "[BỊ KHÓA]",
    bio: "[ACCESS DENIED]",
    quote: "",
    zones: {}
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

// 1. TẠO TEXTURE ĐƯỜNG HẦM NHỊ PHÂN PHỦ LÊN MỌI BLOCK + THEME + BG
function updateMatrixBlockTexture() {
  const s = getComputedStyle(htmlEl);
  const p = s.getPropertyValue("--c-primary").trim() || "#00E5FF";
  const sec = s.getPropertyValue("--c-secondary").trim() || "#5EA8FF";
  const c = document.createElement("canvas");
  c.width = 480;
  c.height = 320;
  const ctx = c.getContext("2d");

  ctx.fillStyle = "#020612";
  ctx.fillRect(0, 0, 480, 320);

  const flare = ctx.createRadialGradient(240, 172, 4, 240, 172, 220);
  flare.addColorStop(0, "#ffffff");
  flare.addColorStop(0.14, p);
  flare.addColorStop(0.45, "rgba(0,110,255,0.18)");
  flare.addColorStop(1, "transparent");
  ctx.fillStyle = flare;
  ctx.fillRect(0, 0, 480, 320);

  ctx.strokeStyle = p;
  ctx.globalAlpha = 0.22;
  for (let i = -6; i <= 6; i++) {
    ctx.beginPath();
    ctx.moveTo(240 + i * 52, 320);
    ctx.lineTo(240, 172);
    ctx.stroke();
  }

  ctx.font = "bold 15px 'JetBrains Mono', monospace";
  ctx.textAlign = "center";
  for (let x = 22; x < 470; x += 34) {
    for (let y = 18; y < 310; y += 22) {
      if (Math.hypot(x - 240, y - 172) < 42) continue;
      ctx.fillStyle = (x + y) % 3 === 0 ? sec : p;
      ctx.globalAlpha = 0.16 + Math.random() * 0.34;
      ctx.fillText(Math.random() > 0.5 ? "1" : "0", x, y);
    }
  }
  htmlEl.style.setProperty("--matrix-panel-bg", `url("${c.toDataURL("image/png")}")`);
}

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
  requestAnimationFrame(updateMatrixBlockTexture);
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

let carouselPos = 0, carouselTarget = 0, isCarouselDragging = false;
let dragStartX = 0, dragLastX = 0, dragStartPos = 0, dragVelocity = 0, dragMoved = 0;

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
  if (snapCarousel && idx >= 0) carouselTarget += getWrappedDelta(idx, carouselTarget);

  tabCards.forEach((c) => c.classList.toggle("is-active", c.dataset.tab === tabId));
  document.querySelectorAll(".hub-panel").forEach((p) => p.classList.toggle("hidden", p.id !== tabId));
  const titleEl = document.getElementById("quest-window-title");
  if (titleEl) titleEl.textContent = TAB_TITLES[tabId] || "SYSTEM INFO";

  if (tabId === "tab-ranking") loadAndRenderLeaderboard();
  if (tabId === "tab-forum") loadAndRenderForum();
  if (tabId === "tab-pyramid") {
    requestAnimationFrame(() => { pyramid3D.resize(); updateLaserPointerFrom3D(); });
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
    dragStartX = dragLastX = e.clientX;
    dragStartPos = carouselPos;
    dragVelocity = 0; dragMoved = 0;
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
      switchTab(tabCards[modIndex(carouselTarget)].dataset.tab, false);
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
    pyramid3D.resize(); updateLaserPointerFrom3D();
  }
});

// 5. THÁP TAM GIÁC NGƯỢC 3D
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
    if (!document.getElementById("tab-pyramid")?.classList.contains("hidden")) updateLaserPointerFrom3D();
  }
});

function selectPyramidTier(tierId, playEffect = false) {
  if (playEffect && state.sfx) radio.playClickChime();
  state.selectedPyramidTier = tierId;
  pyramid3D.setSelectedTier(tierId);
  const sec = SECTORS.find((s) => s.id === tierId) || SECTORS[0];
  const flipInner = document.getElementById("tier-flip-inner");
  if (playEffect && flipInner) { flipInner.classList.remove("is-flipping"); void flipInner.offsetWidth; flipInner.classList.add("is-flipping"); }
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
  pushReceipt(`> Khóa tầng ${sec.id}/10 từ Mô hình 3D: [${sec.name}].`); triggerMissionSimulation(sec.name);
});
selectPyramidTier(1, false);

// 6. RECEIPT & STATS
function pushReceipt(text) {
  if (receiptFeed) { const p = document.createElement("p"); p.textContent = text; receiptFeed.prepend(p); }
  if (thermalPaper) {
    const tp = document.createElement("p"); tp.textContent = text; thermalPaper.prepend(tp);
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
const mktAvail = document.getElementById("market-pb-avail");
  if (mktAvail) {
    if (state.contractLocked && typeof state.pb === "number") {
      const avail = Math.max(0, state.pb - (-6000));
      mktAvail.textContent = `${avail.toFixed(2)} PB (Số dư: ${state.pb.toFixed(2)} PB)`;
    } else {
      mktAvail.textContent = "CHƯA KÝ HỢP ĐỒNG";
    }
  }
}

// 7. HỢP ĐỒNG + LIVE PREVIEW
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
    arch, archLabel, sectorChoice: sectorVal,
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
  const pickedSector = p.sectorChoice === "Random Độc Bản" ? SECTORS[Math.floor(Math.random() * SECTORS.length)].name : p.sectorChoice;
  const code = `#${Math.floor(100 + Math.random() * 899)}`;
  return {
    code, finalPB, pickedSector,
    profileData: {
      name: p.name || "Ký chủ vô danh", codename: p.codename || `Con nợ ${code}`, age: p.age || 24,
      gender: p.gender || "Tự do", orient: p.orient, arch: p.arch, archLabel: p.archLabel, sector: pickedSector,
      appearance: p.appearance || "Ánh mắt sắc lạnh", scent: p.scent || "Cà phê cháy & thuốc sát trùng",
      personality: p.personality || "Tỉnh bơ châm biếm", skill: p.skill || "Kiểm toán & ứng biến sinh tồn",
      sin: p.sin || "Thức khuya & khẩu nghiệp", relations: p.relations || "Sòng phẳng với Lục Nha, cảnh giác Quý Cô Sd.",
      worldReq: p.worldReq || "Random Độc Bản", quote: p.quote || "Nợ có thể trả chậm, nhưng cái tát này thì trả đứt."
    },
    fees: { fee1, fee2, fee3 }
  };
}

function renderAuditReceipt(bundle, isOfficial) {
  const p = bundle.profileData;
  const receiptHeader = isOfficial ? `⚖️ 【HỢP ĐỒNG CHÍNH THỨC ĐÃ NIÊM PHONG — ${bundle.code}】` : `📝 【BẢN NHÁP KÝ THỬ (ĐÃ GẮN VÀO BẢNG MẪU LIVE BÊN DƯỚI)】`;
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
    const updated = await signOfficialContract(state.username, { debtorCode: bundle.code, meritBalance: bundle.finalPB, lastProfile: bundle.profileData });
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
document.getElementById("btn-refresh-rank")?.addEventListener("click", () => { if (state.sfx) radio.playClickChime(); loadAndRenderLeaderboard(); });

// 9. KHO ÁN & !NHIEMVU
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
  pushReceipt(`> Đã khóa mục tiêu: [${state.selectedSector}].`); triggerMissionSimulation(state.selectedSector);
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
    div.innerHTML = `<strong>▸ HỒ SƠ ĐỘC BẢN #${idx + 1} [${c.sector}] — Hạng ${c.rank} | Thưởng: ${c.reward}</strong><p><b>${c.title}:</b> ${c.body}</p>`;
    uniqueCasesList.appendChild(div);
  });
}
generateUniqueCases();
document.getElementById("btn-gen-contracts")?.addEventListener("click", () => {
  if (state.sfx) radio.playClickChime();
  generateUniqueCases();
  pushReceipt("【!NHIEMVU】: Đã khởi tạo 3 Hồ sơ Trọng án Độc bản mới.");
});

// 10. CHỢ ĐEN RESET 3 TIẾNG + TỰ CHẾ ITEM THEO PLOT + GIỎ HÀNG + TRỪ PB + TÚI ĐỒ
const DEBT_CEILING = -6000;
const MARKET_SLOT_MS = 3 * 3600 * 1000;

const manifestPreview = document.getElementById("manifest-preview-box");
function setManifestForm(key) {
  state.manifestForm = MANIFEST_FORMS[key] ? key : "pos";
  if (manifestPreview) manifestPreview.textContent = MANIFEST_FORMS[state.manifestForm].desc;
  document.querySelectorAll(".manifest-btn").forEach((b) => b.classList.toggle("is-active", b.dataset.manifest === state.manifestForm));
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

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function getMarketSlotInfo() {
  const gmt7Ms = Date.now() + 7 * 3600 * 1000;
  const slotId = Math.floor(gmt7Ms / MARKET_SLOT_MS);
  const nextResetMs = (slotId + 1) * MARKET_SLOT_MS;
  const diffSec = Math.max(0, Math.floor((nextResetMs - gmt7Ms) / 1000));
  const hh = String(Math.floor(diffSec / 3600)).padStart(2, "0");
  const mm = String(Math.floor((diffSec % 3600) / 60)).padStart(2, "0");
  const ss = String(diffSec % 60).padStart(2, "0");
  const startHour = String((slotId * 3) % 24).padStart(2, "0");
  const endHour = String(((slotId * 3) + 3) % 24).padStart(2, "0");
  return { slotId, countdown: `${hh}:${mm}:${ss}`, label: `${startHour}:00 - ${endHour}:00 GMT+7` };
}

// BỘ TỰ CHẾ ITEM LIÊN QUAN PLOT (KHÔNG LƯU ITEM TĨNH SẴN TRONG CODE)
const PLOT_SYNTH_GRAMMAR = [
  {
    tag: "NGHIỆP VỤ VI BẰNG",
    adjs: ["Siêu Nhỏ", "Ngụy Trang", "Kháng Nhiễu", "Phản Quang", "Bỏ Túi"],
    cores: ["Cúc Áo Ghi Âm", "Thẻ Từ Sao Chép Khóa", "Mắt Kính Soi Mực Chìm", "Đầu Đọc USB Mật", "Micro Giấu Trong Bút Bi"],
    plots: [
      "lén thu âm lời thú tội của Thiên kim giả tại sảnh tiệc Điện 2",
      "chụp vi bằng sổ sách kép trong phòng Tổng tài Điện 3",
      "kiểm tra vết mực hoa bốn cánh trên hợp đồng nợ của Sd.",
      "lưu lại bản thu thô chưa chỉnh sửa tại hậu trường Điện 1"
    ],
    caveats: ["Pin chỉ chạy tối đa 3 giờ; tự tay gài lén trong điểm mù.", "Cấm khoe bản gốc khi ở một mình trong phòng kín."],
    priceRange: [35, 160]
  },
  {
    tag: "Y TẾ CẦM CỰ",
    adjs: ["Đậm Đặc", "Tác Dụng Nhanh", "Lách Luật", "Cấp Tốc", "Không Lãi Suất"],
    cores: ["Ống Tiêm Adrenaline", "Viên Nén Chống Run Tay", "Miếng Dán Tê Xương Khớp", "Bột Hạ Sốt Dạ Dày", "Thuốc Nhỏ Mắt Chống Ngất"],
    plots: [
      "kìm phản xạ sang chấn run tay khi đối mặt gã Tra nam Điện 3",
      "giữ đầu óc tỉnh táo 6 giờ giữa cơn sốt 39 độ tại tầng hầm bệnh viện",
      "cầm máu vết thương rách chỉ để bước ra ánh đèn sân khấu Điện 1",
      "chống tụt huyết áp giữa đáy Hàn Băng Ngục Điện 5"
    ],
    caveats: ["Không chữa lành vết thương vật lý; hết thuốc sẽ đau bù gấp rưỡi.", "Chỉ bán bằng điểm PB hoặc giao dịch với Lục Nha."],
    priceRange: [45, 220]
  },
  {
    tag: "GÀI BẪY LIÊN HOÀN",
    adjs: ["Không Màu", "Kích Nhiệt", "Đảo Ngược", "Chập Mạch", "Tức Thì"],
    cores: ["Bột Trơn Sàn Sân Khấu", "Chip Nhiễu Sóng Loa Playback", "Dung Dịch Đổi Màu Nước Trà", "Mảnh Sáp Phá Đạo Cụ", "Đèn Chiếu Tia Cực Tím"],
    plots: [
      "cắt ngang màn hát nhép của Đỉnh lưu đạo nhái ngay sóng trực tiếp Điện 1",
      "làm lộ lớp phấn che sẹo giả vờ yếu đuối của Bạch Liên Hoa",
      "khiến Kẻ Cướp Phước tự vấp ngã kéo tụt bộ tóc giả trước 10 vạn khán giả",
      "đổi màu bát thuốc bắc chứa xạ hương ở Lãnh cung Điện 4"
    ],
    caveats: ["Rủi ro tự văng mảnh trúng mình nếu Debuff Cạn Phước đang bật.", "Phải canh đúng thời điểm trước khi thủy quân vào dọn hiện trường."],
    priceRange: [28, 130]
  },
  {
    tag: "PHÁP LÝ & NHÂN QUẢ",
    adjs: ["Công Chứng", "Khẩn Cấp", "Chợ Đen", "Niêm Phong", "Tối Mật"],
    cores: ["Trát Triệu Tập Kiểm Toán", "Khế Ước Phong Tỏa Cổ Phần", "Phiếu Chặn Thủy Quân Bôi Nhọ", "Thẻ Gọi Thanh Tra Độc Lập", "Kính Giải Mã Hào Quang Lậu"],
    plots: [
      "mở đường dây nóng kết nối Phán Quan Tạ Vô Cữu tới hiện trường Điện 2",
      "khóa đường tẩu tán tài sản sang công ty ma trước giờ công chứng",
      "dán ấn phong tỏa mảnh Hào quang đánh cắp mang mã nguồn Sd.",
      "ép trợ lý bị bỏ rơi phản bội lại chủ cũ trong Liên hoàn kế"
    ],
    caveats: ["Vô hiệu nếu chưa nắm đủ 2 tầng chứng cứ vật lý.", "Dùng sai quy trình sẽ bị Ngu Hồng Diệp phạt KPI."],
    priceRange: [180, 1450]
  }
];

const SUPPLIERS = ["Lục Nha (Hẻm Tối)", "Kho Dược Tầng Dưới", "Tiểu Thất Tuồn Lén", "Mối Ngầm Kiểm Toán", "Điểm Mù Tín Hiệu"];

let lastMarketSlot = getMarketSlotInfo().slotId;
let currentMarketCatalog = [];

function generateBlackMarketItems(slotId) {
  const rand = mulberry32(hashSeed(`market_3h_slot:${slotId}`));
  const pick = (arr) => arr[Math.floor(rand() * arr.length)];
  const items = [];

  for (let i = 0; i < 5; i++) {
    const g = PLOT_SYNTH_GRAMMAR[i % PLOT_SYNTH_GRAMMAR.length];
    const isRareSlot = i === 4;
    const adj = pick(g.adjs);
    const core = pick(g.cores);
    const plot = pick(g.plots);
    const caveat = pick(g.caveats);
    const supplier = pick(SUPPLIERS);

    const [minP, maxP] = isRareSlot ? [650, 1950] : g.priceRange;
    const cost = Number((minP + rand() * (maxP - minP)).toFixed(2));
    const serial = `BM-${Math.floor(1000 + rand() * 8999).toString(16).toUpperCase()}`;

    items.push({
      id: `${slotId}_${i}_${serial}`,
      serial,
      tag: g.tag,
      rare: isRareSlot || cost > 300,
      supplier,
      name: `${core} ${adj}`,
      desc: `Công dụng: Dùng để ${plot}. (${caveat})`,
      cost
    });
  }
  return items;
}

function showMarketFeedback(msg, type = "error") {
  const box = document.getElementById("market-feedback-msg");
  if (!box) return;
  box.textContent = msg;
  box.className = `market-feedback ${type === "error" ? "is-error" : "is-success"}`;
  if (type === "error") {
    box.style.animation = "none";
    void box.offsetWidth;
    box.style.animation = "";
  }
}

function getLocalBagKey() {
  return `bao_ung_bag_${state.username || "guest"}`;
}
function saveInventoryState() {
  localStorage.setItem(getLocalBagKey(), JSON.stringify(state.inventory));
  if (state.username) {
    saveDebtorState(state.username, { meritBalance: state.pb, inventory: state.inventory }).catch(() => {});
  }
}
function loadLocalInventory() {
  try {
    const raw = JSON.parse(localStorage.getItem(getLocalBagKey()) || "[]");
    return Array.isArray(raw) ? raw : [];
  } catch { return []; }
}

function renderMarketCatalog() {
  const listEl = document.getElementById("market-list");
  const slotInfo = getMarketSlotInfo();
  lastMarketSlot = slotInfo.slotId;
  currentMarketCatalog = generateBlackMarketItems(slotInfo.slotId);

  const slotTag = document.getElementById("market-slot-tag");
  if (slotTag) slotTag.textContent = slotInfo.label;

  if (!listEl) return;
  listEl.innerHTML = "";

  currentMarketCatalog.forEach((item) => {
    const row = document.createElement("div");
    row.className = "market-item";
    row.innerHTML = `
      <div>
        <div class="market-item-meta">
          <span class="mkt-badge">${item.serial}</span>
          <span class="mkt-badge ${item.rare ? "rare" : ""}">${item.tag}${item.rare ? " ★ HIẾM" : ""}</span>
          <span class="mkt-badge">Nguồn: ${item.supplier}</span>
        </div>
        <h4></h4>
        <p></p>
      </div>
      <div class="market-card-actions">
        <div class="market-price-tag">-${item.cost.toFixed(2)} PB</div>
        <button type="button" class="btn-secondary holo-tactile mini-btn btn-add-cart">🛒 + GIỎ HÀNG</button>
        <button type="button" class="btn-primary holo-tactile mini-btn btn-buy-now">⚡ MUA NGAY</button>
      </div>
    `;
    row.querySelector("h4").textContent = item.name;
    row.querySelector("p").textContent = item.desc;
    row.querySelector(".btn-add-cart").addEventListener("click", () => addToCart(item));
    row.querySelector(".btn-buy-now").addEventListener("click", () => purchaseItems([{ item, qty: 1 }], false));
    listEl.appendChild(row);
  });
}

function addToCart(item) {
  if (state.sfx) radio.playClickChime();
  const existing = state.cart.find((c) => c.item.id === item.id);
  if (existing) existing.qty += 1;
  else state.cart.push({ item, qty: 1 });
  renderCart();
  showMarketFeedback(`🛒 Đã thêm [${item.name}] vào giỏ hàng tạm.`, "success");
}

function renderCart() {
  const listEl = document.getElementById("cart-list");
  const countEl = document.getElementById("cart-count");
  const totalEl = document.getElementById("cart-total");
  const totalCount = state.cart.reduce((sum, c) => sum + c.qty, 0);
  const totalCost = state.cart.reduce((sum, c) => sum + c.item.cost * c.qty, 0);

  if (countEl) countEl.textContent = String(totalCount);
  if (totalEl) totalEl.textContent = `-${totalCost.toFixed(2)} PB`;
  if (!listEl) return;

  if (!state.cart.length) {
    listEl.innerHTML = `<p class="muted">Giỏ hàng đang trống. Bấm “+ Giỏ hàng” ở vật phẩm phía trên.</p>`;
    return;
  }

  listEl.innerHTML = "";
  state.cart.forEach((entry, idx) => {
    const row = document.createElement("div");
    row.className = "cart-row";
    row.innerHTML = `
      <div class="cart-row-info"><strong></strong><small>-${(entry.item.cost * entry.qty).toFixed(2)} PB (${entry.item.cost.toFixed(2)} × ${entry.qty})</small></div>
      <div class="cart-row-ctrl">
        <button type="button" class="qty-btn btn-dec">-</button>
        <span style="font-size:0.72rem;min-width:20px;text-align:center;">${entry.qty}</span>
        <button type="button" class="qty-btn btn-inc">+</button>
        <button type="button" class="qty-btn btn-rem" style="color:#ff5c77;">✕</button>
      </div>
    `;
    row.querySelector(".cart-row-info strong").textContent = entry.item.name;
    row.querySelector(".btn-dec").addEventListener("click", () => {
      entry.qty -= 1;
      if (entry.qty <= 0) state.cart.splice(idx, 1);
      renderCart();
    });
    row.querySelector(".btn-inc").addEventListener("click", () => { entry.qty += 1; renderCart(); });
    row.querySelector(".btn-rem").addEventListener("click", () => { state.cart.splice(idx, 1); renderCart(); });
    listEl.appendChild(row);
  });
}

function purchaseItems(entries, clearCartAfter = false) {
  if (!entries.length) {
    if (state.sfx) radio.playFlipChime();
    showMarketFeedback("❌ ERROR: Giỏ hàng đang trống, không có gì để thanh toán!", "error");
    return;
  }
  if (!state.contractLocked || typeof state.pb !== "number") {
    if (state.sfx) radio.playFlipChime();
    showMarketFeedback("❌ ERROR: Bạn chưa ký Hợp đồng chính thức (Tab 01) nên chưa có số dư Phước Báu để mua đồ!", "error");
    pushReceipt("【ERROR CHỢ ĐEN】: Giao dịch bị từ chối — chưa ký Hợp đồng chính thức.");
    return;
  }

  const totalCost = Number(entries.reduce((sum, e) => sum + e.item.cost * e.qty, 0).toFixed(2));
  const available = Number(Math.max(0, state.pb - DEBT_CEILING).toFixed(2));

  if (state.pb - totalCost < DEBT_CEILING) {
    if (state.sfx) radio.playFlipChime();
    const shortBy = (totalCost - available).toFixed(2);
    const errTxt = `❌ ERROR: KHÔNG ĐỦ PHƯỚC BÁU! Cần ${totalCost.toFixed(2)} PB nhưng hạn mức khả dụng trước trần nợ (${DEBT_CEILING} PB) chỉ còn ${available.toFixed(2)} PB (Thiếu ${shortBy} PB).`;
    showMarketFeedback(errTxt, "error");
    pushReceipt(`【ERROR CHỢ ĐEN】: Không đủ PB (Thiếu ${shortBy} PB — vượt trần nợ ${DEBT_CEILING} PB).`);
    return;
  }

  if (state.sfx) radio.playClickChime();
  state.pb = Number((state.pb - totalCost).toFixed(2));

  entries.forEach(({ item, qty }) => {
    const found = state.inventory.find((b) => b.name === item.name);
    if (found) {
      found.qty += qty;
    } else {
      state.inventory.unshift({
        id: item.id,
        serial: item.serial,
        name: item.name,
        tag: item.tag,
        desc: item.desc,
        qty
      });
    }
  });

  if (clearCartAfter) {
    state.cart = [];
    renderCart();
  }
  saveInventoryState();
  updateStatsUI();
  renderBag();

  const names = entries.map((e) => `${e.item.name} (×${e.qty})`).join(", ");
  showMarketFeedback(`✅ MUA THÀNH CÔNG (-${totalCost.toFixed(2)} PB): [${names}] đã được chuyển vào Túi Đồ!`, "success");
  pushReceipt(`【CHỢ ĐEN -${totalCost.toFixed(2)} PB】: Đã cất vào Túi: ${names}.`);
}

function renderBag() {
  const listEl = document.getElementById("bag-list");
  const countEl = document.getElementById("bag-count");
  const totalQty = state.inventory.reduce((sum, b) => sum + (b.qty || 1), 0);
  if (countEl) countEl.textContent = String(totalQty);
  if (!listEl) return;

  if (!state.inventory.length) {
    listEl.innerHTML = `<p class="muted">Túi đồ trống. Vật phẩm sau khi mua sẽ tự động chuyển vào đây.</p>`;
    return;
  }

  listEl.innerHTML = "";
  state.inventory.forEach((b, idx) => {
    const row = document.createElement("div");
    row.className = "bag-item";
    row.innerHTML = `
      <div class="bag-item-info">
        <strong></strong>
        <p></p>
      </div>
      <button type="button" class="btn-secondary holo-tactile mini-btn btn-use-bag">🔧 DÙNG 1 CÁI</button>
    `;
    const strong = row.querySelector("strong");
    strong.textContent = `[${b.tag}] ${b.name}`;
    const pill = document.createElement("span");
    pill.className = "bag-qty-pill";
    pill.textContent = `×${b.qty}`;
    strong.appendChild(pill);

    row.querySelector("p").textContent = b.desc;
    row.querySelector(".btn-use-bag").addEventListener("click", () => {
      if (state.sfx) radio.playClickChime();
      b.qty -= 1;
      pushReceipt(`【DÙNG VẬT PHẨM】: Đã rút [${b.name}] từ Túi Đồ ra sử dụng tại [${state.selectedSector}].`);
      if (b.qty <= 0) state.inventory.splice(idx, 1);
      saveInventoryState();
      renderBag();
    });
    listEl.appendChild(row);
  });
}

document.getElementById("btn-checkout-cart")?.addEventListener("click", () => purchaseItems(state.cart, true));
document.getElementById("btn-clear-cart")?.addEventListener("click", () => {
  state.cart = [];
  renderCart();
  showMarketFeedback("🗑️ Đã dọn sạch giỏ hàng tạm.", "success");
});
document.getElementById("btn-copy-bag")?.addEventListener("click", (e) => {
  if (!state.inventory.length) { showMarketFeedback("❌ ERROR: Túi đồ đang trống!", "error"); return; }
  const txt = [
    `🎒 [TÚI ĐỒ CHỢ ĐEN CỦA CON NỢ ${state.debtorCode}]:`,
    ...state.inventory.map((b) => `- ${b.name} (×${b.qty}) [${b.tag}]: ${b.desc}`)
  ].join("\n");
  navigator.clipboard?.writeText(txt);
  if (state.sfx) radio.playClickChime();
  const btn = e.currentTarget;
  const prev = btn.textContent;
  btn.textContent = "✓ ĐÃ COPY TÚI ĐỒ!";
  setTimeout(() => { btn.textContent = prev; }, 1800);
  pushReceipt("> Đã copy danh sách Túi Đồ Chợ Đen để dán sang Google AI Studio.");
});

state.inventory = loadLocalInventory();
renderMarketCatalog();
renderCart();
renderBag();

// 11. DIỄN ĐÀN !DIENDAN
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
  return { authorLabel: `${name}${code}`, authorSub: `@${prof.username} • ${state.selectedSector}`, avatarUrl: prof.avatarUrl || DEFAULT_AVATAR };
}

function updateForumIdentityUI() {
  const accInfo = getAccountIdentityInfo();
  if (forumAccountPreview) forumAccountPreview.textContent = accInfo ? accInfo.authorLabel : "Đăng nhập để dùng tài khoản";
  btnModeAccount?.classList.toggle("is-active", state.forumPostMode === "account");
  btnModeAnon?.classList.toggle("is-active", state.forumPostMode === "anon");
  if (forumPostHint) {
    if (state.forumPostMode === "anon") forumPostHint.textContent = "Chế độ: 🎭 Đang ẩn danh (@Con_Nợ_Ẩn_Danh)";
    else if (accInfo) forumPostHint.textContent = `Chế độ mặc định: 👤 Đăng bằng tài khoản [${accInfo.authorLabel}]`;
    else forumPostHint.textContent = "Chưa đăng nhập — chọn 'Đăng Ẩn Danh' hoặc đăng nhập";
  }
}

btnModeAccount?.addEventListener("click", () => {
  if (state.sfx) radio.playClickChime();
  if (!state.username) { openModal("modal-auth"); return; }
  state.forumPostMode = "account"; updateForumIdentityUI();
});
btnModeAnon?.addEventListener("click", () => {
  if (state.sfx) radio.playClickChime();
  state.forumPostMode = "anon"; updateForumIdentityUI();
});
forumCommentInput?.addEventListener("input", () => { if (forumCharCount) forumCharCount.textContent = `${forumCommentInput.value.length}/500`; });

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
  try { userPosts = await fetchForumComments(40); } catch (_) { userPosts = []; }
  const allPosts = [...state.extraForumSysPosts, ...userPosts, ...FORUM_POSTS_BASE];
  forumFeed.innerHTML = "";
  allPosts.forEach((p) => forumFeed.appendChild(createForumPostElement(p)));
}

document.getElementById("forum-composer")?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const bodyText = forumCommentInput?.value.trim();
  if (!bodyText) return;
  if (state.forumPostMode === "account" && !state.username) { openModal("modal-auth"); return; }
  const submitBtn = document.getElementById("btn-post-forum");
  if (submitBtn) submitBtn.disabled = true;
  try {
    const isAnon = state.forumPostMode === "anon";
    const acc = getAccountIdentityInfo();
    const anonCode = `#${Math.floor(100 + Math.random() * 899)}`;
    const payload = isAnon
      ? { authorLabel: `@Con_Nợ_Ẩn_Danh ${anonCode}`, authorSub: `Ẩn danh • ${state.selectedSector}`, avatarUrl: ANON_AVATAR, isAnonymous: true, sector: state.selectedSector, body: bodyText }
      : { authorLabel: acc.authorLabel, authorSub: acc.authorSub, avatarUrl: acc.avatarUrl, isAnonymous: false, sector: state.selectedSector, body: bodyText };
    const saved = await postForumComment(payload);
    if (state.sfx) radio.playClickChime();
    forumCommentInput.value = "";
    if (forumCharCount) forumCharCount.textContent = "0/500";
    await loadAndRenderForum();
    pushReceipt(saved.localOnly ? `【BÁO ỨNG NET (TẠM TRÊN MÁY)】: Firebase đang khóa quyền ghi.` : `【BÁO ỨNG NET】: Đã đăng bình luận [${payload.authorLabel}].`);
  } catch (err) { pushReceipt(`【LỖI BÁO ỨNG NET】: ${err.message}`); }
  finally { if (submitBtn) submitBtn.disabled = false; }
});

document.getElementById("btn-refresh-forum")?.addEventListener("click", async () => {
  if (state.sfx) radio.playClickChime();
  const extra = FORUM_EXTRA_POOL[Math.floor(Math.random() * FORUM_EXTRA_POOL.length)];
  const livePost = {
    authorLabel: `@Tình_Báo_${state.selectedSector.slice(0, 6).replace(/\s+/g, "_")}`,
    authorSub: "Tin quét trực tiếp", avatarUrl: DEFAULT_AVATAR,
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
document.getElementById("btn-goto-vault")?.addEventListener("click", () => { if (state.sfx) radio.playClickChime(); switchTab("tab-vault", true); });

// 12. TAB 07: KHO HỒ SƠ MẬT (5 BỘ ĐỀ 24H + TIỂU THẤT TỰ HỦY 5s + ĐỘNG VẬT 3D THẬT + BÁO ĐỘNG Sd.)
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
    clue12: "💡 <b>Tiểu Thất #707:</b> “Nếu cái hộp 10 tệ thì đồ cổ 110 tệ, cộng lại thành 120 mất rồi! Còn găng tay có phân biệt Trái/Phải đừng nhầm sang đôi tất nhé đại ca.”",
    clue34: "💡 <b>Tiểu Thất #707:</b> “Virus nhân đôi mỗi giây nghĩa là lùi 2 giây còn 25%! Còn bức ảnh thì đọc kỹ chữ ‘CHA CỦA’ đứng đằng trước ạ.”",
    clue5: "💡 <b>Tiểu Thất #707:</b> “Thử lần lượt A, B, C làm thủ phạm rồi đếm xem trường hợp nào có ĐÚNG 1 người nói thật.”",
    cheatMsg: "🆘 <b>Tiểu Thất #707:</b> “Á á thôi được rồi!! Đại ca lì quá đi mất... Suỵt!! Mật mã hôm nay là <b style='letter-spacing:0.18em; color:#fff;'>57223</b>!”"
  },
  {
    passcode: "49326",
    riddles: [
      "<strong>Chữ số 1:</strong> Đồng hồ quả lắc ở Sảnh Chờ 00 gõ hết <b>4 tiếng chuông</b> lúc 4 giờ mất đúng <b>6 giây</b> (tính từ tiếng đầu đến tiếng cuối). Hỏi lúc <b>3 giờ</b>, nó mất <b>mấy giây</b> để gõ hết 3 tiếng chuông?",
      "<strong>Chữ số 2:</strong> Cuốn sổ nợ dày 300 trang (đánh số 1→300; mỗi <b>tờ</b> gồm 2 trang: mặt lẻ trước, mặt chẵn sau). Tiểu Thất xé rách sạch <b>từ trang 98 đến hết trang 113</b>. Hỏi cậu ta đã xé mất tổng cộng <b>bao nhiêu TỜ giấy</b>?",
      "<strong>Chữ số 3:</strong> Có 4 Con nợ bị đội <b>2 mũ Đen, 2 mũ Trắng</b> (cả 4 đều biết tỷ lệ này). Bức tường chắn giữa <b>1</b> và <b>2</b>. Số <b>4</b> thấy 3 &amp; 2; số <b>3</b> chỉ thấy 2; số <b>2</b> và <b>1</b> không thấy ai. Đang đội: <b>1(Đen), 2(Trắng), 3(Đen), 4(Trắng)</b>. Sau 1 phút cả đám im lặng, <b>người số mấy</b> đoán đúng màu mũ đầu tiên?",
      "<strong>Chữ số 4:</strong> Số đồng xu nhỏ nhất lớn hơn 1: chia cho <b>2, 3, 4</b> đều <b>dư 1</b>, chia cho <b>5</b> thì <b>chia hết</b>. Lấy <b>chữ số hàng chục</b> của số đó.",
      "<strong>Chữ số 5:</strong> Đi bộ lên thang cuốn <b>đang chạy ngược chiều đi xuống</b>: bước <b>2 bậc/giây</b> mất <b>60 giây</b>, chạy <b>3 bậc/giây</b> mất <b>30 giây</b> tới đỉnh. Hỏi tổng số bậc thang cuốn khi đứng yên là bao nhiêu? (Lấy <b>tổng số bậc chia cho 10</b>)"
    ],
    clue12: "💡 <b>Tiểu Thất #707:</b> “Giữa 4 tiếng chuông chỉ có 3 khoảng nghỉ! Còn trang 98 chung tờ với 97, trang 113 chung tờ với 114 đó ạ.”",
    clue34: "💡 <b>Tiểu Thất #707:</b> “Vì số 4 im lặng nên 2 và 3 chắc chắn khác màu! Còn số xu trừ đi 1 sẽ chia hết cho 12.”",
    clue5: "💡 <b>Tiểu Thất #707:</b> “Đặt N = 60×(2 - v) = 30×(3 - v) rồi giải ra số bậc thang N!”",
    cheatMsg: "🆘 <b>Tiểu Thất #707:</b> “Thôi đừng bấm nữa máy sắp cháy rồi!! Mật mã hôm nay là <b style='letter-spacing:0.18em; color:#fff;'>49326</b>!”"
  },
  {
    passcode: "17083",
    riddles: [
      "<strong>Chữ số 1:</strong> Thanh huyền thiết dài <b>5 mét</b> cắt thành các đoạn <b>1 mét</b>. Mỗi lần cắt mất <b>12 phút</b>, nghỉ <b>4 phút</b> giữa các lần cắt. Hỏi cắt xong mất <b>mấy giờ</b>?",
      "<strong>Chữ số 2:</strong> Trong sảnh tiệc, mọi người bắt tay nhau đôi một (mỗi cặp đúng 1 lần). Tổng cộng có <b>21 cái bắt tay</b>. Hỏi có <b>bao nhiêu người</b>?",
      "<strong>Chữ số 3:</strong> Tiểu Thất mất 2 giờ đào 1 cái hố lập phương 1m × 1m × 1m, hỏi trong <b>nửa cái hố</b> đó chứa <b>bao nhiêu mét khối đất</b>?",
      "<strong>Chữ số 4:</strong> Giải loại trực tiếp 1v1 có <b>259 tuyển thủ</b> (thua 1 trận loại ngay, tìm 1 vô địch). Cần tổng cộng bao nhiêu trận? (Lấy <b>chữ số hàng đơn vị</b>)",
      "<strong>Chữ số 5:</strong> Cho 4 chữ số đầu là <b>[A]-[B]-[C]-[D]</b>. Tìm chữ số thứ 5 (<b>E</b>) biết: <em>“Tổng số chữ số <b>nhỏ hơn hoặc bằng 5</b> trong <b>CẢ 5 CHỮ SỐ [A-B-C-D-E]</b> đúng bằng <b>E</b>.”</em>"
    ],
    clue12: "💡 <b>Tiểu Thất #707:</b> “Thanh 5m cắt 5 khúc chỉ có 4 nhát cắt và 3 lần nghỉ! Công thức bắt tay là n×(n-1)/2 = 21.”",
    clue34: "💡 <b>Tiểu Thất #707:</b> “Đã gọi là CÁI HỐ thì bên trong rỗng làm gì có đất! Còn loại 258 người thì mất đúng 258 trận.”",
    clue5: "💡 <b>Tiểu Thất #707:</b> “Số 0 cũng <= 5 nhé! Nếu điền E=2 thì đếm lại cả 5 số sẽ thành 3 số <= 5 làm sai ngay.”",
    cheatMsg: "🆘 <b>Tiểu Thất #707:</b> “Ái chà đại ca ép em tới đường cùng rồi... Mật mã hôm nay là <b style='letter-spacing:0.18em; color:#fff;'>17083</b>!”"
  },
  {
    passcode: "82092",
    riddles: [
      "<strong>Chữ số 1:</strong> Hôm nay là <b>Thứ Hai</b>, tạm giam đúng <b>1.000 ngày</b>. Ngày thả rơi vào thứ mấy? (<b>2</b>=Hai ... <b>7</b>=Bảy, <b>8</b>=Chủ Nhật)",
      "<strong>Chữ số 2:</strong> Đồng hồ kim không số soi qua <b>gương phẳng</b> thấy chỉ <b>9 giờ 45 phút</b>. Hỏi <b>giờ thật</b> là mấy giờ? (Chỉ lấy phần <b>GIỜ</b>)",
      "<strong>Chữ số 3:</strong> Giá vật tư tăng <b>25%</b>, sau đó giảm <b>20%</b> so với giá vừa tăng. Giá cuối cùng lệch mấy <b>%</b> so với giá gốc ban đầu?",
      "<strong>Chữ số 4:</strong> Lấy số <b>4</b> chia cho <b>1/2</b> rồi cộng thêm <b>1</b> bằng mấy?",
      "<strong>Chữ số 5:</strong> 3 hộp kín, <b>1 hộp</b> chứa sổ đen, <b>1 nhãn ĐÚNG</b> (2 nhãn dối). Hộp <b>1</b>: <em>“Sổ ở hộp này”</em>; Hộp <b>2</b>: <em>“Sổ KHÔNG ở hộp này”</em>; Hộp <b>3</b>: <em>“Sổ KHÔNG ở hộp 1”</em>. Sổ ở <b>hộp mấy</b>?"
    ],
    clue12: "💡 <b>Tiểu Thất #707:</b> “1.000 chia 7 dư 6 ngày! Còn gương chỉ 9h45 thì kim giờ thật nằm giữa vạch 2 và 3.”",
    clue34: "💡 <b>Tiểu Thất #707:</b> “100 × 1.25 × 0.8 = 100! Còn chia 1/2 là nhân 2.”",
    clue5: "💡 <b>Tiểu Thất #707:</b> “Giả sử sổ ở hộp 1, 2, 3 rồi đếm xem trường hợp nào có ĐÚNG 1 nhãn thật.”",
    cheatMsg: "🆘 <b>Tiểu Thất #707:</b> “Thôi xong em rồi... Suỵt!! Mật mã hôm nay là <b style='letter-spacing:0.18em; color:#fff;'>82092</b>!”"
  },
  {
    passcode: "63148",
    riddles: [
      "<strong>Chữ số 1:</strong> Đi từ <b>tầng 1 lên tầng 4</b> qua <b>30 bậc thang</b>. Hỏi từ <b>tầng 1 lên tầng 7</b> qua bao nhiêu bậc? (Lấy <b>tổng bậc chia 10</b>)",
      "<strong>Chữ số 2:</strong> Trong phòng kín có: <b>1 ông, 2 cha, 2 con trai, 1 cháu nội</b>. Hỏi có <b>tối thiểu bao nhiêu người</b>?",
      "<strong>Chữ số 3:</strong> Phơi <b>1 áo khoác</b> ngoài nắng mất <b>1 giờ</b> mới khô. Phơi <b>6 áo</b> cùng lúc trên 1 dây phơi mất <b>mấy giờ</b>?",
      "<strong>Chữ số 4:</strong> Trong hộp tối có <b>4 cầu đỏ, 4 xanh, 4 vàng</b>. Bịt mắt bốc tối thiểu bao nhiêu quả để chắc chắn có <b>2 quả CÙNG MÀU</b>?",
      "<strong>Chữ số 5:</strong> Lượt đi chạy <b>6 km/h</b>, lượt về đúng quãng đường đó chạy <b>12 km/h</b>. Tính <b>vận tốc trung bình</b> cả đi lẫn về (km/h)?"
    ],
    clue12: "💡 <b>Tiểu Thất #707:</b> “Tầng 1 lên tầng 4 chỉ qua 3 đoạn thang! Còn một người đàn ông có thể vừa là cha vừa là con.”",
    clue34: "💡 <b>Tiểu Thất #707:</b> “6 áo phơi cùng lúc dưới nắng! Còn bốc cầu thì trường hợp xui nhất là 3 quả 3 màu.”",
    clue5: "💡 <b>Tiểu Thất #707:</b> “Thử đặt quãng đường một chiều 12km rồi lấy Tổng quãng đường chia Tổng thời gian xem!”",
    cheatMsg: "🆘 <b>Tiểu Thất #707:</b> “Huhu em đầu hàng... Bấm lén hộ 1 lần duy nhất nhé! Mật mã là <b style='letter-spacing:0.18em; color:#fff;'>63148</b>!”"
  }
];

function getMergedNpcStats(npcId) {
  return SITE_CONFIG.npcProfiles?.[npcId] || {};
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

let intrusionInterval = null, intrusionTimeout = null, savedThemeBeforeAlarm = null;
let hintSelfDestructInterval = null, hintSelfDestructTimeout = null;

function clearVaultHintBox() {
  clearInterval(hintSelfDestructInterval);
  clearTimeout(hintSelfDestructTimeout);
  state.vaultHintStep = 0;
  if (vaultHintBox) { vaultHintBox.classList.add("hidden"); vaultHintBox.innerHTML = ""; }
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
  if (savedThemeBeforeAlarm) { htmlEl.setAttribute("data-theme", savedThemeBeforeAlarm); savedThemeBeforeAlarm = null; }
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
  pushReceipt("🚨 【ERROR 403 — XÂM NHẬP HỒ SƠ Sd.】: Không có quyền truy cập! Kích hoạt báo động 4.2s.");

  intrusionInterval = setInterval(() => {
    const rem = Math.max(0, DURATION_MS - (Date.now() - startedAt));
    if (intrusionTimerEl) intrusionTimerEl.textContent = `${(rem / 1000).toFixed(1)}s`;
    if (intrusionBarEl) intrusionBarEl.style.width = `${(rem / DURATION_MS) * 100}%`;
    if (rem <= 0) stopSdIntrusionAlert();
  }, 60);
  intrusionTimeout = setTimeout(() => stopSdIntrusionAlert(), DURATION_MS + 40);
}
document.getElementById("btn-dismiss-intrusion")?.addEventListener("click", () => { stopSdIntrusionAlert(); pushReceipt("> Đã ngắt tín hiệu báo động."); });

// BIO-LAB ĐỘNG VẬT 3D THẬT + CHỈ ĐIỂM CHI TIẾT ĐỘNG VẬT + BIỂU ĐỒ AI
let currentLabNpc = null;
let currentLabZone = "head";
let aiChartTimer = null, aiStreamTimer = null;
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
  onProjectZones: (pts) => { if (!npcDossierModal?.classList.contains("hidden")) updateMorphCalloutLines(pts); },
  onSelectZone: (zoneKey) => selectLabZone(zoneKey)
});

function selectLabZone(zoneKey) {
  if (!currentLabNpc) return;
  currentLabZone = zoneKey;
  npcMorph3D.setActiveZone(zoneKey);
  document.querySelectorAll(".zone-pin-btn").forEach((b) => b.classList.toggle("is-active", b.dataset.zone === zoneKey));
  const info = currentLabNpc.zones?.[zoneKey];
  const detailBox = document.getElementById("lab-zone-detail");
  if (detailBox && info) detailBox.innerHTML = `<strong>[CHỈ ĐIỂM BỘ PHẬN: ${info.title}]</strong>${info.text}`;
}
document.querySelectorAll(".zone-pin-btn").forEach((btn) => btn.addEventListener("click", () => { if (state.sfx) radio.playClickChime(); selectLabZone(btn.dataset.zone); }));

document.getElementById("btn-morph-mode")?.addEventListener("click", (e) => {
  if (state.sfx) radio.playClickChime();
  const mode = npcMorph3D.toggleRenderMode();
  e.currentTarget.textContent = mode === "real" ? "💠 CHẾ ĐỘ: THỰC TẾ 3D" : "🌐 CHẾ ĐỘ: HOLOGRAM LƯỚI";
});

function startAiLabTelemetryLoop(npc, stats) {
  stopAiLabTelemetryLoop();
  const chart = document.getElementById("lab-ai-chart");
  const ctx = chart?.getContext("2d");
  const ecg = document.getElementById("lab-ecg-canvas");
  const ecgCtx = ecg?.getContext("2d");
  const streamBox = document.getElementById("lab-ai-stream");
  const preset = ANIMAL_PRESETS[stats.animalKey] || ANIMAL_PRESETS.horse;

  const aiPackets = [
    `> AI_CORE: Tracking 3D fauna [${preset.label}]...`,
    `> BIOMETRICS: Span ${stats.wingspanOrLen || "180 CM"} | Temp ${stats.bodyTemp || "36.6°C"}`,
    `> OLFACTORY_ID: ${npc.scent?.slice(0, 32) || "Unknown"}...`,
    `> CAUSALITY_CHECK: Clearance [${npc.clearance}] verified.`,
    `> SKELETAL_RIG: GLTF AnimationMixer running...`,
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
      ctx.strokeStyle = `rgba(${pRgb}, 0.12)`; ctx.lineWidth = 1;
      for (let y = 22; y < h; y += 22) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

      const colW = w / aiBars.length;
      for (let i = 0; i < aiBars.length; i++) {
        aiBars[i] += (Math.random() - 0.5) * 12;
        aiBars[i] = Math.max(12, Math.min(82, aiBars[i]));
        const bh = (aiBars[i] / 100) * (h - 14);
        ctx.fillStyle = i % 4 === 0 ? `rgba(${sRgb}, 0.68)` : `rgba(${pRgb}, 0.42)`;
        ctx.fillRect(i * colW + 3, h - bh, colW - 6, bh);
      }

      ctx.strokeStyle = `rgba(${sRgb}, 0.95)`; ctx.lineWidth = 1.6;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 6) {
        const y = h * 0.42 + Math.sin(x * 0.045 + aiPhase) * 15 + Math.cos(x * 0.11 - aiPhase * 1.4) * 6;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.strokeStyle = `rgba(${pRgb}, 0.8)`; ctx.lineWidth = 1.1;
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
      ecgCtx.strokeStyle = `rgba(${pRgb}, 0.92)`; ecgCtx.lineWidth = 1.4;
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
  const preset = ANIMAL_PRESETS[stats.animalKey] || ANIMAL_PRESETS.horse;

  document.getElementById("lab-subject-id").textContent = `>> BUREAU BIO-VAULT // ${npc.code}`;
  document.getElementById("lab-npc-name").textContent = npc.name;
  document.getElementById("lab-npc-role").textContent = `${npc.role} • LINH THÚ: ${stats.animalTitle || preset.label}`;

  const portraitBox = document.getElementById("lab-portrait-box");
  if (portraitBox) {
    if ((stats.avatarUrl || "").trim()) {
      portraitBox.innerHTML = `<img src="${stats.avatarUrl.trim()}" alt="${npc.name}" /><div class="portrait-scan-beam"></div>`;
    } else {
      portraitBox.innerHTML = `<div class="portrait-empty-holo"><span>${npc.emblem}</span>CHƯA GẮN LINK ẢNH NPC<br/><small>(Thêm link vào avatarUrl trong js/config.js)</small></div><div class="portrait-scan-beam"></div>`;
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

  document.getElementById("lab-morph-tag").textContent = preset.label.toUpperCase();
  document.getElementById("lab-morph-stats").innerHTML = `
    <div><small>LINH THÚ 3D</small><strong>${stats.animalTitle || preset.label}</strong></div>
    <div><small>SẢI / DÀI</small><strong>${stats.wingspanOrLen || "180 CM"}</strong></div>
    <div><small>TRỌNG LƯỢNG</small><strong>${stats.weightKg || "25 KG"}</strong></div>
    <div><small>LOẠI CƠ HỌC</small><strong>${preset.type.toUpperCase()} GLB</strong></div>
  `;

  const radialBox = document.getElementById("lab-radial-gauges");
  if (radialBox) {
    const bars = stats.bars || [{ label: "SYNC", val: 92 }];
    const gaugeData = [
      { label: "THREAT", val: bars[0]?.val ?? 95 },
      { label: "STABILITY", val: bars[1]?.val ?? 98 },
      { label: "CONTROL", val: bars[2]?.val ?? 94 }
    ];
    const r = 19, circ = 2 * Math.PI * r;
    radialBox.innerHTML = gaugeData.map((g) => {
      const dash = (g.val / 100) * circ;
      return `<div class="radial-gauge-item"><svg viewBox="0 0 48 48"><circle class="bg" cx="24" cy="24" r="${r}" /><circle class="fg" cx="24" cy="24" r="${r}" stroke-dasharray="${dash.toFixed(1)} ${circ.toFixed(1)}" /></svg><strong>${g.val}%</strong><span>${g.label}</span></div>`;
    }).join("");
  }

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
  document.querySelectorAll(".dossier-flip-card.is-flipped").forEach((c) => { if (c !== cardEl) c.classList.remove("is-flipped"); });
  if (state.sfx) radio.playFlipChime();
  cardEl.classList.add("is-flipped");

  const fillEl = cardEl.querySelector(".loading-bar-fill");
  const pctEl = cardEl.querySelector(".loading-pct");
  const streamEl = cardEl.querySelector(".loading-stream-lines");
  if (fillEl) fillEl.style.width = "0%";
  if (streamEl) streamEl.innerHTML = "";

  const packets = [
    `> ACCESSING BUREAU_NODE: ${npc.code}...`,
    `> DECRYPTING 3D FAUNA STREAM [GLTF/GLB]...`,
    `> CALIBRATING ANATOMICAL HOTSPOTS...`,
    `> COMPILING AI DIAGNOSTICS & VITAL MATRIX...`,
    `> DATA READY. EXPANDING 3D BIO-LAB!`
  ];
  let pct = 0, pktIdx = 0;
  cardLoadTimer = setInterval(() => {
    pct = Math.min(100, pct + 14);
    if (fillEl) fillEl.style.width = `${pct}%`;
    if (pctEl) pctEl.textContent = `${pct}%`;
    if (streamEl && pktIdx < packets.length && pct >= pktIdx * 20) {
      const line = document.createElement("div"); line.textContent = packets[pktIdx++]; streamEl.appendChild(line);
    }
    if (pct >= 100) { clearInterval(cardLoadTimer); setTimeout(() => openNpcBioLabModal(npc), 160); }
  }, 85);
}

function renderVaultCards() {
  if (!vaultCardsGrid) return;
  vaultCardsGrid.innerHTML = "";
  VAULT_NPCS.forEach((npc) => {
    const stats = getMergedNpcStats(npc.id);
    const card = document.createElement("div");
    card.className = `dossier-flip-card ${npc.isSd ? "is-sd-card" : ""}`;
    const frontHint = npc.isSd ? `<span class="sd-err-tag">[TRUY CẬP BỊ CẤM // KHÔNG CÓ QUYỀN]</span>` : `[ BẤM LẬT THẺ &amp; QUÉT LINH THÚ 3D ]`;
    const thumbHtml = (!npc.isSd && (stats.avatarUrl || "").trim())
      ? `<img src="${stats.avatarUrl.trim()}" alt="" style="width:54px;height:54px;border-radius:50%;object-fit:cover;border:1.5px solid var(--c-primary);" />`
      : npc.emblem;

    card.innerHTML = `
      <div class="dossier-card-inner">
        <div class="dossier-face dossier-face-front">
          <div class="dossier-top-tag"><span>${npc.code}</span><span>${npc.clearance}</span></div>
          <div class="dossier-emblem">${thumbHtml}</div>
          <div class="dossier-front-title"><strong>${npc.name}</strong><small>${npc.role}</small></div>
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
      if (npc.isSd) { triggerSdIntrusionAlert(card); return; }
      runCardLoadingThenOpenModal(card, npc);
    });
    vaultCardsGrid.appendChild(card);
  });
}
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
    pushReceipt("🔓 【HỒ SƠ MẬT】: Giải mã thành công. Đã mở quyền xem Kho Linh Thú & Hồ Sơ 3D.");
  } else {
    vaultAttempts += 1;
    if (state.sfx) radio.playFlipChime();
    if (passInput) { passInput.classList.remove("is-wrong"); void passInput.offsetWidth; passInput.classList.add("is-wrong"); }
    const snark = vaultAttempts >= 3 ? "Hệ Thống 00 ghi nhận chỉ số đọc hiểu đang báo động đỏ. Kiểm tra kỹ bẫy từng chữ!" : "Bạn đã rơi vào bẫy đọc lướt! Tính ngược lại từng chữ số một.";
    if (vaultErrMsg) vaultErrMsg.textContent = `❌ Sai mật mã [${val || "trống"}]: ${snark}`;
    pushReceipt(`【KÉT BẢO MẬT】: Nhập sai mật mã [${val}].`);
  }
});

vaultHintBtn?.addEventListener("click", () => {
  if (state.sfx) radio.playClickChime();
  if (state.vaultHintStep === 7) { clearVaultHintBox(); return; }
  const proto = VAULT_PROTOCOLS[activeProtocolIdx];
  state.vaultHintStep += 1;
  const step = state.vaultHintStep;
  if (!vaultHintBox) return;
  clearInterval(hintSelfDestructInterval); clearTimeout(hintSelfDestructTimeout);

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
  const mktInfo = getMarketSlotInfo();
  const mCdEl = document.getElementById("market-countdown");
  if (mCdEl) mCdEl.textContent = mktInfo.countdown;
  if (mktInfo.slotId !== lastMarketSlot) {
    renderMarketCatalog();
    pushReceipt(`【CHỢ ĐEN 3H】: Đã qua khung giờ mới (${mktInfo.label}) — Tự động xoay lô hàng theo plot mới!`);
  }
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
    if (cmd === "!hethong") { switchTab("tab-market"); pushReceipt("【LỆNH !HETHONG】: Đã triệu hồi bảng điều chỉnh Hình thái Vật lý."); }
    else if (cmd === "!nhiemvu") { switchTab("tab-sectors"); generateUniqueCases(); triggerMissionSimulation(state.selectedSector); pushReceipt("【LỆNH !NHIEMVU】: Đã mở Sảnh Trọng Án Độc Bản."); }
    else if (cmd === "!diendan") { switchTab("tab-forum"); pushReceipt("【LỆNH !DIENDAN】: Đã kết nối Mạng nội bộ Báo Ứng Net v4.0."); }
    else if (cmd === "!kiemtoan") {
      const pbTxt = state.contractLocked && typeof state.pb === "number" ? `${state.pb.toFixed(2)} PB` : "Chưa ký chính thức";
      pushReceipt(`🗂️ 【KIỂM TOÁN NHANH】: Mã ${state.debtorCode} | Số dư: ${pbTxt} | Mục tiêu: ${state.selectedSector} | Gói: ${state.selectedPkg}.`);
    }
  });
});

// 14. MODAL TÀI KHOẢN & AVATAR
const openModal = (id) => document.getElementById(id)?.classList.remove("hidden");
const closeModal = (id) => document.getElementById(id)?.classList.add("hidden");
document.querySelectorAll("[data-close-modal]").forEach((btn) => btn.addEventListener("click", () => closeModal(btn.dataset.closeModal)));
document.getElementById("btn-auth")?.addEventListener("click", () => openModal("modal-auth"));

const authOut = document.getElementById("auth-logged-out");
const authIn = document.getElementById("auth-logged-in");
const authMsg = document.getElementById("auth-msg");

function applyProfileUI(profile) {
  const topAvatar = document.getElementById("topbar-avatar");
  if (!profile) {
    state.username = null; state.currentProfile = null; state.contractLocked = false;
    state.pb = null; state.debtorCode = "CHƯA CẤP"; state.forumPostMode = "anon";
    document.getElementById("user-dot")?.classList.remove("online");
    topAvatar?.classList.add("hidden");
    const uLbl = document.getElementById("user-label");
    if (uLbl) uLbl.textContent = "ĐĂNG NHẬP";
    authOut?.classList.remove("hidden"); authIn?.classList.add("hidden");
    lockContractFormUI({ contractLocked: false }); updateStatsUI(); updateForumIdentityUI();
    state.inventory = loadLocalInventory(); renderBag();
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
  authOut?.classList.add("hidden"); authIn?.classList.remove("hidden");

  lockContractFormUI(profile); updateStatsUI(); updateForumIdentityUI();
  const remoteBag = Array.isArray(profile.inventory)
    ? profile.inventory
    : profile.inventory ? Object.values(profile.inventory) : null;
  state.inventory = remoteBag || loadLocalInventory();
  renderBag();
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
// 16. MÔ PHỎNG THANH NHIỆM VỤ + MASCOT 3D BAY NHẢY + BỘ TỰ CHẾ QUOTES MỖI 10 PHÚT
const AUTO_QUOTE_MS = 10 * 60 * 1000; // Chu kỳ 10 phút
let nextAutoQuoteAt = Date.now() + AUTO_QUOTE_MS;
let bubbleHideTimeout = null;
let bubbleHovered = false;
let missionSimTimer = null;
let missionTypeTimer = null;
let missionAutoCloseTimer = null;

const mascotHitbox = document.getElementById("sys-mascot-hitbox");
const mascotBubble = document.getElementById("sys-mascot-bubble");
const bubbleTopicTag = document.getElementById("bubble-topic-tag");
const bubbleQuoteText = document.getElementById("bubble-quote-text");
const impactFx = document.getElementById("screen-impact-fx");
const missionSimBar = document.getElementById("mission-sim-bar");

// BỘ TỰ CHẾ QUOTES ĐỘNG THEO NGỮ CẢNH (KHÔNG LƯU CÂU SẴN)
function synthesizeSystemQuote(forcedCat = null) {
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const gmt7Hour = new Date(Date.now() + 7 * 3600 * 1000).getUTCHours();
  const timeOfDay = gmt7Hour < 11 ? "sáng" : gmt7Hour < 14 ? "trưa" : gmt7Hour < 18 ? "chiều" : "khuya";
  const pbStr = state.contractLocked && typeof state.pb === "number" ? `${state.pb.toFixed(2)} PB` : "chưa thèm ký hợp đồng";
  const code = state.debtorCode !== "CHƯA CẤP" ? `Con nợ ${state.debtorCode}` : "Kẻ vô danh";
  const fee = (0.25 + Math.random() * 2.4).toFixed(2);

  const generators = {
    mission: () => {
      const open = pick(["Cập nhật tiến độ", "Đánh giá KPI", "Báo cáo hiện trường", "Cảnh báo thời hạn"]);
      const act = pick([
        `tại [${state.selectedSector}] đang dậm chân tại chỗ`,
        `ở [${state.selectedSector}] có dấu hiệu Kẻ Cướp Phước sắp tẩu tán chứng cứ`,
        `của ${code} vẫn chưa chạm nổi ngưỡng 10% chỉ tiêu thu hồi`,
        `theo gói [${state.selectedPkg}] đòi hỏi động não nhiều hơn là ngồi nhìn màn hình`
      ]);
      const tail = pick([
        "Muốn để bị thanh lý sớm hay định bắt tay vào làm việc đi?",
        "Đừng mong có Bàn tay vàng nào rớt xuống cứu hộ miễn phí.",
        `Phí nhắc nhở tiến độ: -${fee} PB.`
      ]);
      return { tag: "HỆ THỐNG 00 // NHIỆM VỤ", text: `【${open}: Tiến trình ${act}. ${tail}】` };
    },
    roast: () => {
      const obs = state.contractLocked
        ? pick([
            `đang ôm khoản nợ ${pbStr} mà vẫn ngồi bấm chuột thong thả như đi dạo công viên`,
            `có nhịp tim ổn định một cách đáng ngờ dù ví tiền chỉ đủ mua nửa gói mì`,
            `vừa liếc qua giao diện mà não bộ chưa xuất ra được kế hoạch vả mặt nào khả dĩ`
          ])
        : pick([
            "lượn lờ khắp Sảnh Chờ 00 như khách tham quan miễn phí mà không chịu ký hợp đồng",
            "tính ăn quỵt tiền điện máy chủ của Cục Báo Ứng bằng chế độ khách tới bao giờ?"
          ]);
      const sting = pick([
        "Hệ thống đánh giá chỉ số sinh tồn hôm nay ở mức: Đáng báo động.",
        `Đề nghị ${code} bớt lười lại để tránh bị trừ thêm -${fee} PB phí chiếm dụng băng thông.`,
        "Tiểu Thất nhìn còn thấy sốt ruột giùm."
      ]);
      return { tag: "HỆ THỐNG 00 // MỈA MAI", text: `【Kiểm toán thái độ: ${code} ${obs}. ${sting}】` };
    },
    weather: () => {
      const sky = pick([
        `trời ${timeOfDay} nay âm u ẩm mốc như tường tầng hầm bệnh viện`,
        `nắng ${timeOfDay} gắt như ánh đèn sân khấu Điện 1 chiếu thẳng vào mặt trà xanh`,
        `gió mùa lùa lạnh buốt làm vết thương cũ của nguyên chủ nhức nhối`,
        `không khí đặc quánh mùi nước hoa rẻ tiền trộn khói bụi đô thị`
      ]);
      const jab = pick([
        `Thời tiết thế này mà ${code} vẫn ra đường không mang áo mưa là tự tăng nguy cơ cảm cúm tốn thêm 50 PB mua thuốc đấy.`,
        `Thời tiết rất hợp để tra nam quỳ dầm mưa diễn khổ nhục kế — còn bạn đừng có dại đứng nhìn mà sụt sùi theo.`,
        `Phí điều hòa không khí trong Sảnh Chờ 00 buổi ${timeOfDay}: -${fee} PB.`
      ]);
      return { tag: "HỆ THỐNG 00 // CHÊ THỜI TIẾT", text: `【Dự báo khí tượng: ${sky}. ${jab}】` };
    },
    money: () => {
      const status = state.contractLocked
        ? `Nhìn vào số dư ${pbStr} kia đi`
        : "Ví tiền ngoài đời thực lẫn tài khoản Phước Báu đều trống trơn";
      const roastMoney = pick([
        "đến cả cái bánh bao nguội ở cổng bệnh viện còn suy nghĩ ba lần mới dám cắn.",
        "nghèo đến mức máy in hóa đơn nhiệt cũng ngại tốn giấy khi in sao kê cho bạn.",
        `bán cả linh hồn đi thanh lý chắc vừa đủ trả tiền điện chạy quạt cho máy chủ 3 phút.`,
        `cứ tiêu xài kiểu này thì lãi suất 10% mỗi 10 Turn sẽ nhấn chìm bạn trước khi kịp tát ai.`
      ]);
      return { tag: "HỆ THỐNG 00 // CHÊ TIỀN", text: `【Báo cáo tài chính: ${status} — ${roastMoney}】` };
    },
    badluck: () => {
      const incident = pick([
        "vừa bước ra cửa đã có nguy cơ gãy gót giày hoặc dẫm trúng vũng nước bẩn",
        "cầm ly nước lọc uống cũng dễ sặc tới mức nhập viện",
        "mang đúng cái mệnh Sao Quả Tạ khiến đèn hành lang chớp tắt đúng lúc quan trọng",
        "càng cố tỏ ra ngầu lòi thì xác suất vấp thảm lăn cầu thang càng tăng gấp đôi"
      ]);
      return { tag: "HỆ THỐNG 00 // CHÊ XUI", text: `【Cảnh báo Debuff Cạn Phước: Theo tính toán xác suất, hôm nay ${code} ${incident}. Khấu trừ trước -${fee} PB phí bảo hiểm tai nạn ngớ ngẩn.】` };
    },
    goodluck: () => {
      const illusion = pick([
        "Thấy tự nhiên nhặt được tiền hay được tổng tài để mắt tới",
        "Mơ màng tưởng mình có hào quang nhân vật chính độ mệnh",
        "Tưởng hôm nay tự nhiên gặp chuyện suôn sẻ bất thường"
      ]);
      const slap = pick([
        "Xin chúc mừng: 99% đó là mồi nhử của Kẻ Cướp Phước hoặc hàng tồn kho hết hạn bảo hành.",
        "Đừng tin vào may mắn từ trên trời rơi xuống — thứ rơi từ trên trời xuống thường chỉ có phân chim hoặc hóa đơn nợ.",
        "Nếu may mắn thật thì bạn đã chẳng ngồi đây đọc dòng thông báo này của tôi."
      ]);
      return { tag: "HỆ THỐNG 00 // CHÊ MAY MẮN", text: `【Giải ảo vận may: ${illusion}? ${slap}】` };
    },
    gossip: () => {
      const target = pick([
        "Tiểu Thất #707",
        "Lục Nha ở tiệm cầm đồ hẻm sau",
        "Thanh Tra Tạ Vô Cữu",
        "Giám Ngục Ngu Hồng Diệp",
        "vị khách tóc trắng ở lô VIP tầng thượng",
        "đám Kẻ Cướp Phước bên Điện 3"
      ]);
      const tea = pick([
        "sáng nay lại làm chập mạch ổ điện khiến cả khu kiểm toán mất sóng 5 phút rồi lén trốn vào góc quấn băng gạc.",
        "vừa uống cạn nửa chai rượu mạnh xong đứng chửi xéo mức phí dịch vụ 80% của Cục suốt nửa tiếng.",
        "nhìn bảng sao kê nợ của bạn xong lắc đầu thở dài như nhìn một ca vô phương cứu chữa.",
        "đang đặt cược ngầm xem bạn trụ được bao nhiêu ngày trước khi bị lừa sạch chứng cứ.",
        "lúc nào cũng giả vờ đạo mạo thanh cao nhưng sau lưng thì lén thuê thủy quân dọn sạch phốt."
      ]);
      return { tag: "HỆ THỐNG 00 // NÓI XẤU NỘI BỘ", text: `【Tin đồn hành lang: Nghe bảo ${target} ${tea} Đừng nói là Hệ Thống 00 kể nhé.】` };
    }
  };

  const keys = Object.keys(generators);
  const chosenKey = forcedCat && generators[forcedCat] ? forcedCat : pick(keys);
  return generators[chosenKey]();
}

function showMascotQuote(forcedCat = null, customObj = null) {
  if (!mascotBubble || !bubbleQuoteText || !bubbleTopicTag) return;
  const q = customObj || synthesizeSystemQuote(forcedCat);
  bubbleTopicTag.textContent = q.tag;
  bubbleQuoteText.textContent = q.text;
  mascotBubble.classList.remove("hidden");

  clearTimeout(bubbleHideTimeout);
  bubbleHideTimeout = setTimeout(() => {
    if (!bubbleHovered) mascotBubble.classList.add("hidden");
  }, 9500);
}

mascotBubble?.addEventListener("mouseenter", () => { bubbleHovered = true; });
mascotBubble?.addEventListener("mouseleave", () => {
  bubbleHovered = false;
  clearTimeout(bubbleHideTimeout);
  bubbleHideTimeout = setTimeout(() => mascotBubble.classList.add("hidden"), 4500);
});
document.getElementById("btn-close-bubble")?.addEventListener("click", () => mascotBubble?.classList.add("hidden"));

const sysMascot3D = initSystemMascot3D({
  canvasId: "sys-mascot-canvas",
  onProjectScreen: (sx, sy) => {
    const inView = sx > -60 && sx < window.innerWidth + 60 && sy > -60 && sy < window.innerHeight + 60;
    if (mascotHitbox) {
      mascotHitbox.style.display = inView && sysMascot3D.isEnabled() ? "block" : "none";
      mascotHitbox.style.left = `${Math.max(48, Math.min(window.innerWidth - 48, sx))}px`;
      mascotHitbox.style.top = `${Math.max(76, Math.min(window.innerHeight - 48, sy + 28))}px`;
    }
    if (mascotBubble && !mascotBubble.classList.contains("hidden")) {
      const bw = Math.min(315, window.innerWidth * 0.84);
      const bx = Math.max(12, Math.min(window.innerWidth - bw - 12, sx - bw * 0.5));
      const by = sy < 185 ? Math.min(window.innerHeight - 165, sy + 52) : Math.max(70, sy - 128);
      mascotBubble.style.left = `${bx}px`;
      mascotBubble.style.top = `${by}px`;
    }
  },
  onScreenBonk: (ix, iy) => {
    if (state.sfx) radio.playFlipChime();
    document.body.classList.remove("screen-bonk-shake");
    void document.body.offsetWidth;
    document.body.classList.add("screen-bonk-shake");

    if (impactFx) {
      impactFx.style.left = `${Math.max(60, Math.min(window.innerWidth - 60, ix))}px`;
      impactFx.style.top = `${Math.max(90, Math.min(window.innerHeight - 60, iy))}px`;
      impactFx.classList.remove("hidden");
      impactFx.style.animation = "none";
      void impactFx.offsetWidth;
      impactFx.style.animation = "";
      setTimeout(() => impactFx.classList.add("hidden"), 560);
    }

    const bonkFee = (0.5 + Math.random() * 1.5).toFixed(2);
    showMascotQuote(null, {
      tag: "HỆ THỐNG 00 // VA CHẠM KÍNH",
      text: `【Ái!! Hệ thống 3D vừa đâm sầm vào mặt kính màn hình do Ký chủ thiết lập tọa độ thiếu thẩm mỹ. Tự động ghi nợ phí lau vết nứt: -${bonkFee} PB.】`
    });
    pushReceipt(`💥 【VA CHẠM 3D】: Con Hạc Kiểm Toán đâm sầm vào màn hình! (-${bonkFee} PB phí sửa kính ảo).`);
  }
});

// Chọc con Hạc 3D
function pokeMascot3D() {
  if (!sysMascot3D.isEnabled()) {
    sysMascot3D.setEnabled(true);
    const tog = document.getElementById("btn-toggle-mascot");
    if (tog) tog.textContent = "🦅 HỆ THỐNG 3D: BẬT";
  }
  if (state.sfx) radio.playClickChime();
  const stunts = ["dive_bonk", "barrel_roll", "glitch_drop", "hover_peek"];
  sysMascot3D.triggerStunt(stunts[Math.floor(Math.random() * stunts.length)]);
  showMascotQuote();
}
mascotHitbox?.addEventListener("click", pokeMascot3D);
document.getElementById("btn-mascot-stunt")?.addEventListener("click", pokeMascot3D);

document.getElementById("btn-toggle-mascot")?.addEventListener("click", (e) => {
  if (state.sfx) radio.playClickChime();
  const nextState = !sysMascot3D.isEnabled();
  sysMascot3D.setEnabled(nextState);
  e.currentTarget.textContent = nextState ? "🦅 HỆ THỐNG 3D: BẬT" : "🦅 HỆ THỐNG 3D: TẮT";
  if (!nextState) {
    mascotBubble?.classList.add("hidden");
    if (mascotHitbox) mascotHitbox.style.display = "none";
  }
});

// MÔ PHỎNG THANH NHIỆM VỤ HIỆN RA + THÔNG BÁO HỆ THỐNG ĐÁNH MÁY
function triggerMissionSimulation(sectorName = state.selectedSector) {
  if (!missionSimBar) return;
  clearInterval(missionSimTimer);
  clearInterval(missionTypeTimer);
  clearTimeout(missionAutoCloseTimer);

  const secObj = SECTORS.find((s) => s.name === sectorName) || SECTORS[0];
  const titleEl = document.getElementById("sim-mission-title");
  const fillEl = document.getElementById("sim-mission-bar-fill");
  const metaEl = document.getElementById("sim-mission-meta");
  const broadEl = document.getElementById("sim-mission-broadcast");

  missionSimBar.classList.remove("hidden");
  if (titleEl) titleEl.textContent = `⚖️ ĐANG ĐỒNG BỘ THANH NHIỆM VỤ — ${secObj.name.toUpperCase()}`;
  if (fillEl) fillEl.style.width = "0%";
  if (metaEl) metaEl.innerHTML = `▸ Vùng triển khai: <b>${secObj.zone}</b> (${secObj.sub})<br/>▸ Luật sinh tử: ${secObj.rule}`;
  if (broadEl) broadEl.textContent = "Đang kết nối máy chủ Kế Toán Viên 00...";

  if (state.sfx) radio.playClickChime();
  sysMascot3D.triggerStunt("mission_swoop");

  let pct = 0;
  missionSimTimer = setInterval(() => {
    pct = Math.min(100, pct + 12);
    if (fillEl) fillEl.style.width = `${pct}%`;
    if (pct >= 100) {
      clearInterval(missionSimTimer);
      if (titleEl) titleEl.textContent = `✅ THANH NHIỆM VỤ ĐÃ KÍCH HOẠT: ${secObj.name}`;
      if (state.sfx) radio.playFlipChime();

      const pbInfo = state.contractLocked && typeof state.pb === "number" ? `${state.pb.toFixed(2)} PB` : "Tài khoản chưa ký";
      const fullBroadcast = `【THÔNG BÁO HỆ THỐNG 00】: Hồ sơ Báo Ứng tại [${secObj.name}] đã khóa mục tiêu! Gói chỉ tiêu: [${state.selectedPkg}] | Số dư hiện tại: [${pbInfo}]. Đừng chết lãng xẹt trước khi thu hồi đủ Phước Báu trả nợ.`;

      let idx = 0;
      if (broadEl) broadEl.textContent = "";
      missionTypeTimer = setInterval(() => {
        if (broadEl) broadEl.textContent = fullBroadcast.slice(0, ++idx);
        if (idx >= fullBroadcast.length) clearInterval(missionTypeTimer);
      }, 22);

      showMascotQuote("mission");
      pushReceipt(`🎬 【MÔ PHỎNG NHIỆM VỤ】: Đã bật thanh nhiệm vụ [${secObj.name}].`);
    }
  }, 75);

  missionAutoCloseTimer = setTimeout(() => {
    missionSimBar.classList.add("hidden");
  }, 13500);
}

document.getElementById("btn-sim-mission")?.addEventListener("click", () => triggerMissionSimulation());
document.getElementById("btn-sim-mission-tab")?.addEventListener("click", () => triggerMissionSimulation());
document.getElementById("btn-close-mission-sim")?.addEventListener("click", () => {
  clearInterval(missionSimTimer);
  clearInterval(missionTypeTimer);
  missionSimBar?.classList.add("hidden");
});

// Bộ đếm chu kỳ 10 phút tự nói 1 câu quote random
setInterval(() => {
  const now = Date.now();
  const rem = Math.max(0, nextAutoQuoteAt - now);
  const totalSec = Math.ceil(rem / 1000);
  const mm = String(Math.floor(totalSec / 60)).padStart(2, "0");
  const ss = String(totalSec % 60).padStart(2, "0");
  const cdEl = document.getElementById("mascot-quote-cd");
  if (cdEl) cdEl.textContent = `${mm}:${ss}`;

  if (now >= nextAutoQuoteAt) {
    nextAutoQuoteAt = now + AUTO_QUOTE_MS;
    if (sysMascot3D.isEnabled()) {
      sysMascot3D.triggerStunt("hover_peek");
      showMascotQuote();
    }
  }
}, 1000);

// Chào màn sau 3.5 giây khi mới mở web
setTimeout(() => {
  if (sysMascot3D.isEnabled()) showMascotQuote("roast");
}, 3500);
applyTheme(state.theme, false);
updateStatsUI();
updateLiveDossierPreview();
updateForumIdentityUI();
loadAndRenderForum();
switchTab("tab-profile", true);
restoreSession();