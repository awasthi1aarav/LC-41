// The real timeline: launch, three side missions, the long power decline
const DIST = [[1977.7, 0], [1979.2, 5.2], [1980.9, 9.5], [1990.1, 40], [1998.1, 70], [2004.9, 94], [2012.6, 121], [2026.88, 173], [2040, 220]];
function distAU(y) {
  y -= S.run ? S.run.c.win.delay : 0;
  for (let i = 1; i < DIST.length; i++) if (y <= DIST[i][0]) { const [a, da] = DIST[i - 1], [b, db] = DIST[i]; return da + (db - da) * clamp((y - a) / (b - a), 0, 1); }
  return 220 + (y - 2040) * 3.6;
}
const lightHours = au => au * 499 / 3600;

function startRun() {
  inRun(true); setWhatif(false);
  const d = JSON.parse(JSON.stringify(S.design)), c = calc(d);
  S.run = { d, c, sci: { planet: 0, titan: 0, pbd: 0, inter: 0, whatif: 0 }, manual: {}, dataMade: 0, dataLost: 0,
    hyd: d.hyd - 30, faults: 0, flags: {}, on: Object.fromEntries(c.flown.map(i => [i.id, true])), notes: [] };
  const has = id => !!S.run.on[id];
  const dl = c.win.delay, steps = [];
  steps.push(n => launchScene(n));
  steps.push(n => timeSkip(LAUNCH + dl, 1979.17 + dl * 1.2, 'CRUISE TO JUPITER', n));
  steps.push(n => station('science', `JUPITER, ${1979 + Math.round(dl * 1.2)}. Point the scan platform and photograph the targets as Voyager rushes past. Arrow keys or mouse to aim, SPACE or click to shoot.`, n));
  steps.push(n => imaging(JUPITER, n));
  if (c.win.saturn) {
    steps.push(n => timeSkip(1979.2 + dl * 1.2, 1980.4 + dl * 2, 'CRUISE TO SATURN', n));
    steps.push(n => station('engineer', 'TRAJECTORY CORRECTION. Hold SPACE (or the ACTION button) to fire the thrusters, and let go inside the green band. Every wasted second burns hydrazine you\'ll need for decades.', n));
    steps.push(n => withRetry('burn', burnScene, () => S.run.manual.Burn < 40,
      { title: 'BAD BURN', msg: 'The burn missed badly. Voyager is off course for Saturn.', label: 'Fire a second correction burn (uses more fuel)' }, n));
    if (c.win.titan) steps.push(n => vote('TITAN OR PLUTO?', 'Real history: in 1980 the team chose Titan, Saturn\'s moon with a thick hazy atmosphere. A close Titan pass bends Voyager 1 up and out of the plane of the planets for good.', [
      { name: 'TITAN (the real choice)', desc: 'Big science now: Titan\'s atmosphere. Best with infrared and UV spectrometers aboard.' },
      { name: 'PLUTO (what-if)', desc: 'Skip Titan and aim for a Pluto flyby years later. Costs 8 kg of extra hydrazine and gambles on the spacecraft surviving that long.' }],
      pick => { S.run.flags[pick ? 'pluto' : 'titan'] = true; if (pick) S.run.hyd -= 8; n(); }));
    steps.push(n => imaging(SATURN(), n));
  }
  steps.push(n => timeSkip(1981 + dl * 2, 1990.1, 'THE LONG CRUISE', n));
  steps.push(n => has('ISS') ? station('science', '14 FEBRUARY 1990, 6 billion km from home. Carl Sagan has asked for one last photo: turn the cameras back towards the Sun and find Earth. Drag or use arrows to pan; SPACE to shoot. You have 8 frames.', n) : n());
  steps.push(n => has('ISS') ? withRetry('pbd', pbdScene, () => !S.run.flags.pbd, { title: 'EARTH NOT FOUND', msg: 'No photo of Earth this time.', label: 'Take 8 more frames' }, n) : card(['No cameras aboard, so there is no Pale Blue Dot in this timeline.', 'The fields-and-particles instruments keep listening to the solar wind.'], n, { title: 'FEB 1990' }));
  steps.push(n => has('ISS') ? vote('SWITCH THE CAMERAS OFF?', 'Real history: after the Pale Blue Dot, NASA turned Voyager 1\'s cameras off for good to save power and memory. They were never needed again.', [
    { name: 'CAMERAS OFF (real)', desc: `Saves ${INSTBY.ISS.power} W for the instruments that work in deep space.` },
    { name: 'KEEP THEM ON', desc: 'There is nothing left to photograph out there, but you could keep the option. You pay in watts every year.' }],
    pick => { if (!pick) { S.run.on.ISS = false; S.run.flags.camOff = true; } n(); }) : n());
  steps.push(n => station('engineer', 'THE LONG NIGHT, 1990 onwards. The RTGs fade every year. Keep power draw below supply by switching loads off (click, or keys 1-9). Never let the thruster line heaters freeze. Hold F to fast-forward.', n));
  steps.push(n => withRetry('night', longNight, () => S.run.silence < 2026.88,
    { title: 'CONTACT LOST EARLY', msg: 'Voyager went silent before reaching one light-day. In real life, fault protection would drop it into SAFE MODE so engineers could try again.',
      label: 'SAFE MODE: rewind to 1990 and try again',
      snapshot: () => JSON.stringify({ hyd: S.run.hyd, faults: S.run.faults, inter: S.run.sci.inter, on: S.run.on }),
      restore: j => { const o = JSON.parse(j); S.run.hyd = o.hyd; S.run.faults = o.faults; S.run.sci.inter = o.inter; S.run.on = o.on; } }, n));
  sequence(steps, () => whatifAct());
}

// ---------- launch ----------
function launchScene(next) {
  ui(''); pad(false); rumble(4, .1);
  const parts = [];
  setScene({
    update(dt) {
      if (this.t > 1 && action()) this.t = Math.max(this.t, 9.9);
      if (this.t > 10.5) { next(); this.update = null; }
      if (this.t > 3) for (let i = 0; i < 4; i++) parts.push({ x: W / 2 + rnd(-6, 6), y: 0, vx: rnd(-20, 20), vy: rnd(30, 80), l: rnd(.5, 1.2) });
      parts.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.l -= dt; });
      while (parts.length && parts[0].l <= 0) parts.shift();
      if (Math.floor(this.t * 2) !== Math.floor((this.t - dt) * 2) && this.t < 3) beep(this.t > 2.5 ? 1320 : 660, .1);
    },
    draw(dt) {
      const t = this.t, c = C(), up = t < 3 ? 0 : (t - 3) ** 2 * 14;
      const sky = clamp(up / 900, 0, 1);
      ctx.fillStyle = `rgb(${18 * (1 - sky) + 3},${11 * (1 - sky) + 2},${2})`; ctx.fillRect(0, 0, W, H);
      if (sky > .3) stars(0, -40, dt);
      const gy = 230 + up;
      if (gy < H) { rect(0, gy, W, H - gy, c.dim); rect(W / 2 + 30, gy - 70, 6, 70, c.dim); for (let i = 0; i < 7; i++) rect(W / 2 + 22, gy - 66 + i * 10, 14, 1, c.dim); }
      const rx = W / 2, ry = t < 3 ? gy - 78 : Math.max(90, gy - 78 - up * 0.02);
      const shake = t > 3 && t < 7 ? rnd(-1, 1) : 0;
      parts.forEach(p => rect(rx + (p.x - W / 2) + shake, ry + 78 + p.y, 2, 2, p.l > .8 ? c.hi : p.l > .4 ? c.fg : c.acc));
      // Titan IIIE-Centaur
      if (t < 6) { rect(rx - 13 + shake, ry + 20, 6, 52, c.hi); rect(rx + 7 + shake, ry + 20, 6, 52, c.hi); rect(rx - 13 + shake, ry + 18, 6, 3, c.fg); rect(rx + 7 + shake, ry + 18, 6, 3, c.fg); }
      rect(rx - 6 + shake, ry + 8, 12, 66, c.fg); rect(rx - 6 + shake, ry + 30, 12, 2, c.dim);
      rect(rx - 5 + shake, ry - 10, 10, 18, c.hi); rect(rx - 3 + shake, ry - 16, 6, 6, c.hi); rect(rx - 1 + shake, ry - 19, 2, 3, c.hi);
      const msg = t < 3 ? `T-${3 - Math.floor(t)}` : t < 5 ? 'LIFTOFF · 5 SEP 1977 · LC-41' : t < 6.5 ? 'SOLID ROCKET BOOSTERS SEPARATE' : t < 8.5 ? (S.run.c.massMargin < .03 ? 'CENTAUR BURNS TO DEPLETION... ON THE EDGE' : 'CENTAUR UPPER STAGE BURN') : 'VOYAGER 1 IS ON ITS WAY';
      txt(msg, W / 2, 30, c.hi, t < 3 ? 32 : 18, 'center', t < 3 ? 'px' : 'VT323');
      txt('SPACE to skip', W - 6, H - 8, c.dim, 12, 'right');
    }
  });
}

// ---------- time skip ----------
function timeSkip(y0, y1, label, next) {
  ui(''); pad(false);
  setScene({
    update() { if ((this.t > .5 && action()) || this.t > 3.6) { next(); this.update = null; } },
    draw(dt) {
      clear(); stars(60, 0, dt);
      const f = clamp(this.t / 3, 0, 1), y = y0 + (y1 - y0) * (1 - (1 - f) ** 2), c = C(), au = distAU(y);
      txt(label, W / 2, 40, c.dim, 10, 'center', 'px');
      txt(String(Math.floor(y)), W / 2, 110, c.hi, 40, 'center', 'px');
      txt(`${fmt(au, 1)} AU from the Sun · signal ${fmt(lightHours(au), 1)} light-hours`, W / 2, 160, c.fg, 18, 'center');
      txt(`RTG output ${fmt(supplyAt(S.run.d, y))} W`, W / 2, 182, c.fg, 18, 'center');
      voyager(W / 2 - 120 + f * 240, 225, 1.2);
      if ((G.t * 8 | 0) % 2) sfx.tick();
    }
  });
}

// ---------- planet imaging ----------
const JUPITER = { name: 'JUPITER', col: ['#e9c79a', '#b9895a', '#d9a86c', '#8c5a34'], pr: 62, dur: 26, ring: false,
  targets: [
    { n: 'Great Red Spot', spot: true, v: 12 }, { n: 'Io', R: 82, a: 0.3, w: 0.55, r: 3, col: '#f2e05a', v: 10, io: true },
    { n: 'Europa', R: 102, a: 2.1, w: 0.42, r: 3, col: '#e8e2d0', v: 10 }, { n: 'Ganymede', R: 128, a: 4.2, w: 0.33, r: 4, col: '#b8a88e', v: 10 },
    { n: 'Callisto', R: 160, a: 5.6, w: 0.25, r: 4, col: '#7d6c58', v: 8 }] };
const SATURN = () => ({ name: 'SATURN', col: ['#efd9a0', '#cfb57c', '#e4c98e', '#a88b5a'], pr: 44, dur: 24, ring: true,
  targets: [
    { n: 'The rings', ringT: true, v: 12 },
    ...(S.run.flags.titan ? [{ n: 'Titan', R: 140, a: 3.6, w: 0.3, r: 5, col: '#e8a040', v: 10, titan: true }] : []),
    { n: 'Mimas', R: 76, a: 1.0, w: 0.7, r: 2, col: '#ddd', v: 6 }, { n: 'Dione', R: 98, a: 2.6, w: 0.5, r: 3, col: '#ddd', v: 7 },
    { n: 'Rhea', R: 116, a: 5.0, w: 0.4, r: 3, col: '#ccc', v: 7 }] });

function imaging(P, next) {
  const run = S.run, c = run.c, cam = !!run.on.ISS;
  const auto = run.c.flown.filter(i => i.id !== 'ISS' && run.on[i.id]);
  const autoData = Math.max(0, c.demand - (cam ? 30 : 0)), autoSci = auto.reduce((a, i) => a + i.p, 0);
  let made = 0, lost = 0, got = new Set(), msg = '', msgT = 0, rx = W / 2, ry = H / 2, flash = 0;
  const say = m => { msg = m; msgT = 2.2; };
  ui(`<div class="hud"><span id="h1"></span><span id="h2"></span></div>`, true); pad(cam);
  const dur = cam ? P.dur : 9;
  const pos = (tg, t) => {
    const f = t / dur, px = W * (0.78 - 0.5 * f), py = H * 0.52, pr = P.pr;
    if (tg.spot) { const ph = t * 0.32 - 1.6; return { x: px + Math.sin(ph) * pr * .75, y: py + pr * .28, vis: Math.cos(ph) > .15, r: 5 }; }
    if (tg.ringT) return { x: px + pr * 1.75, y: py + 2, vis: true, r: 6 };
    const a = tg.a + tg.w * t, x = px + Math.cos(a) * tg.R, y = py + Math.sin(a) * tg.R * .32;
    const behind = Math.sin(a) < 0 && Math.abs(x - px) < pr;
    return { x, y, vis: !behind && x > -10 && x < W + 10, r: tg.r };
  };
  setScene({
    help: cam ? { title: P.name + ' FLYBY', goal: 'Photograph the labelled targets before they fly past. Each photo uses data space.', keys: [['MOUSE / ← ↑ ↓ →', 'aim the camera'], ['CLICK / SPACE', 'take a photo']] } : null,
    update(dt) {
      const t = this.t; msgT -= dt; flash -= dt;
      if (!cam) { if (t > dur) end(); return; }
      if (G.t - M.moved < .6) { rx += (M.x - rx) * .25; ry += (M.y - ry) * .25; }
      rx = clamp(rx + ((K.ArrowRight ? 1 : 0) - (K.ArrowLeft ? 1 : 0)) * 150 * dt, 0, W);
      ry = clamp(ry + ((K.ArrowDown ? 1 : 0) - (K.ArrowUp ? 1 : 0)) * 150 * dt, 0, H);
      if (t > .3 && (hit(' ') || M.clicked)) {
        flash = .12; sfx.snap();
        let best = null, bd = 1e9, br = 4;
        P.targets.forEach(tg => { if (got.has(tg.n)) return; const p = pos(tg, t); if (!p.vis) return; const dd = Math.hypot(p.x - rx, p.y - ry); if (dd < 12 + p.r && dd < bd) { bd = dd; best = tg; br = p.r; } });
        const cost = best ? 8 : 2;
        if (made + cost > c.dataCap) { lost += cost; made += cost; say(best ? `BUFFER FULL · ${best.n} image lost` : 'BUFFER FULL'); if (best) sfx.bad(); return; }
        made += cost;
        if (!best) return say('Nothing in frame · data wasted');
        const q = clamp(1.2 - bd / (12 + br), .4, 1);
        got.add(best.n);
        let sci = best.v * q * (1 + (run.on.PPS ? .1 : 0));
        if (best.io) { sci += 15; say('IO: ACTIVE VOLCANOES! (a real Voyager 1 discovery)'); }
        else if (best.titan) {
          const ts = 10 + (run.on.IRIS ? 15 : 0) + (run.on.UVS ? 10 : 0);
          run.sci.titan += ts * (run.flags.burnQ || 1);
          say(run.on.IRIS || run.on.UVS ? 'TITAN: haze hides the surface, but your spectrometers read its thick nitrogen air' : 'TITAN: just orange haze. No IR/UV spectrometer to read its air.');
        } else say(`${best.n.toUpperCase()} imaged · quality ${fmt(q * 100)}%`);
        run.sci.planet += sci; sfx.ok();
      }
      if (t > dur) end();
    },
    draw(dt) {
      const t = this.t, f = t / dur, px = W * (0.78 - 0.5 * f), py = H * 0.52, pr = P.pr, col = C();
      clear(); stars(20, 0, dt);
      if (P.ring) { ctx.strokeStyle = P.col[1]; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(px, py, pr * 2.1, pr * .36, 0, Math.PI, 2 * Math.PI); ctx.stroke(); }
      ctx.save(); ctx.beginPath(); ctx.arc(px, py, pr, 0, 7); ctx.clip();
      for (let b = -pr; b < pr; b += 6) rect(px - pr, py + b, pr * 2, 6, P.col[((b / 6 | 0) + 40) % 4]);
      ctx.restore();
      if (P.ring) { ctx.strokeStyle = P.col[1]; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(px, py, pr * 2.1, pr * .36, 0, 0, Math.PI); ctx.stroke(); ctx.strokeStyle = P.col[3]; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(px, py, pr * 1.7, pr * .28, 0, 0, Math.PI); ctx.stroke(); }
      P.targets.forEach(tg => {
        const p = pos(tg, t); if (!p.vis) return;
        if (tg.spot) { ctx.fillStyle = '#c0442a'; ctx.beginPath(); ctx.ellipse(p.x, p.y, 7, 4, 0, 0, 7); ctx.fill(); }
        else if (!tg.ringT) disc(p.x, p.y, p.r, tg.col);
        if (cam && !got.has(tg.n) && DIFF[S.diff].hint) txt(tg.n, p.x, p.y - p.r - 7, col.dim, 12, 'center');
        if (got.has(tg.n)) txt('✓', p.x + p.r + 4, p.y - p.r - 2, col.ok, 14);
      });
      if (cam) reticle(rx, ry, 9, col.hi);
      if (flash > 0) { ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(0, 0, W, H); }
      voyager(30, 30, 1);
      txt(cam ? `${P.name} FLYBY · ${got.size}/${P.targets.length} targets · ${Math.max(0, dur - t).toFixed(0)} s` : `${P.name} · no cameras aboard: fields & particles sample the magnetosphere`, W / 2, 14, col.hi, 16, 'center');
      const total = made + autoData * f;
      bar(W - 140, H - 18, 130, 7, total / c.dataCap, total > c.dataCap ? col.bad : col.fg, `DATA BUFFER ${fmt(total)}/${c.dataCap}`);
      if (msgT > 0) txt(msg, W / 2, H - 36, col.hi, 16, 'center');
    }
  });
  function end() {
    G.scene.update = null;
    // ambient fields-and-particles data, then whatever doesn't fit is lost
    const totalMade = made + autoData, over = Math.max(0, totalMade - c.dataCap - lost);
    const keep = autoData ? clamp(1 - over / autoData, 0, 1) : 1;
    run.dataMade += totalMade; run.dataLost += lost + over;
    run.sci.planet += autoSci * keep * 0.8;
    run.manual[P.name] = cam ? got.size / P.targets.length * 100 : 50;
    pad(false);
    card([`${got.size} of ${P.targets.length} targets photographed.`,
      lost + over ? `<span class="bad">${fmt(lost + over)} data units lost</span>: a bigger dish or a tape recorder would help.` : '<span class="ok">All data reached Earth.</span>'], next, { title: `${P.name}: DONE` });
  }
}

// ---------- trajectory correction burn ----------
function burnScene(next) {
  const band = DIFF[S.diff].band, target = 5;
  let dv = 0, burning = false, done = false;
  ui(''); pad(true);
  setScene({
    help: { title: 'ENGINE BURN', goal: 'Fire the thrusters to fix your course. Stop inside the GREEN zone.', keys: [['HOLD SPACE', 'or hold the mouse: burn'], ['LET GO', 'when the bar is in the green']] },
    update(dt) {
      if (done) return;
      const hold = K[' '] || M.down;
      if (hold && this.t > .4) { burning = true; dv += 2.6 * dt; if ((G.t * 30 | 0) % 2) beep(90, .03, 'sawtooth', .03); }
      if ((burning && !hold) || dv >= 10 || (!burning && this.t > 20)) finish();
    },
    draw(dt) {
      const c = C(); clear(); stars(10, 0, dt);
      voyager(150, 135, 2.2);
      if (burning && !done) for (let i = 0; i < 6; i++) rect(150 - 30 - rnd(0, 20), 135 + rnd(-3, 3), 2, 1, c.hi);
      const x0 = 260, w = 190, X = v => x0 + v / 10 * w;
      txt('TRAJECTORY CORRECTION MANOEUVRE', W / 2, 24, c.hi, 10, 'center', 'px');
      rect(X(target - band), 120, X(target + band) - X(target - band), 20, c.ok);
      frameRect(x0, 120, w, 20, c.fg); rect(x0 + 1, 126, X(dv) - x0, 8, c.hi);
      txt(`Δv ${fmt(dv, 2)} m/s · target ${target} ± ${band}`, x0, 155, c.fg, 16);
      txt(done ? '' : burning ? 'BURNING... let go in the green' : 'HOLD SPACE (or tap and hold) to burn', W / 2, 220, c.hi, 18, 'center');
    }
  });
  function finish() {
    done = true; pad(false);
    const err = Math.abs(dv - target), q = clamp(1 - err / 2.5, 0, 1), waste = err * 6;
    S.run.hyd -= 10 + waste; S.run.flags.burnQ = .5 + q * .5;
    S.run.manual.Burn = q * 100;
    const miss = Math.round(6490 * (1 + err * 2));
    (err <= band ? sfx.ok : sfx.bad)();
    const run0 = S.run;
    setTimeout(() => S.run === run0 && card([err <= band ? '<span class="ok">Perfect burn.</span>' : `Off by ${fmt(err, 2)} m/s.`,
      `Fuel used: ${fmt(10 + waste, 1)} kg${waste > 1 ? ` (${fmt(waste, 1)} kg wasted)` : ''}.`], next, { title: 'BURN REPORT' }), 500);
  }
}

// ---------- Pale Blue Dot ----------
function pbdScene(next) {
  const WW = 1200, HH = 680, sun = { x: 600, y: 340 };
  const earth = { x: sun.x + rnd(40, 90) * (Math.random() < .5 ? -1 : 1), y: sun.y + rnd(-60, 60) };
  const noise = Array.from({ length: 900 }, () => ({ x: rnd(0, WW), y: rnd(0, HH), b: Math.random() }));
  let cx = 200, cy = 140, frames = 8, found = false, msg = '', msgT = 0, flash = 0, drag = null;
  ui(`<div class="hud"><span></span></div>`, true); pad(true);
  setScene({
    help: { title: 'PALE BLUE DOT', goal: 'Find Earth: one tiny blue pixel close to the Sun. Put it in the circle and shoot. 8 photos.', keys: [['DRAG / ← ↑ ↓ →', 'look around'], ['SPACE', 'take a photo']] },
    update(dt) {
      msgT -= dt; flash -= dt;
      cx = clamp(cx + ((K.ArrowRight ? 1 : 0) - (K.ArrowLeft ? 1 : 0)) * 220 * dt, 0, WW - W);
      cy = clamp(cy + ((K.ArrowDown ? 1 : 0) - (K.ArrowUp ? 1 : 0)) * 220 * dt, 0, HH - H);
      if (M.down) { if (!drag) drag = { x: M.x, y: M.y, cx, cy }; cx = clamp(drag.cx - (M.x - drag.x), 0, WW - W); cy = clamp(drag.cy - (M.y - drag.y), 0, HH - H); } else drag = null;
      if (this.t > .4 && (hit(' ') || hit('Enter')) && frames > 0 && !found) {
        frames--; flash = .15; sfx.snap();
        const ex = earth.x - cx, ey = earth.y - cy;
        if (Math.hypot(ex - W / 2, ey - H / 2) < 14) { found = true; S.run.flags.pbd = true; S.run.sci.pbd = 40 + frames * 3; sfx.ok(); msg = 'THERE. A mote of dust in a sunbeam: every human who ever lived.'; msgT = 4; this.endAt = this.t + 4; }
        else { msg = frames ? `Frame ${8 - frames}: no Earth. ${Math.hypot(ex - W / 2, ey - H / 2) < 80 ? 'Close...' : 'Look nearer the Sun.'}` : 'Out of frames.'; msgT = 2; if (!frames) this.endAt = this.t + 2; }
      }
      if (this.t > 45 && !this.endAt) this.endAt = this.t;
      if (this.endAt && this.t > this.endAt) { this.update = null; S.run.manual.PaleBlueDot = found ? 100 : 20; pad(false); next(); }
    },
    draw() {
      const c = C(); ctx.fillStyle = '#050403'; ctx.fillRect(0, 0, W, H);
      noise.forEach(n => { const x = n.x - cx, y = n.y - cy; if (x >= 0 && x < W && y >= 0 && y < H) rect(x, y, 1, 1, n.b > .97 ? '#776655' : '#2a2018'); });
      const sx = sun.x - cx, sy = sun.y - cy;
      for (let i = -3; i <= 3; i++) { ctx.fillStyle = `rgba(255,190,120,${.05 + (3 - Math.abs(i)) * .02})`; ctx.save(); ctx.translate(sx, sy); ctx.rotate(-.35); ctx.fillRect(-700, i * 22 - 6, 1400, 12); ctx.restore(); }
      const g = ctx.createRadialGradient(sx, sy, 0, sx, sy, 60); g.addColorStop(0, 'rgba(255,255,235,1)'); g.addColorStop(.25, 'rgba(255,220,160,.6)'); g.addColorStop(1, 'rgba(255,180,90,0)');
      ctx.fillStyle = g; ctx.fillRect(sx - 60, sy - 60, 120, 120);
      const ex = earth.x - cx, ey = earth.y - cy; rect(ex, ey, 1, 1, (G.t * 3 | 0) % 3 ? '#9fd8ff' : '#6fa8d8');
      reticle(W / 2, H / 2, 12, found ? c.ok : c.hi);
      if (flash > 0) { ctx.fillStyle = 'rgba(255,255,255,.2)'; ctx.fillRect(0, 0, W, H); }
      txt(`PALE BLUE DOT · 14 FEB 1990 · frames left ${frames}`, W / 2, 12, c.hi, 16, 'center');
      txt('Drag / arrows to pan · SPACE to shoot', W / 2, 26, c.dim, 13, 'center');
      if (msgT > 0) txt(msg, W / 2, H - 20, c.hi, 16, 'center');
    }
  });
}

// ---------- the long night: power management 1990 -> silence ----------
function longNight(next) {
  const run = S.run, d = run.d, c = run.c, core = c.bus.essential - LINE_HEATERS;
  const loads = [
    ...c.flown.map(i => ({ id: i.id, name: i.name, w: i.power, on: !!run.on[i.id], sci: i.i })),
    { id: 'HEAT', name: 'Instrument heaters', w: HEATERS, on: true, sci: 0 },
    ...(d.tape ? [{ id: 'TAPE', name: 'Tape recorder', w: TAPE.power, on: true, sci: 0 }] : []),
    { id: 'LINE', name: 'Thruster line heaters (keep ON!)', w: LINE_HEATERS, on: true, sci: 0, line: true }];
  let y = 1990.2, drop = 0, banner = '', bannerT = 0, lineOff = 0, ended = false, hist = [], paused = false;
  const done = new Set();
  const events = [
    { y: 1998.13, f: () => say('17 FEB 1998: Voyager 1 passes Pioneer 10. It is now the most distant human-made object.') },
    { y: 2004.96, f: () => { const n = ['PLS', 'LECP', 'CRS', 'MAG'].filter(on).length; run.sci.inter += n * 15; say(`DEC 2004: TERMINATION SHOCK. The solar wind slows suddenly. ${n} of your particle/field instruments recorded it (+${n * 15}).`); } },
    { y: 2012.65, f: () => { const n = ['PWS', 'MAG', 'CRS', 'LECP'].filter(on).length; run.sci.inter += n * 20; say(`25 AUG 2012: HELIOPAUSE. Voyager 1 enters interstellar space. ${n} instruments caught the moment (+${n * 20}).`); } },
    { y: 2023.88, f: () => memoryPuzzle() },
    { y: 2026.16, f: () => { drop = 8; say('27 FEB 2026: an unexpected power drop during a roll manoeuvre (this really happened). Shed load now!'); sfx.bad(); } },
    { y: 2026.88, f: () => say('18 NOV 2026: ONE LIGHT-DAY FROM EARTH. Every message now takes 24 hours each way. (That\'s this week, in real life.)') }];
  const on = id => loads.some(l => l.id === id && l.on);
  const say = m => { banner = m; bannerT = 4.5; beep(520, .1, 'triangle'); };
  const draw = () => core + loads.reduce((a, l) => a + (l.on ? l.w : 0), 0);
  const supply = () => supplyAt(d, y) - drop;
  const toggle = i => { const l = loads[i]; if (!l || ended) return; l.on = !l.on; beep(l.on ? 800 : 300, .04); renderLoads(); };
  const renderLoads = () => {
    $('#ld').innerHTML = loads.map((l, i) => `<div class="opt ${l.on ? 'on' : ''}" data-l="${i}">${i < 9 ? `[${i + 1}] ` : i === 9 ? '[0] ' : ''}${l.id === 'LINE' ? '<span class="bad">' + l.name + '</span>' : l.name} <span style="float:right">${l.w} W</span></div>`).join('');
    UI.querySelectorAll('[data-l]').forEach(e => e.onclick = () => toggle(+e.dataset.l));
  };
  ui(`<div class="loads box"><h3>POWER LOADS</h3><p class="muted">Core systems (radio, computers): ${core} W, always on</p><div id="ld"></div></div><div id="mod"></div>`, true);
  renderLoads(); pad(false);
  function memoryPuzzle() {
    paused = true; const bad = new Set(); while (bad.size < 4) bad.add(Math.floor(Math.random() * 12));
    const pick = new Set(); let left = 15;
    const tm = setInterval(() => { if (S.run !== run) return clearInterval(tm); left--; const e = $('#mt'); if (e) e.textContent = left; if (left <= 0) close(false); }, 1000);
    const close = ok => { clearInterval(tm); if (S.run !== run) return; const md = $('#mod'); if (md) md.innerHTML = ''; paused = false;
      if (ok) { run.manual.Memory = 100; say('2024: code moved around the failed chip. Voyager 1 speaks clearly again (just like the real fix).'); sfx.ok(); }
      else { run.manual.Memory = 0; run.faults++; run.sci.inter = Math.max(0, run.sci.inter - 15); say('Code landed on a bad chip: months of garbled data lost (-15).'); sfx.bad(); } };
    const r = () => { $('#mod').innerHTML = `<div class="modal" style="pointer-events:auto"><div class="box"><h2>NOV 2023 · MEMORY FAULT</h2>
      <p>One of the computer's memory chips has failed and the data is gibberish. Move the code: pick <b>3 healthy</b> memory banks. Flickering ones are corrupted. <span class="hi" id="mt">${left}</span> s</p>
      <div class="banks">${Array.from({ length: 12 }, (_, i) => `<button class="${bad.has(i) ? 'bad' : ''} ${pick.has(i) ? 'on' : ''}" data-b="${i}" ${pick.has(i) ? 'disabled' : ''}>${i.toString(16).toUpperCase()}</button>`).join('')}</div></div></div>`;
      UI.querySelectorAll('[data-b]').forEach(b => b.onclick = () => { const i = +b.dataset.b; if (bad.has(i)) return close(false); pick.add(i); beep(700, .03); if (pick.size >= 3) close(true); else r(); }); };
    r();
  }
  setScene({
    help: { title: 'THE LONG NIGHT', goal: 'Power fades every year. Keep DRAW below SUPPLY by switching things off, or the computer does it for you.', keys: [['CLICK a load', 'or press 1-9: on / off'], ['KEEP ON', 'thruster line heaters (or the fuel freezes)'], ['HOLD F', 'fast-forward']] },
    update(dt) {
      if (ended) return;
      for (let i = 1; i <= 10; i++) if (hit(String(i % 10))) toggle(i - 1);
      bannerT -= dt;
      if (paused) return;
      const speed = (K.f || K.F ? 4 : 1) * (bannerT > 0 ? .25 : 1) * (y > 2027 ? 1 + (y - 2027) / 4 : 1);
      const dy = dt * speed; y += dy;
      events.forEach(e => { if (!done.has(e) && y >= e.y + c.win.delay * 0) { done.add(e); e.f(); } });
      run.hyd -= dy * HYD_PER_YEAR;
      run.sci.inter += loads.reduce((a, l) => a + (l.on ? l.sci : 0), 0) * dy * .12;
      const line = loads.find(l => l.line);
      lineOff = line.on ? 0 : lineOff + dy;
      if (draw() > supply()) {
        const cand = loads.filter(l => l.on && !l.line).sort((a, b) => b.w - a.w)[0] || line;
        cand.on = false; run.faults++; sfx.bad();
        say(`UNDERVOLTAGE! Fault protection switched off ${cand.name}.`); renderLoads();
      }
      if (lineOff > .6) return finish('frozen');
      if (run.hyd <= 0) return finish('hydrazine');
      if (supply() < core + LINE_HEATERS) return finish('power');
      if ((y * 4 | 0) !== hist.length) hist.push([y, supply(), draw()]);
    },
    draw(dt) {
      const col = C(); clear(); stars(4, 0, dt);
      const gx = 14, gy = 46, gw = 250, gh = 140, y0 = 1990, y1 = Math.max(2040, y + 2), pmax = c.supply0 * .95;
      frameRect(gx, gy, gw, gh, col.dim);
      const X = v => gx + (v - y0) / (y1 - y0) * gw, Y = p => gy + gh - clamp(p / pmax, 0, 1) * gh;
      for (let v = 2000; v < y1; v += 10) { rect(X(v), gy + gh, 1, 3, col.dim); txt(v, X(v), gy + gh + 9, col.dim, 12, 'center'); }
      rect(gx, Y(core + LINE_HEATERS), gw, 1, col.bad);
      hist.forEach(([yy, s, dd]) => { rect(X(yy), Y(s), 1, 2, col.fg); rect(X(yy), Y(dd), 1, 1, col.hi); });
      txt('supply', gx + 4, gy + 8, col.fg, 13); txt('draw', gx + 50, gy + 8, col.hi, 13); txt('minimum to stay alive', gx + gw - 4, Y(core + LINE_HEATERS) - 6, col.bad, 12, 'right');
      txt(`${Math.floor(y)}`, gx, 22, col.hi, 18, 'left', 'px');
      txt(`${fmt(distAU(y))} AU · ${fmt(lightHours(distAU(y)), 1)} light-hours`, gx + 90, 22, col.fg, 16);
      const s = supply(), dd = draw();
      txt(`SUPPLY ${fmt(s, 1)} W   DRAW ${fmt(dd, 1)} W   MARGIN ${fmt(s - dd, 1)} W`, gx, 208, s - dd < 5 ? col.bad : col.hi, 17);
      txt(`Hydrazine ${fmt(Math.max(0, run.hyd), 1)} kg · faults ${run.faults} · deep-space science ${fmt(run.sci.inter)}`, gx, 224, col.fg, 16);
      voyager(290, 30, 1);
      if (bannerT > 0) { const ws = banner.split(' '), ls = ['']; ws.forEach(w => { if ((ls[ls.length - 1] + ' ' + w).length > 58) ls.push(w); else ls[ls.length - 1] += (ls[ls.length - 1] ? ' ' : '') + w; });
        rect(gx - 2, 232, 300, ls.length * 13 + 4, col.bg); ls.forEach((l, i) => txt(l, gx, 239 + i * 13, col.hi, 15)); }
      txt('Hold F: fast-forward', W - 8, H - 8, col.dim, 12, 'right');
    }
  });
  function finish(why) {
    ended = true; G.scene.update = null; run.silence = y; run.silenceWhy = why;
    run.manual.LongNight = clamp(100 - run.faults * 15, 0, 100);
    const msg = { power: `The RTGs can no longer run the radio. Voyager 1 falls silent in ${Math.floor(y)}.`,
      hydrazine: `The hydrazine is gone. With no thrusters, the antenna drifts off Earth in ${Math.floor(y)}. Contact lost.`,
      frozen: `The thruster fuel lines froze. Voyager can no longer point at Earth. Contact lost in ${Math.floor(y)}.` }[why];
    setTimeout(() => S.run === run && card([msg, `It travelled ${fmt(distAU(y))} AU from the Sun: ${fmt(lightHours(distAU(y)), 1)} light-hours.`,
      'In our timeline, this is where the story would end.', '<span class="fiction">But not in every timeline.</span>'], next, { title: 'LAST SIGNAL', btn: '. . .' }), 600);
  }
}
