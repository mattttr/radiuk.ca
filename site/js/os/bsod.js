// The Blue Screen of Death, lovingly recreated. Triggered by a few destructive
// commands in the MS-DOS Prompt. Any key returns to the desktop.

import { h } from './dom.js';
import { playSfx } from './sound.js';

export function bsod(reason = 'BENJI(01) + 00000B0B') {
  playSfx('error');
  const el = h('div', { class: 'bsod', role: 'alertdialog', 'aria-label': 'Fatal exception', tabIndex: 0 },
    h('div', { class: 'bsod-inner' },
      h('div', { class: 'bsod-head' }, 'Matt Radiuk 95'),
      h('p', null, `A fatal exception 0E has occurred at 0028:C0FFEE42 in VXD ${reason}. The current application will be terminated.`),
      h('p', null, '*  Press any key to terminate the current application.', h('br'),
        '*  Press CTRL+ALT+DEL again to restart your computer. You will', h('br'),
        '   lose any unsaved information in all applications.'),
      h('p', { class: 'cta' }, 'Press any key to continue ', h('span', { class: 'cursor' }, '_')),
    ));
  document.body.append(el);
  el.focus();

  return new Promise((resolve) => {
    const done = (e) => {
      e?.preventDefault?.();
      window.removeEventListener('keydown', done, true);
      el.remove();
      resolve();
    };
    // small delay so the key that triggered it doesn't immediately dismiss it
    setTimeout(() => {
      window.addEventListener('keydown', done, true);
      el.addEventListener('pointerdown', done);
    }, 400);
  });
}
