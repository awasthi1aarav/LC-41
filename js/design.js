// Mission design: the numbers model and the design screen
function calc(d) {
  const bus = BUSES[d.bus], lv = LVS[d.lv], win = WINDOWS[d.win], hga = HGAS[d.hga], diff = DIFF[S.diff];
  const flown = INST.filter(i => d.inst[i.id] && !(bus.noPlatform && i.platform));
  const instMass = flown.reduce((a, i) => a + i.mass, 0), instPow = flown.reduce((a, i) => a + i.power, 0);
  const mass = bus.mass + d.rtg * RTG.mass + d.hyd + hga.mass + (d.tape ? TAPE.mass : 0) + instMass;
  const cost = bus.cost + lv.cost + win.cost + d.rtg * RTG.cost + hga.cost + (d.tape ? TAPE.cost : 0) + d.hyd * 0.1 + flown.reduce((a, i) => a + i.cost, 0);
  const supply0 = d.rtg * RTG.watts;
  const draw0 = bus.essential + HEATERS + instPow + (d.tape ? TAPE.power : 0);
  const launchYear = LAUNCH + win.delay;
  const silence = supply0 > bus.essential ? launchYear + Math.log(supply0 / bus.essential) / K_DECAY : launchYear;
  const hydOut = launchYear + Math.max(0, d.hyd - HYD_TCM) / HYD_PER_YEAR;
  const dataCap = Math.round(hga.factor * 100 + (d.tape ? 60 : 0));
  const demand = Math.round(flown.filter(i => i.p >= 6).length * 10 + (flown.some(i => i.id === 'ISS') ? 30 : 0));
  const end = Math.min(silence, hydOut);
  const checks = [];
  const hard = (ok, msg) => checks.push({ ok, hard: !diff.sandbox, msg });
  const soft = (ok, msg) => checks.push({ ok, hard: false, msg });
  hard(mass <= lv.max, mass <= lv.max ? `Mass ${fmt(mass)} kg fits the ${lv.name} (limit ${lv.max} kg).`
    : `Too heavy: ${fmt(mass)} kg, but the ${lv.name} can only send ${lv.max} kg to Jupiter. Cut ${fmt(mass - lv.max)} kg or pick a bigger rocket.`);
  hard(draw0 <= supply0, draw0 <= supply0 ? `Power at launch: ${supply0} W supply covers ${fmt(draw0)} W draw.`
    : `Not enough power: ${d.rtg} RTG(s) give ${supply0} W but the spacecraft needs ${fmt(draw0)} W. Add an RTG or fly fewer instruments.`);
  hard(cost <= diff.budget, cost <= diff.budget ? `Cost $${fmt(cost)}M is within the $${diff.budget === Infinity ? '∞' : diff.budget}M budget.`
    : `Over budget by $${fmt(cost - diff.budget)}M.`);
  soft(hydOut >= silence, hydOut >= silence ? `Hydrazine lasts to ${Math.floor(hydOut)}, past the power limit.`
    : `Hydrazine runs dry in ~${Math.floor(hydOut)}: you'll lose pointing at Earth before power runs out.`);
  soft(dataCap >= demand, dataCap >= demand ? `Downlink ${dataCap} units covers the ${demand} units your instruments make at a planet.`
    : `Your instruments make ${demand} data units per flyby, but you can only send/store ${dataCap}. Some data will be lost.`);
  if (!win.saturn) soft(false, 'Launching in 1979 misses the alignment: no Saturn flyby.');
  if (bus.noPlatform && INST.some(i => i.platform && d.inst[i.id])) soft(false, 'Spinning bus: scan-platform instruments are left off.');
  return { mass, cost, supply0, draw0, silence, hydOut, end, dataCap, demand, flown, launchYear, bus, lv, win, hga, checks,
    margin: (supply0 - draw0) / supply0, massMargin: (lv.max - mass) / lv.max,
    nogo: checks.some(c => c.hard && !c.ok) };
}
const supplyAt = (d, y) => d.rtg * RTG.watts * Math.exp(-K_DECAY * (y - LAUNCH - WINDOWS[d.win].delay));

function designScreen() {
  setWhatif(false); pad(false);
  setScene({ draw() { clear(); stars(3, 0, 1 / 60); } });
  const d = S.design;
  const own = r => S.mode === 'crew' ? `<span class="who">${esc(nameFor(r))}</span>` : '';
  const opt = (key, val, o, extra = '') => `<div class="opt ${d[key] === val ? 'on' : ''} ${extra}" data-k="${key}" data-v="${val}">${o.name}<small>${o.desc || ''}</small></div>`;
  const render = () => {
    const sy = UI.scrollTop, c = calc(d), diff = DIFF[S.diff];
    const m = (label, val, frac, state, sub) => `<div class="meter ${state}"><b>${label}</b>${val}<div class="bar"><i style="width:${clamp(frac, 0, 1) * 100}%"></i></div>${sub ? `<small class="muted">${sub}</small>` : ''}</div>`;
    ui(`<div class="design">
      <div class="meters">
        ${m('MASS', `${fmt(c.mass)} / ${c.lv.max} kg`, c.mass / c.lv.max, c.mass > c.lv.max ? 'red' : c.massMargin < .03 ? 'warn' : '')}
        ${m('POWER @ LAUNCH', `${fmt(c.draw0)} / ${c.supply0} W`, c.draw0 / c.supply0, c.draw0 > c.supply0 ? 'red' : c.margin < .15 ? 'warn' : '')}
        ${m('BUDGET', `$${fmt(c.cost)}M / ${diff.budget === Infinity ? '∞' : '$' + diff.budget + 'M'}`, c.cost / (diff.budget === Infinity ? c.cost * 2 : diff.budget), c.cost > diff.budget ? 'red' : '')}
        ${m('DATA / FLYBY', `${c.demand} made / ${c.dataCap} sent`, c.demand / Math.max(1, c.dataCap), c.demand > c.dataCap ? 'warn' : '')}
        ${m('LIFETIME', `until ~${Math.floor(c.end)}`, (c.end - 1977) / 70, c.end < 2026 ? 'warn' : '', c.hydOut < c.silence ? 'limited by hydrazine' : 'limited by power')}
        ${m('SCIENCE KIT', `${c.flown.length} / 10 instr.`, c.flown.length / 10, '')}
      </div>
      <div class="row" style="justify-content:space-between;margin-top:8px"><h2 style="margin:0">MISSION DESIGN · 1977</h2>
        <span class="muted">Difficulty: ${diff.name} · <span class="clk" id="real" style="cursor:pointer;text-decoration:underline">load the real Voyager design</span></span></div>
      <div class="grid">
        <div class="panel">${own('director')}<h3>FLIGHT DIRECTOR</h3>
          <p class="muted">Mission objective</p>${Object.entries(OBJECTIVES).map(([k, o]) => opt('obj', k, o)).join('')}
          <p class="muted">Launch vehicle</p>${Object.entries(LVS).map(([k, o]) => opt('lv', k, { name: `${o.name} · ${o.max} kg · $${o.cost}M`, desc: o.desc })).join('')}
          <p class="muted">Launch window</p>${Object.entries(WINDOWS).map(([k, o]) => opt('win', k, { name: `${o.name}${o.cost ? ' · +$' + o.cost + 'M' : ''}`, desc: o.desc })).join('')}
          <div class="learn">${LEARN.director}</div></div>
        <div class="panel">${own('engineer')}<h3>SPACECRAFT ENGINEER</h3>
          <p class="muted">Spacecraft bus</p>${Object.entries(BUSES).map(([k, o]) => opt('bus', k, { name: `${o.name} · ${o.mass} kg · $${o.cost}M`, desc: o.desc })).join('')}
          <p class="muted">RTGs (nuclear power) · ${RTG.mass} kg, ${RTG.watts} W, $${RTG.cost}M each</p>
          <div class="row"><button data-rtg="-1">−</button><span class="hi px" style="font-size:16px">${d.rtg}</span><button data-rtg="1">+</button>
            <span>${c.supply0} W at launch → ${fmt(supplyAt(d, 2026))} W in 2026 · silent by ~${Math.floor(c.silence)}</span></div>
          <canvas class="mini" id="pg" width="240" height="60"></canvas>
          <p class="muted">Hydrazine fuel: <span class="hi">${d.hyd} kg</span> (lasts until ~${Math.floor(c.hydOut)})</p>
          <input type="range" min="50" max="140" step="2" value="${d.hyd}" id="hyd">
          <div class="learn">${LEARN.engineer}</div></div>
        <div class="panel">${own('science')}<h3>SCIENCE OFFICER</h3>
          <div class="inst">${INST.map(i => { const dis = c.bus.noPlatform && i.platform; return `<div class="opt ${d.inst[i.id] && !dis ? 'on' : ''} ${dis ? 'dis' : ''}" data-i="${i.id}">${i.id} · ${i.name}<small>${i.mass} kg · ${i.power} W · $${i.cost}M · planets ${'★'.repeat(Math.ceil(i.p / 8))} deep space ${'★'.repeat(Math.ceil(i.i / 4)) || '–'}</small></div>`; }).join('')}</div>
          <div class="learn">${LEARN.science}</div></div>
        <div class="panel">${own('capcom')}<h3>CAPCOM / COMMS</h3>
          <p class="muted">High-gain antenna</p>${Object.entries(HGAS).map(([k, o]) => opt('hga', k, { name: `${o.name} · ${o.mass} kg · $${o.cost}M`, desc: o.desc })).join('')}
          <div class="opt ${d.tape ? 'on' : ''}" id="tape">Digital tape recorder · ${TAPE.mass} kg · ${TAPE.power} W · $${TAPE.cost}M<small>Stores fast-flyby data to send home later.</small></div>
          <p>Each flyby your instruments make <span class="hi">${c.demand}</span> data units; you can send or store <span class="hi">${c.dataCap}</span>.</p>
          <div class="learn">${LEARN.capcom}</div></div>
      </div>
      <ul class="checks">${c.checks.map(k => `<li class="${k.ok ? 'ok' : k.hard ? 'bad' : ''}">${k.ok ? '✓' : k.hard ? '✗ NO-GO:' : '! '} ${k.msg}</li>`).join('')}</ul>
      ${S.mode === 'crew' ? `<p class="muted">Personal goals: ${S.players.map(p => `<b class="hi">${esc(p.name)}</b> (${p.roles.map(r => ROLES[r].short).join('/')})`).join(', ')}. Each role has a goal, revealed at the poll. They pull in different directions: negotiate!</p>` : `<p class="muted">Bonus goals: ${ROLE_ORDER.map(r => ROLES[r].goal).join(' ')}</p>`}
      <div class="foot"><button id="back">◀ MENU</button><span class="muted">${c.nogo ? '<span class="bad">Fix the NO-GO items to launch.</span>' : 'All hard checks pass.'}</span><button class="big" id="poll" ${c.nogo ? 'disabled' : ''}>GO / NO-GO POLL ▶</button></div>
    </div>`);
    UI.scrollTop = sy;
    UI.querySelectorAll('.opt[data-k]').forEach(e => e.onclick = () => { d[e.dataset.k] = e.dataset.v; beep(600, .03); render(); });
    UI.querySelectorAll('.opt[data-i]').forEach(e => e.onclick = () => { if (e.classList.contains('dis')) return sfx.bad(); d.inst[e.dataset.i] = !d.inst[e.dataset.i]; beep(600, .03); render(); });
    UI.querySelectorAll('[data-rtg]').forEach(b => b.onclick = () => { d.rtg = clamp(d.rtg + +b.dataset.rtg, 1, 5); beep(500, .03); render(); });
    $('#hyd').oninput = e => { d.hyd = +e.target.value; };
    $('#hyd').onchange = render;
    $('#tape').onclick = () => { d.tape = !d.tape; render(); };
    $('#real').onclick = () => { S.design = JSON.parse(JSON.stringify(REAL_DESIGN)); Object.assign(d, S.design); sfx.ok(); render(); };
    $('#back').onclick = () => menu();
    $('#poll').onclick = () => poll(c);
    drawPowerGraph(d, c);
  };
  render();
}

function drawPowerGraph(d, c) {
  const g = $('#pg'); if (!g) return;
  const x = g.getContext('2d'), col = C(), w = g.width, h = g.height, y0 = 1977, y1 = 2060, pmax = 5 * RTG.watts;
  x.fillStyle = col.bg; x.fillRect(0, 0, w, h);
  const X = y => (y - y0) / (y1 - y0) * w, Y = p => h - 4 - p / pmax * (h - 8);
  x.fillStyle = col.bad; for (let i = 0; i < w; i += 3) x.fillRect(i, Y(c.bus.essential) | 0, 2, 1);
  x.fillStyle = col.dim; x.fillRect(X(2026) | 0, 0, 1, h);
  x.fillStyle = col.fg;
  for (let i = 0; i < w; i++) { const yr = y0 + i / w * (y1 - y0); if (yr >= c.launchYear) x.fillRect(i, Y(supplyAt(d, yr)) | 0, 1, 2); }
  x.font = '10px VT323'; x.fillStyle = col.hi; x.fillText('RTG power vs needed (dashed) · 1977-2060 · line = 2026', 3, 9);
}

function poll(c) {
  const goals = S.mode === 'crew'
    ? S.players.map(p => `<p><b class="hi">${esc(p.name)}</b>: ${p.roles.map(r => `<br>• <span class="muted">${ROLES[r].name}:</span> ${ROLES[r].goal}`).join('')}</p>`).join('')
    : ROLE_ORDER.map(r => `<p>• <span class="muted">${ROLES[r].name}:</span> ${ROLES[r].goal}</p>`).join('');
  const st = {};
  const render = () => {
    const all = S.players.every((p, i) => st[i]);
    ui(`<div class="center"><div class="box" style="max-width:760px;text-align:left"><h2>GO / NO-GO POLL</h2>
      <p>Flight, this is the final poll for launch. ${S.mode === 'crew' ? 'Each controller: are you GO?' : ''}</p>
      ${c.checks.filter(k => !k.ok).map(k => `<p class="bad">! ${k.msg}</p>`).join('') || '<p class="ok">All systems nominal.</p>'}
      <h3 style="margin-top:12px">${S.mode === 'crew' ? 'Personal goals' : 'Bonus goals'}</h3>${goals}
      <p style="text-align:center">${S.players.map((p, i) => `<button class="${st[i] ? 'on' : ''}" data-p="${i}">${esc(p.name)}: ${st[i] ? 'GO' : 'NO-GO'}</button>`).join('')}</p>
      <p style="text-align:center"><button id="nb">◀ BACK TO DESIGN</button><button class="big" id="lg" ${all ? '' : 'disabled'}>LAUNCH ▶</button></p></div></div>`);
    UI.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { st[b.dataset.p] = !st[b.dataset.p]; beep(st[b.dataset.p] ? 880 : 300, .05); render(); });
    $('#nb').onclick = designScreen;
    $('#lg').onclick = () => startRun();
  };
  render();
}
