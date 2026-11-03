(() => {
'use strict';

/* =====================================================================
   НАСТРОЙКИ — здесь меняются фотографии, подписи и послания.
   Фото кладутся в папку photos/. Можно от 6 до 10 штук: просто
   добавляй или удаляй строки в списке ниже.
   ===================================================================== */
const PHOTOS = [
  { src: 'photos/photo1.jpg', cap: 'Даже когда ты просто дурачишься — ты моя любимая 💗',
    msg: 'На этой фотографии ты такая настоящая. Мне нравится каждая твоя улыбка, каждая смешная гримаса и вообще всё, что делает тебя тобой. Хочу видеть тебя счастливой как можно чаще.' },
  { src: 'photos/photo2.jpg', cap: 'Самое уютное место — рядом с тобой',
    msg: 'Мне нравится быть рядом с тобой вот так — без повода и без планов. Просто обнимать тебя, целовать и чувствовать, что сейчас всё именно так, как должно быть.' },
  { src: 'photos/photo3.jpg', cap: 'Наши маленькие моменты — моё большое счастье',
    msg: 'Обожаю, что с тобой можно быть смешными, нелепыми и абсолютно собой. Из таких простых мгновений и складывается то, что я так сильно ценю.' },
  { src: 'photos/photo4.jpg', cap: 'Хочу, чтобы таких тихих вечеров было ещё миллион',
    msg: 'Даже когда мы просто лежим рядом и ничего особенного не происходит, мне хорошо. Спасибо, что ты есть в моей жизни. Я очень-очень тебя люблю. ❤️' }
];
const MUSIC_SRC = 'audio/music.mp3';   // фоновая музыка (необязательно)
const SFX_SRC = { click: 'audio/click.mp3', open: 'audio/open.mp3' };

/* ===================================================================== */
const $ = s => document.querySelector(s);
const rnd = (a, b) => a + Math.random() * (b - a);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const store = {
  get(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }
};

/* ---------- спрайты сердечек и звёздочек (рисуются один раз) ---------- */
const COLORS = ['#ff8fb8', '#F8BFD8', '#DCCBFF', '#ffffff', '#ff9fc4', '#c9b2ff'];
function sprite(draw) { const c = document.createElement('canvas'); c.width = c.height = 80; draw(c.getContext('2d')); return c; }
function heartSprite(col, glow) {
  return sprite(g => {
    g.translate(8, 8); g.fillStyle = col;
    if (glow) { g.shadowColor = col; g.shadowBlur = 10; }
    g.beginPath(); g.moveTo(32, 56);
    g.bezierCurveTo(4, 36, 6, 10, 22, 10); g.bezierCurveTo(28, 10, 32, 15, 32, 20);
    g.bezierCurveTo(32, 15, 36, 10, 42, 10); g.bezierCurveTo(58, 10, 60, 36, 32, 56); g.fill();
  });
}
const HS = COLORS.map(c => heartSprite(c, false));
const HG = COLORS.map(c => heartSprite(c, true));
const STAR = sprite(g => {
  g.translate(8, 8); g.fillStyle = '#fff'; g.shadowColor = '#DCCBFF'; g.shadowBlur = 10;
  g.beginPath(); g.moveTo(32, 6); g.quadraticCurveTo(34, 30, 58, 32); g.quadraticCurveTo(34, 34, 32, 58);
  g.quadraticCurveTo(30, 34, 6, 32); g.quadraticCurveTo(30, 30, 32, 6); g.fill();
});

/* ---------- FloatingHearts: система частиц на canvas ---------- */
class Hearts {
  constructor(cv, opt = {}) {
    this.cv = cv; this.cx = cv.getContext('2d'); this.P = [];
    this.amb = opt.ambient || 0; this.max = opt.max || 40;
    this.run = false; this.acc = 0; this.last = 0;
    this.tick = this.tick.bind(this);
    this.size(); addEventListener('resize', () => this.size());
  }
  size() {
    const r = this.cv.getBoundingClientRect();
    this.D = Math.min(window.devicePixelRatio || 1, 2);
    this.W = r.width || innerWidth; this.H = r.height || innerHeight;
    this.cv.width = Math.round(this.W * this.D); this.cv.height = Math.round(this.H * this.D);
  }
  add(o) {
    this.P.push(Object.assign({ x: 0, y: 0, vx: 0, vy: 0, g: 0, a: 1, s: 20, t: 0, l: 1, b: false, k: 0,
      r: rnd(0, 6.28), vr: 0, sf: 0, sw: 0, ph: rnd(0, 6.28) }, o));
  }
  spawn() {
    if (Math.random() < .2) {
      this.add({ i: STAR, k: 1, x: rnd(0, this.W), y: rnd(0, this.H), s: rnd(10, 20), a: .9, l: rnd(2.5, 4.5), vr: rnd(-.5, .5) });
    } else {
      const set = Math.random() < .35 ? HG : HS;
      this.add({ i: set[(Math.random() * set.length) | 0], x: rnd(0, this.W), y: this.H + 24,
        vy: -rnd(22, 55), s: rnd(14, 34), a: rnd(.35, .85), sf: rnd(.6, 1.4), sw: rnd(10, 26), vr: rnd(-1.2, 1.2) });
    }
  }
  burst(x, y, n) {
    if (reduce) n = Math.min(n, 12);
    for (let i = 0; i < n; i++) {
      const a = rnd(0, 6.28), sp = rnd(90, 440), k = Math.random();
      const set = k < .4 ? HG : HS;
      this.add({ i: k > .88 ? STAR : set[(Math.random() * set.length) | 0], x, y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 90, g: 260, s: rnd(12, 32), l: rnd(1.6, 3), b: true, vr: rnd(-3, 3) });
    }
    this.start();
  }
  start() { if (this.run) return; this.run = true; this.last = performance.now(); requestAnimationFrame(this.tick); }
  stop() { this.run = false; this.P.length = 0; this.cx.setTransform(1, 0, 0, 1, 0, 0); this.cx.clearRect(0, 0, this.cv.width, this.cv.height); }
  tick(n) {
    if (!this.run) return;
    const dt = Math.min((n - this.last) / 1000, .05); this.last = n;
    const { cx, D, H, P } = this, ambient = this.amb && !reduce;
    if (ambient) { this.acc += dt * this.amb; while (this.acc >= 1) { this.acc--; if (P.length < this.max) this.spawn(); } }
    cx.setTransform(1, 0, 0, 1, 0, 0); cx.clearRect(0, 0, this.cv.width, this.cv.height);
    for (let i = P.length - 1; i >= 0; i--) {
      const p = P[i]; p.t += dt;
      p.vy += p.g * dt; p.x += p.vx * dt + (p.b ? 0 : Math.sin(p.t * p.sf + p.ph) * p.sw * dt);
      p.y += p.vy * dt; p.r += p.vr * dt;
      let a;
      if (p.b) { if (p.t >= p.l || p.y > H + 60) { P.splice(i, 1); continue; } a = 1 - p.t / p.l; }
      else if (p.k === 1) { if (p.t >= p.l) { P.splice(i, 1); continue; } a = Math.sin(Math.PI * p.t / p.l) * (.6 + .4 * Math.sin(p.t * 5 + p.ph)); }
      else { if (p.y < -30) { P.splice(i, 1); continue; } a = Math.min(1, Math.max(0, p.y / (H * .3))) * Math.min(1, Math.max(0, (H + 24 - p.y) / 60)); }
      const c = Math.cos(p.r) * D, s = Math.sin(p.r) * D;
      cx.setTransform(c, s, -s, c, p.x * D, p.y * D);
      cx.globalAlpha = Math.max(0, a * p.a);
      cx.drawImage(p.i, -p.s / 2, -p.s / 2, p.s, p.s);
    }
    cx.globalAlpha = 1;
    if (!P.length && !ambient) { this.run = false; cx.setTransform(1, 0, 0, 1, 0, 0); cx.clearRect(0, 0, this.cv.width, this.cv.height); return; }
    requestAnimationFrame(this.tick);
  }
}
const bgHearts = new Hearts($('#bgfx'), { ambient: 1.5, max: innerWidth < 500 ? 24 : 44 });
const fx = new Hearts($('#fx'));
const modalHearts = new Hearts($('#mfx'), { ambient: 2, max: 22 });
if (!reduce) bgHearts.start();

/* ---------- Звук: mp3-файлы, а если их нет — мягкий синтез ---------- */
let ac = null, master = null, vol = parseFloat(store.get('vol')); if (isNaN(vol)) vol = .5;
let playing = false, bgmFailed = false, synthTimer = null, sg = null, nextT = 0, step = 0;
const bgm = new Audio(MUSIC_SRC); bgm.loop = true; bgm.preload = 'none'; bgm.volume = vol;
bgm.addEventListener('error', () => { bgmFailed = true; if (playing) startSynth(); });
const SFX = {};
Object.keys(SFX_SRC).forEach(k => { const a = new Audio(SFX_SRC[k]); a.preload = 'none'; a.volume = .22; SFX[k] = a; });
const soundOn = () => store.get('music') !== 'off';

function ctx() {
  if (ac) return ac;
  const A = window.AudioContext || window.webkitAudioContext; if (!A) return null;
  ac = new A(); master = ac.createGain(); master.gain.value = vol; master.connect(ac.destination); return ac;
}
function tone(f, s, d, type, v, f2, dest) {
  if (!ctx()) return;
  try {
    const t = ac.currentTime + s, o = ac.createOscillator(), g = ac.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(v, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + d);
    o.connect(g); g.connect(dest || ac.destination); o.start(t); o.stop(t + d + .05);
  } catch (e) {}
}
function synthSfx(name) {
  if (ctx() && ac.state !== 'running') ac.resume();
  if (name === 'click') tone(760, 0, .09, 'sine', .035, 1100);
  else { tone(520, 0, .25, 'sine', .05, 900); tone(1175, .08, .45, 'triangle', .025); }
}
function sfx(name) {
  if (!soundOn()) return;
  const a = SFX[name];
  try { a.currentTime = 0; const p = a.play(); if (p && p.catch) p.catch(() => synthSfx(name)); } catch (e) { synthSfx(name); }
}
/* мягкая колыбельная (запасной вариант, если нет audio/music.mp3) */
const CH = [[0, 4, 7, 12], [-5, -1, 2, 7], [-3, 0, 4, 9], [-7, -3, 0, 5]], ARP = [0, 1, 2, 3, 2, 1, 2, 1], SC = [0, 2, 4, 7, 9, 12, 14, 16], EIGHTH = 60 / 66 / 2;
const fq = s => 261.63 * Math.pow(2, s / 12);
function note(f, t, d, v, type, a) {
  const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f;
  g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(v, t + a); g.gain.exponentialRampToValueAtTime(.0001, t + d);
  o.connect(g); g.connect(sg); o.start(t); o.stop(t + d + .1);
}
function sched() {
  if (!ac || ac.state !== 'running' || !sg) return;
  while (nextT < ac.currentTime + .8) {
    const t = nextT, c = CH[(step >> 3) % 4], pos = step % 8;
    if (pos === 0) { note(fq(c[0] - 12), t, 3.8, .07, 'sine', .05); note(fq(c[1]), t, 3.8, .025, 'sine', .6); note(fq(c[2]), t, 3.8, .025, 'sine', .6); }
    note(fq(c[ARP[pos]] + 12), t, 1.1, .05, 'triangle', .01);
    if ((pos === 0 || pos === 4 || pos === 6) && Math.random() < .55) note(fq(SC[(Math.random() * SC.length) | 0] + 12), t, 1.6, .035, 'sine', .02);
    nextT += EIGHTH; step++;
  }
}
function startSynth() {
  if (synthTimer || !ctx()) return;
  sg = ac.createGain(); sg.gain.setValueAtTime(0, ac.currentTime); sg.gain.linearRampToValueAtTime(1, ac.currentTime + 4);
  const dl = ac.createDelay(1), fb = ac.createGain(), wet = ac.createGain();
  dl.delayTime.value = .45; fb.gain.value = .38; wet.gain.value = .5;
  sg.connect(master); sg.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(master);
  nextT = ac.currentTime + .2; synthTimer = setInterval(sched, 200);
}
function stopSynth() {
  if (!synthTimer) return;
  clearInterval(synthTimer); synthTimer = null;
  try { sg.gain.setTargetAtTime(0, ac.currentTime, .15); } catch (e) {}
}
const player = $('#player');
function playMusic() {
  playing = true; player.classList.add('on'); ctx();
  if (ac && ac.state !== 'running') ac.resume();
  if (bgmFailed) { startSynth(); return; }
  const p = bgm.play(); if (p && p.catch) p.catch(() => { bgmFailed = true; if (playing) startSynth(); });
}
function stopMusic() { playing = false; player.classList.remove('on'); bgm.pause(); stopSynth(); }
function setVol(v) {
  vol = v; store.set('vol', v); bgm.volume = v;
  if (master) master.gain.setTargetAtTime(v, ac.currentTime, .05);
}
$('#pvol').value = vol;
$('#pvol').addEventListener('input', e => setVol(+e.target.value));
$('#pbtn').addEventListener('click', () => {
  if (playing) { stopMusic(); store.set('music', 'off'); } else { store.set('music', 'on'); playMusic(); sfx('click'); }
});
document.addEventListener('visibilitychange', () => {
  if (!playing) return;
  if (document.hidden) { bgm.pause(); if (ac) ac.suspend(); }
  else { if (ac) ac.resume(); if (!bgmFailed) bgm.play().catch(() => {}); }
});

/* ---------- Блокировка прокрутки ---------- */
let introDone = false, modalOpen = false, surpriseOpen = false;
const syncLock = () => document.documentElement.classList.toggle('lock', !introDone || modalOpen || surpriseOpen);

/* ---------- Первый экран ---------- */
$('#openHeart').addEventListener('click', e => {
  const btn = e.currentTarget, r = btn.getBoundingClientRect();
  btn.classList.add('pressed');
  fx.burst(r.left + r.width / 2, r.top + r.height / 2, 130);
  setTimeout(() => fx.burst(innerWidth / 2, innerHeight / 2, 90), 250);
  sfx('open');
  if (soundOn()) playMusic();
  setTimeout(() => {
    $('#intro').classList.add('gone'); introDone = true; syncLock(); player.classList.add('show');
    if (!soundOn()) player.classList.remove('on');
  }, 700);
});

/* ---------- Галерея (PhotoGallery / PhotoCard) ---------- */
const gal = $('#gallery');
PHOTOS.forEach((p, i) => {
  const f = document.createElement('figure');
  f.className = 'pol'; f.tabIndex = 0; f.setAttribute('role', 'button'); f.setAttribute('aria-label', p.cap);
  f.style.setProperty('--rot', ((i % 2 ? 1 : -1) * (1 + (i % 3) * .6)).toFixed(1) + 'deg');
  f.style.setProperty('--glow', i % 2 ? '#DCCBFF' : '#F8BFD8');
  const ph = document.createElement('div'); ph.className = 'ph';
  ph.innerHTML = '<span>📷<br>Сюда — наше фото<small>' + p.src + '</small></span>';
  const img = new Image(); img.alt = p.cap; img.loading = 'lazy'; img.decoding = 'async';
  img.onerror = () => img.remove(); img.src = p.src; ph.appendChild(img);
  const cap = document.createElement('figcaption'); cap.textContent = p.cap;
  f.append(ph, cap);
  f.addEventListener('click', () => openModal(i));
  f.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(i); } });
  gal.appendChild(f);
});
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .15 });
  gal.querySelectorAll('.pol').forEach(el => io.observe(el));
} else gal.querySelectorAll('.pol').forEach(el => el.classList.add('in'));

/* ---------- Просмотр фото (PhotoModal) ---------- */
const modal = $('#modal'), mimg = $('#mimg'), mcard = $('#mcard');
let cur = 0;
function fill(i, anim) {
  cur = (i + PHOTOS.length) % PHOTOS.length;
  const p = PHOTOS[cur];
  mimg.style.display = ''; mimg.onerror = () => { mimg.style.display = 'none'; };
  mimg.alt = p.cap; mimg.src = p.src;
  $('#mhint').innerHTML = '📷<br>Сюда — наше фото<small>' + p.src + '</small>';
  $('#mcap').textContent = p.cap; $('#mmsg').textContent = p.msg;
  $('#mmsg').scrollTop = 0; $('#mcount').textContent = (cur + 1) + ' / ' + PHOTOS.length;
  if (anim) { mcard.classList.remove('swap'); void mcard.offsetWidth; mcard.classList.add('swap'); }
}
function openModal(i) {
  fill(i, false); modal.classList.add('open'); modal.setAttribute('aria-hidden', 'false');
  modalOpen = true; syncLock(); sfx('open');
  modalHearts.size(); modalHearts.start(); modalHearts.burst(innerWidth / 2, innerHeight * .4, 16);
  $('#mclose').focus({ preventScroll: true });
}
function closeModal() {
  if (!modalOpen) return;
  modal.classList.remove('open'); modal.setAttribute('aria-hidden', 'true');
  modalOpen = false; syncLock(); sfx('click');
  setTimeout(() => { if (!modalOpen) modalHearts.stop(); }, 500);
}
function go(d) { fill(cur + d, true); sfx('click'); modalHearts.burst(innerWidth / 2, innerHeight * .4, 8); }
$('#mclose').addEventListener('click', closeModal);
$('#mprev').addEventListener('click', () => go(-1));
$('#mnext').addEventListener('click', () => go(1));
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
let sx = 0, sy = 0;
modal.addEventListener('touchstart', e => { sx = e.changedTouches[0].clientX; sy = e.changedTouches[0].clientY; }, { passive: true });
modal.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
  if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) go(dx < 0 ? 1 : -1);
}, { passive: true });
addEventListener('keydown', e => {
  if (modalOpen) { if (e.key === 'Escape') closeModal(); else if (e.key === 'ArrowLeft') go(-1); else if (e.key === 'ArrowRight') go(1); }
  else if (surpriseOpen && e.key === 'Escape') closeSurprise();
});

/* ---------- Финальный сюрприз (FinalSurprise / LoveLetter) ---------- */
const sur = $('#surprise'); let surTimer = 0;
document.querySelectorAll('#letter .rv').forEach((el, i) => { el.style.transitionDelay = (1.3 + i * 1.15) + 's'; });
$('#secret').addEventListener('click', () => {
  surpriseOpen = true; syncLock(); sfx('open');
  sur.classList.remove('stage2'); sur.classList.add('show'); sur.setAttribute('aria-hidden', 'false');
  $('#letter').scrollTop = 0;
  fx.burst(innerWidth / 2, innerHeight / 2, 110);
  setTimeout(() => fx.burst(innerWidth / 2, innerHeight / 2, 70), 600);
  clearTimeout(surTimer);
  surTimer = setTimeout(() => { sur.classList.add('stage2'); sfx('open'); fx.burst(innerWidth / 2, innerHeight / 2, 140); }, 3000);
});
function closeSurprise() {
  clearTimeout(surTimer); sur.classList.remove('show', 'stage2'); sur.setAttribute('aria-hidden', 'true');
  surpriseOpen = false; syncLock(); $('#hugnote').classList.remove('on'); sfx('click');
}
$('#sclose').addEventListener('click', closeSurprise);
$('#hug').addEventListener('click', e => {
  const r = e.currentTarget.getBoundingClientRect();
  fx.burst(r.left + r.width / 2, r.top + r.height / 2, 100); sfx('open');
  $('#hugnote').classList.add('on');
  if (navigator.vibrate) { try { navigator.vibrate(30); } catch (err) {} }
});

/* ---------- Иконка для главного экрана iPhone ---------- */
try {
  const c = document.createElement('canvas'); c.width = c.height = 180; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 180, 180); gr.addColorStop(0, '#FFD6E7'); gr.addColorStop(1, '#DCCBFF');
  g.fillStyle = gr; g.fillRect(0, 0, 180, 180); g.drawImage(HS[0], 0, 0, 80, 80, 20, 24, 140, 140);
  const l = document.createElement('link'); l.rel = 'apple-touch-icon'; l.href = c.toDataURL('image/png'); document.head.appendChild(l);
} catch (e) {}
})();
