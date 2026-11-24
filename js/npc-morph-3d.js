// js/npc-morph-3d.js — Model 3D Người Thật (Rocketbox MIT) + Thú Nhân (Tai/Đuôi) + Động Vật (Fox/Parrot/Horse)

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.164.1/examples/jsm/loaders/GLTFLoader.js";

const SPECIES_MODEL_URLS = {
  male: [
    "https://cdn.jsdelivr.net/gh/927tanmay/react-ai-voice-avatar@main/assets/avatars/aarav.glb",
    "https://raw.githubusercontent.com/927tanmay/react-ai-voice-avatar/main/assets/avatars/aarav.glb",
    "https://cdn.jsdelivr.net/gh/mrdoob/three.js@r164/examples/models/gltf/Soldier.glb"
  ],
  female: [
    "https://cdn.jsdelivr.net/gh/927tanmay/react-ai-voice-avatar@main/assets/avatars/ananya.glb",
    "https://raw.githubusercontent.com/927tanmay/react-ai-voice-avatar/main/assets/avatars/ananya.glb",
    "https://cdn.jsdelivr.net/gh/mrdoob/three.js@r164/examples/models/gltf/Michelle.glb"
  ],
  fox: [
    "https://cdn.jsdelivr.net/gh/KhronosGroup/glTF-Sample-Assets@main/Models/Fox/glTF-Binary/Fox.glb",
    "https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Fox/glTF-Binary/Fox.glb"
  ],
  bird: [
    "https://cdn.jsdelivr.net/gh/mrdoob/three.js@r164/examples/models/gltf/Parrot.glb",
    "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Parrot.glb"
  ],
  horse: [
    "https://cdn.jsdelivr.net/gh/mrdoob/three.js@r164/examples/models/gltf/Horse.glb",
    "https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/Horse.glb"
  ]
};

export function initNpcMorph3D({ canvasId, onProjectZones, onSelectZone }) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return { preload: () => {}, setSubject: () => {}, setActiveZone: () => {}, setRenderMode: () => {}, resize: () => {} };

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 60);
  camera.position.set(0, 0.1, 5.4);
  camera.lookAt(0, -0.05, 0);

  function getPalette() {
    const s = getComputedStyle(document.documentElement);
    return {
      primary: new THREE.Color(s.getPropertyValue("--c-primary").trim() || "#00E5FF"),
      secondary: new THREE.Color(s.getPropertyValue("--c-secondary").trim() || "#5EA8FF")
    };
  }
  let colors = getPalette();

  // Ánh sáng Studio + Rim Light tương lai
  scene.add(new THREE.HemisphereLight(0xeefaff, 0x081326, 1.15));
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.45);
  keyLight.position.set(2.5, 4.5, 4.5);
  scene.add(keyLight);

  const rimPrimary = new THREE.DirectionalLight(colors.primary, 2.4);
  rimPrimary.position.set(-3.8, 2.4, -3.5);
  scene.add(rimPrimary);

  const rimSecondary = new THREE.DirectionalLight(colors.secondary, 2.0);
  rimSecondary.position.set(3.8, -0.5, -3.0);
  scene.add(rimSecondary);

  // Bệ đứng quang học
  const floorGroup = new THREE.Group();
  floorGroup.position.y = -1.42;
  scene.add(floorGroup);

  const ringOuter = new THREE.Mesh(
    new THREE.RingGeometry(1.06, 1.09, 72),
    new THREE.MeshBasicMaterial({ color: colors.primary, side: THREE.DoubleSide, transparent: true, opacity: 0.62 })
  );
  ringOuter.rotation.x = Math.PI / 2;
  floorGroup.add(ringOuter);

  const ringInner = new THREE.Mesh(
    new THREE.RingGeometry(0.64, 0.66, 56),
    new THREE.MeshBasicMaterial({ color: colors.secondary, side: THREE.DoubleSide, transparent: true, opacity: 0.52 })
  );
  ringInner.rotation.x = Math.PI / 2;
  floorGroup.add(ringInner);

  const floorGrid = new THREE.GridHelper(4.4, 16, colors.primary, colors.primary);
  floorGrid.material.transparent = true;
  floorGrid.material.opacity = 0.16;
  floorGroup.add(floorGrid);

  const scanHalo = new THREE.Mesh(
    new THREE.TorusGeometry(0.84, 0.007, 8, 64),
    new THREE.MeshBasicMaterial({ color: colors.secondary, transparent: true, opacity: 0.55 })
  );
  scanHalo.rotation.x = Math.PI / 2;
  scene.add(scanHalo);

  const bodyGroup = new THREE.Group();
  scene.add(bodyGroup);

  const holoUniforms = {
    uHoloTime: { value: 0 },
    uHoloColor: { value: colors.primary.clone() }
  };

  let renderMode = "holo"; // "holo" | "real"
  const loader = new GLTFLoader();
  const modelCache = new Map(); // Cache theo URL key để chuyển đổi tức thì
  let activeModel = null;
  let activeCacheKey = "";
  let mixer = null;
  let boneMap = {};
  let currentStats = {};
  let beastExtras = { ears: null, tail: null, tailBaseRotY: 0 };
  let fallbackWorldAnchors = {};

  const loadingHud = document.getElementById("lab-morph-loading");
  const liveHud = document.getElementById("lab-morph-live-hud");

  function setLoadingHud(show, text = "") {
    if (!loadingHud) return;
    loadingHud.classList.toggle("hidden", !show);
    if (text) loadingHud.textContent = text;
  }

  function createHoloClonedMaterial(origMat) {
    if (!origMat) {
      return new THREE.MeshStandardMaterial({ color: 0x6ac8e6, roughness: 0.35, metalness: 0.4 });
    }
    const holoMat = origMat.clone();
    // Giữ nguyên map/normalMap/alphaTest của người thật để mắt/tóc không bị lỗi
    if (holoMat.color) holoMat.color.lerp(new THREE.Color(0x88e6ff), 0.58);
    if ("emissive" in holoMat) {
      holoMat.emissive = colors.primary.clone();
      holoMat.emissiveIntensity = 0.2;
    }
    if ("roughness" in holoMat) holoMat.roughness = 0.32;
    if ("metalness" in holoMat) holoMat.metalness = 0.25;

    holoMat.onBeforeCompile = (shader) => {
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
          `float fresnelRim = pow(1.0 - clamp(abs(dot(normalize(normal), normalize(vViewPosition))), 0.0, 1.0), 2.5);
           float scanBand = pow(sin(vViewPosition.y * 34.0 + uHoloTime * 4.0) * 0.5 + 0.5, 6.0);
           gl_FragColor.rgb += uHoloColor * (fresnelRim * 0.92 + scanBand * 0.16);
           #include <dithering_fragment>`
        );
    };
    return holoMat;
  }

  function applyShaderModeToModel(model) {
    if (!model) return;
    model.traverse((obj) => {
      if (!obj.isMesh) return;
      if (!obj.userData.origMat) obj.userData.origMat = obj.material;
      if (!obj.userData.holoMat) {
        obj.userData.holoMat = Array.isArray(obj.userData.origMat)
          ? obj.userData.origMat.map(createHoloClonedMaterial)
          : createHoloClonedMaterial(obj.userData.origMat);
      }
      obj.material = renderMode === "holo" ? obj.userData.holoMat : obj.userData.origMat;
      obj.frustumCulled = false;
    });
  }

  function findBone(root, names) {
    for (const n of names) {
      const exact = root.getObjectByName(n);
      if (exact) return exact;
    }
    let found = null;
    root.traverse((obj) => {
      if (found) return;
      const nm = (obj.name || "").toLowerCase();
      if (names.some((k) => nm.includes(k.toLowerCase()))) found = obj;
    });
    return found;
  }

  // Tạo bộ Tai & Đuôi Thú Nhân gắn thẳng vào xương Đầu & Hông của Người Thật
  function buildKemonomimiAttachments(headBone, hipsBone, modelScale) {
    removeKemonomimiAttachments();
    if (!headBone) return;

    const earMat = new THREE.MeshStandardMaterial({
      color: colors.primary,
      emissive: colors.primary,
      emissiveIntensity: 0.75,
      transparent: true,
      opacity: 0.85,
      roughness: 0.25
    });
    const innerMat = new THREE.MeshBasicMaterial({ color: colors.secondary, transparent: true, opacity: 0.9 });

    // Tính tỷ lệ cục bộ của xương đầu (một số model dùng mét 1.0, số khác dùng cm 0.01)
    const worldScale = new THREE.Vector3();
    headBone.getWorldScale(worldScale);
    const invS = 1 / Math.max(0.005, worldScale.y || modelScale || 1);

    const earsGrp = new THREE.Group();
    [-1, 1].forEach((side) => {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.055 * invS, 0.14 * invS, 4), earMat);
      ear.position.set(side * 0.08 * invS, 0.16 * invS, 0.01 * invS);
      ear.rotation.z = -side * 0.34;
      ear.rotation.x = 0.18;

      const inner = new THREE.Mesh(new THREE.ConeGeometry(0.03 * invS, 0.09 * invS, 4), innerMat);
      inner.position.set(0, -0.01 * invS, 0.014 * invS);
      ear.add(inner);
      earsGrp.add(ear);
    });
    headBone.add(earsGrp);
    beastExtras.ears = earsGrp;

    if (hipsBone) {
      const hipScale = new THREE.Vector3();
      hipsBone.getWorldScale(hipScale);
      const hInv = 1 / Math.max(0.005, hipScale.y || modelScale || 1);
      const tailCurve = new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, -0.06 * hInv),
        new THREE.Vector3(0, -0.05 * hInv, -0.25 * hInv),
        new THREE.Vector3(0.08 * hInv, 0.04 * hInv, -0.45 * hInv),
        new THREE.Vector3(0.02 * hInv, 0.22 * hInv, -0.58 * hInv)
      ]);
      const tailGeo = new THREE.TubeGeometry(tailCurve, 18, 0.036 * hInv, 10, false);
      const tailMesh = new THREE.Mesh(tailGeo, earMat);
      hipsBone.add(tailMesh);
      beastExtras.tail = tailMesh;
    }
  }

  function removeKemonomimiAttachments() {
    if (beastExtras.ears?.parent) beastExtras.ears.parent.remove(beastExtras.ears);
    if (beastExtras.tail?.parent) beastExtras.tail.parent.remove(beastExtras.tail);
    beastExtras = { ears: null, tail: null };
  }

  function resolveModelSpec(stats) {
    if (stats?.modelUrl?.trim()) {
      return { cacheKey: stats.modelUrl.trim(), urls: [stats.modelUrl.trim()], isAnimal: false };
    }
    const sp = (stats?.species || "Người").toLowerCase();
    if (sp.includes("cáo")) return { cacheKey: "fox", urls: SPECIES_MODEL_URLS.fox, isAnimal: true };
    if (sp.includes("quạ") || sp.includes("chim")) return { cacheKey: "bird", urls: SPECIES_MODEL_URLS.bird, isAnimal: true };
    if (sp.includes("ngựa") || sp.includes("mã")) return { cacheKey: "horse", urls: SPECIES_MODEL_URLS.horse, isAnimal: true };

    const isFemale = (stats?.gender || "").includes("Nữ");
    return isFemale
      ? { cacheKey: "female", urls: SPECIES_MODEL_URLS.female, isAnimal: false }
      : { cacheKey: "male", urls: SPECIES_MODEL_URLS.male, isAnimal: false };
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

  async function showModelForStats(stats) {
    currentStats = stats || {};
    const spec = resolveModelSpec(currentStats);

    let entry = modelCache.get(spec.cacheKey);
    if (!entry) {
      setLoadingHud(true, "ĐANG KẾT NỐI MÔ HÌNH 3D...");
      let gltf = null;
      for (const u of spec.urls) {
        try {
          gltf = await loadSingleUrl(u);
          break;
        } catch (_) {}
      }
      setLoadingHud(false);
      if (!gltf) return;

      const model = gltf.scene;
      model.scale.setScalar(1);
      model.position.set(0, 0, 0);
      const rawBox = new THREE.Box3().setFromObject(model);
      const rawSize = rawBox.getSize(new THREE.Vector3());
      const targetRefHeight = spec.isAnimal ? (spec.cacheKey === "bird" ? 1.55 : 1.75) : 2.65;
      const baseScale = targetRefHeight / (rawSize.y || 1.75);

      model.scale.setScalar(baseScale);
      const fittedBox = new THREE.Box3().setFromObject(model);
      const fittedCenter = fittedBox.getCenter(new THREE.Vector3());

      model.userData.baseScale = baseScale;
      model.userData.baseOffsetX = -fittedCenter.x;
      model.userData.baseOffsetZ = -fittedCenter.z;
      model.userData.minY = fittedBox.min.y;
      model.userData.isAnimal = spec.isAnimal;

      entry = { model, animations: gltf.animations || [], spec };
      modelCache.set(spec.cacheKey, entry);
    }

    // Ẩn model cũ, gắn model mới
    if (activeModel && activeModel !== entry.model) {
      removeKemonomimiAttachments();
      bodyGroup.remove(activeModel);
    }

    activeModel = entry.model;
    activeCacheKey = spec.cacheKey;
    if (!activeModel.parent) bodyGroup.add(activeModel);

    applyShaderModeToModel(activeModel);
    applyProportionsAndBones(entry, currentStats);
  }

  function applyProportionsAndBones(entry, stats) {
    const model = entry.model;
    const isAnimal = entry.spec.isAnimal;

    const h = Math.max(145, Math.min(215, Number(stats?.heightCm) || 175));
    const w = Number(stats?.weightKg);
    const bmi = w > 0 ? w / Math.pow(h / 100, 2) : 21;

    // Co giãn chiều cao & độ rộng thật so với chuẩn 175cm (từ 1m55 đến 1m98 nhìn khác biệt rõ rệt!)
    const hRatio = isAnimal ? 1.0 : Math.max(0.84, Math.min(1.16, h / 175));
    const wRatio = isAnimal ? 1.0 : Math.max(0.88, Math.min(1.18, Math.sqrt(bmi / 21)));
    const bs = model.userData.baseScale || 1;

    model.scale.set(bs * wRatio, bs * hRatio, bs * wRatio);

    // Đặt chân chạm đúng bệ y = -1.41
    const tempBox = new THREE.Box3().setFromObject(model);
    const dy = -1.41 - tempBox.min.y;
    const ctr = tempBox.getCenter(new THREE.Vector3());
    model.position.x += -ctr.x;
    model.position.z += -ctr.z;
    model.position.y += dy;

    const finalBox = new THREE.Box3().setFromObject(model);
    const sz = finalBox.getSize(new THREE.Vector3());

    // Tìm xương để gắn tia chỉ điểm (cả người lẫn động vật)
    boneMap = {
      head: findBone(model, ["Head", "mixamorigHead", "b_Head"]),
      chest: findBone(model, ["Spine2", "mixamorigSpine2", "Spine1", "b_Neck"]),
      hand: findBone(model, ["LeftHand", "mixamorigLeftHand", "b_FrontLeg"]),
      stance: findBone(model, ["RightLeg", "RightUpLeg", "mixamorigRightLeg", "b_BackLeg"]),
      hips: findBone(model, ["Hips", "mixamorigHips", "Spine"])
    };

    fallbackWorldAnchors = {
      head: new THREE.Vector3(0, finalBox.min.y + sz.y * 0.88, sz.z * 0.28),
      chest: new THREE.Vector3(0, finalBox.min.y + sz.y * 0.62, sz.z * 0.25),
      hand: new THREE.Vector3(-sz.x * 0.34, finalBox.min.y + sz.y * 0.45, sz.z * 0.14),
      stance: new THREE.Vector3(sz.x * 0.16, finalBox.min.y + sz.y * 0.25, sz.z * 0.15)
    };

    // Gắn Tai & Đuôi nếu là Thú Nhân
    if (!isAnimal && (stats?.species || "").includes("Thú nhân")) {
      buildKemonomimiAttachments(boneMap.head, boneMap.hips, bs * hRatio);
    } else {
      removeKemonomimiAttachments();
    }

    // Chạy Animation nếu model có sẵn clip (Fox / Parrot / Horse / Soldier)
    if (mixer) {
      mixer.stopAllAction();
      mixer = null;
    }
    if (entry.animations.length > 0) {
      mixer = new THREE.AnimationMixer(model);
      const clip = entry.animations.find((a) => /idle|survey|stand/i.test(a.name)) || entry.animations[0];
      mixer.clipAction(clip).play();
    }
  }

  // 4 điểm neo chỉ điểm siêu mảnh
  const zoneKeys = ["head", "chest", "hand", "stance"];
  const hotspotDots = {};
  const hotspotPickers = [];

  zoneKeys.forEach((key) => {
    const dot = new THREE.Mesh(
      new THREE.SphereGeometry(0.025, 10, 10),
      new THREE.MeshBasicMaterial({ color: colors.secondary, transparent: true, opacity: 0.95 })
    );
    dot.userData = { zoneKey: key };
    scene.add(dot);
    hotspotDots[key] = dot;
    hotspotPickers.push(dot);
  });

  // Xoay 360 độ + Zoom chuột
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
    targetCamZ = Math.max(3.4, Math.min(7.8, targetCamZ + e.deltaY * 0.003));
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
    holoUniforms.uHoloColor.value.copy(colors.primary);
    modelCache.forEach((entry) => {
      entry.model.traverse((obj) => {
        if (obj.userData?.holoMat && !Array.isArray(obj.userData.holoMat) && obj.userData.holoMat.emissive) {
          obj.userData.holoMat.emissive.copy(colors.primary);
        }
      });
    });
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  const clock = new THREE.Clock();
  const tmpVec = new THREE.Vector3();
  const projVec = new THREE.Vector3();
  let time = 0;

  function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(0.05, clock.getDelta());
    time += dt;
    holoUniforms.uHoloTime.value = time;

    if (mixer) {
      mixer.update(dt);
    } else if (activeModel && !activeModel.userData.isAnimal) {
      // Cử động thở nhẹ tự nhiên cho model người thật không có sẵn clip idle
      if (boneMap.chest) boneMap.chest.rotation.x = Math.sin(time * 1.8) * 0.018;
      if (boneMap.head) boneMap.head.rotation.y = Math.sin(time * 0.8) * 0.045;
    }

    if (beastExtras.tail) {
      beastExtras.tail.rotation.y = Math.sin(time * 3.2) * 0.24;
    }

    if (!isDragging) {
      rotY += velY + 0.0045;
      velY *= 0.92;
    }
    camera.position.z += (targetCamZ - camera.position.z) * 0.12;
    bodyGroup.rotation.y = rotY;
    bodyGroup.rotation.x = rotX;
    floorGroup.rotation.y = -time * 0.16;
    scanHalo.position.y = Math.sin(time * 1.1) * 1.25 - 0.1;

    if (liveHud) {
      const deg = Math.round(((rotY * 180 / Math.PI) % 360 + 360) % 360);
      const spLabel = (currentStats?.species || "NGƯỜI").toUpperCase();
      liveHud.textContent = `${spLabel} • ${String(deg).padStart(3, "0")}° • ${(5.4 / camera.position.z).toFixed(1)}x`;
    }

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
        tmpVec.copy(fallbackWorldAnchors[key] || new THREE.Vector3()).applyMatrix4(bodyGroup.matrixWorld);
      }
      dot.position.copy(tmpVec);
      const isSel = key === activeZone;
      dot.material.color.copy(isSel ? colors.secondary : colors.primary);
      dot.scale.setScalar(isSel ? 1.4 + Math.sin(time * 6) * 0.22 : 0.72);

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
      showModelForStats({ gender: "Nam", species: "Người", heightCm: 188, weightKg: 76 });
    },
    setSubject(npc, stats) {
      activeZone = "head";
      rotY = 0.24;
      rotX = 0.03;
      targetCamZ = 5.4;
      showModelForStats(stats);
      resize();
    },
    setActiveZone(zoneKey) {
      activeZone = zoneKey;
    },
    setRenderMode(mode) {
      renderMode = mode === "real" ? "real" : "holo";
      if (activeModel) applyShaderModeToModel(activeModel);
      return renderMode;
    },
    resize
  };
}