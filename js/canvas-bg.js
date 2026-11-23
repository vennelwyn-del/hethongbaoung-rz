// js/canvas-bg.js — WebGL 3D thật (Three.js): Khối lập phương 3D, Vòng Gyroscope, Sóng điện & Đường hầm lượng tử

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";

export function initVRCanvas() {
  const canvas = document.getElementById("vr-canvas");
  if (!canvas) return { spawnTouchRipple: () => {} };

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050512, 0.022);

  const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.1, 140);
  camera.position.set(0, 1.2, 16);

  function getHexColors() {
    const s = getComputedStyle(document.documentElement);
    const p = s.getPropertyValue("--c-primary").trim() || "#3BB8F8";
    const sec = s.getPropertyValue("--c-secondary").trim() || "#F787F8";
    const bg = s.getPropertyValue("--bg-void").trim() || "#050512";
    return { primary: new THREE.Color(p), secondary: new THREE.Color(sec), voidBg: new THREE.Color(bg) };
  }

  let colors = getHexColors();
  scene.fog.color.copy(colors.voidBg);

  // 1. SÀN & TRẦN LƯỚI KHÔNG GIAN 3D VÔ TẬN
  const gridBottom = new THREE.GridHelper(120, 48, colors.primary, colors.primary);
  gridBottom.position.y = -7.5;
  gridBottom.material.transparent = true;
  gridBottom.material.opacity = 0.24;
  scene.add(gridBottom);

  const gridTop = new THREE.GridHelper(120, 48, colors.secondary, colors.secondary);
  gridTop.position.y = 9.5;
  gridTop.material.transparent = true;
  gridTop.material.opacity = 0.14;
  scene.add(gridTop);

  // 2. CÁC VÒNG GYROSCOPE HOLOGRAM LỚN XOAY ĐA TRỤC
  const gyroGroup = new THREE.Group();
  const ringSpecs = [
    { r: 8.5, tube: 0.045, col: "primary", rx: 0.4, ry: 0.2 },
    { r: 10.8, tube: 0.035, col: "secondary", rx: -0.6, ry: 0.5 },
    { r: 13.5, tube: 0.03, col: "primary", rx: 1.1, ry: -0.3 }
  ];
  const gyroMeshes = ringSpecs.map((sp) => {
    const geo = new THREE.TorusGeometry(sp.r, sp.tube, 8, 96);
    const mat = new THREE.MeshBasicMaterial({
      color: colors[sp.col],
      transparent: true,
      opacity: 0.42
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.set(sp.rx, sp.ry, 0);
    mesh.userData = { colKey: sp.col, speedX: (Math.random() - 0.5) * 0.004, speedY: (Math.random() - 0.5) * 0.006 };
    gyroGroup.add(mesh);
    return mesh;
  });
  gyroGroup.position.z = -10;
  scene.add(gyroGroup);

  // 3. NHIỀU KHỐI LẬP PHƯƠNG KÍNH + KHUNG DÂY 3D BAY XUYÊN CHIỀU SÂU
  const cubes = [];
  const baseBox = new THREE.BoxGeometry(1, 1, 1);
  const baseEdges = new THREE.EdgesGeometry(baseBox);

  for (let i = 0; i < 34; i++) {
    const isHot = i % 3 === 0;
    const colKey = isHot ? "secondary" : "primary";
    const group = new THREE.Group();

    const wire = new THREE.LineSegments(
      baseEdges,
      new THREE.LineBasicMaterial({ color: colors[colKey], transparent: true, opacity: 0.72 })
    );
    const glass = new THREE.Mesh(
      baseBox,
      new THREE.MeshBasicMaterial({ color: colors[colKey], transparent: true, opacity: 0.08, depthWrite: false })
    );
    group.add(wire, glass);

    const scale = 0.7 + Math.random() * 2.2;
    group.scale.setScalar(scale);
    group.position.set(
      (Math.random() - 0.5) * 42,
      (Math.random() - 0.5) * 20,
      -55 + Math.random() * 64
    );
    group.userData = {
      colKey,
      wireMat: wire.material,
      glassMat: glass.material,
      rx: (Math.random() - 0.5) * 0.015,
      ry: (Math.random() - 0.5) * 0.018,
      vz: 0.04 + Math.random() * 0.07
    };
    scene.add(group);
    cubes.push(group);
  }

  // 4. DẢI SÓNG ĐIỆN PLASMA 3D UỐN LƯỢN TRONG KHÔNG GIAN
  const waveLines = [];
  for (let w = 0; w < 4; w++) {
    const pts = [];
    for (let i = 0; i <= 70; i++) {
      pts.push(new THREE.Vector3(-34 + i, 0, -14 - w * 5));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const colKey = w % 2 === 0 ? "primary" : "secondary";
    const mat = new THREE.LineBasicMaterial({ color: colors[colKey], transparent: true, opacity: 0.45 });
    const line = new THREE.Line(geo, mat);
    line.userData = { colKey, offset: w * 1.4, baseY: -3 + w * 2.2 };
    scene.add(line);
    waveLines.push(line);
  }

  // 5. ĐÁM MÂY HẠT DỮ LIỆU LƯỢNG TỬ 3D
  const pCount = 520;
  const pPositions = new Float32Array(pCount * 3);
  for (let i = 0; i < pCount; i++) {
    pPositions[i * 3] = (Math.random() - 0.5) * 56;
    pPositions[i * 3 + 1] = (Math.random() - 0.5) * 26;
    pPositions[i * 3 + 2] = -60 + Math.random() * 72;
  }
  const pGeo = new THREE.BufferGeometry();
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPositions, 3));
  const pMat = new THREE.PointsMaterial({ color: colors.primary, size: 0.14, transparent: true, opacity: 0.8 });
  const particleCloud = new THREE.Points(pGeo, pMat);
  scene.add(particleCloud);

  // SÓNG NỔ HOLOGRAM KHI CLICK
  const shockwaves = [];
  function spawnTouchRipple(screenX, screenY) {
    const ndcX = (screenX / window.innerWidth) * 2 - 1;
    const ndcY = -(screenY / window.innerHeight) * 2 + 1;
    const vec = new THREE.Vector3(ndcX, ndcY, 0.5).unproject(camera);
    const dir = vec.sub(camera.position).normalize();
    const pos = camera.position.clone().add(dir.multiplyScalar(14));

    const ringGeo = new THREE.RingGeometry(0.18, 0.28, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: colors.secondary,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.95
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(pos);
    ring.lookAt(camera.position);
    scene.add(ring);
    shockwaves.push({ mesh: ring, mat: ringMat, scale: 1 });
  }

  // PARALLAX CAMERA THEO CHUỘT -> ẢO GIÁC THỊ GIÁC 3D THẬT
  let targetCamX = 0;
  let targetCamY = 1.2;
  window.addEventListener("pointermove", (e) => {
    targetCamX = (e.clientX / window.innerWidth - 0.5) * 4.2;
    targetCamY = 1.2 - (e.clientY / window.innerHeight - 0.5) * 2.6;
  });

  // ĐỒNG BỘ MÀU KHI CHUYỂN TEMPLATE
  const observer = new MutationObserver(() => {
    colors = getHexColors();
    scene.fog.color.copy(colors.voidBg);
    gridBottom.material.color.copy(colors.primary);
    gridTop.material.color.copy(colors.secondary);
    pMat.color.copy(colors.primary);
    gyroMeshes.forEach((m) => m.material.color.copy(colors[m.userData.colKey]));
    cubes.forEach((c) => {
      c.userData.wireMat.color.copy(colors[c.userData.colKey]);
      c.userData.glassMat.color.copy(colors[c.userData.colKey]);
    });
    waveLines.forEach((l) => l.material.color.copy(colors[l.userData.colKey]));
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  let time = 0;
  function animate() {
    requestAnimationFrame(animate);
    time += 0.025;

    camera.position.x += (targetCamX - camera.position.x) * 0.06;
    camera.position.y += (targetCamY - camera.position.y) * 0.06;
    camera.lookAt(0, 0, -12);

    // Trượt lưới sàn & trần tạo cảm giác bay xuyên không gian
    gridBottom.position.z = (time * 2.4) % 2.5;
    gridTop.position.z = (time * 2.4) % 2.5;

    gyroMeshes.forEach((m) => {
      m.rotation.x += m.userData.speedX;
      m.rotation.y += m.userData.speedY;
      m.rotation.z += 0.002;
    });

    cubes.forEach((c) => {
      c.rotation.x += c.userData.rx;
      c.rotation.y += c.userData.ry;
      c.position.z += c.userData.vz;
      if (c.position.z > 13) c.position.z = -55;
    });

    waveLines.forEach((line) => {
      const posAttr = line.geometry.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i);
        const y = line.userData.baseY + Math.sin(x * 0.25 + time * 1.6 + line.userData.offset) * 1.45
                  + Math.cos(x * 0.55 - time * 2.1) * 0.55;
        posAttr.setY(i, y);
      }
      posAttr.needsUpdate = true;
    });

    const pArr = pGeo.attributes.position.array;
    for (let i = 0; i < pCount; i++) {
      pArr[i * 3 + 2] += 0.09;
      if (pArr[i * 3 + 2] > 14) pArr[i * 3 + 2] = -60;
    }
    pGeo.attributes.position.needsUpdate = true;

    for (let i = shockwaves.length - 1; i >= 0; i--) {
      const sw = shockwaves[i];
      sw.scale += 0.42;
      sw.mesh.scale.setScalar(sw.scale);
      sw.mat.opacity -= 0.035;
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