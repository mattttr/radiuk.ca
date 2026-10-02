// Lorenz Attractor, integrated live and projected to 2D by hand (fast on any GPU).
// Drag to orbit, scroll to zoom.

const SIGMA = 10;
const RHO = 28;
const BETA = 8 / 3;
const DT = 0.005;
const MAX = 2400;
const COLORS = [[100, 255, 218], [255, 95, 162], [255, 214, 90]];

export default function lorenz(p, env) {
  let trails = [];
  let yaw = 0.6;
  let pitch = 0.25;
  let zoom = 1;
  let spin = 0;

  function init() {
    trails = COLORS.map((color, i) => ({ x: 0.1 + i * 0.001, y: 0, z: 0, pts: [], color }));
  }

  function advance(t) {
    const dx = SIGMA * (t.y - t.x);
    const dy = t.x * (RHO - t.z) - t.y;
    const dz = t.x * t.y - BETA * t.z;
    t.x += dx * DT;
    t.y += dy * DT;
    t.z += dz * DT;
    t.pts.push([t.x, t.y, t.z]);
    if (t.pts.length > MAX) t.pts.shift();
  }

  p.setup = () => {
    p.createCanvas(env.width, env.height);
    init();
  };
  p.restart = init;

  p.draw = () => {
    p.background(10, 25, 47);
    for (const t of trails) for (let k = 0; k < 6; k++) advance(t);

    spin += 0.003;
    const cy = Math.cos(yaw + spin);
    const sy = Math.sin(yaw + spin);
    const cp = Math.cos(pitch);
    const sp = Math.sin(pitch);
    const scale = (Math.min(p.width, p.height) / 62) * zoom;
    const cx = p.width / 2;
    const cyy = p.height / 2;
    const project = ([x, y, z]) => {
      // center the butterfly, then rotate (yaw around vertical z axis, then pitch)
      const X = x;
      const Y = y;
      const Z = z - 25;
      const x1 = X * cy - Y * sy;
      const y1 = X * sy + Y * cy;
      const y2 = y1 * cp - Z * sp;
      const z2 = y1 * sp + Z * cp;
      const f = 300 / (300 + y2 * 2);
      return [cx + x1 * scale * f, cyy - z2 * scale * f];
    };

    const ctx = p.drawingContext;
    ctx.lineWidth = 1.4;
    ctx.lineCap = 'round';
    for (const t of trails) {
      const pts = t.pts.map(project);
      const n = pts.length;
      const BATCH = 60;
      for (let s = 1; s < n; s += BATCH) {
        const alpha = (s / n) ** 1.5;
        ctx.strokeStyle = `rgba(${t.color[0]},${t.color[1]},${t.color[2]},${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(pts[s - 1][0], pts[s - 1][1]);
        for (let i = s; i < Math.min(n, s + BATCH); i++) ctx.lineTo(pts[i][0], pts[i][1]);
        ctx.stroke();
      }
      const head = pts[n - 1];
      if (head) {
        p.noStroke();
        p.fill(...t.color, 60);
        p.circle(head[0], head[1], 16);
        p.fill(...t.color);
        p.circle(head[0], head[1], 6);
      }
    }
  };

  p.mouseDragged = () => {
    yaw += p.movedX * 0.01;
    pitch = p.constrain(pitch + p.movedY * 0.01, -1.5, 1.5);
    return false;
  };
  p.mouseWheel = (e) => {
    zoom = p.constrain(zoom * (e.delta > 0 ? 0.9 : 1.1), 0.4, 4);
    return false;
  };
}
