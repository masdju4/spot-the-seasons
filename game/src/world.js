// world.js — the game's rules and state, with no drawing and no browser in it.
// One round at a time: the clock runs down, the player finds differences, and each find or
// miss is judged here. step() advances one fixed step and returns what happened as bit
// flags, so the caller reacts without the world knowing about screens or sound.

import { DIFFS_PER_ROUND, ROUND_NAMES, RULES } from './config.js';
import { roundDifferences } from './scenes.js';

export const EVENT_NONE = 0;
export const EVENT_FOUND = 1;
export const EVENT_MISS = 2;
export const EVENT_CLEARED = 4;
export const EVENT_TIMEOUT = 8;

/**
 * Create the game world.
 * `random` is a seedable PRNG (random.js); `paint` draws one round's picture onto a
 * 2D context and returns that round's difference list (scenes.js).
 */
export function createWorld(random, differencesOf = roundDifferences) {
  const state = {
    round: 0,
    roundName: ROUND_NAMES[0],
    timeLeft: RULES.roundSeconds,
    differences: [],
    found: [],
    hintCooldown: 0,
    hintMark: null,
    hintTime: 0,
    missFlash: 0,
    missAt: null,
    status: 'title',
    roundsCleared: 0,
    betweenTimer: 0,
  };

  function loadRound() {
    state.roundName = ROUND_NAMES[state.round % ROUND_NAMES.length];
    state.timeLeft = RULES.roundSeconds;
    state.found = [];
    state.hintCooldown = 0;
    state.hintMark = null;
    state.hintTime = 0;
    state.missFlash = 0;
    state.missAt = null;
    const seed = (random() * 4294967296) >>> 0;
    state.paintSeed = seed;
    state.differences = differencesOf(state.round, seed).slice(0, DIFFS_PER_ROUND);
    state.status = 'play';
  }

  function reset() {
    state.round = 0;
    state.roundsCleared = 0;
    loadRound();
  }

  /**
   * Advance one fixed step. `dt` is seconds. Returns EVENT_* bit flags.
   * A pick is handled by pick() instead; step only runs the clock.
   */
  function step(dt) {
    if (state.status !== 'play') return EVENT_NONE;
    let events = EVENT_NONE;
    state.timeLeft = Math.max(0, state.timeLeft - dt);
    state.hintCooldown = Math.max(0, state.hintCooldown - dt);
    state.hintTime = Math.max(0, state.hintTime - dt);
    if (state.hintTime === 0) state.hintMark = null;
    state.missFlash = Math.max(0, state.missFlash - dt);
    if (state.timeLeft <= 0) {
      events |= EVENT_TIMEOUT;
      state.status = 'timeout';
      return events;
    }
    return events;
  }

  /**
   * The player picked at scene point (x, y) on the left picture. Returns EVENT_FOUND with
   * state.lastPick naming the difference, EVENT_MISS when nothing is there, or EVENT_NONE.
   */
  function pick(x, y) {
    if (state.status !== 'play') return EVENT_NONE;
    for (const diff of state.differences) {
      if (state.found.includes(diff)) continue;
      const dx = x - diff.x;
      const dy = y - diff.y;
      if (dx * dx + dy * dy <= diff.radius * diff.radius) {
        state.found.push(diff);
        if (state.found.length >= state.differences.length) {
          state.roundsCleared += 1;
          state.timeLeft = Math.min(RULES.roundSeconds, state.timeLeft + RULES.clearBonusSeconds);
          state.status = 'cleared';
        }
        return EVENT_FOUND;
      }
    }
    state.missFlash = RULES.wrongHoldSeconds;
    state.missAt = { x, y };
    return EVENT_MISS;
  }

  /**
   * Spend a hint: if one is off cooldown, the oldest unfound difference is marked for the
   * player. Returns the difference hinted, or null when none is available.
   */
  function hint() {
    if (state.status !== 'play' || state.hintCooldown > 0) return null;
    const next = state.differences.find((diff) => !state.found.includes(diff));
    if (!next) return null;
    state.hintMark = next;
    state.hintTime = RULES.foundHoldSeconds + 1.5;
    state.hintCooldown = RULES.hintCooldownSeconds;
    state.timeLeft = Math.max(0, state.timeLeft - RULES.hintPenaltySeconds);
    return next;
  }

  /** Advance to the next round after a clear or a timeout. */
  function nextRound() {
    state.round += 1;
    loadRound();
  }

  return {
    state,
    reset,
    step,
    pick,
    hint,
    nextRound,
    get round() {
      return state.round;
    },
    get totalRounds() {
      return RULES.maxRounds;
    },
  };
}