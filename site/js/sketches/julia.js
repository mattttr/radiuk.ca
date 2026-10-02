// Julia Explorer: Julia sets rendered on the GPU in a fragment shader.
// The cursor picks the complex constant c, so moving the mouse is like
// walking across the Mandelbrot set. Scroll zooms, click freezes,
// double-click resets, M toggles the Mandelbrot set itself.

const VERT = `
attribute vec3 aPosition;
attribute vec2 aTexCoord;
varying vec2 vUv;
void main() {
  vUv = aTexCoord;
  vec4 pos = vec4(aPosition, 1.0);
  pos.xy = pos.xy * 2.0 - 1.0;
  gl_Position = pos;
}`;

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv;
uniform vec2 uRes;
uniform vec2 uC;
uniform float uZoom;
uniform float uTime;
uniform float uMandel;
const int MAXI = 220;

vec3 ramp(float t) {
  vec3 navy = vec3(0.04, 0.10, 0.18);
  vec3 teal = vec3(0.39, 1.0, 0.85);
  vec3 pink = vec3(1.0, 0.37, 0.64);
  vec3 gold = vec3(1.0, 0.95, 0.80);
  if (t < 0.45) return mix(navy, teal, t / 0.45);
  if (t < 0.8) return mix(teal, pink, (t - 0.45) / 0.35);
  return mix(pink, gold, (t - 0.8) / 0.2);
}

void main() {
  vec2 uv = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
  vec2 pt = uv * 3.0 / uZoom;
  if (uMandel > 0.5) pt += vec2(-0.6, 0.0);
  vec2 z = uMandel > 0.5 ? vec2(0.0) : pt;
  vec2 c = uMandel > 0.5 ? pt : uC;
  float n = 0.0;
  float m = 0.0;
  for (int i = 0; i < MAXI; i++) {
    z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    m = dot(z, z);
    if (m > 256.0) break;
    n += 1.0;
  }
  if (n >= float(MAXI)) {
    gl_FragColor = vec4(0.02, 0.03, 0.08, 1.0);
    return;
  }
  float sn = n - log2(log2(m)) + 4.0;
  float t = pow(clamp(sn / 70.0, 0.0, 1.0), 0.55);
  vec3 col = ramp(t) * (0.88 + 0.12 * cos(sn * 0.45 - uTime * 1.5));
  gl_FragColor = vec4(col, 1.0);
}`;

export default function julia(p, env) {
  let shader;
  let cx = -0.75;
  let cy = 0.24;
  let zoom = 1;
  let targetZoom = 1;
  let frozen = false;
  let mandel = false;

  p.setup = () => {
    p.createCanvas(env.width, env.height, p.WEBGL);
    p.pixelDensity(Math.min(1.5, window.devicePixelRatio || 1));
    shader = p.createShader(VERT, FRAG);
    p.noStroke();
  };

  p.draw = () => {
    if (!frozen) {
      let tx;
      let ty;
      if (env.hovering()) {
        tx = p.map(p.mouseX, 0, p.width, -2.0, 0.6);
        ty = p.map(p.mouseY, 0, p.height, -1.2, 1.2);
      } else {
        const t = p.millis() / 9000 + 2.83;
        tx = 0.7885 * Math.cos(t);
        ty = 0.7885 * Math.sin(t);
      }
      cx = p.lerp(cx, tx, 0.08);
      cy = p.lerp(cy, ty, 0.08);
    }
    zoom = p.lerp(zoom, targetZoom, 0.15);
    p.shader(shader);
    shader.setUniform('uRes', [p.width, p.height]);
    shader.setUniform('uC', [cx, cy]);
    shader.setUniform('uZoom', zoom);
    shader.setUniform('uTime', p.millis() / 1000);
    shader.setUniform('uMandel', mandel ? 1 : 0);
    p.rect(0, 0, p.width, p.height);
  };

  p.mouseWheel = (e) => {
    targetZoom = p.constrain(targetZoom * (e.delta > 0 ? 0.88 : 1.14), 0.4, 400);
    return false;
  };
  p.mousePressed = () => { frozen = !frozen; };
  p.doubleClicked = () => { targetZoom = 1; frozen = false; };
  p.keyPressed = () => {
    if (p.key === 'm' || p.key === 'M') mandel = !mandel;
  };
  p.restart = () => { targetZoom = 1; frozen = false; mandel = false; };
}
