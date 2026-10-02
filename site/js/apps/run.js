// Run... dialog, doubling as a command palette (Ctrl+K).

import { h, escapeHtml } from '../os/dom.js';
import { icon } from '../os/icons.js';
import { openWindow } from '../os/wm.js';
import { msgbox } from '../os/dialog.js';
import { settings } from '../os/settings.js';
import { sketches } from '../sketches/index.js';
import { photos, profile } from '../content.js';
import { launch, openLink } from './registry.js';

function catalog() {
  const app = (label, keys, ic, fn, hint = '') => ({ label, keys: keys.toLowerCase(), icon: ic, run: fn, hint });
  return [
    app('About Me', 'about me about_me.doc wordpad bio', 'doc', () => launch('about'), 'About_Me.doc'),
    app('Projects', 'projects explorer sketches art p5', 'projects', () => launch('projects'), 'C:\\Projects'),
    app('Contact Me', 'contact mail email outlook hire message', 'mail', () => launch('contact'), 'New Message'),
    app('My Pictures', 'pictures photos gallery images', 'pictures', () => launch('pictures'), 'Gallery'),
    app('MS-DOS Prompt', 'cmd command dos terminal shell prompt', 'terminal', () => launch('terminal'), 'command.com'),
    app('Minesweeper', 'winmine minesweeper mines game', 'mine', () => launch('minesweeper'), 'winmine.exe'),
    app('Pablo Cover Generator', 'pablo cover tlop kanye album', 'pablo', () => launch('pablo'), 'pablo.exe'),
    app('My Computer', 'computer system properties skills device manager', 'computer', () => launch('computer'), 'System Properties'),
    app('Display Properties', 'control desk.cpl display theme wallpaper screensaver settings dark mode', 'display', () => launch('display'), 'desk.cpl'),
    app('Notepad', 'notepad edit text', 'notepad', () => launch('notepad'), 'notepad.exe'),
    app('README.TXT', 'readme', 'notepad', () => launch('notepad', { file: 'README.TXT' })),
    app('Recycle Bin', 'recycle trash bin', 'recycle', () => launch('recycle')),
    app('Help', 'help docs manual', 'help', () => launch('help'), 'F1'),
    app('Welcome Screen', 'welcome tips', 'info', () => launch('welcome')),
    app('GitHub', 'github git code', 'github', () => openLink(profile.github), profile.github.replace('https://', '')),
    app('LinkedIn', 'linkedin resume cv', 'linkedin', () => openLink(profile.linkedin), 'linkedin.com'),
    app('Shut Down...', 'shutdown restart reboot exit', 'computer-off', () => import('../os/shutdown.js').then((m) => m.shutdownDialog())),
    ...sketches.map((s) => app(s.title, `${s.id} ${s.exe} ${s.title} sketch`, 'sketch', () => launch('sketch', { id: s.id }), s.exe)),
    ...photos.map((p) => app(p.title, `${p.file} ${p.title} photo jpg`, 'image', () => launch('viewer', { id: p.file }), `${p.file}.jpg`)),
  ];
}

const EASTER = {
  calc: 'Calculator is not installed. MS-DOS Prompt can\u2019t do math either.',
  'calc.exe': 'Calculator is not installed. MS-DOS Prompt can\u2019t do math either.',
  regedit: 'Registry Editor is disabled by your administrator (Benji).',
  clippy: 'It looks like you\u2019re trying to summon Clippy. Benji ate him.',
  'format c:': 'Nice try. Use the MS-DOS Prompt for that kind of thing.',
};

export function open({ from } = {}) {
  const items = catalog();
  const history = settings.get('runHistory', []);
  const input = h('input', { class: 'field', value: history[0] || '', 'aria-label': 'Open', autocomplete: 'off', spellcheck: false, role: 'combobox', 'aria-expanded': 'true', 'aria-controls': 'run-list' });
  const list = h('ul', { class: 'run-list scroll', id: 'run-list', role: 'listbox' });
  let matches = [];
  let active = 0;

  const score = (item, q) => {
    if (!q) return 1;
    const label = item.label.toLowerCase();
    if (label === q) return 100;
    if (label.startsWith(q)) return 50;
    if (item.keys.split(' ').some((k) => k.startsWith(q))) return 30;
    if (label.includes(q) || item.keys.includes(q)) return 10;
    return 0;
  };

  function refresh() {
    const q = input.value.trim().toLowerCase();
    matches = items.map((it) => [score(it, q), it]).filter(([s]) => s > 0).sort((a, b) => b[0] - a[0]).slice(0, 8).map(([, it]) => it);
    active = 0;
    list.replaceChildren(...matches.map((it, i) => {
      const li = h('li', { class: `run-item ${i === active ? 'is-active' : ''}`, role: 'option', 'aria-selected': String(i === active), html: `${icon(it.icon, 16)}<span>${escapeHtml(it.label)}</span><small>${escapeHtml(it.hint || '')}</small>` });
      li.addEventListener('pointerenter', () => setActive(i));
      li.addEventListener('click', () => go(it));
      return li;
    }));
  }
  function setActive(i) {
    active = i;
    [...list.children].forEach((li, j) => { li.classList.toggle('is-active', i === j); li.setAttribute('aria-selected', String(i === j)); });
    list.children[i]?.scrollIntoView({ block: 'nearest' });
  }

  function go(item) {
    const typed = input.value.trim();
    if (typed) settings.set('runHistory', [typed, ...history.filter((x) => x !== typed)].slice(0, 10));
    win.close();
    item.run();
  }

  function submit() {
    const typed = input.value.trim();
    const q = typed.toLowerCase();
    if (!q) return;
    if (EASTER[q]) { win.close(); msgbox({ title: 'Run', icon: 'warning', message: EASTER[q] }); return; }
    if (/^(https?:\/\/|www\.)/.test(q)) { win.close(); openLink(q.startsWith('www.') ? `https://${typed}` : typed); return; }
    if (matches[active]) { go(matches[active]); return; }
    win.close();
    msgbox({ title: typed, icon: 'error', message: `Cannot find the file '${typed}' (or one of its components). Make sure the path and filename are correct and that all required libraries are available.` });
  }

  input.addEventListener('input', refresh);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(Math.min(matches.length - 1, active + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive(Math.max(0, active - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); submit(); }
  });

  const content = h('div', { class: 'run' },
    h('div', { class: 'msgbox-row' },
      h('span', { class: 'msgbox-icon', html: icon('run', 32) }),
      h('p', null, 'Type the name of a program, folder, document, or Internet resource, and Matt Radiuk 95 will open it for you.')),
    h('label', { class: 'run-open' }, h('span', null, 'Open:'), input),
    list,
    h('div', { class: 'msgbox-buttons' },
      h('button', { class: 'btn is-default', type: 'button', onClick: submit }, 'OK'),
      h('button', { class: 'btn', type: 'button', onClick: () => win.close() }, 'Cancel'),
      h('button', { class: 'btn', type: 'button', onClick: () => { win.close(); launch('projects'); } }, 'Browse...')));

  const win = openWindow({
    appId: 'run',
    title: 'Run',
    icon: 'run',
    width: 460,
    height: 'auto',
    resizable: false,
    dialog: true,
    content,
    from,
  });
  refresh();
  input.focus();
  input.select();
  return win;
}
