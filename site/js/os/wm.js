// The window manager: create, focus, drag, resize, snap, minimize, maximize, close.

import { h, clamp, isMobile, reducedMotion } from './dom.js';
import { icon } from './icons.js';
import { bus } from './bus.js';
import { playSfx } from './sound.js';
import { openMenu, menubar } from './menu.js';

const windows = new Map();   // id -> win
let zTop = 100;
let activeId = null;
let seq = 0;
let cascade = 0;

const layer = () => document.getElementById('windows');
const EASE = 'cubic-bezier(.2,.9,.25,1)';

const GLYPHS = {
  min: '<svg width="8" height="8" viewBox="0 0 8 8" shape-rendering="crispEdges"><rect x="1" y="6" width="6" height="2"/></svg>',
  max: '<svg width="9" height="9" viewBox="0 0 9 9" shape-rendering="crispEdges"><rect width="9" height="2"/><rect y="2" width="1" height="7"/><rect x="8" y="2" width="1" height="7"/><rect y="8" width="9" height="1"/></svg>',
  restore: '<svg width="9" height="9" viewBox="0 0 9 9" shape-rendering="crispEdges"><rect x="2" width="7" height="2"/><rect x="8" y="2" width="1" height="4"/><rect x="7" y="5" width="1" height="1"/><rect x="2" y="2" width="1" height="1"/><rect y="3" width="7" height="2"/><rect y="5" width="1" height="4"/><rect x="6" y="5" width="1" height="4"/><rect y="8" width="7" height="1"/></svg>',
  close: '<svg width="8" height="7" viewBox="0 0 8 7" shape-rendering="crispEdges"><rect width="2" height="1"/><rect x="6" width="2" height="1"/><rect x="1" y="1" width="2" height="1"/><rect x="5" y="1" width="2" height="1"/><rect x="2" y="2" width="4" height="1"/><rect x="3" y="3" width="2" height="1"/><rect x="2" y="4" width="4" height="1"/><rect x="1" y="5" width="2" height="1"/><rect x="5" y="5" width="2" height="1"/><rect y="6" width="2" height="1"/><rect x="6" y="6" width="2" height="1"/></svg>',
};

function area() {
  const r = layer().getBoundingClientRect();
  return { w: r.width, h: r.height, left: r.left, top: r.top };
}

function rectOf(win) {
  const s = win.el.style;
  return { x: parseFloat(s.left) || 0, y: parseFloat(s.top) || 0, w: win.el.offsetWidth, h: win.el.offsetHeight };
}

function applyRect(win, r) {
  const s = win.el.style;
  s.left = `${Math.round(r.x)}px`;
  s.top = `${Math.round(r.y)}px`;
  if (r.w != null) s.width = `${Math.round(r.w)}px`;
  if (r.h != null) s.height = `${Math.round(r.h)}px`;
}

function notifyResize(win) {
  if (win._resizeRaf) return;
  win._resizeRaf = requestAnimationFrame(() => {
    win._resizeRaf = 0;
    win.hooks.onResize?.(win);
  });
}

/** Animate a window between two screen rects with a transform (FLIP). */
function flip(el, from, { duration = 200, fade = false, reverse = false } = {}) {
  if (reducedMotion() || !el.animate) return Promise.resolve();
  const to = el.getBoundingClientRect();
  if (!to.width || !to.height) return Promise.resolve();
  const sx = from.width / to.width;
  const sy = from.height / to.height;
  const dx = from.left - to.left;
  const dy = from.top - to.top;
  const a = { transformOrigin: '0 0', transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, opacity: fade ? 0 : 1 };
  const b = { transformOrigin: '0 0', transform: 'none', opacity: 1 };
  return el.animate(reverse ? [b, a] : [a, b], { duration, easing: EASE, fill: reverse ? 'forwards' : 'none' }).finished.catch(() => {});
}

function taskButtonRect(win) {
  const btn = document.querySelector(`.task-btn[data-win="${win.id}"]`);
  return btn?.getBoundingClientRect();
}

// ------------------------------------------------------------------ public

export const getWindows = () => [...windows.values()];
export const getActiveWindow = () => windows.get(activeId) || null;
export const findWindow = (pred) => getWindows().find(pred);

/**
 * Open a window. Common options:
 *   title, icon, appId, route, width, height ('auto' sizes to content),
 *   x, y, center, resizable, maximizable, minimizable, dialog,
 *   menu (menubar defs), toolbar (element), statusbar (array of cells),
 *   content (element), bodyClass, className, from (DOMRect to zoom from),
 *   minWidth, minHeight, maximized,
 *   onClose, onResize, onMinimize, onRestore, onFocus, onBlur, beforeClose
 */
export function openWindow(opts) {
  const id = opts.id || `win-${++seq}`;
  const resizable = opts.resizable !== false;
  const win = {
    id,
    appId: opts.appId || null,
    route: opts.route || null,
    title: opts.title || 'Untitled',
    iconName: opts.icon || 'app',
    resizable,
    maximizable: opts.maximizable ?? resizable,
    minimizable: opts.minimizable ?? !opts.dialog,
    dialog: !!opts.dialog,
    minW: opts.minWidth || 260,
    minH: opts.minHeight || 160,
    minimized: false,
    maximized: false,
    snapped: null,
    prevRect: null,
    closed: false,
    hooks: {
      onClose: opts.onClose, onResize: opts.onResize, onMinimize: opts.onMinimize,
      onRestore: opts.onRestore, onFocus: opts.onFocus, onBlur: opts.onBlur, beforeClose: opts.beforeClose,
    },
    status: [],
  };

  // --- chrome
  const titleId = `${id}-title`;
  const el = h('section', {
    class: `window ${opts.className || ''} ${win.dialog ? 'is-dialog' : ''}`,
    role: 'dialog',
    'aria-labelledby': titleId,
    tabIndex: -1,
    'data-app': win.appId || '',
  });
  const iconBtn = h('button', { class: 'titlebar-icon', type: 'button', 'aria-label': 'Window menu', tabIndex: -1, html: icon(win.iconName, 16) });
  const titleEl = h('h2', { class: 'titlebar-text', id: titleId }, win.title);
  const controls = h('div', { class: 'titlebar-controls' });
  const titlebar = h('header', { class: 'titlebar' }, iconBtn, titleEl, controls);

  let btnMax = null;
  if (win.minimizable) {
    controls.append(h('button', { class: 'tb-btn', type: 'button', 'aria-label': 'Minimize', tabIndex: -1, html: GLYPHS.min, onClick: () => minimize(win) }));
  }
  if (win.maximizable) {
    btnMax = h('button', { class: 'tb-btn', type: 'button', 'aria-label': 'Maximize', tabIndex: -1, html: GLYPHS.max, onClick: () => toggleMaximize(win) });
    controls.append(btnMax);
  }
  if (win.minimizable || win.maximizable) controls.append(h('span', { class: 'gap' }));
  controls.append(h('button', { class: 'tb-btn', type: 'button', 'aria-label': 'Close', html: GLYPHS.close, onClick: () => closeWindow(win) }));

  el.append(titlebar);
  if (opts.menu) el.append(menubar(opts.menu));
  if (opts.toolbar) el.append(opts.toolbar);

  const body = h('div', { class: `window-body ${opts.bodyClass || ''}` });
  if (opts.content) body.append(opts.content);
  el.append(body);

  if (opts.statusbar) {
    const bar = h('footer', { class: 'statusbar' });
    for (const cell of opts.statusbar) {
      const spec = typeof cell === 'string' ? { text: cell } : cell;
      const span = h('span', { class: spec.fixed ? 'fixed' : '', style: spec.width ? { width: spec.width } : null }, spec.text || '');
      win.status.push(span);
      bar.append(span);
    }
    if (resizable) bar.append(h('span', { class: 'grip', 'aria-hidden': 'true' }));
    el.append(bar);
  }

  if (resizable) {
    for (const dir of ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw']) {
      const handle = h('div', { class: `rz rz-${dir}`, 'aria-hidden': 'true' });
      handle.addEventListener('pointerdown', (e) => startResize(win, e, dir));
      el.append(handle);
    }
  }

  win.el = el;
  win.body = body;
  win.titleEl = titleEl;
  win.btnMax = btnMax;

  // --- API on the window object
  win.close = () => closeWindow(win);
  win.focus = () => focusWindow(win);
  win.minimize = () => minimize(win);
  win.toggleMaximize = () => toggleMaximize(win);
  win.setTitle = (t) => { win.title = t; titleEl.textContent = t; bus.emit('window:title', win); };
  win.setStatus = (i, text) => { if (win.status[i]) win.status[i].textContent = text; };
  win.center = () => centerWindow(win);

  // --- events
  el.addEventListener('pointerdown', () => focusWindow(win), true);
  el.addEventListener('focusin', () => focusWindow(win));
  titlebar.addEventListener('pointerdown', (e) => startDrag(win, e));
  titlebar.addEventListener('dblclick', (e) => {
    if (e.target.closest('.titlebar-controls, .titlebar-icon')) return;
    if (win.maximizable) toggleMaximize(win);
  });
  iconBtn.addEventListener('click', (e) => { e.stopPropagation(); systemMenu(win, iconBtn.getBoundingClientRect()); });
  iconBtn.addEventListener('dblclick', () => closeWindow(win));
  titlebar.addEventListener('contextmenu', (e) => { e.preventDefault(); systemMenu(win, null, e.clientX, e.clientY); });

  // --- place it
  const a = area();
  const mobile = isMobile();
  const autoH = opts.height === 'auto';
  const w = Math.min(opts.width || 560, a.w - (mobile ? 12 : 16));
  const hgt = autoH ? null : Math.min(opts.height || 420, a.h - 16);
  el.style.width = `${w}px`;
  if (!autoH) el.style.height = `${hgt}px`;
  el.style.zIndex = ++zTop;
  layer().append(el);

  const realH = el.offsetHeight;
  let x;
  let y;
  if (opts.x != null && !mobile) {
    x = opts.x;
    y = opts.y;
  } else if (opts.center || win.dialog || mobile) {
    x = (a.w - w) / 2;
    y = Math.max(6, (a.h - realH) / 2 - (mobile ? 0 : 20));
  } else {
    const step = (cascade++ % 7) * 28;
    x = Math.max(8, Math.min(a.w - w - 8, (a.w - w) / 2 - 90 + step + (opts.offsetX || 0)));
    y = Math.max(8, Math.min(a.h - realH - 8, (a.h - realH) / 2 - 70 + step + (opts.offsetY || 0)));
  }
  applyRect(win, { x: clamp(x, 0, Math.max(0, a.w - w)), y: clamp(y, 0, Math.max(0, a.h - 30)) });

  windows.set(id, win);
  if ((mobile && resizable) || opts.maximized) setMaximized(win, true, { animate: false });

  bus.emit('window:open', win);
  focusWindow(win);
  playSfx('open');

  if (opts.from) flip(el, opts.from, { duration: 260, fade: true });
  else if (!reducedMotion()) el.animate([{ transform: 'scale(.96)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 160, easing: EASE });

  return win;
}

export function focusWindow(win) {
  if (!win || win.closed) return;
  if (win.minimized) { restore(win); return; }
  if (win.pinnedZ) win.el.style.zIndex = win.pinnedZ;
  else if (Number(win.el.style.zIndex) !== zTop) win.el.style.zIndex = ++zTop;
  if (activeId === win.id) return;
  const prev = windows.get(activeId);
  if (prev) {
    prev.el.classList.remove('is-active');
    prev.hooks.onBlur?.(prev);
  }
  activeId = win.id;
  win.el.classList.add('is-active');
  win.hooks.onFocus?.(win);
  bus.emit('window:focus', win);
}

function activateTopmost() {
  const candidates = getWindows().filter((w) => !w.minimized && !w.closed);
  candidates.sort((a, b) => Number(b.el.style.zIndex) - Number(a.el.style.zIndex));
  if (candidates[0]) focusWindow(candidates[0]);
  else {
    activeId = null;
    bus.emit('window:focus', null);
  }
}

export async function closeWindow(win) {
  if (!win || win.closed) return;
  if (win.hooks.beforeClose && (await win.hooks.beforeClose(win)) === false) return;
  win.closed = true;
  windows.delete(win.id);
  if (activeId === win.id) activeId = null;
  playSfx('close');
  bus.emit('window:close', win);
  try { win.hooks.onClose?.(win); } catch (err) { console.error(err); }
  if (!reducedMotion() && win.el.animate) {
    await win.el.animate([{ transform: 'none', opacity: 1 }, { transform: 'scale(.97)', opacity: 0 }], { duration: 120, easing: 'ease-in', fill: 'forwards' }).finished.catch(() => {});
  }
  win.el.remove();
  if (!activeId) activateTopmost();
}

export function closeAll() {
  for (const win of getWindows()) closeWindow(win);
}

export async function minimize(win) {
  if (!win || win.minimized || !win.minimizable) return;
  const target = taskButtonRect(win);
  playSfx('minimize');
  win.minimized = true;
  win.el.classList.remove('is-active');
  if (activeId === win.id) activeId = null;
  bus.emit('window:minimize', win);
  win.hooks.onMinimize?.(win);
  if (target) await flip(win.el, target, { duration: 220, reverse: true, fade: true });
  if (win.minimized) {
    win.el.classList.add('is-minimized');
    win.el.getAnimations?.().forEach((a) => a.cancel());
  }
  activateTopmost();
}

export function restore(win) {
  if (!win || !win.minimized) return;
  win.minimized = false;
  win.el.classList.remove('is-minimized');
  win.el.getAnimations?.().forEach((a) => a.cancel());
  playSfx('maximize');
  bus.emit('window:restore', win);
  win.hooks.onRestore?.(win);
  focusWindow(win);
  const from = taskButtonRect(win);
  if (from) flip(win.el, from, { duration: 240, fade: true });
}

function setMaximized(win, on, { animate = true } = {}) {
  if (on === win.maximized) return;
  const first = win.el.getBoundingClientRect();
  if (on) {
    if (!win.snapped) win.prevRect = rectOf(win);
    win.maximized = true;
    win.el.classList.add('is-maximized');
  } else {
    win.maximized = false;
    win.el.classList.remove('is-maximized');
    if (win.prevRect) applyRect(win, win.prevRect);
  }
  win.snapped = null;
  if (win.btnMax) {
    win.btnMax.innerHTML = on ? GLYPHS.restore : GLYPHS.max;
    win.btnMax.setAttribute('aria-label', on ? 'Restore' : 'Maximize');
  }
  if (animate) flip(win.el, first, { duration: 200 });
  notifyResize(win);
}

export function toggleMaximize(win) {
  if (!win.maximizable) return;
  if (isMobile() && win.maximized) return;
  playSfx(win.maximized ? 'minimize' : 'maximize');
  setMaximized(win, !win.maximized);
}

function centerWindow(win) {
  const a = area();
  const r = rectOf(win);
  applyRect(win, { x: Math.max(0, (a.w - r.w) / 2), y: Math.max(0, (a.h - r.h) / 2) });
}

function systemMenu(win, anchorRect, x, y) {
  openMenu([
    { label: '&Restore', disabled: !win.maximized && !win.snapped, action: () => (win.snapped ? unsnap(win) : setMaximized(win, false)) },
    { label: '&Minimize', disabled: !win.minimizable, action: () => minimize(win) },
    { label: 'Ma&ximize', disabled: !win.maximizable || win.maximized, action: () => setMaximized(win, true) },
    '-',
    { label: '&Close', shortcut: 'Alt+F4', action: () => closeWindow(win) },
  ], anchorRect ? { anchorRect, placement: 'below' } : { x, y });
}

// --------------------------------------------------------- drag & snap

function snapTarget(px, py, a) {
  if (py <= 2) return 'max';
  if (px <= 4) return 'left';
  if (px >= a.w - 5) return 'right';
  return null;
}

function snapRect(kind, a) {
  if (kind === 'left') return { x: 0, y: 0, w: Math.round(a.w / 2), h: a.h };
  if (kind === 'right') return { x: Math.round(a.w / 2), y: 0, w: a.w - Math.round(a.w / 2), h: a.h };
  return { x: 0, y: 0, w: a.w, h: a.h };
}

function showSnap(kind, a) {
  const el = document.getElementById('snap-preview');
  if (!el) return;
  if (!kind) { el.hidden = true; return; }
  const r = snapRect(kind, a);
  Object.assign(el.style, { left: `${r.x + 6}px`, top: `${r.y + 6}px`, width: `${r.w - 12}px`, height: `${r.h - 12}px` });
  el.hidden = false;
}

function unsnap(win) {
  win.snapped = null;
  if (win.prevRect) applyRect(win, win.prevRect);
  notifyResize(win);
}

function startDrag(win, e) {
  if (e.button !== 0 || e.target.closest('button')) return;
  if (isMobile()) return;
  e.preventDefault();
  focusWindow(win);

  const handle = e.currentTarget;
  const a = area();
  let base = { px: e.clientX, py: e.clientY, ...rectOf(win) };
  let moved = false;
  let snap = null;
  handle.setPointerCapture?.(e.pointerId);

  const onMove = (ev) => {
    const dx = ev.clientX - base.px;
    const dy = ev.clientY - base.py;
    if (!moved) {
      if (Math.hypot(dx, dy) < 4) return;
      moved = true;
      win.el.classList.add('is-dragging');
      // Dragging a maximized/snapped window pops it back to its old size under the cursor.
      if (win.maximized || win.snapped) {
        const prev = win.prevRect || { w: Math.min(640, a.w * 0.6), h: Math.min(460, a.h * 0.7) };
        const ratio = clamp((base.px - a.left - base.x) / base.w, 0.1, 0.9);
        if (win.maximized) setMaximized(win, false, { animate: false });
        win.snapped = null;
        const r = { x: ev.clientX - a.left - prev.w * ratio, y: Math.max(0, ev.clientY - a.top - 12), w: prev.w, h: prev.h };
        applyRect(win, r);
        notifyResize(win);
        base = { px: ev.clientX, py: ev.clientY, ...r };
        return;
      }
    }
    const nx = clamp(base.x + dx, -base.w + 80, a.w - 80);
    const ny = clamp(base.y + dy, 0, a.h - 28);
    win.el.style.left = `${nx}px`;
    win.el.style.top = `${ny}px`;
    snap = win.resizable ? snapTarget(ev.clientX - a.left, ev.clientY - a.top, a) : null;
    showSnap(snap, a);
  };

  const onUp = () => {
    handle.removeEventListener('pointermove', onMove);
    handle.removeEventListener('pointerup', onUp);
    handle.removeEventListener('pointercancel', onUp);
    win.el.classList.remove('is-dragging');
    showSnap(null, a);
    if (!moved || !snap) return;
    if (snap === 'max') {
      win.prevRect = { ...rectOf(win), x: base.x, y: base.y };
      setMaximized(win, true);
      return;
    }
    const first = win.el.getBoundingClientRect();
    win.prevRect = { x: base.x, y: base.y, w: base.w, h: base.h };
    win.snapped = snap;
    applyRect(win, snapRect(snap, a));
    flip(win.el, first, { duration: 180 });
    notifyResize(win);
    playSfx('maximize');
  };

  handle.addEventListener('pointermove', onMove);
  handle.addEventListener('pointerup', onUp);
  handle.addEventListener('pointercancel', onUp);
}

// ---------------------------------------------------------------- resize

function startResize(win, e, dir) {
  if (e.button !== 0 || win.maximized) return;
  e.preventDefault();
  e.stopPropagation();
  focusWindow(win);
  const handle = e.currentTarget;
  handle.setPointerCapture?.(e.pointerId);
  const a = area();
  const start = { px: e.clientX, py: e.clientY, ...rectOf(win) };
  win.snapped = null;
  win.el.classList.add('is-resizing');

  const onMove = (ev) => {
    const dx = ev.clientX - start.px;
    const dy = ev.clientY - start.py;
    let { x, y, w, h: hh } = start;
    if (dir.includes('e')) w = start.w + dx;
    if (dir.includes('s')) hh = start.h + dy;
    if (dir.includes('w')) { w = start.w - dx; x = start.x + dx; }
    if (dir.includes('n')) { hh = start.h - dy; y = start.y + dy; }
    if (w < win.minW) { if (dir.includes('w')) x -= win.minW - w; w = win.minW; }
    if (hh < win.minH) { if (dir.includes('n')) y -= win.minH - hh; hh = win.minH; }
    if (y < 0) { hh += y; y = 0; }
    hh = Math.min(hh, a.h - y);
    applyRect(win, { x, y, w, h: hh });
    notifyResize(win);
  };
  const onUp = () => {
    handle.removeEventListener('pointermove', onMove);
    handle.removeEventListener('pointerup', onUp);
    handle.removeEventListener('pointercancel', onUp);
    win.el.classList.remove('is-resizing');
  };
  handle.addEventListener('pointermove', onMove);
  handle.addEventListener('pointerup', onUp);
  handle.addEventListener('pointercancel', onUp);
}

// ------------------------------------------------------- global behaviour

let lastMobile = null;
window.addEventListener('resize', () => {
  const mobile = isMobile();
  const a = area();
  for (const win of windows.values()) {
    if (mobile && win.resizable && !win.maximized) setMaximized(win, true, { animate: false });
    else if (!mobile && lastMobile && win.maximized && win.prevRect) setMaximized(win, false, { animate: false });
    if (win.snapped) applyRect(win, snapRect(win.snapped, a));
    if (!win.maximized) {
      const r = rectOf(win);
      applyRect(win, { x: clamp(r.x, -r.w + 80, Math.max(0, a.w - 80)), y: clamp(r.y, 0, Math.max(0, a.h - 28)) });
    }
    notifyResize(win);
  }
  lastMobile = mobile;
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape' || e.defaultPrevented) return;
  const win = getActiveWindow();
  if (win?.dialog) {
    e.preventDefault();
    closeWindow(win);
  }
});
