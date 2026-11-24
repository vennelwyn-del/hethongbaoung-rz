// js/npc-morph-3d.js — Mô hình Nhân trắc học 3D Three.js xoay 360° + Chỉ điểm vùng cơ thể (Head / Chest / Hand / Stance)

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";
import { createHoloMaterial } from "./holo-shader.js";

export function initNpcMorph3D({ canvasId, onProjectZones, onSelectZone }) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return { setSubject: () => {}, setActiveZone: () => {}, resize: () => {} };

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 60);
  camera.position.set(0, 0.15, 7.6);
  camera.lookAt(0, 0, 0);

  function getPalette() {
    const s = getComputedStyle(document.documentElement);
    return {
      primary: new THREE.Color(s.getPropertyValue("--c-primary").trim() || "#00E5FF"),
      secondary: new THREE.Color(s.getPropertyValue("--c-secondary").trim() || "#5EA8FF")
    };
  }
  let colors = getPalette();

  // Sàn lưới & Vòng chân đế hologram
  const grid = new THREE.GridHelper(6.5, 16, colors.primary, colors.primary);
  grid.position.y = -2.25;
  grid.material.transparent = true;
  grid.material.opacity = 0.28;
  scene.add(grid);

  const baseRing = new THREE.Mesh(
    new THREE.RingGeometry(1.15, 1.28, 48),
    new THREE.MeshBasicMaterial({ color: colors.primary, side: THREE.DoubleSide, transparent: true, opacity: 0.65 })
  );
  baseRing.rotation.x = Math.PI / 2;
  baseRing.position.y = -2.22;
  scene.add(baseRing);

  // Vòng laser quét dọc cơ thể
  const scanHalo = new THREE.Mesh(
    new THREE.TorusGeometry(1.08, 0.018, 8, 48),
    new THREE.MeshBasicMaterial({ color: colors.secondary, transparent: true, opacity: 0.72 })
  );
  scanHalo.rotation.x = Math.PI / 2;
  scene.add(scanHalo);

  // Nhóm mô hình nhân vật 3D
  const bodyGroup = new THREE.Group();
  scene.add(bodyGroup);

  const zoneAnchors = {};
  const hotspotMeshes = [];
  let coreHeartMesh = null;
  let activeZone = "head";
  let pulseSpeed = 0.06;

  function addWirePart(geo, parent, holoMat, opacityWire = 0.85) {
    const mesh = new THREE.Mesh(geo, holoMat);
    const wire = new THREE.LineSegments(
      new THREE.EdgesGeometry(geo),
      new THREE.LineBasicMaterial({ color: colors.primary, transparent: true, opacity: opacityWire })
    );
    mesh.add(wire);
    parent.add(mesh);
    return mesh;
  }

  function clearGroup(grp) {
    while (grp.children.length > 0) {
      const child = grp.children[0];
      clearGroup(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material && !Array.isArray(child.material)) child.material.dispose();
      grp.remove(child);
    }
  }

  function buildBodyMesh(npc, stats) {
    clearGroup(bodyGroup);
    hotspotMeshes.length = 0;

    const gender = stats.gender || "Nam";
    const h = Math.max(140, Math.min(220, Number(stats.heightCm) || 175));
    const w = Number(stats.weightKg);
    const bmi = w > 0 ? w / Math.pow(h / 100, 2) : 20.5;

    const scaleY = Math.max(0.84, Math.min(1.14, h / 178));
    const wF = Math.max(0.8, Math.min(1.3, bmi / 21));

    const holoMat = createHoloMaterial(`#${colors.primary.getHexString()}`, 0.56);
    const rig = new THREE.Group();
    bodyGroup.add(rig);

    if (npc.id === "sys00" || gender === "AI / Vô tính") {
      // Lõi Máy Chủ Kiểm Toán Lượng Tử kết hợp hình nhân Cyber
      const core = addWirePart(new THREE.OctahedronGeometry(0.62, 1), rig, holoMat, 0.95);
      core.position.y = 0.45;
      coreHeartMesh = core;

      const outerShell = addWirePart(new THREE.CylinderGeometry(0.65, 0.35, 1.5, 6), rig, holoMat, 0.72);
      outerShell.position.y = -0.55;

      const orbitA = new THREE.Mesh(
        new THREE.TorusGeometry(1.05, 0.02, 8, 56),
        new THREE.MeshBasicMaterial({ color: colors.secondary, transparent: true, opacity: 0.75 })
      );
      orbitA.position.y = 0.45;
      orbitA.rotation.set(0.9, 0.4, 0);
      rig.add(orbitA);

      const headNode = addWirePart(new THREE.IcosahedronGeometry(0.32, 0), rig, holoMat, 0.9);
      headNode.position.y = 1.48;

      zoneAnchors.head = new THREE.Vector3(0, 1.48, 0.25);
      zoneAnchors.chest = new THREE.Vector3(0, 0.48, 0.45);
      zoneAnchors.hand = new THREE.Vector3(-0.85, 0.2, 0.25);
      zoneAnchors.stance = new THREE.Vector3(0, -1.15, 0.25);
    } else {
      const isFemale = gender.includes("Nữ");
      const shW = (isFemale ? 0.42 : 0.52) * wF;
      const waW = (isFemale ? 0.24 : 0.31) * wF;
      const hipW = (isFemale ? 0.4 : 0.34) * wF;

      // 1. Đầu & Vòng quét não
      const head = addWirePart(new THREE.IcosahedronGeometry(0.27, 1), rig, holoMat, 0.88);
      head.position.y = 1.58 * scaleY;

      const brainRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.38, 0.012, 6, 36),
        new THREE.MeshBasicMaterial({ color: colors.secondary, transparent: true, opacity: 0.68 })
      );
      brainRing.rotation.x = Math.PI / 2;
      brainRing.position.y = 1.62 * scaleY;
      rig.add(brainRing);

      // 2. Cổ & Trục cột sống
      const spine = addWirePart(new THREE.CylinderGeometry(0.08, 0.08, 1.15 * scaleY, 6), rig, holoMat, 0.7);
      spine.position.y = 0.78 * scaleY;

      // 3. Ngực (Lồng ngực vát theo Nam/Nữ) & Eo/Hông
      const chest = addWirePart(new THREE.CylinderGeometry(shW, waW, 0.66 * scaleY, 6), rig, holoMat, 0.86);
      chest.position.y = 1.0 * scaleY;

      const pelvis = addWirePart(new THREE.CylinderGeometry(waW * 0.98, hipW, 0.42 * scaleY, 6), rig, holoMat, 0.8);
      pelvis.position.y = 0.46 * scaleY;

      // 4. Lõi Tim phát sáng
      coreHeartMesh = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.13, 0),
        new THREE.MeshBasicMaterial({ color: colors.secondary, transparent: true, opacity: 0.95 })
      );
      coreHeartMesh.position.set(0.06, 1.05 * scaleY, 0.14);
      rig.add(coreHeartMesh);

      // 5. Hai tay
      [-1, 1].forEach((side) => {
        const upperArm = addWirePart(new THREE.CylinderGeometry(0.095 * wF, 0.08 * wF, 0.56 * scaleY, 6), rig, holoMat, 0.76);
        upperArm.position.set(side * (shW + 0.12), 0.94 * scaleY, 0);
        upperArm.rotation.z = side * 0.14;

        const foreArm = addWirePart(new THREE.CylinderGeometry(0.075 * wF, 0.06 * wF, 0.54 * scaleY, 6), rig, holoMat, 0.76);
        foreArm.position.set(side * (shW + 0.22), 0.43 * scaleY, 0.05);
        foreArm.rotation.z = side * 0.08;
      });

      // 6. Hai chân (Đứng chuẩn tới sàn -2.22)
      const legY = -0.36 * scaleY;
      [-1, 1].forEach((side) => {
        const thigh = addWirePart(new THREE.CylinderGeometry(0.14 * wF, 0.105 * wF, 0.78 * scaleY, 6), rig, holoMat, 0.78);
        thigh.position.set(side * (hipW * 0.52), legY + 0.24 * scaleY, 0);

        const shin = addWirePart(new THREE.CylinderGeometry(0.1 * wF, 0.072 * wF, 0.82 * scaleY, 6), rig, holoMat, 0.78);
        shin.position.set(side * (hipW * 0.54), legY - 0.54 * scaleY, 0);
      });

      // Căn chỉnh đáy chân chạm mặt đế
      rig.position.y = -0.52;

      zoneAnchors.head = new THREE.Vector3(0, 1.58 * scaleY - 0.52, 0.28);
      zoneAnchors.chest = new THREE.Vector3(0, 1.05 * scaleY - 0.52, 0.34);
      zoneAnchors.hand = new THREE.Vector3(-(shW + 0.22), 0.22 * scaleY - 0.52, 0.16);
      zoneAnchors.stance = new THREE.Vector3(hipW * 0.54, -0.78 * scaleY - 0.52, 0.18);
    }

    // Tạo 4 điểm neo phát sáng tương tác ngay trên cơ thể 3D
    Object.entries(zoneAnchors).forEach(([zoneKey, localPos]) => {
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.085, 12, 12),
        new THREE.MeshBasicMaterial({ color: colors.secondary, transparent: true, opacity: 0.95 })
      );
      dot.position.copy(localPos);
      dot.userData = { zoneKey };
      bodyGroup.add(dot);
      hotspotMeshes.push(dot);
    });

    const bpmNum = parseInt(stats.heartRate, 10);
    pulseSpeed = Number.isFinite(bpmNum) && bpmNum > 0 ? Math.max(0.03, Math.min(0.16, bpmNum / 950)) : 0.05;
  }

  // Kéo xoay 360 độ + Raycast chọn vùng trên mô hình 3D
  let isDragging = false;
  let downX = 0, downY = 0, prevX = 0, prevY = 0, movedDist = 0;
  let rotY = 0.32, rotX = 0.06, velY = 0;
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
      velY = dx * 0.013;
      rotY += velY;
      rotX = Math.max(-0.42, Math.min(0.42, rotX + dy * 0.008));
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

  function resize() {
    const parent = canvas.parentElement;
    if (!parent) return;
    const w = parent.clientWidth || 260;
    const h = parent.clientHeight || 300;
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
    grid.material.color.copy(colors.primary);
    baseRing.material.color.copy(colors.primary);
    scanHalo.material.color.copy(colors.secondary);
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  const projVec = new THREE.Vector3();
  let time = 0;

  function animate() {
    requestAnimationFrame(animate);
    time += 0.028;

    if (!isDragging) {
      rotY += velY + 0.0065;
      velY *= 0.92;
    }
    bodyGroup.rotation.y = rotY;
    bodyGroup.rotation.x = rotX;
    scanHalo.position.y = Math.sin(time * 0.9) * 1.65 - 0.35;

    if (coreHeartMesh) {
      const beat = 1 + Math.sin(time * 18 * pulseSpeed) * 0.16;
      coreHeartMesh.scale.setScalar(beat);
    }

    // Cập nhật shader uniforms + màu hotspot đang chọn
    bodyGroup.traverse((obj) => {
      if (obj.material?.uniforms?.uTime) {
        obj.material.uniforms.uTime.value = time;
        obj.material.uniforms.uColor.value.copy(colors.primary);
      }
    });

    hotspotMeshes.forEach((dot) => {
      const isSel = dot.userData.zoneKey === activeZone;
      dot.material.color.copy(isSel ? colors.secondary : colors.primary);
      dot.scale.setScalar(isSel ? 1.55 + Math.sin(time * 6) * 0.25 : 0.95);
    });

    // Chiếu tọa độ 4 điểm 3D ra 2D để vẽ đường dẫn chỉ điểm
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
      rotY = 0.32;
      buildBodyMesh(npc, stats);
      resize();
    },
    setActiveZone(zoneKey) {
      activeZone = zoneKey;
    },
    resize
  };
}