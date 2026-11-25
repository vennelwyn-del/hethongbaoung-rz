// js/npc-morph-3d.js — Động Vật 3D Thật (.glb + AnimationMixer + Fallback Link + Chế độ Thực Tế / Holo hỗ trợ SkinnedMesh)

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { createHoloMaterial } from "./holo-shader.js";
import { ANIMAL_PRESETS } from "./config.js";

export function initNpcMorph3D({ canvasId, onProjectZones, onSelectZone }) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return { setSubject: () => {}, setActiveZone: () => {}, toggleRenderMode: () => "real", resize: () => {} };

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 80);
  camera.position.set(0, 0.45, 5.2);
  camera.lookAt(0, 0, 0);

  function getPalette() {
    const s = getComputedStyle(document.documentElement);
    return {
      primary: new THREE.Color(s.getPropertyValue("--c-primary").trim() || "#00E5FF"),
      secondary: new THREE.Color(s.getPropertyValue("--c-secondary").trim() || "#5EA8FF")
    };
  }
  let colors = getPalette();

  const ambientLight = new THREE.AmbientLight(0xffffff, 1.45);
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.3);
  keyLight.position.set(4, 6, 5);
  const rimLight = new THREE.DirectionalLight(colors.primary, 2.4);
  rimLight.position.set(-4, 3, -4);
  const underLight = new THREE.PointLight(colors.secondary, 1.8, 16);
  underLight.position.set(0, -2.2, 2);
  scene.add(ambientLight, keyLight, rimLight, underLight);

  const floorGroup = new THREE.Group();
  floorGroup.position.y = -1.35;
  scene.add(floorGroup);

  const ringOuter = new THREE.Mesh(
    new THREE.RingGeometry(1.38, 1.42, 72),
    new THREE.MeshBasicMaterial({ color: colors.primary, side: THREE.DoubleSide, transparent: true, opacity: 0.65 })
  );
  ringOuter.rotation.x = Math.PI / 2;
  floorGroup.add(ringOuter);

  const ringInner = new THREE.Mesh(
    new THREE.RingGeometry(0.86, 0.89, 56),
    new THREE.MeshBasicMaterial({ color: colors.secondary, side: THREE.DoubleSide, transparent: true, opacity: 0.5 })
  );
  ringInner.rotation.x = Math.PI / 2;
  floorGroup.add(ringInner);

  const floorGrid = new THREE.GridHelper(5.4, 16, colors.primary, colors.primary);
  floorGrid.material.transparent = true;
  floorGrid.material.opacity = 0.18;
  floorGroup.add(floorGrid);

  const scanPlane = new THREE.Mesh(
    new THREE.TorusGeometry(1.22, 0.01, 8, 64),
    new THREE.MeshBasicMaterial({ color: colors.secondary, transparent: true, opacity: 0.65 })
  );
  scanPlane.rotation.x = Math.PI / 2;
  scene.add(scanPlane);

  const modelRoot = new THREE.Group();
  scene.add(modelRoot);

  const loader = new GLTFLoader();
  loader.setCrossOrigin("anonymous");
  const gltfCache = new Map();

  let mixer = null;
  let currentModelWrapper = null;
  let renderMode = "real";
  let activeZone = "head";
  let loadSeq = 0;
  let currentWireMat = null;

  const hotspotMeshes = [];
  const loadingBadge = document.getElementById("lab-model-loading");

  function clearHotspots() {
    hotspotMeshes.forEach((m) => {
      modelRoot.remove(m);
      m.geometry.dispose();
      m.material.dispose();
    });
    hotspotMeshes.length = 0;
  }

  function clearLoadedModel() {
    clearHotspots();
    if (mixer) {
      mixer.stopAllAction();
      mixer = null;
    }
    if (currentModelWrapper) {
      modelRoot.remove(currentModelWrapper);
      currentModelWrapper = null;
    }
  }

  function applyCurrentRenderMode() {
    if (!currentModelWrapper) return;
    if (!currentWireMat) {
      currentWireMat = new THREE.MeshStandardMaterial({
        color: colors.primary,
        emissive: colors.primary,
        emissiveIntensity: 0.65,
        wireframe: true,
        transparent: true,
        opacity: 0.78
      });
    } else {
      currentWireMat.color.copy(colors.primary);
      currentWireMat.emissive.copy(colors.primary);
    }

    currentModelWrapper.traverse((obj) => {
      if (!obj.isMesh) return;
      if (!obj.userData.__origMat) obj.userData.__origMat = obj.material;
      obj.material = renderMode === "holo" ? currentWireMat : obj.userData.__origMat;
    });
  }

  function buildAnimalHotspots(normBox, animalType) {
    clearHotspots();
    const min = normBox.min;
    const max = normBox.max;
    const midY = (min.y + max.y) * 0.5;

    let anchors = {};
    if (animalType === "bird") {
      anchors = {
        head: new THREE.Vector3(0, max.y * 0.55, max.z * 0.68),
        chest: new THREE.Vector3(0, midY, max.z * 0.16),
        limb: new THREE.Vector3(max.x * 0.66, max.y * 0.3, 0),
        tail: new THREE.Vector3(0, min.y * 0.25, min.z * 0.72)
      };
    } else if (animalType === "swim") {
      anchors = {
        head: new THREE.Vector3(0, max.y * 0.22, max.z * 0.74),
        chest: new THREE.Vector3(0, max.y * 0.45, max.z * 0.12),
        limb: new THREE.Vector3(max.x * 0.58, min.y * 0.48, max.z * 0.15),
        tail: new THREE.Vector3(0, max.y * 0.25, min.z * 0.82)
      };
    } else {
      anchors = {
        head: new THREE.Vector3(0, max.y * 0.68, max.z * 0.68),
        chest: new THREE.Vector3(0, max.y * 0.22, max.z * 0.34),
        limb: new THREE.Vector3(max.x * 0.42, min.y * 0.65, max.z * 0.26),
        tail: new THREE.Vector3(0, max.y * 0.26, min.z * 0.76)
      };
    }

    Object.entries(anchors).forEach(([zoneKey, pos]) => {
      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.065, 14, 14),
        new THREE.MeshBasicMaterial({ color: colors.secondary, transparent: true, opacity: 0.96 })
      );
      dot.position.copy(pos);
      dot.userData = { zoneKey };
      modelRoot.add(dot);
      hotspotMeshes.push(dot);
    });
  }

  async function loadGltfWithFallback(urls) {
    let lastErr = null;
    for (const url of urls) {
      if (gltfCache.has(url)) return gltfCache.get(url);
      try {
        const data = await new Promise((resolve, reject) => {
          loader.load(url, resolve, undefined, reject);
        });
        data.scene.traverse((obj) => {
          if (obj.isMesh && !obj.userData.__origMat) obj.userData.__origMat = obj.material;
        });
        gltfCache.set(url, data);
        return data;
      } catch (err) {
        lastErr = err;
      }
    }
    throw lastErr || new Error("Không tải được model 3D");
  }

  async function loadAnimalModel(npc, stats) {
    const mySeq = ++loadSeq;
    clearLoadedModel();

    const preset = ANIMAL_PRESETS[stats.animalKey] || ANIMAL_PRESETS.horse;
    const customUrl = (stats.modelUrl || "").trim();
    const urls = customUrl ? [customUrl, preset.url, preset.fallback].filter(Boolean) : [preset.url, preset.fallback].filter(Boolean);
    const animalType = preset.type || "quad";

    loadingBadge?.classList.remove("hidden");

    try {
      const gltf = await loadGltfWithFallback(urls);
      if (mySeq !== loadSeq) return;

      const sceneObj = gltf.scene;
      sceneObj.position.set(0, 0, 0);
      sceneObj.rotation.set(0, 0, 0);
      sceneObj.scale.set(1, 1, 1);

      const rawBox = new THREE.Box3().setFromObject(sceneObj);
      const size = rawBox.getSize(new THREE.Vector3());
      const center = rawBox.getCenter(new THREE.Vector3());
      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const scale = 2.65 / maxDim;

      const wrapper = new THREE.Group();
      sceneObj.scale.setScalar(scale);
      sceneObj.position.set(-center.x * scale, -center.y * scale, -center.z * scale);
      wrapper.add(sceneObj);

      const normBox = new THREE.Box3().setFromObject(wrapper);
      wrapper.position.y = animalType === "quad" ? (-1.32 - normBox.min.y) : 0.05;

      modelRoot.add(wrapper);
      currentModelWrapper = wrapper;

      const finalBox = new THREE.Box3().setFromObject(wrapper);
      buildAnimalHotspots(finalBox, animalType);
      applyCurrentRenderMode();

      if (gltf.animations && gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(sceneObj);
        const action = mixer.clipAction(gltf.animations[0]);
        action.timeScale = 0.78;
        action.play();
      }
    } catch (_) {
      if (mySeq !== loadSeq) return;
      const fallback = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.8, 1),
        createHoloMaterial(`#${colors.primary.getHexString()}`, 0.7)
      );
      modelRoot.add(fallback);
      currentModelWrapper = fallback;
      buildAnimalHotspots(new THREE.Box3().setFromObject(fallback), "bird");
    } finally {
      if (mySeq === loadSeq) loadingBadge?.classList.add("hidden");
    }
  }

  let isDragging = false;
  let downX = 0, downY = 0, prevX = 0, prevY = 0, movedDist = 0;
  let rotY = 0.58, rotX = 0.06, velY = 0, targetCamZ = 5.2;
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
      rotX = Math.max(-0.45, Math.min(0.45, rotX + dy * 0.007));
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
    targetCamZ = Math.max(3.2, Math.min(8.4, targetCamZ + e.deltaY * 0.003));
  }, { passive: false });

  function resize() {
    const parent = canvas.parentElement;
    if (!parent) return;
    const w = parent.clientWidth || 340;
    const h = parent.clientHeight || 410;
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
    rimLight.color.copy(colors.primary);
    underLight.color.copy(colors.secondary);
    ringOuter.material.color.copy(colors.primary);
    ringInner.material.color.copy(colors.secondary);
    floorGrid.material.color.copy(colors.primary);
    scanPlane.material.color.copy(colors.secondary);
    if (renderMode === "holo") applyCurrentRenderMode();
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  const projVec = new THREE.Vector3();
  const clock = new THREE.Clock();
  let time = 0;

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(0.05, clock.getDelta());
    time += dt;

    if (mixer) mixer.update(dt);

    if (!isDragging) {
      rotY += velY + 0.0055;
      velY *= 0.92;
    }
    camera.position.z += (targetCamZ - camera.position.z) * 0.12;
    modelRoot.rotation.y = rotY;
    modelRoot.rotation.x = rotX;
    floorGroup.rotation.y = -time * 0.2;
    scanPlane.position.y = Math.sin(time * 1.4) * 1.15 - 0.15;

    hotspotMeshes.forEach((dot) => {
      const isSel = dot.userData.zoneKey === activeZone;
      dot.material.color.copy(isSel ? colors.secondary : colors.primary);
      dot.scale.setScalar(isSel ? 1.55 + Math.sin(time * 6) * 0.25 : 0.92);
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
      rotY = 0.58;
      rotX = 0.06;
      targetCamZ = 5.2;
      loadAnimalModel(npc, stats);
      resize();
    },
    setActiveZone(zoneKey) {
      activeZone = zoneKey;
    },
    toggleRenderMode() {
      renderMode = renderMode === "real" ? "holo" : "real";
      applyCurrentRenderMode();
      return renderMode;
    },
    resize
  };
}