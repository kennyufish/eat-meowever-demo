'use strict';
// EatMeowever demo: pick a spot, a distance and a kind of food, and the cat draws one place at random.
// Everything runs here; the only requests are for the data tiles on this site and, after a draw, the map.

const $ = id => document.getElementById(id);
const CA = { south: 32.5, north: 42.1, west: -124.5, east: -114.1 };
const MILES = [1, 3, 5, 10];
const CITIES = [
  ['Los Angeles', 34.0522, -118.2437], ['San Francisco', 37.7749, -122.4194], ['San Diego', 32.7157, -117.1611],
  ['San Jose', 37.3382, -121.8863], ['Sacramento', 38.5816, -121.4944], ['Oakland', 37.8044, -122.2712],
  ['Berkeley', 37.8715, -122.273], ['Palo Alto', 37.4419, -122.143], ['Fresno', 36.7378, -119.7871],
  ['Long Beach', 33.7701, -118.1937], ['Irvine', 33.6846, -117.8265], ['Pasadena', 34.1478, -118.1445],
  ['San Gabriel', 34.0961, -118.1058], ['Santa Monica', 34.0195, -118.4912], ['Riverside', 33.9806, -117.3755],
  ['Bakersfield', 35.3733, -119.0187], ['Santa Barbara', 34.4208, -119.6982], ['Santa Cruz', 36.9741, -122.0308],
  ['Monterey', 36.6002, -121.8947], ['Davis', 38.5449, -121.7405],
];
// Kinds match Overture's taxonomy.primary values (chinese_restaurant, sushi_restaurant, ...).
const KINDS = [
  ['Anything', /./],
  ['Chinese', /chinese|dim_sum|taiwanese|cantonese|szechuan|sichuan|hot_pot|shanghai|dumpling|hong_kong/],
  ['Japanese', /japanese|sushi|ramen|izakaya|udon|poke/],
  ['Korean', /korean/],
  ['Southeast Asian', /thai|vietnamese|filipino|malaysian|indonesian|burmese|cambodian|laotian|singaporean/],
  ['Indian', /indian|pakistani|nepal|sri_lankan|himalayan|bangladeshi/],
  ['Mexican & Latin', /mexican|taco|texmex|salvadoran|latin|peruvian|brazilian|cuban|colombian|caribbean|guatemalan|argentin|venezuelan/],
  ['Pizza & Italian', /pizza|italian/],
  ['American', /american|burger|diner|barbecue|chicken|hot_dog|steak|sandwich|deli|southern|soul|cajun|grill|breakfast|pancake|bagel|fast_food/],
  ['Mediterranean', /mediterranean|greek|middle_eastern|persian|halal|kebab|lebanese|turkish|afghan|falafel/],
  ['Coffee & sweets', /coffee|cafe|bakery|ice_cream|donut|dessert|frozen_yogurt|cupcake|gelato|candy|chocolat|shaved_ice|tea|boba|juice|smoothie/],
  ['Bars', /^(?!salad|sushi|juice|smoothie|oyster).*(bar|pub)$|brewery|lounge/],
];
const LINES = ['Mrrp! Pick a spot first.', 'Purr…', 'Hungry yet?', 'Mew!', 'I would choose fish.'];

const state = { at: null, miles: 3, kind: 0, meta: null, recent: [] };
const tiles = new Map();
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Great-circle distance in miles. */
function miles(a, b) {
  const r = Math.PI / 180, dLat = (b.y - a.y) * r, dLon = (b.x - a.x) * r;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.y * r) * Math.cos(b.y * r) * Math.sin(dLon / 2) ** 2;
  return 7917.6 * Math.asin(Math.sqrt(h));
}
console.assert(Math.abs(miles({ y: 34.0522, x: -118.2437 }, { y: 37.7749, x: -122.4194 }) - 347) < 3, 'LA to SF is about 347 miles');

/** Loads the tiles that cover the circle; tiles with no places are not in meta.tiles and are skipped. */
async function placesAround(at, radius) {
  const { latStep, lonStep } = state.meta, have = new Set(state.meta.tiles);
  const dLat = radius / 69, dLon = radius / (69 * Math.cos(at.y * Math.PI / 180));
  const keys = [];
  for (let i = Math.floor((at.y - dLat) / latStep); i <= Math.floor((at.y + dLat) / latStep); i++)
    for (let j = Math.floor((at.x - dLon) / lonStep); j <= Math.floor((at.x + dLon) / lonStep); j++)
      if (have.has(`${i}_${j}`)) keys.push(`${i}_${j}`);
  const results = await Promise.allSettled(keys.map(key => {
    if (!tiles.has(key)) tiles.set(key, fetch(`data/t/${key}.json`).then(r => r.ok ? r.json() : Promise.reject(r.status)).catch(e => { tiles.delete(key); throw e; }));
    return tiles.get(key);
  }));
  // A few missing tiles still leave a usable draw; the next call retries them.
  if (keys.length && results.every(r => r.status === 'rejected')) throw results[0].reason;
  return results.flatMap(r => r.value ?? []).map(p => ({ ...p, d: miles(at, p) })).filter(p => p.d <= radius);
}

function setAt(at, label) {
  state.at = at;
  $('where').textContent = `Drawing near ${label}. Your location stays in this browser.`;
  $('draw').disabled = false;
  refreshCount();
}

async function refreshCount() {
  if (!state.at || !state.meta) return;
  try {
    const n = (await placesAround(state.at, state.miles)).filter(p => KINDS[state.kind][1].test(p.c)).length;
    $('count').textContent = n ? `${n.toLocaleString()} places in the hat.` : 'No places match. Try a longer distance or another kind.';
  } catch { $('count').textContent = 'Could not load places. Check your connection and try again.'; }
}

function locate() {
  if (!navigator.geolocation) { $('where').textContent = 'This browser cannot share a location. Pick a city instead.'; return; }
  $('where').textContent = 'Asking for your location…';
  navigator.geolocation.getCurrentPosition(({ coords }) => {
    const at = { y: coords.latitude, x: coords.longitude };
    if (at.y < CA.south || at.y > CA.north || at.x < CA.west || at.x > CA.east) {
      $('where').textContent = 'You seem to be outside California, and this demo only covers California. Pick a city instead.';
      return;
    }
    setAt(at, 'you');
  }, () => {
    $('where').textContent = 'No location (denied or timed out). Pick a city instead.';
  }, { timeout: 12000, maximumAge: 300000 });
}

function chips(box, labels, pick, chosen) {
  labels.forEach((label, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = label; b.setAttribute('aria-pressed', String(i === chosen));
    b.onclick = () => { [...box.children].forEach((c, j) => c.setAttribute('aria-pressed', String(j === i))); pick(i); refreshCount(); };
    box.append(b);
  });
}

/* The cat: blinks, follows the pointer, hops on a draw. */
const cat = $('cat'), svg = cat.querySelector('svg');
function mood(name, ms) { cat.classList.remove('happy', 'perk', 'droop', 'tap'); if (name) { cat.classList.add(name); if (ms) setTimeout(() => cat.classList.remove(name), ms); } }
function hop(h) { if (!reduced()) svg.animate([{ transform: 'none' }, { transform: 'scale(1.14,.82)', offset: .18 }, { transform: `translateY(-${h}px) scale(.94,1.08)`, offset: .5 }, { transform: 'scale(1.06,.94)', offset: .82 }, { transform: 'none' }], { duration: 560, easing: 'ease-out' }); }
function say(line) { $('say').textContent = line; }
(function catLife() {
  const eyes = svg.querySelector('.eyes');
  const blink = () => { if (!document.hidden && Math.random() < .85) { svg.classList.add('blinking'); setTimeout(() => svg.classList.remove('blinking'), 130); } setTimeout(blink, 1800 + Math.random() * 3000); };
  setTimeout(blink, 1800);
  let frame = 0, px = 0, py = 0;
  addEventListener('pointermove', e => {
    px = e.clientX; py = e.clientY;
    frame ||= requestAnimationFrame(() => {
      frame = 0;
      const box = svg.getBoundingClientRect(), dx = px - (box.left + box.width * .5), dy = py - (box.top + box.height * .64), d = Math.hypot(dx, dy) || 1, reach = Math.min(1, d / 140);
      eyes.setAttribute('transform', `translate(${(dx / d * 3.4 * reach).toFixed(2)} ${(dy / d * 2.6 * reach).toFixed(2)})`);
    });
  }, { passive: true });
  cat.onclick = () => { say(LINES[Math.floor(Math.random() * LINES.length)]); mood('happy', 1200); hop(10); };
})();

const googleUrl = p => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([p.n, p.a].filter(Boolean).join(' '))}`;
const appleUrl = p => `https://maps.apple.com/place?name=${encodeURIComponent(p.n)}&coordinate=${p.y},${p.x}`;
const embedUrl = p => `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(window.EMBED_KEY)}&q=${encodeURIComponent(p.a ? `${p.n}, ${p.a}` : `${p.y},${p.x}`)}`;

async function draw() {
  const button = $('draw');
  button.disabled = true;
  try {
    const pool = (await placesAround(state.at, state.miles)).filter(p => KINDS[state.kind][1].test(p.c));
    if (!pool.length) { mood('droop', 1500); say('Nothing here… try farther?'); return; }
    // Skip the last few picks while there is anything else to pick.
    const fresh = pool.filter(p => !state.recent.includes(p.i));
    const choices = fresh.length ? fresh : pool;
    const pick = choices[Math.floor(Math.random() * choices.length)];
    state.recent = [pick.i, ...state.recent].slice(0, 5);

    const ticket = $('ticket'), name = $('t-name');
    ticket.hidden = false; $('t-map').hidden = true;
    mood('tap'); say('Drawing…');
    // A short shuffle of other names, like the app's odometer, then the pick.
    if (!reduced()) for (let k = 0; k < 9; k++) { name.textContent = choices[Math.floor(Math.random() * choices.length)].n; await new Promise(r => setTimeout(r, 40 + k * 12)); }
    name.textContent = pick.n;
    $('t-kind').textContent = (pick.c || 'restaurant').replaceAll('_', ' ');
    $('t-addr').textContent = pick.a || 'No street address in the data';
    $('t-dist').textContent = `${pick.d < .1 ? 'Under 0.1' : pick.d.toFixed(1)} mi away`;
    $('t-google').href = googleUrl(pick); $('t-apple').href = appleUrl(pick);
    if (window.EMBED_KEY) { $('t-map').src = embedUrl(pick); $('t-map').hidden = false; }
    ticket.classList.remove('printing'); void ticket.offsetWidth; ticket.classList.add('printing');
    mood('happy', 1400); hop(12); say('This one!');
    ticket.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
  } catch {
    mood('droop', 1500); say('Could not load places. Try again?');
  } finally {
    button.disabled = false; button.textContent = 'Draw again';
  }
}

chips($('miles'), MILES.map(m => `${m} mi`), i => { state.miles = MILES[i]; }, MILES.indexOf(state.miles));
chips($('kinds'), KINDS.map(k => k[0]), i => { state.kind = i; }, 0);
for (const [name] of CITIES) $('city').add(new Option(name, name));
$('city').onchange = e => { const c = CITIES.find(c => c[0] === e.target.value); if (c) setAt({ y: c[1], x: c[2] }, c[0]); };
$('locate').onclick = locate;
$('draw').onclick = draw;
fetch('data/meta.json').then(r => r.json()).then(meta => {
  state.meta = meta;
  $('release').textContent = `release ${meta.release}, ${meta.places.toLocaleString()} places`;
  refreshCount();
}).catch(() => { $('where').textContent = 'Could not load the place list. Reload to try again.'; });
