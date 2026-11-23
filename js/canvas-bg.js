// js/canvas-bg.js — Không gian VR 3D: Lưới phối cảnh, Khối lập phương 3D, Sóng điện cao thế & Mã code AI

const CODE_SNIPPETS = [
  "0x3F13", "AI.00", "SYS_PB", "NODE_10", "010110",
  "AUDIT()", "KARMA--", "Sd.ROOT", "VR_SYNC", "HEX:FF",
  "0xB2F6", "DEBT_OK", "GRID_3D", "NET.4.0", "110010"
];

const CUBE_VERTS = [
  [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
  [-1, -1,  1], [1, -1,  1], [1, 1,  1], [-1, 1,  1]
];
const CUBE_EDGES = [
  [0,1],[1,2],[2,3],[3,0],
  [4,5],[5,6],[6,7],[7,4],
  [0,4],[1,5],[2,6],[3,7]
];

export function initVRCanvas() {
  const canvas = document.getElementById("vr-canvas");
  if (!canvas) return { spawnTouchRipple: () => {} };
  const ctx = canvas.getContext("2d");

  let w = 0, h = 0;
  let phase = 0;
  let gridOffset = 0;

  const cubes = [];
  const codeCols = [];
  const ripples = [];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function seedScene() {
    cubes.length = 0;
    for (let i = 0; i < 16; i++) {
      cubes.push({
        x: (Math.random() - 0.5) * 2.2,
        y: (Math.random() - 0.5) * 1.4,
        z: 1.5 + Math.random() * 5.2,
        size: 0.14 + Math.random() * 0.24,
        rx: Math.random() * Math.PI,
        ry: Math.random() * Math.PI,
        vrx: (Math.random() - 0.5) * 0.015,
        vry: (Math.random() - 0.5) * 0.018,
        vz: 0.006 + Math.random() * 0.01,
        hot: i % 3 === 0
      });
    }

    codeCols.length = 0;
    const colCount = Math.max(18, Math.floor(w / 64));
    for (let i = 0; i < colCount; i++) {
      codeCols.push({
        x: (i + 0.5) * (w / colCount) + (Math.random() - 0.5) * 24,
        y: Math.random() * h,
        speed: 0.9 + Math.random() * 1.8,
        depth: 0.35 + Math.random() * 0.65,
        text: CODE_SNIPPETS[i % CODE_SNIPPETS.length]
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

  // Vẽ sàn & trần lưới 3D thật hướng tới tâm màn hình
  function drawTunnelGrid(p) {
    const cx = w * 0.5;
    const cy = h * 0.5;
    gridOffset = (gridOffset + 0.014) % 1;

    ctx.strokeStyle = `rgba(${p}, 0.16)`;
    ctx.lineWidth = 1;

    // Tia dọc tụ về tâm
    const rays = 14;
    for (let i = -rays; i <= rays; i++) {
      const spread = (i / rays) * w * 1.35;
      ctx.beginPath();
      ctx.moveTo(cx + spread * 0.08, cy + 16);
      ctx.lineTo(cx + spread, h);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(cx + spread * 0.08, cy - 16);
      ctx.lineTo(cx + spread, 0);
      ctx.stroke();
    }

    // Các đường ngang lao tới theo chiều Z
    for (let i = 1; i <= 9; i++) {
      const t = (i - gridOffset) / 9;
      const dist = Math.pow(t, 2.2);
      const yBot = cy + 16 + dist * (h * 0.5 - 16);
      const yTop = cy - 16 - dist * (h * 0.5 - 16);
      ctx.strokeStyle = `rgba(${p}, ${0.05 + dist * 0.18})`;
      ctx.beginPath(); ctx.moveTo(0, yBot); ctx.lineTo(w, yBot); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, yTop); ctx.lineTo(w, yTop); ctx.stroke();
    }
  }

  // Vẽ nhiều khối lập phương 3D bay & tự xoay
  function drawCubes(p, s) {
    const fov = Math.min(w, h) * 0.85;
    const cx = w * 0.5;
    const cy = h * 0.5;

    for (const c of cubes) {
      c.rx += c.vrx;
      c.ry += c.vry;
      c.z -= c.vz;
      if (c.z < 0.9) {
        c.z = 6.2;
        c.x = (Math.random() - 0.5) * 2.4;
        c.y = (Math.random() - 0.5) * 1.5;
      }

      const cosX = Math.cos(c.rx), sinX = Math.sin(c.rx);
      const cosY = Math.cos(c.ry), sinY = Math.sin(c.ry);

      const pts = CUBE_VERTS.map(([vx, vy, vz]) => {
        const sx = vx * c.size;
        const sy = vy * c.size;
        const sz = vz * c.size;

        const x1 = sx * cosY - sz * sinY;
        const z1 = sx * sinY + sz * cosY;
        const y2 = sy * cosX - z1 * sinX;
        const z2 = sy * sinX + z1 * cosX;

        const wx = c.x + x1;
        const wy = c.y + y2;
        const wz = c.z + z2;
        const scale = fov / wz;
        return [cx + wx * scale, cy + wy * scale];
      });

      const alpha = Math.min(0.65, Math.max(0.12, 1.3 / c.z));
      const rgb = c.hot ? s : p;

      ctx.strokeStyle = `rgba(${rgb}, ${alpha})`;
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      for (const [a, b] of CUBE_EDGES) {
        ctx.moveTo(pts[a][0], pts[a][1]);
        ctx.lineTo(pts[b][0], pts[b][1]);
      }
      ctx.stroke();

      // Điểm sáng ở các góc khối lập phương
      ctx.fillStyle = `rgba(${rgb}, ${alpha * 1.1})`;
      for (const [px, py] of pts) {
        ctx.fillRect(px - 1.3, py - 1.3, 2.6, 2.6);
      }
    }
  }

  // Vẽ nhiều dải sóng điện cao thế & tia giật ngẫu nhiên
  function drawElectricWaves(p, s) {
    const bands = [
      { y: h * 0.24, amp: 20, freq: 0.012, spd: 1.4, rgb: p, alpha: 0.28 },
      { y: h * 0.5,  amp: 34, freq: 0.009, spd: -1.9, rgb: s, alpha: 0.34 },
      { y: h * 0.5,  amp: 22, freq: 0.018, spd: 2.3, rgb: p, alpha: 0.25 },
      { y: h * 0.78, amp: 18, freq: 0.014, spd: -1.2, rgb: s, alpha: 0.24 }
    ];

    for (const b of bands) {
      ctx.strokeStyle = `rgba(${b.rgb}, ${b.alpha})`;
      ctx.lineWidth = 1.35;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 14) {
        const jitter = Math.sin(x * 0.08 + phase * 6) * 4;
        const y = b.y + Math.sin(x * b.freq + phase * b.spd) * b.amp + jitter;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Tia sét điện tử lóe ngẫu nhiên ở nền
    if (Math.random() < 0.14) {
      let lx = Math.random() * w;
      let ly = Math.random() * h * 0.8 + h * 0.1;
      ctx.strokeStyle = `rgba(${Math.random() > 0.5 ? p : s}, 0.55)`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      for (let step = 0; step < 6; step++) {
        lx += (Math.random() - 0.5) * 90;
        ly += (Math.random() - 0.5) * 55;
        ctx.lineTo(lx, ly);
      }
      ctx.stroke();
    }
  }

  // Vẽ mưa mã code công nghệ AI
  function drawCodeStreams(p, s) {
    ctx.textAlign = "center";
    for (let i = 0; i < codeCols.length; i++) {
      const col = codeCols[i];
      col.y += col.speed;
      if (col.y > h + 80) {
        col.y = -40;
        col.text = CODE_SNIPPETS[Math.floor(Math.random() * CODE_SNIPPETS.length)];
      }
      const size = Math.round(9 + col.depth * 4);
      ctx.font = `600 ${size}px "JetBrains Mono", monospace`;
      const rgb = i % 4 === 0 ? s : p;
      ctx.fillStyle = `rgba(${rgb}, ${0.14 + col.depth * 0.25})`;
      ctx.fillText(col.text, col.x, col.y);

      ctx.fillStyle = `rgba(${rgb}, ${0.06 + col.depth * 0.12})`;
      ctx.fillText("10110", col.x, col.y - 18);
    }
  }

  function tick() {
    ctx.clearRect(0, 0, w, h);
    phase += 0.025;
    const { p, s } = getPalette();

    drawTunnelGrid(p);
    drawCodeStreams(p, s);
    drawElectricWaves(p, s);
    drawCubes(p, s);

    // Sóng chạm hologram khi click lên màn hình
    for (let i = ripples.length - 1; i >= 0; i--) {
      const rp = ripples[i];
      rp.r += 3.8;
      rp.alpha -= 0.026;
      if (rp.alpha <= 0) { ripples.splice(i, 1); continue; }

      ctx.strokeStyle = `rgba(${s}, ${rp.alpha})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2); ctx.stroke();

      ctx.strokeStyle = `rgba(${p}, ${rp.alpha * 0.85})`;
      ctx.beginPath(); ctx.arc(rp.x, rp.y, rp.r * 0.55, 0, Math.PI * 2); ctx.stroke();
    }

    requestAnimationFrame(tick);
  }

  resize();
  seedScene();
  window.addEventListener("resize", () => { resize(); seedScene(); });
  tick();

  return {
    spawnTouchRipple(x, y) {
      ripples.push({ x, y, r: 8, alpha: 0.95 });
    }
  };
}