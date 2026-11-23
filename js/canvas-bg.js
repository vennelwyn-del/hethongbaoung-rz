// js/canvas-bg.js — Hiệu ứng mạng nơ-ron & hạt dữ liệu AI chạy theo biến CSS của Theme

export function initNeuralCanvas() {
  const canvas = document.getElementById("neural-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  let width = 0;
  let height = 0;
  const nodes = [];
  const NODE_COUNT = 52;

  function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  }

  function createNodes() {
    nodes.length = 0;
    for (let i = 0; i < NODE_COUNT; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        hot: i % 7 === 0,
        r: i % 7 === 0 ? 2.6 : 1.7
      });
    }
  }

  function getThemeColors() {
    const styles = getComputedStyle(document.documentElement);
    return {
      main: styles.getPropertyValue("--canvas-rgb").trim() || "0, 149, 255",
      hot: styles.getPropertyValue("--canvas-hot-rgb").trim() || "255, 107, 53"
    };
  }

  function tick() {
    ctx.clearRect(0, 0, width, height);
    const { main, hot } = getThemeColors();

    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      a.x += a.vx;
      a.y += a.vy;
      if (a.x < 0 || a.x > width) a.vx *= -1;
      if (a.y < 0 || a.y > height) a.vy *= -1;

      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 145) {
          ctx.strokeStyle = `rgba(${main}, ${(1 - dist / 145) * 0.24})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }

      ctx.fillStyle = `rgba(${a.hot ? hot : main}, 0.85)`;
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(tick);
  }

  resize();
  createNodes();
  window.addEventListener("resize", () => { resize(); createNodes(); });
  tick();
}