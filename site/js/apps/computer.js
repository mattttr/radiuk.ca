// My Computer -> System Properties. General / Device Manager (skills) / Performance.

import { h } from '../os/dom.js';
import { icon } from '../os/icons.js';
import { openWindow } from '../os/wm.js';
import { msgbox } from '../os/dialog.js';
import { playSfx } from '../os/sound.js';
import { profile, skills } from '../content.js';
import { openLink } from './registry.js';

export function open({ from } = {}) {
  const tabs = [
    { id: 'general', label: 'General', render: general },
    { id: 'devices', label: 'Device Manager', render: deviceManager },
    { id: 'perf', label: 'Performance', render: performance },
  ];

  const strip = h('div', { class: 'tab-strip', role: 'tablist' });
  const panel = h('div', { class: 'tab-panel', role: 'tabpanel' });
  const buttons = tabs.map((t, i) => {
    const b = h('button', { class: 'tab', role: 'tab', type: 'button', 'aria-selected': String(i === 0), id: `sys-tab-${t.id}` }, t.label);
    b.addEventListener('click', () => select(i));
    b.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight') { select((i + 1) % tabs.length); buttons[(i + 1) % tabs.length].focus(); }
      if (e.key === 'ArrowLeft') { select((i + tabs.length - 1) % tabs.length); buttons[(i + tabs.length - 1) % tabs.length].focus(); }
    });
    strip.append(b);
    return b;
  });
  function select(i) {
    buttons.forEach((b, j) => b.setAttribute('aria-selected', String(i === j)));
    panel.setAttribute('aria-labelledby', buttons[i].id);
    panel.replaceChildren(tabs[i].render());
  }

  const ok = h('button', { class: 'btn is-default', type: 'button', onClick: () => win.close() }, 'OK');
  const content = h('div', { class: 'sysprops' },
    h('div', { class: 'tabs' }, strip, panel),
    h('div', { class: 'btn-row' }, ok, h('button', { class: 'btn', type: 'button', onClick: () => win.close() }, 'Cancel')),
  );
  select(0);

  const win = openWindow({
    appId: 'computer',
    route: 'computer',
    title: 'System Properties',
    icon: 'computer',
    width: 520,
    height: 560,
    minWidth: 360,
    minHeight: 420,
    content,
    bodyClass: 'pad',
    from,
  });
  return win;
}

function general() {
  return h('div', { class: 'sys-general' },
    h('div', { class: 'sys-monitor' },
      h('div', { class: 'sys-screen' }, h('img', { src: 'img/matt.jpg', alt: 'Matt and Benji', width: 120, height: 120 })),
      h('div', { class: 'sys-stand' })),
    h('dl', { class: 'sys-info' },
      h('dt', null, 'System:'),
      h('dd', null, 'Matt Radiuk 95', h('br'), '4.00.950 B (Software Engineer Edition)'),
      h('dt', null, 'Registered to:'),
      h('dd', null, profile.name, h('br'), `${profile.location}`, h('br'), `Uptime: ${profile.experience} in production`),
      h('dt', null, 'Computer:'),
      h('dd', null, 'Backend · DevOps · AI', h('br'), 'Java / Python / Node.js', h('br'), 'AWS & Azure (certified)', h('br'), '640 KB RAM (should be enough for anybody)'),
    ));
}

function deviceManager() {
  const tree = h('ul', { class: 'tree', role: 'tree', 'aria-label': 'Devices' });
  let selected = null;
  let selectedItem = null;
  const propsBtn = h('button', { class: 'btn', type: 'button', disabled: true, onClick: () => properties(selectedItem) }, 'Properties');
  const removeBtn = h('button', { class: 'btn', type: 'button', disabled: true, onClick: () => removeDevice(selectedItem) }, 'Remove');

  const select = (row, item) => {
    selected?.classList.remove('is-selected');
    selected = row;
    selectedItem = item;
    row.classList.add('is-selected');
    propsBtn.disabled = !item;
    removeBtn.disabled = !item;
  };

  const rootRow = h('button', { class: 'tree-row', type: 'button', html: `${icon('computer', 16)}<span>MATT-PC</span>` });
  rootRow.addEventListener('click', () => select(rootRow, null));
  const rootList = h('ul', { role: 'group' });

  for (const group of skills) {
    const children = h('ul', { role: 'group' });
    const toggle = h('span', { class: 'tree-toggle', 'aria-hidden': 'true' }, '−');
    const groupRow = h('button', { class: 'tree-row', type: 'button', 'aria-expanded': 'true' }, toggle, h('span', { html: icon(group.icon, 16) }), h('span', null, group.group));
    const flip = () => {
      const open = children.hidden;
      children.hidden = !open;
      toggle.textContent = open ? '−' : '+';
      groupRow.setAttribute('aria-expanded', String(open));
    };
    groupRow.addEventListener('click', () => select(groupRow, null));
    groupRow.addEventListener('dblclick', flip);
    toggle.addEventListener('click', (e) => { e.stopPropagation(); flip(); });

    for (const item of group.items) {
      const row = h('button', { class: 'tree-row', type: 'button', role: 'treeitem', html: `${icon(group.icon, 16)}<span>${item.name}</span>` });
      row.addEventListener('click', () => select(row, item));
      row.addEventListener('dblclick', () => properties(item));
      row.addEventListener('keydown', (e) => { if (e.key === 'Enter') properties(item); });
      children.append(h('li', null, row));
    }
    rootList.append(h('li', null, groupRow, children));
  }
  tree.append(h('li', null, rootRow, rootList));

  return h('div', { class: 'sys-devices' },
    h('div', { class: 'radio-row' },
      h('label', { class: 'radio' }, h('input', { type: 'radio', name: 'dm-view', checked: true }), h('span', null, 'View devices by type')),
      h('label', { class: 'radio' }, h('input', { type: 'radio', name: 'dm-view', disabled: true }), h('span', null, 'View devices by connection'))),
    tree,
    h('div', { class: 'btn-row' }, propsBtn,
      h('button', { class: 'btn', type: 'button', onClick: () => { playSfx('ding'); tree.style.opacity = '0.3'; setTimeout(() => { tree.style.opacity = ''; }, 200); } }, 'Refresh'),
      removeBtn),
  );
}

function properties(item) {
  if (!item) return;
  const body = h('div', { class: 'device-props' },
    h('p', null, h('b', null, item.name)),
    h('p', null, item.detail),
    h('fieldset', { class: 'group' },
      h('legend', null, 'Device status'),
      h('p', null, item.status)),
  );
  if (item.link) {
    body.append(h('p', { style: { marginTop: '10px' } },
      h('button', { class: 'btn', type: 'button', onClick: () => openLink(item.link) }, 'View credential')));
  }
  msgbox({ title: `${item.name} Properties`, icon: 'info', message: body, width: 400 });
}

function removeDevice(item) {
  if (!item) return;
  msgbox({
    title: 'Confirm Device Removal',
    icon: 'warning',
    message: `You are about to remove "${item.name}" from your system.\n\nJust kidding. Removing this device would break production. Request denied.`,
  });
}

function performance() {
  const meter = (label, value, note) => h('div', { class: 'perf-row' },
    h('span', null, label),
    h('div', { class: 'progress', role: 'progressbar', 'aria-valuenow': value, 'aria-valuemin': 0, 'aria-valuemax': 100 }, h('span', { style: { width: `${value}%` } })),
    h('span', { class: 'perf-note' }, note));
  const coffee = 60 + Math.round(Math.random() * 35);
  return h('div', { class: 'sys-perf' },
    h('fieldset', { class: 'group' },
      h('legend', null, 'Performance status'),
      h('dl', { class: 'sys-info compact' },
        h('dt', null, 'Memory:'), h('dd', null, '640 KB of RAM'),
        h('dt', null, 'System Resources:'), h('dd', null, '98% free'),
        h('dt', null, 'File System:'), h('dd', null, '32-bit'),
        h('dt', null, 'Virtual Memory:'), h('dd', null, '32-bit'),
        h('dt', null, 'Disk Compression:'), h('dd', null, 'Not installed'),
        h('dt', null, 'PC Cards (PCMCIA):'), h('dd', null, 'No PC Card sockets are installed.'),
      ),
      h('p', { class: 'ok-line' }, 'Your system is configured for optimal performance.'),
    ),
    h('fieldset', { class: 'group' },
      h('legend', null, 'Live telemetry'),
      meter('Coffee level', coffee, `${coffee}%`),
      meter('Focus', 92, 'deep work'),
      meter('Bugs squashed', 100, 'all of them*'),
      meter('Benji walked today', 100, 'twice'),
      h('p', { class: 'fine' }, '*that we know of'),
    ),
  );
}
