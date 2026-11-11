// Quick checks that the physics behaves. Run with: node test.js
const assert = require('assert');
const { step, GROUND, NOTHING, ENGINE } = require('./physics.js');

// Doing nothing: gravity pulls the rocket down.
let r = step({ x: 300, y: 100, vx: 0, vy: 0, angle: 0 }, NOTHING).rocket;
assert(r.y > 100, 'gravity should pull the rocket down');

// Engine while upright: rocket gets pushed up.
r = step({ x: 300, y: 100, vx: 0, vy: 0, angle: 0, fuel: 10 }, ENGINE).rocket;
assert(r.vy < 0, 'engine should push the rocket up');
assert.equal(r.fuel, 9, 'engine should burn 1 fuel');

// Empty tank: engine does nothing, gravity wins.
r = step({ x: 300, y: 100, vx: 0, vy: 0, angle: 0, fuel: 0 }, ENGINE).rocket;
assert(r.vy > 0, 'no fuel means no thrust');

// Slow, upright, on the pad: landed.
assert.equal(step({ x: 300, y: GROUND - 0.5, vx: 0, vy: 0.5, angle: 0 }, NOTHING).result, 'landed');

// Too fast: crashed.
assert.equal(step({ x: 300, y: GROUND - 1, vx: 0, vy: 5, angle: 0 }, NOTHING).result, 'crashed');

// Gentle but off the pad: crashed.
assert.equal(step({ x: 50, y: GROUND - 0.5, vx: 0, vy: 0.5, angle: 0 }, NOTHING).result, 'crashed');

// Rewards: +100 landing, -100 crash, small cost for burning fuel.
assert.equal(step({ x: 300, y: GROUND - 0.5, vx: 0, vy: 0.5, angle: 0, fuel: 0 }, NOTHING).reward, 100);
assert.equal(step({ x: 300, y: GROUND - 1, vx: 0, vy: 5, angle: 0, fuel: 0 }, NOTHING).reward, -100);
assert.equal(step({ x: 300, y: 100, vx: 0, vy: 0, angle: 0, fuel: 10 }, ENGINE).reward, -0.3);
assert.equal(step({ x: 300, y: 100, vx: 0, vy: 0, angle: 0, fuel: 10 }, NOTHING).reward, 0);

console.log('All physics tests passed.');
