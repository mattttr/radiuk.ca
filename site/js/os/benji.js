// Benji lives in the system tray, hands out tips, and throws a party
// if you enter the Konami code.

import { h } from './dom.js';
import { tips } from '../content.js';
import { playSfx, unlockAudio } from './sound.js';

let balloon = null;
let tipIndex = Math.floor(Math.random() * tips.length);
let hideTimer = 0;

export function showBenjiTip(text) {
  balloon?.remove();
  clearTimeout(hideTimer);
  const message = text || tips[tipIndex++ % tips.length];
  balloon = h('div', { class: 'balloon', role: 'status' },
    h('div', { class: 'balloon-title' }, h('img', { src: 'img/benji-48.png', alt: '' }), 'Benji says...'),
    h('div', null, message),
    h('button', { class: 'balloon-close', type: 'button', 'aria-label': 'Close', onClick: hideBenjiTip }, '×'),
  );
  const tray = document.querySelector('.tray .tray-btn:nth-child(2)');
  if (tray) {
    const r = tray.getBoundingClientRect();
    balloon.style.setProperty('--tail', `${Math.max(14, window.innerWidth - r.left - r.width / 2 - 20)}px`);
  }
  document.body.append(balloon);
  hideTimer = setTimeout(hideBenjiTip, 12_000);
}

export function hideBenjiTip() {
  clearTimeout(hideTimer);
  balloon?.remove();
  balloon = null;
}

// ---------------------------------------------------------------- konami

const KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
let progress = 0;

export function initKonami() {
  window.addEventListener('keydown', (e) => {
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    progress = key === KONAMI[progress] ? progress + 1 : key === KONAMI[0] ? 1 : 0;
    if (progress === KONAMI.length) {
      progress = 0;
      benjiParty();
    }
  });
}

export function benjiParty(count = 18, seconds = 9) {
  unlockAudio();
  playSfx('tada');
  const dogs = [];
  const W = window.innerWidth;
  const H = window.innerHeight;
  for (let i = 0; i < count; i++) {
    const el = h('img', { class: 'party-dog', src: i % 3 ? 'img/benji-48.png' : 'img/benji.jpg', alt: '' });
    document.body.append(el);
    dogs.push({
      el,
      x: Math.random() * (W - 72),
      y: Math.random() * (H - 72),
      vx: (Math.random() * 2 - 1) * 6,
      vy: (Math.random() * 2 - 1) * 6,
      r: Math.random() * 360,
      vr: (Math.random() * 2 - 1) * 8,
    });
  }
  let barks = 0;
  const start = performance.now();
  const frame = (now) => {
    for (const d of dogs) {
      d.vy += 0.25;
      d.x += d.vx;
      d.y += d.vy;
      d.r += d.vr;
      if (d.x < 0 || d.x > W - 72) { d.vx *= -1; d.x = Math.max(0, Math.min(W - 72, d.x)); }
      if (d.y > H - 72) {
        d.y = H - 72;
        d.vy = -(12 + Math.random() * 8);
        if (barks < 6 && Math.random() < 0.08) { barks++; playSfx('woof'); }
      }
      d.el.style.transform = `translate(${d.x}px, ${d.y}px) rotate(${d.r}deg)`;
    }
    if (now - start < seconds * 1000) requestAnimationFrame(frame);
    else dogs.forEach((d) => d.el.remove());
  };
  requestAnimationFrame(frame);
  showBenjiTip('Cheat code accepted! Infinite treats unlocked. 🐾');
}
