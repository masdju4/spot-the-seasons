// render.js — draws the whole frame: background, the two pictures, the marks the player has
// made, the clock, the round counter and the screens between rounds. It reads the world's
// state and paints; it never changes the game.

import { CURSOR, FIELD, PALETTE, PANEL, RULES, FONT, ROUND_NAMES } from './config.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_PAUSED = 'paused';
export const SCREEN_OVER = 'over';

function panelOrigin(side) {
  return { x: side === 0 ? PANEL.leftX : PANEL.rightX, y: PANEL.top };
}

/** Convert a scene-space point (0..600, 0..450) to frame space for one panel. */
function sceneToFrame(side, x, y) {
  const origin = panelOrigin(side);
  return { x: origin.x + x, y: origin.y + y };
}

/** Which panel (0 left, 1 right) a frame-space point is in, or -1. */
export function panelAt(x, y) {
  for (let side = 0; side < 2; side += 1) {
    const origin = panelOrigin(side);
    if (x >= origin.x && x <= origin.x + PANEL.width && y >= origin.y && y <= origin.y + PANEL.height) return side;
  }
  return -1;
}

export function createRenderer(canvas) {
  const ctx = canvas.getContext('2d');

  function drawFrameBase() {
    const grad = ctx.createLinearGradient(0, 0, 0, FIELD.height);
    grad.addColorStop(0, '#0c1118');
    grad.addColorStop(1, PALETTE.backdrop);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
  }

  function drawPanelFrames() {
    for (let side = 0; side < 2; side += 1) {
      const origin = panelOrigin(side);
      ctx.fillStyle = PALETTE.panel;
      ctx.fillRect(origin.x - 6, origin.y - 6, PANEL.width + 12, PANEL.height + 12);
      ctx.strokeStyle = PALETTE.frame;
      ctx.lineWidth = 2;
      ctx.strokeRect(origin.x - 6, origin.y - 6, PANEL.width + 12, PANEL.height + 12);
      ctx.fillStyle = side === 0 ? PALETTE.panelA : PALETTE.panelB;
      ctx.font = `600 13px ${FONT}`;
      ctx.textAlign = 'center';
      ctx.fillText(side === 0 ? 'ORIGINAL' : 'SPOT THE DIFFERENCE', origin.x + PANEL.width / 2, origin.y - 14);
      ctx.textAlign = 'left';
    }
  }

  function drawFoundMarks(differences, found) {
    for (const diff of differences) {
      if (!found.includes(diff)) continue;
      const left = sceneToFrame(0, diff.x, diff.y);
      const right = sceneToFrame(1, diff.x, diff.y);
      for (const point of [left, right]) {
        ctx.strokeStyle = PALETTE.found;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(point.x, point.y, 16, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(point.x - 8, point.y);
        ctx.lineTo(point.x - 2, point.y + 6);
        ctx.lineTo(point.x + 9, point.y - 7);
        ctx.stroke();
      }
    }
  }

  function drawHintMark(diff, timeLeft) {
    if (!diff) return;
    const pulse = 0.5 + 0.5 * Math.sin(timeLeft * 8);
    const left = sceneToFrame(0, diff.x, diff.y);
    const right = sceneToFrame(1, diff.x, diff.y);
    for (const point of [left, right]) {
      ctx.strokeStyle = `rgba(255, 209, 102, ${0.45 + 0.55 * pulse})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(point.x, point.y, 20 + 8 * pulse, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  function drawMiss(missAt, flash) {
    if (!missAt || flash <= 0) return;
    const alpha = Math.min(1, flash / RULES.wrongHoldSeconds);
    ctx.strokeStyle = `rgba(239, 93, 107, ${alpha})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(missAt.x - 10, missAt.y - 10);
    ctx.lineTo(missAt.x + 10, missAt.y + 10);
    ctx.moveTo(missAt.x + 10, missAt.y - 10);
    ctx.lineTo(missAt.x - 10, missAt.y + 10);
    ctx.stroke();
  }

  function drawHud(state) {
    const remaining = state.differences.length - state.found.length;
    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.text;
    ctx.font = `700 30px ${FONT}`;
    ctx.fillText(`Round ${state.round + 1} / ${RULES.maxRounds}`, PANEL.leftX, 58);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `500 17px ${FONT}`;
    ctx.fillText(state.roundName, PANEL.leftX, 84);

    // The countdown: a clock that is always in frame.
    const timeRatio = Math.max(0, state.timeLeft / RULES.roundSeconds);
    ctx.fillStyle = PALETTE.panel;
    ctx.fillRect(PANEL.leftX, 96, PANEL.width * 2 + 12, 8);
    ctx.fillStyle = timeRatio < 0.25 ? PALETTE.bad : PALETTE.accent;
    ctx.fillRect(PANEL.leftX, 96, (PANEL.width * 2 + 12) * timeRatio, 8);
    const minutes = Math.floor(state.timeLeft / 60);
    const seconds = Math.floor(state.timeLeft % 60);
    ctx.fillStyle = timeRatio < 0.25 ? PALETTE.bad : PALETTE.text;
    ctx.font = `700 22px ${FONT}`;
    ctx.textAlign = 'right';
    ctx.fillText(`${minutes}:${String(seconds).padStart(2, '0')}`, PANEL.leftX + PANEL.width * 2 + 12, 58);
    ctx.textAlign = 'left';

    // The counter of how many remain, the criterion the screenshots must show.
    ctx.textAlign = 'center';
    ctx.fillStyle = remaining === 0 ? PALETTE.good : PALETTE.text;
    ctx.font = `700 24px ${FONT}`;
    ctx.fillText(`${remaining} difference${remaining === 1 ? '' : 's'} left`, FIELD.width / 2, 690);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `500 15px ${FONT}`;
    ctx.fillText(
      `Click or press Enter on a difference  ·  H hint (−${RULES.hintPenaltySeconds}s)  ·  P pause  ·  M mute`,
      FIELD.width / 2,
      666,
    );
    ctx.textAlign = 'left';
  }

  function drawTitleScreen() {
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.accent;
    ctx.font = `800 64px ${FONT}`;
    ctx.fillText('SPOT THE SEASONS', FIELD.width / 2, 250);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `500 24px ${FONT}`;
    ctx.fillText('Two pictures. Seven sneaky changes. Find them all before the clock runs out.', FIELD.width / 2, 300);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `500 18px ${FONT}`;
    ctx.fillText('Click a difference in either picture, or move with the arrow keys and press Enter.', FIELD.width / 2, 348);
    ctx.fillStyle = PALETTE.good;
    ctx.font = `700 26px ${FONT}`;
    ctx.fillText('Press Enter or click to start', FIELD.width / 2, 430);
    ctx.textAlign = 'left';
  }

  function drawPauseScreen() {
    ctx.fillStyle = 'rgba(12, 17, 24, 0.82)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = PALETTE.text;
    ctx.font = `800 52px ${FONT}`;
    ctx.fillText('Paused', FIELD.width / 2, 320);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `500 20px ${FONT}`;
    ctx.fillText('Press P or Enter to keep playing', FIELD.width / 2, 366);
    ctx.textAlign = 'left';
  }

  function drawOverScreen(won) {
    ctx.fillStyle = 'rgba(12, 17, 24, 0.85)';
    ctx.fillRect(0, 0, FIELD.width, FIELD.height);
    ctx.textAlign = 'center';
    ctx.fillStyle = won ? PALETTE.good : PALETTE.bad;
    ctx.font = `800 56px ${FONT}`;
    ctx.fillText(won ? 'All seasons cleared!' : "Time's up!", FIELD.width / 2, 300);
    ctx.fillStyle = PALETTE.text;
    ctx.font = `500 22px ${FONT}`;
    ctx.fillText(
      won ? `Every picture solved with time to spare.` : `The last picture kept its secrets.`,
      FIELD.width / 2,
      350,
    );
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `500 18px ${FONT}`;
    ctx.fillText('Press Enter or click to play again', FIELD.width / 2, 404);
    ctx.textAlign = 'left';
  }

  function drawBetweenRounds(cleared) {
    ctx.textAlign = 'center';
    ctx.fillStyle = cleared ? PALETTE.good : PALETTE.accent;
    ctx.font = `800 46px ${FONT}`;
    ctx.fillText(cleared ? 'Picture cleared!' : 'Time!', FIELD.width / 2, 300);
    ctx.fillStyle = PALETTE.muted;
    ctx.font = `500 20px ${FONT}`;
    ctx.fillText(
      cleared ? `+${RULES.clearBonusSeconds}s carried over. Next season coming up...` : 'Next season coming up...',
      FIELD.width / 2,
      344,
    );
    ctx.textAlign = 'left';
  }

  function drawCursor(cell) {
    if (!cell) return;
    ctx.strokeStyle = 'rgba(255, 209, 102, 0.9)';
    ctx.lineWidth = 2;
    const size = Math.min(PANEL.width / CURSOR.cols, PANEL.height / CURSOR.rows);
    ctx.strokeRect(cell.x - size / 2, cell.y - size / 2, size, size);
  }

  /**
   * Paint the whole frame. `view` carries everything the renderer needs:
   * { state, screen, left, right, cursorCell, best }.
   */
  function draw(view) {
    const { state, screen } = view;
    drawFrameBase();
    if (screen === SCREEN_TITLE) {
      drawTitleScreen();
      return;
    }
    if (screen === SCREEN_PAUSED) {
      draw(view);
      drawPauseScreen();
      return;
    }
    drawPanelFrames();
    if (view.left) ctx.drawImage(view.left, PANEL.leftX, PANEL.top, PANEL.width, PANEL.height);
    if (view.right) ctx.drawImage(view.right, PANEL.rightX, PANEL.top, PANEL.width, PANEL.height);
    drawFoundMarks(state.differences, state.found);
    drawHintMark(state.hintMark, state.hintTime);
    drawMiss(state.missAt, state.missFlash);
    drawCursor(view.cursorCell);
    drawHud(state);
    if (screen === 'between') drawBetweenRounds(view.cleared);
    if (screen === SCREEN_OVER) drawOverScreen(view.won);
  }

  return { draw };
}