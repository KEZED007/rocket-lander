// The learning curve: average score of each batch of practice flights, drawn live.

const BATCH = 1000;              // practice flights averaged into one point
const MIN_SCORE = -150, MAX_SCORE = 100;
const C_W = 600, C_H = 220;      // chart size in pixels
const LEFT = 45, RIGHT = 15, TOP = 30, BOTTOM = 25; // room for labels

const chartCanvas = document.getElementById('chart');
const cctx = chartCanvas.getContext('2d');

const points = [];               // one { score, landed } per batch
let batchScore = 0, batchLanded = 0, batchCount = 0;
let hoverX = null;               // mouse position over the chart, or null

// Called after every practice flight. Adds a point once a batch is full.
function recordFlight(score, landed) {
  batchScore += score;
  batchLanded += landed ? 1 : 0;
  batchCount++;
  if (batchCount === BATCH) {
    points.push({ score: batchScore / BATCH, landed: 100 * batchLanded / BATCH });
    batchScore = batchLanded = batchCount = 0;
  }
}

// Turn a point number / a score into a pixel position.
const xOf = i => LEFT + (points.length < 2 ? 0 : i / (points.length - 1)) * (C_W - LEFT - RIGHT);
const yOf = s => TOP + (MAX_SCORE - Math.max(MIN_SCORE, Math.min(MAX_SCORE, s))) / (MAX_SCORE - MIN_SCORE) * (C_H - TOP - BOTTOM);

chartCanvas.addEventListener('mousemove', e => { hoverX = e.offsetX * chartCanvas.width / chartCanvas.clientWidth; });
chartCanvas.addEventListener('mouseleave', () => { hoverX = null; });

function drawChart() {
  cctx.fillStyle = '#0b1020';
  cctx.fillRect(0, 0, C_W, C_H);

  cctx.font = '13px sans-serif';
  cctx.fillStyle = '#ddd';
  cctx.fillText(`Average score per ${BATCH.toLocaleString()} practice flights`, LEFT, 18);

  // faint grid lines with score labels; 0 is a little brighter
  cctx.font = '11px monospace';
  for (let s = -150; s <= 100; s += 50) {
    cctx.fillStyle = s === 0 ? '#555' : '#222';
    cctx.fillRect(LEFT, Math.round(yOf(s)), C_W - LEFT - RIGHT, 1);
    cctx.fillStyle = '#888';
    cctx.fillText(String(s), 5, yOf(s) + 4);
  }
  cctx.fillText('practice flights →', C_W - RIGHT - 125, C_H - 7);

  if (points.length === 0) {
    cctx.fillStyle = '#888';
    cctx.fillText('Click "Let the AI learn" to start the chart', LEFT + 10, C_H / 2);
    return;
  }

  // the learning curve
  cctx.strokeStyle = '#4ea1ff';
  cctx.lineWidth = 2;
  cctx.lineJoin = 'round';
  cctx.beginPath();
  points.forEach((p, i) => (i ? cctx.lineTo(xOf(i), yOf(p.score)) : cctx.moveTo(xOf(i), yOf(p.score))));
  cctx.stroke();

  // show the exact numbers for the point under the mouse (or the latest one)
  let i = points.length - 1;
  if (hoverX !== null && points.length > 1) {
    i = Math.round((hoverX - LEFT) / (C_W - LEFT - RIGHT) * (points.length - 1));
    i = Math.max(0, Math.min(points.length - 1, i));
    cctx.fillStyle = '#555';
    cctx.fillRect(Math.round(xOf(i)), TOP, 1, C_H - TOP - BOTTOM);
  }
  const p = points[i];
  cctx.fillStyle = '#4ea1ff';
  cctx.beginPath(); cctx.arc(xOf(i), yOf(p.score), 4, 0, 2 * Math.PI); cctx.fill();
  cctx.font = '12px monospace';
  cctx.fillStyle = '#ddd';
  const label = `${((i + 1) * BATCH).toLocaleString()} flights: score ${p.score.toFixed(1)}, landed ${Math.round(p.landed)}%`;
  cctx.fillText(label, C_W - RIGHT - cctx.measureText(label).width, 18);
}
