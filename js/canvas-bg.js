// js/canvas-bg.js — Three.js Cosmic Orbital Space Station, Wireframe Holo-City (Ảnh 3) & Parallax 3D

import * as THREE from "./assets/assets/OPW/Hethongbaoung/canvas_bg.png";

export function initVRCanvas() {
  const canvas = document.getElementById("vr-canvas");
  if (!canvas) return { spawnTouchRipple: () => {} };

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x020612, 0.017);

  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 180);
  camera.position.set(0, 2.2, 18);

  function getHexColors() {
    const s = getComputedStyle(document.documentElement);
    const p = s.getPropertyValue("--c-primary").trim() || "#00E5FF";
    const sec = s.getPropertyValue("--c-secondary").trim() || "#5EA8FF";
    const bg = s.getPropertyValue("--bg-void").trim() || "#020612";
    return {
      primary: new THREE.Color(p),
      secondary: new THREE.Color(sec),
      voidBg: new THREE.Color(bg)
    };
  }

  let colors = getHexColors();
  scene.fog.color.copy(colors.voidBg);

  // 1. TRƯỜNG SAO VŨ TRỤ SÂU ĐA TẦNG (COSMIC STARFIELD)
  const starCount = 1200;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    starPositions[i * 3] = (Math.random() - 0.5) * 140;
    starPositions[i * 3 + 1] = (Math.random() - 0.25) * 75;
    starPositions[i * 3 + 2] = -95 + Math.random() * 110;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
  const starMat = new THREE.PointsMaterial({
    color: colors.primary,
    size: 0.17,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending
  });
  const starField = new THREE.Points(starGeo, starMat);
  scene.add(starField);

  // 2. SÀN & TRẦN LƯỚI KHÔNG GIAN QUỸ ĐẠO
  const gridBottom = new THREE.GridHelper(160, 56, colors.primary, colors.primary);
  gridBottom.position.y = -8.2;
  gridBottom.material.transparent = true;
  gridBottom.material.opacity = 0.24;
  scene.add(gridBottom);

  const gridTop = new THREE.GridHelper(160, 48, colors.secondary, colors.secondary);
  gridTop.position.y = 14.5;
  gridTop.material.transparent = true;
  gridTop.material.opacity = 0.11;
  scene.add(gridTop);

  // 3. THÀNH PHỐ HOLOGRAM WIREFRAME ĐƯỜNG CHÂN TRỜI (CẢM HỨNG ẢNH 3)
  const cityGroup = new THREE.Group();
  const cityTowers = [];
  const towerBoxGeo = new THREE.BoxGeometry(1, 1, 1);
  const towerEdgesGeo = new THREE.EdgesGeometry(towerBoxGeo);

  for (let i = 0; i < 42; i++) {
    const colKey = i % 4 === 0 ? "secondary" : "primary";
    const w = 1.1 + Math.random() * 2.2;
    const h = 3.2 + Math.random() * 12.5;
    const d = 1.1 + Math.random() * 2.2;
    const x = (Math.random() - 0.5) * 86;
    const z = -22 - Math.random() * 52;

    // Tránh che kín giữa tầm nhìn gần quá
    if (Math.abs(x) < 7 && z > -30) continue;

    const wireMat = new THREE.LineBasicMaterial({ color: colors[colKey], transparent: true, opacity: 0.42 });
    const glassMat = new THREE.MeshBasicMaterial({ color: colors[colKey], transparent: true, opacity: 0.05, depthWrite: false });

    const tower = new THREE.Group();
    const wire = new THREE.LineSegments(towerEdgesGeo, wireMat);
    const glass = new THREE.Mesh(towerBoxGeo, glassMat);
    tower.add(wire, glass);
    tower.scale.set(w, h, d);
    tower.position.set(x, -8.2 + h * 0.5, z);
    tower.userData = { colKey, wireMat, glassMat, baseOpacity: 0.34 + Math.random() * 0.24, phase: Math.random() * 6.28 };
    cityGroup.add(tower);
    cityTowers.push(tower);
  }
  scene.add(cityGroup);

  // 4. VÒNG QUỸ ĐẠO TRẠM KHÔNG GIAN KHỔNG LỒ (ORBITAL RINGS - ẢNH 1 & 2)
  const gyroGroup = new THREE.Group();
  const ringSpecs = [
    { r: 10.5, tube: 0.045, col: "primary", rx: 0.42, ry: 0.24, sx: 0.002, sy: 0.004 },
    { r: 13.8, tube: 0.035, col: "secondary", rx: -0.62, ry: 0.5, sx: -0.003, sy: 0.0025 },
    { r: 17.5, tube: 0.028, col: "primary", rx: 1.05, ry: -0.34, sx: 0.0018, sy: -0.0035 },
    { r: 22.0, tube: 0.022, col: "secondary", rx: 1.38, ry: 0.15, sx: -0.001, sy: 0.002 }
  ];
  const gyroMeshes = ringSpecs.map((sp) => {
    const geo = new THREE.TorusGeometry(sp.r, sp.tube, 8, 112);
    const mat = new THREE.MeshBasicMaterial({ color: colors[sp.col], transparent: true, opacity: 0.38 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.set(sp.rx, sp.ry, 0);
    mesh.userData = { colKey: sp.col, speedX: sp.sx, speedY: sp.sy };
    gyroGroup.add(mesh);
    return mesh;
  });
  gyroGroup.position.set(0, 2.2, -16);
  scene.add(gyroGroup);

  // 5. KHỐI LẬP PHƯƠNG DỮ LIỆU BAY TRÔI KHÔNG TRỌNG LỰC
  const cubes = [];
  for (let i = 0; i < 24; i++) {
    const colKey = i % 3 === 0 ? "secondary" : "primary";
    const group = new THREE.Group();
    const wireMat = new THREE.LineBasicMaterial({ color: colors[colKey], transparent: true, opacity: 0.65 });
    const glassMat = new THREE.MeshBasicMaterial({ color: colors[colKey], transparent: true, opacity: 0.07, depthWrite: false });
    group.add(new THREE.LineSegments(towerEdgesGeo, wireMat), new THREE.Mesh(towerBoxGeo, glassMat));

    const scale = 0.55 + Math.random() * 1.65;
    group.scale.setScalar(scale);
    group.position.set((Math.random() - 0.5) * 48, (Math.random() - 0.35) * 20, -60 + Math.random() * 68);
    group.userData = {
      colKey,
      wireMat,
      glassMat,
      rx: (Math.random() - 0.5) * 0.012,
      ry: (Math.random() - 0.5) * 0.014,
      vz: 0.035 + Math.random() * 0.055
    };
    scene.add(group);
    cubes.push(group);
  }

  // 6. DẢI SÓNG TÍN HIỆU LƯỢNG TỬ
  const waveLines = [];
  for (let w = 0; w < 3; w++) {
    const pts = [];
    for (let i = 0; i <= 76; i++) pts.push(new THREE.Vector3(-38 + i, 0, -16 - w * 6));
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const colKey = w % 2 === 0 ? "primary" : "secondary";
    const mat = new THREE.LineBasicMaterial({ color: colors[colKey], transparent: true, opacity: 0.36 });
    const line = new THREE.Line(geo, mat);
    line.userData = { colKey, offset: w * 1.6, baseY: -2.4 + w * 2.5 };
    scene.add(line);
    waveLines.push(line);
  }

  // 7. SÓNG NỔ HOLOGRAM KHI CHẠM / CLICK
  const shockwaves = [];
  function spawnTouchRipple(screenX, screenY) {
    const ndcX = (screenX / window.innerWidth) * 2 - 1;
    const ndcY = -(screenY / window.innerHeight) * 2 + 1;
    const vec = new THREE.Vector3(ndcX, ndcY, 0.5).unproject(camera);
    const dir = vec.sub(camera.position).normalize();
    const pos = camera.position.clone().add(dir.multiplyScalar(14));

    const ringGeo = new THREE.RingGeometry(0.16, 0.27, 36);
    const ringMat = new THREE.MeshBasicMaterial({
      color: colors.secondary,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.92,
      blending: THREE.AdditiveBlending
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.copy(pos);
    ring.lookAt(camera.position);
    scene.add(ring);
    shockwaves.push({ mesh: ring, mat: ringMat, scale: 1 });
  }

  // 8. CAMERA PARALLAX MƯỢT THEO CHUỘT & CẢM ỨNG
  let targetCamX = 0;
  let targetCamY = 2.2;
  window.addEventListener("pointermove", (e) => {
    targetCamX = (e.clientX / window.innerWidth - 0.5) * 4.8;
    targetCamY = 2.2 - (e.clientY / window.innerHeight - 0.5) * 2.8;
  });

  // ĐỒNG BỘ MÀU KHI ĐỔI THEME
  const observer = new MutationObserver(() => {
    colors = getHexColors();
    scene.fog.color.copy(colors.voidBg);
    starMat.color.copy(colors.primary);
    gridBottom.material.color.copy(colors.primary);
    gridTop.material.color.copy(colors.secondary);
    gyroMeshes.forEach((m) => m.material.color.copy(colors[m.userData.colKey]));
    cityTowers.forEach((t) => {
      t.userData.wireMat.color.copy(colors[t.userData.colKey]);
      t.userData.glassMat.color.copy(colors[t.userData.colKey]);
    });
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
    time += 0.022;

    camera.position.x += (targetCamX - camera.position.x) * 0.055;
    camera.position.y += (targetCamY - camera.position.y) * 0.055;
    camera.lookAt(0, 0.2, -18);

    gridBottom.position.z = (time * 2.2) % 2.85;
    gridTop.position.z = (time * 2.2) % 2.85;

    gyroMeshes.forEach((m) => {
      m.rotation.x += m.userData.speedX;
      m.rotation.y += m.userData.speedY;
      m.rotation.z += 0.0018;
    });

    cityTowers.forEach((t) => {
      t.userData.wireMat.opacity = t.userData.baseOpacity + Math.sin(time * 1.4 + t.userData.phase) * 0.08;
    });

    cubes.forEach((c) => {
      c.rotation.x += c.userData.rx;
      c.rotation.y += c.userData.ry;
      c.position.z += c.userData.vz;
      if (c.position.z > 14) c.position.z = -60;
    });

    waveLines.forEach((line) => {
      const posAttr = line.geometry.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i);
        const y = line.userData.baseY + Math.sin(x * 0.22 + time * 1.5 + line.userData.offset) * 1.35 + Math.cos(x * 0.48 - time * 1.9) * 0.48;
        posAttr.setY(i, y);
      }
      posAttr.needsUpdate = true;
    });

    const sArr = starGeo.attributes.position.array;
    for (let i = 0; i < starCount; i++) {
      sArr[i * 3 + 2] += 0.075;
      if (sArr[i * 3 + 2] > 16) sArr[i * 3 + 2] = -95;
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