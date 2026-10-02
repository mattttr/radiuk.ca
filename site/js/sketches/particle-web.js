// Particle Web: the sketch that opened the original radiuk.ca.

export default function particleWeb(p, env) {
  let particles = [];

  function init() {
    const n = Math.round(p.constrain((p.width * p.height) / 7500, 30, 150));
    particles = Array.from({ length: n }, () => ({
      x: p.random(p.width),
      y: p.random(p.height),
      size: p.random(3, 8),
      vx: p.random(-1.5, 1.5),
      vy: p.random(-1.5, 1.5),
    }));
  }

  p.setup = () => {
    p.createCanvas(env.width, env.height);
    init();
  };
  p.resized = init;
  p.restart = init;

  p.draw = () => {
    p.background(10, 25, 47, 220);
    const hovering = env.hovering();

    for (const a of particles) {
      a.x += a.vx;
      a.y += a.vy;
      if (a.x < 0 || a.x > p.width) a.vx *= -1;
      if (a.y < 0 || a.y > p.height) a.vy *= -1;
      if (hovering) {
        const d = p.dist(p.mouseX, p.mouseY, a.x, a.y);
        if (d < 100 && d > 0) {
          a.x += ((a.x - p.mouseX) / d) * 2;
          a.y += ((a.y - p.mouseY) / d) * 2;
        }
      }
    }

    p.strokeWeight(1);
    for (let i = 0; i < particles.length; i++) {
      const a = particles[i];
      for (let j = i + 1; j < particles.length; j++) {
        const b = particles[j];
        const d = p.dist(a.x, a.y, b.x, b.y);
        if (d < 110) {
          p.stroke(100, 255, 218, p.map(d, 0, 110, 70, 0));
          p.line(a.x, a.y, b.x, b.y);
        }
      }
      if (hovering) {
        const dm = p.dist(a.x, a.y, p.mouseX, p.mouseY);
        if (dm < 160) {
          p.stroke(255, 255, 255, p.map(dm, 0, 160, 90, 0));
          p.line(a.x, a.y, p.mouseX, p.mouseY);
        }
      }
    }

    p.noStroke();
    p.fill(100, 255, 218);
    for (const a of particles) p.circle(a.x, a.y, a.size);
  };
}
