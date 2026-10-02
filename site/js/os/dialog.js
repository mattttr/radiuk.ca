// Classic message boxes. Resolves with the label of the clicked button (or null).

import { h } from './dom.js';
import { icon as iconSvg } from './icons.js';
import { openWindow } from './wm.js';
import { playSfx } from './sound.js';

export function msgbox({
  title = 'Matt Radiuk 95',
  message,
  icon = 'info',
  buttons = ['OK'],
  defaultButton = 0,
  sound,
  width = 400,
} = {}) {
  return new Promise((resolve) => {
    let result = null;
    const text = typeof message === 'string'
      ? message.split('\n\n').map((p) => h('p', null, p))
      : message;

    const btns = buttons.map((label, i) => h('button', {
      class: `btn ${i === defaultButton ? 'is-default' : ''}`,
      type: 'button',
      onClick: () => { result = label; win.close(); },
    }, label));

    const content = h('div', { class: 'msgbox' },
      h('div', { class: 'msgbox-row' },
        icon ? h('span', { class: 'msgbox-icon', html: iconSvg(icon, 32) }) : null,
        h('div', { class: 'msgbox-text' }, text),
      ),
      h('div', { class: 'msgbox-buttons' }, btns),
    );

    const win = openWindow({
      title,
      icon: icon || 'info',
      content,
      width,
      height: 'auto',
      resizable: false,
      dialog: true,
      onClose: () => resolve(result),
    });
    playSfx(sound || (icon === 'error' ? 'error' : 'ding'));
    btns[defaultButton]?.focus();
  });
}

export const alertBox = (message, opts = {}) => msgbox({ message, ...opts });
export const confirmBox = (message, opts = {}) =>
  msgbox({ message, icon: 'question', buttons: ['Yes', 'No'], ...opts }).then((r) => r === 'Yes');
