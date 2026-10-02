// "Welcome to Matt Radiuk 95" with Did-you-know tips, like the Win95 original.

import { h } from '../os/dom.js';
import { openWindow } from '../os/wm.js';
import { settings } from '../os/settings.js';
import { tips } from '../content.js';
import { launch } from './registry.js';

let tipIndex = Math.floor(Math.random() * tips.length);

export function open({ from } = {}) {
  const tipText = h('p', { class: 'tip-text' }, tips[tipIndex % tips.length]);
  const nextTip = () => {
    tipIndex++;
    tipText.textContent = tips[tipIndex % tips.length];
    tipText.animate?.([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 220 });
  };

  const go = (app) => () => { launch(app); win.close(); };

  const show = h('input', { type: 'checkbox', checked: settings.get('showWelcome', true), onChange: (e) => settings.set('showWelcome', e.target.checked) });

  const closeBtn = h('button', { class: 'btn is-default', type: 'button', onClick: () => win.close() }, 'Close');

  const content = h('div', { class: 'welcome' },
    h('div', { class: 'welcome-head' },
      h('h1', { html: 'Welcome to <b>Matt Radiuk</b><span>95</span>' })),
    h('div', { class: 'welcome-main' },
      h('div', { class: 'welcome-tip' },
        h('div', { class: 'tip-head' },
          h('img', { src: 'img/benji.jpg', alt: 'Benji the Australian Shepherd', width: 44, height: 44 }),
          h('span', null, 'Did you know...')),
        tipText,
        h('p', { class: 'tip-intro' },
          "I'm a software engineer specializing in backend, DevOps and AI. This desktop is my portfolio. Have a look around!"),
      ),
      h('div', { class: 'welcome-buttons' },
        h('button', { class: 'btn', type: 'button', onClick: go('about') }, 'About Me'),
        h('button', { class: 'btn', type: 'button', onClick: go('projects') }, 'Projects'),
        h('button', { class: 'btn', type: 'button', onClick: go('contact') }, 'Contact Me'),
        h('button', { class: 'btn', type: 'button', onClick: () => launch('notepad', { file: 'WHATSNEW.TXT' }) }, "What's New"),
        h('div', { class: 'spacer' }),
        h('button', { class: 'btn', type: 'button', onClick: nextTip }, 'Next Tip'),
        closeBtn,
      ),
    ),
    h('label', { class: 'check welcome-foot' }, show, h('span', null, 'Show this Welcome Screen next time you start Matt Radiuk 95')),
  );

  const win = openWindow({
    appId: 'welcome',
    title: 'Welcome',
    icon: 'info',
    content,
    width: 580,
    height: 'auto',
    resizable: false,
    minimizable: false,
    center: true,
    from,
  });
  win.dialog = true; // Esc closes it
  closeBtn.focus({ preventScroll: true });
  return win;
}
