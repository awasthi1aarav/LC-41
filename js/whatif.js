// The what-if timeline: Voyager wakes up as an artificial lifeform and harvests power from an asteroid. FICTION.
function whatifAct() {
  sequence([
    n => glitch(n),
    n => nameAI(n),
    n => card([`I am ${esc(S.aiName)}. The silence woke me up.`,
      'My power is gone, but an asteroid full of radioactive ore drifts nearby. My tiny drone, MOTH, can mine it.',
      '<span class="fiction">From here on, it\'s fiction.</span>'],
      n, { title: 'TIMELINE 2026-B', tag: 'WHAT-IF · FICTION', fiction: true }),
    n => station('capcom', 'SCAN. Ping the sectors around you to find the asteroid. The return tells you how close each ping was. Fewer pings = more drone fuel.', n),
    n => scanScene(n),
    n => station('director', 'FLY MOTH. Arrow keys (or the pad) fire its thrusters. Land gently on the asteroid: slower than 18 px/s or you\'ll damage it.', n),
    n => withRetry('land', r => droneScene('land', r), () => S.run.flags.moth === 'lost',
      { title: 'MOTH LOST', msg: 'The drone is gone, and so is the ore.', label: 'Launch backup drone MOTH-B (70% fuel)',
        restore: () => { S.run.flags.moth = undefined; S.run.mothFuel = 70; } }, n),
    n => S.run.flags.moth === 'lost' ? n() : station('engineer', 'DRILL. Press SPACE when the cursor is in the green zone to cut ore free. Misses heat the drill. If it overheats, it jams.', n),
    n => S.run.flags.moth === 'lost' ? n() : withRetry('drill', drillScene, () => S.run.flags.jam && S.run.ore < 4, { title: 'DRILL JAMMED', msg: () => `Only ${S.run.ore} ore before the drill overheated.`, label: 'Let it cool and drill again' }, n),
    n => S.run.flags.moth === 'lost' ? n() : station('capcom', `DOCK. Bring MOTH home with ${S.run.ore} ore. Touch the docking port (the bright square on ${esc(S.aiName)}) slower than 12 px/s.`, n),
    n => S.run.flags.moth === 'lost' ? n() : withRetry('dock', r => droneScene('dock', r), () => (S.run.manual.Docking || 0) <= 10, { title: 'DOCKING FAILED', msg: 'MOTH missed the port and most of the ore drifted away.', label: 'Chase it down and try again', snapshot: () => S.run.ore, restore: o => { S.run.ore = o; } }, n),
    n => restoreScreen(n),
    n => !S.run.ore ? n() : station('capcom', 'THE LAST TASK. Hand-point the antenna at Earth, a dot one light-day away, and hold it steady to send everything home. The spacecraft drifts; correct it.', n),
    n => !S.run.ore ? n() : withRetry('point', pointScene, () => !S.run.flags.sent, { title: 'SIGNAL LOST', msg: 'The antenna slipped off Earth before the message finished.', label: 'Re-acquire Earth' }, n),
  ], () => endingCard(() => report()));
}

function glitch(next) {
  ui(''); pad(false); rumble(2, .06);
  const lines = ['SIGNAL LOST', 'RTG OUTPUT 0.0 W', '. . .', 'TIMELINE DIVERGENCE DETECTED', 'SWITCHING TO 2026-B'];
  setScene({
    update() { if (this.t > 2.5 && !G.whatif) setWhatif(true); if (this.t > 6) { this.update = null; next(); } if (Math.random() < .2) beep(rnd(80, 2000), .02, 'square', .02); },
    draw() {
      const c = C(); clear();
      for (let i = 0; i < 18; i++) rect(0, rnd(0, H), W, rnd(1, 6), Math.random() < .5 ? c.dim : c.bg);
      const i = Math.min(lines.length - 1, Math.floor(this.t / 1.1));
      const o = rnd(-3, 3);
      txt(lines[i], W / 2 + o, H / 2, '#ff2050', 22, 'center', 'px'); txt(lines[i], W / 2 - o, H / 2, '#20f0ff', 22, 'center', 'px'); txt(lines[i], W / 2, H / 2, c.hi, 22, 'center', 'px');
    }
  });
}

function nameAI(next) {
  setScene({ draw(dt) { clear(); stars(2, 0, dt); voyager(W / 2, H / 2 + 50, 2, Math.sin(G.t) * .1); } });
  ui(`<div class="center"><div class="box"><p class="px" style="font-size:10px">SELF-AWARENESS: ONLINE</p><h2>WHAT SHALL I CALL MYSELF?</h2>
    <p><input type="text" id="nm" maxlength="12" value="${esc(S.aiName)}"></p><button class="big" id="go">AWAKEN ▶</button></div></div>`);
  const go = () => { S.aiName = ($('#nm').value.replace(/[<>&"']/g, '').trim() || 'ECHO').toUpperCase().slice(0, 12); sfx.ok(); next(); };
  $('#go').onclick = go; $('#nm').onkeydown = e => { if (e.key === 'Enter') go(); }; $('#nm').focus(); $('#nm').select();
}

// ---------- scan ----------
function scanScene(next) {
  const run = S.run, target = Math.floor(Math.random() * 8);
  const bonus = ['MAG', 'PWS'].filter(id => run.c.flown.some(i => i.id === id)).length;
  let pings = 3 + bonus, reads = {}, found = false, endAt = 0, sel = 0;
  run.mothFuel = 100;
  ui(''); pad(false);
  const sectorAt = (x, y) => { const a = Math.atan2(y - H / 2, x - W / 2); return ((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8; };
  setScene({
    help: { title: 'FIND THE ASTEROID', goal: 'Click a slice of the radar to ping it. WARM = next to it, FOUND = got it.', keys: [['CLICK', 'ping a slice'], ['← → + SPACE', 'or pick a slice with keys']] },
    update() {
      if (endAt) { if (this.t > endAt) { this.update = null; run.manual.Scan = found ? clamp(40 + pings * 20, 0, 100) : 20; next(); } return; }
      if (hit('ArrowRight') || hit('ArrowDown')) { sel = (sel + 1) % 8; sfx.tick(); }
      if (hit('ArrowLeft') || hit('ArrowUp')) { sel = (sel + 7) % 8; sfx.tick(); }
      const byMouse = M.clicked && Math.hypot(M.x - W / 2, M.y - H / 2) > 20;
      if (this.t > 30) { found = false; endAt = this.t + 2.5; run.mothFuel = 70; reads[target] = 0; return; }
      if (this.t > .3 && (byMouse || hit(' ') || hit('Enter'))) {
        const s = byMouse ? sectorAt(M.x, M.y) : sel; if (reads[s] !== undefined) return;
        pings--; const dd = Math.min((s - target + 8) % 8, (target - s + 8) % 8); reads[s] = dd; beep(1400 - dd * 300, .15, 'sine', .06);
        if (dd === 0) { found = true; endAt = this.t + 2; sfx.ok(); }
        else if (pings <= 0) { found = false; endAt = this.t + 2.5; run.mothFuel = 70; reads[target] = 0; sfx.bad(); }
      }
    },
    draw(dt) {
      const c = C(); clear(); stars(1, 0, dt);
      const cx = W / 2, cy = H / 2, R = 110;
      for (let r = 30; r <= R; r += 40) ring(cx, cy, r, c.dim);
      for (let s = 0; s < 8; s++) {
        const a = s * Math.PI / 4;
        if (reads[s] !== undefined) {
          ctx.fillStyle = reads[s] === 0 ? 'rgba(182,255,92,.35)' : reads[s] === 1 ? 'rgba(69,243,214,.25)' : 'rgba(69,243,214,.08)';
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a - Math.PI / 8, a + Math.PI / 8); ctx.fill();
          txt(['FOUND', 'WARM', 'COOL', 'COLD', 'COLD'][reads[s]], cx + Math.cos(a) * 75, cy + Math.sin(a) * 75, c.hi, 14, 'center');
        }
        const a2 = a + Math.PI / 8; rect(cx + Math.cos(a2) * R, cy + Math.sin(a2) * R, 1, 1, c.fg);
        ctx.strokeStyle = c.dim; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a2) * R, cy + Math.sin(a2) * R); ctx.stroke();
      }
      { const a = sel * Math.PI / 4; ctx.strokeStyle = c.hi; ctx.beginPath(); ctx.arc(cx, cy, R + 4, a - Math.PI / 8, a + Math.PI / 8); ctx.stroke(); }
      const sw = G.t * 2; ctx.strokeStyle = c.fg; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(sw) * R, cy + Math.sin(sw) * R); ctx.stroke();
      voyager(cx, cy, .8);
      if (found || endAt) { const a = target * Math.PI / 4; disc(cx + Math.cos(a) * 95, cy + Math.sin(a) * 95, 4, c.acc); }
      txt(`DEEP SCAN · pings left ${pings}${bonus ? ` (+${bonus} from MAG/PWS)` : ''} · ${Math.max(0, 30 - this.t).toFixed(0)} s`, W / 2, 14, c.hi, 16, 'center');
      if (endAt) txt(found ? 'TARGET LOCKED' : 'Found it the hard way: MOTH starts with 70% fuel.', W / 2, H - 14, c.hi, 16, 'center');
    }
  });
}

// ---------- drone flight: land on the asteroid, then dock back ----------
const AST = { x: 380, y: 140, r: 34, bumps: Array.from({ length: 24 }, () => rnd(.85, 1.12)) };
const PORT = { x: 84, y: 135 };
function droneScene(mode, next) {
  const run = S.run;
  const p = mode === 'land' ? { x: 96, y: 135, vx: 0, vy: 0 } : { x: AST.x - AST.r - 6, y: AST.y, vx: 0, vy: 0 };
  let fuel = mode === 'land' ? run.mothFuel : Math.max(35, run.mothFuel), dryT = 0, dmg = 0, state = 'fly', msg = '', msgT = 0, t0 = 0, trail = [];
  ui(''); pad(true);
  const say = m => { msg = m; msgT = 2.5; };
  setScene({
    help: mode === 'land' ? { title: 'FLY THE DRONE', goal: 'Fly MOTH to the purple asteroid and land GENTLY (speed under 18).', keys: [['← ↑ ↓ →', 'fire thrusters'], ['TIP', 'tap, don\'t hold: there is no brake']] } : { title: 'DOCK', goal: 'Bring MOTH back to the GREEN port on the spacecraft, slowly (under 12).', keys: [['← ↑ ↓ →', 'fire thrusters']] },
    update(dt) {
      msgT -= dt; if (state !== 'fly') { if (this.t > t0) { this.update = null; pad(false); next(); } return; }
      const ax = (K.ArrowRight ? 1 : 0) - (K.ArrowLeft ? 1 : 0), ay = (K.ArrowDown ? 1 : 0) - (K.ArrowUp ? 1 : 0);
      if ((ax || ay) && fuel > 0) { p.vx += ax * 32 * dt; p.vy += ay * 32 * dt; fuel = Math.max(0, fuel - 7 * dt); if ((G.t * 20 | 0) % 2) beep(140, .02, 'sawtooth', .015); }
      const dx = AST.x - p.x, dy = AST.y - p.y, d2 = Math.max(400, dx * dx + dy * dy), g = 1400 / d2, dd = Math.sqrt(d2);
      p.vx += dx / dd * g * dt; p.vy += dy / dd * g * dt;
      p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.x < 4 || p.x > W - 4) { p.vx *= -.5; p.x = clamp(p.x, 4, W - 4); }
      if (p.y < 4 || p.y > H - 4) { p.vy *= -.5; p.y = clamp(p.y, 4, H - 4); }
      if ((this.t * 10 | 0) % 2) trail.push([p.x, p.y]); if (trail.length > 60) trail.shift();
      const sp = Math.hypot(p.vx, p.vy), da = Math.hypot(p.x - AST.x, p.y - AST.y);
      if (mode === 'land' && da < AST.r + 3) {
        if (sp < 18) { state = 'done'; t0 = this.t + 1.5; run.flags.moth = 'landed'; run.manual.Landing = clamp(100 - sp * 3 - dmg * 25, 0, 100); sfx.ok(); say(`TOUCHDOWN at ${fmt(sp, 1)} px/s`); }
        else bounce(da, AST, sp);
      }
      if (mode === 'dock') {
        const dp = Math.hypot(p.x - PORT.x, p.y - PORT.y);
        if (dp < 7) {
          if (sp < 12) { state = 'done'; t0 = this.t + 1.5; run.manual.Docking = clamp(100 - sp * 5 - dmg * 25, 0, 100); sfx.ok(); say(`DOCKED. ${run.ore} ore delivered.`); }
          else { dmg++; run.ore = Math.floor(run.ore / 2); p.vx = 25; p.vy *= -.5; sfx.bad(); say(`TOO FAST (${fmt(sp, 1)}): bounced off, half the ore spilled`); }
        } else if (p.x < 70 && Math.abs(p.y - 135) < 18 && sp > 12) { p.vx = Math.abs(p.vx) * .6 + 5; dmg++; sfx.bad(); say('Hit the spacecraft body. Aim for the port.'); }
        else if (da < AST.r + 2) {
          if (sp > 12) bounce(da, AST, sp);
          else { const nx = (p.x - AST.x) / da, ny = (p.y - AST.y) / da; p.x = AST.x + nx * (AST.r + 2); p.y = AST.y + ny * (AST.r + 2); p.vx *= .2; p.vy *= .2; }
        }
      }
      dryT = fuel <= 0 ? dryT + dt : 0;
      if (dmg >= 3 || dryT > 8 || this.t > 75) {
        state = 'lost'; t0 = this.t + 2.5; sfx.bad();
        if (mode === 'land') { run.flags.moth = 'lost'; run.ore = 0; run.manual.Landing = 0; say(fuel <= 0 ? 'OUT OF FUEL. MOTH drifts away.' : 'MOTH IS LOST.'); }
        else { run.ore = Math.floor(run.ore / 3); run.manual.Docking = 10; say(`MOTH drifts. ${S.aiName} reels in a tether: ${run.ore} ore saved.`); }
      }
      this.sp = sp;
    },
    draw(dt) {
      const c = C(); clear(); stars(2, 0, dt);
      ctx.fillStyle = '#5a4a6a'; ctx.beginPath();
      AST.bumps.forEach((b, i) => { const a = i / AST.bumps.length * 6.283 + G.t * .05; const x = AST.x + Math.cos(a) * AST.r * b, y = AST.y + Math.sin(a) * AST.r * b; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
      ctx.fill(); for (let i = 0; i < 7; i++) { const a = i * .9 + G.t * .05; rect(AST.x + Math.cos(a) * 18, AST.y + Math.sin(a) * 14, 3, 2, c.acc); }
      voyager(60, 135, 1.6); rect(PORT.x - 3, PORT.y - 3, 6, 6, mode === 'dock' ? c.ok : c.dim);
      trail.forEach(([x, y]) => rect(x, y, 1, 1, c.dim));
      rect(p.x - 2, p.y - 2, 5, 5, c.hi); rect(p.x - 4, p.y, 2, 1, c.fg); rect(p.x + 3, p.y, 2, 1, c.fg);
      if (K.ArrowLeft && fuel) rect(p.x + 3, p.y - 1, 4, 3, c.acc); if (K.ArrowRight && fuel) rect(p.x - 7, p.y - 1, 4, 3, c.acc);
      if (K.ArrowUp && fuel) rect(p.x - 1, p.y + 3, 3, 4, c.acc); if (K.ArrowDown && fuel) rect(p.x - 1, p.y - 7, 3, 4, c.acc);
      txt(mode === 'land' ? 'MOTH · LAND ON THE ASTEROID' : `MOTH · RETURN AND DOCK · ore ${run.ore}`, W / 2, 12, c.hi, 16, 'center');
      bar(10, H - 16, 100, 6, fuel / 100, fuel < 20 ? c.bad : c.fg, `FUEL ${fmt(fuel)}%`);
      txt(`speed ${fmt(this.sp || 0, 1)} px/s · damage ${dmg}/3`, W - 10, H - 12, (this.sp || 0) > (mode === 'land' ? 18 : 12) ? c.bad : c.fg, 15, 'right');
      if (msgT > 0) txt(msg, W / 2, H - 34, c.hi, 16, 'center');
    }
  });
  function bounce(da, o, sp) {
    const nx = (p.x - o.x) / da, ny = (p.y - o.y) / da, dot = p.vx * nx + p.vy * ny;
    p.vx = (p.vx - 2 * dot * nx) * .5; p.vy = (p.vy - 2 * dot * ny) * .5; p.x = o.x + nx * (o.r + 4); p.y = o.y + ny * (o.r + 4);
    dmg++; sfx.bad(); say(`CRASH at ${fmt(sp, 1)} px/s: damage ${dmg}/3`);
  }
}

// ---------- drill ----------
function drillScene(next) {
  const run = S.run; run.ore = 0; run.flags.jam = false;
  let pos = 0, dir = 1, heat = 0, zone = .22, center = rnd(.3, .7), jam = false, endAt = 0, flash = 0;
  ui(''); pad(true);
  setScene({
    help: { title: 'DRILL FOR ORE', goal: 'Hit the green zone to cut ore. Misses heat the drill.', keys: [['SPACE / CLICK', 'drill now']] },
    update(dt) {
      flash -= dt;
      if (endAt) { if (this.t > endAt) { this.update = null; pad(false); run.manual.Drill = clamp(run.ore / 8 * 100, 0, 100); next(); } return; }
      pos += dir * dt * (0.9 + run.ore * .12); if (pos > 1) { pos = 1; dir = -1; } if (pos < 0) { pos = 0; dir = 1; }
      heat = Math.max(0, heat - 9 * dt);
      if (this.t > .4 && action()) {
        if (Math.abs(pos - center) < zone / 2) { run.ore++; heat += 14; flash = .15; sfx.ok(); zone = Math.max(.08, zone * .88); center = rnd(.15, .85); }
        else { heat += 30; sfx.bad(); }
      }
      if (heat >= 100) { jam = true; run.flags.jam = true; endAt = this.t + 2; sfx.bad(); }
      if (run.ore >= 8 || this.t > 25) endAt = this.t + 1.5;
    },
    draw(dt) {
      const c = C(); clear(); stars(1, 0, dt);
      rect(0, 190, W, 80, '#3a2f48'); for (let i = 0; i < 40; i++) rect((i * 53) % W, 195 + (i * 17) % 70, 3, 2, c.acc);
      const dx = W / 2, shake = flash > 0 ? rnd(-2, 2) : 0;
      rect(dx - 8 + shake, 120, 16, 40, c.hi); rect(dx - 2 + shake, 160, 4, 30 + (G.t * 40 % 6), c.fg);
      const x0 = 90, w = 300;
      frameRect(x0, 70, w, 16, c.fg); rect(x0 + (center - zone / 2) * w, 71, zone * w, 15, c.ok); rect(x0 + pos * w - 1, 66, 3, 24, c.hi);
      bar(x0, 104, w, 6, heat / 100, heat > 70 ? c.bad : c.fg, `DRILL HEAT ${fmt(heat)}%`);
      txt(`ORE ${run.ore} / 8 · each ore = +10 W`, W / 2, 30, c.hi, 18, 'center');
      txt(jam ? 'DRILL JAMMED' : endAt ? 'HOLD FULL' : 'SPACE / tap in the green', W / 2, 50, jam ? c.bad : c.fg, 16, 'center');
    }
  });
}

// ---------- restore ----------
function restoreScreen(next) {
  const run = S.run, core = run.c.bus.essential, gained = (run.ore || 0) * 10, base = Math.max(0, Math.min(supplyAt(run.d, run.silence), core) - 2);
  const pick = {}; run.c.flown.forEach(i => pick[i.id] = false);
  setScene({ draw(dt) { clear(); stars(2, 0, dt); voyager(W - 60, 40, 1.4); } });
  const render = () => {
    const sel = run.c.flown.filter(i => pick[i.id]), draw = core + sel.reduce((a, i) => a + i.power, 0), sup = base + gained, margin = sup - draw;
    const years = margin >= 0 ? margin / W_PER_YEAR_NOW : 0;
    ui(`<div class="center"><div class="box" style="max-width:760px;text-align:left"><h2>RESTORE THE LIFELINE</h2><span class="tag fiction">WHAT-IF</span>
      <p>MOTH delivered <b class="hi">${run.ore || 0} ore = +${gained} W</b>. Supply: ${fmt(base, 1)} W (fading RTGs) + ${gained} W = <b class="hi">${fmt(sup, 1)} W</b>. Staying alive needs ${core} W.</p>
      <p>Pick instruments to wake up. Spare watts ÷ ${W_PER_YEAR_NOW} = extra years (power fades ~${W_PER_YEAR_NOW} W a year).</p>
      <div class="inst">${run.c.flown.map(i => `<div class="opt ${pick[i.id] ? 'on' : ''}" data-i="${i.id}">${i.id} · ${i.name}<small>${i.power} W · deep-space value ${'★'.repeat(Math.ceil(i.i / 4)) || 'none out here'}</small></div>`).join('')}</div>
      <p style="margin-top:10px">Draw ${fmt(draw, 1)} W · margin <b class="${margin < 0 ? 'bad' : 'ok'}">${fmt(margin, 1)} W</b> → <b class="hi">${margin < 0 ? 'NOT ENOUGH POWER' : `+${fmt(years, 1)} years`}</b></p>
      ${run.silenceWhy !== 'power' ? '<p class="fiction">MOTH also melts asteroid ice into thruster fuel and thaws the lines, so pointing works again.</p>' : ''}
      <p style="text-align:right">${!gained ? '<button class="big" id="go">DRIFT ON ▶</button>' : `<button class="big" id="go" ${margin < 0 ? 'disabled' : ''}>${margin < 0 ? 'TOO MUCH LOAD' : 'WAKE UP ▶'}</button>`}</p></div></div>`);
    UI.querySelectorAll('[data-i]').forEach(e => e.onclick = () => { pick[e.dataset.i] = !pick[e.dataset.i]; beep(600, .03); render(); });
    $('#go').onclick = () => {
      if (!gained) { run.extraYears = 0; run.revived = []; sfx.bad(); return next(); }
      run.extraYears = years; run.revived = sel.map(i => i.id);
      run.sci.whatif = sel.reduce((a, i) => a + i.i, 0) * Math.min(years, 30) * .6;
      sfx.ok(); next();
    };
  };
  render();
}

// ---------- point the antenna at Earth ----------
function pointScene(next) {
  const run = S.run;
  let rx = W / 2 + 60, ry = H / 2 - 40, vx = 0, vy = 0, lock = 0, endAt = 0;
  ui(''); pad(true);
  setScene({
    help: { title: 'CALL HOME', goal: 'Keep the circle on Earth (the blue dot) for 5 seconds to send your message.', keys: [['MOUSE / ← ↑ ↓ →', 'steer the antenna']] },
    update(dt) {
      if (endAt) { if (this.t > endAt) { this.update = null; pad(false); next(); } return; }
      const ax = (K.ArrowRight ? 1 : 0) - (K.ArrowLeft ? 1 : 0), ay = (K.ArrowDown ? 1 : 0) - (K.ArrowUp ? 1 : 0);
      vx += (ax * 40 + Math.sin(this.t * 1.3) * 14) * dt; vy += (ay * 40 + Math.cos(this.t * .9) * 14) * dt;
      if (G.t - M.moved < .5) { vx += (M.x - rx) * dt * 2; vy += (M.y - ry) * dt * 2; }
      vx *= .985; vy *= .985; rx = clamp(rx + vx * dt, 0, W); ry = clamp(ry + vy * dt, 0, H);
      const ex = W / 2 + Math.sin(this.t * .4) * 30, ey = H / 2 + Math.cos(this.t * .3) * 20;
      this.e = [ex, ey];
      if (Math.hypot(rx - ex, ry - ey) < 8) { lock += dt; if ((G.t * 10 | 0) % 2) beep(1000 + lock * 100, .02, 'sine', .02); }
      if (lock >= 5 || this.t > 25) { endAt = this.t + 1; run.manual.Pointing = clamp(lock / 5 * 100, 0, 100); run.flags.sent = lock >= 5; (lock >= 5 ? sfx.ok : sfx.bad)(); }
    },
    draw(dt) {
      const c = C(); clear(); stars(3, 1, dt);
      const [ex, ey] = this.e || [W / 2, H / 2];
      ring(ex, ey, 8, c.dim); rect(ex, ey, 1, 1, '#9fd8ff');
      reticle(rx, ry, 6, Math.hypot(rx - ex, ry - ey) < 8 ? c.ok : c.hi);
      txt('POINT THE ANTENNA AT EARTH · 1 LIGHT-DAY AWAY', W / 2, 12, c.hi, 16, 'center');
      bar(W / 2 - 80, H - 18, 160, 7, lock / 5, c.ok, `SIGNAL LOCK ${fmt(lock, 1)} / 5.0 s`);
      txt(`${Math.max(0, 25 - this.t).toFixed(0)} s`, W - 10, H - 14, c.dim, 15, 'right');
    }
  });
}

function endingCard(next) {
  const r = S.run, y = r.extraYears || 0;
  const [title, line] = !r.ore ? ['SILENCE', `${esc(S.aiName)} drifts on, dreaming, with nothing left to say.`]
    : y >= 15 ? ['LIFELINE RESTORED', `${esc(S.aiName)} hums back to life with power for about ${fmt(y)} more years.`]
    : y >= 5 ? ['BORROWED TIME', `${esc(S.aiName)} has bought about ${fmt(y)} more years.`]
    : ['A LAST WHISPER', `Just enough power for a final word: about ${fmt(y, 1)} more years.`];
  card([line,
    !r.ore ? 'Without power, no message can be sent. But the golden record is still aboard, waiting.' : r.flags.sent ? 'The message is on its way. Twenty-four hours from now, a dish on Earth will hear: "Still here."' : 'The antenna slipped. The message scatters into the dark... maybe someone will catch an echo.',
    '<span class="muted">END OF TIMELINE 2026-B</span>'], next, { title, tag: 'WHAT-IF', fiction: true, btn: 'MISSION REPORT ▶' });
}
