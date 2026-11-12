// Quick checks that the physics and the AI behave. Run with: node test.js
const assert = require('assert');
const fs = require('fs'), vm = require('vm');
// Load the files like the browser does: as plain scripts sharing one world.
for (const f of ['physics.js', 'agent.js']) vm.runInThisContext(fs.readFileSync(`${__dirname}/${f}`, 'utf8'));

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

// Obstacles: feet or nose touching a block is a crash, missing it is fine.
const saved = obstacles.splice(0, obstacles.length, { x: 100, y: 200, w: 50, h: 20 });
assert.equal(step({ x: 120, y: 199.5, vx: 0, vy: 1, angle: 0, fuel: 0 }, NOTHING).result, 'crashed', 'feet hit the top');
assert.equal(step({ x: 120, y: 252, vx: 0, vy: -3, angle: 0, fuel: 0 }, NOTHING).result, 'crashed', 'nose hit the bottom');
assert.equal(step({ x: 170, y: 199.5, vx: 0, vy: 1, angle: 0, fuel: 0 }, NOTHING).result, null, 'beside the block is safe');
assert.equal(step({ x: 120, y: 199.5, vx: 0, vy: 1, angle: 0, fuel: 0 }, NOTHING).reward, CRASH_PENALTY);
obstacles.splice(0, obstacles.length, ...saved);

console.log('All physics tests passed.');

// Buckets: which slot a number falls into.
assert.equal(bucket(-5, [-1, 0, 1]), 0);
assert.equal(bucket(0.5, [-1, 0, 1]), 2);
assert.equal(bucket(9, [-1, 0, 1]), 3);

// The AI's eyes: no block, a near block to dodge left, a far block to dodge right.
const kept = obstacles.splice(0, obstacles.length);
assert.equal(blockBelow({ x: 300, y: 100 }), 0, 'nothing below');
obstacles.push({ x: 280, y: 120, w: 100, h: 18 });
assert.equal(blockBelow({ x: 300, y: 100 }), 1, 'near, left of centre: dodge left');
assert.equal(blockBelow({ x: 360, y: 10 }), 6, 'far, right of centre: dodge right');
assert.equal(blockBelow({ x: 200, y: 100 }), 0, 'block is off to the side');
obstacles.splice(0, obstacles.length, ...kept);

// Learning rule: a guess of 0 moves 10% of the way toward a final reward of 10.
learn('test', ENGINE, 10, 'test', true);
assert.equal(qTable.test[ENGINE], 1);

// The AI really learns: after 100,000 practice flights it should land sometimes.
for (let i = 0; i < 100000; i++) runEpisode(true);
let landed = 0;
for (let i = 0; i < 500; i++) if (runEpisode(false).result === 'landed') landed++;
console.log(`AI landed ${landed / 5}% of test flights after training.`);
assert(landed > 75, 'AI should land more than 15% of the time after training');

console.log('All AI tests passed.');
