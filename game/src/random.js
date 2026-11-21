// random.js — one small seedable PRNG (mulberry32): every scene, every round and every
// difference is placed from a seed, so a seed always paints the same picture and the same
// round is fair to every player.

export function createRandom(seed) {
  let state = seed >>> 0;
  function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  next.int = (min, max) => min + Math.floor(next() * (max - min + 1));
  next.pick = (list) => list[Math.floor(next() * list.length)];
  next.chance = (probability) => next() < probability;
  return next;
}