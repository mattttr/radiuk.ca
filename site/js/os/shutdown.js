// "Shut Down Matt Radiuk 95" dialog, the shutdown screen and restarts.

import { h, sleep } from './dom.js';
import { icon } from './icons.js';
import { openWindow, closeAll, getWindows } from './wm.js';
import { playSfx } from './sound.js';
import { bus } from './bus.js';

export function shutdownDialog() {
  const dim = h('div', { class: 'dim' });
  document.body.append(dim);

  const options = [
    ['shutdown', 'Shut down the computer?'],
    ['restart', 'Restart the computer?'],
    ['dos', 'Restart the computer in MS-DOS mode?'],
  ];
  let choice = 'shutdown';
  const radios = options.map(([value, label], i) => h('label', { class: 'radio' },
    h('input', { type: 'radio', name: 'shutdown', value, checked: i === 0, onChange: () => { choice = value; } }),
    h('span', null, label)));

  let confirmed = false;
  const yes = h('button', { class: 'btn is-default', type: 'button', onClick: () => { confirmed = true; win.close(); } }, 'Yes');
  const no = h('button', { class: 'btn', type: 'button', onClick: () => win.close() }, 'No');
  const help = h('button', { class: 'btn', type: 'button', onClick: () => import('../apps/registry.js').then((m) => m.launch('help')) }, 'Help');

  const content = h('div', { class: 'shutdown-dialog' },
    h('div', { class: 'msgbox-row' },
      h('span', { class: 'msgbox-icon', html: icon('computer-off', 48) }),
      h('div', null,
        h('p', { style: { marginBottom: '10px' } }, 'Are you sure you want to:'),
        h('div', { class: 'radio-list' }, radios),
      ),
    ),
    h('div', { class: 'msgbox-buttons' }, yes, no, help),
  );

  const win = openWindow({
    title: 'Shut Down Matt Radiuk 95',
    icon: 'computer-off',
    content,
    width: 440,
    height: 'auto',
    resizable: false,
    dialog: true,
    className: 'above-dim',
    onClose: () => {
      dim.remove();
      if (confirmed) run(choice);
    },
  });
  // Lift the dialog out of the desktop's stacking context so it sits above the dither.
  win.el.style.position = 'fixed';
  win.pinnedZ = 3000;
  win.el.style.zIndex = 3000;
  document.body.append(win.el);
  yes.focus();
}

async function run(choice) {
  closeAll();
  if (choice === 'dos') {
    await sleep(250);
    const { launch } = await import('../apps/registry.js');
    launch('terminal', { fullscreen: true, key: 'terminal:dos' });
    return;
  }

  playSfx('shutdown');
  const wait = h('div', { class: 'shutdown-wait' }, choice === 'restart' ? 'Matt Radiuk 95 is restarting...' : 'Please wait while your computer shuts down...');
  document.body.append(wait);
  await sleep(1800);
  wait.remove();

  if (choice === 'restart') {
    bus.emit('system:reboot');
    return;
  }

  const screen = h('div', { class: 'shutdown-screen', role: 'button', tabIndex: 0 },
    h('div', null, 'It’s now safe to turn off', h('br'), 'your computer.', h('small', null, '(click anywhere to turn it back on)')));
  document.body.append(screen);
  screen.focus();
  const powerOn = () => {
    screen.remove();
    window.removeEventListener('keydown', powerOn);
    bus.emit('system:reboot');
  };
  screen.addEventListener('click', powerOn);
  window.addEventListener('keydown', powerOn);
  void getWindows;
}
