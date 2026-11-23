// js/canvas-bg.js — Không gian 3D Wireframe + Mưa dữ liệu + Sóng chạm màn hình VR

export function initVRCanvas() {
  const canvas = document.getElementById("vr-canvas");
  if (!canvas) return { spawnTouchRipple: () => {} };
  const ctx = canvas.getContext("2d");

  let w = 0, h = 0;
  const streams = [];
  const ripples = [];
  const embers = [];

  // Đỉnh khối Bát diện kép / Đa diện 3D thật
  const polyVerts = [
    [0, -1.25, 0], [1, 0, 1], [1, 0, -1], [-1, 0, -1], [-1, 0, 1], [0, 1.25, 0],
    [0.65, -0.55, 0.65], [-0.65, -0.55, 0.65], [-0.65, 0.55, -0.65], [0.65, 0.55, -0.65]
  ];
  const polyEdges = [
    [0,1],[0,2],[0,3],[0,4],[5,1],[5,2],[5,3],[5,4],
    [1,2],[2,3],[3,4],[4,1],[6,7],[7,8],[8,9],[9,6]
  ];

  let angleY = 0;
  let angleX = 0.35;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function seedParticles() {
    streams.length = 0;
    embers.length = 0;
    for (let i = 0; i < 36; i++) {
      streams.push({
        x: Math.random() * w,
        y: Math.random() * h,
        len: 40 + Math.random() * 110,
        speed: 0.7 + Math.random() * 1.6
      });
    }
    for (let i = 0; i < 42; i++) {
      embers.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vy: -0.25 - Math.random() * 0.5,
        r: 1 + Math.random() * 2,
        hot: i % 3 === 0
      });
    }
  }

  function getPalette() {
    const s = getComputedStyle(document.documentElement);
    return {
      p: s.getPropertyValue("--rgb-primary").trim() || "59, 184, 248",
      s: s.getPropertyValue("--rgb-secondary").trim() || "247, 135, 248"
    };
  }

  function project(v, scale) {
    const [x0, y0, z0] = v;
    const cosY = Math.cos(angleY), sinY = Math.sin(angleY);
    const cosX = Math.cos(angleX), sinX = Math.sin(angleX);

    const x1 = x0 * cosY - z0 * sinY;
    const z1 = x0 * sinY + z0 * cosY;
    const y2 = y0 * cosX - z1 * sinX;
    const z2 = y0 * sinX + z1 * cosX;

    const fov = 4.2;
    const factor = fov / (fov + z2 + 2.4);
    return [w * 0.5 + x1 * scale * factor, h * 0.5 + y2 * scale * factor];
  }

  function tick() {
    ctx.clearRect(0, 0, w, h);
    const { p, s } = getPalette();

    // 1. Mưa dữ liệu dọc mờ như ảnh công nghệ
    ctx.lineWidth = 1;
    for (const st of streams) {
      st.y += st.speed;
      if (st.y - st.len > h) st.y = -20;
      const grad = ctx.createLinearGradient(st.x, st.y - st.len, st.x, st.y);
      grad.addColorStop(0, `rgba(${p}, 0)`);
      grad.addColorStop(1, `rgba(${p}, 0.35)`);
      ctx.strokeStyle = grad;
      ctx.beginPath();
      ctx.moveTo(st.x, st.y - st.len);
      ctx.lineTo(st.x, st.y);
      ctx.stroke();
    }

    // 2. Hạt năng lượng nổi
    for (const em of embers) {
      em.y += em.vy;
      if (em.y < -10) { em.y = h + 10; em.x = Math.random() * w; }
      ctx.fillStyle = `rgba(${em.hot ? s : p}, 0.65)`;
      ctx.beginPath();
      ctx.arc(em.x, em.y, em.r, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3. Khối đa diện 3D xoay phía sau Gate
    angleY += 0.0055;
    const scale = Math.min(w, h) * 0.28;
    const projected = polyVerts.map((v) => project(v, scale));

    ctx.strokeStyle = `rgba(${p}, 0.26)`;
    ctx.lineWidth = 1.1;
    for (const [a, b] of polyEdges) {
      ctx.beginPath();
      ctx.moveTo(projected[a][0], projected[a][1]);
      ctx.lineTo(projected[b][0], projected[b][1]);
      ctx.stroke();
    }
    for (const [px, py] of projected) {
      ctx.fillStyle = `rgba(${s}, 0.72)`;
      ctx.beginPath();
      ctx.arc(px, py, 2.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 4. Vòng sóng chạm màn hình hologram
    for (let i = ripples.length - 1; i >= 0; i--) {
      const rp = ripples[i];
      rp.r += 3.2;
      rp.alpha -= 0.025;
      if (rp.alpha <= 0) {
        ripples.splice(i, 1);
        continue;
      }
      ctx.strokeStyle = `rgba(${s}, ${rp.alpha})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(${p}, ${rp.alpha * 0.8})`;
      ctx.beginPath();
      ctx.arc(rp.x, rp.y, rp.r * 0.55, 0, Math.PI * 2);
      ctx.stroke();
    }

    requestAnimationFrame(tick);
  }

  resize();
  seedParticles();
  window.addEventListener("resize", () => { resize(); seedParticles(); });
  tick();

  return {
    spawnTouchRipple(x, y) {
      ripples.push({ x, y, r: 6, alpha: 0.95 });
    }
  };
}