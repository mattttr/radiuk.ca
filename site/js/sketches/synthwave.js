// Synthwave: endless flight over Perlin-noise mountains toward a striped sun.

export default function synthwave(p, env) {
  const COLS = 46;
  const ROWS = 40;
  let scl = 50;
  let flying = 0;
  let drift = 0;
  let speed = 0.06;
  let steer = 0;
  let stars = [];
  const z = [];

  function init() {
    scl = Math.max(p.width, p.height) / 22;
    stars = Array.from({ length: 140 }, () => [p.random(-1, 1), p.random(-1, -0.05), p.random(0.5, 2)]);
  }

  p.setup = () => {
    p.createCanvas(env.width, env.height, p.WEBGL);
    init();
  };
  p.resized = init;

  function sun() {
    const R = Math.min(p.width, p.height) * 0.3;
    p.push();
    p.translate(0, -p.height * 0.08, -400);
    p.noStroke();
    // glow
    for (let i = 6; i >= 1; i--) {
      p.fill(255, 60, 160, 10);
      p.circle(0, 0, R * 2 + i * 26);
    }
    const top = p.color(255, 230, 90);
    const bottom = p.color(255, 40, 150);
    const step = 3;
    for (let y = -R; y < R; y += step) {
      const t = (y + R) / (2 * R);
      // horizontal slits in the lower half, getting thicker toward the bottom
      if (t > 0.5) {
        const band = (y + R) % (R * 0.16);
        if (band < (t - 0.5) * R * 0.22) continue;
      }
      const hw = Math.sqrt(Math.max(0, R * R - (y + step / 2) * (y + step / 2)));
      p.fill(p.lerpColor(top, bottom, t));
      p.rect(-hw, y, hw * 2, step + 0.5);
    }
    p.pop();
  }

  function height(x, y) {
    const center = Math.abs(x - COLS / 2) / (COLS / 2);
    const valley = Math.min(1, Math.max(0, (center - 0.12) * 1.6)) ** 1.6;
    return p.map(p.noise(x * 0.16 + drift, (y - flying) * 0.16), 0, 1, -1, 1) * scl * 3.6 * valley;
  }

  p.draw = () => {
    p.background(12, 4, 32);

    // controls
    if (env.hovering()) {
      steer = p.lerp(steer, p.map(p.mouseX, 0, p.width, -1, 1), 0.05);
      speed = p.lerp(speed, p.map(p.mouseY, 0, p.height, 0.18, 0.02), 0.05);
    } else {
      steer = p.lerp(steer, Math.sin(p.frameCount * 0.004) * 0.4, 0.02);
      speed = p.lerp(speed, 0.07, 0.02);
    }
    flying += speed;
    drift += steer * 0.02;

    // stars
    p.push();
    p.translate(0, 0, -500);
    p.stroke(255, 255, 255, 180);
    for (const [sx, sy, sw] of stars) {
      p.strokeWeight(sw);
      p.point(sx * p.width, sy * p.height * 0.9);
    }
    p.pop();

    sun();

    for (let y = 0; y < ROWS; y++) {
      z[y] = z[y] || [];
      for (let x = 0; x < COLS; x++) z[y][x] = height(x, y);
    }

    p.push();
    p.translate(0, p.height * 0.18, -120);
    p.rotateX(p.PI / 2.45);
    p.rotateZ(steer * 0.08);
    p.translate((-COLS * scl) / 2, -ROWS * scl * 0.92);

    // filled surface (dark) to hide lines behind hills
    p.noStroke();
    p.fill(20, 6, 42);
    for (let y = 0; y < ROWS - 1; y++) {
      p.beginShape(p.TRIANGLE_STRIP);
      for (let x = 0; x < COLS; x++) {
        p.vertex(x * scl, y * scl, z[y][x] - 0.5);
        p.vertex(x * scl, (y + 1) * scl, z[y + 1][x] - 0.5);
      }
      p.endShape();
    }

    // neon grid lines, fading toward the horizon
    p.noFill();
    p.strokeWeight(1.6);
    for (let y = 0; y < ROWS; y++) {
      const a = p.map(y, 0, ROWS - 1, 30, 255);
      p.stroke(255, 60, 200, a);
      p.beginShape();
      for (let x = 0; x < COLS; x++) p.vertex(x * scl, y * scl, z[y][x]);
      p.endShape();
    }
    for (let x = 0; x < COLS; x++) {
      p.stroke(120, 80, 255, 170);
      p.beginShape();
      for (let y = 0; y < ROWS; y++) p.vertex(x * scl, y * scl, z[y][x]);
      p.endShape();
    }
    p.pop();
  };
}
