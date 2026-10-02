// App launcher. Apps are loaded on demand (dynamic import) and are singletons
// per "key", so double-clicking an open app just brings it to the front.

import { bus } from '../os/bus.js';
import { focusWindow } from '../os/wm.js';
import { msgbox } from '../os/dialog.js';

const loaders = {
  welcome: () => import('./welcome.js'),
  about: () => import('./about.js'),
  computer: () => import('./computer.js'),
  projects: () => import('./projects.js'),
  sketch: () => import('./sketch.js'),
  pictures: () => import('./pictures.js'),
  viewer: () => import('./viewer.js'),
  contact: () => import('./contact.js'),
  terminal: () => import('./terminal.js'),
  minesweeper: () => import('./minesweeper.js'),
  pablo: () => import('./pablo.js'),
  notepad: () => import('./notepad.js'),
  recycle: () => import('./recycle.js'),
  display: () => import('./display.js'),
  help: () => import('./help.js'),
  run: () => import('./run.js'),
};

export const appIds = Object.keys(loaders);
const running = new Map();   // key -> win
const pending = new Map();   // key -> Promise

bus.on('window:close', (win) => {
  for (const [key, w] of running) if (w === win) running.delete(key);
});

/**
 * Launch an app. args are passed to the app's open() and may include:
 *   from: DOMRect to animate from, id: sub-item (sketch id, photo...), key: singleton key
 */
export async function launch(appId, args = {}) {
  const load = loaders[appId];
  if (!load) throw new Error(`Unknown app: ${appId}`);
  const sub = appId === 'viewer' ? null : args.id || args.file;
  const key = args.key || (sub ? `${appId}:${sub}` : appId);

  const existing = running.get(key);
  if (existing && !existing.closed) {
    focusWindow(existing);
    existing.onRelaunch?.(args);
    return existing;
  }
  if (pending.has(key)) return pending.get(key);

  document.documentElement.classList.add('is-busy');
  const task = (async () => {
    try {
      const mod = await load();
      const win = await mod.open(args);
      if (win) running.set(key, win);
      return win;
    } catch (err) {
      console.error(err);
      msgbox({
        title: 'Error',
        icon: 'error',
        message: `${appId} caused a general protection fault.\n\n${err.message || err}`,
      });
      return null;
    } finally {
      pending.delete(key);
      document.documentElement.classList.remove('is-busy');
    }
  })();
  pending.set(key, task);
  return task;
}

export function openLink(url) {
  window.open(url, '_blank', 'noopener,noreferrer');
}
