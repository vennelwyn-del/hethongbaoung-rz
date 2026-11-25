// js/config.js — FILE CẤU HÌNH DÀNH RIÊNG CHO CHỦ WEB (ĐÃ SỬA LINK 3D CHUẨN + FALLBACK)

export const ANIMAL_PRESETS = {
  stork: {
    label: "Hắc Hạc Đưa Tin (Stork)",
    type: "bird",
    url: "https://threejs.org/examples/models/gltf/Stork.glb",
    fallback: "https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/models/gltf/Stork.glb"
  },
  horse: {
    label: "Chiến Mã Phán Quyết (Horse)",
    type: "quad",
    url: "https://threejs.org/examples/models/gltf/Horse.glb",
    fallback: "https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/models/gltf/Horse.glb"
  },
  fox: {
    label: "Xích Hồ Ly Chợ Đen (Fox)",
    type: "quad",
    url: "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Fox/glTF-Binary/Fox.glb",
    fallback: "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@main/Models/Fox/glTF-Binary/Fox.glb"
  },
  flamingo: {
    label: "Hồng Hạc Huyết Đỏ (Flamingo)",
    type: "bird",
    url: "https://threejs.org/examples/models/gltf/Flamingo.glb",
    fallback: "https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/models/gltf/Flamingo.glb"
  },
  parrot: {
    label: "Vẹt Báo Tin Hậu Đậu (Parrot)",
    type: "bird",
    url: "https://threejs.org/examples/models/gltf/Parrot.glb",
    fallback: "https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/models/gltf/Parrot.glb"
  },
  shark: {
    label: "Bạch Sa Vũ Trụ (Shark)",
    type: "swim",
    url: "https://rawcdn.githack.com/BabylonJS/MeshesLibrary/55f475726670be2e7e4017b5f88c5762a90508c2/shark.glb",
    fallback: "https://raw.githubusercontent.com/BabylonJS/MeshesLibrary/master/shark.glb"
  }
};

export const SITE_CONFIG = {
  backgroundImage: {
    defaultUrl: "./assets/assets/OPW/Hethongbaoung/canvas_bg.png",
    byTheme: {
      "orbital-cyan": "",
      "cyber-violet": "",
      "acid": "",
      "crimson-karma": ""
    },
    opacity: 0.55
  },

  musicPlaylist: [
    { title: "CH.01 // VOID DRONE", url: "" },
    { title: "CH.02 // CYBER PULSE", url: "" },
    { title: "CH.03 // TINH THỂ Sd.", url: "" }
  ],

  effects: {
    scanlines: true,
    parallax3D: true,
    sfx: true
  },

  npcProfiles: {
    sys00: {
      avatarUrl: "",
      animalKey: "stork",
      modelUrl: "",
      animalTitle: "HẮC HẠC KIỂM TOÁN",
      wingspanOrLen: "215 CM",
      weightKg: "4.8 KG",
      heartRate: "00 BPM",
      pressure: "80% PHÍ",
      bodyTemp: "18.4 °C",
      soulSat: "100%",
      bars: [
        { label: "TƯ BẢN BÓC LỘT", val: 100 },
        { label: "HÀNH CHÍNH HÓA BI KỊCH", val: 98 },
        { label: "TỐC ĐỘ IN HÓA ĐƠN", val: 99 },
        { label: "LÒNG TRẮC ẨN MIỄN PHÍ", val: 0 }
      ]
    },
    tavocuu: {
      avatarUrl: "",
      animalKey: "horse",
      modelUrl: "",
      animalTitle: "CHIẾN MÃ PHÁN QUYẾT",
      wingspanOrLen: "242 CM",
      weightKg: "510 KG",
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
      animalKey: "fox",
      modelUrl: "",
      animalTitle: "XÍCH HỒ LY CHỢ ĐEN",
      wingspanOrLen: "112 CM",
      weightKg: "8.4 KG",
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
      animalKey: "flamingo",
      modelUrl: "",
      animalTitle: "HỒNG HẠC HUYẾT ĐỎ",
      wingspanOrLen: "165 CM",
      weightKg: "3.9 KG",
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
      animalKey: "parrot",
      modelUrl: "",
      animalTitle: "VẸT BÁO TIN HẬU ĐẬU",
      wingspanOrLen: "68 CM",
      weightKg: "1.2 KG",
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
      animalKey: "shark",
      modelUrl: "",
      animalTitle: "BẠCH SA TỐI THƯỢNG",
      wingspanOrLen: "460 CM",
      weightKg: "890 KG",
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