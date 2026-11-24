// js/npc-morph-3d.js — Mô hình Giải phẫu Người 3D điêu khắc mượt (Catmull-Rom + Parallel Transport + GLSL Holo)

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";
import { createHoloMaterial } from "./holo-shader.js";

export function initNpcMorph3D({ canvasId, onProjectZones, onSelectZone }) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return { setSubject: () => {}, setActiveZone: () => {}, resize: () => {} };

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 60);
  camera.position.set(0, 0.1, 6.2);
  camera.lookAt(0, -0.05, 0);

  function getPalette() {
    const s = getComputedStyle(document.documentElement);
    return {
      primary: new THREE.Color(s.getPropertyValue("--c-primary").trim() || "#00E5FF"),
      secondary: new THREE.Color(s.getPropertyValue("--c-secondary").trim() || "#5EA8FF")
    };
  }
  let colors = getPalette();

  // BỆ ĐỠ QUỸ ĐẠO TINH TẾ BÊN DƯỚI CHÂN MÔ HÌNH
  const floorGroup = new THREE.Group();
  floorGroup.position.y = -1.68;
  scene.add(floorGroup);

  const ringOuter = new THREE.Mesh(
    new THREE.RingGeometry(1.12, 1.15, 72),
    new THREE.MeshBasicMaterial({ color: colors.primary, side: THREE.DoubleSide, transparent: true, opacity: 0.55 })
  );
  ringOuter.rotation.x = Math.PI / 2;
  floorGroup.add(ringOuter);

  const ringInner = new THREE.Mesh(
    new THREE.RingGeometry(0.68, 0.7, 56),
    new THREE.MeshBasicMaterial({ color: colors.secondary, side: THREE.DoubleSide, transparent: true, opacity: 0.5 })
  );
  ringInner.rotation.x = Math.PI / 2;
  floorGroup.add(ringInner);

  const floorGrid = new THREE.GridHelper(4.8, 16, colors.primary, colors.primary);
  floorGrid.material.transparent = true;
  floorGrid.material.opacity = 0.16;
  floorGroup.add(floorGrid);

  // TIA QUÉT LASER SIÊU MẢNH CHẠY DỌC CƠ THỂ
  const scanHalo = new THREE.Mesh(
    new THREE.TorusGeometry(0.78, 0.009, 8, 64),
    new THREE.MeshBasicMaterial({ color: colors.secondary, transparent: true, opacity: 0.65 })
  );
  scanHalo.rotation.x = Math.PI / 2;
  scene.add(scanHalo);

  const bodyGroup = new THREE.Group();
  scene.add(bodyGroup);

  const zoneAnchors = {};
  const hotspotMeshes = [];
  let coreHeartMesh = null;
  let activeZone = "head";
  let pulseSpeed = 0.055;

  // HÀM TẠO LƯỚI ĐIÊU KHẮC MƯỢT TỪ CÁC LÁT CẮT GIẢI PHẪU (LOFTED ANATOMY)
  function buildSmoothLoft(rings, radialSegs, contourStride = 4) {
    const numRings = rings.length;
    const cols = radialSegs + 1;
    const positions = [];
    const indices = [];

    for (let i = 0; i < numRings; i++) {
      const ring = rings[i];
      for (let j = 0; j <= radialSegs; j++) {
        const pt = ring[j % radialSegs];
        positions.push(pt.x, pt.y, pt.z);
      }
    }

    for (let i = 0; i < numRings - 1; i++) {
      for (let j = 0; j < radialSegs; j++) {
        const a = i * cols + j;
        const b = a + 1;
        const c = (i + 1) * cols + j;
        const d = c + 1;
        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    // Khử đường nối seam ở cạnh j=0 và j=radialSegs để ánh sáng Fresnel mịn tuyệt đối 360 độ
    const normAttr = geo.attributes.normal;
    for (let i = 0; i < numRings; i++) {
      const idx0 = i * cols;
      const idxLast = i * cols + radialSegs;
      const nx = (normAttr.getX(idx0) + normAttr.getX(idxLast)) * 0.5;
      const ny = (normAttr.getY(idx0) + normAttr.getY(idxLast)) * 0.5;
      const nz = (normAttr.getZ(idx0) + normAttr.getZ(idxLast)) * 0.5;
      const len = Math.hypot(nx, ny, nz) || 1;
      normAttr.setXYZ(idx0, nx / len, ny / len, nz / len);
      normAttr.setXYZ(idxLast, nx / len, ny / len, nz / len);
    }
    normAttr.needsUpdate = true;

    const group = new THREE.Group();
    const holoMat = createHoloMaterial(`#${colors.primary.getHexString()}`, 0.44);
    const mesh = new THREE.Mesh(geo, holoMat);
    group.add(mesh);

    // Đường đồng mức laser tinh tế ôm sát đường cong cơ thể
    const contourMat = new THREE.LineBasicMaterial({ color: colors.primary, transparent: true, opacity: 0.24 });
    for (let i = 1; i < numRings - 1; i += contourStride) {
      const loopGeo = new THREE.BufferGeometry().setFromPoints(rings[i]);
      group.add(new THREE.LineLoop(loopGeo, contourMat));
    }

    return group;
  }

  // NỘI SUY MƯỢT ĐƯỜNG CONG LÁT CẮT (SPLINE)
  function sampleProfile(stations, numSamples) {
    const out = [];
    for (let s = 0; s < numSamples; s++) {
      const t = (s / (numSamples - 1)) * (stations.length - 1);
      const i0 = Math.max(0, Math.floor(t) - 1);
      const i1 = Math.floor(t);
      const i2 = Math.min(stations.length - 1, i1 + 1);
      const i3 = Math.min(stations.length - 1, i1 + 2);
      const u = t - i1;

      const catmull = (key) => {
        const p0 = stations[i0][key] ?? 0;
        const p1 = stations[i1][key] ?? 0;
        const p2 = stations[i2][key] ?? 0;
        const p3 = stations[i3][key] ?? 0;
        return 0.5 * (
          2 * p1 +
          (-p0 + p2) * u +
          (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u +
          (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u
        );
      };

      out.push({
        y: catmull("y"),
        cz: catmull("cz"),
        rx: Math.max(0.003, catmull("rx")),
        rzF: Math.max(0.003, catmull("rzF")),
        rzB: Math.max(0.003, catmull("rzB")),
        bust: Math.max(0, catmull("bust")),
        pec: Math.max(0, catmull("pec")),
        glute: Math.max(0, catmull("glute")),
        jaw: Math.max(0, catmull("jaw"))
      });
    }
    return out;
  }

  // DỰNG CHÂN / TAY CONG MƯỢT BẰNG PARALLEL TRANSPORT FRAME
  function buildSculptedLimb(ctrlPoints, radiusFn, lengthSegs, radialSegs, contourStride) {
    const curve = new THREE.CatmullRomCurve3(ctrlPoints);
    const rings = [];

    let prevTan = curve.getTangent(0).normalize();
    let forward = new THREE.Vector3(0, 0, 1);
    forward.addScaledVector(prevTan, -forward.dot(prevTan)).normalize();
    let right = new THREE.Vector3().crossVectors(forward, prevTan).normalize();

    for (let i = 0; i <= lengthSegs; i++) {
      const u = i / lengthSegs;
      const center = curve.getPoint(u);
      const tan = curve.getTangent(u).normalize();

      if (i > 0) {
        const axis = new THREE.Vector3().crossVectors(prevTan, tan);
        const len = axis.length();
        if (len > 1e-5) {
          const angle = Math.acos(Math.max(-1, Math.min(1, prevTan.dot(tan))));
          axis.divideScalar(len);
          forward.applyAxisAngle(axis, angle).normalize();
        }
        right.crossVectors(forward, tan).normalize();
        forward.crossVectors(tan, right).normalize();
        prevTan.copy(tan);
      }

      const { rx, rz, offsetF = 0 } = radiusFn(u);
      const ring = [];
      for (let j = 0; j < radialSegs; j++) {
        const th = (j / radialSegs) * Math.PI * 2;
        const lx = Math.sin(th) * rx;
        const lz = Math.cos(th) * rz + offsetF;
        ring.push(
          center.clone()
            .addScaledVector(right, lx)
            .addScaledVector(forward, lz)
        );
      }
      rings.push(ring);
    }

    return buildSmoothLoft(rings, radialSegs, contourStride);
  }

  function clearGroup(grp) {
    while (grp.children.length > 0) {
      const ch = grp.children[0];
      clearGroup(ch);
      if (ch.geometry) ch.geometry.dispose();
      if (ch.material && !Array.isArray(ch.material)) ch.material.dispose();
      grp.remove(ch);
    }
  }

  function buildBodyMesh(npc, stats) {
    clearGroup(bodyGroup);
    hotspotMeshes.length = 0;

    const gender = stats.gender || "Nam";
    const isFemale = gender.includes("Nữ");
    const isAI = npc.id === "sys00" || gender.includes("AI");
    const h = Math.max(140, Math.min(220, Number(stats.heightCm) || 175));
    const w = Number(stats.weightKg);
    const bmi = w > 0 ? w / Math.pow(h / 100, 2) : 20.5;

    const scaleY = Math.max(0.86, Math.min(1.12, h / 178));
    const wF = Math.max(0.82, Math.min(1.26, bmi / 21));

    const rig = new THREE.Group();
    bodyGroup.add(rig);

    const radialSegs = 40;

    // 1. ĐẦU + CỔ ĐIÊU KHẮC MƯỢT (GIỐNG ĐẦU MANNEQUIN ẢNH MẪU)
    const headBase = isFemale ? 0.92 : 0.93;
    const headStations = [
      { y: 0.90, cz: 0.00, rx: 0.13 * wF, rzF: 0.11, rzB: 0.11 },
      { y: 1.00, cz: 0.01, rx: (isFemale ? 0.082 : 0.098) * wF, rzF: 0.088, rzB: 0.086 },
      { y: 1.13, cz: 0.02, rx: (isFemale ? 0.078 : 0.094) * wF, rzF: 0.088, rzB: 0.084 },
      { y: 1.18, cz: 0.04, rx: (isFemale ? 0.105 : 0.122) * wF, rzF: 0.148, rzB: 0.098, jaw: 1.0 },
      { y: 1.28, cz: 0.02, rx: (isFemale ? 0.126 : 0.142) * wF, rzF: 0.168, rzB: 0.142, jaw: 0.5 },
      { y: 1.42, cz: 0.00, rx: (isFemale ? 0.142 : 0.156) * wF, rzF: 0.175, rzB: 0.172 },
      { y: 1.56, cz: -0.01, rx: (isFemale ? 0.132 : 0.144) * wF, rzF: 0.162, rzB: 0.168 },
      { y: 1.66, cz: -0.01, rx: 0.075, rzF: 0.088, rzB: 0.092 },
      { y: 1.69, cz: -0.01, rx: 0.004, rzF: 0.004, rzB: 0.004 }
    ];
    const headSamples = sampleProfile(headStations, 26);
    const headRings = headSamples.map((st) => {
      const ring = [];
      for (let j = 0; j < radialSegs; j++) {
        const th = (j / radialSegs) * Math.PI * 2;
        const c = Math.cos(th), s = Math.sin(th);
        const rz = c >= 0 ? st.rzF : st.rzB;
        const chinPinch = st.jaw * (c > 0.35 ? 0.024 * Math.pow(c, 2) : 0);
        ring.push(new THREE.Vector3(s * st.rx * (1 - st.jaw * 0.12 * Math.max(0, c)), st.y * scaleY, st.cz + c * rz + chinPinch));
      }
      return ring;
    });
    rig.add(buildSmoothLoft(headRings, radialSegs, 4));

    // Vòng quét não siêu mảnh
    const brainRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.24, 0.0045, 6, 48),
      new THREE.MeshBasicMaterial({ color: colors.secondary, transparent: true, opacity: 0.62 })
    );
    brainRing.rotation.x = Math.PI / 2;
    brainRing.position.y = 1.45 * scaleY;
    rig.add(brainRing);

    // 2. THÂN TRÊN + EO + HÔNG ĐIÊU KHẮC GIẢI PHẪU
    const shX = (isFemale ? 0.325 : 0.395) * wF;
    const torsoStations = [
      { y: 0.02, cz: 0.00, rx: 0.09 * wF, rzF: 0.09, rzB: 0.09 },
      { y: 0.12, cz: -0.01, rx: (isFemale ? 0.335 : 0.285) * wF, rzF: 0.165, rzB: isFemale ? 0.21 : 0.185, glute: isFemale ? 0.055 : 0.032 },
      { y: 0.24, cz: 0.00, rx: (isFemale ? 0.32 : 0.295) * wF, rzF: 0.165, rzB: 0.175, glute: isFemale ? 0.025 : 0.015 },
      { y: 0.40, cz: 0.025, rx: (isFemale ? 0.208 : 0.262) * wF, rzF: 0.145 * wF, rzB: 0.135 * wF },
      { y: 0.56, cz: 0.015, rx: (isFemale ? 0.238 : 0.302) * wF, rzF: 0.168 * wF, rzB: 0.165 * wF },
      { y: 0.70, cz: 0.01, rx: (isFemale ? 0.285 : 0.365) * wF, rzF: 0.175 * wF, rzB: 0.175 * wF, bust: isFemale ? 0.088 : 0, pec: isFemale ? 0 : 0.048 },
      { y: 0.84, cz: 0.00, rx: shX, rzF: 0.155 * wF, rzB: 0.168 * wF },
      { y: 0.92, cz: 0.00, rx: (isFemale ? 0.18 : 0.22) * wF, rzF: 0.115, rzB: 0.12 },
      { y: headBase + 0.03, cz: 0.00, rx: 0.115 * wF, rzF: 0.105, rzB: 0.105 }
    ];
    const torsoSamples = sampleProfile(torsoStations, 34);
    const torsoRings = torsoSamples.map((st) => {
      const ring = [];
      for (let j = 0; j < radialSegs; j++) {
        const th = (j / radialSegs) * Math.PI * 2;
        const c = Math.cos(th), s = Math.sin(th);
        const rz = c >= 0 ? st.rzF : st.rzB;

        // Điêu khắc đường cong ngực Nữ / cơ ngực Nam / hông lưng
        const bustLobe = st.bust > 0 && c > 0 ? st.bust * Math.pow(Math.sin(Math.abs(th) * 1.45), 1.4) * Math.pow(c, 1.3) : 0;
        const pecLobe = st.pec > 0 && c > 0.2 ? st.pec * Math.pow(c, 0.8) * (1 - 0.28 * Math.exp(-th * th * 28)) : 0;
        const gluteLobe = st.glute > 0 && c < -0.2 ? st.glute * Math.pow(-c, 1.2) * (1 - 0.35 * Math.exp(-Math.pow(Math.abs(th) - Math.PI, 2) * 24)) : 0;

        ring.push(new THREE.Vector3(s * st.rx, st.y * scaleY, st.cz + c * rz + bustLobe + pecLobe - gluteLobe));
      }
      return ring;
    });
    rig.add(buildSmoothLoft(torsoRings, radialSegs, 3));

    // Lõi Tim & Trục Cột Sống phát sáng tinh tế (như Ảnh 2 & 3)
    coreHeartMesh = new THREE.Mesh(
      isAI ? new THREE.OctahedronGeometry(0.11, 0) : new THREE.IcosahedronGeometry(0.075, 1),
      new THREE.MeshBasicMaterial({ color: colors.secondary, transparent: true, opacity: 0.92 })
    );
    coreHeartMesh.position.set(isAI ? 0 : 0.045, 0.72 * scaleY, 0.11);
    rig.add(coreHeartMesh);

    const spinePts = Array.from({ length: 12 }, (_, k) => {
      const y = (0.24 + k * 0.06) * scaleY;
      return new THREE.Vector3(0, y, -0.11 + Math.sin(k * 0.45) * 0.02);
    });
    const spineLine = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(spinePts),
      new THREE.LineBasicMaterial({ color: colors.secondary, transparent: true, opacity: 0.58 })
    );
    rig.add(spineLine);

    // 3. HAI TAY ĐIÊU KHẮC CONG MỀM (ĐỂ XUÔI TỰ NHIÊN NHƯ ẢNH MANNEQUIN)
    const armThick = (isFemale ? 0.84 : 1.0) * wF;
    [-1, 1].forEach((side) => {
      const armPts = [
        new THREE.Vector3(side * (shX - 0.05), 0.83 * scaleY, -0.01),
        new THREE.Vector3(side * (shX + 0.09), 0.54 * scaleY, -0.015),
        new THREE.Vector3(side * (shX + 0.13), 0.30 * scaleY, -0.01),
        new THREE.Vector3(side * (shX + 0.17), 0.04 * scaleY, 0.05),
        new THREE.Vector3(side * (shX + 0.175), -0.15 * scaleY, 0.075)
      ];
      const armRadius = (u) => {
        if (u < 0.12) {
          const t = u / 0.12;
          return { rx: (0.09 + 0.012 * Math.sin(t * Math.PI)) * armThick, rz: (0.088 + 0.012 * Math.sin(t * Math.PI)) * armThick };
        }
        if (u < 0.44) {
          const t = (u - 0.12) / 0.32;
          const r = (0.082 - 0.018 * t + 0.01 * Math.sin(t * Math.PI)) * armThick;
          return { rx: r * 0.94, rz: r * 1.04 };
        }
        if (u < 0.80) {
          const t = (u - 0.44) / 0.36;
          const r = (0.068 + 0.012 * Math.sin(t * Math.PI * 0.85) - 0.022 * t) * armThick;
          return { rx: r * 0.9, rz: r * 1.08 };
        }
        // Bàn tay dẹt thanh thoát
        const t = (u - 0.80) / 0.20;
        const taper = Math.max(0.18, 1 - t * 0.82);
        return { rx: 0.026 * armThick * taper, rz: 0.064 * armThick * Math.sqrt(taper) };
      };
      rig.add(buildSculptedLimb(armPts, armRadius, 24, 22, 4));
    });

    // 4. HAI CHÂN ĐIÊU KHẮC MỀM MẠI + BÀN CHÂN ĐỨNG CHUẨN SÀN
    const hipOff = (isFemale ? 0.165 : 0.15) * wF;
    const legThick = (isFemale ? 0.92 : 1.0) * wF;
    [-1, 1].forEach((side) => {
      const legPts = [
        new THREE.Vector3(side * hipOff, 0.10 * scaleY, 0.00),
        new THREE.Vector3(side * (hipOff + 0.008), -0.34 * scaleY, 0.018),
        new THREE.Vector3(side * (hipOff - 0.004), -0.74 * scaleY, 0.022),
        new THREE.Vector3(side * (hipOff - 0.008), -1.08 * scaleY, -0.028),
        new THREE.Vector3(side * (hipOff - 0.01), -1.52 * scaleY, -0.005),
        new THREE.Vector3(side * (hipOff + 0.015), -1.62 * scaleY, 0.165)
      ];
      const legRadius = (u) => {
        if (u < 0.40) {
          const t = u / 0.40;
          const r = (0.145 - 0.056 * t + 0.012 * Math.sin(t * Math.PI)) * legThick;
          return { rx: r * 0.94, rz: r * 1.04 };
        }
        if (u < 0.78) {
          const t = (u - 0.40) / 0.38;
          const calf = Math.sin(Math.pow(t, 0.75) * Math.PI) * 0.026;
          const r = (0.088 + calf - 0.032 * t) * legThick;
          return { rx: r * 0.92, rz: r * 1.08, offsetF: -calf * 0.35 };
        }
        // Cổ chân -> Bàn chân thon dài
        const t = (u - 0.78) / 0.22;
        const taper = Math.max(0.24, 1 - t * 0.76);
        return { rx: 0.058 * legThick * Math.sqrt(taper), rz: 0.042 * legThick * taper };
      };
      rig.add(buildSculptedLimb(legPts, legRadius, 30, 24, 4));
    });

    // Điểm neo 3D chỉ điểm chuẩn xác trên giải phẫu
    zoneAnchors.head = new THREE.Vector3(0, 1.44 * scaleY, 0.18);
    zoneAnchors.chest = new THREE.Vector3(0, 0.72 * scaleY, 0.21);
    zoneAnchors.hand = new THREE.Vector3(-(shX + 0.17), 0.02 * scaleY, 0.08);
    zoneAnchors.stance = new THREE.Vector3(hipOff, -0.68 * scaleY, 0.12);

    Object.entries(zoneAnchors).forEach(([zoneKey, localPos]) => {
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.052, 12, 12),
        new THREE.MeshBasicMaterial({ color: colors.secondary, transparent: true, opacity: 0.96 })
      );
      dot.position.copy(localPos);
      dot.userData = { zoneKey };
      bodyGroup.add(dot);
      hotspotMeshes.push(dot);
    });

    const bpmNum = parseInt(stats.heartRate, 10);
    pulseSpeed = Number.isFinite(bpmNum) && bpmNum > 0 ? Math.max(0.03, Math.min(0.15, bpmNum / 950)) : 0.05;
  }

  // XOAY 360 ĐỘ + ZOOM CHUỘT
  let isDragging = false;
  let downX = 0, downY = 0, prevX = 0, prevY = 0, movedDist = 0;
  let rotY = 0.28, rotX = 0.04, velY = 0, targetCamZ = 6.2;
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function updatePointer(e) {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  canvas.addEventListener("pointerdown", (e) => {
    isDragging = true;
    downX = prevX = e.clientX;
    downY = prevY = e.clientY;
    movedDist = 0;
    velY = 0;
    canvas.setPointerCapture?.(e.pointerId);
  });

  canvas.addEventListener("pointermove", (e) => {
    if (isDragging) {
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      movedDist += Math.hypot(e.clientX - downX, e.clientY - downY);
      velY = dx * 0.012;
      rotY += velY;
      rotX = Math.max(-0.42, Math.min(0.42, rotX + dy * 0.007));
      prevX = e.clientX;
      prevY = e.clientY;
    }
    updatePointer(e);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(hotspotMeshes, false);
    canvas.style.cursor = hits.length > 0 ? "pointer" : isDragging ? "grabbing" : "grab";
  });

  canvas.addEventListener("pointerup", (e) => {
    if (!isDragging) return;
    isDragging = false;
    if (movedDist < 7) {
      updatePointer(e);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(hotspotMeshes, false);
      if (hits.length > 0) {
        activeZone = hits[0].object.userData.zoneKey;
        onSelectZone?.(activeZone);
      }
    }
  });

  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    targetCamZ = Math.max(4.0, Math.min(8.6, targetCamZ + e.deltaY * 0.003));
  }, { passive: false });

  function resize() {
    const parent = canvas.parentElement;
    if (!parent) return;
    const w = parent.clientWidth || 340;
    const h = parent.clientHeight || 420;
    if (w < 10 || h < 10) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  if (window.ResizeObserver && canvas.parentElement) {
    new ResizeObserver(() => resize()).observe(canvas.parentElement);
  }

  const observer = new MutationObserver(() => {
    colors = getPalette();
    ringOuter.material.color.copy(colors.primary);
    ringInner.material.color.copy(colors.secondary);
    floorGrid.material.color.copy(colors.primary);
    scanHalo.material.color.copy(colors.secondary);
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  const projVec = new THREE.Vector3();
  let time = 0;

  function animate() {
    requestAnimationFrame(animate);
    time += 0.025;

    if (!isDragging) {
      rotY += velY + 0.0055;
      velY *= 0.92;
    }
    camera.position.z += (targetCamZ - camera.position.z) * 0.12;
    bodyGroup.rotation.y = rotY;
    bodyGroup.rotation.x = rotX;
    floorGroup.rotation.y = -time * 0.14;
    scanHalo.position.y = Math.sin(time * 0.95) * 1.55;

    if (coreHeartMesh) {
      const beat = 1 + Math.sin(time * 18 * pulseSpeed) * 0.18;
      coreHeartMesh.scale.setScalar(beat);
    }

    bodyGroup.traverse((obj) => {
      if (obj.material?.uniforms?.uTime) {
        obj.material.uniforms.uTime.value = time;
        obj.material.uniforms.uColor.value.copy(colors.primary);
      } else if (obj.isLineLoop || obj.isLine) {
        obj.material.color.copy(colors.primary);
      }
    });

    hotspotMeshes.forEach((dot) => {
      const isSel = dot.userData.zoneKey === activeZone;
      dot.material.color.copy(isSel ? colors.secondary : colors.primary);
      dot.scale.setScalar(isSel ? 1.5 + Math.sin(time * 6) * 0.25 : 0.9);
    });

    if (onProjectZones && hotspotMeshes.length > 0 && canvas.clientWidth > 0) {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      const projected = {};
      hotspotMeshes.forEach((dot) => {
        dot.updateWorldMatrix(true, false);
        projVec.set(0, 0, 0).applyMatrix4(dot.matrixWorld).project(camera);
        projected[dot.userData.zoneKey] = {
          x: (projVec.x * 0.5 + 0.5) * w,
          y: (-projVec.y * 0.5 + 0.5) * h
        };
      });
      onProjectZones(projected);
    }

    renderer.render(scene, camera);
  }

  resize();
  animate();

  return {
    setSubject(npc, stats) {
      activeZone = "head";
      rotY = 0.28;
      rotX = 0.04;
      targetCamZ = 6.2;
      buildBodyMesh(npc, stats);
      resize();
    },
    setActiveZone(zoneKey) {
      activeZone = zoneKey;
    },
    resize
  };
}