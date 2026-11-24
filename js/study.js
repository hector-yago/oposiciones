// Pantallas de estudio y extras: examen, tarjetas de artículos, minijuegos, armario, misiones, objetivo y visor de artículos.
// Se inicializa con un «contexto» de la app (acceso a datos, render y utilidades) para no depender de app.js.
import { applyExamAnswer, EXAM_SIZES, formatSecs, PASS_MARK, pickExam, recordExam, timeLimit } from './exam.js';
import { claimGoalBonus, daysToExam, goalPct, todayCount } from './goal.js';
import { awardGame, canEarn, MAX_REWARDED_PLAYS, pairsRound, playsToday, vfRound } from './minigames.js';
import { claimMission, isDone, missionText } from './missions.js';
import { CLOTHES } from './catalog.js';
import { equip, ownedIds } from './shop.js';
import { OUTFIT_SLOTS } from './migrations.js';
import { avatarSvg } from './art/scene.js';
import { itemThumb } from './art/items.js';
import { byArticle } from './stats.js';

let ctx;
let exam = null;
let cards = null;
let pairs = null;
let vf = null;
let gameMode = 'hub';
const articles = {};

export function init(c) {
  ctx = c;
}

const SLOT_NAMES = { hat: 'Sombrero', face: 'Cara', neck: 'Cuello', top: 'Camiseta' };
const shuffled = (list) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/* ---------- Estado común ---------- */
export function clearTimers() {
  if (exam) clearInterval(exam.timer);
}

/** ¿Se puede salir de la pantalla actual? Pregunta si hay un examen a medias. */
export function canLeave(nextView) {
  if (exam?.phase === 'run' && nextView !== 'examen') {
    if (!confirm('¿Abandonar el examen? Se perderá lo respondido hasta ahora.')) return false;
    clearTimers();
    exam = null;
  }
  return true;
}

export function resetOnEnter(view) {
  if (view === 'examen' && exam?.phase !== 'run') exam = null;
  if (view === 'tarjetas') cards = null;
  if (view === 'juegos') {
    gameMode = 'hub';
    pairs = null;
    vf = null;
  }
}

export const examRunning = () => exam?.phase === 'run';

/* ---------- Visor de artículos ---------- */
async function loadArticles(temaId) {
  const tema = ctx.getTema(temaId);
  if (!tema?.articulos) return null;
  if (!articles[temaId]) {
    try {
      articles[temaId] = await (await fetch(tema.articulos)).json();
    } catch {
      return null;
    }
  }
  return articles[temaId];
}

export async function openArticle(temaId, n) {
  const data = await loadArticles(temaId);
  const art = data?.[n];
  if (!art) {
    ctx.toast('No se ha podido cargar el artículo. Comprueba la conexión.');
    return;
  }
  document.querySelector('.overlay')?.remove();
  const el = document.createElement('div');
  el.className = 'overlay';
  el.innerHTML = `<div class="sheet article" data-testid="article"><h2>Artículo ${ctx.esc(n)}</h2><p class="muted">Título ${ctx.esc(art.titulo)} · texto oficial (BOE)</p>
    ${art.texto
      .split('\n')
      .map((p) => `<p>${ctx.esc(p)}</p>`)
      .join('')}
    <button class="btn primary block" data-act="sheet-close">Cerrar</button></div>`;
  document.body.append(el);
}

/* ---------- Misiones y objetivo (tarjetas de la casa) ---------- */
function missionRow(m, list) {
  const done = isDone(m);
  const pct = Math.round((m.progress / m.target) * 100);
  const action = m.claimed ? '<span class="tag ok">Cobrada</span>' : done ? `<button class="btn small primary" data-act="claim" data-list="${list}" data-id="${ctx.esc(m.id)}">Cobrar ${m.reward}</button>` : `<span class="tag">+${m.reward}</span>`;
  return `<li class="mission ${m.claimed ? 'claimed' : ''}" data-testid="mission"><div class="m-body"><span>${ctx.esc(missionText(m))}</span><span class="bar"><i style="width:${pct}%"></i></span><small class="muted">${m.progress} / ${m.target}</small></div>${action}</li>`;
}

export function missionsCard() {
  const d = ctx.doc();
  if (!d.missions.daily.length) return '';
  return `<section class="card missions" data-testid="missions"><h3>Misiones</h3>
    <h4>De hoy</h4><ul>${d.missions.daily.map((m) => missionRow(m, 'daily')).join('')}</ul>
    <h4>De la semana</h4><ul>${d.missions.weekly.map((m) => missionRow(m, 'weekly')).join('')}</ul></section>`;
}

export function goalCard(now) {
  const d = ctx.doc();
  const days = daysToExam(d.goal, now);
  const count = todayCount(d, now);
  const pct = goalPct(d, now);
  const countdown = days === null ? '<p class="muted">Pon la fecha de tu examen en Ajustes para ver la cuenta atrás.</p>' : `<p class="countdown"><b>${days}</b> ${days === 1 ? 'día' : 'días'} para el examen${days === 0 ? ' · ¡hoy es el gran día!' : ''}</p>`;
  return `<section class="card goal" data-testid="goal"><h3>Objetivo de hoy</h3>${countdown}
    <span class="bar"><i style="width:${pct}%"></i></span><p class="muted">${count} de ${d.goal.daily} preguntas${pct >= 100 ? ' · ¡objetivo cumplido!' : ` · +${2} monedas al cumplirlo`}</p></section>`;
}

export async function claim(list, id) {
  const v = await ctx.store.update((d) => claimMission(d, list, id));
  if (v) ctx.toast(`¡Misión cumplida! +${ctx.plural(v, 'moneda', 'monedas')}`);
  ctx.rerender();
  await ctx.afterChange();
}

/* ---------- Armario ---------- */
export function viewArmario() {
  const d = ctx.doc();
  const owned = ownedIds(d);
  const slots = OUTFIT_SLOTS.map((slot) => {
    const items = CLOTHES.filter((c) => c.slot === slot && owned.has(c.id));
    const worn = d.outfit[slot];
    const buttons = items.length
      ? items.map((c) => `<button class="cloth ${worn === c.id ? 'on' : ''}" data-act="wear" data-slot="${slot}" data-id="${c.id}" aria-pressed="${worn === c.id}">${itemThumb(c.id, 'thumb')}<span>${ctx.esc(c.name)}</span></button>`).join('')
      : '<p class="muted">Aún no tienes nada para este sitio. Mira la pestaña «Ropa» de la tienda.</p>';
    return `<section class="card"><h3>${SLOT_NAMES[slot]}</h3><div class="cloth-row">${worn ? `<button class="cloth off" data-act="wear" data-slot="${slot}" data-id="">Quitar</button>` : ''}${buttons}</div></section>`;
  }).join('');
  return `<section class="card preview" data-testid="wardrobe"><svg class="avatar-preview" viewBox="-70 -170 140 185" role="img" aria-label="Tu personaje"><g class="avatar">${avatarSvg(d.profile.gender, d.outfit)}</g></svg></section>${slots}`;
}

export async function wear(slot, id) {
  try {
    await ctx.store.update((d) => equip(d, slot, id));
  } catch (e) {
    ctx.toast(e.message);
    return;
  }
  ctx.rerender();
  await ctx.afterChange();
}

/* ---------- Examen ---------- */
export function viewExamen() {
  const d = ctx.doc();
  if (!exam || exam.phase === 'setup') {
    const n = exam?.n ?? 20;
    const hist = [...d.exams].reverse().slice(0, 5);
    return `<section class="card"><h3>Modo examen</h3>
      <p class="muted">Preguntas de la Constitución sin pistas ni explicaciones, con tiempo (${50} s por pregunta) y nota sobre 10. Cada fallo resta un tercio de acierto; las preguntas en blanco no restan. Con 5 o más aprobarás y ganarás monedas según la nota.</p>
      <div class="seg full" role="group" aria-label="Número de preguntas">${EXAM_SIZES.map((s) => `<button data-act="exam-size" data-n="${s}" aria-pressed="${n === s}">${s}</button>`).join('')}</div>
      <p class="muted center">Tiempo: ${formatSecs(timeLimit(n))}</p>
      <button class="btn primary block" data-act="exam-start" data-testid="exam-start">Empezar examen</button></section>
      ${hist.length ? `<section class="card"><h3>Tus últimos exámenes</h3>${hist.map((e) => `<div class="line"><span>${new Date(e.at).toLocaleDateString('es-ES')} · ${e.n} preguntas</span><b class="${e.score >= PASS_MARK ? 'pass' : 'fail'}">${String(e.score).replace('.', ',')}</b></div>`).join('')}</section>` : ''}`;
  }
  if (exam.phase === 'run') {
    const q = exam.qs[exam.i];
    const order = exam.orders[exam.i];
    const left = Math.max(0, exam.limit - Math.floor((Date.now() - exam.started) / 1000));
    return `<div class="quiz-bar"><span class="chip-stat">Pregunta <b>${exam.i + 1}/${exam.qs.length}</b></span><span class="chip-stat" id="exam-timer" data-testid="exam-timer">${formatSecs(left)}</span>
      <button class="btn small" data-act="exam-finish">Entregar</button></div>
      <article class="card question"><p class="ref">${ctx.esc(q.titulo)}</p><h2 data-testid="exam-question">${ctx.esc(q.enunciado)}</h2>
      <div class="opts">${order.map((orig, pos) => `<button class="opt" data-act="exam-answer" data-p="${pos}"><span class="letter">${'ABCD'[pos]}</span><span>${ctx.esc(q.opciones[orig])}</span></button>`).join('')}</div>
      <button class="btn small joker" data-act="exam-blank">Dejar en blanco</button></article>`;
  }
  const r = exam.result;
  const mins = formatSecs(exam.elapsed);
  const wrong = exam.review.filter((x) => x.state === 'ko');
  return `<section class="card result ${r.passed ? 'pass' : 'fail'}" data-testid="exam-result"><h3>${r.passed ? '¡Aprobado!' : 'Suspenso'}</h3>
    <p class="score"><b>${String(r.score).replace('.', ',')}</b> / 10</p>
    <div class="kpis"><div><b>${exam.ok}</b><span>aciertos</span></div><div><b>${exam.ko}</b><span>fallos</span></div><div><b>${exam.blank}</b><span>en blanco</span></div></div>
    <p class="muted center">Tiempo: ${mins}${r.coins ? ` · <b class="gain">+${ctx.plural(r.coins, 'moneda', 'monedas')}</b>` : ''}${r.goal ? ` · +${r.goal} por el objetivo del día` : ''}</p>
    <button class="btn primary block" data-act="exam-again">Otro examen</button></section>
    ${wrong.length ? `<section class="card"><h3>Para repasar</h3>${wrong.map((x) => `<div class="line"><span><small>${ctx.esc(x.q.titulo)} · Art. ${ctx.esc(x.q.articulo)}</small><br>${ctx.esc(x.q.enunciado)}<br><small class="muted">Correcta: ${ctx.esc(x.q.opciones[x.q.correcta])}</small></span><button class="btn small" data-act="article" data-t="${ctx.esc(x.q.tema)}" data-n="${ctx.esc(x.q.articulo.split('.')[0])}">Artículo</button></div>`).join('')}</section>` : ''}`;
}

async function startExam(temaId) {
  const bank = ctx.banks()[temaId];
  if (!bank?.length) {
    ctx.toast('No se han cargado las preguntas.');
    return;
  }
  const n = Math.min(exam?.n ?? 20, bank.length);
  const qs = pickExam(bank, n);
  exam = { phase: 'run', n, qs, orders: qs.map(() => shuffled([0, 1, 2, 3])), picks: qs.map(() => null), i: 0, started: Date.now(), limit: timeLimit(qs.length), timer: null, temaId };
  exam.timer = setInterval(() => {
    const el = document.getElementById('exam-timer');
    const left = Math.max(0, exam.limit - Math.floor((Date.now() - exam.started) / 1000));
    if (el) el.textContent = formatSecs(left);
    if (left <= 0) finishExam().catch(() => {});
  }, 1000);
  ctx.rerender();
}

function advance(pick) {
  if (exam?.phase !== 'run') return;
  exam.picks[exam.i] = pick;
  if (exam.i + 1 >= exam.qs.length) finishExam().catch(() => {});
  else {
    exam.i += 1;
    ctx.rerender();
  }
}

export async function finishExam() {
  if (exam?.phase !== 'run') return;
  clearInterval(exam.timer);
  const now = Date.now();
  const review = exam.qs.map((q, i) => {
    const pos = exam.picks[i];
    if (pos === null) return { q, state: 'blank' };
    return { q, state: exam.orders[i][pos] === q.correcta ? 'ok' : 'ko' };
  });
  const ok = review.filter((x) => x.state === 'ok').length;
  const ko = review.filter((x) => x.state === 'ko').length;
  const blank = review.length - ok - ko;
  const elapsed = Math.min(exam.limit, Math.floor((now - exam.started) / 1000));
  const result = await ctx.store.update((d) => {
    for (const x of review) if (x.state !== 'blank') applyExamAnswer(d, x.q, x.state === 'ok', now);
    const r = recordExam(d, { n: review.length, ok, ko, blank, secs: elapsed }, now);
    r.goal = claimGoalBonus(d, now);
    return r;
  });
  Object.assign(exam, { phase: 'done', result, review, ok, ko, blank, elapsed });
  ctx.rerender();
  await ctx.afterChange();
}

/* ---------- Tarjetas de artículos ---------- */
export async function startCards(temaId) {
  const data = await loadArticles(temaId);
  if (!data) {
    ctx.toast('No se han podido cargar los artículos. Comprueba la conexión.');
    return;
  }
  const questions = ctx.allQuestions().filter((q) => q.tema === temaId);
  const worst = byArticle(ctx.doc(), questions, { minAnswers: 1, limit: 10 }).map((a) => a.articulo);
  const rest = shuffled([...new Set(questions.map((q) => q.articulo.split('.')[0]))].filter((n) => data[n] && !worst.includes(n)));
  cards = { temaId, deck: [...worst, ...rest].slice(0, 10), i: 0, flipped: false, known: 0, review: 0, data, fromErrors: worst.length };
  ctx.rerender();
}

export function viewTarjetas() {
  if (!cards) return '<p class="empty"><b>Cargando…</b></p>';
  if (cards.i >= cards.deck.length) {
    return `<section class="card center"><h3>¡Mazo terminado!</h3><p>Sabías <b>${cards.known}</b> de ${cards.deck.length} artículos.</p><p class="muted">Los que marcaste para repasar volverán a salir cuando falles preguntas de ellos.</p>
      <button class="btn primary block" data-act="cards-again">Otro mazo</button></section>`;
  }
  const n = cards.deck[cards.i];
  const art = cards.data[n];
  const front = `<p class="ref">Tarjeta ${cards.i + 1} de ${cards.deck.length}${cards.i < cards.fromErrors ? ' · donde más fallas' : ''}</p><h2>Artículo ${ctx.esc(n)}</h2><p class="muted">Título ${ctx.esc(art.titulo)}</p><p class="hint">Intenta recordar qué dice… y pulsa para ver el texto.</p>`;
  const back = `<p class="ref">Artículo ${ctx.esc(n)} · Título ${ctx.esc(art.titulo)}</p>${art.texto
    .split('\n')
    .map((p) => `<p>${ctx.esc(p)}</p>`)
    .join('')}`;
  return `<button class="card flashcard ${cards.flipped ? 'back' : ''}" data-act="card-flip" data-testid="flashcard">${cards.flipped ? back : front}</button>
    ${cards.flipped ? '<div class="actions"><button class="btn grow" data-act="card-next" data-know="0">A repasar</button><button class="btn primary grow" data-act="card-next" data-know="1">Lo sabía</button></div>' : ''}`;
}

/* ---------- Minijuegos ---------- */
export function viewJuegos() {
  const d = ctx.doc();
  const now = Date.now();
  const left = Math.max(0, MAX_REWARDED_PLAYS - playsToday(d, now));
  if (gameMode === 'pairs' && pairs) return viewPairs();
  if (gameMode === 'vf' && vf) return viewVf();
  return `<p class="muted lead">Para descansar entre test y test. Tienes <b>${left}</b> ${left === 1 ? 'partida' : 'partidas'} con premio hoy (hasta 3 monedas cada una).</p>
    <button class="card topic" data-act="game-pairs" data-testid="game-pairs"><span class="t-name">Emparejar</span><span class="muted">Une cada Título de la Constitución con lo que regula.</span><span class="t-info">${canEarn(d, now) ? 'Con premio' : 'Sin premio hoy'}</span></button>
    <button class="card topic" data-act="game-vf" data-testid="game-vf"><span class="t-name">Verdadero o falso</span><span class="muted">Ocho afirmaciones rápidas sacadas de las preguntas.</span><span class="t-info">${canEarn(d, now) ? 'Con premio' : 'Sin premio hoy'}</span></button>`;
}

function startPairs() {
  const r = pairsRound(Math.random, 6);
  pairs = { ...r, selL: null, matched: [], mistakes: 0, done: false, coins: 0, flash: null };
  gameMode = 'pairs';
  ctx.rerender();
}

function viewPairs() {
  const p = pairs;
  const cell = (side, it) => {
    const matched = p.matched.includes(it.id);
    const sel = side === 'l' && p.selL === it.id;
    const bad = p.flash && p.flash[side] === it.id;
    return `<button class="pair ${matched ? 'ok' : ''} ${sel ? 'sel' : ''} ${bad ? 'bad' : ''}" data-act="pair-${side}" data-id="${ctx.esc(it.id)}" ${matched ? 'disabled' : ''}>${ctx.esc(it.label)}</button>`;
  };
  if (p.done) {
    return `<section class="card center" data-testid="pairs-done"><h3>¡Completado!</h3><p>${p.mistakes} ${p.mistakes === 1 ? 'fallo' : 'fallos'}</p>${p.coins ? `<p><b class="gain">+${ctx.plural(p.coins, 'moneda', 'monedas')}</b></p>` : '<p class="muted">Sin premio esta vez.</p>'}
      <button class="btn primary block" data-act="game-pairs">Jugar otra vez</button><button class="btn block" data-act="go" data-v="juegos">Volver</button></section>`;
  }
  return `<p class="muted lead">Toca un Título y después lo que regula. Fallos: <b>${p.mistakes}</b></p>
    <div class="pairs"><div class="col">${p.left.map((it) => cell('l', it)).join('')}</div><div class="col">${p.right.map((it) => cell('r', it)).join('')}</div></div>`;
}

async function pairClick(side, id) {
  const p = pairs;
  if (!p || p.done) return;
  p.flash = null;
  if (side === 'l') p.selL = p.selL === id ? null : id;
  else if (p.selL) {
    if (p.selL === id) {
      p.matched.push(id);
      p.selL = null;
    } else {
      p.mistakes += 1;
      p.flash = { l: p.selL, r: id };
      p.selL = null;
    }
  }
  if (p.matched.length === p.pairs.length) {
    p.done = true;
    const ratio = p.pairs.length / (p.pairs.length + p.mistakes);
    p.coins = await ctx.store.update((d) => awardGame(d, Date.now(), ratio));
    ctx.rerender();
    await ctx.afterChange();
    return;
  }
  ctx.rerender();
}

function startVf() {
  const qs = ctx.allQuestions();
  if (!qs.length) {
    ctx.toast('No se han cargado las preguntas.');
    return;
  }
  vf = { rounds: Array.from({ length: 8 }, () => vfRound(qs)), i: 0, ok: 0, answered: null, done: false, coins: 0 };
  gameMode = 'vf';
  ctx.rerender();
}

function viewVf() {
  if (vf.done) {
    return `<section class="card center" data-testid="vf-done"><h3>¡Terminado!</h3><p><b>${vf.ok}</b> de ${vf.rounds.length} aciertos</p>${vf.coins ? `<p><b class="gain">+${ctx.plural(vf.coins, 'moneda', 'monedas')}</b></p>` : '<p class="muted">Sin premio esta vez.</p>'}
      <button class="btn primary block" data-act="game-vf">Jugar otra vez</button><button class="btn block" data-act="go" data-v="juegos">Volver</button></section>`;
  }
  const r = vf.rounds[vf.i];
  const fb =
    vf.answered === null
      ? ''
      : `<div class="feedback ${vf.answered === r.truth ? 'ok' : 'ko'}"><p class="verdict">${vf.answered === r.truth ? '¡Correcto!' : 'Incorrecto'} Era ${r.truth ? 'verdadero' : 'falso'}.</p><p>${ctx.esc(r.explanation)}</p><button class="btn primary block" data-act="vf-next">Siguiente</button></div>`;
  return `<div class="quiz-bar"><span class="chip-stat">Ronda <b>${vf.i + 1}/${vf.rounds.length}</b></span><span class="chip-stat">Aciertos <b>${vf.ok}</b></span></div>
    <article class="card question"><p class="ref">Art. ${ctx.esc(r.article)}</p><h2 data-testid="vf-text">${ctx.esc(r.text)}</h2><p class="vf-option">«${ctx.esc(r.option)}»</p>
    <div class="actions"><button class="btn grow ${vf.answered === true ? 'sel' : ''}" data-act="vf-answer" data-v="1" ${vf.answered === null ? '' : 'disabled'}>Verdadero</button><button class="btn grow ${vf.answered === false ? 'sel' : ''}" data-act="vf-answer" data-v="0" ${vf.answered === null ? '' : 'disabled'}>Falso</button></div></article>${fb}`;
}

async function vfAnswer(v) {
  if (!vf || vf.answered !== null) return;
  vf.answered = v;
  if (v === vf.rounds[vf.i].truth) vf.ok += 1;
  ctx.rerender();
}

async function vfNext() {
  if (!vf || vf.answered === null) return;
  if (vf.i + 1 >= vf.rounds.length) {
    vf.done = true;
    vf.coins = await ctx.store.update((d) => awardGame(d, Date.now(), vf.ok / vf.rounds.length));
    ctx.rerender();
    await ctx.afterChange();
    return;
  }
  vf.i += 1;
  vf.answered = null;
  ctx.rerender();
}

/* ---------- Despacho de acciones ---------- */
/** Gestiona las acciones de estas pantallas. Devuelve true si la acción era suya. */
export async function onAct(act, el) {
  switch (act) {
    case 'exam-size':
      exam = { phase: 'setup', n: Number(el.dataset.n) };
      ctx.rerender();
      return true;
    case 'exam-start':
      await startExam('ce');
      return true;
    case 'exam-answer':
      advance(Number(el.dataset.p));
      return true;
    case 'exam-blank':
      advance(null);
      return true;
    case 'exam-finish':
      if (confirm('¿Entregar el examen ahora? Las preguntas sin responder cuentan como en blanco.')) {
        for (let k = exam.i; k < exam.qs.length; k++) if (exam.picks[k] === undefined) exam.picks[k] = null;
        await finishExam();
      }
      return true;
    case 'exam-again':
      exam = { phase: 'setup', n: exam?.n ?? 20 };
      ctx.rerender();
      return true;
    case 'article':
      await openArticle(el.dataset.t || 'ce', el.dataset.n);
      return true;
    case 'cards-start':
      await startCards('ce');
      return true;
    case 'card-flip':
      cards.flipped = !cards.flipped;
      ctx.rerender();
      return true;
    case 'card-next':
      if (el.dataset.know === '1') cards.known += 1;
      else cards.review += 1;
      cards.i += 1;
      cards.flipped = false;
      ctx.rerender();
      return true;
    case 'cards-again':
      await startCards(cards?.temaId ?? 'ce');
      return true;
    case 'game-pairs':
      startPairs();
      return true;
    case 'pair-l':
      await pairClick('l', el.dataset.id);
      return true;
    case 'pair-r':
      await pairClick('r', el.dataset.id);
      return true;
    case 'game-vf':
      startVf();
      return true;
    case 'vf-answer':
      await vfAnswer(el.dataset.v === '1');
      return true;
    case 'vf-next':
      await vfNext();
      return true;
    case 'wear':
      await wear(el.dataset.slot, el.dataset.id);
      return true;
    case 'claim':
      await claim(el.dataset.list, el.dataset.id);
      return true;
    default:
      return false;
  }
}

