// Engine: loop, input, audio, drawing helpers, shared state
const cv = document.getElementById('cv'), ctx = cv.getContext('2d');
cv.width = W; cv.height = H; ctx.imageSmoothingEnabled = false;
const UI = document.getElementById('ui');
const $ = s => document.querySelector(s);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const rnd = (a, b) => a + Math.random() * (b - a);
const fmt = (n, d = 0) => Number(n).toFixed(d);

const G = { scene: null, t: 0, whatif: false, paused: false, speed: clamp(+(new URLSearchParams(location.search).get('speed')) || 1, 1, 8) };
const S = { mode: 'solo', diff: 'engineer', players: [{ name: 'PLAYER 1', roles: ROLE_ORDER.slice() }],
  design: JSON.parse(JSON.stringify(REAL_DESIGN)), run: null, aiName: 'ECHO' };

// ---------- input ----------
const K = {}, pressed = new Set();
addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
  if (!K[e.key]) pressed.add(e.key);
  K[e.key] = true;
});
addEventListener('keyup', e => { K[e.key] = false; });
addEventListener('keydown', e => {
  const a = document.activeElement;
  if (a && a.classList && a.classList.contains('opt') && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); a.click(); }
  if (e.key === 'Escape' && S.run && !$('#menuBtn').hidden) togglePause();
}, true);
['pointerdown', 'keydown'].forEach(ev => addEventListener(ev, () => { if (AC && AC.state === 'suspended') AC.resume(); }));
addEventListener('blur', () => { for (const k in K) K[k] = false; });
const M = { x: W / 2, y: H / 2, down: false, clicked: false, moved: 0 };
function toCanvas(e) {
  const r = cv.getBoundingClientRect();
  M.x = (e.clientX - r.left) / r.width * W; M.y = (e.clientY - r.top) / r.height * H;
}
addEventListener('pointermove', e => { toCanvas(e); M.moved = G.t; });
cv.addEventListener('pointerdown', e => { toCanvas(e); M.down = true; M.clicked = true; M.moved = G.t; });
UI.addEventListener('pointerdown', e => { if (e.target === UI || e.target.classList.contains('passclick')) { toCanvas(e); M.down = true; M.clicked = true; M.moved = G.t; } });
addEventListener('pointerup', () => { M.down = false; });
const hit = k => pressed.has(k);
const action = () => hit(' ') || hit('Enter') || M.clicked;
// touch pad
document.querySelectorAll('#pad button').forEach(b => {
  const k = b.dataset.k;
  const on = e => { e.preventDefault(); if (!K[k]) pressed.add(k); K[k] = true; };
  const off = e => { e.preventDefault(); K[k] = false; };
  b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointerleave', off);
});
function pad(show) { $('#pad').hidden = !show; }

// ---------- audio ----------
let AC = null, muted = false;
function ac() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { } } return AC; }
function beep(f = 440, d = 0.08, type = 'square', v = 0.04) {
  if (muted || !ac()) return;
  const o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(v, AC.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, AC.currentTime + d);
  o.connect(g).connect(AC.destination); o.start(); o.stop(AC.currentTime + d + 0.02);
}
function rumble(d = 1, v = 0.08) {
  if (muted || !ac()) return;
  const n = AC.sampleRate * d, buf = AC.createBuffer(1, n, AC.sampleRate), ch = buf.getChannelData(0);
  for (let i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const s = AC.createBufferSource(), g = AC.createGain(), f = AC.createBiquadFilter();
  f.type = 'lowpass'; f.frequency.value = 300; g.gain.value = v; s.buffer = buf;
  s.connect(f).connect(g).connect(AC.destination); s.start();
}
const sfx = {
  ok: () => { beep(660, .06); setTimeout(() => beep(990, .08), 60); },
  bad: () => { beep(160, .25, 'sawtooth', .05); },
  tick: () => beep(1200, .02, 'square', .02),
  snap: () => { beep(1800, .03, 'square', .03); beep(900, .05, 'triangle', .04); },
};
$('#mute').onclick = () => { muted = !muted; $('#mute').textContent = muted ? '♪ OFF' : '♪ ON'; };

// ---------- drawing ----------
const C = () => G.whatif
  ? { fg: '#45f3d6', dim: '#1f8f80', hi: '#e8fffb', bad: '#ff3df2', ok: '#b6ff5c', bg: '#030a14', acc: '#a77bff' }
  : { fg: '#ffb000', dim: '#9a6a00', hi: '#fff1c4', bad: '#ff5a3c', ok: '#9cff6a', bg: '#120b02', acc: '#ff7a00' };
const STARS = Array.from({ length: 160 }, () => ({ x: Math.random() * W, y: Math.random() * H, z: Math.random() }));
function clear() { ctx.fillStyle = C().bg; ctx.fillRect(0, 0, W, H); }
function stars(vx = 0, vy = 0, dt = 0) {
  for (const s of STARS) {
    s.x = (s.x - vx * s.z * dt + W) % W; s.y = (s.y - vy * s.z * dt + H) % H;
    ctx.fillStyle = s.z > .8 ? C().hi : s.z > .45 ? C().fg : C().dim;
    ctx.fillRect(s.x | 0, s.y | 0, 1, 1);
  }
}
function txt(s, x, y, col, size = 16, align = 'left', font = 'VT323') {
  ctx.font = `${size}px ${font === 'px' ? "'Press Start 2P'" : 'VT323'}, monospace`;
  ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.fillStyle = col || C().fg;
  ctx.fillText(s, x | 0, y | 0);
}
function rect(x, y, w, h, col) { ctx.fillStyle = col; ctx.fillRect(x | 0, y | 0, w | 0, h | 0); }
function frameRect(x, y, w, h, col) { ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.strokeRect((x | 0) + .5, (y | 0) + .5, w | 0, h | 0); }
function disc(x, y, r, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
function ring(x, y, r, col) { ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.stroke(); }
function reticle(x, y, r, col) {
  ring(x, y, r, col); rect(x - r - 4, y, 4, 1, col); rect(x + r + 1, y, 4, 1, col); rect(x, y - r - 4, 1, 4, col); rect(x, y + r + 1, 1, 4, col);
}
// Pixel Voyager: dish, bus, booms
function voyager(x, y, s = 1, ang = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang); ctx.scale(s, s);
  const c = C();
  ctx.fillStyle = c.hi; ctx.beginPath(); ctx.ellipse(0, 0, 3, 9, 0, 0, 7); ctx.fill();
  rect(-1, -1, 3, 2, c.dim);
  rect(3, -3, 6, 6, c.fg);
  rect(9, 0, 18, 1, c.dim); rect(26, -1, 2, 3, c.fg);       // magnetometer boom
  rect(4, 3, 1, 10, c.dim); rect(2, 12, 5, 3, c.fg);          // RTG boom
  rect(6, -3, 1, -8, c.dim); rect(4, -13, 5, 3, c.fg);        // science boom
  ctx.restore();
}
function bar(x, y, w, h, frac, col, label) {
  frameRect(x, y, w, h, C().dim); rect(x + 1, y + 1, (w - 1) * clamp(frac, 0, 1), h - 1, col || C().fg);
  if (label) txt(label, x, y - 6, C().hi, 14);
}

// ---------- scenes & flow ----------
function setScene(s) {
  G.sceneN = (G.sceneN || 0) + 1; fxClear(); G.scene = s; s.t = 0; s.ready = !s.help; s.enter && s.enter();
  const old = document.getElementById('help'); if (old) old.remove();
  if (s.help) showHelp(s);
}
// "How to play this bit" overlay shown before every mini-game
function showHelp(s) {
  const h = s.help, el = document.createElement('div');
  el.id = 'help'; el.className = 'modal';
  el.innerHTML = `<div class="box helpbox"><p class="muted px" style="font-size:10px">HOW TO PLAY</p><h2>${h.title}</h2><p class="hi goal">${h.goal}</p>
    <div class="keys">${h.keys.map(([k, v]) => `<div><span class="key">${k}</span><span>${v}</span></div>`).join('')}</div>
    <button class="big" id="hgo">START ▶</button><p class="muted">or press SPACE</p></div>`;
  document.getElementById('crt').appendChild(el);
  const kd = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setTimeout(go, 0); } };
  const go = () => { if (s.ready) return; s.ready = true; s.t = 0; el.remove(); removeEventListener('keydown', kd); pressed.clear(); M.clicked = false; };
  addEventListener('keydown', kd); el.querySelector('#hgo').onclick = go;
}
let last = performance.now();
function frame(now) {
  let dt = Math.min(0.05, (now - last) / 1000); last = now;
  if (G.paused) { pressed.clear(); M.clicked = false; return requestAnimationFrame(frame); }
  dt *= G.speed; G.t += dt;
  const s = G.scene;
  if (s) {
    if (s.ready) { s.t += dt; s.update && s.update(dt); }
    ctx.save(); if (FX.shake > 0) ctx.translate(rnd(-FX.shake, FX.shake) | 0, rnd(-FX.shake, FX.shake) | 0);
    s.draw && s.draw(s.ready ? dt : 0); fxDraw(s.ready ? dt : 0); ctx.restore();
  }
  pressed.clear(); M.clicked = false;
  requestAnimationFrame(frame);
}
function ui(html, pass = false) {
  UI.innerHTML = html ? `<div class="layer">${html}</div>` : ''; UI.className = pass ? 'pass' : ''; UI.scrollTop = 0;
  document.body.classList.toggle('ui-full', !!html && !pass);
  UI.querySelectorAll('.opt').forEach(o => { o.tabIndex = 0; o.setAttribute('role', 'button'); });
}
// Pause / quit during a mission
function inRun(on) { $('#menuBtn').hidden = !on; }
function togglePause() {
  const open = $('#pause');
  if (open) { open.remove(); G.paused = false; return; }
  G.paused = true;
  const el = document.createElement('div'); el.id = 'pause'; el.className = 'modal';
  el.innerHTML = `<div class="box" style="text-align:center"><h2>PAUSED</h2><p><button class="big" id="pr">▶ RESUME</button></p>
    <p><button id="prs">↺ RESTART MISSION (same design)</button></p><p><button id="pq">◀ QUIT TO MENU</button></p></div>`;
  document.getElementById('crt').appendChild(el);
  $('#pr').onclick = togglePause;
  $('#prs').onclick = () => { togglePause(); abortRun(); startRun(); };
  $('#pq').onclick = () => { togglePause(); abortRun(); menu(); };
}
function abortRun() { S.run = null; const em = $('#emerg'); if (em) em.remove(); inRun(false); for (const k in K) K[k] = false; const h = $('#help'); if (h) h.remove(); }
$('#menuBtn').onclick = togglePause;
function setWhatif(on) { G.whatif = on; document.body.classList.toggle('whatif', on); }

// Run a list of steps; each step is fn(next)
function sequence(steps, done) {
  let i = 0;
  const next = () => { if (i < steps.length) steps[i++](next); else done && done(); };
  next();
}

function playersFor(role) { return S.players.filter(p => p.roles.includes(role)); }
function nameFor(role) { const p = playersFor(role)[0]; return p ? p.name : 'YOU'; }

// "STATION: X - take the controls"
function station(role, what, next) {
  if (S.mode !== 'crew') return next();
  const r = ROLES[role];
  setScene({ draw() { clear(); stars(8, 0, 1 / 60); } });
  ui(`<div class="center"><div class="box"><p class="muted px" style="font-size:10px">YOUR TURN</p><h2>${esc(nameFor(role))}</h2><p class="hi">${r.name}</p>
    <button class="big" id="go">TAKE THE CONTROLS ▶</button></div></div>`);
  beep(880, .05); $('#go').onclick = () => { sfx.ok(); next(); }; $('#go').focus();
}

// Team decision: solo picks directly; crew votes, ties go to Flight Director
function vote(title, intro, options, next) {
  const votes = {};
  const render = () => {
    const crew = S.mode === 'crew';
    ui(`<div class="center"><div class="box" style="max-width:760px"><h2>${title}</h2><p>${intro}</p>
      <div class="two" style="margin-top:10px">${options.map((o, i) => `<div class="panel"><h3>${o.name}</h3><p>${o.desc}</p>
        ${crew ? S.players.map((p, j) => `<button class="${votes[j] === i ? 'on' : ''}" data-v="${j}:${i}">${esc(p.name)}</button>`).join('') : `<button class="big" data-pick="${i}">CHOOSE</button>`}
      </div>`).join('')}</div>
      ${crew ? `<p class="muted">Everyone votes. A tie goes to the Flight Director, ${esc(nameFor('director'))}.</p><button class="big" id="done" ${Object.keys(votes).length < S.players.length ? 'disabled' : ''}>LOCK IN ▶</button>` : ''}
    </div></div>`);
    UI.querySelectorAll('[data-v]').forEach(b => b.onclick = () => { const [j, i] = b.dataset.v.split(':').map(Number); votes[j] = i; beep(700, .04); render(); });
    UI.querySelectorAll('[data-pick]').forEach(b => b.onclick = () => { sfx.ok(); next(+b.dataset.pick); });
    const d = $('#done');
    if (d) d.onclick = () => {
      const tally = options.map((_, i) => Object.values(votes).filter(v => v === i).length);
      const best = Math.max(...tally), top = tally.map((t, i) => t === best ? i : -1).filter(i => i >= 0);
      let pick = top[0];
      if (top.length > 1) { const fd = S.players.findIndex(p => p.roles.includes('director')); pick = top.includes(votes[fd]) ? votes[fd] : top[0]; }
      sfx.ok(); next(pick);
    };
  };
  setScene({ draw() { clear(); stars(5, 0, 1 / 60); } });
  render();
}

// Full-screen narrative card with typewriter text
function card(lines, next, opts = {}) {
  setScene({ draw() { clear(); stars(opts.vx || 6, 0, 1 / 60); } });
  ui(`<div class="center"><div class="box" style="max-width:720px;text-align:left">
    ${opts.title ? `<h2>${opts.title}</h2>` : ''}${opts.tag ? `<span class="tag ${opts.fiction ? 'fiction' : ''}">${opts.tag}</span>` : ''}
    <div id="tw"></div><p style="text-align:right"><button id="go" class="big" hidden>${opts.btn || 'CONTINUE ▶'}</button></p></div></div>`);
  const tw = $('#tw'), go = $('#go');
  tw.innerHTML = lines.map(l => `<p>${l}</p>`).join(''); go.hidden = false; go.focus();
  let done = false;
  const k = e => { if (done || !document.body.contains(go)) return removeEventListener('keydown', k); if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go.click(); } };
  setTimeout(() => addEventListener('keydown', k), 250);
  go.onclick = () => { if (done) return; done = true; removeEventListener('keydown', k); sfx.ok(); next(); };
}
// ---------- failsafes ----------
// Play a mini-game; if it fails, offer ONE failsafe retry (costs 50 points) or accept and carry on.
function withRetry(key, play, failed, info, next) {
  const r = S.run; r.retried = r.retried || {}; r.penalty = r.penalty || 0;
  const snap = info.snapshot ? info.snapshot() : null;
  const attempt = () => play(() => {
    if (!failed() || r.retried[key]) return next();
    failsafe(info, () => { r.retried[key] = true; r.penalty += 50; if (info.restore) info.restore(snap); attempt(); }, next);
  });
  attempt();
}
function failsafe(info, retry, accept) {
  setScene({ draw() { clear(); stars(2, 0, 1 / 60); if ((G.t * 2 | 0) % 2) rect(0, 0, W, 3, C().bad); } });
  sfx.bad();
  ui(`<div class="center"><div class="box" style="max-width:640px"><p class="px bad" style="font-size:10px">⚠ MISSION ANOMALY</p><h2>${info.title}</h2><p>${typeof info.msg === "function" ? info.msg() : info.msg}</p>
    <p style="margin-top:14px"><button class="big" id="fs">🛟 FAILSAFE: ${info.label}</button></p><p class="muted">One use only · costs 50 points</p>
    <p><button id="acc">ACCEPT AND CONTINUE ▶</button></p></div></div>`);
  $('#fs').onclick = () => { sfx.ok(); retry(); };
  $('#acc').onclick = () => accept();
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
