// js/pyramid-3d.js — Tháp Tam Giác Ngược 10 Tầng (Tạm dừng khi ẩn tab + pan-y mobile + auto-frame portrait)

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";
import { createHoloMaterial } from "./holo-shader.js";

export function initInvertedPyramid3D({ canvasId, onSelectTier, onProjectOrigin }) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return { setSelectedTier: () => {}, resize: () => {}, setActive: () => {} };

  const isMobile = window.matchMedia("(max-width: 768px), (pointer: coarse)").matches;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: !isMobile,
    powerPreference: "default"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.35 : 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 100);
  camera.position.set(0, 1.35, 13.6);
  camera.lookAt(0, -0.35, 0);

  function getPalette() {
    const s = getComputedStyle(document.documentElement);
    return {
      primary: new THREE.Color(s.getPropertyValue("--c-primary").trim() || "#00E5FF"),
      secondary: new THREE.Color(s.getPropertyValue("--c-secondary").trim() || "#5EA8FF")
    };
  }
  let colors = getPalette();

  const baseGrid = new THREE.GridHelper(18, 22, colors.primary, colors.primary);
  baseGrid.position.y = -4.65;
  baseGrid.material.transparent = true;
  baseGrid.material.opacity = 0.28;
  scene.add(baseGrid);

  const emitterRing = new THREE.Mesh(
    new THREE.RingGeometry(2.15, 2.38, 56),
    new THREE.MeshBasicMaterial({ color: colors.primary, side: THREE.DoubleSide, transparent: true, opacity: 0.62 })
  );
  emitterRing.rotation.x = Math.PI / 2;
  emitterRing.position.y = -4.6;
  scene.add(emitterRing);

  const emitterRingInner = new THREE.Mesh(
    new THREE.RingGeometry(1.15, 1.28, 48),
    new THREE.MeshBasicMaterial({ color: colors.secondary, side: THREE.DoubleSide, transparent: true, opacity: 0.7 })
  );
  emitterRingInner.rotation.x = Math.PI / 2;
  emitterRingInner.position.y = -4.56;
  scene.add(emitterRingInner);

  const pyramidGroup = new THREE.Group();
  scene.add(pyramidGroup);

  const orbitRing = new THREE.Mesh(
    new THREE.TorusGeometry(4.45, 0.026, 8, 84),
    new THREE.MeshBasicMaterial({ color: colors.primary, transparent: true, opacity: 0.45 })
  );
  orbitRing.rotation.set(1.18, 0.32, 0);
  pyramidGroup.add(orbitRing);

  const orbitRing2 = new THREE.Mesh(
    new THREE.TorusGeometry(3.75, 0.02, 8, 72),
    new THREE.MeshBasicMaterial({ color: colors.secondary, transparent: true, opacity: 0.35 })
  );
  orbitRing2.rotation.set(-0.9, 0.55, 0.2);
  pyramidGroup.add(orbitRing2);

  const tierEntries = [];
  const hitMeshes = [];

  for (let i = 0; i < 10; i++) {
    const tierId = i + 1;
    const isApex = tierId === 10;

    const topR = 3.6 - i * 0.33;
    const botR = isApex ? 0.05 : 3.6 - (i + 1) * 0.33 + 0.05;
    const height = isApex ? 0.85 : 0.46;
    const yPos = 2.95 - i * 0.62 - (isApex ? 0.2 : 0);

    const geo = new THREE.CylinderGeometry(topR, botR, height, 4, 1);
    geo.rotateY(Math.PI / 4);

    const fillMat = createHoloMaterial(`#${colors.primary.getHexString()}`, 0.48);
    const fillMesh = new THREE.Mesh(geo, fillMat);
    fillMesh.position.y = yPos;
    fillMesh.userData = { tierId };

    const wireMat = new THREE.LineBasicMaterial({ color: colors.primary, transparent: true, opacity: 0.72 });
    const wireMesh = new THREE.LineSegments(new THREE.EdgesGeometry(geo), wireMat);
    fillMesh.add(wireMesh);

    if (tierId <= 4) {
      const colGeo = new THREE.BoxGeometry(0.14, 0.9, 0.14);
      const colEdge = new THREE.EdgesGeometry(colGeo);
      const offset = topR * 0.68;
      [[offset, 0], [-offset, 0], [0, offset], [0, -offset]].forEach(([cx, cz]) => {
        const pillarMat = new THREE.LineBasicMaterial({ color: colors.primary, transparent: true, opacity: 0.3 });
        const pillar = new THREE.LineSegments(colEdge, pillarMat);
        pillar.position.set(cx, -0.5, cz);
        fillMesh.add(pillar);
      });
    }

    pyramidGroup.add(fillMesh);
    hitMeshes.push(fillMesh);
    tierEntries.push({ tierId, mesh: fillMesh, fillMat, wireMat, radius: topR });
  }

  let selectedTier = 1;
  let hoveredTier = null;
  let isDragging = false;
  let activePointerId = null;
  let downX = 0;
  let downY = 0;
  let prevX = 0;
  let movedDist = 0;
  let userRotY = 0.35;
  let velRotY = 0;

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
    activePointerId = e.pointerId;
    downX = prevX = e.clientX;
    downY = e.clientY;
    movedDist = 0;
    velRotY = 0;
    try { canvas.setPointerCapture?.(e.pointerId); } catch (_) {}
  });

  function finishDrag(e, allowTap) {
    if (!isDragging || (activePointerId !== null && e.pointerId !== activePointerId)) return;
    isDragging = false;
    activePointerId = null;
    if (allowTap && movedDist < 10) {
      updatePointer(e);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(hitMeshes, false);
      if (hits.length > 0) {
        selectedTier = hits[0].object.userData.tierId;
        onSelectTier?.(selectedTier);
      }
    }
  }

  canvas.addEventListener("pointerup", (e) => finishDrag(e, true));
  canvas.addEventListener("pointercancel", (e) => finishDrag(e, false));

  canvas.addEventListener("pointermove", (e) => {
    if (isDragging && e.pointerId === activePointerId) {
      const dx = e.clientX - prevX;
      movedDist = Math.max(movedDist, Math.hypot(e.clientX - downX, e.clientY - downY));
      velRotY = dx * 0.011;
      userRotY += velRotY;
      prevX = e.clientX;
    }
    if (e.pointerType === "mouse") {
      updatePointer(e);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(hitMeshes, false);
      hoveredTier = hits.length > 0 ? hits[0].object.userData.tierId : null;
      canvas.style.cursor = hoveredTier ? "pointer" : isDragging ? "grabbing" : "grab";
    }
  });

  function resize() {
    const parent = canvas.parentElement;
    if (!parent) return;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    if (w < 20 || h < 20) return;
    const aspect = w / h;
    renderer.setSize(w, h, false);
    camera.aspect = aspect;
    // Tự lùi camera nhẹ trên màn hình dọc hẹp để không cắt mép 2 bên tháp
    camera.position.z = aspect < 1 ? Math.min(18.2, 13.6 / Math.max(0.74, aspect)) : 13.6;
    camera.lookAt(0, -0.35, 0);
    camera.updateProjectionMatrix();
  }

  let isTabActive = false;
  let rafId = null;

  function ensureRunning() {
    if (isTabActive && !document.hidden && !rafId) {
      rafId = requestAnimationFrame(animate);
    }
  }

  if (window.ResizeObserver && canvas.parentElement) {
    new ResizeObserver(() => resize()).observe(canvas.parentElement);
  }

  const observer = new MutationObserver(() => {
    colors = getPalette();
    baseGrid.material.color.copy(colors.primary);
    emitterRing.material.color.copy(colors.primary);
    emitterRingInner.material.color.copy(colors.secondary);
    orbitRing.material.color.copy(colors.primary);
    orbitRing2.material.color.copy(colors.secondary);
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  const projVec = new THREE.Vector3();
  const targetScaleVec = new THREE.Vector3();
  let time = 0;

  function animate() {
    rafId = null;
    if (!isTabActive || document.hidden) return;
    rafId = requestAnimationFrame(animate);

    time += 0.025;
    if (!isDragging) {
      userRotY += velRotY + 0.0035;
      velRotY *= 0.92;
    }
    pyramidGroup.rotation.y = userRotY;
    pyramidGroup.position.y = Math.sin(time * 0.9) * 0.24;
    orbitRing.rotation.z += 0.006;
    orbitRing2.rotation.z -= 0.0045;

    const showLaser = Boolean(onProjectOrigin) && window.innerWidth > 960;

    for (const entry of tierEntries) {
      const isSel = entry.tierId === selectedTier;
      const isHov = entry.tierId === hoveredTier;

      entry.fillMat.uniforms.uTime.value = time;
      entry.fillMat.uniforms.uColor.value.copy(isSel ? colors.secondary : colors.primary);
      entry.fillMat.uniforms.uOpacity.value = isSel ? 0.94 : isHov ? 0.72 : 0.42;

      const s = isSel ? 1.12 : isHov ? 1.06 : 1.0;
      targetScaleVec.set(s, s, s);
      entry.mesh.scale.lerp(targetScaleVec, 0.16);
      entry.wireMat.color.copy(isSel ? colors.secondary : colors.primary);
      entry.wireMat.opacity = isSel ? 1.0 : isHov ? 0.94 : 0.62;

      if (isSel && showLaser) {
        entry.mesh.updateWorldMatrix(true, false);
        projVec.set(entry.radius * 0.68, 0, 0).applyMatrix4(entry.mesh.matrixWorld);
        projVec.project(camera);
        const rect = canvas.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0) {
          const sx = rect.left + (projVec.x * 0.5 + 0.5) * rect.width;
          const sy = rect.top + (-projVec.y * 0.5 + 0.5) * rect.height;
          onProjectOrigin(sx, sy);
        }
      }
    }

    renderer.render(scene, camera);
  }

  document.addEventListener("visibilitychange", ensureRunning);
  canvas.addEventListener("webglcontextlost", (e) => e.preventDefault(), false);
  window.addEventListener("resize", resize);
  resize();

  return {
    setSelectedTier(id) { selectedTier = id; },
    setActive(active) {
      isTabActive = Boolean(active);
      if (isTabActive) {
        resize();
        ensureRunning();
      }
    },
    resize
  };
}