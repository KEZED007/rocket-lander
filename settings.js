// Settings panel: sliders that change the knobs in physics.js and agent.js while it runs.

const SETTINGS = [
  // label,                 min,  max, step, read the knob,       change the knob
  ['Gravity',               0.01, 0.11, 0.01, () => GRAVITY,       v => GRAVITY = v],
  ['Engine thrust',         0.05, 0.30, 0.01, () => THRUST,        v => THRUST = v],
  ['Fuel tank',             20,   400,  10,   () => FUEL_START,    v => FUEL_START = v],
  ['Turn speed',            0.01, 0.15, 0.01, () => TURN_SPEED,    v => TURN_SPEED = v],
  ['Safe landing speed',    0.5,  4,    0.1,  () => SAFE_SPEED,    v => SAFE_SPEED = v],
  ['Landing reward',        0,    300,  10,   () => LAND_REWARD,   v => LAND_REWARD = v],
  ['Crash penalty',         -300, 0,    10,   () => CRASH_PENALTY, v => CRASH_PENALTY = v],
  ['Fuel cost per frame',   -5,   0,    0.1,  () => FUEL_COST,     v => FUEL_COST = v],
  ['AI explore chance',     0,    1,    0.05, () => EXPLORE,       v => EXPLORE = v],
];

const panel = document.getElementById('settings');
const sliders = SETTINGS.map(([label, min, max, step, get, set]) => {
  const input = Object.assign(document.createElement('input'), { type: 'range', min, max, step, value: get() });
  const shown = document.createElement('output');
  shown.value = get();
  input.oninput = () => { set(Number(input.value)); shown.value = input.value; };
  const row = document.createElement('label');
  row.append(label, input, shown);
  panel.append(row);
  return { input, shown, set, start: get() };
});

// Put every slider back to how the code starts.
document.getElementById('defaults').onclick = () => {
  for (const s of sliders) { s.set(s.start); s.input.value = s.shown.value = s.start; }
};

// Wipe the AI's memory and the chart, so it learns the current world from scratch.
document.getElementById('resetAI').onclick = () => {
  for (const key in qTable) delete qTable[key];
  points.length = 0;
  batchScore = batchLanded = batchCount = 0;
  practiceFlights = 0;
  recentLandings = [];
  restart();
};
