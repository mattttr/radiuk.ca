// Minesweeper. First click is always safe. Click a number to chord.
// Right-click (or long-press on touch) to flag.

import { h } from '../os/dom.js';
import { icon } from '../os/icons.js';
import { openWindow } from '../os/wm.js';
import { msgbox } from '../os/dialog.js';
import { settings } from '../os/settings.js';
import { playSfx } from '../os/sound.js';

const LEVELS = {
  beginner: { w: 9, h: 9, mines: 10, label: 'Beginner' },
  intermediate: { w: 16, h: 16, mines: 40, label: 'Intermediate' },
  expert: { w: 30, h: 16, mines: 99, label: 'Expert' },
};

// ---- 7-segment LED digits
const SEG = { a: [2, 0, 9, 2], b: [11, 2, 2, 8], c: [11, 12, 2, 8], d: [2, 20, 9, 2], e: [0, 12, 2, 8], f: [0, 2, 2, 8], g: [2, 10, 9, 2] };
const DIGITS = { 0: 'abcdef', 1: 'bc', 2: 'abged', 3: 'abgcd', 4: 'fgbc', 5: 'afgcd', 6: 'afgedc', 7: 'abc', 8: 'abcdefg', 9: 'abfgcd', '-': 'g' };
function led(value) {
  const s = value < 0 ? `-${String(Math.min(99, -value)).padStart(2, '0')}` : String(Math.min(999, value)).padStart(3, '0');
  let out = '';
  [...s].forEach((ch, i) => {
    const on = DIGITS[ch] || '';
    for (const [k, [x, y, w, hh]] of Object.entries(SEG)) {
      out += `<rect x="${x + i * 15}" y="${y}" width="${w}" height="${hh}" fill="${on.includes(k) ? '#ff2a1a' : '#2c0604'}"/>`;
    }
  });
  return `<svg viewBox="0 0 43 22" width="52" height="27" shape-rendering="crispEdges" aria-hidden="true">${out}</svg>`;
}

// ---- smiley
function face(kind) {
  const eyes = kind === 'dead'
    ? '<path d="M6 6l3 3M9 6l-3 3M13 6l3 3M16 6l-3 3" stroke="#000" stroke-width="1.4"/>'
    : kind === 'cool'
      ? '<path d="M4 7h16v1l-2 3h-3l-2-3h-2l-2 3H6L4 8z" fill="#000"/>'
      : '<rect x="7" y="7" width="2" height="2"/><rect x="13" y="7" width="2" height="2"/>';
  const mouth = kind === 'dead'
    ? '<path d="M7 17q4-4 8 0" fill="none" stroke="#000" stroke-width="1.4"/>'
    : kind === 'oh'
      ? '<circle cx="11" cy="15" r="2.2" fill="none" stroke="#000" stroke-width="1.4"/>'
      : '<path d="M6.5 13.5q4.5 5 9 0" fill="none" stroke="#000" stroke-width="1.4"/>';
  return `<svg viewBox="0 0 22 22" width="24" height="24" aria-hidden="true"><circle cx="11" cy="11" r="10" fill="#ffe14d" stroke="#000" stroke-width="1.2"/>${eyes}${mouth}</svg>`;
}

export function open({ from } = {}) {
  let levelKey = settings.get('msLevel', 'beginner');
  if (!LEVELS[levelKey]) levelKey = 'beginner';
  let L = LEVELS[levelKey];
  let cells = [];
  let started = false;
  let over = false;
  let flags = 0;
  let revealed = 0;
  let seconds = 0;
  let timer = 0;

  const minesLed = h('div', { class: 'ms-led', role: 'status', 'aria-label': 'Mines left' });
  const timeLed = h('div', { class: 'ms-led', role: 'timer', 'aria-label': 'Seconds' });
  const faceBtn = h('button', { class: 'ms-face', type: 'button', 'aria-label': 'New game', onClick: () => reset() });
  const board = h('div', { class: 'ms-board', role: 'grid', 'aria-label': 'Minefield' });
  const root = h('div', { class: 'ms' },
    h('div', { class: 'ms-top' }, minesLed, faceBtn, timeLed),
    h('div', { class: 'ms-field' }, board));

  const win = openWindow({
    appId: 'minesweeper',
    route: 'minesweeper',
    title: 'Minesweeper',
    icon: 'mine',
    width: 300,
    height: 'auto',
    resizable: false,
    maximizable: false,
    content: root,
    from,
    menu: [
      { label: '&Game', items: () => [
        { label: '&New', shortcut: 'F2', action: () => reset() },
        '-',
        ...Object.entries(LEVELS).map(([k, v]) => ({ label: v.label, checked: k === levelKey, action: () => setLevel(k) })),
        '-',
        { label: 'Best &Times...', action: bestTimes },
        '-',
        { label: 'E&xit', action: () => win.close() },
      ] },
      { label: '&Help', items: () => [
        { label: '&How to Play', action: howTo },
        { label: '&About Minesweeper...', action: () => msgbox({ title: 'About Minesweeper', icon: 'mine', message: 'Minesweeper for Matt Radiuk 95\n\nNo productivity was harmed in the making of this game. (That’s a lie.)' }) },
      ] },
    ],
    onClose: () => clearInterval(timer),
  });
  root.addEventListener('keydown', (e) => { if (e.key === 'F2') { e.preventDefault(); reset(); } });

  function setLevel(k) {
    levelKey = k;
    L = LEVELS[k];
    settings.set('msLevel', k);
    reset();
  }

  function fitWindow() {
    const avail = Math.min(window.innerWidth - 40, 30 * 26);
    const size = Math.max(18, Math.min(26, Math.floor(avail / L.w)));
    root.style.setProperty('--cell', `${size}px`);
    board.style.gridTemplateColumns = `repeat(${L.w}, var(--cell))`;
    win.el.style.width = 'auto';
    win.el.style.height = 'auto';
    requestAnimationFrame(() => {
      const r = win.el.getBoundingClientRect();
      const area = document.getElementById('windows').getBoundingClientRect();
      if (r.right > area.right) win.el.style.left = `${Math.max(0, area.width - r.width - 8)}px`;
      if (r.bottom > area.bottom) win.el.style.top = `${Math.max(0, area.height - r.height - 8)}px`;
    });
  }

  function reset() {
    clearInterval(timer);
    started = false;
    over = false;
    flags = 0;
    revealed = 0;
    seconds = 0;
    cells = [];
    board.replaceChildren();
    for (let y = 0; y < L.h; y++) {
      for (let x = 0; x < L.w; x++) {
        const el = h('button', { class: 'ms-cell', type: 'button', 'aria-label': `Row ${y + 1}, column ${x + 1}`, tabIndex: -1 });
        const cell = { x, y, mine: false, n: 0, open: false, flag: false, el };
        bindCell(cell);
        cells.push(cell);
        board.append(el);
      }
    }
    cells[0].el.tabIndex = 0;
    updateLeds();
    setFace('smile');
    fitWindow();
  }

  const at = (x, y) => (x < 0 || y < 0 || x >= L.w || y >= L.h ? null : cells[y * L.w + x]);
  const around = (c) => {
    const out = [];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (dx || dy) { const n = at(c.x + dx, c.y + dy); if (n) out.push(n); }
    }
    return out;
  };

  function layMines(safe) {
    const forbidden = new Set([safe, ...around(safe)]);
    const pool = cells.filter((c) => !forbidden.has(c));
    for (let i = 0; i < L.mines; i++) {
      const j = i + Math.floor(Math.random() * (pool.length - i));
      [pool[i], pool[j]] = [pool[j], pool[i]];
      pool[i].mine = true;
    }
    for (const c of cells) c.n = around(c).filter((n) => n.mine).length;
  }

  function startClock() {
    started = true;
    seconds = 1;
    updateLeds();
    timer = setInterval(() => { seconds++; updateLeds(); }, 1000);
  }

  function updateLeds() {
    minesLed.innerHTML = led(L.mines - flags);
    timeLed.innerHTML = led(seconds);
  }
  function setFace(kind) { faceBtn.innerHTML = face(kind); }

  function paint(c) {
    const el = c.el;
    el.className = 'ms-cell';
    el.innerHTML = '';
    if (c.open) {
      el.classList.add('is-open');
      if (c.mine) { el.innerHTML = icon('mine', 16); el.classList.add(c.boom ? 'is-boom' : 'is-mine'); }
      else if (c.n) { el.textContent = c.n; el.classList.add(`n${c.n}`); }
      el.setAttribute('aria-label', c.mine ? 'Mine' : c.n ? `${c.n}` : 'Empty');
    } else if (c.flag) {
      el.innerHTML = icon('flag', 16);
      if (c.wrong) el.classList.add('is-wrong');
      el.setAttribute('aria-label', 'Flagged');
    }
  }

  function reveal(c) {
    if (over || c.open || c.flag) return;
    if (!started) { layMines(c); startClock(); }
    if (c.mine) return lose(c);
    // flood fill
    const stack = [c];
    while (stack.length) {
      const cur = stack.pop();
      if (cur.open || cur.flag) continue;
      cur.open = true;
      revealed++;
      paint(cur);
      if (cur.n === 0) for (const n of around(cur)) if (!n.open && !n.mine) stack.push(n);
    }
    playSfx('reveal');
    if (revealed === L.w * L.h - L.mines) winGame();
  }

  function chord(c) {
    if (!c.open || !c.n) return;
    const near = around(c);
    if (near.filter((n) => n.flag).length !== c.n) return;
    for (const n of near) if (!n.open && !n.flag) reveal(n);
  }

  function toggleFlag(c) {
    if (over || c.open) return;
    c.flag = !c.flag;
    flags += c.flag ? 1 : -1;
    paint(c);
    updateLeds();
    playSfx('flag');
  }

  function lose(boom) {
    over = true;
    clearInterval(timer);
    boom.boom = true;
    for (const c of cells) {
      if (c.mine && !c.flag) c.open = true;
      if (c.flag && !c.mine) c.wrong = true;
      paint(c);
    }
    setFace('dead');
    playSfx('boom');
    win.el.animate?.([{ transform: 'translate(0,0)' }, { transform: 'translate(-6px,3px)' }, { transform: 'translate(5px,-4px)' }, { transform: 'translate(-3px,2px)' }, { transform: 'translate(0,0)' }], { duration: 360 });
  }

  function winGame() {
    over = true;
    clearInterval(timer);
    for (const c of cells) if (c.mine && !c.flag) { c.flag = true; paint(c); }
    flags = L.mines;
    updateLeds();
    setFace('cool');
    playSfx('tada');
    const best = settings.get('msBest', {});
    const prev = best[levelKey];
    const isBest = !prev || seconds < prev;
    if (isBest) { best[levelKey] = seconds; settings.set('msBest', best); }
    setTimeout(() => msgbox({
      title: 'Minesweeper',
      icon: 'info',
      sound: 'none',
      message: isBest
        ? `You cleared ${L.label} in ${seconds} seconds.\n\nThat’s your fastest time yet!`
        : `You cleared ${L.label} in ${seconds} seconds.\n\nYour best is ${prev} seconds.`,
    }), 300);
  }

  function bestTimes() {
    const best = settings.get('msBest', {});
    msgbox({
      title: 'Fastest Mine Sweepers',
      icon: 'mine',
      message: Object.entries(LEVELS).map(([k, v]) => `${v.label}: ${best[k] ? `${best[k]} seconds` : '999 seconds  Anonymous'}`).join('\n'),
    });
  }

  function howTo() {
    msgbox({
      title: 'How to Play',
      icon: 'help',
      width: 440,
      message: 'Uncover every square that doesn’t hide a mine.\n\nNumbers tell you how many mines touch that square. Right-click (or long-press) to plant a flag. Click a number whose mines are all flagged to clear its neighbours.\n\nYour first click is always safe.',
    });
  }

  function bindCell(c) {
    let longPress = 0;
    let longFired = false;
    c.el.addEventListener('pointerdown', (e) => {
      if (over) return;
      if (e.button === 0) {
        setFace('oh');
        if (e.pointerType !== 'mouse') {
          longFired = false;
          longPress = setTimeout(() => { longFired = true; toggleFlag(c); navigator.vibrate?.(20); setFace('smile'); }, 380);
        }
      } else if (e.button === 1) {
        e.preventDefault();
        chord(c);
      }
    });
    c.el.addEventListener('pointerup', (e) => {
      clearTimeout(longPress);
      if (over) return;
      setFace('smile');
      if (e.button !== 0 || longFired) return;
      if (c.open) chord(c);
      else reveal(c);
    });
    c.el.addEventListener('pointerleave', () => { clearTimeout(longPress); if (!over) setFace('smile'); });
    c.el.addEventListener('contextmenu', (e) => { e.preventDefault(); if (!longFired) toggleFlag(c); });
    c.el.addEventListener('keydown', (e) => {
      const moves = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
      if (moves[e.key]) {
        e.preventDefault();
        const n = at(c.x + moves[e.key][0], c.y + moves[e.key][1]);
        if (n) { c.el.tabIndex = -1; n.el.tabIndex = 0; n.el.focus(); }
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        c.open ? chord(c) : reveal(c);
      } else if (e.key.toLowerCase() === 'f') {
        toggleFlag(c);
      }
    });
  }

  reset();
  return win;
}
