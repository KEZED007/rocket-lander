// Draws the world and lets you fly with the keyboard. The rules live in physics.js.

const canvas = document.getElementById('world');
const ctx = canvas.getContext('2d');

let rocket = newRocket();
let result = null;
let action = NOTHING;
let score = 0; // total reward this flight

// AI mode: practice in the background, show the AI's current best flying on screen.
const PRACTICE_PER_FRAME = 20; // practice flights per screen frame (~60 frames a second)
let aiFlying = false;
let practiceFlights = 0;
let recentLandings = []; // true/false for the last 100 practice flights
let pauseFrames = 0;     // short pause after each AI flight so you can see how it ended

const aiButton = document.getElementById('ai');
aiButton.onclick = () => {
  aiFlying = !aiFlying;
  aiButton.textContent = aiFlying ? 'Let me fly' : 'Let the AI learn';
  aiButton.blur(); // so the keys go to the game, not the button
  restart();
};

function restart() { rocket = newRocket(); result = null; score = 0; pauseFrames = 0; }

// Remember which keys are held down. Letters are stored lowercase so Caps Lock doesn't matter.
const keys = {};
const keyName = e => (e.key.length === 1 ? e.key.toLowerCase() : e.key);
addEventListener('keydown', e => {
  keys[keyName(e)] = true;
  if (keyName(e) === 'r') restart();
  if (e.key === 'ArrowUp') e.preventDefault(); // stop the page scrolling
});
addEventListener('keyup', e => { keys[keyName(e)] = false; });

// Obstacles with the mouse or a finger: click empty sky to add a block,
// drag a block to move it, double-click a block to remove it.
const BLOCK_W = 100, BLOCK_H = 18;
let dragging = null, grabX = 0, grabY = 0; // the block being dragged, and where on it you grabbed

// Mouse position in game pixels (the canvas may be drawn smaller, e.g. on a phone).
function pointerPos(e) {
  const box = canvas.getBoundingClientRect();
  return { x: (e.clientX - box.left) * WIDTH / box.width, y: (e.clientY - box.top) * HEIGHT / box.height };
}
const blockAt = p => obstacles.findLast(o => p.x >= o.x && p.x <= o.x + o.w && p.y >= o.y && p.y <= o.y + o.h);
// Keep a block inside the sky, above the ground.
function placeBlock(o, x, y) {
  o.x = Math.max(0, Math.min(WIDTH - o.w, x));
  o.y = Math.max(0, Math.min(GROUND - o.h, y));
}

canvas.addEventListener('pointerdown', e => {
  const p = pointerPos(e);
  dragging = blockAt(p);
  if (!dragging) {
    dragging = { x: 0, y: 0, w: BLOCK_W, h: BLOCK_H };
    placeBlock(dragging, p.x - BLOCK_W / 2, p.y - BLOCK_H / 2);
    obstacles.push(dragging);
  }
  grabX = p.x - dragging.x;
  grabY = p.y - dragging.y;
  canvas.setPointerCapture(e.pointerId); // keep dragging even if the pointer leaves the canvas
});
canvas.addEventListener('pointermove', e => {
  const p = pointerPos(e);
  if (dragging) placeBlock(dragging, p.x - grabX, p.y - grabY);
  canvas.style.cursor = dragging ? 'grabbing' : blockAt(p) ? 'grab' : 'crosshair';
});
canvas.addEventListener('pointerup', () => { dragging = null; });
canvas.addEventListener('dblclick', e => {
  const o = blockAt(pointerPos(e));
  if (o) obstacles.splice(obstacles.indexOf(o), 1);
});
document.getElementById('clearBlocks').onclick = () => { obstacles.length = 0; };

// Turn held keys into ONE action, because the AI will also pick one action per frame.
// ↑ = engine, A = turn left, D = turn right.
function actionFromKeys() {
  if (keys.ArrowUp) return ENGINE;
  if (keys.a) return TURN_LEFT;
  if (keys.d) return TURN_RIGHT;
  return NOTHING;
}

function draw() {
  ctx.fillStyle = '#0b1020';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // ground and landing pad
  ctx.fillStyle = '#444';
  ctx.fillRect(0, GROUND, WIDTH, HEIGHT - GROUND);
  ctx.fillStyle = '#3c3';
  ctx.fillRect(PAD_LEFT, GROUND, PAD_RIGHT - PAD_LEFT, 6);

  // obstacles
  ctx.fillStyle = '#8a7a66';
  ctx.strokeStyle = '#c8b89f';
  for (const o of obstacles) { ctx.fillRect(o.x, o.y, o.w, o.h); ctx.strokeRect(o.x + 0.5, o.y + 0.5, o.w - 1, o.h - 1); }

  // rocket: move to its position, tilt it, then draw it pointing up
  ctx.save();
  ctx.translate(rocket.x, rocket.y);
  ctx.rotate(rocket.angle);
  if (action === ENGINE && rocket.fuel > 0 && !result) {
    ctx.fillStyle = '#f80';
    ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(5, 0); ctx.lineTo(0, 14 + Math.random() * 6); ctx.fill();
  }
  ctx.fillStyle = result === 'crashed' ? '#e33' : document.getElementById('rocketColor').value;
  ctx.beginPath(); ctx.moveTo(0, -30); ctx.lineTo(8, 0); ctx.lineTo(-8, 0); ctx.fill();
  ctx.restore();

  // dashboard: green means "safe to land right now"
  const speed = Math.hypot(rocket.vx, rocket.vy);
  ctx.font = '14px monospace';
  ctx.fillStyle = speed <= SAFE_SPEED ? '#3c3' : '#e33';
  ctx.fillText(`speed ${speed.toFixed(2)} (safe ≤ ${SAFE_SPEED})`, 10, 20);
  ctx.fillStyle = Math.abs(rocket.angle) <= SAFE_ANGLE ? '#3c3' : '#e33';
  ctx.fillText(`tilt  ${rocket.angle.toFixed(2)} (safe ≤ ±${SAFE_ANGLE})`, 10, 40);

  // fuel gauge: a bar that shrinks as you burn
  ctx.fillStyle = '#ccc';
  ctx.fillText('fuel', WIDTH - 170, 20);
  ctx.strokeStyle = '#ccc';
  ctx.strokeRect(WIDTH - 130, 9, 120, 12);
  ctx.fillStyle = rocket.fuel > FUEL_START * 0.2 ? '#fc3' : '#e33';
  ctx.fillRect(WIDTH - 130, 9, 120 * Math.min(1, rocket.fuel / FUEL_START), 12); // min: tank may shrink mid-flight
  ctx.fillStyle = '#ccc';
  ctx.fillText(`score ${score.toFixed(1)}`, WIDTH - 170, 40);

  if (aiFlying) {
    const rate = recentLandings.filter(Boolean).length / Math.max(1, recentLandings.length);
    ctx.font = '14px monospace';
    ctx.fillStyle = '#fff';
    ctx.fillText(`AI practice flights: ${practiceFlights} · landed ${Math.round(rate * 100)}% of last 100`, 10, HEIGHT - 10);
  }

  if (result) {
    ctx.font = '28px sans-serif';
    ctx.fillStyle = result === 'landed' ? '#3c3' : '#e33';
    ctx.fillText(result === 'landed' ? 'Landed!' : 'Crashed!', WIDTH / 2 - 55, 150);
    if (!aiFlying) {
      ctx.font = '14px sans-serif';
      ctx.fillText('press R to fly again', WIDTH / 2 - 62, 175);
    }
  }
}

// The game loop: about 60 times a second, apply the physics, then draw.
function loop() {
  if (aiFlying) {
    for (let i = 0; i < PRACTICE_PER_FRAME; i++) {
      const flight = runEpisode();
      recordFlight(flight.score, flight.result === 'landed');
      recentLandings.push(flight.result === 'landed');
      if (recentLandings.length > 100) recentLandings.shift();
      practiceFlights++;
    }
    if (result && ++pauseFrames > 60) restart();
  }
  if (!result) {
    action = aiFlying ? bestAction(situation(rocket)) : actionFromKeys();
    let reward;
    ({ rocket, result, reward } = step(rocket, action));
    score += reward;
  }
  draw();
  drawChart();
  requestAnimationFrame(loop);
}
loop();
