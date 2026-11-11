// Draws the world and lets you fly with the keyboard. The rules live in physics.js.

const canvas = document.getElementById('world');
const ctx = canvas.getContext('2d');

let rocket = newRocket();
let result = null;
let action = NOTHING;

// Remember which keys are held down.
const keys = {};
addEventListener('keydown', e => {
  keys[e.key] = true;
  if (e.key === 'r') { rocket = newRocket(); result = null; }
  if (e.key.startsWith('Arrow')) e.preventDefault(); // stop the page scrolling
});
addEventListener('keyup', e => { keys[e.key] = false; });

// Turn held keys into ONE action, because the AI will also pick one action per frame.
function actionFromKeys() {
  if (keys.ArrowUp) return ENGINE;
  if (keys.ArrowLeft) return TURN_LEFT;
  if (keys.ArrowRight) return TURN_RIGHT;
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

  // rocket: move to its position, tilt it, then draw it pointing up
  ctx.save();
  ctx.translate(rocket.x, rocket.y);
  ctx.rotate(rocket.angle);
  if (action === ENGINE && rocket.fuel > 0 && !result) {
    ctx.fillStyle = '#f80';
    ctx.beginPath(); ctx.moveTo(-5, 0); ctx.lineTo(5, 0); ctx.lineTo(0, 14 + Math.random() * 6); ctx.fill();
  }
  ctx.fillStyle = result === 'crashed' ? '#e33' : '#ddd';
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
  ctx.fillRect(WIDTH - 130, 9, 120 * rocket.fuel / FUEL_START, 12);

  if (result) {
    ctx.font = '28px sans-serif';
    ctx.fillStyle = result === 'landed' ? '#3c3' : '#e33';
    ctx.fillText(result === 'landed' ? 'Landed!' : 'Crashed!', WIDTH / 2 - 55, 150);
    ctx.font = '14px sans-serif';
    ctx.fillText('press R to fly again', WIDTH / 2 - 62, 175);
  }
}

// The game loop: about 60 times a second, apply the physics, then draw.
function loop() {
  if (!result) {
    action = actionFromKeys();
    ({ rocket, result } = step(rocket, action));
  }
  draw();
  requestAnimationFrame(loop);
}
loop();
