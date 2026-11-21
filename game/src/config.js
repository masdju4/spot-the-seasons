// config.js — every tuning number, colour and name in one place.
// Two near-identical pictures sit side by side; the player finds the differences by hand
// (mouse) or by keyboard cursor. A fixed 1280x720 logical frame is scaled to the window.

export const FIELD = { width: 1280, height: 720 };

export const PANEL = {
  width: 600,
  height: 450,
  leftX: 34,
  rightX: 646,
  top: 118,
};

export const RULES = {
  roundSeconds: 150,
  maxRounds: 6,
  hintPenaltySeconds: 10,
  hintCooldownSeconds: 12,
  foundHoldSeconds: 0.45,
  wrongHoldSeconds: 0.4,
  clearBonusSeconds: 20,
};

export const DIFFS_PER_ROUND = 7;

export const PALETTE = {
  backdrop: '#101720',
  panel: '#1d2733',
  frame: '#31404f',
  frameGlow: '#46586b',
  text: '#eef3f8',
  muted: '#93a4b5',
  accent: '#ffd166',
  good: '#57d977',
  bad: '#ef5d6b',
  found: '#57d977',
  hint: '#ffd166',
  panelA: '#8ecae6',
  panelB: '#ffb4a2',
};

export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

export const KEY_BEST = 'spot-the-seasons.best';

/** Keyboard cursor grid: the scene is searched cell by cell. */
export const CURSOR = { cols: 40, rows: 30 };

/** The simulation's fixed step, in seconds: 60 updates a second whatever the display's rate. */
export const STEP = 1 / 60;

export const ROUND_NAMES = [
  'Spring Fair',
  'Summer Pier',
  'Autumn Market',
  'Winter Square',
  'Night Carnival',
  'Grand Finale',
];