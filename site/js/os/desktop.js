// Desktop icons: layout, selection (click, ctrl-click, rubber band), drag to
// rearrange, double-click (or single tap on touch) to open, context menus.

import { h, $, clamp, isMobile } from './dom.js';
import { icon, iconUrl } from './icons.js';
import { openMenu } from './menu.js';
import { launch, openLink } from '../apps/registry.js';
import { profile } from '../content.js';
import { playSfx, unlockAudio } from './sound.js';

const CELL_W = 104;
const CELL_H = 100;
const PAD = 10;
let userArranged = false;

const DESKTOP_ITEMS = [
  { id: 'computer', label: 'My Computer', icon: 'computer', open: (from) => launch('computer', { from }) },
  { id: 'about', label: 'About_Me.doc', icon: 'doc', open: (from) => launch('about', { from }) },
  { id: 'projects', label: 'Projects', icon: 'projects', open: (from) => launch('projects', { from }) },
  { id: 'pictures', label: 'My Pictures', icon: 'pictures', open: (from) => launch('pictures', { from }) },
  { id: 'contact', label: 'Contact Me', icon: 'mail', open: (from) => launch('contact', { from }) },
  { id: 'terminal', label: 'MS-DOS Prompt', icon: 'terminal', open: (from) => launch('terminal', { from }) },
  { id: 'minesweeper', label: 'Minesweeper', icon: 'mine', open: (from) => launch('minesweeper', { from }) },
  { id: 'pablo', label: 'Pablo.exe', icon: 'pablo', open: (from) => launch('pablo', { from }) },
  { id: 'github', label: 'GitHub', icon: 'github', shortcut: true, open: () => openLink(profile.github) },
  { id: 'linkedin', label: 'LinkedIn', icon: 'linkedin', shortcut: true, open: () => openLink(profile.linkedin) },
  { id: 'recycle', label: 'Recycle Bin', icon: 'recycle', open: (from) => launch('recycle', { from }) },
];

const els = new Map();       // id -> element
const positions = new Map(); // id -> {col,row}
let selected = new Set();
let focusedId = null;

export function initDesktop() {
  const root = $('#icons');

  DESKTOP_ITEMS.forEach((item) => {
    const img = h('span', { class: 'di-img', html: icon(item.icon, 48) });
    img.style.setProperty('--mask', iconUrl(item.icon));
    const el = h('li', {
      class: 'desk-icon',
      role: 'option',
      tabIndex: -1,
      'aria-selected': 'false',
      'data-id': item.id,
      title: item.shortcut ? `${item.label} (opens in a new tab)` : item.label,
    }, img, h('span', { class: 'di-label' }, item.label));
    attach(el, item);
    els.set(item.id, el);
    root.append(el);
  });
  focusedId = DESKTOP_ITEMS[0].id;
  els.get(focusedId).tabIndex = 0;

  arrange();
  let lastH = root.clientHeight;
  new ResizeObserver(() => {
    if (root.clientHeight === lastH) return;
    lastH = root.clientHeight;
    arrange(true);
  }).observe(root);

  // Clicks on empty desktop clear selection / start rubber band
  const desktop = $('#desktop');
  desktop.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    if (e.target.closest('.window, .desk-icon')) return;
    unlockAudio();
    if (!e.ctrlKey && !e.metaKey) setSelection([]);
    if (!isMobile()) startMarquee(e);
  });
  desktop.addEventListener('contextmenu', (e) => {
    if (e.target.closest('.window, .desk-icon')) return;
    e.preventDefault();
    desktopMenu(e.clientX, e.clientY);
  });

  root.addEventListener('keydown', onKey);
}

function freeRows() {
  const area = $('#icons').getBoundingClientRect();
  return Math.max(1, Math.floor((area.height - PAD * 2) / CELL_H));
}

/** Lay icons out in columns, top to bottom. */
export function arrange(keepCustom = false) {
  if (isMobile()) return; // CSS grid handles phones
  const rows = freeRows();
  const keep = keepCustom && userArranged;
  DESKTOP_ITEMS.forEach((item, i) => {
    let pos = positions.get(item.id);
    if (!pos || !keep || pos.row >= rows) {
      pos = { col: Math.floor(i / rows), row: i % rows };
      positions.set(item.id, pos);
    }
    place(item.id, pos);
  });
}

function place(id, { col, row }) {
  const el = els.get(id);
  el.style.left = `${PAD + col * CELL_W}px`;
  el.style.top = `${PAD + row * CELL_H}px`;
}

function setSelection(ids) {
  selected = new Set(ids);
  for (const [id, el] of els) {
    const on = selected.has(id);
    el.classList.toggle('is-selected', on);
    el.setAttribute('aria-selected', String(on));
  }
}

function setFocus(id) {
  if (!els.has(id)) return;
  els.get(focusedId).tabIndex = -1;
  focusedId = id;
  const el = els.get(id);
  el.tabIndex = 0;
  el.focus({ preventScroll: true });
}

function openItem(item, el) {
  playSfx('click');
  const from = el.querySelector('.di-img').getBoundingClientRect();
  item.open(from);
}

function attach(el, item) {
  let downAt = null;
  let dragging = false;

  el.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    unlockAudio();
    if (e.ctrlKey || e.metaKey) {
      const next = new Set(selected);
      next.has(item.id) ? next.delete(item.id) : next.add(item.id);
      setSelection([...next]);
    } else if (!selected.has(item.id)) {
      setSelection([item.id]);
    }
    setFocus(item.id);
    downAt = { x: e.clientX, y: e.clientY, left: el.offsetLeft, top: el.offsetTop, type: e.pointerType };
    dragging = false;
    if (!isMobile()) el.setPointerCapture?.(e.pointerId);
  });

  el.addEventListener('pointermove', (e) => {
    if (!downAt || isMobile()) return;
    const dx = e.clientX - downAt.x;
    const dy = e.clientY - downAt.y;
    if (!dragging && Math.hypot(dx, dy) < 5) return;
    dragging = true;
    el.classList.add('is-dragging');
    el.style.left = `${downAt.left + dx}px`;
    el.style.top = `${downAt.top + dy}px`;
  });

  el.addEventListener('pointerup', (e) => {
    if (!downAt) return;
    const wasTouchTap = !dragging && (downAt.type === 'touch' || downAt.type === 'pen');
    if (dragging) {
      el.classList.remove('is-dragging');
      const rows = freeRows();
      const area = $('#icons').getBoundingClientRect();
      const maxCol = Math.max(0, Math.floor((area.width - PAD * 2) / CELL_W) - 1);
      const col = clamp(Math.round((el.offsetLeft - PAD) / CELL_W), 0, maxCol);
      const row = clamp(Math.round((el.offsetTop - PAD) / CELL_H), 0, rows - 1);
      // swap with whatever is already there
      const other = [...positions].find(([id, p]) => id !== item.id && p.col === col && p.row === row);
      if (other) {
        positions.set(other[0], positions.get(item.id));
        place(other[0], positions.get(other[0]));
      }
      positions.set(item.id, { col, row });
      place(item.id, { col, row });
      userArranged = true;
    }
    downAt = null;
    if (wasTouchTap) openItem(item, el);
    void e;
  });
  el.addEventListener('pointercancel', () => { downAt = null; dragging = false; el.classList.remove('is-dragging'); });

  el.addEventListener('dblclick', () => openItem(item, el));
  el.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    setSelection([item.id]);
    setFocus(item.id);
    openMenu([
      { label: '&Open', action: () => openItem(item, el) },
      item.shortcut ? { label: 'Copy &Link', action: () => navigator.clipboard?.writeText(item.id === 'github' ? profile.github : profile.linkedin) } : null,
      item.id === 'recycle' ? { label: '&Empty Recycle Bin', action: () => launch('recycle', { empty: true }) } : null,
      '-',
      { label: 'P&roperties', action: () => properties(item) },
    ], { x: e.clientX, y: e.clientY });
  });
}

function properties(item) {
  if (item.id === 'computer') return launch('computer');
  import('./dialog.js').then(({ msgbox }) => msgbox({
    title: `${item.label} Properties`,
    icon: item.icon,
    message: item.shortcut
      ? `Type: Internet Shortcut\nTarget: ${item.id === 'github' ? profile.github : profile.linkedin}`
      : `Type: ${item.icon === 'doc' ? 'WordPad Document' : item.icon.includes('folder') || ['projects', 'pictures'].includes(item.id) ? 'File Folder' : 'Application'}\nLocation: C:\\WINDOWS\\Desktop`,
  }));
}

function desktopMenu(x, y) {
  openMenu([
    { label: 'Arrange &Icons', items: [
      { label: 'by &Name', action: () => { userArranged = false; positions.clear(); arrange(); } },
      { label: '&Auto Arrange', action: () => { userArranged = false; positions.clear(); arrange(); } },
    ] },
    { label: 'Line &up Icons', action: () => arrange(true) },
    '-',
    { label: 'R&efresh', action: refreshFlash },
    '-',
    { label: 'Ne&w', items: [
      { label: '&Folder', icon: 'folder', action: () => import('./dialog.js').then(({ msgbox }) => msgbox({ icon: 'warning', title: 'Access Denied', message: 'This desktop is read-only. Matt likes it tidy.' })) },
      { label: '&Text Document', icon: 'notepad', action: () => launch('notepad', { file: 'New Text Document.txt', key: `notepad:${Date.now()}` }) },
    ] },
    '-',
    { label: 'P&roperties', action: () => launch('display') },
  ], { x, y });
}

function refreshFlash() {
  const root = $('#icons');
  root.style.visibility = 'hidden';
  setTimeout(() => { root.style.visibility = ''; }, 120);
}

function startMarquee(e) {
  const root = $('#icons');
  const area = root.getBoundingClientRect();
  const x0 = e.clientX - area.left;
  const y0 = e.clientY - area.top;
  const box = h('div', { class: 'marquee' });
  let active = false;

  const move = (ev) => {
    const x1 = ev.clientX - area.left;
    const y1 = ev.clientY - area.top;
    if (!active) {
      if (Math.hypot(x1 - x0, y1 - y0) < 4) return;
      active = true;
      root.append(box);
    }
    const r = { left: Math.min(x0, x1), top: Math.min(y0, y1), right: Math.max(x0, x1), bottom: Math.max(y0, y1) };
    Object.assign(box.style, { left: `${r.left}px`, top: `${r.top}px`, width: `${r.right - r.left}px`, height: `${r.bottom - r.top}px` });
    const hits = [];
    for (const [id, el] of els) {
      const b = el.getBoundingClientRect();
      const bl = b.left - area.left;
      const bt = b.top - area.top;
      if (bl < r.right && bl + b.width > r.left && bt < r.bottom && bt + b.height > r.top) hits.push(id);
    }
    setSelection(hits);
  };
  const up = () => {
    window.removeEventListener('pointermove', move);
    window.removeEventListener('pointerup', up);
    box.remove();
  };
  window.addEventListener('pointermove', move);
  window.addEventListener('pointerup', up);
}

function onKey(e) {
  const order = DESKTOP_ITEMS.map((i) => i.id);
  const idx = order.indexOf(focusedId);
  const rows = isMobile() ? 1 : freeRows();
  const cols = isMobile() ? 4 : rows;
  let next = idx;
  switch (e.key) {
    case 'ArrowDown': next = isMobile() ? idx + cols : idx + 1; break;
    case 'ArrowUp': next = isMobile() ? idx - cols : idx - 1; break;
    case 'ArrowRight': next = isMobile() ? idx + 1 : idx + rows; break;
    case 'ArrowLeft': next = isMobile() ? idx - 1 : idx - rows; break;
    case 'Enter': {
      const item = DESKTOP_ITEMS[idx];
      openItem(item, els.get(item.id));
      e.preventDefault();
      return;
    }
    default: return;
  }
  e.preventDefault();
  next = clamp(next, 0, order.length - 1);
  setSelection([order[next]]);
  setFocus(order[next]);
}

export function focusDesktop() {
  els.get(focusedId)?.focus({ preventScroll: true });
}
