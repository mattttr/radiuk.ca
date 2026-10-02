// Double Pendulum: three pendulums that start a hair apart and quickly diverge.

const COLORS = [[100, 255, 218], [255, 95, 162], [255, 214, 90]];

export default function pendulum(p, env) {
  let trail;
  let pends = [];
  let L = 120;
  const G = 1;
  const SUB = 10;

  function init(a1 = p.PI * 0.6 + p.random(-0.3, 0.3), a2 = p.PI * 0.9 + p.random(-0.3, 0.3)) {
    L = Math.min(p.width, p.height) * 0.23;
    pends = COLORS.map((color, i) => ({
      a1: a1 + i * 0.0015, a2, v1: 0, v2: 0, m1: 10, m2: 10, color, prev: null,
    }));
    trail = p.createGraphics(p.width, p.height);
    trail.pixelDensity(1);
    trail.background(10, 25, 47);
  }

  function physics(s, dt) {
    const { a1, a2, v1, v2, m1, m2 } = s;
    const den = 2 * m1 + m2 - m2 * Math.cos(2 * a1 - 2 * a2);
    const acc1 = (-G * (2 * m1 + m2) * Math.sin(a1) - m2 * G * Math.sin(a1 - 2 * a2)
      - 2 * Math.sin(a1 - a2) * m2 * (v2 * v2 * L + v1 * v1 * L * Math.cos(a1 - a2))) / (L * den);
    const acc2 = (2 * Math.sin(a1 - a2) * (v1 * v1 * L * (m1 + m2) + G * (m1 + m2) * Math.cos(a1) + v2 * v2 * L * m2 * Math.cos(a1 - a2))) / (L * den);
    s.v1 += acc1 * dt;
    s.v2 += acc2 * dt;
    s.a1 += s.v1 * dt;
    s.a2 += s.v2 * dt;
  }

  p.setup = () => {
    p.createCanvas(env.width, env.height);
    init();
  };
  p.resized = () => init();
  p.restart = () => init();

  p.draw = () => {
    const ox = p.width / 2;
    const oy = p.height * 0.42;
    for (let k = 0; k < SUB; k++) for (const s of pends) physics(s, 1 / SUB);

    trail.noStroke();
    trail.fill(10, 25, 47, 6);
    trail.rect(0, 0, trail.width, trail.height);
    trail.strokeWeight(1.6);
    for (const s of pends) {
      const x2 = ox + L * Math.sin(s.a1) + L * Math.sin(s.a2);
      const y2 = oy + L * Math.cos(s.a1) + L * Math.cos(s.a2);
      if (s.prev) {
        trail.stroke(...s.color, 200);
        trail.line(s.prev.x, s.prev.y, x2, y2);
      }
      s.prev = { x: x2, y: y2 };
    }
    p.image(trail, 0, 0, p.width, p.height);

    for (const s of pends) {
      const x1 = ox + L * Math.sin(s.a1);
      const y1 = oy + L * Math.cos(s.a1);
      const x2 = x1 + L * Math.sin(s.a2);
      const y2 = y1 + L * Math.cos(s.a2);
      p.stroke(...s.color, 160);
      p.strokeWeight(2);
      p.line(ox, oy, x1, y1);
      p.line(x1, y1, x2, y2);
      p.noStroke();
      p.fill(...s.color);
      p.circle(x1, y1, 12);
      p.circle(x2, y2, 12);
    }
    p.fill(255);
    p.circle(ox, oy, 6);
  };

  p.mousePressed = () => {
    const a = Math.atan2(p.mouseX - p.width / 2, p.mouseY - p.height * 0.42);
    init(a, a + p.random(-0.5, 0.5));
  };
}
