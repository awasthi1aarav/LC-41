# LC-41 · The Last Lifeline

**Play:** https://awasthi1aarav.github.io/LC-41/

A retro space mission design game for the **NASA Space Apps Challenge 2026: Space Mission Design Game**.

Design Voyager 1 in 1977, fly the real Grand Tour, and keep it alive as its nuclear power fades. When the real story ends, the game crosses into a **what-if timeline**: Voyager wakes up as an artificial lifeform, sends a mining drone to an asteroid, and fights to restore its own power.

Named after **Launch Complex 41** at Cape Canaveral, where Voyager 1 launched on 5 September 1977.

## How it plays

1. **Mission design (1977).** Pick an objective, launch vehicle, launch window, spacecraft bus, RTG count, hydrazine load, 10 real science instruments, antenna size and tape recorder. Live meters show mass, power, budget, data, lifetime and science. Hard checks: the spacecraft must fit the rocket, power must cover the draw, and cost must fit the budget. Many different designs can work.
2. **The real timeline: 3 side missions.**
   - Jupiter 1979: aim the scan platform and photograph targets within your data budget (Io's volcanoes are a bonus).
   - Saturn 1980: a hand-flown trajectory correction burn, then a team vote: Titan (the real choice) or Pluto.
   - Pale Blue Dot 1990: find Earth, less than a pixel wide, next to the Sun's glare.
3. **The Long Night (1990 onwards).** Switch loads on and off as the RTGs fade by real-world rates, through real events: termination shock (2004), heliopause (2012), the 2023 memory-chip fault, the Feb 2026 power drop, and one light-day from Earth (18 Nov 2026). Never let the thruster lines freeze.
4. **What-if timeline 2026-B (fiction).** Scan for an asteroid, fly the MOTH drone, drill ore, dock, decide which instruments to revive, and hand-point the antenna at Earth.
5. **Along the way:** surprise emergencies (solar flares, micrometeoroids, bit-flips, gyro drift) to react to in seconds, combos and lightning bonuses, a debris field to dodge, 1-3 star ratings for every mini-game, and radio chatter from CAPCOM and the awakened AI.
6. **Mission report.** Score breakdown, team goals, an explanation of *why* the mission went the way it did, the closest real spacecraft to your design, and a real-vs-fiction timeline. Save to the hall of fame or share your design as a link.

**Team mode:** 2-4 players on one device. Each player owns roles (Flight Director, Spacecraft Engineer, Science Officer, CAPCOM) with their own design panel, their own station during the flight and a personal goal that competes with the others. Decisions go to a vote; ties go to the Flight Director.

**Difficulty:** Cadet, Engineer, Flight Director (tighter budget and burn window) and Sandbox (no limits).

**Controls:** mouse or arrow keys to aim/steer, SPACE or click to act, number keys to toggle power loads, F to fast-forward. Touch screens get an on-screen pad.

## Real vs fiction

Everything before the timeline divergence follows the real Voyager 1 mission. Masses, powers and costs are **simplified** for play (for example, RTG output is modelled as a smooth decline fitted to ~470 W at launch and ~220 W in 2026, about 4 W lost per year).

**Fiction:** the awakened AI, the MOTH drone, the asteroid and its ore, and the Pluto option. Voyager has no drone, and interstellar space has no convenient asteroids to mine.

## Sources

- NASA Science, Voyager mission pages and blog: [NASA shuts off instrument on Voyager 1 to keep spacecraft operating (Apr 2026)](https://science.nasa.gov/blogs/voyager/2026/04/17/nasa-shuts-off-instrument-on-voyager-1-to-keep-spacecraft-operating/)
- NASA JPL via ScienceDaily: [Voyager 1 is about to reach a historic one-light-day milestone (Nov 2026)](https://www.sciencedaily.com/releases/2026/11/261103003152.htm)
- NASA via ScienceDaily: [NASA shuts down 49-year-old Voyager 1 instrument to keep it alive (May 2026)](https://www.sciencedaily.com/releases/2026/05/260504023835.htm)
- EarthSky: [Voyager 1 to reach 1 light-day from Earth on November 18](https://earthsky.org/space/voyager-1-1-light-day-from-earth-november-17-18-2026/)
- Space Apps challenge resources: *Design and Develop Science Missions* (mission segments and trade-offs) and *A Learning Game About Telescopes* (objectives drive the engineering; compare to real missions) shaped the game design.

## Built with

Plain HTML, CSS and JavaScript: no frameworks, no build step, no server. Chiptune music and sound effects are generated live with the Web Audio API. Open `index.html` to play offline.
