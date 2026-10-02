// Magnetic Swarm: particles attracted to the cursor. Click to scatter.
// When nobody is hovering, the attractor drifts along a Lissajous path.

export default function swarm(p, env) {
  let parts = [];
  let t = 0;

  function init() {
    const n = Math.round(p.constrain((p.width * p.height) / 1400, 200, 520));
    parts = Array.from({ length: n }, () => {
      const a = p.random(p.TWO_PI);
      const s = p.random(0.5, 2);
      return { x: p.random(p.width), y: p.random(p.height), vx: Math.cos(a) * s, vy: Math.sin(a) * s };
    });
    p.background(10, 25, 47);
  }

  p.setup = () => {
    p.createCanvas(env.width, env.height);
    init();
  };
  p.resized = init;
  p.restart = init;

  p.draw = () => {
    p.background(10, 25, 47, 28);
    t += 0.01;
    const on = env.hovering();
    const ax = on ? p.mouseX : p.width / 2 + Math.sin(t * 1.3) * p.width * 0.32;
    const ay = on ? p.mouseY : p.height / 2 + Math.sin(t * 1.9) * p.height * 0.3;

    for (const s of parts) {
      const dx = ax - s.x;
      const dy = ay - s.y;
      const d = Math.hypot(dx, dy) || 1;
      const f = p.map(d, 0, 350, 0.9, 0.01, true);
      s.vx += (dx / d) * f;
      s.vy += (dy / d) * f;
      s.vx *= 0.965;
      s.vy *= 0.965;
      const spd = Math.hypot(s.vx, s.vy);
      if (spd > 7) { s.vx = (s.vx / spd) * 7; s.vy = (s.vy / spd) * 7; }
      const px = s.x;
      const py = s.y;
      s.x += s.vx;
      s.y += s.vy;
      if (s.x < 0) s.x = p.width;
      if (s.x > p.width) s.x = 0;
      if (s.y < 0) s.y = p.height;
      if (s.y > p.height) s.y = 0;

      const glow = p.map(Math.hypot(s.x - ax, s.y - ay), 0, 120, 255, 180, true);
      const alpha = p.map(spd, 0, 7, 100, 230);
      if (Math.abs(s.x - px) < 50 && Math.abs(s.y - py) < 50) {
        p.stroke(80, glow, 200, alpha * 0.35);
        p.strokeWeight(1);
        p.line(px, py, s.x, s.y);
      }
      p.noStroke();
      p.fill(80, glow, 200, alpha * 0.25);
      p.circle(s.x, s.y, 9);
      p.fill(80, glow, 200, alpha);
      p.circle(s.x, s.y, 2.5);
    }

    p.noFill();
    p.stroke(100, 255, 218, 50);
    p.circle(ax, ay, 55);
    p.stroke(100, 255, 218, 22);
    p.circle(ax, ay, 110);
  };

  p.mousePressed = () => {
    for (const s of parts) {
      const dx = s.x - p.mouseX;
      const dy = s.y - p.mouseY;
      const d = Math.hypot(dx, dy) || 1;
      s.vx += (dx / d) * 18;
      s.vy += (dy / d) * 18;
    }
  };
}
