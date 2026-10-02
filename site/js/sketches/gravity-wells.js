// Gravity Wells: particles orbiting three drifting attractors; the cursor repels.

export default function gravityWells(p, env) {
  let parts = [];
  let time = 0;

  function init() {
    const n = Math.round(p.constrain((p.width * p.height) / 2200, 120, 360));
    parts = Array.from({ length: n }, () => ({
      x: p.random(p.width), y: p.random(p.height), vx: p.random(-1.5, 1.5), vy: p.random(-1.5, 1.5),
    }));
    p.background(10, 25, 47);
  }

  p.setup = () => {
    p.createCanvas(env.width, env.height);
    init();
  };
  p.resized = init;
  p.restart = init;

  p.draw = () => {
    p.background(10, 25, 47, 20);
    time += 0.01;
    const s = Math.min(p.width, p.height) / 500;
    const wells = [
      { x: p.width * 0.25 + p.cos(time * 0.3) * 70 * s, y: p.height * 0.4 + p.sin(time * 0.25) * 50 * s, mass: 700 },
      { x: p.width * 0.75 + p.cos(time * 0.35 + 2) * 60 * s, y: p.height * 0.5 + p.sin(time * 0.3 + 2) * 50 * s, mass: 700 },
      { x: p.width * 0.5 + p.cos(time * 0.28 + 4) * 80 * s, y: p.height * 0.62 + p.sin(time * 0.32 + 4) * 55 * s, mass: 500 },
    ];
    const mouseOn = env.hovering();

    p.strokeWeight(1);
    for (const gp of parts) {
      for (const w of wells) {
        const dx = w.x - gp.x;
        const dy = w.y - gp.y;
        const d2 = dx * dx + dy * dy;
        const d = Math.sqrt(d2);
        if (d < 5) continue;
        const f = w.mass / Math.max(d2, 400);
        gp.vx += (dx / d) * f * 0.15;
        gp.vy += (dy / d) * f * 0.15;
      }
      if (mouseOn) {
        const dx = gp.x - p.mouseX;
        const dy = gp.y - p.mouseY;
        const d2 = dx * dx + dy * dy;
        const d = Math.sqrt(d2);
        if (d < 160 && d > 0) {
          const f = 28000 / Math.max(d2, 100);
          gp.vx += (dx / d) * f;
          gp.vy += (dy / d) * f;
        }
      }
      const speed = Math.hypot(gp.vx, gp.vy);
      if (speed > 5) { gp.vx = (gp.vx / speed) * 5; gp.vy = (gp.vy / speed) * 5; }

      const px = gp.x;
      const py = gp.y;
      gp.x += gp.vx;
      gp.y += gp.vy;
      let wrapped = false;
      if (gp.x < 0) { gp.x = p.width; wrapped = true; }
      if (gp.x > p.width) { gp.x = 0; wrapped = true; }
      if (gp.y < 0) { gp.y = p.height; wrapped = true; }
      if (gp.y > p.height) { gp.y = 0; wrapped = true; }
      if (!wrapped) {
        p.stroke(p.map(speed, 0, 5, 60, 140), p.map(speed, 0, 5, 200, 255), p.map(speed, 0, 5, 180, 218), p.map(speed, 0, 5, 25, 160));
        p.line(px, py, gp.x, gp.y);
      }
    }

    p.noFill();
    for (const w of wells) {
      for (let ring = 1; ring <= 3; ring++) {
        p.stroke(100, 255, 218, p.map(ring, 1, 3, 90, 15));
        p.circle(w.x, w.y, ring * 24 + p.sin(time * 3 + ring) * 4);
      }
      p.noStroke();
      p.fill(100, 255, 218, 210);
      p.circle(w.x, w.y, 7);
      p.noFill();
    }
    if (mouseOn) {
      p.stroke(100, 180, 255, 50);
      p.circle(p.mouseX, p.mouseY, 50);
      p.circle(p.mouseX, p.mouseY, 80);
    }
  };
}
