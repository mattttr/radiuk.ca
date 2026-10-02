// All sounds are synthesized with WebAudio, so there are no audio files and
// no borrowed jingles. Browsers only allow audio after a user gesture, so
// nothing plays until the visitor has clicked or pressed a key.

import { settings } from './settings.js';
import { bus } from './bus.js';

let ctx = null;
let master = null;
let muted = settings.get('muted', false);

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.55;

    // A cheap "room": filtered feedback delay mixed under the dry signal.
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.17;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.3;
    const tone = ctx.createBiquadFilter();
    tone.type = 'lowpass';
    tone.frequency.value = 2200;
    const wet = ctx.createGain();
    wet.gain.value = 0.22;

    master.connect(ctx.destination);
    master.connect(delay);
    delay.connect(tone);
    tone.connect(feedback);
    feedback.connect(delay);
    tone.connect(wet);
    wet.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

/** Call from inside a user gesture handler to allow audio. */
export function unlockAudio() { ensure(); }

const ready = () => !muted && ctx && ctx.state === 'running';
const mtof = (m) => 440 * 2 ** ((m - 69) / 12);

function note(freq, start, dur, { type = 'sine', gain = 0.2, attack = 0.008, detune = 0, cutoff = 0, glideTo = 0 } = {}) {
  const t0 = ctx.currentTime + start;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, t0 + dur);
  osc.detune.value = detune;

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(gain, t0 + attack);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

  let src = osc;
  if (cutoff) {
    const f = ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = cutoff;
    osc.connect(f);
    src = f;
  }
  src.connect(env);
  env.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

function noise(start, dur, { gain = 0.2, freq = 1200, q = 0.8, type = 'bandpass', sweepTo = 0 } = {}) {
  const t0 = ctx.currentTime + start;
  const len = Math.ceil(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const f = ctx.createBiquadFilter();
  f.type = type;
  f.frequency.setValueAtTime(freq, t0);
  if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, t0 + dur);
  f.Q.value = q;
  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t0);
  env.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f);
  f.connect(env);
  env.connect(master);
  src.start(t0);
  src.stop(t0 + dur);
}

const SFX = {
  // A warm Fmaj9 bloom with a little bell arpeggio on top.
  startup() {
    note(mtof(41), 0, 3.6, { gain: 0.16, attack: 0.9 });
    [53, 60, 64, 67, 69].forEach((m, i) => {
      note(mtof(m), i * 0.05, 3.4, { type: 'sawtooth', gain: 0.03, attack: 0.7, detune: i % 2 ? 8 : -8, cutoff: 1600 });
      note(mtof(m), i * 0.05, 3.2, { type: 'triangle', gain: 0.045, attack: 0.5 });
    });
    [77, 81, 84, 88, 91, 96].forEach((m, i) => {
      note(mtof(m), 0.45 + i * 0.13, 1.8, { gain: 0.06, attack: 0.004 });
    });
  },
  shutdown() {
    [84, 79, 76, 72, 67, 60].forEach((m, i) => note(mtof(m), i * 0.14, 1.4, { type: 'triangle', gain: 0.07 }));
    note(mtof(48), 0.2, 2.4, { gain: 0.12, attack: 0.5 });
  },
  click() { note(2200, 0, 0.025, { type: 'square', gain: 0.025, attack: 0.001, cutoff: 3500 }); },
  open() {
    note(mtof(79), 0, 0.09, { type: 'triangle', gain: 0.06, attack: 0.002 });
    note(mtof(86), 0.05, 0.12, { type: 'triangle', gain: 0.05, attack: 0.002 });
  },
  close() {
    note(mtof(84), 0, 0.08, { type: 'triangle', gain: 0.05, attack: 0.002 });
    note(mtof(77), 0.045, 0.11, { type: 'triangle', gain: 0.045, attack: 0.002 });
  },
  minimize() { noise(0, 0.18, { gain: 0.05, freq: 2400, sweepTo: 500, q: 1.2 }); },
  maximize() { noise(0, 0.18, { gain: 0.05, freq: 500, sweepTo: 2600, q: 1.2 }); },
  ding() {
    note(mtof(88), 0, 0.9, { gain: 0.08, attack: 0.003 });
    note(mtof(83), 0.11, 1.1, { gain: 0.07, attack: 0.003 });
  },
  error() {
    note(mtof(69), 0, 0.5, { type: 'triangle', gain: 0.09, attack: 0.003 });
    note(mtof(64), 0.12, 0.7, { type: 'triangle', gain: 0.09, attack: 0.003 });
  },
  tada() {
    [72, 76, 79, 84].forEach((m, i) => note(mtof(m), i * 0.09, 1.2, { type: 'triangle', gain: 0.07 }));
    [84, 88, 91].forEach((m) => note(mtof(m), 0.4, 1.4, { gain: 0.05 }));
  },
  boom() {
    noise(0, 0.9, { gain: 0.35, freq: 900, sweepTo: 80, q: 0.6, type: 'lowpass' });
    note(110, 0, 0.7, { gain: 0.25, glideTo: 35 });
  },
  woof() {
    for (const t of [0, 0.24]) {
      note(330, t, 0.14, { type: 'sawtooth', gain: 0.09, attack: 0.01, glideTo: 180, cutoff: 1400 });
      noise(t, 0.12, { gain: 0.08, freq: 700, q: 1.5 });
    }
  },
  key() { note(1400 + Math.random() * 400, 0, 0.018, { type: 'square', gain: 0.012, attack: 0.001, cutoff: 2500 }); },
  flag() { note(mtof(91), 0, 0.06, { type: 'square', gain: 0.03, cutoff: 3000 }); },
  reveal() { note(mtof(84 + Math.floor(Math.random() * 5)), 0, 0.05, { type: 'triangle', gain: 0.04 }); },
};

export function playSfx(name) {
  if (!ready()) return;
  try { SFX[name]?.(); } catch { /* audio is best-effort */ }
}

export const isMuted = () => muted;

export function setMuted(value) {
  muted = !!value;
  settings.set('muted', muted);
  if (!muted) ensure();
  bus.emit('sound:muted', muted);
}
