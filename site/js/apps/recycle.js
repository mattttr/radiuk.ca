// The Recycle Bin: a few things Matt has thrown away.

import { h } from '../os/dom.js';
import { explorer } from './explorer.js';
import { launch } from './registry.js';
import { confirmBox } from '../os/dialog.js';
import { playSfx } from '../os/sound.js';

const TRASH = [
  {
    id: 'old-site', name: 'radiuk.ca (2025).zip', icon: 'documents', type: 'Compressed Folder', size: '13.2 MB',
    detail: 'The previous version of this website.',
    text: 'radiuk.ca (2025)\n================\n\nIt had a custom cursor, a glitch effect and a hamburger menu.\nIt served us well.\n\nPress F to pay respects.\n',
  },
  {
    id: 'jquery', name: 'jquery-1.4.2.min.js', icon: 'notepad', type: 'JavaScript File', size: '71 KB',
    detail: '$(document).ready(nostalgia)',
    text: '/*! jQuery v1.4.2 | (c) 2010 */\n\n// $(document).ready(function () {\n//   $(".everything").fadeIn("slow");\n// });\n\n// Thanks for the memories, old friend.\n',
  },
  {
    id: 'todo', name: 'TODO.txt', icon: 'notepad', type: 'Text Document', size: '1 KB',
    detail: 'A very honest to-do list.',
    text: 'TODO\n====\n\n[x] Ship the new website\n[x] Make it look like Windows 95\n[x] Add Minesweeper (important)\n[ ] Learn Rust\n[ ] Actually learn Rust\n[ ] Stop adding easter eggs\n[ ] Walk Benji  <- Benji added this one\n',
  },
  {
    id: 'tabs', name: 'tabs_vs_spaces.flame', icon: 'notepad', type: 'FLAME File', size: '∞ KB',
    detail: 'An argument with no winner.',
    text: 'TABS VS SPACES\n==============\n\nThe debate was settled in 2019 when everyone agreed\nto let the formatter decide.\n\nThe formatter has not been seen since.\n',
  },
  {
    id: 'node-modules', name: 'node_modules', icon: 'folder', type: 'File Folder', size: '4.2 GB',
    detail: 'Heavier than a black hole.',
    text: 'node_modules\n============\n\nThis folder contains 48,213 packages.\n\nOne of them is "is-even". Another is "is-odd",\nwhich depends on "is-even".\n\nWe don’t talk about it.\n',
  },
  {
    id: 'friday', name: 'deploy_on_friday.sh', icon: 'terminal', type: 'Shell Script', size: '2 KB',
    detail: 'Deleted for everyone’s safety.',
    text: '#!/bin/bash\n# deploy_on_friday.sh\n#\n# Moved to the Recycle Bin on Friday at 4:59 PM\n# by Matt, who has learned things.\n\necho "Have a nice weekend!"\n',
  },
];

let contents = TRASH.slice();

export function open({ from, empty } = {}) {
  const win = explorer({
    appId: 'recycle',
    route: 'recycle',
    title: 'Recycle Bin',
    iconName: 'recycle',
    address: 'Recycle Bin',
    items: contents,
    from,
    width: 900,
    height: 480,
    view: 'details',
    intro: h('div', null,
      h('p', null, 'Things that didn’t make the cut.'),
      h('p', null, h('button', { class: 'btn', type: 'button', onClick: () => emptyBin(win) }, 'Empty Recycle Bin'))),
    emptyText: 'The Recycle Bin is empty. Refresh the page to un-delete everything.',
    describe: (item, openIt) => h('div', { class: 'ex-details' },
      h('h3', null, item.name),
      h('p', { class: 'ex-file' }, `${item.type} · ${item.size}`),
      h('p', null, item.detail),
      h('div', { class: 'btn-row start' },
        h('button', { class: 'btn is-default', type: 'button', onClick: openIt }, 'Open'),
        h('button', { class: 'btn', type: 'button', onClick: () => emptyBin(win) }, 'Empty Bin'))),
    onOpen: (item) => launch('notepad', { file: item.name, text: item.text, key: `notepad:${item.id}` }),
    extraFileItems: [() => ({ label: 'Empty Recycle &Bin', disabled: !contents.length, action: () => emptyBin(win) })],
  });
  if (empty) emptyBin(win);
  win.onRelaunch = (args) => { if (args.empty) emptyBin(win); };
  return win;
}

async function emptyBin(win) {
  if (!contents.length) return;
  const ok = await confirmBox(`Are you sure you want to delete these ${contents.length} items?`, { title: 'Confirm Multiple File Delete', icon: 'warning' });
  if (!ok) return;
  playSfx('boom');
  contents = [];
  win.explorer?.setItems(contents);
}
