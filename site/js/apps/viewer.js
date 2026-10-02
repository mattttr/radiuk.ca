// Image Viewer: one window, navigates through My Pictures.

import { h } from '../os/dom.js';
import { icon } from '../os/icons.js';
import { openWindow } from '../os/wm.js';
import { photos } from '../content.js';

export function open({ id, from } = {}) {
  let index = Math.max(0, photos.findIndex((p) => p.file === id));
  let fit = true;
  let slideshow = 0;

  const img = h('img', { class: 'iv-img', alt: '', draggable: false });
  const spinner = h('div', { class: 'iv-loading' }, 'Loading...');
  const stage = h('div', { class: 'iv-stage scroll', tabIndex: 0 }, img, spinner);
  const caption = h('div', { class: 'iv-caption' });

  const btn = (label, ic, onClick, title) => h('button', { class: 'tool-btn', type: 'button', title: title || label, html: `${ic ? icon(ic, 16) : ''}<span>${label}</span>`, onClick });
  const playBtn = btn('Slideshow', null, () => toggleSlideshow(), 'Slideshow (S)');
  const fitBtn = btn('Actual size', null, () => setFit(!fit), 'Toggle zoom (Z)');
  const toolbar = h('div', { class: 'toolbar' },
    btn('◀ Prev', null, () => go(-1), 'Previous (←)'),
    btn('Next ▶', null, () => go(1), 'Next (→)'),
    h('span', { class: 'sep' }),
    fitBtn,
    playBtn,
    h('span', { class: 'sep' }),
    btn('Open original', 'image', () => window.open(`img/gallery/${photos[index].file}.jpg`, '_blank', 'noopener')),
  );

  const win = openWindow({
    appId: 'viewer',
    route: `pictures/${photos[index].file}`,
    title: 'Image Viewer',
    icon: 'image',
    width: 880,
    height: 640,
    minWidth: 320,
    minHeight: 260,
    content: h('div', { class: 'iv' }, stage, caption),
    toolbar,
    from,
    statusbar: ['', { text: '', fixed: true, width: '90px' }],
    onClose: () => clearInterval(slideshow),
  });

  function show() {
    const p = photos[index];
    stage.classList.add('is-loading');
    img.onload = () => stage.classList.remove('is-loading');
    img.src = `img/gallery/${p.file}.jpg`;
    img.alt = p.caption;
    caption.textContent = p.caption;
    win.setTitle(`${p.file}.jpg - Image Viewer`);
    win.setStatus(0, p.title);
    win.setStatus(1, `${index + 1} / ${photos.length}`);
    win.route = `pictures/${p.file}`;
    if (win.el.classList.contains('is-active')) history.replaceState(null, '', `#${win.route}`);
    // preload neighbour
    new Image().src = `img/gallery/${photos[(index + 1) % photos.length].file}.jpg`;
  }

  function go(d) {
    index = (index + d + photos.length) % photos.length;
    show();
  }

  function setFit(v) {
    fit = v;
    stage.classList.toggle('is-actual', !fit);
    fitBtn.querySelector('span').textContent = fit ? 'Actual size' : 'Fit to window';
  }

  function toggleSlideshow() {
    if (slideshow) {
      clearInterval(slideshow);
      slideshow = 0;
    } else {
      slideshow = setInterval(() => go(1), 3500);
    }
    playBtn.classList.toggle('is-on', !!slideshow);
  }

  stage.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') go(1);
    else if (e.key === 'ArrowLeft') go(-1);
    else if (e.key.toLowerCase() === 'z') setFit(!fit);
    else if (e.key.toLowerCase() === 's') toggleSlideshow();
    else return;
    e.preventDefault();
  });
  stage.addEventListener('dblclick', () => setFit(!fit));

  // swipe on touch
  let sx = null;
  stage.addEventListener('pointerdown', (e) => { if (e.pointerType !== 'mouse') sx = e.clientX; });
  stage.addEventListener('pointerup', (e) => {
    if (sx == null) return;
    const dx = e.clientX - sx;
    sx = null;
    if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
  });

  win.onRelaunch = ({ id: nextId }) => {
    const i = photos.findIndex((p) => p.file === nextId);
    if (i >= 0) { index = i; show(); }
  };

  show();
  stage.focus({ preventScroll: true });
  return win;
}
