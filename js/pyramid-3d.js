// js/pyramid-3d.js — Mô hình 3D Three.js Tam Giác Ngược 10 Tầng + Raycaster chọn tầng trực tiếp

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js"; 
export function initInvertedPyramid3D({ canvasId, onSelectTier, onProjectOrigin }) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return { setSelectedTier: () => {}, resize: () => {} };
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(44, 1, 0.1, 100);
  camera.position.set(0, 1.3, 13.5);
  camera.lookAt(0, -0.3, 0);

  function getPalette() {
    const s = getComputedStyle(document.documentElement);
    return {
      primary: new THREE.Color(s.getPropertyValue("--c-primary").trim() || "#3BB8F8"),
      secondary: new THREE.Color(s.getPropertyValue("--c-secondary").trim() || "#F787F8")
    };
  }
  let colors = getPalette();

  // Sàn lưới 3D bên dưới khối bay
  const baseGrid = new THREE.GridHelper(18, 22, colors.primary, colors.primary);
  baseGrid.position.y = -4.6;
  baseGrid.material.transparent = true;
  baseGrid.material.opacity = 0.28;
  scene.add(baseGrid);

  // Vòng sáng đế chiếu dưới chóp nhọn
  const emitterRing = new THREE.Mesh(
    new THREE.RingGeometry(2.2, 2.38, 48),
    new THREE.MeshBasicMaterial({ color: colors.primary, side: THREE.DoubleSide, transparent: true, opacity: 0.55 })
  );
  emitterRing.rotation.x = Math.PI / 2;
  emitterRing.position.y = -4.55;
  scene.add(emitterRing);

  // Cụm mô hình Tam Giác Ngược 10 Tầng lơ lửng
  const pyramidGroup = new THREE.Group();
  scene.add(pyramidGroup);

  // Vòng quỹ đạo nghiêng quanh khối 3D
  const orbitRing = new THREE.Mesh(
    new THREE.TorusGeometry(4.3, 0.025, 8, 72),
    new THREE.MeshBasicMaterial({ color: colors.primary, transparent: true, opacity: 0.4 })
  );
  orbitRing.rotation.set(1.15, 0.3, 0);
  pyramidGroup.add(orbitRing);

  const tierEntries = [];
  const hitMeshes = [];

  for (let i = 0; i < 10; i++) {
    const tierId = i + 1;
    const isApex = tierId === 10;

    // Thu hẹp dần từ Tầng 1 (trên rộng) xuống Tầng 10 (chóp nhọn đáy)
    const topR = 3.6 - i * 0.33;
    const botR = isApex ? 0.04 : 3.6 - (i + 1) * 0.33 + 0.04;
    const height = isApex ? 0.85 : 0.46;
    const yPos = 2.95 - i * 0.62 - (isApex ? 0.2 : 0);

    const geo = new THREE.CylinderGeometry(topR, botR, height, 4, 1);
    geo.rotateY(Math.PI / 4); // Xoay 45 độ thành khối kim tự tháp vuông sắc cạnh

    const fillMat = new THREE.MeshBasicMaterial({
      color: colors.primary,
      transparent: true,
      opacity: 0.14,
      depthWrite: false
    });
    const fillMesh = new THREE.Mesh(geo, fillMat);
    fillMesh.position.y = yPos;
    fillMesh.userData = { tierId };

    const edgeGeo = new THREE.EdgesGeometry(geo);
    const wireMat = new THREE.LineBasicMaterial({
      color: colors.primary,
      transparent: true,
      opacity: 0.72
    });
    const wireMesh = new THREE.LineSegments(edgeGeo, wireMat);
    fillMesh.add(wireMesh);

    // Các cột dữ liệu kiến trúc nhỏ treo dưới tầng 1–4 giống ảnh 4
    if (tierId <= 4) {
      const colGeo = new THREE.BoxGeometry(0.14, 0.9, 0.14);
      const colEdge = new THREE.EdgesGeometry(colGeo);
      const offset = topR * 0.68;
      [[offset, 0], [-offset, 0], [0, offset], [0, -offset]].forEach(([cx, cz]) => {
        const pillar = new THREE.LineSegments(
          colEdge,
          new THREE.LineBasicMaterial({ color: colors.primary, transparent: true, opacity: 0.32 })
        );
        pillar.position.set(cx, -0.5, cz);
        fillMesh.add(pillar);
      });
    }

    pyramidGroup.add(fillMesh);
    hitMeshes.push(fillMesh);
    tierEntries.push({ tierId, mesh: fillMesh, fillMat, wireMat, baseY: yPos, radius: topR });
  }

  let selectedTier = 1;
  let hoveredTier = null;
  let isDragging = false;
  let prevX = 0;
  let userRotY = 0.35;

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function updatePointer(e) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  canvas.addEventListener("pointerdown", (e) => {
    isDragging = true;
    prevX = e.clientX;
    updatePointer(e);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(hitMeshes, false);
    if (hits.length > 0) {
      selectedTier = hits[0].object.userData.tierId;
      onSelectTier?.(selectedTier);
    }
  });

  window.addEventListener("pointerup", () => { isDragging = false; });

  canvas.addEventListener("pointermove", (e) => {
    if (isDragging) {
      userRotY += (e.clientX - prevX) * 0.01;
      prevX = e.clientX;
    }
    updatePointer(e);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(hitMeshes, false);
    hoveredTier = hits.length > 0 ? hits[0].object.userData.tierId : null;
    canvas.style.cursor = hoveredTier ? "pointer" : isDragging ? "grabbing" : "grab";
  });

  function resize() {
    const parent = canvas.parentElement;
    if (!parent) return;
    const w = Math.max(280, parent.clientWidth);
    const h = Math.max(420, parent.clientHeight);
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  const observer = new MutationObserver(() => {
    colors = getPalette();
    baseGrid.material.color.copy(colors.primary);
    emitterRing.material.color.copy(colors.primary);
    orbitRing.material.color.copy(colors.primary);
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  const projVec = new THREE.Vector3();
  let time = 0;

  function animate() {
    requestAnimationFrame(animate);
    time += 0.025;

    if (!isDragging) userRotY += 0.004;
    pyramidGroup.rotation.y = userRotY;
    pyramidGroup.position.y = Math.sin(time * 0.9) * 0.24;
    orbitRing.rotation.z += 0.006;

    for (const entry of tierEntries) {
  const isSel = entry.tierId === selectedTier;
  const isHov = entry.tierId === hoveredTier;

  entry.fillMat.uniforms.uTime.value = time;
  entry.fillMat.uniforms.uColor.value.copy(isSel ? colors.secondary : colors.primary);
  entry.fillMat.uniforms.uOpacity.value = isSel ? 0.92 : isHov ? 0.72 : 0.42;

  const targetScale = isSel ? 1.12 : isHov ? 1.06 : 1.0;
  entry.mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.16);
  entry.wireMat.color.copy(isSel ? colors.secondary : colors.primary);
  entry.wireMat.opacity = isSel ? 1.0 : isHov ? 0.95 : 0.62;

      if (isSel && onProjectOrigin) {
        // Tính tọa độ cạnh phải của tầng 3D đang chọn để mũi tên SVG bám dính
        entry.mesh.updateWorldMatrix(true, false);
        projVec.set(entry.radius * 0.65, 0, 0).applyMatrix4(entry.mesh.matrixWorld);
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

  resize();
  window.addEventListener("resize", resize);
  animate();

  return {
    setSelectedTier(id) { selectedTier = id; },
    resize
  };
}