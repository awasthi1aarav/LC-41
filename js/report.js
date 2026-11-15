// Mission report, analysis and hall of fame
function score() {
  const r = S.run, c = r.c, d = r.d, diff = DIFF[S.diff], obj = d.obj;
  const reserve = diff.sandbox ? 0 : diff.budget - c.cost;
  const design = Math.round((diff.sandbox ? 0 : Math.min(50, Math.max(0, reserve))) + Math.min(40, Math.max(0, c.margin * 100)) + Math.min(30, Math.max(0, c.massMargin * 300)));
  const sc = { ...r.sci };
  if (obj === 'grand') sc.planet *= 1.5;
  if (obj === 'titan') sc.titan *= 2;
  if (obj === 'far') sc.inter *= 1.5;
  const science = Math.round(Object.values(sc).reduce((a, b) => a + b, 0));
  let life = (r.silence - c.launchYear) * 4 + (r.extraYears || 0) * 6;
  if (obj === 'far') life *= 1.5;
  const longevity = Math.round(life);
  if (r.emerg) r.manual.Emergencies = r.emerg.ok / Math.max(1, r.emerg.ok + r.emerg.fail) * 100;
  const mv = Object.values(r.manual), manual = Math.round(mv.length ? mv.reduce((a, b) => a + b, 0) / mv.length * 2 : 0);
  const goals = {
    director: !diff.sandbox && reserve >= 20,
    engineer: c.margin >= .15 && r.silence >= 2026.88,
    science: c.flown.length >= 7,
    capcom: r.dataMade > 0 && r.dataLost / r.dataMade <= .1,
  };
  const team = Object.values(goals).filter(Boolean).length * 40;
  const penalty = r.penalty || 0;
  const total = design + science + longevity + manual + team - penalty;
  const rank = total < 400 ? 'TRAINEE' : total < 700 ? 'FLIGHT CONTROLLER' : total < 1000 ? 'MISSION ENGINEER' : total < 1300 ? 'FLIGHT DIRECTOR' : 'GRAND TOUR LEGEND';
  return { design, science, longevity, manual, team, penalty, total, rank, goals, reserve };
}

function analysis(s) {
  const r = S.run, c = r.c, d = r.d, out = [];
  out.push(`<b>Power:</b> ${d.rtg} RTG${d.rtg > 1 ? 's' : ''} gave ${c.supply0} W at launch. RTGs fade slowly, so power fell below the ${c.bus.essential} W needed to stay alive in <b>${Math.floor(r.silence)}</b>${r.silenceWhy !== 'power' ? ' (but something else ended the mission first)' : ''}. The real Voyager 1, with 3 RTGs, is expected to run until the early 2030s.`);
  if (r.silenceWhy === 'hydrazine') out.push(`<b>Hydrazine ran out</b> before power did. You launched ${d.hyd} kg; the real Voyager carried about 104 kg. Without thrusters the antenna can't stay pointed at Earth.`);
  if (r.silenceWhy === 'frozen') out.push('<b>The thruster lines froze.</b> Turning off the line heaters saved 15 W but killed pointing. NASA guards those heaters above almost everything else.');
  out.push(`<b>Data:</b> ${fmt(r.dataMade)} units made, ${fmt(r.dataLost)} lost (${fmt(r.dataMade ? r.dataLost / r.dataMade * 100 : 0)}%). ${r.dataLost ? (d.hga === 'small' ? 'The 2.0 m dish has only 29% of the 3.7 m dish\'s area, so it carries far less data.' : !d.tape ? 'Without a tape recorder, data that can\'t be sent live during a fast flyby is lost.' : 'You shot more than your downlink could carry.') : 'Your comms design kept up with your instruments.'}`);
  out.push(`<b>Mass:</b> ${fmt(c.mass)} kg on a ${c.lv.name} (limit ${c.lv.max} kg), margin ${fmt(c.massMargin * 100, 1)}%. ${c.bus.noPlatform ? 'The spinning light bus saved a lot of mass but could not carry cameras, which is why Pioneer 10 used a spin-scan photopolarimeter instead.' : ''}`);
  if (!DIFF[S.diff].sandbox) out.push(`<b>Budget:</b> $${fmt(c.cost)}M of $${DIFF[S.diff].budget}M, $${fmt(s.reserve)}M left. ${c.win.delay ? 'Launching late cost money and lost planets.' : ''}`);
  if (r.flags.titan) out.push(`<b>Titan:</b> you made the real choice. ${S.run.on.IRIS || S.run.on.UVS ? 'Your spectrometers read its atmosphere.' : 'With no IR or UV spectrometer, Titan was just orange haze.'}`);
  if (r.flags.pluto) out.push('<b>Pluto gamble:</b> in this timeline you skipped Titan. Pluto wasn\'t visited until New Horizons flew past in 2015.');
  out.push(r.flags.pbd ? '<b>Pale Blue Dot:</b> found. Earth spans less than a single pixel from 6 billion km.' : '<b>Pale Blue Dot:</b> not captured.');
  out.push(`<b>Long Night:</b> ${r.faults} power fault${r.faults === 1 ? '' : 's'}. ${r.faults ? 'Each undervoltage let fault protection switch off an instrument you might have kept.' : 'Clean power management, like the real Voyager team.'}`);
  out.push(`<b>What-if:</b> ${r.ore || 0} ore → +${(r.ore || 0) * 10} W → +${fmt(r.extraYears || 0, 1)} years. Revived: ${(r.revived || []).join(', ') || 'nothing'}.`);
  return out;
}

function lookalike() {
  const c = S.run.c, d = S.run.d;
  if (c.bus.noPlatform) return ['Pioneer 10 (1972)', 'A light, spinning probe with 4 RTGs that flew past Jupiter on an Atlas-Centaur.'];
  if (d.rtg === 3 && c.flown.length >= 9 && d.win === 'y77') return ['Voyager 1 (1977)', 'Your design is very close to the real thing. Mission planners in 1977 made the same calls.'];
  if (!c.win.saturn) return ['Galileo-style Jupiter mission', 'Jupiter only, like NASA\'s Galileo orbiter (1989).'];
  return ['Voyager 2 (1977)', 'A Grand Tour probe like Voyager 1\'s twin, which went on to Uranus and Neptune.'];
}

function report() {
  setWhatif(false); pad(false); inRun(false); music('menu');
  const s = score(), r = S.run, [la, ld] = lookalike();
  setScene({ draw(dt) { clear(); stars(4, 0, dt); } });
  const rows = [['Mission design', s.design], ['Science', s.science], ['Longevity', s.longevity], ['Manual piloting', s.manual], ['Team goals', s.team], ['Failsafes used', s.penalty ? -s.penalty : 0]];
  ui(`<div class="center"><div class="box" style="max-width:940px;text-align:left">
    <p class="px muted" style="font-size:10px">MISSION REPORT · LC-41 · ${S.mode === 'crew' ? 'CREW OF ' + S.players.length : 'SOLO'} · ${DIFF[S.diff].name}</p>
    <h1 style="font-size:clamp(20px,4vw,40px)">${s.total} PTS</h1><h2>RANK: ${s.rank}</h2>
    <div class="two"><div>
      <table>${rows.map(([a, b]) => `<tr><td>${a}</td><td class="n">${b}</td></tr>`).join('')}<tr><th>TOTAL</th><th class="n">${s.total}</th></tr></table>
      <h3 style="margin-top:12px">MINI-GAMES</h3>${Object.entries(r.stars || {}).map(([k, n]) => `<p>${k}: <span style="color:#ffe14d">${'★'.repeat(n)}</span><span class="muted">${'★'.repeat(3 - n)}</span></p>`).join('')}
      ${r.emerg ? `<p>Emergencies: <span class="ok">${r.emerg.ok} saved</span>, <span class="bad">${r.emerg.fail} missed</span></p>` : ''}
      <h3 style="margin-top:12px">TEAM GOALS</h3>
      ${ROLE_ORDER.map(k => `<p class="${s.goals[k] ? 'ok' : 'bad'}">${s.goals[k] ? '✓' : '✗'} ${ROLES[k].name}${S.mode === 'crew' ? ` (${esc(nameFor(k))})` : ''}: ${ROLES[k].goal}</p>`).join('')}
      <h3 style="margin-top:12px">YOUR SPACECRAFT RESEMBLES</h3><p class="hi">${la}</p><p>${ld}</p>
    </div><div>
      <h3>WHY IT WENT THIS WAY</h3>${analysis(s).map(a => `<p>• ${a}</p>`).join('')}
    </div></div>
    <h3 style="margin-top:14px">REAL HISTORY vs THIS GAME</h3>
    <table>${HISTORY.map(([d, t]) => `<tr><td style="white-space:nowrap">${d}</td><td>${t}</td></tr>`).join('')}
      <tr><td class="fiction">2026-B</td><td class="fiction">FICTION: an awakened Voyager, a mining drone and asteroid ore. Voyager has none of these, and there are no convenient asteroids in interstellar space.</td></tr></table>
    <p style="margin-top:12px" class="row"><input type="text" id="hn" maxlength="14" value="${esc(S.mode === 'crew' ? S.players.map(p => p.name).join('+').slice(0, 14) : S.players[0].name)}"><button id="save">SAVE TO HALL OF FAME</button><button id="share">COPY DESIGN LINK</button></p>
    <p style="text-align:center"><button class="big" id="again">FLY AGAIN</button><button class="big" id="redo">REDESIGN</button><button class="big" id="menu">MENU</button></p>
  </div></div>`);
  $('#save').onclick = () => { const hof = loadHof(); hof.push({ n: $('#hn').value || 'ANON', s: s.total, r: s.rank, d: S.diff, t: Date.now() }); hof.sort((a, b) => b.s - a.s); try { localStorage.setItem('lc41_hof', JSON.stringify(hof.slice(0, 10))); } catch (e) { } $('#save').disabled = true; $('#save').textContent = 'SAVED'; sfx.ok(); };
  $('#share').onclick = () => { const link = designLink(r.d); (navigator.clipboard ? navigator.clipboard.writeText(link) : Promise.reject()).then(() => { $('#share').textContent = 'LINK COPIED'; }, () => prompt('Copy this link:', link)); };
  $('#again').onclick = () => { S.design = JSON.parse(JSON.stringify(r.d)); startRun(); };
  $('#redo').onclick = () => { S.design = JSON.parse(JSON.stringify(r.d)); designScreen(); };
  $('#menu').onclick = menu;
}
function loadHof() { try { return JSON.parse(localStorage.getItem('lc41_hof')) || []; } catch (e) { return []; } }
function designLink(d) { return location.href.split('#')[0] + '#d=' + btoa(JSON.stringify(d)); }
