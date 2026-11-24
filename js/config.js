// js/config.js — FILE CẤU HÌNH DÀNH RIÊNG CHO CHỦ WEB (ĐÃ ĐIỀN ĐỦ 6 NPC KỂ CẢ Sd.)

export const SITE_CONFIG = {
  // 1. LINK ẢNH BACKGROUND
  backgroundImage: {
    defaultUrl: "./assets/assets/OPW/Hethongbaoung/canvas_bg.png", // Dán lại link ảnh nền của bạn nếu cần (vd: "./assets/.../canvas_bg.png")
    byTheme: {
      "orbital-cyan": "",
      "cyber-violet": "",
      "acid": "",
      "crimson-karma": ""
    },
    opacity: 0.55
  },

  // 2. LINK NHẠC CHO RADIO
  musicPlaylist: [
    { title: "CH.01 // VOID DRONE", url: "" },
    { title: "CH.02 // CYBER PULSE", url: "" },
    { title: "CH.03 // TINH THỂ Sd.", url: "" }
  ],

  // 3. CÀI ĐẶT HIỆU ỨNG
  effects: {
    scanlines: true,
    parallax3D: true,
    sfx: true
  },

  // 4. HỒ SƠ CHỈ SỐ & ẢNH CỐ ĐỊNH CHO CẢ 6 NPC (BAO GỒM CẢ Sd.)
  npcProfiles: {
    sys00: {
      avatarUrl: "",
      gender: "AI / Vô tính",
      age: "∞",
      species: "Thú (Chim Quạ) — Hoặc 'Người' trong lore cổ đại Hệ Thống 00 hóa thân thành Quạ Đen đeo thẻ đồng",
      heightCm: 175,
      weightKg: 0,
      build: "Chương trình kiểm toán tự động • Phi vật chất",
      heartRate: "00 BPM",
      pressure: "80% PHÍ",
      bodyTemp: "18.4 °C",
      soulSat: "100%",
      bars: [
        { label: "TƯ BẢN BÓC LỘT", val: 100 },
        { label: "HÀNH CHÍNH HÓA BI KỊCH", val: 98 },
        { label: "TỐC ĐỘ IN HÓA ĐƠN", val: 99 },
        { label: "LÒNG TỪ BI MIỄN PHÍ", val: 0 }
      ]
    },
    tavocuu: {
      avatarUrl: "",
      gender: "Nam",
      age: "~30",
      species: "Người",
      heightCm: 188,
      weightKg: 76,
      build: "Cao gầy rắn rỏi • Vai rộng phẳng phiu",
      heartRate: "52 BPM",
      pressure: "110/70",
      bodyTemp: "35.4 °C",
      soulSat: "99.6%",
      bars: [
        { label: "UY ÁP KIỂM TOÁN", val: 96 },
        { label: "NGUYÊN TẮC TÀN NHẪN", val: 99 },
        { label: "KHÁNG CẨU HUYẾT", val: 100 },
        { label: "ĐIỀU TRA MÃ NGUỒN Sd.", val: 84 }
      ]
    },
    lucnha: {
      avatarUrl: "",
      gender: "Nam",
      age: "27",
      species: "Người",
      heightCm: 185,
      weightKg: 79,
      build: "Săn chắc hoang dã • Cơ bắp đầy sẹo",
      heartRate: "76 BPM",
      pressure: "126/78",
      bodyTemp: "37.2 °C",
      soulSat: "94.1%",
      bars: [
        { label: "THỰC CHIẾN ĐƯỜNG PHỐ", val: 93 },
        { label: "LÁCH LUẬT CHỢ ĐEN", val: 98 },
        { label: "ĐỘ SÒNG PHẲNG", val: 95 },
        { label: "TUÂN THỦ HỆ THỐNG", val: 4 }
      ]
    },
    nguhongdiep: {
      avatarUrl: "",
      gender: "Nữ",
      age: "28",
      species: "Người",
      heightCm: 171,
      weightKg: 53,
      build: "Đồng hồ cát quyến rũ • Sắc sảo",
      heartRate: "64 BPM",
      pressure: "114/72",
      bodyTemp: "36.5 °C",
      soulSat: "97.8%",
      bars: [
        { label: "MỊ LỰC ĐỘC DƯỢC", val: 98 },
        { label: "PHÁN XÉT TRA NAM", val: 100 },
        { label: "THAO TÚNG TRUYỀN THÔNG", val: 95 },
        { label: "ĐỘ KHOAN NHƯỢNG", val: 2 }
      ]
    },
    tieuthat: {
      avatarUrl: "",
      gender: "Nam",
      age: "~19",
      species: "Thú nhân (hoặc Người / Thú Cáo) — nhập vào mèo/thú gầy trơ xương trong lore",
      heightCm: 168,
      weightKg: 51,
      build: "Gầy trơ xương • Băng gạc quấn người",
      heartRate: "126 BPM",
      pressure: "102/68",
      bodyTemp: "36.9 °C",
      soulSat: "82.4%",
      bars: [
        { label: "TAI NẠN VẬT LÝ VÔ TÌNH", val: 99 },
        { label: "ĐỘ SÙNG BÁI KÝ CHỦ", val: 97 },
        { label: "PHÁ MÀN KỊCH TRÀ XANH", val: 94 },
        { label: "VẬN MAY BẨM SINH", val: 3 }
      ]
    },
    sd: {
      avatarUrl: "",
      gender: "Nữ (Phi giới tính)",
      age: "???",
      species: "Người",
      heightCm: 178,
      weightKg: 58,
      build: "Thanh mảnh cao ráo • Quý tộc phi giới tính",
      heartRate: "44 BPM",
      pressure: "SOVEREIGN",
      bodyTemp: "33.8 °C",
      soulSat: "100% [SSS]",
      bars: [
        { label: "QUYỀN LỰC KIẾN TẠO", val: 100 },
        { label: "LƯỜI BIẾNG THƯỢNG ĐẲNG", val: 99 },
        { label: "THAO TÚNG 10 KHU VỰC", val: 100 },
        { label: "TÍNH NHÂN ĐẠO", val: 1 }
      ]
    }
  }
};