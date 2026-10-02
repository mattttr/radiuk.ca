// Tiny DOM helpers. No framework, just a hyperscript-style `h()`.

/**
 * Create an element.
 *   h('button', { class: 'btn', onClick: fn }, 'OK')
 * Props starting with "on" become listeners, `html` sets innerHTML,
 * `style` may be an object, anything else is a property or attribute.
 */
export function h(tag, props, ...children) {
  const el = document.createElement(tag);
  if (props) {
    for (const [key, value] of Object.entries(props)) {
      if (value == null || value === false) continue;
      if (key === 'class') el.className = value;
      else if (key === 'html') el.innerHTML = value;
      else if (key === 'style' && typeof value === 'object') Object.assign(el.style, value);
      else if (key.startsWith('on') && typeof value === 'function') el.addEventListener(key.slice(2).toLowerCase(), value);
      else if (key.startsWith('aria-') || key.startsWith('data-') || key === 'role' || key === 'for') el.setAttribute(key, value === true ? '' : value);
      else if (key in el) el[key] = value;
      else el.setAttribute(key, value === true ? '' : value);
    }
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const child of children) {
    if (child == null || child === false) continue;
    if (Array.isArray(child)) append(el, child);
    else el.append(child.nodeType ? child : document.createTextNode(String(child)));
  }
}

/** Parse an HTML string into a single element (or fragment if several). */
export function html(markup) {
  const t = document.createElement('template');
  t.innerHTML = markup.trim();
  return t.content.childElementCount === 1 ? t.content.firstElementChild : t.content;
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export const isMobile = () => window.matchMedia('(max-width: 700px)').matches;
export const isTouch = () => window.matchMedia('(pointer: coarse)').matches;
export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Underline the access key marked with & in a label, e.g. "&File" -> <u>F</u>ile */
export function accessLabel(label) {
  const i = label.indexOf('&');
  if (i < 0) return document.createTextNode(label);
  const frag = document.createDocumentFragment();
  frag.append(label.slice(0, i), h('u', null, label[i + 1]), label.slice(i + 2));
  return frag;
}
export const plainLabel = (label) => label.replace('&', '');
