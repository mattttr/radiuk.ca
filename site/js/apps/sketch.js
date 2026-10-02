// Runs one p5.js sketch inside a window.

import { h } from '../os/dom.js';
import { openWindow } from '../os/wm.js';
import { msgbox } from '../os/dialog.js';
import { mountSketch } from '../os/p5host.js';
import { getSketch } from '../sketches/index.js';
import { profile } from '../content.js';
import { openLink } from './registry.js';

export async function open({ id, from } = {}) {
  const meta = getSketch(id);
  if (!meta) {
    msgbox({ title: 'Run', icon: 'error', message: `Cannot find the file '${id}' (or one of its components). Make sure the path and filename are correct.` });
    return null;
  }

  const stage = h('div', { class: 'sketch-stage' }, h('div', { class: 'sketch-loading' }, `Loading ${meta.exe}...`));
  let ctl = null;
  let paused = false;

  const win = openWindow({
    appId: 'sketch',
    route: `projects/${id}`,
    title: `${meta.exe} - ${meta.title}`,
    icon: 'sketch',
    width: 820,
    height: 560,
    minWidth: 280,
    minHeight: 220,
    content: stage,
    bodyClass: 'sketch-body',
    from,
    menu: [
      { label: '&File', items: () => [
        { label: '&Restart', shortcut: 'F5', action: () => ctl?.restart() },
        { label: paused ? '&Resume' : '&Pause', action: togglePause },
        { label: '&Save Screenshot...', icon: 'floppy', action: () => ctl?.save(meta.id) },
        '-',
        { label: 'Open in &New Tab', action: () => openLink(`sketch.html?id=${id}`) },
        { label: '&Close', action: () => win.close() },
      ] },
      { label: '&View', items: () => [
        { label: '&Full Screen', shortcut: 'F11', action: () => stage.requestFullscreen?.() },
      ] },
      { label: '&Help', items: () => [
        { label: `&About ${meta.title}`, action: about },
        { label: '&View Source', action: () => openLink(`${profile.repo}/blob/main/site/js/sketches/${id}.js`) },
      ] },
    ],
    statusbar: [meta.hint, { text: '-- fps', fixed: true, width: '72px' }],
    onMinimize: () => ctl?.pause(),
    onRestore: () => { if (!paused) ctl?.resume(); },
    onClose: () => ctl?.remove(),
  });

  function togglePause() {
    paused = !paused;
    paused ? ctl?.pause() : ctl?.resume();
    win.setStatus(1, paused ? 'paused' : '-- fps');
  }

  function about() {
    msgbox({
      title: `About ${meta.title}`,
      icon: 'sketch',
      width: 440,
      message: h('div', null,
        h('p', null, h('b', null, meta.title), ` (${meta.exe})`),
        h('p', null, meta.blurb),
        h('p', null, h('b', null, 'Controls: '), meta.hint),
        h('p', { class: 'fine' }, meta.origin === 'classic' ? 'Originally from radiuk.ca (2025).' : 'New in Matt Radiuk 95.')),
    });
  }

  stage.addEventListener('keydown', (e) => { if (e.key === 'F5') { e.preventDefault(); ctl?.restart(); } });

  try {
    ctl = await mountSketch(stage, id, {
      isActive: () => win.el.classList.contains('is-active'),
      onFrame: (fps) => { if (!paused) win.setStatus(1, `${fps} fps`); },
    });
    stage.querySelector('.sketch-loading')?.remove();
    if (win.closed) ctl.remove();
  } catch (err) {
    stage.querySelector('.sketch-loading').textContent = `Could not start ${meta.exe}: ${err.message}`;
  }
  return win;
}
