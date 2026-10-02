// Mystify: two bouncing polygons trailing colour-shifting echoes.

export default function mystify(p, env) {
  let shapes = [];
  const ECHOES = 9;
  const GAP = 3;

  function make(hue) {
    return {
      hue,
      pts: Array.from({ length: 4 }, () => ({ x: p.random(p.width), y: p.random(p.height), vx: p.random(-4, 4) || 2, vy: p.random(-4, 4) || 2 })),
      history: [],
    };
  }

  function init() {
    shapes = [make(p.random(360)), make(p.random(360))];
  }

  p.setup = () => {
    p.createCanvas(env.width, env.height);
    p.colorMode(p.HSB, 360, 100, 100, 100);
    init();
  };
  p.resized = init;
  p.restart = init;

  p.draw = () => {
    p.background(0);
    p.noFill();
    p.strokeWeight(1.6);
    for (const s of shapes) {
      for (const v of s.pts) {
        v.x += v.vx;
        v.y += v.vy;
        if (v.x < 0 || v.x > p.width) { v.vx *= -1; v.x = p.constrain(v.x, 0, p.width); }
        if (v.y < 0 || v.y > p.height) { v.vy *= -1; v.y = p.constrain(v.y, 0, p.height); }
      }
      s.hue = (s.hue + 0.4) % 360;
      if (p.frameCount % GAP === 0) {
        s.history.unshift(s.pts.map((v) => ({ x: v.x, y: v.y })));
        if (s.history.length > ECHOES) s.history.pop();
      }
      s.history.forEach((poly, i) => {
        p.stroke((s.hue + i * 4) % 360, 85, 100, 100 - i * (80 / ECHOES));
        p.beginShape();
        for (const v of poly) p.vertex(v.x, v.y);
        p.endShape(p.CLOSE);
      });
    }
  };

  p.mousePressed = () => init();
}
