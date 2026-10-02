// MS-DOS Prompt: a small shell with a virtual C: drive and a few secrets.

import { h, escapeHtml, sleep } from '../os/dom.js';
import { openWindow } from '../os/wm.js';
import { playSfx } from '../os/sound.js';
import { bus } from '../os/bus.js';
import { bsod } from '../os/bsod.js';
import { settings } from '../os/settings.js';
import { profile, bio, skills, photos, email, readme, whatsNew } from '../content.js';
import { sketches } from '../sketches/index.js';
import { launch, openLink } from './registry.js';

// ------------------------------------------------------------ file system

const DATE = '08-24-95';
const TIME = ' 9:30a';

const file = (content, extra = {}) => ({ type: 'file', content, ...extra });
const dir = (children) => ({ type: 'dir', children });

function buildFs() {
  const projects = {};
  for (const s of sketches) {
    projects[s.exe.toUpperCase()] = file(`${s.title}\n\n${s.blurb}\n`, {
      long: s.exe, size: 9000 + s.id.length * 1337, run: () => launch('sketch', { id: s.id }),
    });
  }
  const pictures = {};
  for (const p of photos) {
    pictures[`${p.file.toUpperCase()}.JPG`] = file(`[binary JPEG data]\n${p.caption}\n`, {
      long: `${p.file}.jpg`, size: 200000 + p.file.length * 9001, run: () => launch('viewer', { id: p.file }),
    });
  }
  return dir({
    'ABOUT.TXT': file(() => `${profile.name}\n${'='.repeat(profile.name.length)}\n\n${bio.join('\n\n')}\n`),
    'SKILLS.TXT': file(() => skills.map((g) => `${g.group}\n${g.items.map((i) => `  - ${i.name}`).join('\n')}`).join('\n\n') + '\n'),
    'CONTACT.TXT': file(() => `Email    : ${email}\nGitHub   : ${profile.github}\nLinkedIn : ${profile.linkedin}\n\nOr type MAIL to open the mail client.\n`),
    'README.TXT': file(readme),
    'WHATSNEW.TXT': file(whatsNew),
    'AUTOEXEC.BAT': file('@ECHO OFF\nPROMPT $P$G\nPATH C:\\WINDOWS;C:\\PROJECTS;C:\\GAMES\nSET DOG=BENJI\nCOFFEE /STRONG\nWIN\n'),
    'CONFIG.SYS': file('DEVICE=C:\\WINDOWS\\HIMEM.SYS\nDEVICE=C:\\DOG\\BENJI.SYS /GOODBOY\nFILES=40\nBUFFERS=20\nCOFFEE=UNLIMITED\n'),
    PROJECTS: dir(projects),
    PICTURES: dir(pictures),
    GAMES: dir({
      'WINMINE.EXE': file('Minesweeper\n', { long: 'Minesweeper', size: 24576, run: () => launch('minesweeper') }),
      'PABLO.EXE': file('The Life of Pablo cover generator\n', { long: 'Pablo.exe', size: 81790, run: () => launch('pablo') }),
    }),
    DOG: dir({
      'BENJI.SYS': file('Australian Shepherd driver v1.0\nStatus: Good boy.\n'),
      'TREATS.TXT': file('Inventory:\n  - 0 treats (Benji found them)\n'),
    }),
    WINDOWS: dir({
      'WIN.COM': file('', { size: 22359, run: () => 'win' }),
      'WIN.INI': file('[windows]\nload=\nrun=\nBeep=yes\n\n[Desktop]\nWallpaper=(None)\nTileWallpaper=0\n\n[benji]\nmood=happy\n'),
      SYSTEM: dir({}),
    }),
  });
}

const COLORS = '0000AA,00AA00,00AAAA,AA0000,AA00AA,AA5500,AAAAAA,555555,5555FF,55FF55,55FFFF,FF5555,FF55FF,FFFF55,FFFFFF'.split(',');
const DOS_PALETTE = ['#000000', ...COLORS.map((c) => `#${c}`)];

const FORTUNES = [
  'There are 10 types of people: those who understand binary and those who don\u2019t.',
  'It works on my machine. \u2014 every developer, ever',
  'A SQL query walks into a bar, walks up to two tables and asks: "Can I join you?"',
  'Why do programmers prefer dark mode? Because light attracts bugs.',
  'To understand recursion, see: recursion.',
  '99 little bugs in the code. Take one down, patch it around... 127 little bugs in the code.',
  'Weeks of coding can save you hours of planning.',
  'The cloud is just someone else\u2019s computer. Matt is good at talking to it.',
  'There are two hard things in computer science: cache invalidation, naming things, and off-by-one errors.',
  '!false (it\u2019s funny because it\u2019s true)',
  'I would tell you a UDP joke, but you might not get it.',
  'Deleted code is debugged code.',
];

const LOGO = [
  ' __  __  ____     ___   ____  ',
  '|  \\/  ||  _ \\   / _ \\ | ___| ',
  '| |\\/| || |_) | | (_) ||___ \\ ',
  '| |  | ||  _ <   \\__, | ___) |',
  '|_|  |_||_| \\_\\    /_/ |____/ ',
];

// --------------------------------------------------------------- the app

export function open({ from, fullscreen = false } = {}) {
  const fs = buildFs();
  let cwd = [];
  const history = [];
  let hIndex = 0;
  let busy = false;

  const out = h('div', { class: 'dos-out' });
  const prompt = h('span', { class: 'dos-prompt' });
  const input = h('input', { class: 'dos-input', type: 'text', spellcheck: false, autocomplete: 'off', autocapitalize: 'off', 'aria-label': 'Command' });
  const caret = h('span', { class: 'dos-caret', 'aria-hidden': 'true' });
  const inputWrap = h('span', { class: 'dos-input-wrap' }, input, caret);
  const line = h('div', { class: 'dos-line' }, prompt, inputWrap);
  const screen = h('div', { class: 'dos-screen scroll', tabIndex: -1 }, out, line);
  const root = h('div', { class: 'dos' }, screen);

  const savedColor = settings.get('dosColor', '07');
  applyColor(savedColor, false);

  const win = openWindow({
    appId: 'terminal',
    route: fullscreen ? null : 'terminal',
    title: 'MS-DOS Prompt',
    icon: 'terminal',
    width: 760,
    height: 480,
    minWidth: 300,
    minHeight: 200,
    content: root,
    bodyClass: 'dos-body',
    className: fullscreen ? 'dos-fullscreen' : '',
    maximized: fullscreen,
    from,
    onFocus: () => setTimeout(() => input.focus({ preventScroll: true }), 0),
  });
  if (fullscreen) {
    // cover the taskbar too: lift out of the desktop's stacking context
    win.pinnedZ = 5000;
    document.body.append(win.el);
  }

  // ------------------------------------------------------------ output
  const path = () => `C:\\${cwd.join('\\')}`;
  const setPrompt = () => { prompt.textContent = `${path()}>`; };
  const scroll = () => { screen.scrollTop = screen.scrollHeight; };
  const print = (text = '', cls = '') => {
    for (const l of String(text).split('\n')) out.append(h('div', { class: `dos-l ${cls}` }, l || '\u00a0'));
    scroll();
  };
  const printHtml = (html) => { out.append(h('div', { class: 'dos-l', html })); scroll(); };
  const slow = async (lines, delay = 120) => { for (const l of lines) { print(l); await sleep(delay); } };

  function applyColor(code, persist = true) {
    const c = String(code).toUpperCase().padStart(2, '0');
    const bg = parseInt(c[0], 16);
    const fg = parseInt(c[1], 16);
    if (Number.isNaN(bg) || Number.isNaN(fg) || bg === fg) return false;
    root.style.setProperty('--dos-bg', DOS_PALETTE[bg]);
    root.style.setProperty('--dos-fg', DOS_PALETTE[fg]);
    if (persist) settings.set('dosColor', c);
    return true;
  }

  // caret follows the cursor position (monospace)
  const moveCaret = () => {
    const pos = input.selectionStart ?? input.value.length;
    caret.style.left = `${pos}ch`;
  };
  input.addEventListener('input', () => { moveCaret(); playSfx('key'); });
  input.addEventListener('keyup', moveCaret);
  input.addEventListener('click', moveCaret);
  screen.addEventListener('pointerup', () => {
    if (!window.getSelection()?.toString()) input.focus({ preventScroll: true });
  });

  // -------------------------------------------------------- filesystem
  const resolve = (arg) => {
    if (!arg) return { node: nodeAt(cwd), parts: cwd };
    let p = arg.replace(/\//g, '\\').replace(/^c:/i, '');
    let parts = p.startsWith('\\') ? [] : cwd.slice();
    for (const seg of p.split('\\').filter(Boolean)) {
      if (seg === '..') parts.pop();
      else if (seg !== '.') parts.push(seg.toUpperCase());
    }
    return { node: nodeAt(parts), parts };
  };
  function nodeAt(parts) {
    let node = fs;
    for (const part of parts) {
      if (node?.type !== 'dir') return null;
      const key = Object.keys(node.children).find((k) => k === part || k.split('.')[0] === part);
      node = key ? node.children[key] : null;
    }
    return node;
  }
  const contentOf = (node) => (typeof node.content === 'function' ? node.content() : node.content);
  const sizeOf = (node) => node.size ?? contentOf(node).length;

  function shortName(name) {
    const [base, ext = ''] = name.split('.');
    const b = base.length > 8 ? `${base.slice(0, 6)}~1` : base;
    return `${b.padEnd(8)} ${ext.padEnd(3)}`;
  }

  function findExecutable(name) {
    const up = name.toUpperCase();
    const candidates = [up, `${up}.EXE`, `${up}.COM`];
    const dirs = [cwd, ['PROJECTS'], ['GAMES'], ['WINDOWS']];
    for (const d of dirs) {
      const node = nodeAt(d);
      if (node?.type !== 'dir') continue;
      for (const c of candidates) if (node.children[c]?.run) return node.children[c];
    }
    // also match sketch ids / titles: "flow-field", "flowfield"
    const s = sketches.find((sk) => sk.id === name.toLowerCase() || sk.title.replace(/\s/g, '').toLowerCase() === name.toLowerCase().replace(/[\s-]/g, ''));
    if (s) return { run: () => launch('sketch', { id: s.id }) };
    return null;
  }

  // ------------------------------------------------------------ commands
  const commands = {
    help: () => {
      print('Available commands:\n');
      const rows = [
        ['HELP', 'This list'], ['ABOUT', 'Who is Matt?'], ['SKILLS', 'The tech stack'], ['CONTACT', 'How to reach me'],
        ['PROJECTS', 'List the p5.js sketches'], ['RUN name', 'Run a program, e.g. RUN BOIDS'],
        ['DIR / LS', 'List files'], ['CD dir', 'Change directory'], ['TYPE file', 'Print a file'],
        ['START app', 'Open an app (WINMINE, PABLO, MAIL...)'], ['NEOFETCH', 'System info, with flair'],
        ['COLOR xy', 'Change colours, e.g. COLOR 0A'], ['FORTUNE', 'Wisdom'], ['DOGSAY text', 'Benji speaks'],
        ['CLS', 'Clear the screen'], ['VER, DATE, TIME', 'The classics'], ['EXIT', 'Close this window'],
      ];
      for (const [c, d] of rows) print(`  ${c.padEnd(16)} ${d}`);
      print('\nThere may be other commands. Curiosity is encouraged.');
    },
    ver: () => print('\nMatt Radiuk 95 [Version 4.00.950]\n'),
    cls: () => { out.replaceChildren(); },
    clear: () => commands.cls(),
    date: () => print(`Current date is ${new Date().toLocaleDateString([], { weekday: 'short', year: 'numeric', month: '2-digit', day: '2-digit' })}`),
    time: () => print(`Current time is ${new Date().toLocaleTimeString()}`),
    echo: (args, raw) => print(raw || 'ECHO is on.'),
    whoami: () => print(`radiuk\\matt\n${profile.roles.slice(0, 3).join(' · ')}`),
    about: () => { print(''); bio.forEach((p) => print(wrap(p) + '\n')); print('Type CONTACT to get in touch, or MAIL to write me now.'); },
    skills: () => {
      print('');
      for (const g of skills.slice(0, 3)) {
        print(g.group.toUpperCase(), 'dos-hl');
        for (const i of g.items) print(`  ${'█'.repeat(10)}  ${i.name}`);
        print('');
      }
    },
    contact: () => print(`\n  Email    : ${email}\n  GitHub   : ${profile.github}\n  LinkedIn : ${profile.linkedin}\n\n  Type MAIL to open the mail client.\n`),
    mail: () => { print('Starting Outlook Express...'); launch('contact'); },
    hire: () => { print('Excellent choice. Opening mail client...'); launch('contact'); },
    projects: () => {
      print('');
      for (const s of sketches) print(`  ${s.exe.padEnd(15)} ${s.title}`);
      print('\nType RUN <name> (e.g. RUN PIPES3D) or CD PROJECTS.');
    },
    run: (args) => {
      if (!args[0]) return print('Required parameter missing');
      const exe = findExecutable(args[0]);
      if (!exe) return print('Bad command or file name');
      const r = exe.run();
      if (r === 'win') commands.win();
    },
    start: (args) => {
      const target = (args[0] || '').toLowerCase();
      const apps = { winmine: 'minesweeper', minesweeper: 'minesweeper', pablo: 'pablo', mail: 'contact', notepad: 'notepad', explorer: 'projects', projects: 'projects', pictures: 'pictures', about: 'about', control: 'display', help: 'help', computer: 'computer' };
      if (!target) return print('Required parameter missing');
      if (/^https?:\/\//.test(target)) { openLink(args[0]); return print(`Opening ${args[0]}`); }
      if (apps[target]) { launch(apps[target]); return print(`Starting ${target}...`); }
      return commands.run(args);
    },
    dir: (args) => {
      const { node, parts } = resolve(args.find((a) => !a.startsWith('/')));
      if (!node || node.type !== 'dir') return print('File not found');
      print(` Volume in drive C is MATT-95\n Volume Serial Number is 1995-0824\n Directory of C:\\${parts.join('\\')}\n`);
      let files = 0;
      let dirs = 0;
      let bytes = 0;
      if (parts.length) { print(`.            <DIR>        ${DATE} ${TIME} .`); print(`..           <DIR>        ${DATE} ${TIME} ..`); dirs += 2; }
      for (const [name, child] of Object.entries(node.children)) {
        if (child.type === 'dir') {
          dirs++;
          print(`${shortName(name)}  <DIR>        ${DATE} ${TIME} ${name.charAt(0) + name.slice(1).toLowerCase()}`);
        } else {
          files++;
          const size = sizeOf(child);
          bytes += size;
          print(`${shortName(name)} ${size.toLocaleString('en-US').padStart(12)} ${DATE} ${TIME} ${child.long || name}`);
        }
      }
      print(`${String(files).padStart(9)} file(s)${bytes.toLocaleString('en-US').padStart(15)} bytes`);
      print(`${String(dirs).padStart(9)} dir(s)    640,000,000 bytes free`);
    },
    ls: (args) => commands.dir(args),
    cd: (args) => {
      if (!args[0]) return print(path());
      const { node, parts } = resolve(args[0]);
      if (!node || node.type !== 'dir') return print('Invalid directory');
      cwd = parts;
      setPrompt();
    },
    'cd..': () => commands.cd(['..']),
    'cd\\': () => commands.cd(['\\']),
    chdir: (args) => commands.cd(args),
    pwd: () => print(path()),
    type: (args) => {
      if (!args[0]) return print('Required parameter missing');
      const { node } = resolve(args[0]);
      if (!node) return print('File not found');
      if (node.type === 'dir') return print('Access denied');
      print(contentOf(node));
    },
    cat: (args) => commands.type(args),
    more: (args) => commands.type(args),
    edit: (args) => {
      const { node } = resolve(args[0]);
      if (node?.type === 'file') launch('notepad', { file: args[0].toUpperCase(), text: contentOf(node), key: `notepad:${args[0]}` });
      else launch('notepad');
    },
    notepad: (args) => commands.edit(args),
    tree: () => {
      const walk = (node, prefix) => {
        const dirs = Object.entries(node.children).filter(([, c]) => c.type === 'dir');
        dirs.forEach(([name, child], i) => {
          const last = i === dirs.length - 1;
          print(`${prefix}${last ? '└───' : '├───'}${name}`);
          walk(child, prefix + (last ? '    ' : '│   '));
        });
      };
      print('Folder PATH listing for volume MATT-95\nC:.');
      walk(fs, '');
    },
    mem: () => print('\nMemory Type        Total  =   Used  +   Free\n----------------  -------   -------   -------\nConventional        640K       38K      602K\nCoffee              \u221eK       \u221eK         0K\nPatience            100K        2K       98K\n\nLargest executable program size   602K (616,448 bytes)\nMS-DOS is resident in the high memory area.\n'),
    color: (args) => {
      if (!args[0]) { applyColor('07'); return; }
      if (!applyColor(args[0])) print('Usage: COLOR [attr]  e.g. COLOR 0A (green on black), COLOR 1F (white on blue)');
    },
    neofetch: () => {
      const info = [
        `<span class="dos-hl">matt</span>@<span class="dos-hl">${profile.site}</span>`,
        '-------------',
        `<b>OS</b>: Matt Radiuk 95 (Software Engineer Edition)`,
        `<b>Host</b>: ${profile.site} on AWS Amplify`,
        `<b>Kernel</b>: Vanilla JS, ES modules, zero build steps`,
        `<b>Uptime</b>: ${profile.experience} in production`,
        `<b>Shell</b>: COMMAND.COM`,
        `<b>Resolution</b>: ${window.innerWidth}x${window.innerHeight}`,
        `<b>Theme</b>: ${document.documentElement.dataset.scheme || 'standard'}`,
        `<b>CPU</b>: Caffeine x87 @ 4.20 GHz`,
        `<b>Languages</b>: Java, Python, Node.js`,
        `<b>Cloud</b>: AWS, Azure (certified)`,
        `<b>Focus</b>: Backend, DevOps, AI`,
        `<b>Dog</b>: Benji (Australian Shepherd)`,
        '',
        DOS_PALETTE.slice(0, 8).map((c) => `<span style="background:${c}">\u00a0\u00a0\u00a0</span>`).join(''),
      ];
      const lines = Math.max(LOGO.length + 2, info.length);
      for (let i = 0; i < lines; i++) {
        const logo = (LOGO[i - 1] ?? '').padEnd(32);
        printHtml(`<span class="dos-logo">${escapeHtml(logo).replace(/ /g, '&nbsp;')}</span>${info[i] ?? ''}`);
      }
    },
    fortune: () => print(`\n${wrap(FORTUNES[Math.floor(Math.random() * FORTUNES.length)])}\n`),
    dogsay: (args, raw) => {
      const text = raw || 'Woof! Hire Matt!';
      const bar = '-'.repeat(text.length + 2);
      print(` ${'_'.repeat(text.length + 2)}\n< ${text} >\n ${bar}\n        \\\n         \\   / \\__\n          \\ (    @\\___\n             /         O\n            /   (_____/\n           /_____/   U\n`);
      playSfx('woof');
    },
    cowsay: (args, raw) => { print('Cows are not supported. Using dog instead.'); commands.dogsay(args, raw); },
    coffee: () => print('\n      ( (\n       ) )\n    ........\n    |      |]\n    \\      /\n     `----\'\n\nHere you go. Matt runs on this stuff.\n'),
    sudo: () => print('matt is not in the sudoers file. This incident will be reported to Benji.'),
    git: (args) => {
      const sub = (args[0] || '').toLowerCase();
      const replies = {
        blame: 'It was Benji.',
        status: 'On branch main\nYour branch is up to date with \'origin/main\'.\n\nnothing to commit, working tree clean (for once)',
        push: args.includes('--force') || args.includes('-f') ? 'Whoa there. Not on a Friday.' : 'Everything up-to-date',
        commit: '[main 1a2b3c4] fix: final fix (for real this time)\n 1 file changed, 1 insertion(+), 1 deletion(-)',
        log: 'commit 1a2b3c4 (HEAD -> main)\nAuthor: Matt Radiuk\n\n    Rebuild website as Windows 95. No regrets.',
        pull: 'Already up to date.',
      };
      print(replies[sub] || `git: '${sub || ''}' is not a git command. See 'git --help'.`);
    },
    ping: async (args) => {
      const host = args[0] || profile.site;
      print(`\nPinging ${host} with 32 bytes of data:\n`);
      for (let i = 0; i < 4; i++) {
        await sleep(450);
        print(`Reply from ${host}: bytes=32 time=${8 + Math.floor(Math.random() * 20)}ms TTL=64`);
      }
      print(`\nPing statistics for ${host}:\n    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss)`);
    },
    hack: async () => {
      busy = true;
      await slow([
        'Initializing h4x0r mode...',
        'Bypassing firewall............ [OK]',
        'Decrypting mainframe........... [OK]',
        'Downloading more RAM........... [OK]',
        'Reticulating splines........... [OK]',
        'Enhancing... enhancing......... [OK]',
      ], 280);
      await sleep(300);
      print('\nACCESS GRANTED', 'dos-hl');
      print('\nJust kidding. The only thing to hack here is Minesweeper. Try START WINMINE.');
      busy = false;
    },
    matrix: () => matrix(),
    beep: () => playSfx('ding'),
    party: () => import('../os/benji.js').then((m) => m.benjiParty()),
    saver: () => import('../os/screensaver.js').then((m) => m.startScreensaver()),
    screensaver: () => commands.saver(),
    shutdown: () => import('../os/shutdown.js').then((m) => m.shutdownDialog()),
    history: () => history.forEach((c, i) => print(`${String(i + 1).padStart(4)}  ${c}`)),
    win: () => {
      if (fullscreen) { print('Starting Matt Radiuk 95...'); setTimeout(() => { win.close(); bus.emit('system:reboot'); }, 400); }
      else print('Matt Radiuk 95 is already running. (Nice try.)');
    },
    exit: () => {
      if (fullscreen) commands.win();
      else win.close();
    },
    rm: (args) => { if (args.join(' ').includes('-rf') || args.includes('/')) return destroy('RM(01) + 0000DEAD'); print('rm: missing operand'); },
    del: (args) => { if (args.join(' ').match(/\*|c:|\\$/i)) return destroy('DEL(01) + 00000BAD'); print('File not found'); },
    deltree: () => destroy('DELTREE(01) + 0000F00D'),
    format: () => destroy('FORMAT(01) + 0000C0DE'),
  };
  const aliases = { '?': 'help', man: 'help', dir: 'dir', 'ls -la': 'ls', quit: 'exit', logout: 'exit', vim: 'edit', vi: 'edit', nano: 'edit', code: 'edit' };

  async function destroy(reason) {
    print('Deleting everything...');
    await sleep(500);
    await bsod(reason);
    print('\nPhew. That was close. Let\u2019s not do that again.');
  }

  function wrap(text, width = 70) {
    const words = text.split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
      if ((cur + w).length > width) { lines.push(cur.trimEnd()); cur = ''; }
      cur += `${w} `;
    }
    lines.push(cur.trimEnd());
    return lines.join('\n');
  }

  async function execute(raw) {
    const trimmed = raw.trim();
    print(`${path()}>${raw}`);
    if (!trimmed) return;
    history.push(trimmed);
    hIndex = history.length;

    const [first, ...args] = trimmed.split(/\s+/);
    let name = first.toLowerCase();
    if (aliases[name]) name = aliases[name];
    const rest = trimmed.slice(first.length).trim();

    if (/^[a-z]:$/i.test(first)) return print(first.toLowerCase() === 'c:' ? '' : 'Invalid drive specification');
    if (name.startsWith('cd') && name.length > 2 && !commands[name]) return commands.cd([trimmed.slice(2).trim()]);

    const cmd = commands[name];
    if (cmd) {
      busy = true;
      try { await cmd(args, rest); } finally { busy = false; }
      return;
    }
    const exe = findExecutable(first);
    if (exe) {
      const r = exe.run();
      if (r === 'win') commands.win();
      return;
    }
    print('Bad command or file name');
  }

  input.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (busy) return;
      const value = input.value;
      input.value = '';
      moveCaret();
      line.hidden = true;
      await execute(value);
      line.hidden = false;
      setPrompt();
      scroll();
      input.focus({ preventScroll: true });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (hIndex > 0) { hIndex--; input.value = history[hIndex]; }
      requestAnimationFrame(() => { input.setSelectionRange(input.value.length, input.value.length); moveCaret(); });
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (hIndex < history.length) { hIndex++; input.value = history[hIndex] || ''; }
      requestAnimationFrame(moveCaret);
    } else if (e.key === 'Tab') {
      e.preventDefault();
      complete();
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      commands.cls();
    } else if (e.key === 'c' && e.ctrlKey && !input.selectionEnd) {
      print(`${path()}>${input.value}^C`);
      input.value = '';
      moveCaret();
    }
  });

  function complete() {
    const value = input.value;
    const parts = value.split(' ');
    const last = parts[parts.length - 1].toUpperCase();
    let pool;
    if (parts.length === 1) {
      pool = [...Object.keys(commands).map((c) => c.toUpperCase()), ...Object.keys(nodeAt(cwd).children)];
    } else {
      pool = Object.keys(nodeAt(cwd).children);
    }
    const matches = [...new Set(pool)].filter((c) => c.startsWith(last));
    if (matches.length === 1) {
      parts[parts.length - 1] = parts.length === 1 && commands[matches[0].toLowerCase()] ? matches[0].toLowerCase() : matches[0];
      input.value = parts.join(' ') + (parts.length === 1 ? ' ' : '');
    } else if (matches.length > 1) {
      print(`${path()}>${value}`);
      print(matches.join('  '));
    }
    moveCaret();
  }

  function matrix() {
    return new Promise((resolve) => {
      const canvas = h('canvas', { class: 'dos-matrix' });
      root.append(canvas);
      const ctx = canvas.getContext('2d');
      const fit = () => { canvas.width = root.clientWidth; canvas.height = root.clientHeight; };
      fit();
      const size = 16;
      let drops = Array.from({ length: Math.ceil(canvas.width / size) }, () => Math.random() * -50);
      let raf = 0;
      const chars = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄ0123456789MATTRADIUKBENJI';
      const frame = () => {
        ctx.fillStyle = 'rgba(0,0,0,0.08)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.font = `${size}px monospace`;
        drops.forEach((y, i) => {
          const ch = chars[Math.floor(Math.random() * chars.length)];
          ctx.fillStyle = Math.random() < 0.05 ? '#d8ffd8' : '#33ff66';
          ctx.fillText(ch, i * size, y * size);
          drops[i] = y * size > canvas.height && Math.random() > 0.975 ? 0 : y + 1;
        });
        raf = requestAnimationFrame(frame);
      };
      frame();
      const stop = () => {
        cancelAnimationFrame(raf);
        canvas.remove();
        window.removeEventListener('keydown', stop, true);
        canvas.removeEventListener('pointerdown', stop);
        print('Wake up, Neo... (press any key next time you get bored)');
        resolve();
      };
      setTimeout(() => {
        window.addEventListener('keydown', stop, true);
        canvas.addEventListener('pointerdown', stop);
      }, 300);
      setTimeout(() => { if (canvas.isConnected) stop(); }, 15000);
      drops = drops.map(() => Math.random() * -50);
    });
  }

  // ------------------------------------------------------------- startup
  print('Matt Radiuk 95 [Version 4.00.950]');
  print('(C) Copyright Radiuk Corp 1995-2026.\n');
  if (fullscreen) print('Type WIN (or EXIT) to return to Matt Radiuk 95.\n');
  else print('Type HELP for a list of commands.\n');
  setPrompt();
  setTimeout(() => input.focus({ preventScroll: true }), 50);
  return win;
}
