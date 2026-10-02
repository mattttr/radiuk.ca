// Desktop wallpapers: classic flat colour, CSS patterns, photos, or a live sketch.

import { $ } from './dom.js';
import { settings } from './settings.js';
import { mountSketch } from './p5host.js';

export const WALLPAPERS = [
  { id: 'none', label: '(None)' },
  { id: 'clouds', label: 'Clouds' },
  { id: 'pinstripe', label: 'Pinstripe' },
  { id: 'benji-tile', label: 'Benji (Tile)' },
  { id: 'sunset', label: 'Benji at Sunset' },
  { id: 'live:flow-field', label: 'Live: Flow Field' },
  { id: 'live:starfield', label: 'Live: Starfield' },
  { id: 'live:synthwave', label: 'Live: Synthwave' },
  { id: 'live:boids', label: 'Live: Boids' },
];

let live = null;
let token = 0;
let hoverWired = false;

export function currentWallpaper() {
  return settings.get('wallpaper', 'none');
}

export async function setWallpaper(id, { persist = true } = {}) {
  const el = $('#wallpaper');
  if (persist) settings.set('wallpaper', id);
  const mine = ++token;

  live?.remove();
  live = null;
  el.innerHTML = '';
  el.className = 'wallpaper';
  el.removeAttribute('style');
  el.dataset.kind = id;

  if (id === 'clouds') {
    el.className = 'wallpaper is-clouds';
  } else if (id === 'pinstripe') {
    el.className = 'wallpaper is-pinstripe';
  } else if (id === 'benji-tile') {
    el.className = 'wallpaper is-tile';
    el.style.backgroundImage = 'url(img/benji-48.png)';
    el.style.backgroundSize = '96px 96px';
  } else if (id === 'sunset') {
    el.className = 'wallpaper is-image';
    el.style.backgroundImage = 'url(img/gallery/benji-sunset.jpg)';
  } else if (id.startsWith('live:')) {
    el.className = 'wallpaper is-live';
    try {
      const sketch = await mountSketch(el, id.slice(5), {
        wallpaper: true,
        density: 1,
        hoverTarget: $('#desktop'),
        pointerAll: true,
      });
      if (mine !== token) { sketch.remove(); return; }
      live = sketch;
      if (!hoverWired) {
        hoverWired = true;
        // Only react to the pointer when it's over bare desktop, not a window.
        $('#desktop').addEventListener('pointermove', (e) => {
          live?.setHovering(!e.target.closest('.window, .taskbar'));
        });
      }
    } catch (err) {
      console.error(err);
    }
  }
}

export function pauseWallpaper(paused) {
  if (!live) return;
  paused ? live.pause() : live.resume();
}
