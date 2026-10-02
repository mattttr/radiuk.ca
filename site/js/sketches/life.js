// Conway's Game of Life on a wrapping grid, coloured by cell age.
// Draw with the mouse. Space pauses, R randomises, C clears, G drops a glider gun.

const GUN = [
  [24, 0], [22, 1], [24, 1], [12, 2], [13, 2], [20, 2], [21, 2], [34, 2], [35, 2],
  [11, 3], [15, 3], [20, 3], [21, 3], [34, 3], [35, 3], [0, 4], [1, 4], [10, 4], [16, 4], [20, 4], [21, 4],
  [0, 5], [1, 5], [10, 5], [14, 5], [16, 5], [17, 5], [22, 5], [24, 5], [10, 6], [16, 6], [24, 6],
  [11, 7], [15, 7], [12, 8], [13, 8],
];

export default function life(p, env) {
  const CELL = 8;
  let cols = 0;
  let rows = 0;
  let cells;
  let next;
  let age;
  let img;
  let paused = false;
  let stale = 0;
  let lastPop = 0;

  function init(randomize = true) {
    cols = Math.max(10, Math.floor(p.width / CELL));
    rows = Math.max(10, Math.floor(p.height / CELL));
    cells = new Uint8Array(cols * rows);
    next = new Uint8Array(cols * rows);
    age = new Uint16Array(cols * rows);
    img = p.createImage(cols, rows);
    if (randomize) for (let i = 0; i < cells.length; i++) cells[i] = Math.random() < 0.22 ? 1 : 0;
  }

  function step() {
    let pop = 0;
    for (let y = 0; y < rows; y++) {
      const up = ((y - 1 + rows) % rows) * cols;
      const mid = y * cols;
      const down = ((y + 1) % rows) * cols;
      for (let x = 0; x < cols; x++) {
        const l = (x - 1 + cols) % cols;
        const r = (x + 1) % cols;
        const n = cells[up + l] + cells[up + x] + cells[up + r] + cells[mid + l] + cells[mid + r] + cells[down + l] + cells[down + x] + cells[down + r];
        const i = mid + x;
        const alive = cells[i] ? n === 2 || n === 3 : n === 3;
        next[i] = alive ? 1 : 0;
        age[i] = alive ? Math.min(age[i] + 1, 60000) : 0;
        pop += next[i];
      }
    }
    [cells, next] = [next, cells];
    // keep the screen saver alive: reseed if the board stagnates
    stale = pop === lastPop ? stale + 1 : 0;
    lastPop = pop;
    if (!env.hovering() && (stale > 90 || pop < cells.length * 0.01)) {
      for (let i = 0; i < cells.length; i++) if (Math.random() < 0.06) cells[i] = 1;
      stale = 0;
    }
  }

  function paint(px, py) {
    const gx = Math.floor(px / CELL);
    const gy = Math.floor(py / CELL);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (Math.random() < 0.6) {
          const x = (gx + dx + cols) % cols;
          const y = (gy + dy + rows) % rows;
          cells[y * cols + x] = 1;
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
  p.resized = () => init();
  p.restart = () => init();

  p.draw = () => {
    if (p.mouseIsPressed && env.hovering()) paint(p.mouseX, p.mouseY);
    if (!paused && p.frameCount % 2 === 0) step();

    img.loadPixels();
    const px = img.pixels;
    for (let i = 0; i < cells.length; i++) {
      const o = i * 4;
      if (cells[i]) {
        const a = Math.min(age[i], 40) / 40;
        px[o] = 255 - a * 175;      // young: warm white -> old: teal/blue
        px[o + 1] = 255 - a * 60;
        px[o + 2] = 200 + a * 18;
      } else {
        px[o] = 10;
        px[o + 1] = 25;
        px[o + 2] = 47;
      }
      px[o + 3] = 255;
    }
    img.updatePixels();
    p.background(10, 25, 47);
    p.image(img, 0, 0, cols * CELL, rows * CELL);

    if (paused) {
      p.noStroke();
      p.fill(255, 230, 120);
      p.textSize(14);
      p.textFont('monospace');
      p.text('PAUSED (space to resume)', 12, p.height - 12);
    }
  };

  p.keyPressed = () => {
    const k = p.key.toLowerCase();
    if (k === ' ') { paused = !paused; return false; }
    if (k === 'r') init(true);
    if (k === 'c') init(false);
    if (k === 'g') {
      const ox = env.hovering() ? Math.floor(p.mouseX / CELL) : 2;
      const oy = env.hovering() ? Math.floor(p.mouseY / CELL) : 2;
      for (const [x, y] of GUN) cells[((oy + y) % rows) * cols + ((ox + x) % cols)] = 1;
    }
    return undefined;
  };
}
