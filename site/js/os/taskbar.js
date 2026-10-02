// Taskbar: Start button, one button per window, and the system tray.

import { h, $ } from './dom.js';
import { icon } from './icons.js';
import { bus } from './bus.js';
import { focusWindow, minimize, restore, getActiveWindow, toggleMaximize, closeWindow } from './wm.js';
import { openMenu } from './menu.js';
import { isMuted, setMuted, playSfx, unlockAudio } from './sound.js';
import { toggleStartMenu } from './startmenu.js';
import { showBenjiTip } from './benji.js';

const buttons = new Map(); // win.id -> button

export function initTaskbar() {
  const bar = $('#taskbar');

  const start = h('button', {
    class: 'start-btn',
    type: 'button',
    'aria-haspopup': 'menu',
    'aria-expanded': 'false',
    html: `${icon('paw', 22)}<span>Start</span>`,
  });
  start.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    unlockAudio();
    toggleStartMenu(start);
  });
  start.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleStartMenu(start, true); }
  });

  const list = h('div', { class: 'task-list', role: 'toolbar', 'aria-label': 'Open windows' });

  const soundBtn = h('button', { class: 'tray-btn', type: 'button' });
  const paintSound = () => {
    soundBtn.innerHTML = icon(isMuted() ? 'speaker-off' : 'speaker', 16);
    soundBtn.title = isMuted() ? 'Sound is off' : 'Sound is on';
    soundBtn.setAttribute('aria-label', soundBtn.title);
  };
  soundBtn.addEventListener('click', () => {
    unlockAudio();
    setMuted(!isMuted());
    playSfx('click');
  });
  bus.on('sound:muted', paintSound);
  paintSound();

  const benjiBtn = h('button', { class: 'tray-btn', type: 'button', title: 'Benji', 'aria-label': 'Benji says...' },
    h('img', { src: 'img/benji-48.png', alt: '', width: 20, height: 20 }));
  benjiBtn.addEventListener('click', () => { unlockAudio(); playSfx('woof'); showBenjiTip(); });

  const clock = h('time', { class: 'tray-clock' });
  const tick = () => {
    const now = new Date();
    clock.textContent = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    clock.title = now.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    clock.dateTime = now.toISOString();
  };
  tick();
  setInterval(tick, 10_000);

  const tray = h('div', { class: 'tray' }, soundBtn, benjiBtn, clock);
  bar.append(start, list, tray);

  // ---- window buttons
  bus.on('window:open', (win) => {
    if (win.dialog && !win.showInTaskbar) return;
    const btn = h('button', { class: 'task-btn', type: 'button', 'data-win': win.id, html: icon(win.iconName, 16) },
      h('span', null, win.title));
    btn.title = win.title;
    btn.addEventListener('click', () => {
      if (win.minimized) restore(win);
      else if (getActiveWindow() === win) minimize(win);
      else focusWindow(win);
    });
    btn.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      openMenu([
        { label: '&Restore', disabled: !win.minimized && !win.maximized, action: () => (win.minimized ? restore(win) : toggleMaximize(win)) },
        { label: '&Minimize', disabled: win.minimized || !win.minimizable, action: () => minimize(win) },
        { label: 'Ma&ximize', disabled: win.maximized || !win.maximizable, action: () => { if (win.minimized) restore(win); toggleMaximize(win); } },
        '-',
        { label: '&Close', action: () => closeWindow(win) },
      ], { anchorRect: new DOMRect(e.clientX, e.clientY, 0, 0), placement: 'above' });
    });
    buttons.set(win.id, btn);
    list.append(btn);
    sync();
  });
  bus.on('window:close', (win) => {
    buttons.get(win.id)?.remove();
    buttons.delete(win.id);
  });
  bus.on('window:title', (win) => {
    const btn = buttons.get(win.id);
    if (!btn) return;
    btn.querySelector('span').textContent = win.title;
    btn.title = win.title;
  });
  bus.on('window:focus', sync);
  bus.on('window:minimize', sync);
  bus.on('window:restore', sync);

  function sync() {
    const active = getActiveWindow();
    for (const [id, btn] of buttons) {
      const on = active && active.id === id && !active.minimized;
      btn.classList.toggle('is-active', !!on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    }
  }
}
