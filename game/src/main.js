// Boot and the one loop: input is read every frame, the world advances in fixed 1/60 s
// steps (several in a slow frame, none in a fast one), the renderer paints what is there.
// Screens: title, play, between rounds, paused, game over.
//
// ?seed=N fixes the pictures and the difference picks. ?shot=start|play|end stages a
// scene instead of running the loop and sets window.__shotReady when it is painted.

import { CURSOR, FIELD, KEY_BEST, RULES, STEP } from './config.js';
import { createRandom } from './random.js';
import { createWorld, EVENT_CLEARED, EVENT_FOUND, EVENT_TIMEOUT } from './world.js';
import { ACTION_CONFIRM, ACTION_HINT, ACTION_MUTE, ACTION_PAUSE, createInput } from './input.js';
import { createRenderer, SCREEN_OVER, SCREEN_PAUSED, SCREEN_PLAY, SCREEN_TITLE, panelAt } from './render.js';
import { paintScene } from './scenes.js';
import { stageShot } from './shots.js';
import { playCleared, playFind, playMiss, playTimeout, playWin, setMuted, unlock } from './sound.js';

const MAX_FRAME = 0.25;
const PANEL_LEFT = 34;
const PANEL_RIGHT = 646;
const PANEL_TOP = 118;
const SCENE_W = 600;
const SCENE_H = 450;

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const canvas = document.getElementById('game');
canvas.width = FIELD.width;
canvas.height = FIELD.height;
const status = document.getElementById('status');
const renderer = createRenderer(canvas);

/** Offscreen canvases the two pictures are painted into once per round. */
function makeBuffer() {
  const buffer = document.createElement('canvas');
  buffer.width = SCENE_W;
  buffer.height = SCENE_H;
  return buffer;
}
const leftBuffer = makeBuffer();
const rightBuffer = makeBuffer();
let paintedRound = -1;

function repaintPictures(world) {
  if (paintedRound === world.state.round && world.state.status !== 'title') return;
  const round = world.state.round;
  const roundSeed = (world.state.paintSeed ?? seed) >>> 0;
  paintScene(leftBuffer.getContext('2d'), round, 0, roundSeed);
  paintScene(rightBuffer.getContext('2d'), round, 1, roundSeed);
  paintedRound = round;
}

function readBest() {
  try {
    return Number.parseInt(window.localStorage.getItem(KEY_BEST) ?? '0', 10) || 0;
  } catch {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem(KEY_BEST, String(value));
  } catch {
    // Storage can be off (private windows): the best score then lasts this visit only.
  }
}

function announce(message) {
  status.textContent = message;
}

function runShot(name) {
  const world = createWorld(createRandom(seed));
  const scene = stageShot(name, world);
  const left = makeBuffer();
  const right = makeBuffer();
  paintScene(left.getContext('2d'), world.state.round, 0, world.state.paintSeed);
  paintScene(right.getContext('2d'), world.state.round, 1, world.state.paintSeed);
  const screen = scene.screen === 'title' ? SCREEN_TITLE : scene.screen === 'end' ? SCREEN_OVER : SCREEN_PLAY;
  const won = scene.screen === 'end';
  let painted = 0;
  function paint() {
    renderer.draw({ state: world.state, screen, left, right, won, cleared: false });
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else {
      canvas.toBlob(() => {
        window.__shotReady = true;
      });
    }
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput(canvas);
  const world = createWorld(createRandom(seed));
  let screen = SCREEN_TITLE;
  let best = readBest();
  let accumulator = 0;
  let last = performance.now();
  let cursor = { col: Math.floor(CURSOR.cols / 2), row: Math.floor(CURSOR.rows / 2) };
  let keyboardMode = false;
  let muted = false;

  function startGame() {
    world.reset();
    paintedRound = -1;
    accumulator = 0;
    screen = SCREEN_PLAY;
    announce('Round 1. Find the differences.');
  }

  function endGame(won) {
    screen = SCREEN_OVER;
    if (world.state.roundsCleared > best) {
      best = world.state.roundsCleared;
      saveBest(best);
    }
    if (won) playWin();
    announce(won ? 'All seasons cleared.' : "Time's up. Press Enter to play again.");
  }

  function cellCenter(col, row) {
    const cellW = SCENE_W / CURSOR.cols;
    const cellH = SCENE_H / CURSOR.rows;
    return { x: (col + 0.5) * cellW, y: (row + 0.5) * cellH };
  }

  function handleKeys(keys, actions) {
    if (actions & ACTION_MUTE) {
      muted = !muted;
      setMuted(muted);
      announce(muted ? 'Sound off.' : 'Sound on.');
    }
    if (screen === SCREEN_TITLE || screen === SCREEN_OVER) {
      if (actions & ACTION_CONFIRM) startGame();
      return;
    }
    if (actions & ACTION_PAUSE) {
      if (screen === SCREEN_PLAY) {
        screen = SCREEN_PAUSED;
        announce('Paused.');
      } else if (screen === SCREEN_PAUSED) {
        screen = SCREEN_PLAY;
        announce('Playing.');
      }
      return;
    }
    if (screen === SCREEN_PAUSED) {
      if (actions & ACTION_CONFIRM) {
        screen = SCREEN_PLAY;
        announce('Playing.');
      }
      return;
    }
    if (screen !== SCREEN_PLAY) return;
    let moved = false;
    if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) {
      cursor.col = Math.max(0, cursor.col - 1);
      moved = true;
    }
    if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) {
      cursor.col = Math.min(CURSOR.cols - 1, cursor.col + 1);
      moved = true;
    }
    if (keys.has('ArrowUp') || keys.has('w') || keys.has('W')) {
      cursor.row = Math.max(0, cursor.row - 1);
      moved = true;
    }
    if (keys.has('ArrowDown') || keys.has('s') || keys.has('S')) {
      cursor.row = Math.min(CURSOR.rows - 1, cursor.row + 1);
      moved = true;
    }
    if (moved) keyboardMode = true;
    if (actions & ACTION_HINT) {
      const hinted = world.hint();
      announce(hinted ? 'Hint shown. −10 seconds.' : 'No hint ready yet.');
    }
    if (actions & ACTION_CONFIRM) {
      const point = cellCenter(cursor.col, cursor.row);
      const events = world.pick(point.x, point.y);
      if (events & EVENT_FOUND) {
        playFind(world.state.found.length);
        announce('Found one.');
      } else {
        playMiss();
        announce('Nothing there.');
      }
    }
  }

  function handleClicks(clicks) {
    if (screen !== SCREEN_PLAY) return;
    for (const point of clicks) {
      const side = panelAt(point.x, point.y);
      if (side === -1) continue;
      const originX = side === 0 ? PANEL_LEFT : PANEL_RIGHT;
      const localX = point.x - originX;
      const localY = point.y - PANEL_TOP;
      if (localX < 0 || localX > SCENE_W || localY < 0 || localY > SCENE_H) continue;
      const events = world.pick(localX, localY);
      if (events & EVENT_FOUND) {
        playFind(world.state.found.length);
        announce('Found one.');
      } else {
        playMiss();
        announce('Nothing there.');
      }
    }
  }

  function step() {
    if (screen === SCREEN_TITLE) return;
    if (screen === 'between') {
      world.state.betweenTimer -= STEP;
      if (world.state.betweenTimer <= 0) {
        if (world.state.round + 1 >= RULES.maxRounds) {
          endGame(true);
        } else {
          world.nextRound();
          paintedRound = -1;
          screen = SCREEN_PLAY;
        }
      }
      return;
    }
    if (screen !== SCREEN_PLAY) return;
    const events = world.step(STEP);
    if (events & EVENT_CLEARED) {
      screen = 'between';
      world.state.betweenTimer = 1.6;
      playCleared();
      announce('Picture cleared.');
    } else if (events & EVENT_TIMEOUT) {
      playTimeout();
      if (world.state.round + 1 >= RULES.maxRounds) endGame(false);
      else {
        screen = 'between';
        world.state.betweenTimer = 1.6;
        announce('Time. Next season.');
      }
    }
  }

  function frame(now) {
    requestAnimationFrame(frame);
    accumulator += Math.min((now - last) / 1000, MAX_FRAME);
    last = now;
    const keys = input.takeKeys();
    const actions = input.takeActions();
    if (actions || keys.size > 0) unlock();
    handleKeys(keys, actions);
    const clicks = input.takeClicks();
    if (clicks.length > 0) unlock();
    handleClicks(clicks);
    if (keyboardMode && screen === SCREEN_PLAY) {
      const point = cellCenter(cursor.col, cursor.row);
      input.pointer.x = PANEL_LEFT + point.x;
      input.pointer.y = PANEL_TOP + point.y;
      input.pointer.inside = true;
    }
    while (accumulator >= STEP) {
      step();
      accumulator -= STEP;
    }
    repaintPictures(world);
    renderer.draw({
      state: world.state,
      screen,
      left: leftBuffer,
      right: rightBuffer,
      won: world.state.roundsCleared >= RULES.maxRounds,
      cleared: screen === 'between',
      cursorCell: keyboardMode && screen === SCREEN_PLAY ? cellCenter(cursor.col, cursor.row) : null,
      muted,
    });
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && screen === SCREEN_PLAY) {
      screen = SCREEN_PAUSED;
      announce('Paused.');
    }
  });

  announce('Spot the Seasons. Press Enter or click to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();