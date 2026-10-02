// Lissajous Weave: tune two frequencies with the mouse; it morphs on its own otherwise.

export default function lissajous(p, env) {
  let time = 0;
  let fa = 3;
  let fb = 2;

  p.setup = () => {
    p.createCanvas(env.width, env.height);
    p.background(10, 25, 47);
  };
  p.resized = () => p.background(10, 25, 47);

  p.draw = () => {
    p.background(10, 25, 47, 18);
    time += 0.01;
    const cx = p.width / 2;
    const cy = p.height / 2;
    const rx = p.width * 0.42;
    const ry = p.height * 0.42;

    let ta;
    let tb;
    if (env.hovering()) {
      ta = p.map(p.mouseX, 0, p.width, 1, 6);
      tb = p.map(p.mouseY, 0, p.height, 1, 6);
    } else {
      ta = 3 + Math.sin(time * 0.09) * 1.5;
      tb = 2 + Math.cos(time * 0.07) * 1.8;
    }
    fa = p.lerp(fa, ta, 0.1);
    fb = p.lerp(fb, tb, 0.1);
    const delta = time * 0.25;
    const steps = 700;
    p.noFill();
    p.strokeWeight(1.4);
    for (let i = 0; i < steps; i++) {
      const t1 = (i / steps) * p.TWO_PI * 8;
      const t2 = ((i + 1) / steps) * p.TWO_PI * 8;
      const prog = i / steps;
      p.stroke(p.map(prog, 0, 1, 50, 120), p.map(prog, 0, 1, 160, 255), p.map(prog, 0, 1, 200, 218), p.map(prog, 0, 1, 20, 160));
      p.line(cx + Math.cos(fa * t1 + delta) * rx, cy + Math.sin(fb * t1) * ry, cx + Math.cos(fa * t2 + delta) * rx, cy + Math.sin(fb * t2) * ry);
    }

    const dt = (time * 0.6) % (p.TWO_PI * 8);
    const dx = cx + Math.cos(fa * dt + delta) * rx;
    const dy = cy + Math.sin(fb * dt) * ry;
    p.noStroke();
    p.fill(100, 255, 218, 50);
    p.circle(dx, dy, 18);
    p.fill(100, 255, 218, 220);
    p.circle(dx, dy, 7);
  };
}
