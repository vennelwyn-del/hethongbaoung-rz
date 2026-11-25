// js/sys-mascot-3d.js — Mô hình 3D Hệ Thống 00 bay nhảy phát sáng rõ nét khắp web

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { createHoloMaterial } from "./holo-shader.js";

export function initSystemMascot3D({ canvasId, onProjectScreen, onScreenBonk }) {
  const noop = { triggerStunt: () => {}, setEnabled: () => {}, isEnabled: () => false };
  const canvas = document.getElementById(canvasId);
  if (!canvas) return noop;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  } catch (_) {
    return noop;
  }

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

  const ambient = new THREE.AmbientLight(0xffffff, 1.8);
  const keyLight = new THREE.DirectionalLight(0xffffff, 2.4);
  keyLight.position.set(4, 6, 6);
  const rimLight = new THREE.DirectionalLight(colors.primary, 3.0);
  rimLight.position.set(-4, 2, 3);
  scene.add(ambient, keyLight, rimLight);

  const mascotGroup = new THREE.Group();
  scene.add(mascotGroup);

  const haloRing = new THREE.Mesh(
    new THREE.TorusGeometry(1.1, 0.032, 8, 48),
    new THREE.MeshBasicMaterial({ color: colors.primary, transparent: true, opacity: 0.85 })
  );
  haloRing.rotation.x = Math.PI / 2.2;
  mascotGroup.add(haloRing);

  const fallbackGroup = new THREE.Group();
  const coreMesh = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.55, 0),
    createHoloMaterial(`#${colors.primary.getHexString()}`, 0.9)
  );
  const wingGeo = new THREE.BoxGeometry(0.95, 0.05, 0.35);
  const wingMat = new THREE.MeshBasicMaterial({ color: colors.secondary, wireframe: true });
  const wingL = new THREE.Mesh(wingGeo, wingMat);
  const wingR = new THREE.Mesh(wingGeo, wingMat);
  wingL.position.x = -0.65;
  wingR.position.x = 0.65;
  fallbackGroup.add(coreMesh, wingL, wingR);
  mascotGroup.add(fallbackGroup);

  let mixer = null;
  let gltfWrapper = null;
  const loader = new GLTFLoader();
  loader.setCrossOrigin("anonymous");

  (async function loadStork() {
    const urls = [
      "https://threejs.org/examples/models/gltf/Stork.glb",
      "https://cdn.jsdelivr.net/gh/mrdoob/three.js@dev/examples/models/gltf/Stork.glb"
    ];
    for (const url of urls) {
      try {
        const gltf = await new Promise((resolve, reject) => loader.load(url, resolve, undefined, reject));
        const obj = gltf.scene;
        obj.traverse((ch) => {
          if (ch.isMesh && ch.material) {
            ch.material.emissive = colors.primary.clone();
            ch.material.emissiveIntensity = 0.28;
          }
        });
        const box = new THREE.Box3().setFromObject(obj);
        const sz = box.getSize(new THREE.Vector3());
        const ct = box.getCenter(new THREE.Vector3());
        const scale = 2.1 / (Math.max(sz.x, sz.y, sz.z) || 1);

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
          act.timeScale = 1.25;
          act.play();
        }
        return;
      } catch (_) {}
    }
  })();

  let enabled = true;
  let mode = "patrol";
  let modeTimer = 0;
  let bonkFired = false;

  const pos = new THREE.Vector3(-4.2, 1.8, 0.8);
  const vel = new THREE.Vector3(0.05, 0.01, 0);
  const target = new THREE.Vector3(3.4, 1.2, 1.2);
  let extraRoll = 0;

  function pickRandomPoint(zMin = -1.0, zMax = 2.6) {
    const aspect = window.innerWidth / Math.max(1, window.innerHeight);
    const maxX = Math.max(3.0, 4.2 * aspect);
    return new THREE.Vector3(
      (Math.random() - 0.5) * maxX * 1.4,
      (Math.random() - 0.5) * 5.2,
      zMin + Math.random() * (zMax - zMin)
    );
  }

  function triggerStunt(forcedMode = null) {
    if (!enabled) return;
    const pool = ["patrol", "dive_bonk", "barrel_roll", "hover_peek", "glitch_drop"];
    mode = forcedMode || pool[Math.floor(Math.random() * pool.length)];
    modeTimer = 0;
    bonkFired = false;
    extraRoll = 0;

    if (mode === "dive_bonk") {
      pos.set((Math.random() - 0.5) * 4.2, (Math.random() - 0.5) * 2.2, -4.5);
      target.set((Math.random() - 0.5) * 2.0, (Math.random() - 0.5) * 1.0, 9.2);
    } else if (mode === "barrel_roll") {
      const fromLeft = Math.random() > 0.5;
      pos.set(fromLeft ? -8.5 : 8.5, (Math.random() - 0.5) * 3.8, 1.8);
      target.set(fromLeft ? 8.5 : -8.5, (Math.random() - 0.5) * 3.8, 1.8);
    } else if (mode === "mission_swoop") {
      pos.set(-7.5, 3.2, 2.2);
      target.set(3.6, 1.6, 2.8);
    } else if (mode === "hover_peek") {
      target.set(Math.random() > 0.5 ? 3.8 : -3.8, 1.8, 2.6);
    } else if (mode === "glitch_drop") {
      pos.y = 4.0;
      target.set(pos.x, -3.2, 1.2);
    } else {
      target.copy(pickRandomPoint());
    }
  }

  setInterval(() => {
    if (!enabled || mode === "dizzy" || mode === "dive_bonk") return;
    const r = Math.random();
    if (r < 0.25) triggerStunt("dive_bonk");
    else if (r < 0.48) triggerStunt("barrel_roll");
    else if (r < 0.7) triggerStunt("hover_peek");
    else if (r < 0.84) triggerStunt("glitch_drop");
    else triggerStunt("patrol");
  }, 8500);

  const observer = new MutationObserver(() => {
    colors = getPalette();
    rimLight.color.copy(colors.primary);
    haloRing.material.color.copy(colors.primary);
    wingMat.color.copy(colors.secondary);
    if (gltfWrapper) {
      gltfWrapper.traverse((ch) => {
        if (ch.isMesh && ch.material?.emissive) ch.material.emissive.copy(colors.primary);
      });
    }
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

    if (mixer) mixer.update(dt * (mode === "dive_bonk" ? 1.8 : mode === "dizzy" ? 0.35 : 1.0));
    haloRing.rotation.z += 0.03;

    if (!gltfWrapper) {
      wingL.rotation.z = Math.sin(time * 12) * 0.48;
      wingR.rotation.z = -Math.sin(time * 12) * 0.48;
      coreMesh.material.uniforms.uTime.value = time;
      coreMesh.material.uniforms.uColor.value.copy(colors.primary);
    }

    if (mode === "dive_bonk") {
      const toT = target.clone().sub(pos);
      if (toT.length() > 0.35) {
        vel.lerp(toT.normalize().multiplyScalar(0.28), 0.16);
        pos.add(vel);
      }
      if (pos.z >= 8.4 && !bonkFired) {
        bonkFired = true;
        mode = "dizzy";
        modeTimer = 0;
        vel.set((Math.random() - 0.5) * 0.18, 0.08, -0.26);
        mascotGroup.position.copy(pos);
        mascotGroup.updateMatrixWorld(true);
        projVec.copy(pos).project(camera);
        onScreenBonk?.(
          (projVec.x * 0.5 + 0.5) * window.innerWidth,
          (-projVec.y * 0.5 + 0.5) * window.innerHeight
        );
      }
    } else if (mode === "dizzy") {
      pos.add(vel);
      vel.multiplyScalar(0.94);
      extraRoll += 0.24;
      if (modeTimer > 1.35) {
        mode = "patrol";
        extraRoll = 0;
        target.copy(pickRandomPoint());
      }
    } else if (mode === "barrel_roll") {
      const toT = target.clone().sub(pos);
      vel.lerp(toT.normalize().multiplyScalar(0.14), 0.12);
      pos.add(vel);
      extraRoll += 0.18;
      if (toT.length() < 0.7 || modeTimer > 4.2) {
        mode = "patrol";
        extraRoll = 0;
        target.copy(pickRandomPoint());
      }
    } else if (mode === "glitch_drop") {
      pos.y -= 0.12;
      pos.x += Math.sin(time * 24) * 0.08;
      extraRoll = Math.sin(time * 18) * 0.55;
      if (pos.y <= -3.0 || modeTimer > 1.4) {
        mode = "patrol";
        extraRoll = 0;
        target.set(pos.x, 2.0, 1.0);
      }
    } else if (mode === "hover_peek" || mode === "mission_swoop") {
      const hoverT = target.clone();
      hoverT.y += Math.sin(time * 3.2) * 0.25;
      pos.lerp(hoverT, 0.06);
      extraRoll *= 0.9;
      if (modeTimer > 5.0) {
        mode = "patrol";
        target.copy(pickRandomPoint());
      }
    } else {
      const toT = target.clone().sub(pos);
      if (toT.length() < 0.9) target.copy(pickRandomPoint());
      const desired = toT.normalize().multiplyScalar(0.068);
      desired.y += Math.sin(time * 2.4) * 0.015;
      vel.lerp(desired, 0.045);
      pos.add(vel);
      extraRoll *= 0.9;
    }

    mascotGroup.position.copy(pos);

    if (mode === "hover_peek" || mode === "mission_swoop") {
      mascotGroup.rotation.y += (Math.sin(time * 1.4) * 0.45 - mascotGroup.rotation.y) * 0.08;
      mascotGroup.rotation.x += (0.08 - mascotGroup.rotation.x) * 0.08;
      mascotGroup.rotation.z += (extraRoll - mascotGroup.rotation.z) * 0.1;
    } else if (mode === "dizzy") {
      mascotGroup.rotation.z = extraRoll;
      mascotGroup.rotation.x = Math.sin(time * 14) * 0.4;
    } else {
      const targetYaw = Math.atan2(vel.x, vel.z);
      const bank = Math.max(-0.6, Math.min(0.6, -vel.x * 4.5));
      mascotGroup.rotation.y += (targetYaw - mascotGroup.rotation.y) * 0.1;
      mascotGroup.rotation.x += (-vel.y * 2.4 - mascotGroup.rotation.x) * 0.1;
      mascotGroup.rotation.z += (bank + extraRoll - mascotGroup.rotation.z) * 0.14;
    }

    renderer.render(scene, camera);

    if (onProjectScreen) {
      mascotGroup.updateMatrixWorld(true);
      projVec.copy(pos).add(new THREE.Vector3(0, 0.7, 0)).project(camera);
      onProjectScreen(
        (projVec.x * 0.5 + 0.5) * window.innerWidth,
        (-projVec.y * 0.5 + 0.5) * window.innerHeight,
        mode
      );
    }
  }

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  animate();

  return {
    triggerStunt,
    setEnabled(val) {
      enabled = Boolean(val);
      canvas.style.opacity = enabled ? "1" : "0";
      if (enabled) triggerStunt("patrol");
    },
    isEnabled: () => enabled
  };
}