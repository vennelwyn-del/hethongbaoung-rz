// js/config.js — FILE CẤU HÌNH DÀNH RIÊNG CHO CHỦ WEB (USER KHÔNG THẤY)

export const SITE_CONFIG = {
  // 1. LINK ẢNH BACKGROUND (Dán link ảnh của bạn vào đây, để "" nếu dùng nền 3D thuần)
  backgroundImage: {
    defaultUrl: "", // Link ảnh nền chung (vd: "https://.../bg.jpg")
    byTheme: {
      "cyber-violet": "", // Hoặc dán riêng ảnh cho Template Tím-Xanh
      "acid": ""          // Hoặc dán riêng ảnh cho Template Xanh-Chanh
    },
    opacity: 0.35 // Độ rõ của ảnh nền (0.1 -> 1.0) để vẫn thấy sóng điện & khối 3D phía trên
  },

  // 2. LINK NHẠC CHO RADIO (Dán link .mp3 / audio trực tiếp vào url, để "" sẽ phát nhạc AI tích hợp)
  musicPlaylist: [
    { title: "CH.01 // VOID DRONE", url: "" },
    { title: "CH.02 // CYBER PULSE", url: "" },
    { title: "CH.03 // TINH THỂ Sd.", url: "" }
  ],

  // 3. CÀI ĐẶT HIỆU ỨNG MẶC ĐỊNH CỦA WEB
  effects: {
    scanlines: true,   // Đường quét màn hình hologram
    parallax3D: true,  // Nghiêng 3D theo chuột
    sfx: true          // Âm thanh chạm màn hình
  }
};