// shots.js — the screenshot scenes behind ?shot=start|play|end. Each one plays the real
// rules forward from a fresh world, finds a few differences the way a player would, and
// stages the frame at a fixed moment, so the same seed always yields the same screenshot.

import { RULES, DIFFS_PER_ROUND } from './config.js';
import { paintScene } from './scenes.js';

/** Which differences the staged play scene has already found, by index into the round. */
const PLAY_FOUND = 3;
const PLAY_SECONDS = 46;

/**
 * Set `world` to the named scene and return { screen, found, leftSeed, rightSeed }.
 * The play scene marks a few differences found (markers visible, counter showing the
 * remainder); the end scene stages a timeout with a hint ring on screen.
 */
export function stageShot(name, world) {
  if (name === 'play') {
    world.reset();
    for (let i = 0; i < PLAY_SECONDS * 60; i += 1) world.step(1 / 60);
    const state = world.state;
    for (let i = 0; i < Math.min(PLAY_FOUND, state.differences.length); i += 1) {
      if (!state.found.includes(state.differences[i])) state.found.push(state.differences[i]);
    }
    state.hintMark = state.differences.find((diff) => !state.found.includes(diff)) || null;
    state.hintTime = 2;
    return { screen: 'play' };
  }
  if (name === 'end') {
    world.reset();
    world.state.timeLeft = 0.001;
    world.step(1 / 60);
    return { screen: 'end' };
  }
  world.reset();
  return { screen: 'title' };
}