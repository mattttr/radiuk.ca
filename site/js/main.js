// Matt Radiuk 95: entry point.

import { $, sleep, reducedMotion } from './os/dom.js';
import { settings, session } from './os/settings.js';
import { bus } from './os/bus.js';
import { initTaskbar } from './os/taskbar.js';
import { initDesktop } from './os/desktop.js';
import { boot } from './os/boot.js';
import { playSfx, unlockAudio } from './os/sound.js';
import { initScreensaver } from './os/screensaver.js';
import { setWallpaper, currentWallpaper } from './os/wallpaper.js';
import { initKonami } from './os/benji.js';
import { openStartMenu } from './os/startmenu.js';
import { launch, appIds } from './apps/registry.js';
import { profile } from './content.js';

// ---- appearance prefs (applied before anything paints)
// (?scheme=midnight and ?wallpaper=live:synthwave override them for this visit only)
const root = document.documentElement;
const query = new URLSearchParams(location.search);
const scheme = query.get('scheme') || settings.get('scheme', 'standard');
if (scheme !== 'standard') root.dataset.scheme = scheme;
if (settings.get('crt', true) === false) root.dataset.crt = 'off';

initTaskbar();
initDesktop();
setWallpaper(query.get('wallpaper') || currentWallpaper(), { persist: false });
initKonami();
heroTypewriter();

// ---- routing: #about, #projects/flow-field, #pictures/petra, ?open=pablo
const ALIASES = {
  gallery: 'pictures', photos: 'pictures', cmd: 'terminal', dos: 'terminal', command: 'terminal',
  winmine: 'minesweeper', mines: 'minesweeper', mail: 'contact', email: 'contact', me: 'about',
};

function parseRoute() {
  const params = new URLSearchParams(location.search);
  const raw = (decodeURIComponent(location.hash.slice(1)) || params.get('open') || '').trim();
  if (!raw) return null;
  const [app, id] = raw.split('/');
  return { app: ALIASES[app.toLowerCase()] || app.toLowerCase(), id };
}

function openRoute(route) {
  if (!route) return;
  if (route.app === 'projects' && route.id) launch('sketch', { id: route.id });
  else if (route.app === 'pictures' && route.id) launch('viewer', { id: route.id });
  else if (appIds.includes(route.app)) launch(route.app, route.id ? { id: route.id } : {});
}

bus.on('window:focus', (win) => {
  const target = win?.route ? `#${win.route}` : '';
  if (location.hash === target) return;
  history.replaceState(null, '', target || location.pathname + location.search);
});
window.addEventListener('hashchange', () => openRoute(parseRoute()));

// ---- keyboard shortcuts
window.addEventListener('keydown', (e) => {
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); unlockAudio(); launch('run'); }
  else if (e.ctrlKey && e.key === 'Escape') { e.preventDefault(); openStartMenu(); }
  else if (e.key === 'F1') { e.preventDefault(); launch('help'); }
});

// ---- boot
const route = parseRoute();
const bootParam = new URLSearchParams(location.search).get('boot');
const firstBootThisSession = !session.get('booted', false);
const playBoot = bootParam === '1'
  || (bootParam !== '0' && !route && firstBootThisSession && settings.get('bootAnim', true));

async function start({ fromReboot = false } = {}) {
  document.body.classList.remove('is-ready');
  if (playBoot || fromReboot) await boot({ full: true });
  session.set('booted', true);
  document.body.classList.add('is-ready');
  playSfx('startup');
  if (route && !fromReboot) openRoute(route);
  else if (settings.get('showWelcome', true)) launch('welcome');
}

bus.on('system:reboot', () => start({ fromReboot: true }));
start().then(runDemo);
initScreensaver();

// ?demo=start|run|bsod|shutdown|party|saver|tip: jump straight to an interactive state
function runDemo() {
  const demo = new URLSearchParams(location.search).get('demo');
  if (!demo) return;
  setTimeout(() => {
    if (demo === 'start') openStartMenu();
    else if (demo === 'run') launch('run');
    else if (demo === 'bsod') import('./os/bsod.js').then((m) => m.bsod());
    else if (demo === 'shutdown') import('./os/shutdown.js').then((m) => m.shutdownDialog());
    else if (demo === 'party') import('./os/benji.js').then((m) => m.benjiParty());
    else if (demo === 'saver') import('./os/screensaver.js').then((m) => m.startScreensaver());
    else if (demo === 'tip') import('./os/benji.js').then((m) => m.showBenjiTip());
  }, 400);
}

// ---- desktop hero: typewriter through the role list
async function heroTypewriter() {
  const el = $('#hero-role');
  if (!el || reducedMotion()) return;
  const roles = profile.roles;
  let i = 0;
  for (;;) {
    await sleep(2800);
    const word = el.textContent;
    for (let n = word.length; n >= 0; n--) { el.textContent = word.slice(0, n); await sleep(30); }
    i = (i + 1) % roles.length;
    for (let n = 1; n <= roles[i].length; n++) { el.textContent = roles[i].slice(0, n); await sleep(60); }
  }
}
