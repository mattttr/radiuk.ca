// Flow Field: particles riding an evolving Perlin-noise vector field.

export default function flowField(p, env) {
  let parts = [];
  let time = 0;

  function init() {
    const n = Math.round(p.constrain((p.width * p.height) / 650, 250, 1100));
    parts = Array.from({ length: n }, () => ({ x: p.random(p.width), y: p.random(p.height), vx: 0, vy: 0 }));
    p.background(10, 25, 47);
  }

  p.setup = () => {
    p.createCanvas(env.width, env.height);
    init();
  };
  p.resized = init;
  p.restart = init;

  p.draw = () => {
    p.background(10, 25, 47, 30);
    time += 0.01;
    const hovering = env.hovering();
    p.strokeWeight(1.2);

    for (const fp of parts) {
      let angle = p.noise(fp.x * 0.003, fp.y * 0.003, time * 0.4) * p.TWO_PI * 4;

      if (hovering) {
        const md = p.dist(fp.x, fp.y, p.mouseX, p.mouseY);
        if (md < 120) {
          const push = p.atan2(fp.y - p.mouseY, fp.x - p.mouseX);
          angle += (push - angle) * p.map(md, 0, 120, 1, 0) * 0.85;
        }
      }

      fp.vx = fp.vx * 0.9 + p.cos(angle) * 0.5;
      fp.vy = fp.vy * 0.9 + p.sin(angle) * 0.5;
      const px = fp.x;
      const py = fp.y;
      fp.x += fp.vx;
      fp.y += fp.vy;

      let wrapped = false;
      if (fp.x < 0) { fp.x = p.width; wrapped = true; }
      if (fp.x > p.width) { fp.x = 0; wrapped = true; }
      if (fp.y < 0) { fp.y = p.height; wrapped = true; }
      if (fp.y > p.height) { fp.y = 0; wrapped = true; }

      if (!wrapped) {
        const speed = Math.hypot(fp.vx, fp.vy);
        p.stroke(80, p.map(speed, 0, 2, 180, 255), p.map(speed, 0, 2, 155, 218), p.map(speed, 0, 2, 15, 130));
        p.line(px, py, fp.x, fp.y);
      }
    }
  };
}
