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

  // 2. LINK NHẠC CHO RADIO (Dán link .mp3 / audio trực tiếp vào url, để "" sẽ phát nhạc AI tích hợp)
  musicPlaylist: [
    { title: "CH.01 // VOID DRONE", url: "" },
    { title: "CH.02 // CYBER PULSE", url: "" },
    { title: "CH.03 // TINH THỂ Sd.", url: "" }
  ],

  // 3. CÀI ĐẶT HIỆU ỨNG MẶC ĐỊNH CỦA WEB
  effects: {
    scanlines: true,  // Đường quét màn hình hologram
    parallax3D: true, // Nghiêng 3D theo chuột
    sfx: true         // Âm thanh chạm màn hình
  }
};