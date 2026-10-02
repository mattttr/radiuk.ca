// Shared Explorer window used by Projects, My Pictures and the Recycle Bin.

import { h, isTouch, escapeHtml } from '../os/dom.js';
import { icon } from '../os/icons.js';
import { openWindow } from '../os/wm.js';
import { msgbox } from '../os/dialog.js';

/**
 * items: [{ id, name, icon?, thumb?, type?, size?, detail? }]
 * describe(item) -> Node shown in the web-view sidebar for the selection
 * onOpen(item, rect)
 */
export function explorer(opts) {
  const {
    appId, route, title, iconName, address, from, intro,
    describe, onOpen, width = 820, height = 560, extraFileItems = [], view: initialView = 'thumbs',
  } = opts;
  let items = opts.items.slice();
  let view = initialView;
  let selectedId = null;

  const grid = h('div', { class: 'ex-grid', role: 'listbox', tabIndex: 0, 'aria-label': title });
  const main = h('div', { class: 'ex-main scroll' }, grid);
  const sideBody = h('div', { class: 'ex-side-body' });
  const side = h('aside', { class: 'ex-side' },
    h('div', { class: 'ex-side-head', html: `${icon(iconName, 48)}<h2>${title}</h2>` }),
    h('div', { class: 'ex-rule' }),
    sideBody);
  const content = h('div', { class: 'explorer' }, side, main);

  const toolbar = h('div', { class: 'toolbar ex-toolbar' },
    h('span', { class: 'ex-addr-label' }, 'Address'),
    h('div', { class: 'field ex-addr', html: `${icon(iconName, 16)}<span>${address}</span>` }),
    h('button', { class: 'tool-btn', type: 'button', title: 'Large icons', html: '▦', onClick: () => setView('thumbs') }),
    h('button', { class: 'tool-btn', type: 'button', title: 'Details', html: '☰', onClick: () => setView('details') }),
  );

  const win = openWindow({
    appId,
    route,
    title,
    icon: iconName,
    width,
    height,
    minWidth: 320,
    minHeight: 260,
    content,
    toolbar,
    from,
    menu: [
      { label: '&File', items: () => [
        { label: '&Open', disabled: !selectedId, action: () => openSelected() },
        ...extraFileItems.map((it) => (typeof it === 'function' ? it() : it)),
        '-',
        { label: '&Close', action: () => win.close() },
      ] },
      { label: '&Edit', items: () => [
        { label: 'Select &All', shortcut: 'Ctrl+A', disabled: true },
        { label: 'Invert Selection', disabled: true },
      ] },
      { label: '&View', items: () => [
        { label: 'Lar&ge Icons', radio: true, checked: view === 'thumbs', action: () => setView('thumbs') },
        { label: '&Details', radio: true, checked: view === 'details', action: () => setView('details') },
      ] },
      { label: '&Help', items: () => [
        { label: `&About ${title}`, action: () => msgbox({ title, icon: iconName, message: (typeof intro === 'string' ? intro : intro?.textContent) || title }) },
      ] },
    ],
    statusbar: ['', { text: '', fixed: true, width: '45%' }],
  });

  function setView(v) {
    view = v;
    render();
  }

  function itemEl(item) {
    const visual = item.thumb
      ? h('span', { class: 'ex-thumb' }, h('img', { src: item.thumb, alt: '', loading: 'lazy', width: 160, height: 120 }))
      : h('span', { class: 'ex-icon', html: icon(item.icon || 'app', 48) });
    const el = h('button', {
      class: 'ex-item',
      type: 'button',
      role: 'option',
      tabIndex: -1,
      'aria-selected': 'false',
      'data-id': item.id,
    }, visual, h('span', { class: 'ex-label' }, item.name));
    return el;
  }

  function detailsTable() {
    const table = h('table', null,
      h('thead', null, h('tr', null, h('th', null, 'Name'), h('th', null, 'Type'), h('th', null, 'Size'), h('th', null, 'Description'))),
      h('tbody', null, items.map((item) => h('tr', { 'data-id': item.id, class: 'ex-row' },
        h('td', { html: `<span class="ex-cell">${icon(item.icon || 'app', 16)}<span>${escapeHtml(item.name)}</span></span>` }),
        h('td', null, item.type || ''),
        h('td', null, item.size || ''),
        h('td', { class: 'ex-desc' }, item.detail || '')))));
    return h('div', { class: 'listview' }, table);
  }

  function render() {
    grid.replaceChildren();
    grid.className = `ex-grid is-${view}`;
    if (!items.length) {
      grid.append(h('p', { class: 'ex-empty' }, opts.emptyText || 'This folder is empty.'));
    } else if (view === 'details') {
      grid.append(detailsTable());
    } else {
      items.forEach((item) => grid.append(itemEl(item)));
    }
    select(items.some((i) => i.id === selectedId) ? selectedId : null);
    win.setStatus(0, `${items.length} object(s)`);
  }

  function select(id) {
    selectedId = id;
    grid.querySelectorAll('[data-id]').forEach((el) => {
      const on = el.dataset.id === id;
      el.classList.toggle('is-selected', on);
      if (el.matches('.ex-item')) el.setAttribute('aria-selected', String(on));
    });
    const item = items.find((i) => i.id === id);
    sideBody.replaceChildren(item && describe ? describe(item, openSelected) : h('div', { class: 'ex-intro' }, intro || 'Select an item to view its description.'));
    win.setStatus(1, item ? item.name : '');
  }

  function openSelected() {
    const item = items.find((i) => i.id === selectedId);
    if (!item) return;
    const el = grid.querySelector(`[data-id="${CSS.escape(item.id)}"]`);
    onOpen?.(item, (el?.querySelector('.ex-thumb, .ex-icon') || el)?.getBoundingClientRect());
  }

  grid.addEventListener('click', (e) => {
    const el = e.target.closest('[data-id]');
    if (!el) { select(null); return; }
    select(el.dataset.id);
    if (isTouch()) openSelected();
  });
  grid.addEventListener('dblclick', (e) => {
    if (e.target.closest('[data-id]')) openSelected();
  });
  grid.addEventListener('keydown', (e) => {
    if (!items.length) return;
    const idx = Math.max(0, items.findIndex((i) => i.id === selectedId));
    let cols = 1;
    if (view === 'thumbs') {
      const els = [...grid.querySelectorAll('.ex-item')];
      const top = els[0]?.offsetTop;
      cols = Math.max(1, els.filter((el) => el.offsetTop === top).length);
    }
    let next = idx;
    if (e.key === 'ArrowRight') next = idx + 1;
    else if (e.key === 'ArrowLeft') next = idx - 1;
    else if (e.key === 'ArrowDown') next = idx + cols;
    else if (e.key === 'ArrowUp') next = idx - cols;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = items.length - 1;
    else if (e.key === 'Enter') { openSelected(); e.preventDefault(); return; }
    else return;
    e.preventDefault();
    next = Math.max(0, Math.min(items.length - 1, next));
    select(items[next].id);
    grid.querySelector(`[data-id="${CSS.escape(items[next].id)}"]`)?.scrollIntoView({ block: 'nearest' });
  });

  render();

  win.explorer = {
    setItems(next) { items = next.slice(); render(); },
    getItems: () => items,
    select,
  };
  return win;
}
