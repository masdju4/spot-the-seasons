// input.js — the mouse and the keyboard, turned into one stream of actions.
// Mouse: move hovers, a click picks. Keyboard: arrows or WASD move a cell cursor over the
// left picture, Enter or Space picks at the cursor, H spends a hint, P pauses, M mutes.
// Everything the shell needs (hover cell, cursor cell, click cell, button presses) is
// collected per frame and handed out once, so no event is ever lost between frames.

export const ACTION_NONE = 0;
export const ACTION_CONFIRM = 1;
export const ACTION_PAUSE = 2;
export const ACTION_HINT = 4;
export const ACTION_MUTE = 8;
export const ACTION_SKIP = 16;

export function createInput(canvas) {
  const held = new Set();
  const pendingClicks = [];
  const pendingKeys = new Set();
  const pointer = { x: -1, y: -1, inside: false };
  let dragging = false;

  function toLocal(event) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  canvas.addEventListener('mousemove', (event) => {
    const point = toLocal(event);
    pointer.x = point.x;
    pointer.y = point.y;
    pointer.inside = true;
  });
  canvas.addEventListener('mouseleave', () => {
    pointer.inside = false;
  });
  canvas.addEventListener('mousedown', (event) => {
    const point = toLocal(event);
    pointer.x = point.x;
    pointer.y = point.y;
    pointer.inside = true;
    dragging = true;
    pendingClicks.push(point);
  });
  canvas.addEventListener('mouseup', () => {
    dragging = false;
  });
  canvas.addEventListener('contextmenu', (event) => event.preventDefault());
  window.addEventListener('keydown', (event) => {
    const key = event.key;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'Enter'].includes(key)) event.preventDefault();
    if (!held.has(key)) pendingKeys.add(key);
    held.add(key);
  });
  window.addEventListener('keyup', (event) => {
    held.delete(event.key);
  });

  return {
    pointer,
    isDown(...keys) {
      return keys.some((key) => held.has(key));
    },
    /** The cell (0..cols-1, 0..rows-1) under the pointer, or null when it is outside. */
    cellAt(area, cols, rows) {
      if (!pointer.inside) return null;
      const cellW = area.width / cols;
      const cellH = area.height / rows;
      const col = Math.floor((pointer.x - area.x) / cellW);
      const row = Math.floor((pointer.y - area.y) / cellH);
      if (col < 0 || col >= cols || row < 0 || row >= rows) return null;
      return { col, row, x: col * cellW + cellW / 2, y: row * cellH + cellH / 2 };
    },
    /** The raw click points collected since the last call. */
    takeClicks() {
      return pendingClicks.splice(0, pendingClicks.length);
    },
    /** The keys pressed (not held) since the last call, as a set. */
    takeKeys() {
      const keys = new Set(pendingKeys);
      pendingKeys.clear();
      return keys;
    },
    /** Edge-triggered action bits from the keys pressed since the last call. */
    takeActions() {
      let actions = ACTION_NONE;
      if (pendingKeys.has('Enter') || pendingKeys.has(' ')) actions |= ACTION_CONFIRM;
      if (pendingKeys.has('Escape') || pendingKeys.has('p') || pendingKeys.has('P')) actions |= ACTION_PAUSE;
      if (pendingKeys.has('h') || pendingKeys.has('H')) actions |= ACTION_HINT;
      if (pendingKeys.has('m') || pendingKeys.has('M')) actions |= ACTION_MUTE;
      if (pendingKeys.has('n') || pendingKeys.has('N')) actions |= ACTION_SKIP;
      pendingKeys.clear();
      return actions;
    },
  };
}