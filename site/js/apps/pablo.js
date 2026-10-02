// Pablo.exe: "The Life of Pablo"-style cover generator.
// A from-scratch rebuild of the generator hosted on the old radiuk.ca/pablo
// (original idea & layout by Ivan Malagón, a.k.a. Hacheka).

import { h } from '../os/dom.js';
import { icon } from '../os/icons.js';
import { openWindow } from '../os/wm.js';
import { msgbox } from '../os/dialog.js';
import { playSfx } from '../os/sound.js';

const SIZE = 1024;
const ORANGE = '#f98a5f';
const FONT = '"Helvetica Neue", Helvetica, Arial, sans-serif';

const DEFAULTS = {
  line1: 'The life of Benji',
  line2: 'Which/One',
  image1: 'img/gallery/benji-sunset.jpg',
  image2: 'img/benji.jpg',
};

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/** Draw an image center-cropped to fill the destination rect. */
function drawCover(ctx, img, dx, dy, dw, dh) {
  const target = dw / dh;
  const ratio = img.naturalWidth / img.naturalHeight;
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;
  if (ratio > target) sw = sh * target;
  else sh = sw / target;
  const sx = (img.naturalWidth - sw) / 2;
  const sy = (img.naturalHeight - sh) / 2;
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
}

function render(ctx, state) {
  const W = SIZE;
  const H = SIZE;
  ctx.fillStyle = ORANGE;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#000';
  ctx.textBaseline = 'alphabetic';

  // Line 1: repeated title block, split into two columns after ~3 words
  ctx.font = `bold ${Math.floor(H * 0.063)}px ${FONT}`;
  const words = state.line1.trim().split(/\s+/).filter(Boolean);
  const split = words.length >= 4 ? 3 : words.length > 1 ? words.length - 1 : 0;
  const first = split ? words.slice(0, split).join(' ') : words.join(' ');
  const second = split ? words.slice(split).join(' ') : '';
  const x1 = W * 0.149;
  const y1 = H * 0.096;
  for (let i = 0; i < 6; i++) {
    const gap = i === 0 ? '        ' : '     ';
    ctx.fillText((second ? first + gap + second : first).toUpperCase(), x1, y1 + i * H * 0.072);
  }
  ctx.fillText((second ? `${first}      ${second}` : first).toUpperCase(), x1, y1 + H * 0.53);

  // Line 2: two columns of small repeated text
  ctx.font = `bold ${Math.floor(H * 0.03)}px ${FONT}`;
  const x2 = W * 0.117;
  const y2 = H * 0.66;
  for (let i = 0; i < 10; i++) {
    ctx.fillText(state.line2.toUpperCase(), x2, y2 + i * H * 0.033);
    ctx.fillText(state.line2.toUpperCase(), x2 + W * 0.535, y2 + i * H * 0.033);
  }

  // Picture 1 (3:2) and picture 2 (square)
  if (state.img1) {
    const w = Math.floor(W * 0.397);
    drawCover(ctx, state.img1, Math.floor(W * 0.208), Math.floor(H * 0.302), w, Math.round((w * 2) / 3));
  }
  if (state.img2) {
    const w = Math.floor(W * 0.27);
    drawCover(ctx, state.img2, Math.floor(W * 0.443), Math.floor(H * 0.697), w, w);
  }
}

export function open({ from } = {}) {
  const state = { line1: DEFAULTS.line1, line2: DEFAULTS.line2, img1: null, img2: null };
  const canvas = h('canvas', { class: 'pablo-canvas', width: SIZE, height: SIZE, role: 'img', 'aria-label': 'Album cover preview' });
  const ctx = canvas.getContext('2d');
  const redraw = () => render(ctx, state);

  const line1 = h('input', { class: 'field', value: state.line1, maxLength: 60, 'aria-label': 'Line 1' });
  const line2 = h('input', { class: 'field', value: state.line2, maxLength: 30, 'aria-label': 'Line 2' });
  line1.addEventListener('input', () => { state.line1 = line1.value; redraw(); });
  line2.addEventListener('input', () => { state.line2 = line2.value; redraw(); });

  const picker = (label, key) => {
    const name = h('span', { class: 'pablo-file' }, key === 'img1' ? 'benji-sunset.jpg' : 'benji.jpg');
    const input = h('input', { type: 'file', accept: 'image/*', class: 'sr-only' });
    input.addEventListener('change', async () => {
      const f = input.files?.[0];
      if (!f) return;
      const url = URL.createObjectURL(f);
      try {
        state[key] = await loadImage(url);
        name.textContent = f.name;
        redraw();
      } catch {
        msgbox({ title: 'Pablo', icon: 'error', message: 'That file doesn’t look like a picture I can read.' });
      }
    });
    const browse = h('button', { class: 'btn small', type: 'button', onClick: () => input.click() }, 'Browse...');
    return h('div', { class: 'pablo-pick' }, h('span', { class: 'label' }, label), h('div', { class: 'pablo-pick-row' }, browse, name), input);
  };

  const save = () => {
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = h('a', { href: URL.createObjectURL(blob), download: `${(state.line1 || 'cover').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png` });
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      playSfx('tada');
    }, 'image/png');
  };

  const reset = async () => {
    line1.value = state.line1 = DEFAULTS.line1;
    line2.value = state.line2 = DEFAULTS.line2;
    [state.img1, state.img2] = await Promise.all([loadImage(DEFAULTS.image1), loadImage(DEFAULTS.image2)]);
    redraw();
  };

  const form = h('div', { class: 'pablo-form' },
    h('fieldset', { class: 'group' }, h('legend', null, 'Text'),
      h('label', { class: 'label' }, 'Line 1'), line1,
      h('label', { class: 'label', style: { marginTop: '8px' } }, 'Line 2'), line2),
    h('fieldset', { class: 'group' }, h('legend', null, 'Pictures'),
      picker('Picture 1 (landscape)', 'img1'),
      picker('Picture 2 (square)', 'img2')),
    h('div', { class: 'pablo-actions' },
      h('button', { class: 'btn is-default', type: 'button', html: `${icon('floppy', 16)} Save Cover`, onClick: save }),
      h('button', { class: 'btn', type: 'button', onClick: reset }, 'Reset')),
    h('p', { class: 'fine' }, 'Inspired by the original TLOP cover generator by Ivan Malagón (Hacheka). Your photos never leave your browser.'),
  );

  const content = h('div', { class: 'pablo' }, form, h('div', { class: 'pablo-preview' }, canvas));

  const win = openWindow({
    appId: 'pablo',
    route: 'pablo',
    title: 'Pablo.exe - Cover Generator',
    icon: 'pablo',
    width: 860,
    height: 600,
    minWidth: 320,
    minHeight: 380,
    content,
    bodyClass: 'pad',
    from,
    menu: [
      { label: '&File', items: () => [
        { label: '&Save Cover', icon: 'floppy', shortcut: 'Ctrl+S', action: save },
        { label: '&Reset', action: reset },
        '-',
        { label: 'E&xit', action: () => win.close() },
      ] },
      { label: '&Help', items: () => [
        { label: '&About Pablo', action: () => msgbox({ title: 'About Pablo', icon: 'pablo', message: 'Make your own "The Life of Pablo" style album cover.\n\nPick two photos and two lines of text, then hit Save Cover.' }) },
      ] },
    ],
  });
  content.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save(); }
  });

  redraw();
  reset().catch(() => redraw());
  return win;
}
