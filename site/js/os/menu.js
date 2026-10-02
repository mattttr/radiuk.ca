// Dropdown / context / start menus with nested submenus and keyboard support.
//
// Item shape: { label: '&Open', icon?, iconSize?, shortcut?, action?, items?,
//               disabled?, checked?, radio? }  or the string '-' for a separator.
// An "&" marks the access key (underlined, triggers on keypress).

import { h, accessLabel } from './dom.js';
import { icon } from './icons.js';
import { playSfx } from './sound.js';

const stack = [];      // open menus, root first
let rootOpts = null;
let openWidth = 0;

// Close on real resizes only. Mobile URL bars cause height-only resize events.
function onResize() {
  if (window.innerWidth !== openWidth) closeMenus();
}

export const isMenuOpen = () => stack.length > 0;

export function closeMenus() {
  while (stack.length) stack.pop().el.remove();
  document.removeEventListener('pointerdown', onOutside, true);
  document.removeEventListener('keydown', onKey, true);
  window.removeEventListener('blur', closeMenus);
  window.removeEventListener('resize', onResize);
  if (rootOpts) {
    const opts = rootOpts;
    rootOpts = null;
    opts.onClose?.();
  }
}

/**
 * Open a menu. Options:
 *   x, y               absolute position (context menus)
 *   anchorRect         DOMRect to attach to
 *   placement          'below' | 'above' | 'right'
 *   ignore             elements whose clicks shouldn't count as "outside"
 *   start, banner      render as the Start menu
 *   focusFirst         highlight first item (keyboard-opened menus)
 *   onClose, onNavigate(dir)
 */
export function openMenu(items, opts = {}) {
  closeMenus();
  rootOpts = opts;
  const menu = createMenu(items, opts, 0);
  document.addEventListener('pointerdown', onOutside, true);
  document.addEventListener('keydown', onKey, true);
  window.addEventListener('blur', closeMenus);
  openWidth = window.innerWidth;
  if (!new URLSearchParams(location.search).has('demo')) window.addEventListener('resize', onResize);
  if (opts.focusFirst) setActive(menu, nextEnabled(menu, -1, 1));
  return { el: menu.el, close: closeMenus };
}

function createMenu(rawItems, opts, depth) {
  const items = rawItems.filter(Boolean);
  const isStart = opts.start && depth === 0;
  const menu = { items, depth, active: -1, buttons: [], el: null, timer: 0 };

  const el = h('div', { class: `menu ${isStart ? 'start-menu' : ''} ${opts.className || ''}`, role: 'menu' });
  let list = el;
  if (isStart) {
    el.append(h('div', { class: 'start-banner', html: opts.banner || '' }));
    list = h('div', { class: 'start-items' });
    el.append(list);
  }

  items.forEach((item, i) => {
    if (item === '-') {
      list.append(h('div', { class: 'menu-sep', role: 'separator' }));
      menu.buttons.push(null);
      return;
    }
    const classes = ['menu-item'];
    if (item.items) classes.push('has-sub');
    if (item.checked) classes.push(item.radio ? 'is-radio' : 'is-checked');
    const size = item.iconSize || (isStart ? 32 : 16);
    const btn = h('button', {
      class: classes.join(' '),
      role: item.checked != null ? (item.radio ? 'menuitemradio' : 'menuitemcheckbox') : 'menuitem',
      'aria-checked': item.checked != null ? String(!!item.checked) : null,
      'aria-haspopup': item.items ? 'menu' : null,
      tabIndex: -1,
      disabled: !!item.disabled,
    },
      h('span', { class: 'mi-icon', html: item.icon ? icon(item.icon, size) : '' }),
      h('span', { class: 'mi-label' }, accessLabel(item.label)),
      item.shortcut ? h('span', { class: 'mi-shortcut' }, item.shortcut) : null,
    );
    btn.addEventListener('pointerenter', () => hover(menu, i));
    btn.addEventListener('click', (e) => { e.stopPropagation(); activate(menu, i); });
    menu.buttons.push(btn);
    list.append(btn);
  });

  menu.el = el;
  document.body.append(el);
  position(el, opts);
  stack.push(menu);
  return menu;
}

function position(el, opts) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const r = el.getBoundingClientRect();
  let x = 0;
  let y = 0;
  if (opts.x != null) {
    x = opts.x;
    y = opts.y;
  } else if (opts.anchorRect) {
    const a = opts.anchorRect;
    const p = opts.placement || 'below';
    if (p === 'below') { x = a.left; y = a.bottom; if (y + r.height > vh) y = a.top - r.height; }
    else if (p === 'above') { x = a.left; y = a.top - r.height; }
    else if (p === 'right') { x = a.right - 3; y = a.top - 3; if (x + r.width > vw) x = a.left - r.width + 3; }
  }
  if (x + r.width > vw) x = vw - r.width - 2;
  if (y + r.height > vh) y = vh - r.height - 2;
  el.style.left = `${Math.max(2, x)}px`;
  el.style.top = `${Math.max(2, y)}px`;
}

function closeDeeper(depth) {
  while (stack.length > depth + 1) stack.pop().el.remove();
}

function setActive(menu, i) {
  menu.active = i;
  menu.buttons.forEach((b, j) => b?.classList.toggle('is-active', j === i));
  menu.buttons[i]?.focus({ preventScroll: true });
}

function nextEnabled(menu, from, dir) {
  const n = menu.items.length;
  for (let step = 1; step <= n; step++) {
    const i = (from + dir * step + n * 2) % n;
    const item = menu.items[i];
    if (item !== '-' && !item.disabled) return i;
  }
  return -1;
}

function hover(menu, i) {
  clearTimeout(menu.timer);
  setActive(menu, i);
  const item = menu.items[i];
  if (item.items && !item.disabled) {
    menu.timer = setTimeout(() => openSub(menu, i, false), 160);
  } else {
    closeDeeper(menu.depth);
  }
}

function openSub(menu, i, focusFirst) {
  if (!stack.includes(menu)) return;
  const existing = stack[menu.depth + 1];
  if (existing && existing.parentIndex === i) {
    if (focusFirst) setActive(existing, nextEnabled(existing, -1, 1));
    return;
  }
  closeDeeper(menu.depth);
  const rect = menu.buttons[i].getBoundingClientRect();
  const sub = createMenu(menu.items[i].items, { anchorRect: rect, placement: 'right' }, menu.depth + 1);
  sub.parentIndex = i;
  if (focusFirst) setActive(sub, nextEnabled(sub, -1, 1));
}

function activate(menu, i) {
  const item = menu.items[i];
  if (!item || item === '-' || item.disabled) return;
  if (item.items) {
    clearTimeout(menu.timer);
    openSub(menu, i, true);
    return;
  }
  closeMenus();
  playSfx('click');
  item.action?.();
}

function onOutside(e) {
  if (stack.some((m) => m.el.contains(e.target))) return;
  if (rootOpts?.ignore?.some((el) => el && el.contains(e.target))) return;
  closeMenus();
}

function onKey(e) {
  const menu = stack[stack.length - 1];
  if (!menu) return;
  const current = menu.items[menu.active];
  switch (e.key) {
    case 'ArrowDown': setActive(menu, nextEnabled(menu, menu.active, 1)); break;
    case 'ArrowUp': setActive(menu, nextEnabled(menu, menu.active < 0 ? 0 : menu.active, -1)); break;
    case 'ArrowRight':
      if (current?.items) openSub(menu, menu.active, true);
      else if (rootOpts?.onNavigate) rootOpts.onNavigate(1);
      break;
    case 'ArrowLeft':
      if (stack.length > 1) {
        stack.pop().el.remove();
        const parent = stack[stack.length - 1];
        setActive(parent, parent.active);
      } else if (rootOpts?.onNavigate) rootOpts.onNavigate(-1);
      break;
    case 'Enter':
    case ' ':
      if (menu.active >= 0) activate(menu, menu.active);
      break;
    case 'Escape':
      if (stack.length > 1) {
        stack.pop().el.remove();
        const parent = stack[stack.length - 1];
        setActive(parent, parent.active);
      } else {
        const ret = rootOpts?.returnFocus;
        closeMenus();
        ret?.focus?.();
      }
      break;
    case 'Tab':
      closeMenus();
      return;
    default: {
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toLowerCase();
      const idx = menu.items.findIndex((it) => {
        if (it === '-' || it.disabled) return false;
        const amp = it.label.indexOf('&');
        return amp >= 0 && it.label[amp + 1]?.toLowerCase() === k;
      });
      if (idx < 0) return;
      setActive(menu, idx);
      activate(menu, idx);
    }
  }
  e.preventDefault();
  e.stopPropagation();
}

/** A window menubar. defs: [{ label: '&File', items: [...] | () => [...] }] */
export function menubar(defs) {
  const bar = h('nav', { class: 'menubar', role: 'menubar' });
  let openIdx = -1;

  const open = (i, focusFirst = false) => {
    const def = defs[i];
    const items = typeof def.items === 'function' ? def.items() : def.items;
    openMenu(items, {
      anchorRect: buttons[i].getBoundingClientRect(),
      placement: 'below',
      ignore: [bar],
      focusFirst,
      returnFocus: buttons[i],
      onClose: () => {
        buttons[i].classList.remove('is-open');
        if (openIdx === i) openIdx = -1;
      },
      onNavigate: (dir) => open((i + dir + defs.length) % defs.length, true),
    });
    openIdx = i;
    buttons[i].classList.add('is-open');
  };

  const buttons = defs.map((def, i) => {
    const b = h('button', { class: 'menubar-item', role: 'menuitem', 'aria-haspopup': 'menu', type: 'button' }, accessLabel(def.label));
    b.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      if (openIdx === i) closeMenus();
      else open(i);
    });
    b.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') { e.preventDefault(); open(i, true); }
    });
    b.addEventListener('pointerenter', () => { if (openIdx >= 0 && openIdx !== i) open(i); });
    bar.append(b);
    return b;
  });

  return bar;
}
