// sound.js — every sound is synthesised with WebAudio, so the game ships no audio files:
// a small pentatonic tick for each find, a soft buzz for a miss, a rising chime for a
// cleared picture, and a closing motif for the end. The context is created lazily on the
// first key press or click, as browsers require.

let context = null;
let muted = false;

function ensure() {
  if (context) return context;
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) return null;
  context = new Audio();
  return context;
}

export function setMuted(value) {
  muted = value;
}

export function isMuted() {
  return muted;
}

/** Call from a user gesture (keydown or click) so the context is allowed to start. */
export function unlock() {
  const audio = ensure();
  if (audio && audio.state === 'suspended') audio.resume();
}

function tone(frequency, start, duration, gainValue, type = 'sine') {
  const audio = ensure();
  if (!audio || muted) return;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  const begin = audio.currentTime + start;
  gain.gain.setValueAtTime(0.0001, begin);
  gain.gain.exponentialRampToValueAtTime(gainValue, begin + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, begin + duration);
  oscillator.connect(gain).connect(audio.destination);
  oscillator.start(begin);
  oscillator.stop(begin + duration + 0.02);
}

/** A find: two rising notes from a pentatonic ladder, climbing with the combo. */
export function playFind(combo) {
  const scale = [523.25, 587.33, 659.25, 783.99, 880.0];
  const note = scale[combo % scale.length];
  tone(note, 0, 0.16, 0.16, 'triangle');
  tone(note * 1.5, 0.07, 0.18, 0.12, 'triangle');
}

/** A miss: one short, low buzz. */
export function playMiss() {
  tone(140, 0, 0.16, 0.12, 'sawtooth');
}

/** A cleared picture: a quick rising arpeggio. */
export function playCleared() {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  for (let i = 0; i < notes.length; i += 1) tone(notes[i], i * 0.09, 0.22, 0.14, 'triangle');
}

/** Time running out: a short descending figure. */
export function playTimeout() {
  const notes = [659.25, 523.25, 392.0];
  for (let i = 0; i < notes.length; i += 1) tone(notes[i], i * 0.12, 0.26, 0.12, 'sine');
}

/** The game is won: the closing motif. */
export function playWin() {
  const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
  for (let i = 0; i < notes.length; i += 1) tone(notes[i], i * 0.11, 0.3, 0.13, 'triangle');
}