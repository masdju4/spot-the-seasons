// scenes.js — the two near-identical pictures of each round, drawn by hand with canvas
// primitives. A scene is a seeded painting: the same seed paints the same picture twice, then
// the difference list tells drawScene which marks to change on the right-hand copy.
// Nothing here plays the game; it only paints.

import { createRandom } from './random.js';

const SKY = ['#bfe3f2', '#ffe6b3', '#f7c59f', '#c9d6e8', '#2b2d4e', '#f9d5e5'];
const GROUND = ['#8fce8f', '#f2d16b', '#d98e4a', '#e8eef6', '#3a3f66', '#b48ec9'];
const ACCENT = ['#e4572e', '#17bebb', '#ffc914', '#76b041', '#9b5de5', '#f15bb5', '#00bbf9', '#fee440'];

function rect(ctx, x, y, w, h, colour) {
  ctx.fillStyle = colour;
  ctx.fillRect(x, y, w, h);
}

function circle(ctx, x, y, r, colour) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function ellipse(ctx, x, y, rx, ry, colour) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function cloud(ctx, x, y, scale, colour) {
  ctx.fillStyle = colour;
  for (const [dx, dy, r] of [[0, 0, 18], [16, 4, 14], [-16, 5, 13], [4, -8, 13]]) {
    ctx.beginPath();
    ctx.arc(x + dx * scale, y + dy * scale, r * scale, 0, Math.PI * 2);
    ctx.fill();
  }
}

function star(ctx, x, y, r, colour) {
  ctx.fillStyle = colour;
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const radius = i % 2 === 0 ? r : r * 0.45;
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const px = x + Math.cos(angle) * radius;
    const py = y + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

function tree(ctx, x, groundY, scale, leaf, trunk) {
  rect(ctx, x - 5 * scale, groundY - 40 * scale, 10 * scale, 40 * scale, trunk);
  ellipse(ctx, x, groundY - 58 * scale, 26 * scale, 30 * scale, leaf);
}

function house(ctx, x, groundY, w, h, wall, roof, door) {
  rect(ctx, x - w / 2, groundY - h, w, h, wall);
  ctx.fillStyle = roof;
  ctx.beginPath();
  ctx.moveTo(x - w / 2 - 8, groundY - h);
  ctx.lineTo(x, groundY - h - w * 0.55);
  ctx.lineTo(x + w / 2 + 8, groundY - h);
  ctx.closePath();
  ctx.fill();
  rect(ctx, x - 9, groundY - 26, 18, 26, door);
}

function boat(ctx, x, waterY, scale, hull, sail) {
  ctx.fillStyle = hull;
  ctx.beginPath();
  ctx.moveTo(x - 26 * scale, waterY);
  ctx.lineTo(x + 26 * scale, waterY);
  ctx.lineTo(x + 14 * scale, waterY + 12 * scale);
  ctx.lineTo(x - 14 * scale, waterY + 12 * scale);
  ctx.closePath();
  ctx.fill();
  rect(ctx, x - 1.5 * scale, waterY - 34 * scale, 3 * scale, 34 * scale, '#5b4636');
  ctx.fillStyle = sail;
  ctx.beginPath();
  ctx.moveTo(x + 2 * scale, waterY - 32 * scale);
  ctx.lineTo(x + 22 * scale, waterY - 8 * scale);
  ctx.lineTo(x + 2 * scale, waterY - 8 * scale);
  ctx.closePath();
  ctx.fill();
}

function stall(ctx, x, groundY, w, stripeA, stripeB) {
  const h = 46;
  rect(ctx, x - w / 2, groundY - h, w, h, '#f4e9d8');
  const stripeW = w / 6;
  for (let i = 0; i < 6; i += 1) {
    rect(ctx, x - w / 2 + i * stripeW, groundY - h, stripeW, 16, i % 2 === 0 ? stripeA : stripeB);
  }
  rect(ctx, x - w / 2 - 4, groundY - h - 10, w + 8, 10, '#7a5230');
  rect(ctx, x - w / 2 + 6, groundY - h - 26, 4, 16, '#7a5230');
  rect(ctx, x + w / 2 - 10, groundY - h - 26, 4, 16, '#7a5230');
}

function lamp(ctx, x, groundY, height, colour) {
  rect(ctx, x - 3, groundY - height, 6, height, '#39424f');
  circle(ctx, x, groundY - height - 10, 10, colour);
}

function fountain(ctx, x, groundY, scale, water, stone) {
  ellipse(ctx, x, groundY - 4 * scale, 34 * scale, 9 * scale, stone);
  rect(ctx, x - 5 * scale, groundY - 30 * scale, 10 * scale, 26 * scale, stone);
  ellipse(ctx, x, groundY - 32 * scale, 20 * scale, 6 * scale, water);
  for (let i = -1; i <= 1; i += 1) {
    ellipse(ctx, x + i * 12 * scale, groundY - 42 * scale, 3 * scale, 9 * scale, water);
  }
}

function balloon(ctx, x, y, scale, colour) {
  ellipse(ctx, x, y, 10 * scale, 13 * scale, colour);
  rect(ctx, x - 0.7 * scale, y + 12 * scale, 1.4 * scale, 18 * scale, '#6b7280');
}

function bunting(ctx, x1, y1, x2, y2, colours) {
  const count = 9;
  ctx.strokeStyle = '#39424f';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 + 26, x2, y2);
  ctx.stroke();
  for (let i = 1; i < count; i += 1) {
    const t = i / count;
    const cx = (1 - t) * (1 - t) * x1 + 2 * (1 - t) * t * ((x1 + x2) / 2) + t * t * x2;
    const cy = (1 - t) * (1 - t) * y1 + 2 * (1 - t) * t * ((y1 + y2) / 2 + 26) + t * t * y2;
    const colour = colours[i % colours.length];
    ctx.fillStyle = colour;
    ctx.beginPath();
    ctx.moveTo(cx - 7, cy);
    ctx.lineTo(cx + 7, cy);
    ctx.lineTo(cx, cy + 12);
    ctx.closePath();
    ctx.fill();
  }
}

function drawSky(ctx, random, theme, w, h) {
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, SKY[theme]);
  grad.addColorStop(1, '#ffffff');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  if (theme === 4) {
    circle(ctx, 470, 70, 26, '#f4f1de');
    circle(ctx, 482, 62, 26, SKY[4]);
    for (let i = 0; i < 26; i += 1) {
      circle(ctx, random() * w, random() * 220, random.int(1, 2), '#f4f1de');
    }
  } else {
    circle(ctx, 486, 66, 34, '#fff3b0');
    for (let i = 0; i < 5; i += 1) {
      cloud(ctx, random() * w, 40 + random() * 90, 0.6 + random() * 0.8, '#ffffff');
    }
  }
}

function drawGround(ctx, theme, w, groundY) {
  rect(ctx, 0, groundY, w, 600 - groundY, GROUND[theme]);
  if (theme === 1 || theme === 4) {
    rect(ctx, 0, groundY + 26, w, 600 - groundY - 26, '#4f86c6');
    for (let i = 0; i < 8; i += 1) {
      rect(ctx, 30 + i * 72, groundY + 34 + (i % 3) * 14, 40, 3, '#8fc1e8');
    }
  }
}

// One round's fixed furniture: the parts a difference never touches.
function drawBackdrop(ctx, random, theme) {
  const w = 600;
  const h = 450;
  const groundY = 350;
  drawSky(ctx, random, theme, w, h);
  drawGround(ctx, theme, w, groundY);
  if (theme === 0) {
    house(ctx, 90, groundY, 90, 70, '#f6e7cb', '#c1554a', '#7a5230');
    house(ctx, 300, groundY, 70, 56, '#e9d8b4', '#8a9b43', '#6b4d2f');
    tree(ctx, 500, groundY, 1.2, '#69a84f', '#7a5230');
    tree(ctx, 560, groundY, 0.9, '#82bd5c', '#7a5230');
    bunting(ctx, 20, 120, 580, 120, ['#e4572e', '#ffc914', '#17bebb', '#9b5de5']);
    fountain(ctx, 220, 430, 0.9, '#7fd1e0', '#c9c2b6');
    balloon(ctx, 430, 190, 1, '#f15bb5');
    balloon(ctx, 470, 170, 1, '#00bbf9');
    balloon(ctx, 510, 195, 1, '#fee440');
  } else if (theme === 1) {
    boat(ctx, 120, 380, 1.1, '#8a5a2b', '#f6f1e6');
    boat(ctx, 420, 400, 0.8, '#c1554a', '#ffd166');
    stall(ctx, 300, groundY, 120, '#e4572e', '#f6f1e6');
    lamp(ctx, 60, groundY, 90, '#ffe9a8');
    lamp(ctx, 540, groundY, 90, '#ffe9a8');
    bunting(ctx, 110, 130, 490, 130, ['#e4572e', '#17bebb', '#ffc914']);
    circle(ctx, 240, 250, 22, '#ffd166');
    rect(ctx, 228, 250, 24, 4, '#e4572e');
  } else if (theme === 2) {
    house(ctx, 120, groundY, 110, 84, '#e8c48a', '#a2542c', '#6b4d2f');
    house(ctx, 480, groundY, 96, 72, '#dfb877', '#8a9b43', '#6b4d2f');
    tree(ctx, 300, groundY, 1.3, '#d98e4a', '#7a5230');
    tree(ctx, 360, groundY, 0.8, '#c46a2e', '#7a5230');
    stall(ctx, 210, 430, 110, '#76b041', '#f4e9d8');
    bunting(ctx, 30, 110, 570, 110, ['#a2542c', '#d98e4a', '#ffc914']);
    for (let i = 0; i < 10; i += 1) {
      ellipse(ctx, 60 + i * 50, 430 + (i % 2) * 8, 5, 3, '#b05c1f');
    }
  } else if (theme === 3) {
    house(ctx, 130, groundY, 100, 80, '#dfe8f2', '#7c93b5', '#5b6b8c');
    house(ctx, 470, groundY, 90, 66, '#cfdbea', '#94a8c4', '#5b6b8c');
    tree(ctx, 300, groundY, 1.1, '#e8eef6', '#6b7280');
    for (let i = 0; i < 12; i += 1) {
      circle(ctx, 40 + i * 48, 420 + (i % 3) * 6, 7, '#ffffff');
    }
    lamp(ctx, 220, groundY, 90, '#fff3b0');
    bunting(ctx, 40, 115, 560, 115, ['#7c93b5', '#ffffff', '#f15bb5']);
    star(ctx, 420, 180, 16, '#ffffff');
    star(ctx, 470, 150, 11, '#ffd166');
  } else {
    house(ctx, 110, groundY, 100, 80, '#4a4e7c', '#2b2d4e', '#1a1c33');
    house(ctx, 480, groundY, 90, 70, '#3a3f66', '#23263d', '#1a1c33');
    lamp(ctx, 300, groundY, 100, '#ffe9a8');
    bunting(ctx, 20, 120, 580, 120, ['#f15bb5', '#00bbf9', '#fee440', '#9b5de5']);
    fountain(ctx, 210, 430, 0.9, '#8fc1e8', '#5b6b8c');
    for (let i = 0; i < 8; i += 1) {
      circle(ctx, 70 + i * 60, 160 + (i % 3) * 30, 2, '#fff3b0');
    }
  }
}

// The marks a difference can touch. Each entry has a base position and a `paint` that
// draws it with the given variant: variant 0 is the left picture, variant 1 the right one.
// A difference is declared only where a real change is visible: colour, size, count or kind.

const MARKS = {
  balloonColour: (ctx, x, y) => balloon(ctx, x, y, 1.1, '#f15bb5'),
  sunColour: (ctx, x, y) => circle(ctx, x, y, 30, '#fff3b0'),
  cloudCount: (ctx, x, y) => {
    cloud(ctx, x, y, 0.9, '#ffffff');
    cloud(ctx, x + 44, y + 10, 0.7, '#ffffff');
  },
  windowLit: (ctx, x, y) => {
    rect(ctx, x - 12, y - 12, 24, 24, '#5b6b8c');
    rect(ctx, x - 9, y - 9, 18, 18, '#ffe9a8');
  },
  doorColour: (ctx, x, y) => rect(ctx, x - 10, y - 26, 20, 26, '#7a5230'),
  roofColour: (ctx, x, y) => {
    ctx.fillStyle = '#c1554a';
    ctx.beginPath();
    ctx.moveTo(x - 26, y);
    ctx.lineTo(x, y - 26);
    ctx.lineTo(x + 26, y);
    ctx.closePath();
    ctx.fill();
  },
  treeFruit: (ctx, x, y) => {
    ellipse(ctx, x, y, 26, 30, '#69a84f');
    circle(ctx, x - 8, y - 6, 4, '#e4572e');
    circle(ctx, x + 9, y + 2, 4, '#e4572e');
  },
  flowerPot: (ctx, x, y) => {
    rect(ctx, x - 8, y - 10, 16, 10, '#b5651d');
    circle(ctx, x, y - 14, 7, '#f15bb5');
  },
  flagOnBoat: (ctx, x, y) => {
    rect(ctx, x, y - 30, 3, 30, '#5b4636');
    ctx.fillStyle = '#e4572e';
    ctx.beginPath();
    ctx.moveTo(x + 3, y - 30);
    ctx.lineTo(x + 24, y - 22);
    ctx.lineTo(x + 3, y - 14);
    ctx.closePath();
    ctx.fill();
  },
  sailStripe: (ctx, x, y) => {
    ctx.fillStyle = '#f6f1e6';
    ctx.beginPath();
    ctx.moveTo(x, y - 30);
    ctx.lineTo(x + 26, y - 6);
    ctx.lineTo(x, y - 6);
    ctx.closePath();
    ctx.fill();
    rect(ctx, x + 4, y - 18, 8, 4, '#e4572e');
  },
  buoy: (ctx, x, y) => {
    circle(ctx, x, y, 9, '#e4572e');
    rect(ctx, x - 2, y - 14, 4, 6, '#39424f');
  },
  gullCount: (ctx, x, y) => {
    for (let i = 0; i < 2; i += 1) {
      ctx.strokeStyle = '#39424f';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x + i * 24, y + i * 6, 7, Math.PI * 1.1, Math.PI * 1.9);
      ctx.stroke();
    }
  },
  starCount: (ctx, x, y) => {
    star(ctx, x, y, 12, '#ffd166');
    star(ctx, x + 26, y + 8, 8, '#ffd166');
  },
  snowStack: (ctx, x, y) => {
    circle(ctx, x, y, 11, '#ffffff');
    circle(ctx, x + 20, y + 4, 8, '#ffffff');
  },
  mushroom: (ctx, x, y) => {
    rect(ctx, x - 4, y - 8, 8, 8, '#f4e9d8');
    ellipse(ctx, x, y - 12, 11, 7, '#e4572e');
    circle(ctx, x - 3, y - 14, 2, '#ffffff');
  },
  pumpkin: (ctx, x, y) => {
    ellipse(ctx, x, y, 13, 10, '#d98e4a');
    rect(ctx, x - 1.5, y - 14, 3, 5, '#5b7c3a');
  },
  lantern: (ctx, x, y) => {
    rect(ctx, x - 7, y - 10, 14, 20, '#f15bb5');
    rect(ctx, x - 9, y - 12, 18, 3, '#39424f');
    rect(ctx, x - 9, y + 9, 18, 3, '#39424f');
  },
  maskedFace: (ctx, x, y) => {
    circle(ctx, x, y, 12, '#f4e9d8');
    rect(ctx, x - 10, y - 4, 20, 5, '#39424f');
  },
  iceCream: (ctx, x, y) => {
    ctx.fillStyle = '#d9a066';
    ctx.beginPath();
    ctx.moveTo(x - 8, y);
    ctx.lineTo(x + 8, y);
    ctx.lineTo(x, y + 18);
    ctx.closePath();
    ctx.fill();
    circle(ctx, x, y - 4, 9, '#f7c9d6');
  },
  balloonBunch: (ctx, x, y) => {
    balloon(ctx, x - 14, y, 0.8, '#00bbf9');
    balloon(ctx, x + 14, y, 0.8, '#fee440');
  },
  giftBox: (ctx, x, y) => {
    rect(ctx, x - 12, y - 12, 24, 18, '#9b5de5');
    rect(ctx, x - 2, y - 12, 4, 18, '#ffd166');
    rect(ctx, x - 12, y - 6, 24, 4, '#ffd166');
  },
  pinwheel: (ctx, x, y) => {
    const colours = ['#e4572e', '#17bebb', '#ffc914', '#76b041'];
    for (let i = 0; i < 4; i += 1) {
      ctx.fillStyle = colours[i];
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.arc(x, y, 14, (Math.PI / 2) * i, (Math.PI / 2) * i + Math.PI / 2);
      ctx.closePath();
      ctx.fill();
    }
  },
  buntingFlag: (ctx, x, y) => {
    ctx.fillStyle = '#e4572e';
    ctx.beginPath();
    ctx.moveTo(x - 8, y);
    ctx.lineTo(x + 8, y);
    ctx.lineTo(x, y + 13);
    ctx.closePath();
    ctx.fill();
  },
  smokePuff: (ctx, x, y) => {
    cloud(ctx, x, y, 0.5, '#cfd6de');
    cloud(ctx, x + 8, y - 16, 0.38, '#dfe4ea');
  },
  puddle: (ctx, x, y) => ellipse(ctx, x, y, 18, 5, '#8fc1e8'),
  crateCount: (ctx, x, y) => {
    rect(ctx, x - 20, y - 12, 16, 14, '#b5651d');
    rect(ctx, x, y - 12, 16, 14, '#b5651d');
  },
  corkFloat: (ctx, x, y) => {
    circle(ctx, x, y, 8, '#fee440');
    circle(ctx, x, y, 3, '#e4572e');
  },
  telescope: (ctx, x, y) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-0.5);
    rect(ctx, -4, -22, 8, 34, '#5b6b8c');
    rect(ctx, -6, -26, 12, 6, '#ffd166');
    ctx.restore();
  },
};

// Which marks belong to which round, and where each one stands. A mark's variant changes
// exactly one visible thing, so every declared difference is fair: findable, never ambiguous.
const ROUND_MARKS = [
  [
    { mark: 'balloonColour', x: 430, y: 190 },
    { mark: 'sunColour', x: 486, y: 66 },
    { mark: 'windowLit', x: 90, y: 250 },
    { mark: 'doorColour', x: 90, y: 324 },
    { mark: 'treeFruit', x: 500, y: 280 },
    { mark: 'flowerPot', x: 380, y: 436 },
    { mark: 'gullCount', x: 180, y: 160 },
    { mark: 'puddle', x: 330, y: 432 },
    { mark: 'buntingFlag', x: 300, y: 133 },
    { mark: 'iceCream', x: 260, y: 400 },
    { mark: 'smokePuff', x: 90, y: 170 },
  ],
  [
    { mark: 'flagOnBoat', x: 120, y: 378 },
    { mark: 'sailStripe', x: 430, y: 372 },
    { mark: 'buoy', x: 250, y: 415 },
    { mark: 'gullCount', x: 300, y: 150 },
    { mark: 'sunColour', x: 486, y: 66 },
    { mark: 'crateCount', x: 340, y: 330 },
    { mark: 'corkFloat', x: 500, y: 420 },
    { mark: 'buntingFlag', x: 300, y: 143 },
    { mark: 'puddle', x: 200, y: 340 },
    { mark: 'iceCream', x: 280, y: 330 },
    { mark: 'lampGlow', x: 60, y: 250 },
  ],
  [
    { mark: 'pumpkin', x: 160, y: 420 },
    { mark: 'treeFruit', x: 300, y: 260 },
    { mark: 'mushroom', x: 420, y: 430 },
    { mark: 'roofColour', x: 120, y: 276 },
    { mark: 'windowLit', x: 480, y: 300 },
    { mark: 'buntingFlag', x: 300, y: 123 },
    { mark: 'leafPile', x: 250, y: 440 },
    { mark: 'sunColour', x: 486, y: 66 },
    { mark: 'gullCount', x: 380, y: 150 },
    { mark: 'crateCount', x: 210, y: 376 },
    { mark: 'pinwheel', x: 520, y: 250 },
  ],
  [
    { mark: 'snowStack', x: 200, y: 430 },
    { mark: 'starCount', x: 420, y: 180 },
    { mark: 'windowLit', x: 130, y: 290 },
    { mark: 'doorColour', x: 130, y: 324 },
    { mark: 'lampGlow', x: 220, y: 250 },
    { mark: 'buntingFlag', x: 300, y: 128 },
    { mark: 'puddle', x: 360, y: 435 },
    { mark: 'mushroom', x: 520, y: 350 },
    { mark: 'gullCount', x: 330, y: 140 },
    { mark: 'iceCream', x: 270, y: 320 },
    { mark: 'giftBox', x: 470, y: 330 },
  ],
  [
    { mark: 'lantern', x: 150, y: 250 },
    { mark: 'balloonBunch', x: 480, y: 200 },
    { mark: 'maskedFace', x: 300, y: 420 },
    { mark: 'starCount', x: 240, y: 160 },
    { mark: 'fountainJet', x: 210, y: 390 },
    { mark: 'buntingFlag', x: 300, y: 133 },
    { mark: 'windowLit', x: 110, y: 290 },
    { mark: 'gullCount', x: 400, y: 140 },
    { mark: 'giftBox', x: 520, y: 420 },
    { mark: 'puddle', x: 330, y: 440 },
    { mark: 'pinwheel', x: 60, y: 300 },
  ],
  [
    { mark: 'balloonColour', x: 160, y: 200 },
    { mark: 'sunColour', x: 486, y: 66 },
    { mark: 'treeFruit', x: 500, y: 280 },
    { mark: 'doorColour', x: 300, y: 330 },
    { mark: 'roofColour', x: 480, y: 280 },
    { mark: 'giftBox', x: 380, y: 430 },
    { mark: 'starCount', x: 300, y: 150 },
    { mark: 'lantern', x: 220, y: 250 },
    { mark: 'maskedFace', x: 260, y: 420 },
    { mark: 'iceCream', x: 420, y: 400 },
    { mark: 'pinwheel', x: 560, y: 300 },
    { mark: 'gullCount', x: 100, y: 150 },
  ],
];

// Extra paints referenced above but defined here to keep MARKS self-contained.
MARKS.lampGlow = (ctx, x, y) => {
  lamp(ctx, x, y + 90, 90, '#ffe9a8');
  circle(ctx, x, y - 10, 10, '#fff3b0');
};
MARKS.leafPile = (ctx, x, y) => {
  for (let i = 0; i < 6; i += 1) {
    ellipse(ctx, x - 20 + i * 8, y - (i % 2) * 5, 8, 4, i % 2 === 0 ? '#b05c1f' : '#d98e4a');
  }
};
MARKS.fountainJet = (ctx, x, y) => {
  for (let i = -1; i <= 1; i += 1) {
    ellipse(ctx, x + i * 12, y, 3, 10, '#7fd1e0');
  }
};

// The variant-1 repaint of each mark: what the player must spot.
const VARIANTS = {
  balloonColour: (ctx, x, y) => balloon(ctx, x, y, 1.1, '#00bbf9'),
  sunColour: (ctx, x, y) => circle(ctx, x, y, 30, '#f4a261'),
  cloudCount: (ctx, x, y) => cloud(ctx, x, y, 0.9, '#ffffff'),
  windowLit: (ctx, x, y) => {
    rect(ctx, x - 12, y - 12, 24, 24, '#5b6b8c');
    rect(ctx, x - 9, y - 9, 18, 18, '#3a3f66');
  },
  doorColour: (ctx, x, y) => rect(ctx, x - 10, y - 26, 20, 26, '#17bebb'),
  roofColour: (ctx, x, y) => {
    ctx.fillStyle = '#8a9b43';
    ctx.beginPath();
    ctx.moveTo(x - 26, y);
    ctx.lineTo(x, y - 26);
    ctx.lineTo(x + 26, y);
    ctx.closePath();
    ctx.fill();
  },
  treeFruit: (ctx, x, y) => {
    ellipse(ctx, x, y, 26, 30, '#69a84f');
    circle(ctx, x - 8, y - 6, 4, '#fee440');
    circle(ctx, x + 9, y + 2, 4, '#fee440');
  },
  flowerPot: (ctx, x, y) => {
    rect(ctx, x - 8, y - 10, 16, 10, '#b5651d');
    circle(ctx, x, y - 14, 7, '#fee440');
  },
  flagOnBoat: (ctx, x, y) => {
    rect(ctx, x, y - 30, 3, 30, '#5b4636');
    ctx.fillStyle = '#17bebb';
    ctx.beginPath();
    ctx.moveTo(x + 3, y - 30);
    ctx.lineTo(x + 24, y - 22);
    ctx.lineTo(x + 3, y - 14);
    ctx.closePath();
    ctx.fill();
  },
  sailStripe: (ctx, x, y) => {
    ctx.fillStyle = '#f6f1e6';
    ctx.beginPath();
    ctx.moveTo(x, y - 30);
    ctx.lineTo(x + 26, y - 6);
    ctx.lineTo(x, y - 6);
    ctx.closePath();
    ctx.fill();
  },
  buoy: (ctx, x, y) => {
    circle(ctx, x, y, 9, '#17bebb');
    rect(ctx, x - 2, y - 14, 4, 6, '#39424f');
  },
  gullCount: (ctx, x, y) => {
    ctx.strokeStyle = '#39424f';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 7, Math.PI * 1.1, Math.PI * 1.9);
    ctx.stroke();
  },
  starCount: (ctx, x, y) => star(ctx, x, y, 12, '#ffd166'),
  snowStack: (ctx, x, y) => circle(ctx, x, y, 11, '#ffffff'),
  mushroom: (ctx, x, y) => {
    rect(ctx, x - 4, y - 8, 8, 8, '#f4e9d8');
    ellipse(ctx, x, y - 12, 11, 7, '#9b5de5');
    circle(ctx, x - 3, y - 14, 2, '#ffffff');
  },
  pumpkin: (ctx, x, y) => {
    ellipse(ctx, x, y, 13, 10, '#76b041');
    rect(ctx, x - 1.5, y - 14, 3, 5, '#5b7c3a');
  },
  lantern: (ctx, x, y) => {
    rect(ctx, x - 7, y - 10, 14, 20, '#00bbf9');
    rect(ctx, x - 9, y - 12, 18, 3, '#39424f');
    rect(ctx, x - 9, y + 9, 18, 3, '#39424f');
  },
  maskedFace: (ctx, x, y) => {
    circle(ctx, x, y, 12, '#f4e9d8');
    rect(ctx, x - 10, y - 4, 20, 5, '#f15bb5');
  },
  iceCream: (ctx, x, y) => {
    ctx.fillStyle = '#d9a066';
    ctx.beginPath();
    ctx.moveTo(x - 8, y);
    ctx.lineTo(x + 8, y);
    ctx.lineTo(x, y + 18);
    ctx.closePath();
    ctx.fill();
    circle(ctx, x, y - 4, 9, '#76b041');
  },
  balloonBunch: (ctx, x, y) => {
    balloon(ctx, x - 14, y, 0.8, '#f15bb5');
    balloon(ctx, x + 14, y, 0.8, '#fee440');
  },
  giftBox: (ctx, x, y) => {
    rect(ctx, x - 12, y - 12, 24, 18, '#17bebb');
    rect(ctx, x - 2, y - 12, 4, 18, '#ffd166');
    rect(ctx, x - 12, y - 6, 24, 4, '#ffd166');
  },
  pinwheel: (ctx, x, y) => {
    const colours = ['#9b5de5', '#f15bb5', '#00bbf9', '#fee440'];
    for (let i = 0; i < 4; i += 1) {
      ctx.fillStyle = colours[i];
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.arc(x, y, 14, (Math.PI / 2) * i, (Math.PI / 2) * i + Math.PI / 2);
      ctx.closePath();
      ctx.fill();
    }
  },
  buntingFlag: (ctx, x, y) => {
    ctx.fillStyle = '#17bebb';
    ctx.beginPath();
    ctx.moveTo(x - 8, y);
    ctx.lineTo(x + 8, y);
    ctx.lineTo(x, y + 13);
    ctx.closePath();
    ctx.fill();
  },
  smokePuff: (ctx, x, y) => {
    cloud(ctx, x, y, 0.5, '#b0bec5');
  },
  puddle: (ctx, x, y) => ellipse(ctx, x, y, 18, 5, '#4f86c6'),
  crateCount: (ctx, x, y) => rect(ctx, x - 20, y - 12, 16, 14, '#b5651d'),
  corkFloat: (ctx, x, y) => {
    circle(ctx, x, y, 8, '#e4572e');
    circle(ctx, x, y, 3, '#fee440');
  },
  telescope: (ctx, x, y) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(0.5);
    rect(ctx, -4, -22, 8, 34, '#5b6b8c');
    rect(ctx, -6, -26, 12, 6, '#ffd166');
    ctx.restore();
  },
  lampGlow: (ctx, x, y) => {
    lamp(ctx, x, y + 90, 90, '#ff9f9f');
    circle(ctx, x, y - 10, 10, '#ff9f9f');
  },
  leafPile: (ctx, x, y) => {
    for (let i = 0; i < 6; i += 1) {
      ellipse(ctx, x - 20 + i * 8, y - (i % 2) * 5, 8, 4, i % 2 === 0 ? '#8a9b43' : '#76b041');
    }
  },
  fountainJet: (ctx, x, y) => {
    for (let i = 0; i <= 1; i += 1) {
      ellipse(ctx, x + i * 12, y, 3, 10, '#7fd1e0');
    }
  },
};

/**
 * Paint one round's picture. `round` is 0-based; `side` is 0 (left, the original) or 1
 * (right, with the differences). Returns the difference list for the round: each entry
 * is { x, y, radius } in scene coordinates, centred on the changed mark.
 */
export function paintScene(ctx, round, side, seed) {
  const random = createRandom(seed * 7919 + round * 104729 + 17);
  const marks = ROUND_MARKS[round % ROUND_MARKS.length];
  const picked = marks.slice();
  // Shuffle which marks carry a difference, so the same round differs run to run.
  for (let i = picked.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const tmp = picked[i];
    picked[i] = picked[j];
    picked[j] = tmp;
  }
  const active = picked.slice(0, 7);
  ctx.clearRect(0, 0, 600, 450);
  drawBackdrop(ctx, random, round % 6);
  for (const item of active) {
    const paint = side === 0 ? MARKS[item.mark] : (VARIANTS[item.mark] || MARKS[item.mark]);
    if (paint) paint(ctx, item.x, item.y);
  }
  return active.map((item) => ({ x: item.x, y: item.y, radius: 34, mark: item.mark }));
}

/**
 * The differences of a round, in scene coordinates, without painting: the engine asks for
 * these to place its markers, and the painter asks for them to know what to change.
 */
export function roundDifferences(round, seed) {
  const random = createRandom(seed * 7919 + round * 104729 + 17);
  const marks = ROUND_MARKS[round % ROUND_MARKS.length];
  const picked = marks.slice();
  for (let i = picked.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const tmp = picked[i];
    picked[i] = picked[j];
    picked[j] = tmp;
  }
  return picked.slice(0, 7).map((item) => ({ x: item.x, y: item.y, radius: 34, mark: item.mark }));
}