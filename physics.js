// The rules of the rocket world. No drawing here, just numbers in, numbers out.

// --- Knobs to experiment with ---
let GRAVITY = 0.05;     // how hard the ground pulls the rocket down, every frame
let THRUST = 0.12;      // how hard the main engine pushes
let TURN_SPEED = 0.05;  // how fast the rocket rotates (radians per frame)
let SAFE_SPEED = 1.5;   // fastest touchdown that still counts as a landing
let SAFE_ANGLE = 0.3;   // most tilt that still counts as upright (0.3 rad ≈ 17°)
let FUEL_START = 150;   // frames of engine burn in a full tank

// --- Rewards: the score the AI will try to make as big as possible ---
let LAND_REWARD = 100;    // touched down safely on the pad
let CRASH_PENALTY = -100; // hit too hard, off the pad, tilted, or flew away
let FUEL_COST = -0.3;     // every frame the engine burns

// --- The world's size (in pixels). y grows DOWNWARD, like on a screen. ---
const WIDTH = 600, HEIGHT = 400, GROUND = 370;
const PAD_LEFT = 250, PAD_RIGHT = 350;

// Obstacles: rectangles in the sky (x, y = top-left corner). Touching one is a crash.
// Players can add, drag and remove them, so this list changes while the game runs.
const obstacles = [{ x: 380, y: 230, w: 110, h: 18 }];

// Is the point (px, py) inside any obstacle?
function hitsObstacle(px, py) {
  return obstacles.some(o => px >= o.x && px <= o.x + o.w && py >= o.y && py <= o.y + o.h);
}

// The 4 things a pilot can do each frame. You pick with keys now; the AI picks later.
const NOTHING = 0, ENGINE = 1, TURN_LEFT = 2, TURN_RIGHT = 3;

// A fresh rocket near the top, at a random spot, drifting a little sideways.
function newRocket() {
  return { x: 100 + Math.random() * 400, y: 60, vx: (Math.random() - 0.5) * 2, vy: 0, angle: 0, fuel: FUEL_START };
}

// One tick of time: rocket now + action -> rocket next frame, and whether it's over.
// result is null (still flying), 'landed' or 'crashed'. reward is this frame's score.
function step(rocket, action) {
  let { x, y, vx, vy, angle, fuel } = rocket;
  let reward = 0;

  if (action === TURN_LEFT) angle -= TURN_SPEED;
  if (action === TURN_RIGHT) angle += TURN_SPEED;
  if (action === ENGINE && fuel > 0) {
    // push in the direction the nose points (angle 0 = straight up)
    vx += Math.sin(angle) * THRUST;
    vy -= Math.cos(angle) * THRUST;
    fuel -= 1;
    reward += FUEL_COST;
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
  } else if (hitsObstacle(x, y) || hitsObstacle(x + Math.sin(angle) * 30, y - Math.cos(angle) * 30)) {
    // shortcut: only the feet and the nose tip are checked, so a block could clip the rocket's side; fine at these speeds
    result = 'crashed';
  }
  if (result === 'landed') reward += LAND_REWARD;
  if (result === 'crashed') reward += CRASH_PENALTY;
  return { rocket: { x, y, vx, vy, angle, fuel }, result, reward };
}
