const DEFAULTS = { font: 'Roboto', size: 28, color: '#ffffff', bg: 0, bottom: 10, outline: true, noWatermark: true };
const FONTS = ['Roboto', 'Inter', 'Open Sans', 'Lato', 'Montserrat', 'Poppins', 'Noto Sans', 'Source Sans 3', 'Merriweather', 'Atkinson Hyperlegible'];
const $ = id => document.getElementById(id);
const inputs = [...document.querySelectorAll('input[id]')];
const font = $('font'), sheet = $('sheet'), scrim = $('scrim'), page = $('page'), list = $('fontList');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const read = el => el.type === 'checkbox' ? el.checked : el.type === 'range' ? +el.value : el.value;
const show = el => {
  const out = document.querySelector(`output[for=${el.id}]`);
  if (out) out.value = el.id === 'bg' ? `${Math.round(el.value * 100)}%` : el.id === 'size' ? `${el.value}px` : `${el.value}%`;
};
// Google Fonts answers 400 (no CORS header, so fetch rejects) for unknown families.
const fontExists = name => fetch(`https://fonts.googleapis.com/css2?family=${encodeURIComponent(name)}`).then(r => r.ok, () => false);
const customFont = Object.assign(document.createElement('link'), { rel: 'stylesheet' });
document.head.append(customFont);

let o;
function preview() {
  const s = $('sample').style;
  s.fontFamily = `"${o.font}", system-ui, sans-serif`;
  s.fontSize = `${o.size * 0.4}px`; // the preview is roughly 0.4× a player's width
  s.color = o.color;
  s.backgroundColor = `rgba(0,0,0,${o.bg})`;
  s.bottom = `${o.bottom}%`;
  s.textShadow = o.outline ? '0 0 2px #000, 0 0 2px #000, 0 0 2px #000' : 'none';
  $('fontValue').textContent = o.font;
  if (!FONTS.includes(o.font)) customFont.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(o.font)}&display=swap`;
  for (const b of list.querySelectorAll('button')) b.setAttribute('aria-pressed', b.textContent === o.font);
}
function fill() {
  for (const el of inputs) { el[el.type === 'checkbox' ? 'checked' : 'value'] = o[el.id]; show(el); }
  setFontValid(true);
  preview();
}
function save() { chrome.storage.local.set({ options: o }); preview(); }
function setFontValid(ok) {
  font.setCustomValidity(ok ? '' : 'Unknown Google Fonts family');
  $('fontError').hidden = ok;
}

for (const el of inputs) el.addEventListener('input', async () => {
  show(el);
  const v = read(el);
  if (el === font) {
    const ok = await fontExists(v);
    if (font.value !== v) return; // a newer keystroke owns the result
    setFontValid(ok);
    if (!ok) return; // keep the last good font on the page
  }
  o[el.id] = v;
  save();
});
font.addEventListener('keydown', e => e.key === 'Enter' && font.value === o.font && close());

list.append(...FONTS.map(name => {
  const li = document.createElement('li'), b = document.createElement('button');
  b.className = 'row press';
  b.textContent = name;
  b.style.fontFamily = `"${name}"`;
  b.addEventListener('click', () => { o.font = font.value = name; setFontValid(true); save(); close(); });
  li.append(b);
  return li;
}));

chrome.storage.local.get('options', ({ options }) => {
  o = { ...DEFAULTS, ...options };
  fill();
});

$('reset').addEventListener('click', () => { o = { ...DEFAULTS }; save(); fill(); });

// Spring in Apple's terms, mass 1: stiffness = (2π / response)², damping coefficient = 4π · dampingRatio / response.
// Re-targeting keeps the current value and velocity, so every animation can be grabbed or reversed mid-flight.
function createSpring(onFrame, eps) {
  const s = { x: 0, v: 0, target: 0, damping: 1, response: 0.3, raf: 0 };
  let last;
  const step = now => {
    const dt = Math.min(Math.max(now - last, 0) / 1000, 1 / 30);
    last = now;
    const k = (2 * Math.PI / s.response) ** 2, c = 4 * Math.PI * s.damping / s.response;
    for (let i = 0, h = dt / 8; i < 8; i++) { s.v += (-k * (s.x - s.target) - c * s.v) * h; s.x += s.v * h; }
    if (Math.abs(s.v) < eps * 2 && Math.abs(s.x - s.target) < eps) { s.x = s.target; s.v = 0; s.raf = 0; }
    else s.raf = requestAnimationFrame(step);
    onFrame();
  };
  s.to = (target, opts) => {
    Object.assign(s, opts, { target });
    if (!s.raf) { last = performance.now(); s.raf = requestAnimationFrame(step); }
  };
  s.stop = () => { cancelAnimationFrame(s.raf); s.raf = 0; s.v = 0; };
  s.set = x => { s.stop(); s.x = x; onFrame(); };
  return s;
}

// Apple's rubber-band and momentum projection (Designing Fluid Interfaces).
const rubberband = (over, dim, c = 0.55) => (over * dim * c) / (dim + c * Math.abs(over));
const project = (v, d = 0.998) => (v / 1000) * d / (1 - d);

let H = sheet.offsetHeight, shut = true, drag = null, dragged = false;
const pos = createSpring(render, 0.5);   // sheet translateY in px: 0 open, H closed
const fade = createSpring(render, 0.001); // sheet opacity, only animated under reduced motion
pos.x = H;
fade.x = 1;

function render() {
  const p = Math.max(0, Math.min(1, 1 - pos.x / H)) * fade.x;
  sheet.style.transform = `translateY(${pos.x}px)`;
  sheet.style.opacity = fade.x;
  scrim.style.opacity = p;
  page.style.transform = reduceMotion.matches || !p ? '' : `scale(${1 - 0.06 * p})`; // push the page back
  page.style.borderRadius = `${12 * p}px`;
  shut = !drag && ((pos.x >= H && !pos.raf) || (fade.x === 0 && !fade.raf));
  sheet.style.visibility = scrim.style.visibility = shut ? 'hidden' : 'visible';
  page.inert = !shut;
}
render();

function open() {
  H = sheet.offsetHeight;
  if (reduceMotion.matches) { pos.set(0); fade.to(1, { damping: 1, response: 0.2 }); }
  else {
    if (shut) pos.set(H);
    fade.set(1);
    pos.to(0, { damping: 1, response: 0.3 });
  }
  $('done').focus({ preventScroll: true });
}
// v is the release velocity when a gesture threw the sheet; a tap closes critically damped.
function close(v) {
  if (reduceMotion.matches) fade.to(0, { damping: 1, response: 0.2 });
  else pos.to(H, v === undefined ? { damping: 1, response: 0.3 } : { damping: 0.8, response: 0.3, v });
  $('fontRow').focus({ preventScroll: true });
}
$('fontRow').addEventListener('click', open);
$('done').addEventListener('click', () => close());
scrim.addEventListener('click', () => close());
addEventListener('keydown', e => e.key === 'Escape' && !shut && (e.preventDefault(), close()));

function grab(e) {
  pos.stop();
  Object.assign(drag, { live: true, y0: e.clientY, from: pos.x });
  sheet.setPointerCapture(e.pointerId);
}
sheet.addEventListener('pointerdown', e => {
  if (e.button || e.target.closest('input, a')) return;
  const scroller = e.target.closest('.list');
  if (scroller && scroller.scrollTop > 0) return; // let the list scroll; drag the sheet only from its top
  drag = { id: e.pointerId, y0: e.clientY, from: pos.x, live: false, hist: [[e.timeStamp, e.clientY]] };
  if (pos.raf) grab(e); // catching it mid-flight stops it under the pointer
});
sheet.addEventListener('pointermove', e => {
  if (drag?.id !== e.pointerId) return;
  drag.hist = [...drag.hist.filter(([t]) => e.timeStamp - t < 100), [e.timeStamp, e.clientY]];
  if (!drag.live) {
    if (Math.abs(e.clientY - drag.y0) < 10) return; // hysteresis: below this it's still a tap
    grab(e);
  }
  const y = drag.from + e.clientY - drag.y0;
  pos.set(y < 0 ? rubberband(y, H) : y);
});
function release(e) {
  if (drag?.id !== e.pointerId) return;
  const { live, hist } = drag;
  drag = null;
  if (!live) return render();
  dragged = true;
  setTimeout(() => dragged = false);
  const [t0, y0] = hist[0], [t1, y1] = hist.at(-1);
  const v = t1 > t0 ? (y1 - y0) / (t1 - t0) * 1000 : 0;
  if (pos.x + project(v) > H / 2) close(v);
  else if (reduceMotion.matches) pos.set(0);
  else pos.to(0, { damping: 0.8, response: 0.3, v });
}
sheet.addEventListener('pointerup', release);
sheet.addEventListener('pointercancel', release);
sheet.addEventListener('click', e => dragged && (e.stopPropagation(), e.preventDefault()), true);
