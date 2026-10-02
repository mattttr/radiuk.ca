// Ripple Tank: a damped 2D wave equation on a grid. Click or drag to drop pebbles.

export default function rippleTank(p, env) {
  const CELL = 5;
  let W = 0;
  let H = 0;
  let cur;
  let prev;
  let next;
  let img;
  let lastDrop = 0;

  function init() {
    W = Math.ceil(p.width / CELL);
    H = Math.ceil(p.height / CELL);
    cur = new Float32Array(W * H);
    prev = new Float32Array(W * H);
    next = new Float32Array(W * H);
    img = p.createImage(W, H);
  }

  function drop(px, py, strength = 2.5) {
    const gx = Math.floor(px / CELL);
    const gy = Math.floor(py / CELL);
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const nx = gx + dx;
        const ny = gy + dy;
        if (nx > 0 && nx < W - 1 && ny > 0 && ny < H - 1) {
          const d = Math.hypot(dx, dy);
          if (d < 4) cur[ny * W + nx] = (4 - d) * strength;
        }
      }
    }
  }

  p.setup = () => {
    p.createCanvas(env.width, env.height);
    p.pixelDensity(1);
    p.noSmooth();
    init();
  };
  p.resized = init;
  p.restart = init;

  p.draw = () => {
    for (let y = 1; y < H - 1; y++) {
      for (let x = 1; x < W - 1; x++) {
        const i = y * W + x;
        next[i] = ((cur[i - 1] + cur[i + 1] + cur[i - W] + cur[i + W]) / 2 - prev[i]) * 0.988;
      }
    }
    const t = prev; prev = cur; cur = next; next = t;

    // auto rain when nobody's playing
    if (!env.hovering() && p.frameCount - lastDrop > 45) {
      lastDrop = p.frameCount;
      drop(p.random(p.width), p.random(p.height), p.random(1.5, 2.5));
    }
    if (p.mouseIsPressed && env.hovering() && p.frameCount % 3 === 0) drop(p.mouseX, p.mouseY);

    img.loadPixels();
    const px = img.pixels;
    for (let i = 0; i < W * H; i++) {
      const v = Math.max(-1, Math.min(1, cur[i]));
      const o = i * 4;
      px[o] = 10 + v * 70;
      px[o + 1] = 25 + Math.max(0, v) * 230 + Math.min(0, v) * 20;
      px[o + 2] = 47 + v * 170;
      px[o + 3] = 255;
    }
    img.updatePixels();
    p.image(img, 0, 0, W * CELL, H * CELL);
  };

  p.mousePressed = () => { drop(p.mouseX, p.mouseY); };
}
