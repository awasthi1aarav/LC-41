# LC-41 · Space Apps submission text

Copy-paste text for the NASA Space Apps 2026 project page. Challenge: **Space Mission Design Game**.

## Links

- **Project (play it):** https://awasthi1aarav.github.io/LC-41/
- **Code:** https://github.com/awasthi1aarav/LC-41
- **Demo (28 s video):** https://github.com/awasthi1aarav/LC-41/blob/main/demo/LC-41_demo.mp4

## High-level summary

LC-41: The Last Lifeline is a retro browser game where players design and fly Voyager 1. They choose a goal, rocket, launch window, nuclear power, fuel, instruments and antenna, and live meters show how each choice trades mass, power, budget, data and lifetime. Then they fly the real Grand Tour: photographing Jupiter, steering a burn at Saturn, finding the Pale Blue Dot and keeping the probe alive as its power fades through real events up to the one-light-day milestone on 18 November 2026. When the real story ends, a what-if timeline begins in which Voyager wakes up and mines an asteroid to survive. A mission report explains why each mission succeeded or failed.

## Project details

**What it does.** LC-41 turns mission design trade-offs into play. In six short steps, players pick an objective, launch vehicle and window, spacecraft body, RTG count, hydrazine, ten real instruments and comms. A live pixel spacecraft is built as they choose, and the game blocks launch if the spacecraft is too heavy for the rocket, short on power or over budget, explaining why. The flight shows the consequences: a small dish loses data at Jupiter, too little hydrazine loses Earth-pointing early, fewer RTGs end the mission years sooner.

**How it works.** The game is plain HTML, CSS and JavaScript with no server. A simple physical model drives it: RTG output decays smoothly from about 470 W in 1977 to about 220 W in 2026 (about 4 W lost per year now), antenna data capacity scales with dish area, and fuel is spent by burns and by pointing each year. Mini-games cover imaging, a trajectory burn, finding Earth, power management, scanning, drone flight, drilling, docking and antenna pointing. Each has a how-to-play card, a 1-3 star rating and one failsafe retry.

**Collaboration.** Two to four players can play on one device as Flight Director, Spacecraft Engineer, Science Officer and CAPCOM. Each owns part of the design, takes the controls at their station and has a personal goal (stay under budget, keep power margin, fly more instruments, lose less data) that competes with the others, so they have to negotiate. Big decisions, such as Titan or Pluto, go to a vote.

**Learning.** Concepts are introduced through play rather than lectures: payload capacity, power budgets, radioactive decay, gravity-assist launch windows, data rates and fault protection. The report gives a plain-language analysis of each design, names the real spacecraft it most resembles, and separates real history from fiction.

**Fun.** A chiptune soundtrack, combos, lightning bonuses, a debris field, surprise emergencies, radio chatter, a hall of fame and shareable design links.

**Tools:** HTML5 Canvas, JavaScript, CSS, Web Audio API, GitHub Pages.

## Use of NASA data and resources

- Voyager 1 mission facts and timeline from NASA Science and NASA JPL: the launch, the Jupiter and Saturn flybys, Io's volcanoes, lightning on Jupiter, the Titan decision, the Pale Blue Dot, the termination shock, the heliopause, the 2023 memory fault and its fix, the February 2026 power drop, the April 2026 instrument shutdown, the 4 W/year power decline and the one-light-day milestone.
- Space Apps challenge resources *Design and Develop Science Missions* and *A Learning Game About Telescopes* shaped the design: objectives drive engineering choices, and the report compares the player's design with real missions.

## Use of artificial intelligence

An AI coding assistant (Claude by Anthropic) wrote most of the code, helped research and check Voyager facts, and edited the demo video from recorded gameplay. The concept, story and game direction came from the creator, who also play-tested the game. AI use is disclosed in the README.

## References

- NASA Science: NASA shuts off instrument on Voyager 1 to keep spacecraft operating (Apr 2026): https://science.nasa.gov/blogs/voyager/2026/04/17/nasa-shuts-off-instrument-on-voyager-1-to-keep-spacecraft-operating/
- NASA JPL via ScienceDaily: Voyager 1 is about to reach a historic one-light-day milestone (Nov 2026): https://www.sciencedaily.com/releases/2026/11/261103003152.htm
- NASA via ScienceDaily: NASA shuts down 49-year-old Voyager 1 instrument to keep it alive (May 2026): https://www.sciencedaily.com/releases/2026/05/260504023835.htm
- EarthSky: Voyager 1 to reach 1 light-day from Earth on November 18: https://earthsky.org/space/voyager-1-1-light-day-from-earth-november-17-18-2026/
