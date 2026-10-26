const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { USD_PER_INR, AIRPORTS, destinations, hotels, makePackage, searchFlights } = require('./data');

const PORT = process.env.PORT || 5000;
const SECRET = process.env.JWT_SECRET || 'wandermood-dev-secret-change-me';
const DB_FILE = path.join(__dirname, 'db.json');

/* ---------- tiny JSON "database" ---------- */
let db;
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const save = () => fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
const toUSD = (inr) => +(inr * USD_PER_INR).toFixed(2);

function seed() {
  const now = Date.now();
  const users = [
    { id: 'u-admin', name: 'Site Admin', email: 'admin@wandermood.in', password: bcrypt.hashSync('admin123', 8), role: 'admin', blocked: false, stamps: [], createdAt: new Date(now - 90 * 864e5).toISOString() },
    { id: 'u-demo', name: 'Aarav Sharma', email: 'user@wandermood.in', password: bcrypt.hashSync('user123', 8), role: 'user', blocked: false, stamps: ['goa', 'jaipur'], createdAt: new Date(now - 60 * 864e5).toISOString() },
    { id: 'u-meera', name: 'Meera Nair', email: 'meera@example.com', password: bcrypt.hashSync('meera123', 8), role: 'user', blocked: false, stamps: ['munnar'], createdAt: new Date(now - 40 * 864e5).toISOString() },
  ];
  const packages = destinations.map(makePackage);
  const bookings = [];
  const sample = ['goa', 'jaipur', 'munnar', 'leh', 'varanasi', 'andaman', 'manali', 'udaipur', 'agra', 'rishikesh'];
  sample.forEach((id, i) => {
    const pkg = packages.find((p) => p.destinationId === id);
    const u = users[1 + (i % 2)];
    const total = pkg.price * 2;
    bookings.push({
      id: uid() + i, userId: u.id, userName: u.name, type: 'package', refId: pkg.id, title: pkg.title,
      details: { travellers: 2, startDate: '2026-12-10' }, totalINR: total, totalUSD: toUSD(total),
      status: ['Confirmed', 'Pending', 'Confirmed', 'Cancelled'][i % 4], createdAt: new Date(now - (i * 11 + 2) * 864e5).toISOString(),
    });
  });
  const reviews = [
    ['goa', 'u-demo', 'Aarav Sharma', 5, 4, 5, 'Perfect mix of beaches and food. South Goa was calm, North Goa was lively.'],
    ['jaipur', 'u-meera', 'Meera Nair', 5, 4, 5, 'Amber Fort at sunrise was unreal. Book the guide early.'],
    ['munnar', 'u-meera', 'Meera Nair', 4, 5, 5, 'Misty mornings and the best tea. Roads are winding, so pack motion pills.'],
    ['varanasi', 'u-demo', 'Aarav Sharma', 4, 3, 5, 'The evening aarti is something you feel more than see.'],
  ].map((r) => ({ id: uid(), destinationId: r[0], userId: r[1], userName: r[2], ratings: { value: r[3], safety: r[4], scenery: r[5] }, comment: r[6], date: new Date().toISOString(), helpful: 2 }));
  return { users, packages, bookings, reviews, messages: [], itineraries: [] };
}
db = fs.existsSync(DB_FILE) ? JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) : (() => { const d = seed(); fs.writeFileSync(DB_FILE, JSON.stringify(d, null, 2)); return d; })();

/* ---------- app + auth helpers ---------- */
const app = express();
app.use(cors());
app.use(express.json());

const pub = (u) => ({ id: u.id, name: u.name, email: u.email, role: u.role, stamps: u.stamps, createdAt: u.createdAt, blocked: u.blocked });
const sign = (u) => jwt.sign({ id: u.id, role: u.role }, SECRET, { expiresIn: '7d' });
function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  try {
    const p = jwt.verify(token, SECRET);
    const user = db.users.find((u) => u.id === p.id);
    if (!user || user.blocked) return res.status(401).json({ error: 'Account unavailable' });
    req.user = user; next();
  } catch { res.status(401).json({ error: 'Please log in' }); }
}
const admin = (req, res, next) => (req.user.role === 'admin' ? next() : res.status(403).json({ error: 'Admins only' }));
const avg = (arr) => (arr.length ? +(arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1) : 0);
const ratingFor = (id) => {
  const rs = db.reviews.filter((r) => r.destinationId === id);
  return { rating: avg(rs.map((r) => (r.ratings.value + r.ratings.safety + r.ratings.scenery) / 3)), reviewCount: rs.length };
};

/* ---------- auth ---------- */
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 6) return res.status(400).json({ error: 'Name, email and a 6+ character password are required' });
  if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) return res.status(409).json({ error: 'Email already registered' });
  const user = { id: uid(), name, email, password: bcrypt.hashSync(password, 8), role: 'user', blocked: false, stamps: [], createdAt: new Date().toISOString() };
  db.users.push(user); save();
  res.json({ token: sign(user), user: pub(user) });
});
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = db.users.find((u) => u.email.toLowerCase() === (email || '').toLowerCase());
  if (!user || !bcrypt.compareSync(password || '', user.password)) return res.status(401).json({ error: 'Wrong email or password' });
  if (user.blocked) return res.status(403).json({ error: 'This account is blocked' });
  res.json({ token: sign(user), user: pub(user) });
});
app.get('/api/auth/me', auth, (req, res) => res.json(pub(req.user)));

/* ---------- catalogue ---------- */
app.get('/api/config', (_, res) => res.json({ usdPerInr: USD_PER_INR, airports: AIRPORTS, moods: [...new Set(destinations.flatMap((d) => d.moods))].sort() }));

app.get('/api/destinations', (req, res) => {
  const { q = '', mood, maxPrice, days, sort } = req.query;
  let list = destinations.map((d) => ({ ...d, ...ratingFor(d.id) }));
  if (q) list = list.filter((d) => (d.name + d.state + d.blurb).toLowerCase().includes(q.toLowerCase()));
  if (mood) list = list.filter((d) => d.moods.includes(mood));
  if (maxPrice) list = list.filter((d) => d.fromPrice <= Number(maxPrice));
  if (days) list = list.filter((d) => d.days <= Number(days));
  const sorters = { priceAsc: (a, b) => a.fromPrice - b.fromPrice, priceDesc: (a, b) => b.fromPrice - a.fromPrice, rating: (a, b) => b.rating - a.rating, name: (a, b) => a.name.localeCompare(b.name) };
  if (sorters[sort]) list.sort(sorters[sort]);
  res.json(list);
});
app.get('/api/destinations/:id', (req, res) => {
  const d = destinations.find((x) => x.id === req.params.id);
  if (!d) return res.status(404).json({ error: 'Destination not found' });
  res.json({ ...d, ...ratingFor(d.id), packages: db.packages.filter((p) => p.destinationId === d.id), hotels: hotels.filter((h) => h.destinationId === d.id) });
});
app.get('/api/packages', (_, res) => res.json(db.packages));
app.get('/api/packages/:id', (req, res) => {
  const p = db.packages.find((x) => x.id === req.params.id);
  p ? res.json({ ...p, destination: destinations.find((d) => d.id === p.destinationId) }) : res.status(404).json({ error: 'Package not found' });
});
app.get('/api/hotels', (req, res) => {
  const { destinationId, tier } = req.query;
  res.json(hotels.filter((h) => (!destinationId || h.destinationId === destinationId) && (!tier || h.tier === tier)));
});
app.get('/api/flights/search', (req, res) => {
  const { from, to, date } = req.query;
  res.json(searchFlights(from, to, date || new Date().toISOString().slice(0, 10)));
});

/* ---------- reviews ---------- */
app.get('/api/reviews/:destinationId', (req, res) => res.json(db.reviews.filter((r) => r.destinationId === req.params.destinationId).sort((a, b) => b.helpful - a.helpful)));
app.post('/api/reviews', auth, (req, res) => {
  const { destinationId, ratings, comment } = req.body;
  if (!destinations.some((d) => d.id === destinationId) || !ratings || !comment) return res.status(400).json({ error: 'Rating and comment required' });
  const r = { id: uid(), destinationId, userId: req.user.id, userName: req.user.name, ratings, comment, date: new Date().toISOString(), helpful: 0 };
  db.reviews.push(r); save(); res.json(r);
});
app.post('/api/reviews/:id/helpful', (req, res) => {
  const r = db.reviews.find((x) => x.id === req.params.id);
  if (r) { r.helpful++; save(); }
  res.json(r || {});
});

/* ---------- bookings ---------- */
function priceItem(item) {
  const { type, refId } = item;
  if (type === 'package') {
    const p = db.packages.find((x) => x.id === refId); if (!p) return null;
    const n = Number(item.travellers) || 1;
    return { title: p.title, total: p.price * n, details: { travellers: n, startDate: item.startDate } };
  }
  if (type === 'hotel') {
    const h = hotels.find((x) => x.id === refId); if (!h) return null;
    const nights = Math.max(1, Number(item.nights) || 1), rooms = Math.max(1, Number(item.rooms) || 1);
    return { title: `${h.name} (${nights} night${nights > 1 ? 's' : ''})`, total: h.pricePerNight * nights * rooms, details: { nights, rooms, checkIn: item.checkIn, guests: item.guests } };
  }
  if (type === 'flight') {
    const [from, to, date] = refId.split('-');
    const f = searchFlights(from, to, refId.split('-').slice(2, 5).join('-')).find((x) => x.id === refId); if (!f) return null;
    const n = Number(item.travellers) || 1;
    return { title: `${f.airline} ${f.flightNo}: ${f.fromCity} to ${f.toCity}`, total: f.price * n, details: { travellers: n, date: f.date, departure: f.departure } };
  }
  return null;
}
app.post('/api/bookings', auth, (req, res) => {
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  const created = [];
  for (const it of items) {
    const priced = priceItem(it);
    if (!priced) continue;
    const b = { id: uid(), userId: req.user.id, userName: req.user.name, type: it.type, refId: it.refId, title: priced.title, details: priced.details,
      totalINR: priced.total, totalUSD: toUSD(priced.total), status: 'Confirmed', paymentMethod: req.body.paymentMethod || 'card', createdAt: new Date().toISOString() };
    db.bookings.push(b); created.push(b);
    const pkg = db.packages.find((p) => p.id === it.refId);
    const stamp = pkg ? pkg.destinationId : (hotels.find((h) => h.id === it.refId) || {}).destinationId;
    if (stamp && !req.user.stamps.includes(stamp)) req.user.stamps.push(stamp);
  }
  if (!created.length) return res.status(400).json({ error: 'Nothing to book' });
  save(); res.json({ bookings: created, totalINR: created.reduce((a, b) => a + b.totalINR, 0), totalUSD: toUSD(created.reduce((a, b) => a + b.totalINR, 0)) });
});
app.get('/api/bookings/mine', auth, (req, res) => res.json(db.bookings.filter((b) => b.userId === req.user.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt))));
app.patch('/api/bookings/:id/cancel', auth, (req, res) => {
  const b = db.bookings.find((x) => x.id === req.params.id && x.userId === req.user.id);
  if (!b) return res.status(404).json({ error: 'Booking not found' });
  b.status = 'Cancelled'; save(); res.json(b);
});

/* ---------- itineraries, contact ---------- */
app.post('/api/itineraries', (req, res) => {
  const it = { id: uid(), title: req.body.title || 'My trip', days: req.body.days || [], createdAt: new Date().toISOString() };
  db.itineraries.push(it); save(); res.json(it);
});
app.get('/api/itineraries/:id', (req, res) => {
  const it = db.itineraries.find((x) => x.id === req.params.id);
  it ? res.json(it) : res.status(404).json({ error: 'Itinerary not found' });
});
app.post('/api/contact', (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !/^\S+@\S+\.\S+$/.test(email || '') || !message) return res.status(400).json({ error: 'Name, valid email and message are required' });
  db.messages.push({ id: uid(), name, email, subject: subject || '(no subject)', message, createdAt: new Date().toISOString(), read: false });
  save(); res.json({ ok: true });
});

/* ---------- admin ---------- */
const A = express.Router();
A.use(auth, admin);
A.get('/stats', (_, res) => {
  const live = db.bookings.filter((b) => b.status !== 'Cancelled');
  const byMonth = {};
  live.forEach((b) => { const k = b.createdAt.slice(0, 7); byMonth[k] = byMonth[k] || { month: k, bookings: 0, revenueINR: 0 }; byMonth[k].bookings++; byMonth[k].revenueINR += b.totalINR; });
  const byType = {}; live.forEach((b) => { byType[b.type] = (byType[b.type] || 0) + 1; });
  const revenueINR = live.reduce((a, b) => a + b.totalINR, 0);
  res.json({ users: db.users.length, bookings: db.bookings.length, packages: db.packages.length, messages: db.messages.length, revenueINR, revenueUSD: toUSD(revenueINR),
    months: Object.values(byMonth).sort((a, b) => a.month.localeCompare(b.month)), byType });
});
A.get('/users', (_, res) => res.json(db.users.map(pub)));
A.patch('/users/:id/block', (req, res) => {
  const u = db.users.find((x) => x.id === req.params.id);
  if (!u || u.role === 'admin') return res.status(400).json({ error: 'Cannot change this user' });
  u.blocked = !u.blocked; save(); res.json(pub(u));
});
A.delete('/users/:id', (req, res) => {
  const u = db.users.find((x) => x.id === req.params.id);
  if (!u || u.role === 'admin') return res.status(400).json({ error: 'Cannot delete this user' });
  db.users = db.users.filter((x) => x.id !== u.id); save(); res.json({ ok: true });
});
A.get('/bookings', (_, res) => res.json([...db.bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt))));
A.patch('/bookings/:id', (req, res) => {
  const b = db.bookings.find((x) => x.id === req.params.id);
  if (!b || !['Pending', 'Confirmed', 'Cancelled'].includes(req.body.status)) return res.status(400).json({ error: 'Invalid request' });
  b.status = req.body.status; save(); res.json(b);
});
A.post('/packages', (req, res) => {
  const d = destinations.find((x) => x.id === req.body.destinationId);
  if (!d || !req.body.title || !(Number(req.body.price) > 0)) return res.status(400).json({ error: 'Destination, title and price are required' });
  const base = makePackage(d);
  const p = { ...base, id: 'pkg-' + uid(), title: req.body.title, price: Number(req.body.price), days: Number(req.body.days) || base.days, summary: req.body.summary || base.summary };
  db.packages.push(p); save(); res.json(p);
});
A.put('/packages/:id', (req, res) => {
  const p = db.packages.find((x) => x.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  ['title', 'summary'].forEach((k) => { if (req.body[k]) p[k] = req.body[k]; });
  if (req.body.price) p.price = Number(req.body.price);
  if (req.body.days) p.days = Number(req.body.days);
  save(); res.json(p);
});
A.delete('/packages/:id', (req, res) => { db.packages = db.packages.filter((x) => x.id !== req.params.id); save(); res.json({ ok: true }); });
A.get('/messages', (_, res) => res.json([...db.messages].reverse()));
A.delete('/messages/:id', (req, res) => { db.messages = db.messages.filter((x) => x.id !== req.params.id); save(); res.json({ ok: true }); });
app.use('/api/admin', A);

/* ---------- serve built React app in production ---------- */
const dist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^\/(?!api).*/, (_, res) => res.sendFile(path.join(dist, 'index.html')));
}
app.listen(PORT, () => console.log(`WanderMood API running on http://localhost:${PORT}`));
