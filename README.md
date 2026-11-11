# Rocket Lander: an AI that learns to land a rocket

A rocket that teaches itself to land using **reinforcement learning**, trained live in your browser. No libraries, no server, no installation: just plain JavaScript.

![The AI landing the rocket, with its learning curve below](docs/screenshot.png)

Click **Let the AI learn** and watch it go from crashing every time to landing about half its flights in under a minute. The chart shows its average score climbing as it learns.

## Try it

**Live demo:** _link added after publishing_

Or run it on your own computer:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

(`--bind 127.0.0.1` keeps the server visible only to your own computer, not to everyone on your Wi‑Fi.)

Then open http://localhost:8000.

- **Fly it yourself:** ↑ engine, ← → turn, R restart. Land gently and upright on the green pad.
- **Let the AI learn:** it practises about 1,200 flights per second in the background. The rocket on screen shows what it has learned so far.
- **Settings:** sliders change gravity, thrust, fuel, the rewards and how much the AI explores, live. **Reset AI** wipes its memory so you can watch it learn a new world from scratch.

## How it works

| File | What it does |
|------|--------------|
| [`physics.js`](physics.js) | The world: gravity, engine thrust, rotation, fuel, and landing or crash detection. One function, `step(rocket, action)`, moves time forward one frame. |
| [`agent.js`](agent.js) | The AI: tabular **Q-learning**. |
| [`game.js`](game.js) | Draws the world, reads the keyboard and runs the training loop. |
| [`chart.js`](chart.js) | The live learning curve, drawn on a canvas. |
| [`settings.js`](settings.js) | The slider panel. |
| [`test.js`](test.js) | Automated checks for the physics and the AI. |

### Rewards

The AI is never told what "landing" means. It only gets a score:

- **+100** for touching down slowly and upright on the pad
- **−100** for crashing or flying off screen
- **−0.3** for every frame the engine burns fuel

### Q-learning

The AI keeps a table of guesses: for each situation, *how much total score will each action lead to?*

1. **See:** round the rocket's position, speed, tilt and fuel into a situation, such as "left of pad, high, falling fast, upright".
2. **Act:** usually pick the action with the best guess, but 10% of the time try a random one (exploration).
3. **Learn:** after seeing the reward and the next situation, nudge the guess:

   `guess += 0.1 × (reward + 0.99 × best guess for next situation − guess)`

After tens of thousands of practice flights, "pick the best guess" turns into "land the rocket".

## Experiments to try

- **Exploration:** set AI explore chance to 0, then press Reset AI. With no random actions it often gets stuck with a bad habit.
- **Bad rewards:** set fuel cost to −5. Burning fuel now costs more than crashing, so the AI learns to crash on purpose.
- **Transfer:** let it learn, then raise gravity to 0.09. Does it adapt faster than starting fresh with Reset AI?

## Tests

```bash
node test.js
```

Checks gravity, thrust, fuel, landing and crash rules, the rewards, and that the AI lands more than 15% of flights after 100,000 practice flights (it usually reaches 50–60%).

## Ideas for next steps

- Add a "getting closer to the pad" reward to speed up learning (reward shaping)
- Swap the table for a small neural network (Deep Q-Network) so it can handle exact numbers instead of buckets
- Add wind, or a moving landing pad
