// Fractal Tree: recursive branches swaying in the wind, steered by the cursor.

export default function fractalTree(p, env) {
  let time = 0;
  let angle = 0.5;
  let length = 100;

  p.setup = () => {
    p.createCanvas(env.width, env.height);
  };

  function branch(len, a, depth) {
    p.stroke(100, 255, 218, p.map(len, 4, 160, 60, 255));
    p.strokeWeight(p.map(len, 4, 160, 1, 4));
    a += p.sin(time * 3 + depth) * p.map(len, 4, 160, 0.05, 0.02);
    const ex = p.sin(a) * len;
    const ey = -p.cos(a) * len;
    p.line(0, 0, ex, ey);
    if (len > 4) {
      p.push();
      p.translate(ex, ey);
      branch(len * 0.67, a + angle, depth + 1);
      branch(len * 0.67, a - angle, depth + 1);
      p.pop();
    }
  }

  p.draw = () => {
    p.background(10, 25, 47, 220);
    time += 0.01;
    const scale = p.height / 500;
    let targetAngle;
    let targetLen;
    if (env.hovering()) {
      targetAngle = p.map(p.mouseX, 0, p.width, -p.PI / 3, p.PI / 3);
      targetLen = p.map(p.dist(p.mouseX, p.mouseY, p.width / 2, p.height), 0, p.height, 40, 125) * scale;
    } else {
      targetAngle = 0.45 + p.sin(time * 0.6) * 0.35;
      targetLen = (95 + p.sin(time * 0.4) * 15) * scale;
    }
    angle = p.lerp(angle, targetAngle, 0.08);
    length = p.lerp(length, p.constrain(targetLen, 30, 160), 0.08);
    p.translate(p.width / 2, p.height);
    branch(length, 0, 0);
  };
}
