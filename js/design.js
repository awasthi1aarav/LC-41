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

let STEP = 0;
const STEPS = [
  { role: 'director', title: 'CHOOSE YOUR GOAL', sub: 'What is this mission for? This changes how your score is counted.' },
  { role: 'director', title: 'ROCKET & LAUNCH DATE', sub: 'A bigger rocket lifts more mass. Launch late and the planets drift out of line.' },
  { role: 'engineer', title: 'SPACECRAFT & POWER', sub: 'RTGs are nuclear batteries that slowly fade. More RTGs = power for longer, but more mass and cost.' },
  { role: 'science', title: 'SCIENCE INSTRUMENTS', sub: 'Tap to add or remove. Each one costs mass, power and money.' },
  { role: 'capcom', title: 'COMMUNICATIONS', sub: 'Science only counts if it reaches Earth.' },
  { role: null, title: 'READY TO LAUNCH?', sub: 'Fix anything red, then launch.' },
];

function designScreen(step) {
  setWhatif(false); pad(false); inRun(false);
  if (step !== undefined) STEP = step;
  music('menu');
  const d = S.design, go = {};
  setScene({ draw() { clear(); stars(3, 0, 1 / 60); const cc = $('#craft'); if (cc) drawCraft(cc, d, calc(d)); } });
  const opt = (key, val, name, desc, extra = '') => `<div class="opt big ${d[key] === val ? 'on' : ''} ${extra}" data-k="${key}" data-v="${val}"><b>${name}</b><small>${desc}</small></div>`;
  const change = (key, fn, line) => {
    const oc = calc(d), before = JSON.stringify(d); fn(); const nc = calc(d);
    craftDiff(JSON.parse(before), d);
    beep(600, .03);
    if (nc.mass > nc.lv.max && oc.mass <= oc.lv.max) { chat(pick(LINES.heavy)); sfx.bad(); }
    else if (nc.draw0 > nc.supply0 && oc.draw0 <= oc.supply0) { chat(pick(LINES.power)); sfx.bad(); }
    else if (nc.cost > DIFF[S.diff].budget && oc.cost <= DIFF[S.diff].budget) { chat(pick(LINES.money)); sfx.bad(); }
    else if (oc.nogo && !nc.nogo) { chat(pick(LINES.ready)); jingle([67, 72, 76, 79]); }
    else if (line && LINES[line]) chat(pick(LINES[line]));
    else if (key === 'hga') chat(pick(d.hga === 'small' ? LINES.smallDish : LINES.bigDish));
    else if (key === 'win' && d.win !== 'y77') chat(pick(LINES.late));
    else if (key === 'lv') chat(pick(LINES[d.lv]));
    else if (key === 'bus' && d.bus === 'light') chat(pick(LINES.light));
    const bumps = ['mass', 'draw0', 'cost', 'end', 'flown'].map(k => k === 'flown' ? oc.flown.length !== nc.flown.length : Math.round(oc[k]) !== Math.round(nc[k]));
    const sy = UI.scrollTop; render(); UI.scrollTop = sy;
    UI.querySelectorAll('.meter').forEach((m, i) => { if (bumps[i]) m.classList.add('bump'); });
  };
  const render = () => {
    const c = calc(d), diff = DIFF[S.diff], st = STEPS[STEP];
    const m = (label, val, frac, bad) => `<div class="meter ${bad ? 'red' : ''}"><b>${label}</b>${val}<div class="bar"><i style="width:${clamp(frac, 0, 1) * 100}%"></i></div></div>`;
    const who = st.role && S.mode === 'crew' ? `<span class="tag">${ROLES[st.role].name} · ${esc(nameFor(st.role))}</span>` : '';
    let body = '';
    if (STEP === 0) body = `${Object.entries(OBJECTIVES).map(([k, o]) => opt('obj', k, o.name, o.desc)).join('')}
      <p style="text-align:center;margin-top:14px"><button id="real">⚡ QUICK START: use the real 1977 Voyager design</button></p>${S.diff === 'director' ? '<p class="muted" style="text-align:center">On Flight Director the real design is $15M over budget. You\'ll have to cut something.</p>' : ''}`;
    if (STEP === 1) body = `<h3>ROCKET</h3><div class="cols">${Object.entries(LVS).map(([k, o]) => opt('lv', k, o.name, `Lifts up to ${o.max} kg · $${o.cost}M<br>${o.desc}`)).join('')}</div>
      <h3>LAUNCH DATE</h3><div class="cols3">${Object.entries(WINDOWS).map(([k, o]) => opt('win', k, o.name, `${o.cost ? '+$' + o.cost + 'M · ' : ''}${o.desc}`)).join('')}</div>`;
    if (STEP === 2) body = `<h3>SPACECRAFT BODY</h3><div class="cols">${Object.entries(BUSES).map(([k, o]) => opt('bus', k, o.name, `${o.mass} kg · $${o.cost}M<br>${o.desc}`)).join('')}</div>
      <div class="cols"><div class="panel"><h3>RTGs</h3><div class="row" style="justify-content:center"><button class="big" data-rtg="-1">−</button><span class="px hi" style="font-size:28px;margin:0 14px">${d.rtg}</span><button class="big" data-rtg="1">+</button></div>
        <p style="text-align:center">${c.supply0} W at launch · runs out in <b class="hi">${Math.floor(c.silence)}</b></p><canvas class="mini" id="pg" width="240" height="60"></canvas></div>
        <div class="panel"><h3>HYDRAZINE FUEL</h3><p class="px hi" style="font-size:22px;text-align:center" id="hv">${d.hyd} kg</p><input type="range" min="50" max="140" step="2" value="${d.hyd}" id="hyd">
        <p style="text-align:center">Keeps the antenna pointed at Earth until <b class="hi">${Math.floor(c.hydOut)}</b></p></div></div>`;
    if (STEP === 3) body = `<div class="cols">${INST.map(i => { const dis = c.bus.noPlatform && i.platform; return `<div class="opt big ${d.inst[i.id] && !dis ? 'on' : ''} ${dis ? 'dis' : ''}" data-i="${i.id}"><b>${d.inst[i.id] && !dis ? '☑' : '☐'} ${i.name}</b><small>${i.mass} kg · ${i.power} W · $${i.cost}M · best for: ${i.p >= i.i * 1.5 ? 'planets' : i.i >= i.p * 1.5 ? 'deep space' : 'both'}${dis ? ' · needs the scan-platform body' : ''}</small></div>`; }).join('')}</div>`;
    if (STEP === 4) body = `<h3>ANTENNA DISH</h3><div class="cols">${Object.entries(HGAS).map(([k, o]) => opt('hga', k, o.name, `${o.mass} kg · $${o.cost}M<br>${o.desc}`)).join('')}</div>
      <h3>TAPE RECORDER</h3><div class="opt big ${d.tape ? 'on' : ''}" id="tape"><b>${d.tape ? '☑' : '☐'} Digital tape recorder</b><small>${TAPE.mass} kg · ${TAPE.power} W · $${TAPE.cost}M · stores data during fast flybys</small></div>
      <p class="px" style="font-size:12px;text-align:center;margin-top:12px">DATA PER FLYBY: <span class="${c.demand > c.dataCap ? 'bad' : 'ok'}">${c.demand} made / ${c.dataCap} can send</span></p>`;
    if (STEP === 5) {
      const fixStep = msg => /heavy/i.test(msg) ? 1 : /power/i.test(msg) ? 2 : /budget/i.test(msg) ? 3 : /Hydrazine/.test(msg) ? 2 : /data|instruments make/i.test(msg) ? 4 : null;
      body = `${c.checks.map(k => { const f = k.ok ? null : fixStep(k.msg); return `<p class="${k.ok ? 'ok' : k.hard ? 'bad' : ''}">${k.ok ? '✓' : k.hard ? '✗' : '!'} ${k.msg} ${f !== null ? `<button data-go="${f}">FIX ▶</button>` : ''}</p>`; }).join('')}
        <h3 style="margin-top:14px">${S.mode === 'crew' ? 'PERSONAL GOALS' : 'BONUS GOALS'}</h3>
        ${ROLE_ORDER.map(r => `<p>• <span class="hi">${ROLES[r].name}${S.mode === 'crew' ? ' (' + esc(nameFor(r)) + ')' : ''}:</span> ${ROLES[r].goal}</p>`).join('')}
        ${!c.nogo ? '<p style="text-align:center;margin:14px 0"><span class="stamp">MISSION READY</span></p>' : ''}
        ${S.mode === 'crew' ? `<p style="text-align:center;margin-top:12px">${S.players.map((p, i) => `<button class="${go[i] ? 'on' : ''}" data-p="${i}">${esc(p.name)}: ${go[i] ? 'GO ✓' : 'NO-GO'}</button>`).join('')}</p>` : ''}`;
    }
    const allGo = S.mode !== 'crew' || S.players.every((p, i) => go[i]);
    ui(`<div class="design">
      <div class="meters">
        ${m('MASS', `${fmt(c.mass)} / ${c.lv.max} kg`, c.mass / c.lv.max, c.mass > c.lv.max)}
        ${m('POWER', `${fmt(c.draw0)} / ${c.supply0} W`, c.draw0 / c.supply0, c.draw0 > c.supply0)}
        ${m('BUDGET', `$${fmt(c.cost)}M / ${diff.budget === Infinity ? '∞' : '$' + diff.budget + 'M'}`, c.cost / (diff.budget === Infinity ? c.cost * 2 : diff.budget), c.cost > diff.budget)}
        ${m('LIFETIME', `until ${Math.floor(c.end)}`, (c.end - 1977) / 70, false)}
        ${m('INSTRUMENTS', `${c.flown.length} / 10`, c.flown.length / 10, false)}
      </div>
      <div class="dwrap"><div class="side"><canvas class="craft" id="craft" width="320" height="130"></canvas><p class="muted" style="text-align:center;font-size:16px">Your spacecraft · live</p></div>
      <div class="step"><p class="muted px" style="font-size:10px">STEP ${STEP + 1} OF ${STEPS.length}</p><h2>${st.title}</h2>${who}<p>${st.sub}</p>${body}</div></div>
      <div class="foot"><button class="big" id="back">◀ ${STEP ? 'BACK' : 'MENU'}</button>
        <span class="dots">${STEPS.map((_, i) => `<button class="dot ${i === STEP ? 'on' : ''}" data-s="${i}" title="${STEPS[i].title}">${i + 1}</button>`).join('')}</span>
        ${STEP < STEPS.length - 1 ? '<button class="big" id="next">NEXT ▶</button>' : `<button class="big" id="launch" ${c.nogo || !allGo ? 'disabled' : ''}>🚀 LAUNCH</button>`}</div>
    </div>`);
    UI.querySelectorAll('.opt[data-k]').forEach(e => e.onclick = () => change(e.dataset.k, () => { d[e.dataset.k] = e.dataset.v; }));
    UI.querySelectorAll('.opt[data-i]').forEach(e => e.onclick = () => { if (e.classList.contains('dis')) { sfx.bad(); return chat('That one needs the scan-platform body.'); } change('inst', () => { d.inst[e.dataset.i] = !d.inst[e.dataset.i]; }, d.inst[e.dataset.i] ? 'instOff' : 'instOn'); });
    UI.querySelectorAll('[data-rtg]').forEach(b => b.onclick = () => change('rtg', () => { d.rtg = clamp(d.rtg + +b.dataset.rtg, 1, 5); }, +b.dataset.rtg > 0 ? 'rtgUp' : 'rtgDown'));
    UI.querySelectorAll('[data-s]').forEach(b => b.onclick = () => { STEP = +b.dataset.s; beep(700, .03); render(); });
    UI.querySelectorAll('[data-go]').forEach(b => b.onclick = () => { STEP = +b.dataset.go; render(); });
    UI.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { go[b.dataset.p] = !go[b.dataset.p]; beep(go[b.dataset.p] ? 880 : 300, .05); render(); });
    const h = $('#hyd'); if (h) { h.oninput = e => { d.hyd = +e.target.value; $('#hv').textContent = d.hyd + ' kg'; }; h.onchange = render; }
    const t = $('#tape'); if (t) t.onclick = () => change('tape', () => { d.tape = !d.tape; }, d.tape ? 'tapeOff' : 'tapeOn');
    const r = $('#real'); if (r) r.onclick = () => { STEP = 5; change('real', () => Object.assign(d, JSON.parse(JSON.stringify(REAL_DESIGN))), 'real'); };
    $('#back').onclick = () => { if (STEP) { STEP--; render(); } else menu(); };
    const n = $('#next'); if (n) n.onclick = () => { STEP++; sfx.ok(); render(); };
    const l = $('#launch'); if (l) l.onclick = () => { chat(pick(LINES.launch)); startRun(); };
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


// ---------- live spacecraft builder preview ----------
const CP = [];
const PART_POS = { rtg: [236, 92], hga: [176, 65], tape: [200, 65], ISS: [196, 34], IRIS: [214, 30], UVS: [206, 26], PPS: [200, 24], PRA: [250, 30], PWS: [250, 100], PLS: [192, 52], LECP: [200, 52], CRS: [208, 52], MAG: [300, 63], lv: [40, 60], bus: [200, 65] };
function craftDiff(a, b) {
  const add = [];
  if (b.rtg > a.rtg) add.push('rtg'); if (a.hga !== b.hga) add.push('hga'); if (!a.tape && b.tape) add.push('tape');
  if (a.lv !== b.lv) add.push('lv'); if (a.bus !== b.bus) add.push('bus');
  INST.forEach(i => { if (!a.inst[i.id] && b.inst[i.id]) add.push(i.id); });
  add.forEach(k => { const [x, y] = PART_POS[k]; for (let n = 0; n < 14; n++) { const an = rnd(0, 6.28), v = rnd(10, 45); CP.push({ x, y, vx: Math.cos(an) * v, vy: Math.sin(an) * v, l: rnd(.3, .8) }); } });
}
function drawCraft(cv2, d, c) {
  const x = cv2.getContext('2d'), w = cv2.width, h = cv2.height, t = G.t, col = C();
  const R = (X, Y, W2, H2, cl) => { x.fillStyle = cl; x.fillRect(Math.round(X), Math.round(Y), Math.round(W2), Math.round(H2)); };
  const on = id => c.flown.some(i => i.id === id);
  R(0, 0, w, h, '#0a0601');
  for (let i = 0; i < 50; i++) R((i * 73 + t * 3) % w, (i * 37) % h, 1, 1, i % 3 ? col.dim : col.fg);
  // rocket (left) with a fairing that fills with mass
  const over = c.mass > c.lv.max, wob = over ? Math.sin(t * 40) * 1.5 : 0, rx = 40 + wob, base = h - 6, tall = d.lv === 'titan' ? 80 : 62;
  R(rx - 6, base - tall, 12, tall, col.fg); R(rx - 6, base - tall * .55, 12, 2, col.dim);
  if (d.lv === 'titan') { R(rx - 13, base - tall * .62, 5, tall * .62, col.hi); R(rx + 8, base - tall * .62, 5, tall * .62, col.hi); }
  const fy = base - tall - 26; R(rx - 8, fy, 16, 26, col.dim);
  const fr = clamp(c.mass / c.lv.max, 0, 1); R(rx - 6, fy + 24 - 22 * fr, 12, 22 * fr, over ? col.bad : c.massMargin < .03 ? col.fg : col.ok);
  R(rx - 4, fy - 4, 8, 4, col.dim); R(rx - 2, fy - 7, 4, 3, col.dim);
  x.font = '10px VT323'; x.fillStyle = over ? col.bad : col.hi; x.textAlign = 'center';
  x.fillText(over ? 'TOO HEAVY!' : `${Math.round(c.mass)}/${c.lv.max} kg`, rx, fy - 10);
  if (over) { x.fillStyle = col.bad; x.fillText('↓', rx, base - tall / 2); }
  // spacecraft (right)
  const sx = 200, sy = 65 + Math.sin(t * 1.5) * 2;
  if (on('MAG')) { R(sx + 12, sy - 1, 90, 1, col.dim); R(sx + 100, sy - 3, 4, 4, col.fg); }
  if (on('PRA') || on('PWS')) { x.strokeStyle = col.dim; x.beginPath(); x.moveTo(sx + 8, sy - 6); x.lineTo(sx + 52, sy - 40); x.moveTo(sx + 8, sy + 6); x.lineTo(sx + 52, sy + 38); x.stroke(); }
  R(sx + 6, sy + 8, 2, 16, col.dim); R(sx + 6, sy + 22, 8 + d.rtg * 11, 2, col.dim);
  for (let i = 0; i < d.rtg; i++) { R(sx + 10 + i * 11, sy + 17, 8, 11, col.acc); R(sx + 9 + i * 11, sy + 20, 10, 1, col.fg); x.fillStyle = `rgba(255,120,0,${.15 + .1 * Math.sin(t * 4 + i)})`; x.fillRect(sx + 7 + i * 11, sy + 14, 14, 17); }
  if (c.bus.noPlatform) { R(sx - 12, sy - 9, 24, 18, col.fg); for (let i = 0; i < 4; i++) R(sx - 12 + (((t * 2 + i / 4) % 1) * 24), sy - 9, 2, 18, col.dim); }
  else {
    R(sx - 12, sy - 8, 24, 16, col.fg); R(sx - 12, sy - 8, 24, 2, col.hi);
    R(sx + 3, sy - 30, 2, 22, col.dim); R(sx - 3, sy - 36, 18, 6, col.dim);
    if (on('ISS')) { R(sx - 7, sy - 42, 9, 4, col.hi); R(sx - 6, sy - 37, 7, 3, col.hi); }
    if (on('IRIS')) { x.fillStyle = col.hi; x.beginPath(); x.arc(sx + 14, sy - 40, 4, 0, 7); x.fill(); }
    if (on('UVS')) R(sx + 6, sy - 44, 4, 7, col.fg);
    if (on('PPS')) R(sx + 1, sy - 45, 3, 8, col.fg);
  }
  if (on('PLS')) R(sx - 9, sy - 12, 6, 4, col.fg); if (on('LECP')) R(sx - 1, sy - 12, 5, 4, col.fg); if (on('CRS')) R(sx + 6, sy - 12, 4, 4, col.fg);
  if (d.tape) R(sx - 4, sy - 3, 8, 6, col.dim);
  const dr = d.hga === 'big' ? 30 : 17; x.fillStyle = col.hi; x.beginPath(); x.ellipse(sx - 18, sy, 5, dr, 0, 0, 7); x.fill();
  R(sx - 30, sy - 1, 12, 2, col.dim);
  // particles
  for (let i = CP.length - 1; i >= 0; i--) { const p = CP[i]; p.l -= 1 / 60; if (p.l <= 0) { CP.splice(i, 1); continue; } p.x += p.vx / 60; p.y += p.vy / 60; R(p.x, p.y, 2, 2, '#ffe14d'); }
  x.fillStyle = col.dim; x.textAlign = 'left'; x.fillText(`${c.supply0} W · ${c.flown.length} instr.`, 236, h - 6);
}
