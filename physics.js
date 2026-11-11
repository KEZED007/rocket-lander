// The rules of the rocket world. No drawing here, just numbers in, numbers out.

// --- Knobs to experiment with ---
const GRAVITY = 0.05;     // how hard the ground pulls the rocket down, every frame
const THRUST = 0.12;      // how hard the main engine pushes
const TURN_SPEED = 0.05;  // how fast the rocket rotates (radians per frame)
const SAFE_SPEED = 1.5;   // fastest touchdown that still counts as a landing
const SAFE_ANGLE = 0.3;   // most tilt that still counts as upright (0.3 rad ≈ 17°)
const FUEL_START = 150;   // frames of engine burn in a full tank

// --- The world's size (in pixels). y grows DOWNWARD, like on a screen. ---
const WIDTH = 600, HEIGHT = 400, GROUND = 370;
const PAD_LEFT = 250, PAD_RIGHT = 350;

// The 4 things a pilot can do each frame. You pick with keys now; the AI picks later.
const NOTHING = 0, ENGINE = 1, TURN_LEFT = 2, TURN_RIGHT = 3;

// A fresh rocket near the top, at a random spot, drifting a little sideways.
function newRocket() {
  return { x: 100 + Math.random() * 400, y: 60, vx: (Math.random() - 0.5) * 2, vy: 0, angle: 0, fuel: FUEL_START };
}

// One tick of time: rocket now + action -> rocket next frame, and whether it's over.
// result is null (still flying), 'landed' or 'crashed'.
function step(rocket, action) {
  let { x, y, vx, vy, angle, fuel } = rocket;

  if (action === TURN_LEFT) angle -= TURN_SPEED;
  if (action === TURN_RIGHT) angle += TURN_SPEED;
  if (action === ENGINE && fuel > 0) {
    // push in the direction the nose points (angle 0 = straight up)
    vx += Math.sin(angle) * THRUST;
    vy -= Math.cos(angle) * THRUST;
    fuel -= 1;
  }
  vy += GRAVITY;
  x += vx;
  y += vy;

  let result = null;
  if (y >= GROUND) {
    y = GROUND;
    const onPad = x >= PAD_LEFT && x <= PAD_RIGHT;
    const gentle = Math.hypot(vx, vy) <= SAFE_SPEED;
    const upright = Math.abs(angle) <= SAFE_ANGLE;
    result = onPad && gentle && upright ? 'landed' : 'crashed';
  } else if (x < 0 || x > WIDTH || y < -100) {
    result = 'crashed'; // flew off the screen
  }
  return { rocket: { x, y, vx, vy, angle, fuel }, result };
}

// Lets test.js load this file in Node. Browsers ignore it.
if (typeof module !== 'undefined') module.exports = { step, newRocket, GROUND, NOTHING, ENGINE, TURN_LEFT, TURN_RIGHT };
