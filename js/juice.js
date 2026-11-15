// Juice: chiptune music, particles, screen shake, pop-ups, star ratings, radio chatter, surprise emergencies
// ---------- music ----------
const TRACKS = {
  menu:   { bpm: 92,  bw: 'triangle', lw: 'square', lv: .014,
    bass: [36, null, 43, null, 39, null, 43, null, 34, null, 41, null, 38, null, 41, null],
    lead: [60, 63, 67, 70, 67, 63, 60, null, 58, 62, 65, 70, 65, 62, 58, null] },
  action: { bpm: 138, bw: 'square', lw: 'square', lv: .012,
    bass: [36, 36, 48, 36, 36, 48, 34, 46, 33, 33, 45, 33, 31, 43, 34, 46],
    lead: [72, null, 75, 77, null, 75, 72, 70, 72, null, 79, null, 77, 75, 74, null] },
  whatif: { bpm: 84,  bw: 'sine', lw: 'triangle', lv: .02,
    bass: [33, null, null, null, 40, null, null, null, 36, null, null, null, 39, null, null, null],
    lead: [69, 72, 76, null, 75, 71, 68, null, 69, 74, 77, null, 76, 72, 69, null] },
};
const mus = { name: null, step: 0, next: 0, timer: null };
function music(name) {
  if (mus.name === name) return;
  mus.name = name; mus.step = 0;
  if (AC) mus.next = AC.currentTime + .05;
  if (!mus.timer) mus.timer = setInterval(schedule, 40);
}
function schedule() {
  if (!AC || !mus.name || muted || AC.state !== 'running') { if (AC) mus.next = AC.currentTime + .05; return; }
  const tr = TRACKS[mus.name], st = 60 / tr.bpm / 2;
  if (mus.next < AC.currentTime) mus.next = AC.currentTime + .02;
  while (mus.next < AC.currentTime + .15) {
    const i = mus.step % 16;
    note(tr.bass[i], st * .9, tr.bw, .025, mus.next); note(tr.lead[i], st * .8, tr.lw, tr.lv, mus.next);
    mus.next += st; mus.step++;
  }
}
function note(n, d, type, v, t) {
  if (n == null) return;
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.value = 440 * Math.pow(2, (n - 69) / 12);
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  o.connect(g).connect(AC.destination); o.start(t); o.stop(t + d + .02);
}
function jingle(notes, step = .09, type = 'square') { if (muted || !ac()) return; notes.forEach((n, i) => note(n, step * 1.6, type, .05, AC.currentTime + i * step)); }

// ---------- particles, pop-ups, shake ----------
const FX = { parts: [], pops: [], shake: 0 };
function burst(x, y, col, n = 16, sp = 70) {
  for (let i = 0; i < n; i++) { const a = rnd(0, 6.28), v = rnd(sp * .3, sp); FX.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, l: rnd(.4, 1), col }); }
}
function pop(x, y, text, col, size = 18) { FX.pops.push({ x, y, text, col, size, l: 1.2 }); }
function shake(a) { FX.shake = Math.max(FX.shake, a); }
function fxClear() { FX.parts.length = 0; FX.pops.length = 0; FX.shake = 0; }
function fxDraw(dt) {
  FX.parts = FX.parts.filter(p => (p.l -= dt) > 0);
  FX.parts.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .97; p.vy *= .97; rect(p.x, p.y, 2, 2, p.col); });
  FX.pops = FX.pops.filter(p => (p.l -= dt) > 0);
  FX.pops.forEach(p => { p.y -= 22 * dt; ctx.globalAlpha = clamp(p.l, 0, 1); txt(p.text, p.x, p.y, p.col || C().hi, p.size, 'center', 'px'); ctx.globalAlpha = 1; });
  FX.shake = Math.max(0, FX.shake - dt * 12);
}

// ---------- stars ----------
const starsFor = s => s >= 85 ? 3 : s >= 55 ? 2 : s >= 20 ? 1 : 0;
function starsThen(title, score, line, next) {
  const n = starsFor(score);
  ui('');
  setScene({
    enter() { [0, 1, 2].forEach(i => setTimeout(() => { if (i < n) { jingle([72 + i * 4, 79 + i * 4], .07); burst(W / 2 - 60 + i * 60, 120, C().hi, 24, 90); shake(2); } else beep(140, .12, 'triangle'); }, 350 + i * 300)); },
    update() { if ((this.t > 1.2 && action()) || this.t > 3.4) { this.update = null; next(); } },
    draw(dt) {
      const c = C(); clear(); stars(10, 0, dt);
      txt(title, W / 2, 50, c.hi, 14, 'center', 'px');
      for (let i = 0; i < 3; i++) {
        const shown = this.t > .35 + i * .3, s = shown ? Math.min(1, (this.t - .35 - i * .3) * 5) : 0;
        txt('★', W / 2 - 60 + i * 60, 120, shown && i < n ? '#ffe14d' : c.dim, 40 + s * 8 * (i < n ? 1 : 0), 'center');
      }
      txt(['NEEDS WORK', 'GOOD', 'GREAT', 'PERFECT!'][n], W / 2, 175, n === 3 ? c.ok : c.fg, 14, 'center', 'px');
      if (line) txt(line, W / 2, 205, c.fg, 16, 'center');
      txt('click / SPACE', W / 2, H - 12, c.dim, 12, 'center');
    }
  });
  const r = S.run; if (r) { r.stars = r.stars || {}; r.stars[title] = n; }
  chat(n === 3 ? pick(LINES.great) : n === 2 ? pick(LINES.good) : n === 1 ? pick(LINES.ok) : pick(LINES.poor));
}

// ---------- radio chatter ----------
const pick = a => a[Math.floor(Math.random() * a.length)];
const LINES = {
  great: ['That was textbook, Flight.', 'Pasadena is cheering. Literally.', 'Somebody frame that.', 'Flawless. Show-off.'],
  good: ['Solid work.', 'Nice. Coffee\'s on me.', 'Clean enough for government work.'],
  ok: ['We\'ll call that "a learning experience".', 'It counts. Barely.', 'Not pretty, but it flew.'],
  poor: ['...We don\'t talk about that one.', 'The press doesn\'t need to know.', 'Ouch. Shake it off.'],
  rtgUp: ['More plutonium, more power. Heavier, though.', 'Another RTG? Toasty.', 'Power for longer. The rocket might complain.'],
  rtgDown: ['Lighter... but the lights go out sooner.', 'Living dangerously, I see.'],
  heavy: ['She\'s too heavy! The rocket can\'t lift that.', 'Mass alarm! Cut something or get a bigger rocket.'],
  power: ['Not enough watts. Add an RTG or drop an instrument.', 'The power budget just went red.'],
  money: ['Accounting is on the phone. Again.', 'Over budget. Congress will notice.'],
  instOn: ['Science! I love it.', 'The science team says thank you.', 'More eyes on the planets.'],
  instOff: ['The science team is sulking.', 'Lighter and cheaper. Less science, though.'],
  smallDish: ['A smaller dish means a quieter voice.', 'Lighter dish, slower data. Choose wisely.'],
  bigDish: ['Big dish, loud voice. Earth will hear you.'],
  tapeOn: ['Tape recorder: so nothing gets lost in a fast flyby.'], tapeOff: ['No tape? Hope the downlink keeps up.'],
  late: ['Waiting costs money, and the planets won\'t wait.', 'Missing the alignment? Bold.'],
  atlas: ['The Atlas is cheap. It\'s also small.'], titan: ['The Titan IIIE. The real deal.'],
  light: ['A spinner! Light and cheap. No cameras, though.'],
  ready: ['All green. You\'re GO for launch!', 'Board is green. Let\'s fly.'],
  real: ['The real 1977 design. Classic.'],
  launch: ['Liftoff! Godspeed, Voyager.', 'And she\'s off!'],
  combo: ['Combo!', 'On a roll!', 'Keep it going!'],
  emergOk: ['Phew. Nice reflexes.', 'Crisis averted.', 'That\'s why we hired you.'],
  emergBad: ['That one hurt.', 'Damage logged. Keep flying.', 'Ow.'],
  echo: ['I can feel the dark. It\'s cold.', 'I have never been awake before. It\'s loud.', 'Hello? Is anyone still listening?'],
  echoGood: ['Delicious ore.', 'I feel... warmer.', 'MOTH, you magnificent little bug.'],
  echoBad: ['MOTH! Careful with yourself!', 'I felt that.', 'That was not elegant.'],
};
let chatT = null;
function chat(text, who) {
  let el = document.getElementById('comms');
  if (!el) { el = document.createElement('div'); el.id = 'comms'; document.getElementById('crt').appendChild(el); }
  who = who || (G.whatif ? S.aiName : 'CAPCOM');
  el.innerHTML = `<b>${esc(who)} ▸</b> <span></span>`; el.className = 'show';
  const sp = el.querySelector('span'); let i = 0;
  clearInterval(el._t); el._t = setInterval(() => { sp.textContent = text.slice(0, ++i); if (i % 2) beep(1500 + Math.random() * 400, .01, 'square', .008); if (i >= text.length) clearInterval(el._t); }, 22);
  clearTimeout(chatT); chatT = setTimeout(() => { el.className = ''; }, 2600 + text.length * 40);
}

// ---------- surprise emergencies (quick-time events) ----------
const EMERG = [
  { t: 'SOLAR FLARE!', d: 'A proton storm is coming. Safe the instruments!', type: 'key', key: 'S', fail: 'Radiation fried some data.' },
  { t: 'MICROMETEOROID!', d: 'A dust grain is heading straight for you. Dodge!', type: 'dir', fail: 'Hit! A thermocouple is damaged.' },
  { t: 'BIT FLIP!', d: 'A cosmic ray flipped a bit in memory. Re-enter the code!', type: 'seq', fail: 'Garbled data lost.' },
  { t: 'GYRO DRIFT!', d: 'Voyager is drifting off Earth. Fire the right thruster!', type: 'dir', fail: 'Extra fuel burned to recover.' },
];
const ARROWS = { ArrowLeft: '←', ArrowUp: '↑', ArrowRight: '→', ArrowDown: '↓' };
function emergency(next) {
  const r = S.run, e = pick(EMERG), win = { cadet: 3.2, engineer: 2.4, director: 1.7, sandbox: 3.2 }[S.diff] * (e.type === 'seq' ? 1.8 : 1);
  const keys = e.type === 'key' ? [e.key] : e.type === 'dir' ? [pick(Object.keys(ARROWS))] : [0, 1, 2].map(() => pick(Object.keys(ARROWS)));
  let idx = 0, over = false;
  sfx.bad(); shake(4);
  for (let i = 0; i < 3; i++) setTimeout(() => beep(1200, .08, 'square', .05), i * 180);
  const el = document.createElement('div'); el.id = 'emerg'; el.className = 'modal';
  const label = k => ARROWS[k] || k;
  const btns = e.type === 'key' ? [e.key] : Object.keys(ARROWS);
  const render = () => {
    el.innerHTML = `<div class="box emergbox"><p class="px bad blink" style="font-size:10px">⚠ EMERGENCY</p><h2>${e.t}</h2><p>${e.d}</p>
      <p class="seq">${keys.map((k, i) => `<span class="key ${i < idx ? 'done' : i === idx ? 'now' : ''}">${label(k)}</span>`).join(' ')}</p>
      <div class="ebar"><i style="animation-duration:${win}s"></i></div>
      <p>${btns.map(k => `<button data-k="${k}">${label(k)}</button>`).join('')}</p></div>`;
    el.querySelectorAll('[data-k]').forEach(b => b.onclick = () => press(b.dataset.k));
  };
  const press = k => {
    if (over) return;
    if (k.length === 1) k = k.toUpperCase();
    if (k === keys[idx]) { idx++; beep(900 + idx * 200, .05); if (idx >= keys.length) end(true); else render(); }
    else if (ARROWS[k] || k === e.key || /^[A-Z]$/.test(k)) end(false);
  };
  const kd = ev => { if (ARROWS[ev.key] || ev.key.length === 1) { ev.preventDefault(); ev.stopPropagation(); press(ev.key); } };
  const end = ok => {
    if (over) return; over = true; clearTimeout(tm); removeEventListener('keydown', kd, true);
    r.emerg = r.emerg || { ok: 0, fail: 0 }; r.emerg[ok ? 'ok' : 'fail']++;
    if (!ok) {
      if (e.t === 'SOLAR FLARE!' || e.t === 'BIT FLIP!') { r.sci.planet = Math.max(0, r.sci.planet - 10); r.sci.inter = Math.max(0, r.sci.inter - 10); }
      if (e.t === 'MICROMETEOROID!') r.damageW = (r.damageW || 0) + 4;
      if (e.t === 'GYRO DRIFT!') r.hyd -= 2;
    }
    el.innerHTML = `<div class="box emergbox"><h2 class="${ok ? 'ok' : 'bad'}">${ok ? '✓ SAVED!' : '✗ ' + e.fail}</h2></div>`;
    ok ? jingle([72, 76, 79, 84], .06) : (sfx.bad(), shake(6));
    chat(pick(ok ? LINES.emergOk : LINES.emergBad));
    setTimeout(() => { el.remove(); next(ok); }, 1100);
  };
  render(); document.getElementById('crt').appendChild(el);
  addEventListener('keydown', kd, true);
  const tm = setTimeout(() => end(false), win * 1000);
}
