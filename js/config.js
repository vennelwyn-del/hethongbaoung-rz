// js/config.js — FILE CẤU HÌNH DÀNH RIÊNG CHO CHỦ WEB (USER KHÔNG THẤY)

export const SITE_CONFIG = {
  // 1. DÁN LINK HOẶC ĐƯỜNG DẪN ẢNH NỀN VÀO ĐÂY
  backgroundImage: {
    defaultUrl: "./assets/assets/OPW/Hethongbaoung/canvas_bg.png",
    byTheme: {
      "orbital-cyan": "",
      "cyber-violet": "",
      "acid": "",
      "crimson-karma": ""
    },
    opacity: 0.6 // Tăng lên 0.55 - 0.75 để ảnh nền hiện rõ nét dưới lớp lưới 3D
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

  // 4. SETTING ẢNH & CHỈ SỐ HÌNH THỂ CHO TỪNG NPC CỐ ĐỊNH (Dán link ảnh vào avatarUrl)
  npcProfiles: {
    sys00: {
      avatarUrl: "",
      gender: "AI / Vô tính",
      age: "∞",
      heightCm: 175,
      weightKg: 0,
      build: "Lõi Máy Chủ Kiểm Toán Lượng Tử",
      heartRate: "00 BPM",
      pressure: "80% RAKE",
      bodyTemp: "18.4 °C",
      soulSat: "100%",
      bars: [
        { label: "ĐỘ BÓC LỘT TƯ BẢN", val: 99 },
        { label: "LÃNH CẢM HÀNH CHÍNH", val: 100 },
        { label: "TỐC ĐỘ IN HÓA ĐƠN", val: 96 },
        { label: "LÒNG TRẮC ẨN", val: 0 }
      ]
    },
    tavocuu: {
      avatarUrl: "",
      gender: "Nam",
      age: "~30",
      heightCm: 188,
      weightKg: 76,
      build: "Cao gầy rắn rỏi • Vai rộng phẳng phiu",
      heartRate: "54 BPM",
      pressure: "110/70",
      bodyTemp: "35.6 °C",
      soulSat: "99%",
      bars: [
        { label: "UY ÁP KIỂM TOÁN", val: 95 },
        { label: "ĐỘ LẠNH TÂM LÝ", val: 98 },
        { label: "KHÁNG CẨU HUYẾT", val: 100 },
        { label: "NGUY HIỂM PHÁP LÝ", val: 94 }
      ]
    },
    lucnha: {
      avatarUrl: "",
      gender: "Nam",
      age: "27",
      heightCm: 185,
      weightKg: 79,
      build: "Săn chắc cơ bắp • Nhiều sẹo dao",
      heartRate: "76 BPM",
      pressure: "124/78",
      bodyTemp: "37.1 °C",
      soulSat: "94%",
      bars: [
        { label: "THỰC CHIẾN ĐƯỜNG PHỐ", val: 92 },
        { label: "LÁCH LUẬT CHỢ ĐEN", val: 97 },
        { label: "MÁU LẠNH THƯƠNG TRƯỜNG", val: 88 },
        { label: "ĐỘ BẤT CẦN ĐỜI", val: 95 }
      ]
    },
    nguhongdiep: {
      avatarUrl: "",
      gender: "Nữ",
      age: "28",
      heightCm: 171,
      weightKg: 53,
      build: "Đồng hồ cát quyến rũ • Sắc sảo",
      heartRate: "66 BPM",
      pressure: "114/72",
      bodyTemp: "36.5 °C",
      soulSat: "97%",
      bars: [
        { label: "MỊ LỰC NGUY HIỂM", val: 98 },
        { label: "ĐỘ CAY ĐỘC NGÔN TỪ", val: 96 },
        { label: "THAO TÚNG DƯ LUẬN", val: 95 },
        { label: "THÙ GHÉT TRA NAM", val: 100 }
      ]
    },
    tieuthat: {
      avatarUrl: "",
      gender: "Nam",
      age: "~19",
      heightCm: 168,
      weightKg: 51,
      build: "Gầy mảnh khảnh • Quấn băng gạc",
      heartRate: "128 BPM",
      pressure: "102/68",
      bodyTemp: "36.8 °C",
      soulSat: "82%",
      bars: [
        { label: "TẦN SUẤT TAI NẠN VẬT LÝ", val: 99 },
        { label: "ĐỘ TRUNG THÀNH NGÂY THƠ", val: 96 },
        { label: "KHẢ NĂNG BÓC PHỐT NHẦM", val: 94 },
        { label: "CHỈ SỐ MAY MẮN", val: 3 }
      ]
    }
  }
};