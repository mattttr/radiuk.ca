// Fourier Epicycles: draw a closed shape; a discrete Fourier transform
// rebuilds it from a chain of rotating circles.

const N = 256;

export default function epicycles(p, env) {
  let mode = 'play'; // 'draw' | 'play'
  let drawing = [];
  let fourier = [];
  let time = 0;
  let trace = [];

  function dft(points) {
    const out = [];
    const n = points.length;
    for (let k = 0; k < n; k++) {
      let re = 0;
      let im = 0;
      for (let t = 0; t < n; t++) {
        const phi = (p.TWO_PI * k * t) / n;
        re += points[t].x * Math.cos(phi) + points[t].y * Math.sin(phi);
        im += points[t].y * Math.cos(phi) - points[t].x * Math.sin(phi);
      }
      re /= n;
      im /= n;
      const freq = k > n / 2 ? k - n : k;
      out.push({ freq, amp: Math.hypot(re, im), phase: Math.atan2(im, re) });
    }
    return out.sort((a, b) => b.amp - a.amp);
  }

  /** Resample a polyline to N evenly spaced points (closed loop). */
  function resample(pts) {
    const closed = [...pts, pts[0]];
    const lens = [0];
    for (let i = 1; i < closed.length; i++) lens.push(lens[i - 1] + Math.hypot(closed[i].x - closed[i - 1].x, closed[i].y - closed[i - 1].y));
    const total = lens[lens.length - 1] || 1;
    const out = [];
    let j = 1;
    for (let i = 0; i < N; i++) {
      const d = (i / N) * total;
      while (j < lens.length - 1 && lens[j] < d) j++;
      const seg = lens[j] - lens[j - 1] || 1;
      const t = (d - lens[j - 1]) / seg;
      out.push({ x: p.lerp(closed[j - 1].x, closed[j].x, t), y: p.lerp(closed[j - 1].y, closed[j].y, t) });
    }
    return out;
  }

  function heart() {
    const s = Math.min(p.width, p.height) / 38;
    const pts = [];
    for (let i = 0; i < N; i++) {
      const t = (i / N) * p.TWO_PI;
      pts.push({
        x: 16 * Math.sin(t) ** 3 * s,
        y: -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * s,
      });
    }
    return pts;
  }

  function play(points) {
    fourier = dft(points);
    time = 0;
    trace = [];
    mode = 'play';
  }

  p.setup = () => {
    p.createCanvas(env.width, env.height);
    play(heart());
  };
  p.resized = () => { if (mode === 'play') play(heart()); };
  p.restart = () => play(heart());

  p.draw = () => {
    p.background(10, 25, 47);

    if (mode === 'draw') {
      p.noFill();
      p.stroke(255, 95, 162);
      p.strokeWeight(2.5);
      p.beginShape();
      for (const v of drawing) p.vertex(v.x + p.width / 2, v.y + p.height / 2);
      p.endShape();
      if (p.mouseIsPressed && env.hovering()) {
        const v = { x: p.mouseX - p.width / 2, y: p.mouseY - p.height / 2 };
        const last = drawing[drawing.length - 1];
        if (!last || Math.hypot(v.x - last.x, v.y - last.y) > 3) drawing.push(v);
      }
      hint('Release to transform...');
      return;
    }

    let x = p.width / 2;
    let y = p.height / 2;
    for (let i = 0; i < fourier.length; i++) {
      const { freq, amp, phase } = fourier[i];
      const px = x;
      const py = y;
      x += amp * Math.cos(freq * time + phase);
      y += amp * Math.sin(freq * time + phase);
      if (amp > 0.4) {
        p.noFill();
        p.stroke(100, 255, 218, i < 3 ? 90 : 45);
        p.strokeWeight(1);
        p.circle(px, py, amp * 2);
        p.stroke(100, 255, 218, 160);
        p.line(px, py, x, y);
      }
    }
    trace.unshift({ x, y });
    if (trace.length > N) trace.pop();

    p.noFill();
    p.stroke(255, 95, 162);
    p.strokeWeight(2.5);
    p.beginShape();
    for (const v of trace) p.vertex(v.x, v.y);
    p.endShape();
    p.noStroke();
    p.fill(255, 230, 120);
    p.circle(x, y, 7);

    time += p.TWO_PI / N;
    if (time > p.TWO_PI) time = 0;
    hint(`${fourier.length} circles · draw your own shape with the mouse`);
  };

  function hint(text) {
    p.noStroke();
    p.fill(100, 255, 218, 120);
    p.textSize(13);
    p.textFont('monospace');
    p.text(text, 12, p.height - 12);
  }

  p.mousePressed = () => {
    mode = 'draw';
    drawing = [];
  };
  p.mouseReleased = () => {
    if (mode !== 'draw') return;
    if (drawing.length > 12) play(resample(drawing));
    else play(heart());
  };
}
