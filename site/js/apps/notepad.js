// Notepad. Opens bundled text files (README.TXT, WHATSNEW.TXT) or arbitrary text.

import { h } from '../os/dom.js';
import { openWindow } from '../os/wm.js';
import { msgbox } from '../os/dialog.js';
import { readme, whatsNew } from '../content.js';

const FILES = { 'README.TXT': readme, 'WHATSNEW.TXT': whatsNew };

export function open({ file = 'Untitled', text, from } = {}) {
  const ta = h('textarea', { class: 'notepad-text scroll', spellcheck: false, 'aria-label': file });
  ta.value = text ?? FILES[file] ?? '';
  let wrap = true;

  const win = openWindow({
    appId: 'notepad',
    title: `${file} - Notepad`,
    icon: 'notepad',
    width: 640,
    height: 480,
    minWidth: 260,
    content: ta,
    from,
    menu: [
      { label: '&File', items: () => [
        { label: '&New', action: () => { ta.value = ''; win.setTitle('Untitled - Notepad'); } },
        { label: 'Save &As...', icon: 'floppy', action: () => download(ta.value, file) },
        '-',
        { label: 'E&xit', action: () => win.close() },
      ] },
      { label: '&Edit', items: () => [
        { label: 'Select &All', shortcut: 'Ctrl+A', action: () => { ta.focus(); ta.select(); } },
        { label: 'Time/&Date', shortcut: 'F5', action: insertDate },
      ] },
      { label: 'F&ormat', items: () => [
        { label: '&Word Wrap', checked: wrap, action: () => { wrap = !wrap; ta.classList.toggle('no-wrap', !wrap); } },
      ] },
      { label: '&Help', items: () => [
        { label: '&About Notepad', action: () => msgbox({ title: 'About Notepad', icon: 'notepad', message: 'Notepad for Matt Radiuk 95\n\nNow with 100% more word wrap.' }) },
      ] },
    ],
  });

  function insertDate() {
    const stamp = new Date().toLocaleString();
    ta.setRangeText(stamp, ta.selectionStart, ta.selectionEnd, 'end');
    ta.focus();
  }
  ta.addEventListener('keydown', (e) => { if (e.key === 'F5') { e.preventDefault(); insertDate(); } });

  setTimeout(() => { ta.focus({ preventScroll: true }); ta.setSelectionRange(0, 0); ta.scrollTop = 0; }, 30);
  return win;
}

function download(text, name) {
  const blob = new Blob([text.replace(/\n/g, '\r\n')], { type: 'text/plain' });
  const a = h('a', { href: URL.createObjectURL(blob), download: /\.\w+$/.test(name) ? name : `${name}.txt` });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
