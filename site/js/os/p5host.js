// Lazy-loads p5.js and mounts sketches (instance mode) into any container:
// a window, the wallpaper, the screen saver or the standalone sketch page.

const P5_URL = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.10/p5.min.js';
let loading = null;

export function loadP5() {
  if (window.p5) return Promise.resolve(window.p5);
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = P5_URL;
      s.async = true;
      s.crossOrigin = 'anonymous';
      s.onload = () => resolve(window.p5);
      s.onerror = () => { loading = null; reject(new Error('Could not load p5.js. Are you offline?')); };
      document.head.append(s);
    });
  }
  return loading;
}

const MOUSE_EVENTS = ['mousePressed', 'mouseClicked', 'doubleClicked', 'mouseWheel', 'touchStarted'];
const DRAG_EVENTS = ['mouseDragged', 'mouseReleased', 'touchMoved', 'touchEnded'];
const KEY_EVENTS = ['keyPressed', 'keyReleased', 'keyTyped'];

/**
 * Mount a sketch.
 * options:
 *   isActive()   whether keyboard events should reach the sketch (focused window)
 *   pointerAll   treat the pointer as "hovering" whenever it's over `hoverTarget`
 *   hoverTarget  element whose hover state counts (defaults to the container)
 *   density      pixel density cap
 *   onFrame(fps) called ~4x per second
 */
export async function mountSketch(container, id, options = {}) {
  const [P5, mod] = await Promise.all([loadP5(), import(`../sketches/${id}.js`)]);

  let hovering = false;
  let pressedOnCanvas = false;
  const hoverTarget = options.hoverTarget || container;
  const size = () => ({
    w: Math.max(40, Math.floor(container.clientWidth)),
    h: Math.max(40, Math.floor(container.clientHeight)),
  });

  const env = {
    get width() { return size().w; },
    get height() { return size().h; },
    hovering: () => hovering,
    screensaver: !!options.screensaver,
    wallpaper: !!options.wallpaper,
  };

  let instance;
  const ready = new Promise((resolve) => {
    instance = new P5((p) => {
      mod.default(p, env);
      const userSetup = p.setup;
      p.setup = function setup() {
        userSetup?.call(p);
        const cap = options.density ?? 2;
        if (p.pixelDensity() > cap) p.pixelDensity(cap);
        resolve();
      };

      const onCanvas = (e) => e && p.canvas && (e.target === p.canvas || p.canvas.contains?.(e.target));
      for (const name of MOUSE_EVENTS) {
        const fn = p[name];
        if (typeof fn !== 'function') continue;
        p[name] = function guarded(e) {
          if (!onCanvas(e)) return undefined;
          return fn.call(p, e);
        };
      }
      for (const name of DRAG_EVENTS) {
        const fn = p[name];
        if (typeof fn !== 'function') continue;
        p[name] = function guarded(e) {
          if (!pressedOnCanvas) return undefined;
          return fn.call(p, e);
        };
      }
      for (const name of KEY_EVENTS) {
        const fn = p[name];
        if (typeof fn !== 'function') continue;
        p[name] = function guarded(e) {
          if (options.isActive && !options.isActive()) return undefined;
          const tag = document.activeElement?.tagName;
          if (tag === 'INPUT' || tag === 'TEXTAREA') return undefined;
          return fn.call(p, e);
        };
      }

      // Frame counter for status bars
      const userDraw = p.draw;
      let last = performance.now();
      p.draw = function draw() {
        userDraw?.call(p);
        if (options.onFrame) {
          const now = performance.now();
          if (now - last > 250) { last = now; options.onFrame(Math.round(p.frameRate())); }
        }
      };
    }, container);
  });

  await ready;
  const canvas = instance.canvas;
  canvas.style.touchAction = 'none';

  const onEnter = () => { hovering = true; };
  const onLeave = () => { hovering = false; };
  const onDown = (e) => { if (e.target === canvas) pressedOnCanvas = true; };
  const onUp = () => { setTimeout(() => { pressedOnCanvas = false; }, 0); };
  hoverTarget.addEventListener('pointerenter', onEnter);
  hoverTarget.addEventListener('pointerleave', onLeave);
  if (options.pointerAll) hoverTarget.addEventListener('pointermove', onEnter);
  window.addEventListener('pointerdown', onDown, true);
  window.addEventListener('pointerup', onUp, true);

  let lastSize = size();
  const ro = new ResizeObserver(() => {
    const s = size();
    if (s.w === lastSize.w && s.h === lastSize.h) return;
    lastSize = s;
    instance.resizeCanvas(s.w, s.h);
    instance.resized?.(s.w, s.h);
  });
  ro.observe(container);

  return {
    p: instance,
    canvas,
    pause() { instance.noLoop(); },
    resume() { instance.loop(); },
    restart() { instance.restart ? instance.restart() : instance.resized?.(instance.width, instance.height); },
    save(name) { instance.saveCanvas(name || id, 'png'); },
    setHovering(v) { hovering = v; },
    remove() {
      ro.disconnect();
      hoverTarget.removeEventListener('pointerenter', onEnter);
      hoverTarget.removeEventListener('pointerleave', onLeave);
      hoverTarget.removeEventListener('pointermove', onEnter);
      window.removeEventListener('pointerdown', onDown, true);
      window.removeEventListener('pointerup', onUp, true);
      instance.remove();
    },
  };
}
