// Boids: Reynolds flocking (separation, alignment, cohesion), curious about the cursor.

export default function boids(p, env) {
  let flock = [];
  const PERC = 60;
  const SEP_R = 22;
  const MAX_SPD = 3;
  const MAX_F = 0.1;

  function init() {
    const n = Math.round(p.constrain((p.width * p.height) / 3300, 60, 200));
    flock = Array.from({ length: n }, () => {
      const a = p.random(p.TWO_PI);
      const s = p.random(1, 2.5);
      return { x: p.random(p.width), y: p.random(p.height), vx: Math.cos(a) * s, vy: Math.sin(a) * s };
    });
    p.background(10, 25, 47);
  }

  function steer(dx, dy, bvx, bvy) {
    const m = Math.hypot(dx, dy);
    if (m === 0) return [0, 0];
    let fx = (dx / m) * MAX_SPD - bvx;
    let fy = (dy / m) * MAX_SPD - bvy;
    const fm = Math.hypot(fx, fy);
    if (fm > MAX_F) { fx = (fx / fm) * MAX_F; fy = (fy / fm) * MAX_F; }
    return [fx, fy];
  }

  p.setup = () => {
    p.createCanvas(env.width, env.height);
    init();
  };
  p.resized = init;
  p.restart = init;

  p.draw = () => {
    p.background(10, 25, 47, 40);
    const mouseOn = env.hovering();

    for (let i = 0; i < flock.length; i++) {
      const b = flock[i];
      let sx = 0; let sy = 0; let sn = 0;
      let ax = 0; let ay = 0;
      let cx = 0; let cy = 0; let nn = 0;
      for (let j = 0; j < flock.length; j++) {
        if (i === j) continue;
        const o = flock[j];
        const dx = o.x - b.x;
        const dy = o.y - b.y;
        const d = Math.hypot(dx, dy);
        if (d >= PERC) continue;
        nn++;
        ax += o.vx; ay += o.vy;
        cx += o.x; cy += o.y;
        if (d < SEP_R && d > 0) { sx -= dx / d; sy -= dy / d; sn++; }
      }
      let fx = 0;
      let fy = 0;
      if (sn) { const [x, y] = steer(sx / sn, sy / sn, b.vx, b.vy); fx += x * 1.6; fy += y * 1.6; }
      if (nn) {
        const [x1, y1] = steer(ax / nn, ay / nn, b.vx, b.vy);
        const [x2, y2] = steer(cx / nn - b.x, cy / nn - b.y, b.vx, b.vy);
        fx += x1 + x2; fy += y1 + y2;
      }
      if (mouseOn) {
        const md = Math.hypot(p.mouseX - b.x, p.mouseY - b.y);
        if (md < 160 && md > 0) {
          const s = p.map(md, 0, 160, 0.4, 0);
          fx += ((p.mouseX - b.x) / md) * s;
          fy += ((p.mouseY - b.y) / md) * s;
        }
      }
      b.vx += fx; b.vy += fy;
      const sp = Math.hypot(b.vx, b.vy);
      if (sp > MAX_SPD) { b.vx = (b.vx / sp) * MAX_SPD; b.vy = (b.vy / sp) * MAX_SPD; }
      if (sp < 0.5) { b.vx += p.random(-0.5, 0.5); b.vy += p.random(-0.5, 0.5); }
      b.x += b.vx; b.y += b.vy;
      if (b.x < 0) b.x = p.width;
      if (b.x > p.width) b.x = 0;
      if (b.y < 0) b.y = p.height;
      if (b.y > p.height) b.y = 0;

      p.stroke(100, 255, 218, 28);
      p.strokeWeight(1);
      p.line(b.x, b.y, b.x - b.vx * 5, b.y - b.vy * 5);
      p.push();
      p.translate(b.x, b.y);
      p.rotate(Math.atan2(b.vy, b.vx));
      p.noStroke();
      p.fill(100, 255, 218, p.map(sp, 0, MAX_SPD, 110, 220));
      p.triangle(9, 0, -4, 3.5, -4, -3.5);
      p.pop();
    }
  };
}
