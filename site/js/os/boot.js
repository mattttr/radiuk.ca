// BIOS POST screen + splash screen. Any key or click skips straight to the desktop.

import { h, $, sleep, reducedMotion } from './dom.js';
import { icon } from './icons.js';
import { unlockAudio } from './sound.js';

const BIOS_LINES = [
  ['<span class="hl">RadiukBIOS (C) 1995-2026 Radiuk Megatrends, Inc.</span>', 0],
  ['MR-95 Mainboard BIOS v6.0  Rev. 1337', 60],
  ['', 60],
  ['Main Processor  : Matt Radiuk @ 5+ yrs experience', 120],
  ['Coprocessor     : Caffeine x87 ......... <span class="ok">Installed</span>', 90],
  ['Memory Testing  : <span id="bios-mem">0</span>K<span id="bios-mem-ok"></span>', 90],
  ['', 520],
  ['Detecting Primary Master   ... <span class="hl">JAVA</span>', 140],
  ['Detecting Primary Slave    ... <span class="hl">PYTHON</span>', 110],
  ['Detecting Secondary Master ... <span class="hl">NODE.JS</span>', 110],
  ['Detecting Secondary Slave  ... <span class="hl">AWS / AZURE</span>', 110],
  ['', 80],
  ['Loading DOG.SYS ............ <span class="ok">Benji (good boy) OK</span>', 160],
  ['Mounting C:\\PROJECTS ....... <span class="ok">18 sketches OK</span>', 120],
  ['Plug and Play BIOS Extension v1.0A', 120],
  ['', 80],
  ['<span class="warn">Starting Matt Radiuk 95...</span>', 260],
];

let skip = null;

function waitOrSkip(ms) {
  return new Promise((resolve) => {
    const t = setTimeout(resolve, ms);
    skip = () => { clearTimeout(t); resolve(); };
  });
}

/** Runs the boot sequence. Resolves when the desktop should appear. */
export async function boot({ full = true } = {}) {
  const root = $('#boot');
  root.innerHTML = '';
  root.classList.add('is-on');
  root.style.opacity = '1';
  let skipped = false;

  const onSkip = () => {
    unlockAudio();
    skipped = true;
    skip?.();
  };
  window.addEventListener('keydown', onSkip);
  root.addEventListener('pointerdown', onSkip);

  const fast = reducedMotion();

  if (full && !fast) {
    const bios = h('div', { class: 'bios' });
    const logo = h('div', { class: 'bios-logo', html: `${icon('paw', 40)}<span>PAW STAR<br>Good Boy Certified</span>` });
    const footer = h('div', { class: 'bios-footer' }, 'Press any key to skip...');
    root.append(bios, logo, footer);

    for (const [line, delay] of BIOS_LINES) {
      if (skipped) break;
      await waitOrSkip(delay);
      if (skipped) break;
      bios.insertAdjacentHTML('beforeend', `${line}\n`);
      const mem = bios.querySelector('#bios-mem');
      if (mem && !mem.dataset.done) {
        mem.dataset.done = '1';
        countMemory(mem);
      }
    }
    if (!skipped) await waitOrSkip(250);
  }

  if (!skipped) {
    root.innerHTML = '';
    const splash = h('div', { class: 'splash' },
      h('div', { class: 'splash-logo' },
        h('span', { html: icon('paw', 128) }),
        h('div', null,
          h('div', { class: 'splash-sub' }, 'Radiuk®'),
          h('div', { class: 'splash-title', html: 'Matt Radiuk<sup>95</sup>' }),
          h('div', { class: 'splash-tag' }, 'Software Engineer Edition'),
        ),
      ),
      h('div', { class: 'splash-bar' }),
      h('div', { class: 'boot-skip' }, 'click to skip'),
    );
    root.append(splash);
    await waitOrSkip(fast ? 400 : 2100);
  }

  window.removeEventListener('keydown', onSkip);
  root.removeEventListener('pointerdown', onSkip);
  skip = null;

  // fade out
  if (!fast && root.animate) {
    await root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, easing: 'ease-out', fill: 'forwards' }).finished.catch(() => {});
  }
  root.classList.remove('is-on');
  root.innerHTML = '';
  root.getAnimations?.().forEach((a) => a.cancel());
}

async function countMemory(el) {
  const target = 65536;
  const steps = 22;
  for (let i = 1; i <= steps; i++) {
    el.textContent = String(Math.round((target * i) / steps));
    await sleep(20);
  }
  const ok = el.parentElement?.querySelector('#bios-mem-ok');
  if (ok) ok.innerHTML = ' <span class="ok">OK</span>';
}
