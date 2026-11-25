// js/canvas-bg.js — Đường hầm Dữ liệu Nhị phân 0/1 + Hào quang Chân trời (Tối ưu mobile & iOS visualViewport)

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";
import { SITE_CONFIG } from "./config.js";

export function initVRCanvas() {
  const canvas = document.getElementById("vr-canvas");
  if (!canvas) return { spawnTouchRipple: () => {} };

  const isMobile = window.matchMedia("(max-width: 768px), (pointer: coarse)").matches;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: !isMobile,
    powerPreference: isMobile ? "default" : "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 2));

  function getViewportSize() {
    const w = Math.max(1, canvas.clientWidth || window.innerWidth);
    const h = Math.max(1, canvas.clientHeight || window.innerHeight);
    return { w, h };
  }

  const initSz = getViewportSize();
  renderer.setSize(initSz.w, initSz.h, false);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, initSz.w / initSz.h, 0.1, 200);
  camera.position.set(0, 1.3, 18);

  function getHexColors() {
    const s = getComputedStyle(document.documentElement);
    const pStr = s.getPropertyValue("--c-primary").trim() || "#00E5FF";
    const sStr = s.getPropertyValue("--c-secondary").trim() || "#5EA8FF";
    const bgStr = s.getPropertyValue("--bg-void").trim() || "#020612";
    return {
      primaryStr: pStr,
      secondaryStr: sStr,
      primary: new THREE.Color(pStr),
      secondary: new THREE.Color(sStr),
      voidBg: new THREE.Color(bgStr)
    };
  }

  function hasCustomBgImage(themeName) {
    const cfg = SITE_CONFIG?.backgroundImage;
    if (!cfg) return false;
    const url = (cfg.byTheme && cfg.byTheme[themeName]) || cfg.defaultUrl || "";
    return Boolean(url.trim());
  }

  let colors = getHexColors();

  function syncClearColor() {
    const curTheme = document.documentElement.getAttribute("data-theme") || "orbital-cyan";
    if (hasCustomBgImage(curTheme)) {
      renderer.setClearColor(0x000000, 0);
    } else {
      renderer.setClearColor(colors.voidBg, 1);
    }
  }
  syncClearColor();

  // TEXTURE THÁC SỐ 0/1 SẮC NÉT
  function makeBinaryStreamCanvas(colorHex, seed = 1) {
    const c = document.createElement("canvas");
    c.width = isMobile ? 192 : 256;
    c.height = isMobile ? 768 : 1024;
    const ctx = c.getContext("2d");

    ctx.font = `bold ${isMobile ? 24 : 32}px 'JetBrains Mono', monospace`;
    ctx.textAlign = "center";

    const cols = isMobile ? [32, 80, 128, 168] : [44, 108, 172, 224];
    const stepY = isMobile ? 34 : 38;
    cols.forEach((cx, ci) => {
      for (let y = 28; y < c.height - 24; y += stepY) {
        const bit = ((Math.sin(y * 1.13 + seed * 5.7 + ci * 3.1) + 1) * 0.5) > 0.48 ? "1" : "0";
        const edgeFade = Math.sin((y / c.height) * Math.PI);
        const isHead = ((y + ci * 76) % 228) < 40;
        ctx.globalAlpha = Math.max(0.08, edgeFade * (isHead ? 0.98 : 0.45 + 0.35 * Math.abs(Math.sin(y * 0.1 + ci))));
        ctx.fillStyle = isHead ? "#ffffff" : colorHex;
        ctx.shadowColor = colorHex;
        ctx.shadowBlur = isMobile ? (isHead ? 6 : 0) : (isHead ? 18 : 10);
        ctx.fillText(bit, cx, y);
      }
    });
    return c;
  }

  function makeFlareCanvas(colorHex) {
    const c = document.createElement("canvas");
    c.width = isMobile ? 256 : 512;
    c.height = isMobile ? 256 : 512;
    const ctx = c.getContext("2d");
    const half = c.width / 2;
    const g = ctx.createRadialGradient(half, half, 2, half, half, half - 4);
    g.addColorStop(0.0, "#ffffff");
    g.addColorStop(0.09, "#e6fcff");
    g.addColorStop(0.24, colorHex);
    g.addColorStop(0.55, "rgba(0, 140, 255, 0.16)");
    g.addColorStop(1.0, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, c.width, c.height);
    return c;
  }

  const binTex1 = new THREE.CanvasTexture(makeBinaryStreamCanvas(colors.primaryStr, 1));
  binTex1.wrapT = THREE.RepeatWrapping;
  const binTex2 = new THREE.CanvasTexture(makeBinaryStreamCanvas(colors.secondaryStr, 2));
  binTex2.wrapT = THREE.RepeatWrapping;
  const flareTex = new THREE.CanvasTexture(makeFlareCanvas(colors.primaryStr));

  // 1. TÂM SÁNG CHÂN TRỜI
  const horizonFlare = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: flareTex,
      color: 0xffffff,
      transparent: true,
      opacity: 0.96,
      blending: THREE.AdditiveBlending,
      fog: false,
      depthWrite: false
    })
  );
  horizonFlare.position.set(0, -1.2, -56);
  horizonFlare.scale.set(48, 34, 1);
  scene.add(horizonFlare);

  const horizonBand = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: flareTex,
      color: colors.primary,
      transparent: true,
      opacity: 0.72,
      blending: THREE.AdditiveBlending,
      fog: false,
      depthWrite: false
    })
  );
  horizonBand.position.set(0, -2.4, -55);
  horizonBand.scale.set(110, 8, 1);
  scene.add(horizonBand);

  const rayMat = new THREE.MeshBasicMaterial({
    map: flareTex,
    color: colors.primary,
    transparent: true,
    opacity: 0.24,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending,
    fog: false,
    depthWrite: false
  });
  const rayPlanes = [];
  for (let i = 0; i < 6; i++) {
    const ray = new THREE.Mesh(new THREE.PlaneGeometry(76, 1.4), rayMat);
    ray.position.set(0, -1.2, -54.5);
    ray.rotation.z = (i / 6) * Math.PI;
    scene.add(ray);
    rayPlanes.push(ray);
  }

  // 2. SÀN DỮ LIỆU VÔ TẬN TAN MỜ VÀO CHÂN TRỜI
  const floorUniforms = {
    uTime: { value: 0 },
    uPrimary: { value: colors.primary.clone() },
    uSecondary: { value: colors.secondary.clone() }
  };
  const floorMat = new THREE.ShaderMaterial({
    uniforms: floorUniforms,
    vertexShader: `
      varying vec2 vXZ;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vXZ = wp.xz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uPrimary;
      uniform vec3 uSecondary;
      varying vec2 vXZ;

      void main() {
        vec2 uv = vec2(vXZ.x * 0.32, (vXZ.y + uTime * 3.8) * 0.32);
        vec2 grid = abs(fract(uv - 0.5) - 0.5) / max(fwidth(uv), vec2(0.002));
        float line = 1.0 - min(min(grid.x, grid.y), 1.0);

        float distFade = smoothstep(74.0, 12.0, length(vXZ - vec2(0.0, -8.0)));
        float sideFade = smoothstep(52.0, 10.0, abs(vXZ.x));
        float centerGlow = exp(-abs(vXZ.x) * 0.14) * smoothstep(22.0, -56.0, vXZ.y);

        vec3 col = mix(uPrimary, uSecondary, clamp(centerGlow * 1.4, 0.0, 1.0));
        float alpha = (line * 0.52 + centerGlow * 0.28) * distFade * sideFade;
        gl_FragColor = vec4(col * (1.1 + centerGlow), clamp(alpha, 0.0, 0.85));
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const floorPlane = new THREE.Mesh(new THREE.PlaneGeometry(160, 140), floorMat);
  floorPlane.rotation.x = -Math.PI / 2;
  floorPlane.position.set(0, -6.4, -22);
  scene.add(floorPlane);

  // 3. CÁC CỘT THÁC SỐ 0/1 CHẠY DỌC ĐƯỜNG HẦM
  const rainPillars = [];
  const pillarCount = isMobile ? 22 : 42;
  const pillarGeo = new THREE.PlaneGeometry(2.6, 18);
  for (let i = 0; i < pillarCount; i++) {
    const side = i % 2 === 0 ? -1 : 1;
    const x = side * (3.8 + Math.random() * 24);
    const y = -0.5 + Math.random() * 8;
    const z = -54 + Math.random() * 64;
    const useSec = i % 3 === 0;
    const mat = new THREE.MeshBasicMaterial({
      map: useSec ? binTex2 : binTex1,
      transparent: true,
      opacity: 0.42 + Math.random() * 0.42,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      fog: false,
      depthWrite: false
    });
    const mesh = new THREE.Mesh(pillarGeo, mat);
    mesh.position.set(x, y, z);
    mesh.userData = { speedZ: 0.08 + Math.random() * 0.13 };
    scene.add(mesh);
    rainPillars.push(mesh);
  }

  // 4. HẠT DỮ LIỆU BAY XUYÊN TÂM
  const starCount = isMobile ? 420 : 950;
  const starPositions = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    starPositions[i * 3] = (Math.random() - 0.5) * 90;
    starPositions[i * 3 + 1] = -6.0 + Math.random() * 34;
    starPositions[i * 3 + 2] = -62 + Math.random() * 76;
  }
  const starGeo = new THREE.BufferGeometry();
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPositions, 3));
  const starMat = new THREE.PointsMaterial({
    color: colors.primary,
    size: isMobile ? 0.18 : 0.15,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    fog: false
  });
  scene.add(new THREE.Points(starGeo, starMat));

  // 5. SÓNG NỔ HOLOGRAM KHI CHẠM
  const shockwaves = [];
  function spawnTouchRipple(screenX, screenY) {
    if (document.hidden) return;
    const { w, h } = getViewportSize();
    const ndcX = (screenX / w) * 2 - 1;
    const ndcY = -(screenY / h) * 2 + 1;
    const vec = new THREE.Vector3(ndcX, ndcY, 0.5).unproject(camera);
    const dir = vec.sub(camera.position).normalize();
    const pos = camera.position.clone().add(dir.multiplyScalar(14));

    const ringMat = new THREE.MeshBasicMaterial({
      color: colors.secondary,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      fog: false
    });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.27, 28), ringMat);
    ring.position.copy(pos);
    ring.lookAt(camera.position);
    scene.add(ring);
    shockwaves.push({ mesh: ring, mat: ringMat, scale: 1 });
  }

  let targetCamX = 0, targetCamY = 1.3;
  window.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse" || isMobile) return;
    targetCamX = (e.clientX / window.innerWidth - 0.5) * 4.2;
    targetCamY = 1.3 - (e.clientY / window.innerHeight - 0.5) * 2.2;
  }, { passive: true });

  const observer = new MutationObserver(() => {
    colors = getHexColors();
    syncClearColor();
    floorUniforms.uPrimary.value.copy(colors.primary);
    floorUniforms.uSecondary.value.copy(colors.secondary);
    horizonBand.material.color.copy(colors.primary);
    rayMat.color.copy(colors.primary);
    starMat.color.copy(colors.primary);
    binTex1.image = makeBinaryStreamCanvas(colors.primaryStr, 1);
    binTex1.needsUpdate = true;
    binTex2.image = makeBinaryStreamCanvas(colors.secondaryStr, 2);
    binTex2.needsUpdate = true;
    flareTex.image = makeFlareCanvas(colors.primaryStr);
    flareTex.needsUpdate = true;
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  let time = 0;
  let rafId = null;

  function animate() {
    rafId = null;
    if (document.hidden) return;
    rafId = requestAnimationFrame(animate);

    time += 0.025;
    camera.position.x += (targetCamX - camera.position.x) * 0.055;
    camera.position.y += (targetCamY - camera.position.y) * 0.055;
    camera.lookAt(0, -1.1, -56);

    floorUniforms.uTime.value = time;
    binTex1.offset.y -= 0.0045;
    binTex2.offset.y -= 0.007;

    const pulse = 1 + Math.sin(time * 2.2) * 0.07;
    horizonFlare.scale.set(48 * pulse, 34 * pulse, 1);

    rayPlanes.forEach((r, idx) => { r.rotation.z += (idx % 2 === 0 ? 0.0012 : -0.0012); });

    rainPillars.forEach((p) => {
      p.position.z += p.userData.speedZ;
      if (p.position.z > 14) p.position.z = -54;
    });

    const sArr = starGeo.attributes.position.array;
    for (let i = 0; i < starCount; i++) {
      sArr[i * 3 + 2] += 0.14;
      if (sArr[i * 3 + 2] > 16) sArr[i * 3 + 2] = -62;
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

  function resize() {
    const { w, h } = getViewportSize();
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 2));
    renderer.setSize(w, h, false);
  }

  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && !rafId) animate();
  });
  canvas.addEventListener("webglcontextlost", (e) => e.preventDefault(), false);
  window.addEventListener("resize", resize);
  window.addEventListener("orientationchange", () => setTimeout(resize, 120));
  window.visualViewport?.addEventListener("resize", resize);

  animate();
  return { spawnTouchRipple };
}