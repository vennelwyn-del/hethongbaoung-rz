// js/holo-shader.js — GLSL Hologram Shader (Fresnel Rim Lighting + Animated Volumetric Scanlines + Glitch)

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";

export function createHoloMaterial(colorHex, opacity = 0.72) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(colorHex) },
      uOpacity: { value: opacity }
    },
    vertexShader: `
      uniform float uTime;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPos;

      void main() {
        vec3 pos = position;
        float glitchWave = sin(uTime * 11.0 + pos.y * 9.0);
        float glitchMask = step(0.985, sin(uTime * 2.3));
        pos.x += glitchWave * glitchMask * 0.04;

        vec4 worldPosition = modelMatrix * vec4(pos, 1.0);
        vWorldPos = worldPosition.xyz;
        vec4 mvPosition = viewMatrix * worldPosition;
        vViewPosition = -mvPosition.xyz;
        vNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying vec3 vWorldPos;

      void main() {
        vec3 normal = normalize(vNormal);
        vec3 viewDir = normalize(vViewPosition);

        // Hiệu ứng Fresnel: Cạnh viền rực sáng hơn lõi
        float fresnel = pow(1.0 - abs(dot(normal, viewDir)), 2.2);

        // Đường quét hologram chạy dọc vật thể 3D
        float stripes = sin(vWorldPos.y * 26.0 - uTime * 5.2) * 0.5 + 0.5;
        stripes = pow(stripes, 3.0);

        float alpha = (fresnel * 0.85 + stripes * 0.28 + 0.08) * uOpacity;
        vec3 glow = uColor * (1.2 + fresnel * 1.4 + stripes * 0.5);
        gl_FragColor = vec4(glow, clamp(alpha, 0.0, 0.95));
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });
}