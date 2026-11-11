// The AI pilot: Q-learning with a table of notes.
// For each situation it guesses how much total score each action leads to,
// and it improves those guesses after every single move.

const LEARNING_RATE = 0.1;  // how far each guess moves toward what really happened
const DISCOUNT = 0.99;      // how much the future counts (1 = as much as now)
const EXPLORE = 0.1;        // chance of trying a random action instead of the best one

const qTable = {}; // situation name -> [guess for NOTHING, ENGINE, TURN_LEFT, TURN_RIGHT]

// Which bucket a number falls into, e.g. bucket(2.0, [-1, 0, 1]) -> 3.
function bucket(value, edges) {
  let i = 0;
  while (i < edges.length && value > edges[i]) i++;
  return i;
}

// Round the rocket's exact numbers into a short situation name like "3,1,2,4,2".
function situation(r) {
  return [
    bucket(r.x - (PAD_LEFT + PAD_RIGHT) / 2, [-100, -40, -15, 15, 40, 100]), // left/right of pad
    bucket(GROUND - r.y, [15, 50, 120, 220]),                                 // height
    bucket(r.vx, [-1.5, -0.5, 0.5, 1.5]),                                     // sideways speed
    bucket(r.vy, [-1, 0, 0.7, 1.3, 2.5, 4]),                                  // falling speed
    bucket(r.angle, [-0.3, -0.1, 0.1, 0.3]),                                  // tilt
    r.fuel > 0 ? 1 : 0,                                                       // any fuel left?
  ].join(',');
}

function guesses(s) {
  return qTable[s] || (qTable[s] = [0, 0, 0, 0]);
}

// Best action by current guesses (ties go to the first one).
function bestAction(s) {
  const q = guesses(s);
  return q.indexOf(Math.max(...q));
}

function chooseAction(s, explore = EXPLORE) {
  return Math.random() < explore ? Math.floor(Math.random() * 4) : bestAction(s);
}

// The learning rule: nudge the old guess toward (reward now + best guess from where we landed).
function learn(s, action, reward, next, done) {
  const target = done ? reward : reward + DISCOUNT * Math.max(...guesses(next));
  const q = guesses(s);
  q[action] += LEARNING_RATE * (target - q[action]);
}

// Fly one whole flight. Learns from every move unless learning = false.
// Returns { score, result }.
function runEpisode(learning = true) {
  let rocket = newRocket(), score = 0;
  while (true) {
    const s = situation(rocket);
    const action = learning ? chooseAction(s) : bestAction(s);
    const out = step(rocket, action);
    score += out.reward;
    if (learning) learn(s, action, out.reward, situation(out.rocket), out.result !== null);
    rocket = out.rocket;
    if (out.result) return { score, result: out.result };
  }
}
