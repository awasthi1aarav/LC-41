# LC-41 · The Last Lifeline

**Play:** https://awasthi1aarav.github.io/LC-41/ · **Demo video (28 s):** [demo/LC-41_demo.mp4](demo/LC-41_demo.mp4)

A retro space mission design game for the **NASA Space Apps Challenge 2026: Space Mission Design Game**.

Design Voyager 1 in 1977, fly the real Grand Tour, and keep the spacecraft alive as its nuclear power fades. When the real story ends, the game crosses into a **what-if timeline**: Voyager wakes up as an artificial lifeform, sends a mining drone to an asteroid, and fights to restore its own power.

The name comes from **Launch Complex 41** at Cape Canaveral, where Voyager 1 launched on 5 September 1977.

## How it answers the challenge

| The challenge asks for… | In LC-41 |
|---|---|
| Define a mission objective first | Step 1: Grand Tour science, Titan close-up, or Go the distance. Each one changes how the score is counted. |
| Design the spacecraft and pick instruments | Spacecraft body, RTG count, hydrazine load, 10 real Voyager instruments, antenna dish and tape recorder. A live pixel spacecraft is built as you choose. |
| Choose a launch vehicle and orbit/trajectory | Atlas-Centaur or Titan IIIE-Centaur, plus a launch window (1977 Grand Tour alignment, 1978 or 1979). |
| Check that mass fits the launcher | The game blocks launch if the spacecraft is too heavy, short on power or over budget, and explains why. |
| Manage mass, power, budget, data, communications and lifetime | Live meters for all six; a power-decline graph; data per flyby vs what the dish and tape can carry. |
| Every decision has a consequence | More RTGs = longer life but more mass and cost; a smaller dish = lost data; less hydrazine = losing pointing early. |
| No single perfect solution | Many different designs reach the report; the score rewards different strengths. |
| Teams of up to four, with roles | Crew mode for 2-4 players on one device: Flight Director, Spacecraft Engineer, Science Officer and CAPCOM, each with a personal goal that pulls against the others. Decisions go to a vote. |
| Simulate the mission and evaluate it | A full mission from 1977 to the 2030s, then a mission report with scores, star ratings and a plain-language "why it went this way". |
| Accessible to beginners, teaches why | Step-by-step design with one-line explanations, a how-to-play card before every mini-game, and four difficulty levels including Sandbox. |
| Random events, scenarios, sandbox, leaderboards, sharing | Surprise emergencies, 3 objectives, 4 difficulties, Sandbox mode, a hall of fame, and shareable design links. |

## How it plays

1. **Mission design (1977).** Six short steps: Goal → Rocket & launch date → Spacecraft & power → Instruments → Communications → Ready to launch. Mission Control reacts to every choice, and a MISSION READY stamp appears when all checks pass. A Quick Start loads the real 1977 Voyager design.
2. **The real timeline: three side missions.**
   - **Jupiter 1979:** photograph moons and the Great Red Spot within your data budget. Chain combos, and catch lightning on the night side.
   - **Saturn 1980:** a hand-flown trajectory-correction burn, then a vote: Titan (the real choice) or Pluto.
   - **Pale Blue Dot 1990:** find Earth, less than a pixel wide, beside the Sun's glare.
3. **The Long Night (1990 onwards).** The RTGs fade at the real rate (about 4 W a year). Switch loads off to stay alive through real events: termination shock (2004), heliopause (2012), the 2023 memory-chip fault, the February 2026 power drop, and one light-day from Earth (18 November 2026). Never let the thruster lines freeze.
4. **The what-if timeline (fiction).** Name the awakened AI, scan for an asteroid, fly the MOTH drone through a debris field, drill ore, dock, choose which instruments to revive, and hand-point the antenna at Earth.
5. **Along the way:** surprise emergencies (solar flare, micrometeoroid, bit-flip, gyro drift) with a few seconds to react, failsafe retries that cost points, 1-3 stars for every mini-game, and radio chatter from CAPCOM and later the AI.
6. **Mission report.** Score breakdown, stars, team goals, why the mission went the way it did, the real spacecraft your design most resembles, and a real-vs-fiction timeline. Save to the hall of fame or copy a link to your design.

## Controls

- Mouse or arrow keys: aim and steer
- SPACE or click: act (shoot, burn, drill, confirm)
- Number keys 1-9: switch power loads in the Long Night
- F: fast-forward the Long Night
- Esc or ❚❚ PAUSE: resume, restart or quit
- Touch screens get an on-screen pad (landscape works best)

**Difficulty:** Cadet, Engineer, Flight Director (tighter budget, smaller burn window, faster emergencies) and Sandbox (no limits).

## Real vs fiction

Everything before the timeline divergence follows the real Voyager 1 mission. Masses, powers and costs are **simplified** for play. For example, RTG output is modelled as a smooth decline fitted to about 470 W at launch and about 220 W in 2026.

**Fiction:** the awakened AI, the MOTH drone, the asteroid and its ore, the Pluto option and the exact effects of the emergency mini-games. Voyager has no drone, and interstellar space has no convenient asteroids to mine.

## NASA data and resources used

- Voyager 1 mission facts and timeline (launch, flybys, Pale Blue Dot, termination shock, heliopause, the 2023 memory fault, instrument shutdowns, the 4 W/year power decline, the one-light-day milestone): NASA Science and NASA JPL.
- Space Apps resources: *Design and Develop Science Missions* (mission segments and trade-offs) and *A Learning Game About Telescopes* (objectives drive engineering choices; compare your design to real missions) shaped the game design.

Sources:
- [NASA Science: NASA shuts off instrument on Voyager 1 to keep spacecraft operating (Apr 2026)](https://science.nasa.gov/blogs/voyager/2026/04/17/nasa-shuts-off-instrument-on-voyager-1-to-keep-spacecraft-operating/)
- [NASA JPL via ScienceDaily: Voyager 1 is about to reach a historic one-light-day milestone (Nov 2026)](https://www.sciencedaily.com/releases/2026/11/261103003152.htm)
- [NASA via ScienceDaily: NASA shuts down 49-year-old Voyager 1 instrument to keep it alive (May 2026)](https://www.sciencedaily.com/releases/2026/05/260504023835.htm)
- [EarthSky: Voyager 1 to reach 1 light-day from Earth on November 18](https://earthsky.org/space/voyager-1-1-light-day-from-earth-november-17-18-2026/)

## Run it yourself

No install, no build, no server. Open `index.html` in a browser, or serve the folder with any static host.

```
git clone https://github.com/awasthi1aarav/LC-41
cd LC-41
open index.html        # or double-click it
```

## Built with

Plain HTML, CSS and JavaScript: no frameworks, no build step, no server. Chiptune music and sound effects are generated live with the Web Audio API. Open `index.html` to play offline.
