// js/canvas-bg.js — Đường hầm Dữ liệu AI Nhị phân 0/1 + Điểm Sáng Chân Trời (Theo ảnh concept)

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";

export function initVRCanvas() {
  const canvas = document.getElementById("vr-canvas");
  if (!canvas) return { spawnTouchRipple: () => {} };

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x020612, 0.015);

  const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 180);
  camera.position.set(0, 1.4, 18);

  function getHexColors() {
    const s = getComputedStyle(document.documentElement);
    return {
      primaryStr: s.getPropertyValue("--c-primary").trim() || "#00E5FF",
      secondaryStr: s.getPropertyValue("--c-secondary").trim() || "#5EA8FF",
      primary: new THREE.Color(s.getPropertyValue("--c-primary").trim() || "#00E5FF"),
      secondary: new THREE.Color(s.getPropertyValue("--c-secondary").trim() || "#5EA8FF"),
      voidBg: new THREE.Color(s.getPropertyValue("--bg-void").trim() || "#020612")
    };
  }

  let colors = getHexColors();
  scene.fog.color.copy(colors.voidBg);

  // TẠO TEXTURE DẢI SỐ NHỊ PHÂN 0 / 1 PHÁT SÁNG SẮC NÉT
  function makeBinaryStreamTexture(colorHex, seed = 1) {
    const c = document.createElement("canvas");
    c.width = 128;
    c.height = 512;
    const ctx = c.getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, "transparent");
    grad.addColorStop(0.18, colorHex);
    grad.addColorStop(0.5, "#ffffff");
    grad.addColorStop(0.82, colorHex);
    grad.addColorStop(1, "transparent");

    ctx.font = "bold 36px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.shadowColor = colorHex;
    ctx.shadowBlur = 16;
    ctx.fillStyle = grad;

    for (let y = 36; y < 490; y += 44) {
      const bit = ((Math.sin(y * 1.37 + seed * 7.1) + 1) * 0.5) > 0.48 ? "1" : "0";
      ctx.globalAlpha = 0.45 + 0.55 * Math.abs(Math.sin(y * 0.2 + seed));
      ctx.fillText(bit, 64, y);
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  }

  // TẠO TEXTURE HÀO QUANG ĐIỂM CHÂN TRỜI
  function makeHorizonFlareTexture(colorHex) {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 512;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(256, 256, 8, 256, 256, 250);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.16, colorHex);
    g.addColorStop(0.45, "rgba(0, 140, 255, 0.22)");
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 512, 512);
    return new THREE.CanvasTexture(c);
  }

  const binTex1 = makeBinaryStreamTexture(colors.primaryStr, 1);
  const binTex2 = makeBinaryStreamTexture(colors.secondaryStr, 2);
  const flareTex = makeHorizonFlareTexture(colors.primaryStr);

  // 1. ĐIỂM KỲ DỊ ÁNH SÁNG CHÂN TRỜI (SINGULARITY FLARE)
  const flareMat = new THREE.SpriteMaterial({
    map: flareTex,
    color: 0xffffff,
    transparent: true,
    opacity: 0.95,
    blending: THREE.AdditiveBlending
  });
  const horizonFlare = new THREE.Sprite(flareMat);
  horizonFlare.position.set(0, -1.6, -54);
  horizonFlare.scale.set(42, 32, 1);
  scene.add(horizonFlare);

  // CÁC TIA SÁNG XUYÊN TÂM TỎA RA TỪ CHÂN TRỜI
  const rayMat = new THREE.MeshBasicMaterial({
    color: colors.primary,
    transparent: true,
    opacity: 0.12,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });
  const rayPlanes = [];
  for (let i = 0; i < 6; i++) {
    const ray = new THREE.Mesh(new THREE.PlaneGeometry(58, 0.55), rayMat);
    ray.position.set(0, -1.6, -53.5);
    ray.rotation.z = (i / 6) * Math.PI;
    scene.add(ray);
    rayPlanes.push(ray);
  }

  // 2. MẶT SÀN DỮ LIỆU PHỐI CẢNH LAO VỀ PHÍA TRƯỚC
  const floorGrid = new THREE.GridHelper(180, 72, colors.primary, colors.primary);
  floorGrid.position.y = -7.2;
  floorGrid.material.transparent = true;
  floorGrid.material.opacity = 0.26;
  scene.add(floorGrid);

  // CÁC DẢI TIA SÁNG CHẠY DỌC MẶT SÀN HƯỚNG TỚI CHÂN TRỜI
  const trackLines = [];
  for (let i = -8; i <= 8; i++) {
    if (i === 0) continue;
    const pts = [new THREE.Vector3(i * 3.8, -7.15, 22), new THREE.Vector3(i * 0.45, -2.0, -54)];
    const mat = new THREE.LineBasicMaterial({
      color: i % 2 === 0 ? colors.primary : colors.secondary,
      transparent: true,
      opacity: 0.28,
      blending: THREE.AdditiveBlending
    });
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat);
    l.userData = { isSec: i % 2 !== 0 };
    scene.add(l);
    trackLines.push(l);
  }

  // 3. CÁC CỘT THÁC SỐ 0/1 DỌC HAI BÊN HÀNH LANG VŨ TRỤ
  const rainPillars = [];
  const pillarGeo = new THREE.PlaneGeometry(1.35, 16);
  for (let i = 0; i < 38; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const x = side * (3.6 + Math.random() * 24);
    const y = (Math.random() - 0.15) * 10;
    const z = -52 + Math.random() * 62;
    const useSec = i % 3 === 0;
    const mat = new THREE.MeshBasicMaterial({
      map: useSec ? binTex2 : binTex1,
      transparent: true,
      opacity: 0.35 + Math.random() * 0.45,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(pillarGeo, mat);
    mesh.position.set(x, y, z);
    mesh.userData = {
      speedZ: 0.08 + Math.random() * 0.12,
      speedScroll: 0.004 + Math.random() * 0.008,
      baseX: x
    };
    scene.add(mesh);
    rainPillars.push(mesh);
  }

  // 4. BỤI HẠT NĂNG LƯỢNG CHÂN TRỜI
  const starCount = 950;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    starPositions[i * 3] = (Math.random() - 0.5) * 90;
    starPositions[i * 3 + 1] = -7.0 + Math.random() * 34;
    starPositions[i * 3 + 2] = -60 + Math.random() * 75;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
  const starMat = new THREE.PointsMaterial({
    color: colors.primary,
    size: 0.16,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending
  });
  scene.add(new THREE.Points(starGeo, starMat));

  // 5. SÓNG NỔ HOLOGRAM KHI CHẠM
  const shockwaves = [];
  function spawnTouchRipple(screenX, screenY) {
    const ndcX = (screenX / window.innerWidth) * 2 - 1;
    const ndcY = -(screenY / window.innerHeight) * 2 + 1;
    const vec = new THREE.Vector3(ndcX, ndcY, 0.5).unproject(camera);
    const dir = vec.sub(camera.position).normalize();
    const pos = camera.position.clone().add(dir.multiplyScalar(14));

    const ringMat = new THREE.MeshBasicMaterial({
      color: colors.secondary,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.27, 36), ringMat);
    ring.position.copy(pos);
    ring.lookAt(camera.position);
    scene.add(ring);
    shockwaves.push({ mesh: ring, mat: ringMat, scale: 1 });
  }

  let targetCamX = 0, targetCamY = 1.4;
  window.addEventListener("pointermove", (e) => {
    targetCamX = (e.clientX / window.innerWidth - 0.5) * 4.5;
    targetCamY = 1.4 - (e.clientY / window.innerHeight - 0.5) * 2.4;
  });

  const observer = new MutationObserver(() => {
    colors = getHexColors();
    scene.fog.color.copy(colors.voidBg);
    floorGrid.material.color.copy(colors.primary);
    rayMat.color.copy(colors.primary);
    starMat.color.copy(colors.primary);
    trackLines.forEach((l) => l.material.color.copy(l.userData.isSec ? colors.secondary : colors.primary));
    binTex1.image = makeBinaryStreamTexture(colors.primaryStr, 1).image;
    binTex1.needsUpdate = true;
    binTex2.image = makeBinaryStreamTexture(colors.secondaryStr, 2).image;
    binTex2.needsUpdate = true;
    flareTex.image = makeHorizonFlareTexture(colors.primaryStr).image;
    flareTex.needsUpdate = true;
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  let time = 0;
  function animate() {
    requestAnimationFrame(animate);
    time += 0.025;

    camera.position.x += (targetCamX - camera.position.x) * 0.055;
    camera.position.y += (targetCamY - camera.position.y) * 0.055;
    camera.lookAt(0, -1.2, -54);

    floorGrid.position.z = (time * 3.5) % 2.5;
    binTex1.offset.y -= 0.004;
    binTex2.offset.y -= 0.0065;

    const pulse = 1 + Math.sin(time * 2.2) * 0.08;
    horizonFlare.scale.set(42 * pulse, 32 * pulse, 1);

    rayPlanes.forEach((r, idx) => {
      r.rotation.z += (idx % 2 === 0 ? 0.0015 : -0.0015);
    });

    rainPillars.forEach((p) => {
      p.position.z += p.userData.speedZ;
      if (p.position.z > 14) p.position.z = -52;
    });

    const sArr = starGeo.attributes.position.array;
    for (let i = 0; i < starCount; i++) {
      sArr[i * 3 + 2] += 0.14;
      if (sArr[i * 3 + 2] > 16) sArr[i * 3 + 2] = -60;
    }
    starGeo.attributes.position.needsUpdate = true;

    for (let i = shockwaves.length - 1; i >= 0; i--) {
      const sw = shockwaves[i];
      sw.scale += 0.38;
      sw.mesh.scale.setScalar(sw.scale);
      sw.mat.opacity -= 0.032;
      if (sw.mat.opacity <= 0) {
        scene.remove(sw.mesh);
        sw.mesh.geometry.dispose();
        sw.mat.dispose();
        shockwaves.splice(i, 1);
      }
    }

    renderer.render(scene, camera);
  }
  animate();

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { spawnTouchRipple };
}