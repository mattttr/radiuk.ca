// C:\My Documents\My Pictures: the photo gallery.

import { h } from '../os/dom.js';
import { photos } from '../content.js';
import { explorer } from './explorer.js';
import { launch } from './registry.js';

export function open({ from } = {}) {
  const items = photos.map((p) => ({
    id: p.file,
    name: `${p.file}.jpg`,
    icon: 'image',
    thumb: `img/gallery/thumbs/${p.file}.jpg`,
    type: 'JPEG Image',
    detail: p.title,
    photo: p,
  }));

  return explorer({
    appId: 'pictures',
    route: 'pictures',
    title: 'My Pictures',
    iconName: 'pictures',
    address: 'C:\\My Documents\\My Pictures',
    items,
    from,
    intro: h('div', null,
      h('p', null, 'Travels, adventures and a very photogenic Australian Shepherd.'),
      h('p', null, 'Double-click a photo to open it in Image Viewer. Use the arrow keys to flip through.')),
    describe: (item, openIt) => h('div', { class: 'ex-details' },
      h('img', { class: 'ex-preview', src: item.thumb, alt: '' }),
      h('h3', null, item.photo.title),
      h('p', null, item.photo.caption),
      h('p', { class: 'ex-file' }, `${item.name} · JPEG Image`),
      h('div', { class: 'btn-row start' }, h('button', { class: 'btn is-default', type: 'button', onClick: openIt }, 'Open'))),
    onOpen: (item, rect) => launch('viewer', { id: item.id, from: rect }),
  });
}
