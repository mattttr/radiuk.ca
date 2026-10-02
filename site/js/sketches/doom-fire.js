// Doom Fire: the PSX DOOM fire effect (as documented by Fabien Sanglard).
// A tiny cellular automaton plus a 37-colour palette.

const PALETTE = [
  0x07, 0x07, 0x07, 0x1f, 0x07, 0x07, 0x2f, 0x0f, 0x07, 0x47, 0x0f, 0x07, 0x57, 0x17, 0x07, 0x67, 0x1f, 0x07,
  0x77, 0x1f, 0x07, 0x8f, 0x27, 0x07, 0x9f, 0x2f, 0x07, 0xaf, 0x3f, 0x07, 0xbf, 0x47, 0x07, 0xc7, 0x47, 0x07,
  0xdf, 0x4f, 0x07, 0xdf, 0x57, 0x07, 0xdf, 0x57, 0x07, 0xd7, 0x5f, 0x07, 0xd7, 0x5f, 0x07, 0xd7, 0x67, 0x0f,
  0xcf, 0x6f, 0x0f, 0xcf, 0x77, 0x0f, 0xcf, 0x7f, 0x0f, 0xcf, 0x87, 0x17, 0xc7, 0x87, 0x17, 0xc7, 0x8f, 0x17,
  0xc7, 0x97, 0x1f, 0xbf, 0x9f, 0x1f, 0xbf, 0x9f, 0x1f, 0xbf, 0xa7, 0x27, 0xbf, 0xa7, 0x27, 0xbf, 0xaf, 0x2f,
  0xb7, 0xaf, 0x2f, 0xb7, 0xb7, 0x2f, 0xb7, 0xb7, 0x37, 0xcf, 0xcf, 0x6f, 0xdf, 0xdf, 0x9f, 0xef, 0xef, 0xc7,
  0xff, 0xff, 0xff,
];
const TOP = 36;

export default function doomFire(p, env) {
  let W = 0;
  let H = 0;
  let fire;
  let img;
  let on = true;
  let wind = 0;
  const SCALE = 4;

  function init() {
    W = Math.min(320, Math.ceil(p.width / SCALE));
    H = Math.min(220, Math.ceil(p.height / SCALE));
    fire = new Uint8Array(W * H);
    for (let x = 0; x < W; x++) fire[(H - 1) * W + x] = TOP;
    img = p.createImage(W, H);
  }

  p.setup = () => {
    p.createCanvas(env.width, env.height);
    p.pixelDensity(1);
    p.noSmooth();
    init();
  };
  p.resized = init;
  p.restart = () => { on = true; init(); };

  p.draw = () => {
    const target = env.hovering() ? p.map(p.mouseX, 0, p.width, -1.6, 1.6) : Math.sin(p.frameCount * 0.01) * 0.6;
    wind = p.lerp(wind, target, 0.05);

    for (let x = 0; x < W; x++) {
      for (let y = 1; y < H; y++) {
        const src = y * W + x;
        const v = fire[src];
        if (v === 0) {
          fire[src - W] = 0;
        } else {
          const r = Math.floor(Math.random() * 3.99) & 3;
          let dst = src - r + 1 + Math.round(wind * Math.random());
          dst = Math.max(W, Math.min(W * H - 1, dst));
          fire[dst - W] = Math.max(0, v - (r & 1));
        }
      }
    }
    // source row
    for (let x = 0; x < W; x++) {
      const i = (H - 1) * W + x;
      fire[i] = on ? TOP : Math.max(0, fire[i] - 1);
    }

    img.loadPixels();
    const px = img.pixels;
    for (let i = 0; i < W * H; i++) {
      const c = fire[i] * 3;
      const o = i * 4;
      px[o] = PALETTE[c];
      px[o + 1] = PALETTE[c + 1];
      px[o + 2] = PALETTE[c + 2];
      px[o + 3] = 255;
    }
    img.updatePixels();
    p.background(7);
    p.image(img, 0, p.height - H * SCALE, W * SCALE, H * SCALE);
    if (W * SCALE < p.width) p.image(img, W * SCALE, p.height - H * SCALE, W * SCALE, H * SCALE);
  };

  p.mousePressed = () => { on = !on; };
}
