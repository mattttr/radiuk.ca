// Idle detection + full-screen screen saver (any sketch can be a screen saver).

import { h } from './dom.js';
import { settings } from './settings.js';
import { mountSketch } from './p5host.js';

let timer = 0;
let running = null;
let enabled = false;

export const screensaverPrefs = () => ({
  id: settings.get('saver', 'pipes'),
  minutes: settings.get('saverWait', 2),
});

export function initScreensaver() {
  enabled = true;
  const reset = () => {
    if (running) return;
    clearTimeout(timer);
    const { id, minutes } = screensaverPrefs();
    if (!id || id === 'none' || !enabled) return;
    timer = setTimeout(() => startScreensaver(), minutes * 60_000);
  };
  for (const ev of ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart']) {
    window.addEventListener(ev, reset, { passive: true });
  }
  document.addEventListener('visibilitychange', reset);
  reset();
  return reset;
}

export function setScreensaverEnabled(on) { enabled = on; }

export async function startScreensaver(id = screensaverPrefs().id) {
  if (running || !id || id === 'none') return;
  if (document.querySelector('.bsod, .boot.is-on, .shutdown-screen')) return;
  const overlay = h('div', { class: 'screensaver', 'aria-hidden': 'true' });
  document.body.append(overlay);
  running = { overlay, sketch: null };

  try {
    running.sketch = await mountSketch(overlay, id, { screensaver: true, density: 1 });
  } catch (err) {
    console.error(err);
  }

  const startedAt = performance.now();
  let origin = null;
  const stop = (e) => {
    if (performance.now() - startedAt < 600) return;
    if (e.type === 'pointermove') {
      origin ??= { x: e.clientX, y: e.clientY };
      if (Math.hypot(e.clientX - origin.x, e.clientY - origin.y) < 12) return;
    }
    stopScreensaver();
  };
  running.stop = stop;
  for (const ev of ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart']) {
    window.addEventListener(ev, stop, true);
  }
}

export function stopScreensaver() {
  if (!running) return;
  for (const ev of ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart']) {
    window.removeEventListener(ev, running.stop, true);
  }
  running.sketch?.remove();
  running.overlay.remove();
  running = null;
  window.dispatchEvent(new Event('pointermove'));
}
