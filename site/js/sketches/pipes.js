// 3D Pipes: a from-scratch tribute to the classic screen saver.
// Pipes grow one cell at a time through a 3D grid, turning at random and
// avoiding occupied cells. The scene slowly rotates; drag to spin it yourself.

const COLORS = [
  [235, 64, 52], [60, 200, 90], [56, 120, 240], [245, 200, 40],
  [200, 80, 220], [60, 215, 215], [245, 140, 40], [225, 225, 225],
];
const DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const N = 12;
const MAX_PIPES = 6;
const MAX_SEGMENTS = 520;

export default function pipes(p, env) {
  let grid;
  let active = [];
  let spawned = 0;
  let segs = [];
  let joints = [];
  let cell = 40;
  let idle = 0;
  let yaw = 0.6;
  let pitch = -0.35;
  let spin = 0;
  let zoom = 1;

  const idx = (x, y, z) => x + y * N + z * N * N;
  const inside = (x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < N && y < N && z < N;
  const world = (v) => [(v.x - N / 2 + 0.5) * cell, (v.y - N / 2 + 0.5) * cell, (v.z - N / 2 + 0.5) * cell];

  function reset() {
    grid = new Uint8Array(N * N * N);
    active = [];
    segs = [];
    joints = [];
    spawned = 0;
    idle = 0;
    cell = Math.min(p.width, p.height) / (N * 1.05);
    spawn();
  }

  function spawn() {
    for (let tries = 0; tries < 60; tries++) {
      const v = { x: Math.floor(p.random(N)), y: Math.floor(p.random(N)), z: Math.floor(p.random(N)) };
      if (grid[idx(v.x, v.y, v.z)]) continue;
      grid[idx(v.x, v.y, v.z)] = 1;
      const color = COLORS[spawned % COLORS.length];
      active.push({ ...v, dir: Math.floor(p.random(6)), color });
      joints.push({ ...v, color });
      spawned++;
      return true;
    }
    return false;
  }

  function step(pipe) {
    const free = (d) => {
      const [dx, dy, dz] = DIRS[d];
      return inside(pipe.x + dx, pipe.y + dy, pipe.z + dz) && !grid[idx(pipe.x + dx, pipe.y + dy, pipe.z + dz)];
    };
    let dir = pipe.dir;
    if (p.random() < 0.2 || !free(dir)) {
      const options = [0, 1, 2, 3, 4, 5].filter((d) => Math.floor(d / 2) !== Math.floor(pipe.dir / 2) && free(d));
      if (options.length) dir = p.random(options);
      else if (!free(dir)) return false;
    }
    if (dir !== pipe.dir) joints.push({ x: pipe.x, y: pipe.y, z: pipe.z, color: pipe.color });
    const [dx, dy, dz] = DIRS[dir];
    const next = { x: pipe.x + dx, y: pipe.y + dy, z: pipe.z + dz };
    segs.push({ a: { x: pipe.x, y: pipe.y, z: pipe.z }, b: next, dir, color: pipe.color });
    grid[idx(next.x, next.y, next.z)] = 1;
    Object.assign(pipe, next, { dir });
    return true;
  }

  function material(c) {
    p.fill(c[0], c[1], c[2]);
    p.ambientMaterial(c[0] * 0.5, c[1] * 0.5, c[2] * 0.5);
    p.specularMaterial(255);
  }

  p.setup = () => {
    p.createCanvas(env.width, env.height, p.WEBGL);
    p.setAttributes('antialias', true);
    reset();
  };
  p.resized = () => { cell = Math.min(p.width, p.height) / (N * 1.05); };
  p.restart = reset;

  p.draw = () => {
    // grow
    if (segs.length < MAX_SEGMENTS && (active.length || spawned < MAX_PIPES * 2)) {
      for (const pipe of [...active]) {
        if (!step(pipe)) {
          joints.push({ x: pipe.x, y: pipe.y, z: pipe.z, color: pipe.color });
          active = active.filter((q) => q !== pipe);
        }
      }
      const want = Math.min(MAX_PIPES, 1 + Math.floor(segs.length / 25));
      while (active.length < want && spawned < MAX_PIPES * 2 && spawn());
    } else if (++idle > 150) {
      reset();
    }

    // draw
    p.background(0);
    spin += 0.0025;
    p.scale(zoom);
    p.rotateX(pitch);
    p.rotateY(yaw + spin);
    p.ambientLight(50);
    p.directionalLight(230, 230, 230, 0.3, 0.6, -1);
    p.directionalLight(70, 70, 90, -0.6, -0.4, 0.5);
    p.noStroke();
    p.shininess(60);

    const r = cell * 0.17;
    for (const s of segs) {
      const a = world(s.a);
      const b = world(s.b);
      p.push();
      p.translate((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
      if (s.dir < 2) p.rotateZ(p.HALF_PI);
      else if (s.dir > 3) p.rotateX(p.HALF_PI);
      material(s.color);
      p.cylinder(r, cell, 12, 1, false, false);
      p.pop();
    }
    for (const j of joints) {
      const w = world(j);
      p.push();
      p.translate(w[0], w[1], w[2]);
      material(j.color);
      p.sphere(r * 1.32, 12, 9);
      p.pop();
    }
  };

  p.mouseDragged = () => {
    yaw += p.movedX * 0.01;
    pitch = p.constrain(pitch + p.movedY * 0.01, -1.4, 1.4);
    return false;
  };
  p.mouseWheel = (e) => {
    zoom = p.constrain(zoom * (e.delta > 0 ? 0.92 : 1.08), 0.5, 2.5);
    return false;
  };
  p.doubleClicked = () => reset();
}
