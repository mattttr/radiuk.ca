// Per-visitor preferences. Storage can throw (private mode, blocked cookies,
// sandboxed frames), so every access is guarded and the site works without it.

const KEY = 'mr95:';

function read(getStore, name, fallback) {
  try {
    const raw = getStore().getItem(KEY + name);
    return raw == null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function write(getStore, name, value) {
  try { getStore().setItem(KEY + name, JSON.stringify(value)); } catch { /* ignore */ }
}

const local = () => window.localStorage;
const sess = () => window.sessionStorage;

export const settings = {
  get: (name, fallback) => read(local, name, fallback),
  set: (name, value) => write(local, name, value),
};

export const session = {
  get: (name, fallback) => read(sess, name, fallback),
  set: (name, value) => write(sess, name, value),
};
