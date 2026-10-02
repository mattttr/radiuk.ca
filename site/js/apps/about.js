// About_Me.doc: a WordPad document with a working(ish) formatting toolbar.

import { h } from '../os/dom.js';
import { icon } from '../os/icons.js';
import { openWindow } from '../os/wm.js';
import { msgbox } from '../os/dialog.js';
import { profile, bio, services, skills, email } from '../content.js';
import { launch, openLink } from './registry.js';

const FONTS = [
  ['IBM Plex Sans', 'var(--font-body)'],
  ['Times New Roman', '"Times New Roman", Times, serif'],
  ['Courier New', '"Courier New", Courier, monospace'],
  ['Comic Sans MS', '"Comic Sans MS", "Comic Neue", cursive'],
  ['Pixelify Sans', 'var(--font-ui)'],
];

export function open({ from } = {}) {
  const page = h('article', { class: 'wp-page' });

  // ---- toolbar (font picker + B/I/U actually restyle the page, for fun)
  const fontSel = h('select', { class: 'select wp-font', 'aria-label': 'Font' },
    FONTS.map(([name]) => h('option', { value: name }, name)));
  fontSel.addEventListener('change', () => {
    page.style.fontFamily = FONTS.find(([n]) => n === fontSel.value)[1];
  });
  const sizeSel = h('select', { class: 'select wp-size', 'aria-label': 'Font size' },
    ['14', '16', '18', '20'].map((s) => h('option', { value: s, selected: s === '16' }, s)));
  sizeSel.addEventListener('change', () => { page.style.fontSize = `${sizeSel.value}px`; });

  const toggle = (cls, label, text) => {
    const b = h('button', { class: 'tool-btn wp-fmt', type: 'button', title: label, 'aria-label': label, 'aria-pressed': 'false' }, text);
    b.addEventListener('click', () => {
      const on = page.classList.toggle(cls);
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    return b;
  };

  const toolbar = h('div', { class: 'toolbar wp-toolbar' },
    fontSel, sizeSel,
    h('span', { class: 'sep' }),
    toggle('is-bold', 'Bold', h('b', null, 'B')),
    toggle('is-italic', 'Italic', h('i', null, 'I')),
    toggle('is-underline', 'Underline', h('u', null, 'U')),
    h('span', { class: 'sep' }),
    h('button', { class: 'tool-btn', type: 'button', title: 'Email Matt', html: `${icon('mail', 16)}<span>Contact</span>`, onClick: () => launch('contact') }),
    h('button', { class: 'tool-btn', type: 'button', title: 'Projects', html: `${icon('projects', 16)}<span>Projects</span>`, onClick: () => launch('projects') }),
  );

  // ---- the document
  const chips = skills.slice(0, 2).flatMap((g) => g.items).map((s) => s.link
    ? h('a', { class: 'chip', href: s.link, target: '_blank', rel: 'noopener', title: 'View Azure credential' }, `${s.short || s.name} ✓`)
    : h('span', { class: 'chip' }, s.short || s.name));

  page.append(
    h('header', { class: 'wp-hero' },
      h('div', { class: 'wp-photo' }, h('img', { src: 'img/matt.jpg', alt: 'Matt crouching next to Benji, his Australian Shepherd, on a forest trail', width: 200, height: 200 })),
      h('div', null,
        h('p', { class: 'wp-kicker' }, 'Hello, World!'),
        h('h1', null, "Hi, I'm Matt."),
        h('p', { class: 'wp-lede' }, `Software engineer with ${profile.experience} of building scalable SaaS products. Backend, DevOps & AI.`),
        h('div', { class: 'wp-actions' },
          h('button', { class: 'btn is-default', type: 'button', html: `${icon('mail', 16)} Get in touch`, onClick: () => launch('contact') }),
          h('button', { class: 'btn', type: 'button', html: `${icon('github', 16)} GitHub`, onClick: () => openLink(profile.github) }),
          h('button', { class: 'btn', type: 'button', html: `${icon('linkedin', 16)} LinkedIn`, onClick: () => openLink(profile.linkedin) }),
        ),
      ),
    ),
    ...bio.map((p) => h('p', null, p)),
    h('h2', null, 'What I do'),
    h('div', { class: 'wp-services' }, services.map((s) => h('section', { class: 'wp-service' },
      h('span', { html: icon(s.icon, 32) }),
      h('h3', null, s.title),
      h('p', null, s.text)))),
    h('h2', null, 'Tools of the trade'),
    h('div', { class: 'chips' }, chips),
    h('p', { class: 'wp-note' },
      'Want the full spec sheet? Open ',
      h('a', { href: '#computer', onClick: (e) => { e.preventDefault(); launch('computer'); } }, 'My Computer'),
      ' and check the Device Manager. Want to see me have fun with code? The ',
      h('a', { href: '#projects', onClick: (e) => { e.preventDefault(); launch('projects'); } }, 'Projects'),
      ' folder is full of interactive generative art.'),
    h('p', { class: 'wp-sign' }, '— Matt (and Benji)'),
  );

  const ruler = h('div', { class: 'wp-ruler', 'aria-hidden': 'true' });
  const content = h('div', { class: 'wp' }, ruler, h('div', { class: 'wp-scroll scroll' }, page));

  const win = openWindow({
    appId: 'about',
    route: 'about',
    title: 'About_Me.doc - WordPad',
    icon: 'doc',
    width: 760,
    height: 620,
    minWidth: 320,
    content,
    toolbar,
    from,
    menu: [
      { label: '&File', items: () => [
        { label: '&Print...', shortcut: 'Ctrl+P', action: () => window.print() },
        { label: 'Send &To...', icon: 'mail', action: () => launch('contact') },
        '-',
        { label: 'E&xit', action: () => win.close() },
      ] },
      { label: '&Edit', items: () => [
        { label: 'Copy &Email Address', action: () => copy(email) },
        { label: 'Copy &LinkedIn URL', action: () => copy(profile.linkedin) },
      ] },
      { label: '&View', items: () => FONTS.map(([name, css]) => ({
        label: name, radio: true, checked: fontSel.value === name,
        action: () => { fontSel.value = name; page.style.fontFamily = css; },
      })) },
      { label: '&Help', items: () => [
        { label: '&About WordPad', action: () => msgbox({ title: 'About WordPad', icon: 'doc', message: 'WordPad for Matt Radiuk 95\n\nThis document is licensed to: you, the reader. Thanks for reading!' }) },
      ] },
    ],
    statusbar: ['For Help, press F1', { text: 'NUM', fixed: true }],
  });
  return win;
}

function copy(text) {
  navigator.clipboard?.writeText(text).then(
    () => msgbox({ title: 'Clipboard', icon: 'info', message: `Copied to clipboard:\n\n${text}` }),
    () => msgbox({ title: 'Clipboard', icon: 'warning', message: text }),
  );
}
