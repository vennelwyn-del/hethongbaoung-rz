// js/sys-mascot-3d.js — Hệ Thống 00 3D bay chậm nhẹ nhàng trong góc dưới-phải màn hình

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { createHoloMaterial } from "./holo-shader.js";

export function initSystemMascot3D({ canvasId, onProjectScreen, onScreenBonk }) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) {
    return {
      triggerStunt: () => {},
      setEnabled: () => {},
      isEnabled: () => false
    };
  }

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 60);
  camera.position.set(0, 0, 12);

  function getPalette() {
    const s = getComputedStyle(document.documentElement);
    return {
      primary: new THREE.Color(s.getPropertyValue("--c-primary").trim() || "#00E5FF"),
      secondary: new THREE.Color(s.getPropertyValue("--c-secondary").trim() || "#5EA8FF")
    };
  }
  let colors = getPalette();

  const ambient = new THREE.AmbientLight(0xffffff, 1.5);
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
  keyLight.position.set(4, 6, 6);
  const rimLight = new THREE.DirectionalLight(colors.primary, 2.6);
  rimLight.position.set(-4, 2, -3);
  scene.add(ambient, keyLight, rimLight);

  const mascotGroup = new THREE.Group();
  scene.add(mascotGroup);

  const haloRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.72, 0.018, 8, 48),
    new THREE.MeshBasicMaterial({ color: colors.primary, transparent: true, opacity: 0.65 })
  );
  haloRing.rotation.x = Math.PI / 2.2;
  mascotGroup.add(haloRing);

  // Model dự phòng nhỏ gọn khi đang tải GLB
  const fallbackGroup = new THREE.Group();
  const coreMesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.32, 0),
    createHoloMaterial(`#${colors.primary.getHexString()}`, 0.85)
  );
  const wingGeo = new THREE.BoxGeometry(0.55, 0.03, 0.22);
  const wingMat = new THREE.MeshBasicMaterial({ color: colors.secondary, wireframe: true });
  const wingL = new THREE.Mesh(wingGeo, wingMat);
  const wingR = new THREE.Mesh(wingGeo, wingMat);
  wingL.position.x = -0.38;
  wingR.position.x = 0.38;
  fallbackGroup.add(coreMesh, wingL, wingR);
  mascotGroup.add(fallbackGroup);

  let mixer = null;
  let gltfWrapper = null;
  const loader = new GLTFLoader();
  loader.setCrossOrigin("anonymous");

  const storkUrls = [
    "https://threejs.org/examples/models/gltf/Stork.glb",
    "https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/models/gltf/Stork.glb"
  ];

  (async function loadStork() {
    for (const url of storkUrls) {
      try {
        const gltf = await new Promise((resolve, reject) => loader.load(url, resolve, undefined, reject));
        const obj = gltf.scene;
        const box = new THREE.Box3().setFromObject(obj);
        const sz = box.getSize(new THREE.Vector3());
        const ct = box.getCenter(new THREE.Vector3());
        const scale = 1.22 / (Math.max(sz.x, sz.y, sz.z) || 1);

        const wrap = new THREE.Group();
        obj.scale.setScalar(scale);
        obj.position.set(-ct.x * scale, -ct.y * scale, -ct.z * scale);
        wrap.add(obj);

        mascotGroup.remove(fallbackGroup);
        mascotGroup.add(wrap);
        gltfWrapper = wrap;

        if (gltf.animations?.length) {
          mixer = new THREE.AnimationMixer(obj);
          const act = mixer.clipAction(gltf.animations[0]);
          act.timeScale = 0.62; // Đập cánh thong thả, êm mắt
          act.play();
        }
        return;
      } catch (_) {}
    }
  })();

  // Tính tọa độ neo tại GÓC DƯỚI-PHẢI theo tỷ lệ màn hình thực tế
  function getCornerAnchor() {
    const aspect = window.innerWidth / Math.max(1, window.innerHeight);
    const halfH = 12 * Math.tan(THREE.MathUtils.degToRad(45 * 0.5)); // ~4.97
    const halfW = halfH * aspect;
    return {
      cx: halfW * 0.78,
      cy: -halfH * 0.70
    };
  }

  function pickCornerPoint() {
    const { cx, cy } = getCornerAnchor();
    return new THREE.Vector3(
      cx + (Math.random() - 0.5) * 0.9,
      cy + (Math.random() - 0.5) * 0.55,
      0.5 + Math.random() * 1.1
    );
  }

  let enabled = true;
  let mode = "patrol";
  let modeTimer = 0;
  let bonkFired = false;
  let extraRoll = 0;

  const initCorner = getCornerAnchor();
  const pos = new THREE.Vector3(initCorner.cx, initCorner.cy, 0.8);
  const vel = new THREE.Vector3(-0.01, 0.005, 0);
  const target = pickCornerPoint();

  function triggerStunt(forcedMode = null) {
    if (!enabled) return;
    const pool = ["patrol", "hover_peek", "barrel_roll"];
    mode = forcedMode || pool[Math.floor(Math.random() * pool.length)];
    modeTimer = 0;
    bonkFired = false;
    extraRoll = 0;

    const { cx, cy } = getCornerAnchor();
    if (mode === "dive_bonk") {
      // Chỉ đâm nhẹ ngay trong góc dưới-phải khi người dùng chọc vào
      pos.set(cx - 0.4, cy + 0.3, -1.5);
      target.set(cx - 0.2, cy + 0.15, 7.6);
    } else if (mode === "barrel_roll") {
      target.set(cx - 0.3, cy + 0.25, 1.4);
    } else if (mode === "mission_swoop" || mode === "hover_peek") {
      target.set(cx - 0.25, cy + 0.35, 1.8);
    } else if (mode === "glitch_drop") {
      target.set(cx, cy - 0.45, 1.0);
    } else {
      target.copy(pickCornerPoint());
    }
  }

  // Tự chuyển động nhẹ nhàng trong góc mỗi 12 giây (không tự đâm màn hình làm phiền)
  setInterval(() => {
    if (!enabled || mode === "dizzy" || mode === "dive_bonk") return;
    if (Math.random() < 0.35) triggerStunt("hover_peek");
    else if (Math.random() < 0.55) triggerStunt("barrel_roll");
    else triggerStunt("patrol");
  }, 12000);

  const observer = new MutationObserver(() => {
    colors = getPalette();
    rimLight.color.copy(colors.primary);
    haloRing.material.color.copy(colors.primary);
    wingMat.color.copy(colors.secondary);
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  const projVec = new THREE.Vector3();
  const clock = new THREE.Clock();
  let time = 0;

  function animate() {
    requestAnimationFrame(animate);
    if (!enabled) {
      renderer.clear();
      return;
    }

    const dt = Math.min(0.05, clock.getDelta());
    time += dt;
    modeTimer += dt;

    if (mixer) mixer.update(dt * (mode === "dive_bonk" ? 1.35 : mode === "dizzy" ? 0.3 : 0.62));
    haloRing.rotation.z += 0.012;

    if (!gltfWrapper) {
      wingL.rotation.z = Math.sin(time * 6.5) * 0.42;
      wingR.rotation.z = -Math.sin(time * 6.5) * 0.42;
      coreMesh.material.uniforms.uTime.value = time;
      coreMesh.material.uniforms.uColor.value.copy(colors.primary);
    }

    if (mode === "dive_bonk") {
      const toT = target.clone().sub(pos);
      if (toT.length() > 0.3) {
        vel.lerp(toT.normalize().multiplyScalar(0.16), 0.12);
        pos.add(vel);
      }
      if (pos.z >= 7.0 && !bonkFired) {
        bonkFired = true;
        mode = "dizzy";
        modeTimer = 0;
        vel.set(-0.04, 0.03, -0.15);

        mascotGroup.position.copy(pos);
        mascotGroup.updateMatrixWorld(true);
        projVec.copy(pos).project(camera);
        const sx = (projVec.x * 0.5 + 0.5) * window.innerWidth;
        const sy = (-projVec.y * 0.5 + 0.5) * window.innerHeight;
        onScreenBonk?.(sx, sy);
      }
    } else if (mode === "dizzy") {
      pos.add(vel);
      vel.multiplyScalar(0.92);
      extraRoll += 0.14;
      if (modeTimer > 1.3) {
        mode = "patrol";
        extraRoll = 0;
        target.copy(pickCornerPoint());
      }
    } else if (mode === "barrel_roll") {
      pos.lerp(target, 0.035);
      extraRoll += 0.085;
      if (modeTimer > 2.4) {
        mode = "patrol";
        extraRoll = 0;
        target.copy(pickCornerPoint());
      }
    } else if (mode === "hover_peek" || mode === "mission_swoop" || mode === "glitch_drop") {
      const hoverT = target.clone();
      hoverT.y += Math.sin(time * 1.8) * 0.16;
      pos.lerp(hoverT, 0.035);
      extraRoll *= 0.9;
      if (modeTimer > 6.0) {
        mode = "patrol";
        target.copy(pickCornerPoint());
      }
    } else {
      // Bay lượn chậm rãi quanh góc dưới-phải
      const toT = target.clone().sub(pos);
      if (toT.length() < 0.35) target.copy(pickCornerPoint());
      const desired = toT.normalize().multiplyScalar(0.016);
      desired.y += Math.sin(time * 1.4) * 0.004;
      vel.lerp(desired, 0.03);
      pos.add(vel);
      extraRoll *= 0.9;
    }

    mascotGroup.position.copy(pos);

    if (mode === "hover_peek" || mode === "mission_swoop") {
      // Hướng nhẹ mặt vào bên trong web cho dễ nhìn
      mascotGroup.rotation.y += (-0.65 + Math.sin(time * 0.9) * 0.18 - mascotGroup.rotation.y) * 0.06;
      mascotGroup.rotation.x += (0.04 - mascotGroup.rotation.x) * 0.06;
      mascotGroup.rotation.z += (extraRoll - mascotGroup.rotation.z) * 0.08;
    } else if (mode === "dizzy") {
      mascotGroup.rotation.z = extraRoll;
      mascotGroup.rotation.x = Math.sin(time * 10) * 0.28;
    } else {
      const targetYaw = Math.atan2(vel.x, Math.abs(vel.z) + 0.015);
      const bank = Math.max(-0.32, Math.min(0.32, -vel.x * 6));
      mascotGroup.rotation.y += (targetYaw - mascotGroup.rotation.y) * 0.06;
      mascotGroup.rotation.x += (-vel.y * 2.0 - mascotGroup.rotation.x) * 0.06;
      mascotGroup.rotation.z += (bank + extraRoll - mascotGroup.rotation.z) * 0.08;
    }

    renderer.render(scene, camera);

    if (onProjectScreen) {
      mascotGroup.updateMatrixWorld(true);
      projVec.copy(pos).project(camera);
      const sx = (projVec.x * 0.5 + 0.5) * window.innerWidth;
      const sy = (-projVec.y * 0.5 + 0.5) * window.innerHeight;
      onProjectScreen(sx, sy, mode);
    }
  }

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    target.copy(pickCornerPoint());
  });

  animate();

  return {
    triggerStunt,
    setEnabled(val) {
      enabled = Boolean(val);
      canvas.style.opacity = enabled ? "1" : "0";
      if (enabled) triggerStunt("hover_peek");
    },
    isEnabled: () => enabled
  };
}