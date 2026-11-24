// js/npc-morph-3d.js — Model 3D Người Chuẩn Studio (GLTFLoader + Xbot.glb + Fresnel Holo Shader + Mixamo Bone Callouts)

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/loaders/GLTFLoader.js";

const DEFAULT_MODEL_URLS = [
  "https://cdn.jsdelivr.net/gh/mrdoob/three.js@r164/examples/models/gltf/Xbot.glb",
  "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Xbot.glb"
];

export function initNpcMorph3D({ canvasId, onProjectZones, onSelectZone }) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return { preload: () => {}, setSubject: () => {}, setActiveZone: () => {}, resize: () => {} };

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
  camera.position.set(0, 0.12, 5.4);
  camera.lookAt(0, -0.04, 0);

  function getPalette() {
    const s = getComputedStyle(document.documentElement);
    return {
      primary: new THREE.Color(s.getPropertyValue("--c-primary").trim() || "#00E5FF"),
      secondary: new THREE.Color(s.getPropertyValue("--c-secondary").trim() || "#5EA8FF")
    };
  }
  let colors = getPalette();

  // HỆ THỐNG ĐÈN STUDIO + RIM LIGHT TƯƠNG LAI
  const hemiLight = new THREE.HemisphereLight(0xdbf6ff, 0x040b18, 0.9);
  scene.add(hemiLight);

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.35);
  keyLight.position.set(2.8, 4.5, 4.2);
  scene.add(keyLight);

  const rimPrimary = new THREE.DirectionalLight(colors.primary, 2.6);
  rimPrimary.position.set(-3.8, 2.2, -3.5);
  scene.add(rimPrimary);

  const rimSecondary = new THREE.DirectionalLight(colors.secondary, 2.2);
  rimSecondary.position.set(3.6, -0.8, -3.0);
  scene.add(rimSecondary);

  // BỆ ĐỠ QUỸ ĐẠO QUANG HỌC BÊN DƯỚI
  const floorGroup = new THREE.Group();
  floorGroup.position.y = -1.48;
  scene.add(floorGroup);

  const ringOuter = new THREE.Mesh(
    new THREE.RingGeometry(1.06, 1.09, 72),
    new THREE.MeshBasicMaterial({ color: colors.primary, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
  );
  ringOuter.rotation.x = Math.PI / 2;
  floorGroup.add(ringOuter);

  const ringInner = new THREE.Mesh(
    new THREE.RingGeometry(0.64, 0.66, 56),
    new THREE.MeshBasicMaterial({ color: colors.secondary, side: THREE.DoubleSide, transparent: true, opacity: 0.55 })
  );
  ringInner.rotation.x = Math.PI / 2;
  floorGroup.add(ringInner);

  const floorGrid = new THREE.GridHelper(4.4, 16, colors.primary, colors.primary);
  floorGrid.material.transparent = true;
  floorGrid.material.opacity = 0.16;
  floorGroup.add(floorGrid);

  // TIA QUÉT LASER DỌC CƠ THỂ
  const scanHalo = new THREE.Mesh(
    new THREE.TorusGeometry(0.84, 0.008, 8, 64),
    new THREE.MeshBasicMaterial({ color: colors.secondary, transparent: true, opacity: 0.58 })
  );
  scanHalo.rotation.x = Math.PI / 2;
  scene.add(scanHalo);

  const bodyGroup = new THREE.Group();
  scene.add(bodyGroup);

  // VẬT LIỆU CÔNG NGHỆ TƯƠNG LAI CHO MODEL GLB (GIỮ NGUYÊN SKINNING XƯƠNG)
  const holoUniforms = {
    uHoloTime: { value: 0 },
    uHoloColor: { value: colors.primary.clone() }
  };

  const surfaceMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0x0a1c30),
    emissive: colors.primary.clone(),
    emissiveIntensity: 0.22,
    metalness: 0.72,
    roughness: 0.24,
    clearcoat: 0.9,
    clearcoatRoughness: 0.18,
    transparent: true,
    opacity: 0.9
  });

  surfaceMat.onBeforeCompile = (shader) => {
    shader.uniforms.uHoloTime = holoUniforms.uHoloTime;
    shader.uniforms.uHoloColor = holoUniforms.uHoloColor;
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
         uniform float uHoloTime;
         uniform vec3 uHoloColor;`
      )
      .replace(
        "#include <dithering_fragment>",
        `float fresnelRim = pow(1.0 - clamp(abs(dot(normalize(normal), normalize(vViewPosition))), 0.0, 1.0), 2.35);
         float scanBand = pow(sin(vViewPosition.y * 38.0 + uHoloTime * 4.2) * 0.5 + 0.5, 5.0);
         gl_FragColor.rgb += uHoloColor * (fresnelRim * 1.15 + scanBand * 0.22);
         #include <dithering_fragment>`
      );
  };

  const jointsMat = new THREE.MeshStandardMaterial({
    color: colors.secondary.clone(),
    emissive: colors.secondary.clone(),
    emissiveIntensity: 1.25,
    metalness: 0.45,
    roughness: 0.2
  });

  const loader = new GLTFLoader();
  let gltfModel = null;
  let mixer = null;
  let boneMap = {};
  let modelLoadingPromise = null;
  let activeUrlLoaded = null;
  let currentStats = {};

  const loadingHud = document.getElementById("lab-morph-loading");
  const liveHud = document.getElementById("lab-morph-live-hud");

  function setLoadingHud(show, text = "") {
    if (!loadingHud) return;
    loadingHud.classList.toggle("hidden", !show);
    if (text) loadingHud.textContent = text;
  }

  async function loadSingleUrl(url) {
    return new Promise((resolve, reject) => {
      loader.load(
        url,
        (gltf) => resolve(gltf),
        (xhr) => {
          if (xhr.total > 0) {
            const pct = Math.min(99, Math.round((xhr.loaded / xhr.total) * 100));
            setLoadingHud(true, `ĐANG TẢI MODEL 3D... ${pct}%`);
          }
        },
        (err) => reject(err)
      );
    });
  }

  async function ensureModelLoaded(customUrl = "") {
    const targetUrl = (customUrl || "").trim() || DEFAULT_MODEL_URLS[0];
    if (gltfModel && activeUrlLoaded === targetUrl) return gltfModel;
    if (modelLoadingPromise && activeUrlLoaded === targetUrl) return modelLoadingPromise;

    activeUrlLoaded = targetUrl;
    setLoadingHud(true, "ĐANG KẾT NỐI MÔ HÌNH 3D...");

    modelLoadingPromise = (async () => {
      let gltf = null;
      const urlsToTry = customUrl?.trim() ? [customUrl.trim(), ...DEFAULT_MODEL_URLS] : DEFAULT_MODEL_URLS;

      for (const u of urlsToTry) {
        try {
          gltf = await loadSingleUrl(u);
          break;
        } catch (_) {
          // Thử URL dự phòng
        }
      }

      setLoadingHud(false);
      if (!gltf) return null;

      if (gltfModel) {
        bodyGroup.remove(gltfModel);
      }

      gltfModel = gltf.scene;
      gltfModel.traverse((obj) => {
        if (obj.isMesh) {
          const nm = (obj.name || "").toLowerCase();
          obj.material = nm.includes("joint") ? jointsMat : surfaceMat;
          obj.frustumCulled = false;
        }
      });

      // Căn kích thước chuẩn để chân chạm bệ -1.48
      gltfModel.scale.setScalar(1);
      gltfModel.position.set(0, 0, 0);
      const rawBox = new THREE.Box3().setFromObject(gltfModel);
      const rawSize = rawBox.getSize(new THREE.Vector3());
      const baseScale = 2.72 / (rawSize.y || 1.8);
      gltfModel.userData.baseScale = baseScale;
      gltfModel.scale.setScalar(baseScale);

      const fittedBox = new THREE.Box3().setFromObject(gltfModel);
      const fittedCenter = fittedBox.getCenter(new THREE.Vector3());
      gltfModel.userData.baseOffsetY = -1.47 - fittedBox.min.y;
      gltfModel.userData.baseOffsetX = -fittedCenter.x;
      gltfModel.userData.baseOffsetZ = -fittedCenter.z;
      gltfModel.position.set(gltfModel.userData.baseOffsetX, gltfModel.userData.baseOffsetY, gltfModel.userData.baseOffsetZ);

      bodyGroup.add(gltfModel);

      // Tìm xương Mixamo để gắn 4 tia chỉ điểm vùng
      boneMap = {
        head: gltfModel.getObjectByName("mixamorigHead") || gltfModel.getObjectByName("Head"),
        chest: gltfModel.getObjectByName("mixamorigSpine2") || gltfModel.getObjectByName("Spine2") || gltfModel.getObjectByName("Chest"),
        hand: gltfModel.getObjectByName("mixamorigLeftHand") || gltfModel.getObjectByName("LeftHand"),
        stance: gltfModel.getObjectByName("mixamorigRightLeg") || gltfModel.getObjectByName("RightLeg"),
        lShoulder: gltfModel.getObjectByName("mixamorigLeftShoulder"),
        rShoulder: gltfModel.getObjectByName("mixamorigRightShoulder"),
        hips: gltfModel.getObjectByName("mixamorigHips")
      };

      // Bật animation Idle thở tự nhiên nếu model có
      if (gltf.animations && gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(gltfModel);
        const idleClip = gltf.animations.find((a) => a.name.toLowerCase().includes("idle")) || gltf.animations[0];
        const action = mixer.clipAction(idleClip);
        action.play();
      }

      applyNpcProportions(currentStats);
      return gltfModel;
    })();

    return modelLoadingPromise;
  }

  function applyNpcProportions(stats) {
    currentStats = stats || {};
    if (!gltfModel) return;

    const h = Math.max(145, Math.min(215, Number(stats?.heightCm) || 178));
    const w = Number(stats?.weightKg);
    const bmi = w > 0 ? w / Math.pow(h / 100, 2) : 21;
    const isFemale = (stats?.gender || "").includes("Nữ");

    const hRatio = Math.max(0.86, Math.min(1.14, h / 178));
    const wRatio = Math.max(0.88, Math.min(1.18, Math.sqrt(bmi / 21))) * (isFemale ? 0.94 : 1.03);
    const bs = gltfModel.userData.baseScale || 1;

    gltfModel.scale.set(bs * wRatio, bs * hRatio, bs * wRatio);
    gltfModel.position.set(
      gltfModel.userData.baseOffsetX || 0,
      (gltfModel.userData.baseOffsetY || 0) * hRatio - 1.47 * (1 - hRatio),
      gltfModel.userData.baseOffsetZ || 0
    );
  }

  // Tạo 4 điểm neo nhẹ nhàng tinh tế bám theo xương
  const zoneKeys = ["head", "chest", "hand", "stance"];
  const hotspotDots = {};
  const hotspotPickers = [];

  zoneKeys.forEach((key) => {
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.032, 12, 12),
      new THREE.MeshBasicMaterial({ color: colors.secondary, transparent: true, opacity: 0.95 })
    );
    dot.userData = { zoneKey: key };
    scene.add(dot);
    hotspotDots[key] = dot;
    hotspotPickers.push(dot);
  });

  // XOAY 360 ĐỘ + ZOOM CHUỘT + CHỌN VÙNG TRỰC TIẾP
  let isDragging = false;
  let downX = 0, downY = 0, prevX = 0, prevY = 0, movedDist = 0;
  let rotY = 0.24, rotX = 0.03, velY = 0, targetCamZ = 5.4;
  let activeZone = "head";
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
      rotX = Math.max(-0.35, Math.min(0.35, rotX + dy * 0.006));
      prevX = e.clientX;
      prevY = e.clientY;
    }
    updatePointer(e);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(hotspotPickers, false);
    canvas.style.cursor = hits.length > 0 ? "pointer" : isDragging ? "grabbing" : "grab";
  });

  canvas.addEventListener("pointerup", (e) => {
    if (!isDragging) return;
    isDragging = false;
    if (movedDist < 7) {
      updatePointer(e);
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(hotspotPickers, false);
      if (hits.length > 0) {
        activeZone = hits[0].object.userData.zoneKey;
        onSelectZone?.(activeZone);
      }
    }
  });

  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    targetCamZ = Math.max(3.5, Math.min(7.8, targetCamZ + e.deltaY * 0.003));
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
    rimPrimary.color.copy(colors.primary);
    rimSecondary.color.copy(colors.secondary);
    ringOuter.material.color.copy(colors.primary);
    ringInner.material.color.copy(colors.secondary);
    floorGrid.material.color.copy(colors.primary);
    scanHalo.material.color.copy(colors.secondary);
    surfaceMat.emissive.copy(colors.primary);
    jointsMat.color.copy(colors.secondary);
    jointsMat.emissive.copy(colors.secondary);
    holoUniforms.uHoloColor.value.copy(colors.primary);
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  const clock = new THREE.Clock();
  const tmpVec = new THREE.Vector3();
  const projVec = new THREE.Vector3();
  const fallbackLocal = {
    head: new THREE.Vector3(0, 1.05, 0.1),
    chest: new THREE.Vector3(0, 0.45, 0.15),
    hand: new THREE.Vector3(0.45, -0.08, 0.08),
    stance: new THREE.Vector3(-0.18, -0.75, 0.1)
  };
  let time = 0;

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(0.05, clock.getDelta());
    time += dt;
    holoUniforms.uHoloTime.value = time;

    if (mixer) {
      mixer.update(dt);
      // Tinh chỉnh nhẹ vai/hông theo giới tính sau khi animation cập nhật
      if ((currentStats?.gender || "").includes("Nữ")) {
        if (boneMap.lShoulder) boneMap.lShoulder.scale.set(0.9, 1, 0.92);
        if (boneMap.rShoulder) boneMap.rShoulder.scale.set(0.9, 1, 0.92);
        if (boneMap.hips) boneMap.hips.scale.set(1.06, 1, 1.04);
      } else {
        if (boneMap.lShoulder) boneMap.lShoulder.scale.set(1, 1, 1);
        if (boneMap.rShoulder) boneMap.rShoulder.scale.set(1, 1, 1);
        if (boneMap.hips) boneMap.hips.scale.set(1, 1, 1);
      }
    }

    if (!isDragging) {
      rotY += velY + 0.0045;
      velY *= 0.92;
    }
    camera.position.z += (targetCamZ - camera.position.z) * 0.12;
    bodyGroup.rotation.y = rotY;
    bodyGroup.rotation.x = rotX;
    floorGroup.rotation.y = -time * 0.18;
    scanHalo.position.y = Math.sin(time * 1.1) * 1.35 - 0.1;

    if (liveHud) {
      const deg = Math.round(((rotY * 180 / Math.PI) % 360 + 360) % 360);
      const zoomX = (5.4 / camera.position.z).toFixed(1);
      liveHud.textContent = `AZIMUTH: ${String(deg).padStart(3, "0")}° • ZOOM: ${zoomX}x`;
    }

    // Cập nhật vị trí 4 điểm chỉ điểm theo xương thật của Xbot
    const projected = {};
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    zoneKeys.forEach((key) => {
      const bone = boneMap[key];
      const dot = hotspotDots[key];
      if (bone) {
        bone.updateWorldMatrix(true, false);
        bone.getWorldPosition(tmpVec);
      } else {
        bodyGroup.updateWorldMatrix(true, false);
        tmpVec.copy(fallbackLocal[key]).applyMatrix4(bodyGroup.matrixWorld);
      }
      dot.position.copy(tmpVec);
      const isSel = key === activeZone;
      dot.material.color.copy(isSel ? colors.secondary : colors.primary);
      dot.scale.setScalar(isSel ? 1.45 + Math.sin(time * 6) * 0.22 : 0.78);

      if (w > 0 && h > 0) {
        projVec.copy(tmpVec).project(camera);
        projected[key] = {
          x: (projVec.x * 0.5 + 0.5) * w,
          y: (-projVec.y * 0.5 + 0.5) * h
        };
      }
    });

    if (onProjectZones && w > 0) onProjectZones(projected);
    renderer.render(scene, camera);
  }

  resize();
  animate();

  return {
    preload() {
      ensureModelLoaded();
    },
    setSubject(npc, stats) {
      activeZone = "head";
      rotY = 0.24;
      rotX = 0.03;
      targetCamZ = 5.4;
      currentStats = stats || {};
      ensureModelLoaded(stats?.modelUrl || "").then(() => applyNpcProportions(stats));
      resize();
    },
    setActiveZone(zoneKey) {
      activeZone = zoneKey;
    },
    resize
  };
}