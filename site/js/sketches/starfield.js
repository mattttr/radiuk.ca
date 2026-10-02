// Starfield: the screen saver that came free with every 90s PC, now with a throttle.

export default function starfield(p, env) {
  let stars = [];
  let speed = 6;
  let ox = 0;
  let oy = 0;

  function init() {
    const n = Math.round(p.constrain((p.width * p.height) / 1800, 300, 900));
    stars = Array.from({ length: n }, () => fresh(true));
  }

  function fresh(anyDepth) {
    return { x: p.random(-p.width, p.width), y: p.random(-p.height, p.height), z: anyDepth ? p.random(1, p.width) : p.width, pz: 0 };
  }

  p.setup = () => {
    p.createCanvas(env.width, env.height);
    init();
  };
  p.resized = init;
  p.restart = init;

  p.draw = () => {
    p.background(0);
    const on = env.hovering();
    const warp = on && p.mouseIsPressed;
    speed = p.lerp(speed, warp ? 45 : on ? p.map(p.mouseY, 0, p.height, 14, 2) : 7, 0.06);
    ox = p.lerp(ox, on ? (p.mouseX - p.width / 2) * 0.4 : 0, 0.05);
    oy = p.lerp(oy, on ? (p.mouseY - p.height / 2) * 0.4 : 0, 0.05);

    p.translate(p.width / 2 - ox, p.height / 2 - oy);
    for (const s of stars) {
      s.pz = s.z;
      s.z -= speed;
      if (s.z < 1) { Object.assign(s, fresh(false)); s.pz = s.z; continue; }
      const k = p.width / 2;
      const sx = (s.x / s.z) * k;
      const sy = (s.y / s.z) * k;
      const px = (s.x / s.pz) * k;
      const py = (s.y / s.pz) * k;
      const b = p.map(s.z, 0, p.width, 255, 60);
      p.stroke(b, b, Math.min(255, b + 30));
      p.strokeWeight(p.map(s.z, 0, p.width, 3.2, 0.4));
      p.line(px, py, sx, sy);
    }
  };
}
