// Contact Me: an Outlook Express-style "New Message" window that posts to Formspree.

import { h } from '../os/dom.js';
import { icon } from '../os/icons.js';
import { openWindow } from '../os/wm.js';
import { msgbox } from '../os/dialog.js';
import { playSfx } from '../os/sound.js';
import { profile, email } from '../content.js';
import { openLink } from './registry.js';

export function open({ from } = {}) {
  const form = h('form', { class: 'mail-form', novalidate: true });
  const field = (label, input) => h('label', { class: 'mail-row' }, h('span', { class: 'mail-label' }, label), input);

  const toChip = h('div', { class: 'field mail-to', 'aria-label': 'To' },
    h('span', { class: 'mail-chip', html: `${icon('mail', 16)}<span>Matt Radiuk</span>` }));
  const name = h('input', { class: 'field', name: 'name', required: true, autocomplete: 'name', placeholder: 'Your name' });
  const from_ = h('input', { class: 'field', name: 'email', type: 'email', required: true, autocomplete: 'email', placeholder: 'you@example.com' });
  const subject = h('input', { class: 'field', name: '_subject', placeholder: 'Let’s build something', value: 'Hello from radiuk.ca' });
  const body = h('textarea', { class: 'textarea mail-body', name: 'message', required: true, placeholder: 'Tell me about your project, idea, or just say hi...' });
  const honeypot = h('input', { type: 'text', name: '_gotcha', tabIndex: -1, autocomplete: 'off', class: 'sr-only', 'aria-hidden': 'true' });

  form.append(
    field('To:', toChip),
    field('From:', name),
    field('Reply-To:', from_),
    field('Subject:', subject),
    honeypot,
    body,
  );

  const sendBtn = h('button', { class: 'tool-btn tool-big', type: 'button', html: `${icon('mail', 32)}<span>Send</span>`, onClick: () => send() });
  const toolbar = h('div', { class: 'toolbar mail-toolbar' },
    sendBtn,
    h('span', { class: 'sep' }),
    h('button', { class: 'tool-btn tool-big', type: 'button', html: `${icon('github', 32)}<span>GitHub</span>`, onClick: () => openLink(profile.github) }),
    h('button', { class: 'tool-btn tool-big', type: 'button', html: `${icon('linkedin', 32)}<span>LinkedIn</span>`, onClick: () => openLink(profile.linkedin) }),
    h('button', { class: 'tool-btn tool-big', type: 'button', html: `${icon('globe', 32)}<span>Email</span>`, title: email, onClick: () => { window.location.href = `mailto:${email}`; } }),
  );

  const win = openWindow({
    appId: 'contact',
    route: 'contact',
    title: 'New Message - Contact Matt',
    icon: 'mail',
    width: 640,
    height: 560,
    minWidth: 320,
    minHeight: 380,
    content: form,
    toolbar,
    from,
    menu: [
      { label: '&File', items: () => [
        { label: '&Send Message', shortcut: 'Ctrl+Enter', action: () => send() },
        '-',
        { label: '&Close', action: () => win.close() },
      ] },
      { label: '&Edit', items: () => [
        { label: 'Copy Matt’s &Email Address', action: () => navigator.clipboard?.writeText(email) },
      ] },
      { label: '&Help', items: () => [
        { label: '&About', action: () => msgbox({ title: 'Contact', icon: 'mail', message: `Messages go straight to Matt’s inbox.\n\nPrefer your own mail client? Email ${email}.` }) },
      ] },
    ],
    statusbar: ['Messages go straight to Matt’s inbox.', { text: 'Online', fixed: true, width: '70px' }],
  });

  form.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); send(); }
  });
  form.addEventListener('submit', (e) => { e.preventDefault(); send(); });

  let sending = false;
  async function send() {
    if (sending) return;
    const missing = [[name, 'From'], [from_, 'Reply-To'], [body, 'message']].find(([el]) => !el.value.trim());
    if (missing) {
      await msgbox({ title: 'Outlook Express', icon: 'warning', message: `Please fill in the ${missing[1]} field before sending.` });
      missing[0].focus();
      return;
    }
    if (!from_.checkValidity()) {
      await msgbox({ title: 'Outlook Express', icon: 'warning', message: 'That Reply-To address doesn’t look quite right.' });
      from_.focus();
      return;
    }

    sending = true;
    sendBtn.disabled = true;
    win.setStatus(0, 'Connecting to mail server...');
    try {
      const res = await fetch(profile.formspree, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) throw new Error(`Server replied ${res.status}`);
      playSfx('tada');
      win.setStatus(0, 'Message sent.');
      await msgbox({ title: 'Message Sent', icon: 'info', sound: 'none', message: `Thanks, ${name.value.trim().split(' ')[0]}! Your message is on its way. I'll get back to you soon.` });
      form.reset();
      subject.value = 'Hello from radiuk.ca';
      win.close();
    } catch (err) {
      win.setStatus(0, 'Send failed.');
      msgbox({
        title: 'Outlook Express',
        icon: 'error',
        message: `The message could not be sent (${err.message}).\n\nYou can email me directly at ${email}.`,
      });
    } finally {
      sending = false;
      sendBtn.disabled = false;
    }
  }

  setTimeout(() => name.focus({ preventScroll: true }), 50);
  return win;
}
