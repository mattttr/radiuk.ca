// Help Topics.

import { h } from '../os/dom.js';
import { icon } from '../os/icons.js';
import { openWindow } from '../os/wm.js';
import { profile } from '../content.js';

const TOPICS = [
  {
    id: 'welcome', title: 'Welcome', html: `
      <h2>Welcome to Matt Radiuk 95</h2>
      <p>This is the personal site of <b>Matt Radiuk</b>, a software engineer focused on backend, DevOps and AI.
      It's built to look like the operating system a lot of us grew up on, with a few modern tricks.</p>
      <p>In a hurry? Open <a href="#about">About_Me.doc</a> or <a href="#contact">Contact Me</a>.</p>`,
  },
  {
    id: 'around', title: 'Getting around', html: `
      <h2>Getting around</h2>
      <ul>
        <li><b>Desktop icons</b>: double-click to open (single tap on a phone). Drag to rearrange.</li>
        <li><b>Windows</b>: drag the title bar to move, drag edges to resize. Double-click the title bar to maximize.</li>
        <li><b>Snap</b>: drag a window to the left or right edge to fill half the screen, or to the top to maximize.</li>
        <li><b>Taskbar</b>: click a button to switch to that window, click again to minimize. Right-click for more.</li>
        <li><b>Start menu</b>: everything lives in here, including Programs, Documents and Settings.</li>
        <li><b>Right-click</b> the desktop, title bars and taskbar buttons for context menus.</li>
      </ul>`,
  },
  {
    id: 'keys', title: 'Keyboard shortcuts', html: `
      <h2>Keyboard shortcuts</h2>
      <table class="help-keys">
        <tr><td><kbd>Ctrl</kbd>+<kbd>K</kbd></td><td>Run... (command palette)</td></tr>
        <tr><td><kbd>Ctrl</kbd>+<kbd>Esc</kbd></td><td>Open the Start menu</td></tr>
        <tr><td><kbd>F1</kbd></td><td>This help</td></tr>
        <tr><td><kbd>Esc</kbd></td><td>Close menus and dialogs</td></tr>
        <tr><td>Arrow keys + <kbd>Enter</kbd></td><td>Navigate icons, menus and folders</td></tr>
        <tr><td><kbd>F2</kbd></td><td>New game (Minesweeper)</td></tr>
        <tr><td><kbd>↑</kbd> <kbd>↓</kbd> <kbd>Tab</kbd></td><td>History and completion in MS-DOS Prompt</td></tr>
      </table>`,
  },
  {
    id: 'projects', title: 'Projects', html: `
      <h2>Projects</h2>
      <p>The <a href="#projects">Projects</a> folder holds interactive generative-art sketches written in
      <a href="https://p5js.org" target="_blank" rel="noopener">p5.js</a>. The "Classic" ones are from the original radiuk.ca;
      the "New" ones were written for this release, including a few nods to 90s screen savers.</p>
      <p>Every sketch can also run full-screen in its own tab (File → Open in New Tab), or be your screen saver or a live wallpaper
      (Start → Settings → Display Properties).</p>`,
  },
  {
    id: 'site', title: 'About this site', html: `
      <h2>About this site</h2>
      <p>Matt Radiuk 95 is a small window manager written in plain JavaScript (ES modules), HTML and CSS: no framework and no build step.
      It's hosted on AWS Amplify.</p>
      <ul>
        <li>Icons are original 16×16 pixel art drawn as text grids and rendered to SVG.</li>
        <li>Sounds are synthesized live with the Web Audio API. No audio files.</li>
        <li>Fonts: Pixelify Sans, IBM Plex Sans/Mono and VT323 (Google Fonts).</li>
        <li>Sketches: p5.js, loaded only when you open one.</li>
        <li>Pablo.exe is inspired by Ivan Malagón's TLOP cover generator.</li>
      </ul>
      <p>Windows 95 is a trademark of Microsoft. This is an affectionate tribute, not affiliated with Microsoft.</p>
      <p><a href="${profile.repo}" target="_blank" rel="noopener">View the source on GitHub</a></p>`,
  },
  {
    id: 'secrets', title: 'Secrets', html: `
      <h2>Secrets</h2>
      <p>A few things are hidden around here. Some hints:</p>
      <ul>
        <li>The MS-DOS Prompt knows more commands than HELP admits. Programmers might try what they'd type in a real terminal.</li>
        <li>Some commands are destructive. Don't worry, nothing is really deleted.</li>
        <li>↑ ↑ ↓ ↓ ...</li>
        <li>Walk away from your computer for a bit.</li>
        <li>Benji lives in the bottom-right corner. He likes attention.</li>
      </ul>`,
  },
];

export function open({ from, id } = {}) {
  const article = h('article', { class: 'help-article scroll' });
  const list = h('ul', { class: 'help-topics tree', role: 'tree' });
  const rows = TOPICS.map((t) => {
    const row = h('button', { class: 'tree-row', type: 'button', html: `${icon('help', 16)}<span>${t.title}</span>` });
    row.addEventListener('click', () => show(t.id));
    list.append(h('li', null, row));
    return row;
  });

  function show(topicId) {
    const idx = Math.max(0, TOPICS.findIndex((t) => t.id === topicId));
    rows.forEach((r, i) => r.classList.toggle('is-selected', i === idx));
    article.innerHTML = TOPICS[idx].html;
    article.scrollTop = 0;
  }

  article.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    e.preventDefault();
    location.hash = a.getAttribute('href');
  });

  const win = openWindow({
    appId: 'help',
    route: 'help',
    title: 'Matt Radiuk 95 Help',
    icon: 'help',
    width: 720,
    height: 520,
    minWidth: 320,
    content: h('div', { class: 'help' }, list, article),
    from,
  });
  show(id || 'welcome');
  win.onRelaunch = (args) => { if (args.id) show(args.id); };
  return win;
}
