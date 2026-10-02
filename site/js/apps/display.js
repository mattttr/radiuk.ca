// Display Properties: Background / Screen Saver / Appearance / Effects.
// Changes preview live; Cancel reverts, OK keeps.

import { h } from '../os/dom.js';
import { openWindow } from '../os/wm.js';
import { settings } from '../os/settings.js';
import { setWallpaper, currentWallpaper, WALLPAPERS } from '../os/wallpaper.js';
import { screensaverPrefs, startScreensaver } from '../os/screensaver.js';
import { isMuted, setMuted } from '../os/sound.js';
import { sketches } from '../sketches/index.js';

const SCHEMES = [
  ['standard', 'Windows Standard'],
  ['midnight', 'Midnight (dark mode)'],
  ['desert', 'Desert'],
  ['eggplant', 'Eggplant'],
  ['rainy', 'Rainy Day'],
  ['spruce', 'Spruce'],
  ['pumpkin', 'Pumpkin (Pablo)'],
  ['contrast', 'High Contrast Black'],
];

const applyScheme = (id) => {
  if (id === 'standard') delete document.documentElement.dataset.scheme;
  else document.documentElement.dataset.scheme = id;
};

export function open({ from } = {}) {
  const original = {
    wallpaper: currentWallpaper(),
    scheme: settings.get('scheme', 'standard'),
    saver: screensaverPrefs(),
  };
  const draft = {
    wallpaper: original.wallpaper,
    scheme: original.scheme,
    saver: original.saver.id,
    wait: original.saver.minutes,
    crt: settings.get('crt', true),
    boot: settings.get('bootAnim', true),
    welcome: settings.get('showWelcome', true),
    sound: !isMuted(),
  };

  // ---- monitor preview
  const screen = h('div', { class: 'dp-screen' });
  const monitor = h('div', { class: 'dp-monitor', 'aria-hidden': 'true' }, h('div', { class: 'dp-bezel' }, screen), h('div', { class: 'dp-base' }));
  const paintMonitor = (mode) => {
    screen.className = 'dp-screen';
    screen.style.backgroundImage = '';
    if (mode === 'saver') {
      screen.classList.add('is-saver');
      if (draft.saver !== 'none') screen.style.backgroundImage = `url(img/projects/${draft.saver}.jpg)`;
      return;
    }
    const wp = draft.wallpaper;
    if (wp.startsWith('live:')) screen.style.backgroundImage = `url(img/projects/${wp.slice(5)}.jpg)`;
    else if (wp === 'sunset') screen.style.backgroundImage = 'url(img/gallery/thumbs/benji-sunset.jpg)';
    else if (wp !== 'none') screen.classList.add(`wp-${wp}`);
    screen.append();
    screen.innerHTML = '<div class="dp-mini-win"><div class="dp-mini-title"></div></div>';
  };

  // ---- tabs
  const tabDefs = [
    ['Background', background],
    ['Screen Saver', saver],
    ['Appearance', appearance],
    ['Effects', effects],
  ];
  const strip = h('div', { class: 'tab-strip', role: 'tablist' });
  const panel = h('div', { class: 'tab-panel', role: 'tabpanel' });
  const tabs = tabDefs.map(([label, render], i) => {
    const b = h('button', { class: 'tab', role: 'tab', type: 'button', 'aria-selected': String(i === 0) }, label);
    b.addEventListener('click', () => select(i));
    strip.append(b);
    return { b, render };
  });
  function select(i) {
    tabs.forEach((t, j) => t.b.setAttribute('aria-selected', String(i === j)));
    panel.replaceChildren(tabs[i].render());
  }

  function listbox(options, value, onPick) {
    const box = h('div', { class: 'listbox scroll', role: 'listbox', tabIndex: 0 });
    const items = options.map(([id, label]) => {
      const it = h('div', { class: `lb-item ${id === value ? 'is-selected' : ''}`, role: 'option', 'aria-selected': String(id === value), 'data-id': id }, label);
      it.addEventListener('click', () => pick(id));
      box.append(it);
      return it;
    });
    function pick(id) {
      items.forEach((it) => {
        const on = it.dataset.id === id;
        it.classList.toggle('is-selected', on);
        it.setAttribute('aria-selected', String(on));
        if (on) it.scrollIntoView({ block: 'nearest' });
      });
      onPick(id);
    }
    box.addEventListener('keydown', (e) => {
      const idx = items.findIndex((it) => it.classList.contains('is-selected'));
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const next = items[Math.max(0, Math.min(items.length - 1, idx + (e.key === 'ArrowDown' ? 1 : -1)))];
        pick(next.dataset.id);
      }
    });
    return box;
  }

  function background() {
    paintMonitor('wallpaper');
    return h('div', { class: 'dp-tab' }, monitor,
      h('fieldset', { class: 'group' }, h('legend', null, 'Wallpaper'),
        listbox(WALLPAPERS.map((w) => [w.id, w.label]), draft.wallpaper, (id) => {
          draft.wallpaper = id;
          setWallpaper(id, { persist: false });
          paintMonitor('wallpaper');
        }),
        h('p', { class: 'fine' }, 'Live wallpapers are p5.js sketches. They react to your mouse on the desktop.')));
  }

  function saver() {
    paintMonitor('saver');
    const sel = h('select', { class: 'select' },
      h('option', { value: 'none' }, '(None)'),
      sketches.map((s) => h('option', { value: s.id, selected: s.id === draft.saver }, s.title)));
    sel.value = draft.saver;
    sel.addEventListener('change', () => { draft.saver = sel.value; paintMonitor('saver'); });
    const wait = h('input', { class: 'field dp-wait', type: 'number', min: 1, max: 60, value: draft.wait });
    wait.addEventListener('change', () => { draft.wait = Math.max(1, Math.min(60, Number(wait.value) || 2)); wait.value = draft.wait; });
    return h('div', { class: 'dp-tab' }, monitor,
      h('fieldset', { class: 'group' }, h('legend', null, 'Screen Saver'),
        h('div', { class: 'dp-row' }, sel,
          h('button', { class: 'btn', type: 'button', onClick: () => startScreensaver(draft.saver) }, 'Preview')),
        h('div', { class: 'dp-row' }, h('span', null, 'Wait:'), wait, h('span', null, 'minutes'))));
  }

  function appearance() {
    const preview = h('div', { class: 'dp-appearance', 'aria-hidden': 'true' },
      h('div', { class: 'window is-active dp-fake' },
        h('div', { class: 'titlebar' }, h('span', { class: 'titlebar-text' }, 'Active Window')),
        h('div', { class: 'menubar' }, h('span', { class: 'menubar-item' }, 'Normal'), h('span', { class: 'menubar-item dp-sel' }, 'Selected')),
        h('div', { class: 'dp-fake-body' }, 'Window Text', h('button', { class: 'btn small', type: 'button', tabIndex: -1 }, 'OK'))));
    return h('div', { class: 'dp-tab' }, preview,
      h('fieldset', { class: 'group' }, h('legend', null, 'Scheme'),
        listbox(SCHEMES, draft.scheme, (id) => { draft.scheme = id; applyScheme(id); })));
  }

  function effects() {
    const check = (label, key) => h('label', { class: 'check' },
      h('input', { type: 'checkbox', checked: draft[key], onChange: (e) => { draft[key] = e.target.checked; if (key === 'crt') document.documentElement.dataset.crt = e.target.checked ? 'on' : 'off'; } }),
      h('span', null, label));
    return h('div', { class: 'dp-tab dp-effects' },
      h('fieldset', { class: 'group' }, h('legend', null, 'Visual effects'),
        check('CRT scanlines & vignette on the desktop', 'crt'),
        check('Play the boot sequence on the first visit of a session', 'boot'),
        check('Show the Welcome Screen at startup', 'welcome')),
      h('fieldset', { class: 'group' }, h('legend', null, 'Sound'),
        check('Enable sound effects', 'sound')));
  }

  function commit() {
    settings.set('wallpaper', draft.wallpaper);
    settings.set('scheme', draft.scheme);
    settings.set('saver', draft.saver);
    settings.set('saverWait', draft.wait);
    settings.set('crt', draft.crt);
    settings.set('bootAnim', draft.boot);
    settings.set('showWelcome', draft.welcome);
    if (draft.sound === isMuted()) setMuted(!draft.sound);
    window.dispatchEvent(new Event('pointermove')); // restart idle timer with new prefs
  }

  let committed = false;
  const content = h('div', { class: 'display-props' },
    h('div', { class: 'tabs' }, strip, panel),
    h('div', { class: 'btn-row' },
      h('button', { class: 'btn is-default', type: 'button', onClick: () => { commit(); committed = true; win.close(); } }, 'OK'),
      h('button', { class: 'btn', type: 'button', onClick: () => win.close() }, 'Cancel'),
      h('button', { class: 'btn', type: 'button', onClick: commit }, 'Apply')));

  const win = openWindow({
    appId: 'display',
    route: 'display',
    title: 'Display Properties',
    icon: 'display',
    width: 460,
    height: 590,
    minWidth: 340,
    minHeight: 480,
    content,
    bodyClass: 'pad',
    from,
    onClose: () => {
      if (committed) return;
      // revert anything not applied
      const savedWp = settings.get('wallpaper', 'none');
      if (draft.wallpaper !== savedWp) setWallpaper(savedWp, { persist: false });
      applyScheme(settings.get('scheme', 'standard'));
      document.documentElement.dataset.crt = settings.get('crt', true) ? 'on' : 'off';
    },
  });
  select(0);
  return win;
}
