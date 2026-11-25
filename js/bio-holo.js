// js/bio-holo.js — Holo-Bio Scanner 3D (Tối ưu iOS/Android: tạm dừng khi cuộn khuất hoặc ẩn tab + fix ECG)

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";
import { createHoloMaterial } from "./holo-shader.js";

export function initBioHologram() {
  const canvas = document.getElementById("bio-canvas");
  if (!canvas) return;

  const isMobile = window.matchMedia("(max-width: 768px), (pointer: coarse)").matches;
  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: !isMobile,
    powerPreference: "default"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 2));

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 50);
  camera.position.set(0, 0.15, 8.2);

  function getColors() {
    const s = getComputedStyle(document.documentElement);
    return {
      p: s.getPropertyValue("--c-primary").trim() || "#00E5FF",
      sec: s.getPropertyValue("--c-secondary").trim() || "#5EA8FF"
    };
  }
  let pal = getColors();

  // 1. LÕI LINH HỒN HOLOGRAM GLSL
  const coreGeo = new THREE.IcosahedronGeometry(1.15, 1);
  const coreHoloMat = createHoloMaterial(pal.p, 0.8);
  const coreMesh = new THREE.Mesh(coreGeo, coreHoloMat);
  scene.add(coreMesh);

  const coreWire = new THREE.LineSegments(
    new THREE.EdgesGeometry(coreGeo),
    new THREE.LineBasicMaterial({ color: pal.sec, transparent: true, opacity: 0.78 })
  );
  coreMesh.add(coreWire);

  // 2. VÒNG QUÉT QUỸ ĐẠO
  const scanRing1 = new THREE.Mesh(
    new THREE.TorusGeometry(1.88, 0.025, 8, 56),
    new THREE.MeshBasicMaterial({ color: pal.p, transparent: true, opacity: 0.75 })
  );
  const scanRing2 = new THREE.Mesh(
    new THREE.TorusGeometry(2.22, 0.02, 8, 56),
    new THREE.MeshBasicMaterial({ color: pal.sec, transparent: true, opacity: 0.65 })
  );
  scanRing1.rotation.set(1.1, 0.4, 0);
  scanRing2.rotation.set(-0.8, 0.9, 0.3);
  scene.add(scanRing1, scanRing2);

  // 3. CHUỖI XOẮN KÉP DNA 3D
  const dnaGroup = new THREE.Group();
  const nodeGeo = new THREE.SphereGeometry(0.065, 8, 8);
  const matA = new THREE.MeshBasicMaterial({ color: pal.p, transparent: true, opacity: 0.9 });
  const matB = new THREE.MeshBasicMaterial({ color: pal.sec, transparent: true, opacity: 0.9 });
  const rungMat = new THREE.LineBasicMaterial({ color: pal.p, transparent: true, opacity: 0.45 });

  for (let i = -14; i <= 14; i++) {
    const t = i * 0.42;
    const y = i * 0.19;
    const r = 0.88;
    const x1 = Math.cos(t) * r, z1 = Math.sin(t) * r;
    const x2 = Math.cos(t + Math.PI) * r, z2 = Math.sin(t + Math.PI) * r;

    const s1 = new THREE.Mesh(nodeGeo, matA);
    s1.position.set(x1, y, z1);
    const s2 = new THREE.Mesh(nodeGeo, matB);
    s2.position.set(x2, y, z2);

    const rungGeo = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x1, y, z1),
      new THREE.Vector3(x2, y, z2)
    ]);
    dnaGroup.add(s1, s2, new THREE.Line(rungGeo, rungMat));
  }
  dnaGroup.position.z = -1.6;
  scene.add(dnaGroup);

  function resize() {
    const parent = canvas.parentElement;
    if (!parent) return;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    if (w < 20 || h < 20) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  let isVisible = true;
  let rafId = null;

  function ensureRunning() {
    if (!document.hidden && isVisible && !rafId) {
      rafId = requestAnimationFrame(animate);
    }
  }

  if (window.ResizeObserver && canvas.parentElement) {
    new ResizeObserver(() => resize()).observe(canvas.parentElement);
  }
  if (window.IntersectionObserver && canvas.parentElement) {
    new IntersectionObserver(
      (entries) => {
        isVisible = entries.some((entry) => entry.isIntersecting);
        if (isVisible) ensureRunning();
      },
      { threshold: 0.05 }
    ).observe(canvas.parentElement);
  }

  const obs = new MutationObserver(() => {
    pal = getColors();
    coreHoloMat.uniforms.uColor.value.set(pal.p);
    coreWire.material.color.set(pal.sec);
    scanRing1.material.color.set(pal.p);
    scanRing2.material.color.set(pal.sec);
    matA.color.set(pal.p);
    matB.color.set(pal.sec);
    rungMat.color.set(pal.p);
  });
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  const irisCanvas = document.getElementById("iris-canvas");
  const irisCtx = irisCanvas?.getContext("2d");
  const ecgCanvas = document.getElementById("ecg-canvas");
  const ecgCtx = ecgCanvas?.getContext("2d");
  const TWO_PI = Math.PI * 2;

  let time = 0;
  function animate() {
    rafId = null;
    if (document.hidden || !isVisible) return;
    rafId = requestAnimationFrame(animate);

    time += 0.03;
    coreHoloMat.uniforms.uTime.value = time;
    coreMesh.rotation.y += 0.012;
    coreMesh.rotation.x += 0.006;
    dnaGroup.rotation.y += 0.018;
    scanRing1.rotation.z += 0.015;
    scanRing2.rotation.z -= 0.012;
    scanRing2.rotation.x += 0.005;

    renderer.render(scene, camera);

    if (irisCtx) {
      const w = irisCanvas.width, h = irisCanvas.height;
      irisCtx.clearRect(0, 0, w, h);
      irisCtx.strokeStyle = pal.p;
      irisCtx.lineWidth = 1.2;
      irisCtx.beginPath();
      irisCtx.arc(w / 2, h / 2, 24, 0, TWO_PI);
      irisCtx.stroke();

      irisCtx.strokeStyle = pal.sec;
      irisCtx.beginPath();
      irisCtx.arc(w / 2, h / 2, 16, time, time + Math.PI * 1.3);
      irisCtx.stroke();

      for (let a = 0; a < 12; a++) {
        const ang = (a / 12) * TWO_PI + time * 0.4;
        irisCtx.beginPath();
        irisCtx.moveTo(w / 2 + Math.cos(ang) * 9, h / 2 + Math.sin(ang) * 9);
        irisCtx.lineTo(w / 2 + Math.cos(ang) * 22, h / 2 + Math.sin(ang) * 22);
        irisCtx.stroke();
      }
    }

    if (ecgCtx) {
      const w = ecgCanvas.width, h = ecgCanvas.height;
      ecgCtx.clearRect(0, 0, w, h);
      ecgCtx.strokeStyle = pal.sec;
      ecgCtx.lineWidth = 1.5;
      ecgCtx.beginPath();
      for (let x = 0; x < w; x++) {
        const rawPh = (x * 0.14 - time * 5) % TWO_PI;
        const phase = rawPh < 0 ? rawPh + TWO_PI : rawPh;
        let spike = 0;
        if (phase > 2.4 && phase < 2.8) spike = -14;
        else if (phase >= 2.8 && phase < 3.1) spike = 10;
        else if (phase > 1.8 && phase < 2.2) spike = -4;
        const y = h / 2 + spike + Math.sin(x * 0.2 + time) * 1.2;
        x === 0 ? ecgCtx.moveTo(x, y) : ecgCtx.lineTo(x, y);
      }
      ecgCtx.stroke();
    }
  }

  document.addEventListener("visibilitychange", ensureRunning);
  canvas.addEventListener("webglcontextlost", (e) => e.preventDefault(), false);
  resize();
  window.addEventListener("resize", resize);
  ensureRunning();
}