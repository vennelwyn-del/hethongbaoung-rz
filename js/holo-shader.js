// js/holo-shader.js — GLSL Hologram Shader (Fresnel Rim + Volumetric Scanlines + Micro Glitch)

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
        float glitchWave = sin(uTime * 13.0 + pos.y * 10.0);
        float glitchMask = step(0.988, sin(uTime * 2.1));
        pos.x += glitchWave * glitchMask * 0.045;

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

        float fresnel = pow(1.0 - abs(dot(normal, viewDir)), 2.1);

        float stripes = sin(vWorldPos.y * 28.0 - uTime * 5.6) * 0.5 + 0.5;
        stripes = pow(stripes, 3.2);

        float pulse = 0.92 + 0.08 * sin(uTime * 3.0 + vWorldPos.y * 1.5);
        float alpha = (fresnel * 0.88 + stripes * 0.28 + 0.09) * uOpacity * pulse;
        vec3 glow = uColor * (1.25 + fresnel * 1.55 + stripes * 0.55);

        gl_FragColor = vec4(glow, clamp(alpha, 0.0, 0.96));
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  });
}