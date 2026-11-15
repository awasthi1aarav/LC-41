// Boot, menus, crew setup
function boot() {
  const lines = ['JET PROPULSION LABORATORY · PASADENA', 'MISSION CONTROL TERMINAL 77', 'MEMORY TEST ........ OK', 'DEEP SPACE NETWORK ...... LINKED', 'LOADING MISSION: LC-41', '', 'PRESS ANY KEY'];
  ui('');
  setScene({
    update() { if (this.t > .6 && (pressed.size || M.clicked)) { ac(); menu(); } },
    draw(dt) {
      clear(); stars(3, 0, dt); const c = C();
      const n = Math.floor(this.t * 3);
      lines.slice(0, n).forEach((l, i) => txt(l, 30, 50 + i * 20, i === lines.length - 1 ? ((G.t * 2 | 0) % 2 ? c.hi : c.bg) : c.fg, 18));
      if (n < lines.length) rect(30, 44 + n * 20, 8, 12, c.fg);
    }
  });
}

function menu() {
  setWhatif(false); pad(false);
  setScene({ draw(dt) { clear(); stars(10, 0, dt); voyager(W * 0.78 + Math.sin(G.t * .3) * 6, H * 0.72, 2.2, -0.2 + Math.sin(G.t * .5) * .05); } });
  const shared = location.hash.startsWith('#d=');
  ui(`<div class="center">
    <p class="px muted" style="font-size:10px">NASA SPACE APPS CHALLENGE 2026 · SPACE MISSION DESIGN GAME</p>
    <h1>LC-41</h1><h2>THE LAST LIFELINE</h2>
    <p>Design Voyager 1. Fly the Grand Tour. Then save it in a timeline that never happened.</p>
    ${shared ? '<p class="ok">A shared mission design is loaded.</p>' : ''}
    <p style="margin-top:14px"><button class="big" id="solo">SOLO</button><button class="big" id="crew">CREW (2-4)</button></p>
    <p>${Object.entries(DIFF).map(([k, d]) => `<button class="${S.diff === k ? 'on' : ''}" data-d="${k}">${d.name}</button>`).join('')}</p>
    <p><button id="how">HOW TO PLAY</button><button id="hof">HALL OF FAME</button><button id="about">REAL vs FICTION</button></p>
    <p class="muted" style="margin-top:16px">Voyager 1 reaches one light-day from Earth on 18 Nov 2026.</p></div>`);
  UI.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { S.diff = b.dataset.d; beep(700, .04); menu(); });
  $('#solo').onclick = () => { S.mode = 'solo'; S.players = [{ name: 'PLAYER 1', roles: ROLE_ORDER.slice() }]; sfx.ok(); intro(); };
  $('#crew').onclick = crewSetup;
  $('#how').onclick = howTo; $('#hof').onclick = hallOfFame; $('#about').onclick = about;
}

function crewSetup() {
  let n = Math.max(2, S.mode === 'crew' ? S.players.length : 4), names = S.players.map(p => p.name);
  const render = () => {
    const assign = Array.from({ length: n }, () => []); ROLE_ORDER.forEach((r, i) => assign[i % n].push(r));
    ui(`<div class="center"><div class="box" style="max-width:700px"><h2>CREW SETUP</h2>
      <p>Play together on one device. Each controller owns a part of the design and takes the controls at their station.</p>
      <p>${[2, 3, 4].map(k => `<button class="${k === n ? 'on' : ''}" data-n="${k}">${k} PLAYERS</button>`).join('')}</p>
      ${assign.map((roles, i) => `<p class="row" style="justify-content:center"><input type="text" data-p="${i}" maxlength="12" value="${esc(names[i] || 'PLAYER ' + (i + 1))}"> <span>${roles.map(r => ROLES[r].name).join(' + ')}</span></p>`).join('')}
      <p><button id="bk">◀ BACK</button><button class="big" id="go">START ▶</button></p></div></div>`);
    UI.querySelectorAll('[data-n]').forEach(b => b.onclick = () => { save(); n = +b.dataset.n; render(); });
    $('#bk').onclick = menu;
    $('#go').onclick = () => { save(); S.mode = 'crew'; S.players = assign.map((roles, i) => ({ name: (names[i] || 'PLAYER ' + (i + 1)).toUpperCase(), roles })); sfx.ok(); intro(); };
  };
  const save = () => UI.querySelectorAll('input[data-p]').forEach(e => names[+e.dataset.p] = e.value.trim());
  render();
}

function intro() {
  card(['1977: the outer planets line up, once in 175 years. One probe could visit them all.',
    'Design it, fly it, keep it alive. Then see what happens when the real story ends.'], () => designScreen(0), { title: 'MISSION BRIEFING', btn: 'START DESIGNING ▶' });
}

function howTo() {
  setScene({ draw(dt) { clear(); stars(4, 0, dt); } });
  ui(`<div class="center"><div class="box" style="max-width:800px;text-align:left"><h2>HOW TO PLAY</h2>
    <p><b class="hi">1. Design (1977).</b> Pick an objective, rocket, launch window, power (RTGs), fuel, instruments and antenna. Watch the meters: mass must fit the rocket, power must cover the draw, cost must fit the budget. There is no single right answer.</p>
    <p><b class="hi">2. Fly the real mission.</b> Jupiter 1979 (photograph targets), Saturn 1980 (a thruster burn, then Titan or Pluto), the Pale Blue Dot 1990 (find Earth), then the Long Night: keep power draw under a fading supply until 2026 and beyond.</p>
    <p><b class="hi">3. The what-if timeline.</b> The power runs out. Voyager wakes up as an artificial lifeform. Scan for an asteroid, fly the MOTH drone, drill ore, dock, restore power, and point the antenna home.</p>
    <p><b class="hi">4. Report.</b> See your score, why things went the way they did, and what was real.</p>
    <p class="muted">Controls: mouse or arrow keys to aim/steer, SPACE or click to act, number keys toggle power loads, F fast-forwards. On touch screens use the on-screen pad. Crew mode: 2-4 players share one screen; each role has its own personal goal.</p>
    <p style="text-align:center"><button class="big" id="bk">◀ BACK</button></p></div></div>`);
  $('#bk').onclick = menu;
}

function hallOfFame() {
  const h = loadHof();
  setScene({ draw(dt) { clear(); stars(4, 0, dt); } });
  ui(`<div class="center"><div class="box" style="min-width:min(560px,90vw)"><h2>HALL OF FAME</h2>
    ${h.length ? `<table><tr><th>#</th><th>NAME</th><th>RANK</th><th>LEVEL</th><th class="n">SCORE</th></tr>${h.map((e, i) => `<tr><td>${i + 1}</td><td>${esc(e.n)}</td><td>${e.r}</td><td>${DIFF[e.d] ? DIFF[e.d].name : ''}</td><td class="n">${e.s}</td></tr>`).join('')}</table>` : '<p class="muted">No missions flown yet on this device.</p>'}
    <p><button class="big" id="bk">◀ BACK</button></p></div></div>`);
  $('#bk').onclick = menu;
}

function about() {
  setScene({ draw(dt) { clear(); stars(4, 0, dt); } });
  ui(`<div class="center"><div class="box" style="max-width:860px;text-align:left"><h2>REAL vs FICTION</h2>
    <p>Everything before the "timeline divergence" is based on the real Voyager 1 mission. Masses, powers and costs are simplified for play.</p>
    <table>${HISTORY.map(([d, t]) => `<tr><td style="white-space:nowrap">${d}</td><td>${t}</td></tr>`).join('')}</table>
    <p class="fiction" style="margin-top:10px">Fiction: the alternate 2026-B timeline. The awakened AI, the MOTH drone, the asteroid and its ore are invented. The real interstellar medium is far too empty to mine.</p>
    <p class="muted">Sources: NASA Science Voyager mission pages, NASA JPL news releases, NASA History articles. See the README on GitHub for links.</p>
    <p style="text-align:center"><button class="big" id="bk">◀ BACK</button></p></div></div>`);
  $('#bk').onclick = menu;
}

// shared design from link
if (location.hash.startsWith('#d=')) {
  try { const d = JSON.parse(atob(location.hash.slice(3))); if (d && d.inst && BUSES[d.bus] && LVS[d.lv] && WINDOWS[d.win] && HGAS[d.hga]) S.design = Object.assign(JSON.parse(JSON.stringify(REAL_DESIGN)), d); } catch (e) { }
}
document.fonts && document.fonts.ready.then(() => { });
requestAnimationFrame(frame);
boot();
