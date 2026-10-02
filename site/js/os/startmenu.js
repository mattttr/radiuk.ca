// The Start menu.

import { openMenu, closeMenus, isMenuOpen } from './menu.js';
import { launch, openLink } from '../apps/registry.js';
import { sketches } from '../sketches/index.js';
import { profile } from '../content.js';
import { isMuted, setMuted, playSfx } from './sound.js';
import { shutdownDialog } from './shutdown.js';

let openFor = null;

export function toggleStartMenu(button, viaKeyboard = false) {
  if (openFor) {
    closeMenus();
    return;
  }
  playSfx('click');
  button.classList.add('is-open');
  button.setAttribute('aria-expanded', 'true');
  openFor = button;
  openMenu(items(), {
    start: true,
    banner: '<b>Matt Radiuk</b><span>95</span>',
    anchorRect: button.getBoundingClientRect(),
    placement: 'above',
    ignore: [button],
    focusFirst: viaKeyboard,
    returnFocus: button,
    onClose: () => {
      button.classList.remove('is-open');
      button.setAttribute('aria-expanded', 'false');
      openFor = null;
    },
  });
}

export function openStartMenu() {
  const btn = document.querySelector('.start-btn');
  if (btn && !isMenuOpen()) toggleStartMenu(btn, true);
}

function items() {
  const sketchItems = sketches.map((s) => ({
    label: s.title,
    icon: 'sketch',
    action: () => launch('sketch', { id: s.id }),
  }));
  return [
    { label: '&About Me', icon: 'doc', action: () => launch('about') },
    { label: '&Contact Me', icon: 'mail', action: () => launch('contact') },
    '-',
    {
      label: '&Programs', icon: 'programs', items: [
        {
          label: 'Accessories', icon: 'programs', items: [
            { label: 'Image Viewer', icon: 'image', action: () => launch('pictures') },
            { label: 'Notepad', icon: 'notepad', action: () => launch('notepad') },
            { label: 'Pablo Cover Generator', icon: 'pablo', action: () => launch('pablo') },
          ],
        },
        { label: 'Games', icon: 'programs', items: [{ label: 'Minesweeper', icon: 'mine', action: () => launch('minesweeper') }] },
        { label: 'Projects', icon: 'projects', items: [{ label: 'Open Folder', icon: 'projects', action: () => launch('projects') }, '-', ...sketchItems] },
        { label: 'Internet', icon: 'programs', items: [
          { label: 'GitHub', icon: 'github', action: () => openLink(profile.github) },
          { label: 'LinkedIn', icon: 'linkedin', action: () => openLink(profile.linkedin) },
          { label: 'Source code for this site', icon: 'globe', action: () => openLink(profile.repo) },
        ] },
        { label: 'MS-DOS Prompt', icon: 'terminal', action: () => launch('terminal') },
        { label: 'My Computer', icon: 'computer', action: () => launch('computer') },
      ],
    },
    {
      label: '&Documents', icon: 'documents', items: [
        { label: 'About_Me.doc', icon: 'doc', action: () => launch('about') },
        { label: 'README.TXT', icon: 'notepad', action: () => launch('notepad', { file: 'README.TXT' }) },
        { label: 'WHATSNEW.TXT', icon: 'notepad', action: () => launch('notepad', { file: 'WHATSNEW.TXT' }) },
        { label: 'My Pictures', icon: 'pictures', action: () => launch('pictures') },
      ],
    },
    {
      label: '&Settings', icon: 'display', items: [
        { label: 'Display Properties', icon: 'display', action: () => launch('display') },
        { label: isMuted() ? 'Turn Sound On' : 'Turn Sound Off', icon: isMuted() ? 'speaker' : 'speaker-off', action: () => setMuted(!isMuted()) },
        { label: 'Welcome Screen', icon: 'info', action: () => launch('welcome') },
      ],
    },
    { label: '&Help', icon: 'help', action: () => launch('help') },
    { label: '&Run...', icon: 'run', shortcut: 'Ctrl+K', action: () => launch('run') },
    '-',
    { label: 'Sh&ut Down...', icon: 'computer-off', action: () => shutdownDialog() },
  ];
}
