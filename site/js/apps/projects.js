// C:\Projects: the p5.js sketch collection.

import { h } from '../os/dom.js';
import { sketches } from '../sketches/index.js';
import { explorer } from './explorer.js';
import { launch } from './registry.js';
import { profile } from '../content.js';

export function open({ from } = {}) {
  const items = sketches.map((s) => ({
    id: s.id,
    name: s.exe,
    icon: 'sketch',
    thumb: `img/projects/${s.id}.jpg`,
    type: s.webgl ? 'p5.js / WebGL' : 'p5.js',
    detail: s.title,
    sketch: s,
  }));

  return explorer({
    appId: 'projects',
    route: 'projects',
    title: 'Projects',
    iconName: 'projects',
    address: 'C:\\Projects',
    items,
    from,
    width: 900,
    height: 600,
    intro: h('div', null,
      h('p', null, 'Generative art & creative-coding experiments, all written in ', h('a', { href: 'https://p5js.org', target: '_blank', rel: 'noopener' }, 'p5.js'), '.'),
      h('p', null, 'Every program here is live and most react to your mouse. Double-click one to run it.'),
      h('p', { class: 'ex-legend' }, h('span', { class: 'tag classic' }, 'Classic'), ' from the original radiuk.ca · ', h('span', { class: 'tag new' }, 'New'), ' in this release'),
    ),
    describe: (item, openIt) => {
      const s = item.sketch;
      return h('div', { class: 'ex-details' },
        h('h3', null, s.title, ' ', h('span', { class: `tag ${s.origin}` }, s.origin === 'classic' ? 'Classic' : 'New')),
        h('p', { class: 'ex-file' }, `${s.exe} · ${item.type}`),
        h('p', null, s.blurb),
        h('p', { class: 'ex-hint' }, h('b', null, 'How to play: '), s.hint),
        h('div', { class: 'btn-row start' },
          h('button', { class: 'btn is-default', type: 'button', onClick: openIt }, 'Run'),
          h('a', { class: 'btn', href: `${profile.repo}/blob/main/site/js/sketches/${s.id}.js`, target: '_blank', rel: 'noopener' }, 'Source')),
      );
    },
    onOpen: (item, rect) => launch('sketch', { id: item.id, from: rect }),
  });
}
