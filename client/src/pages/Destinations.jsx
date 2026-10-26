import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api.js';
import { useApp } from '../context.jsx';
import { DestCard, Img, Lightbox, MOOD_COLORS, PageHead, Stars, Vibe, Money } from '../components.jsx';

export function Destinations() {
  const { config, money } = useApp();
  const [sp] = useSearchParams();
  const [f, setF] = useState({ q: sp.get('q') || '', mood: sp.get('mood') || '', maxPrice: 50000, days: 7, sort: 'rating' });
  const [list, setList] = useState(null);
  useEffect(() => {
    const t = setTimeout(() => {
      const qs = new URLSearchParams({ q: f.q, maxPrice: f.maxPrice, days: f.days, sort: f.sort, ...(f.mood ? { mood: f.mood } : {}) });
      api('/destinations?' + qs).then(setList).catch(() => setList([]));
    }, 200);
    return () => clearTimeout(t);
  }, [f]);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  return (
    <>
      <PageHead title="Find your destination" sub="Filter by mood, budget and trip length." />
      <div className="wrap section split">
        <aside className="card filters">
          <div className="field"><label htmlFor="q">Search</label><input id="q" value={f.q} onChange={(e) => set('q', e.target.value)} placeholder="Goa, Kerala, Himalaya…" /></div>
          <div className="field"><label>Mood</label>
            <div className="row" style={{ gap: 6 }}>
              <button className={'chip' + (!f.mood ? ' on' : '')} onClick={() => set('mood', '')}>All</button>
              {config.moods.map((m) => <button key={m} className={'chip' + (f.mood === m ? ' on' : '')} style={f.mood === m ? { background: MOOD_COLORS[m], borderColor: MOOD_COLORS[m] } : {}} onClick={() => set('mood', m)}>{m}</button>)}
            </div>
          </div>
          <div className="field"><label htmlFor="bud">Budget per person: up to {money(f.maxPrice)}</label><input id="bud" type="range" min="10000" max="50000" step="500" value={f.maxPrice} onChange={(e) => set('maxPrice', e.target.value)} /></div>
          <div className="field"><label htmlFor="days">Trip length: up to {f.days} days</label><input id="days" type="range" min="3" max="7" value={f.days} onChange={(e) => set('days', e.target.value)} /></div>
          <div className="field"><label htmlFor="sort">Sort by</label>
            <select id="sort" value={f.sort} onChange={(e) => set('sort', e.target.value)}>
              <option value="rating">Top rated</option><option value="priceAsc">Price: low to high</option><option value="priceDesc">Price: high to low</option><option value="name">Name A to Z</option>
            </select>
          </div>
          <button className="btn ghost sm" onClick={() => setF({ q: '', mood: '', maxPrice: 50000, days: 7, sort: 'rating' })}>Reset filters</button>
        </aside>
        <div>
          <p className="muted" style={{ marginBottom: 14 }}>{list ? `${list.length} destinations` : 'Loading…'}</p>
          {list && !list.length && <div className="card center"><h3>No match yet</h3><p className="muted">Raise the budget or clear the mood filter to see more places.</p></div>}
          <div className="grid g3">{list ? list.map((d) => <DestCard key={d.id} d={d} />) : [1, 2, 3, 4].map((i) => <div key={i} className="skeleton" />)}</div>
        </div>
      </div>
    </>
  );
}

function Reviews({ id }) {
  const { user, toast } = useApp();
  const [rs, setRs] = useState([]);
  const [form, setForm] = useState({ value: 5, safety: 5, scenery: 5, comment: '' });
  const load = () => api('/reviews/' + id).then(setRs);
  useEffect(() => { load(); }, [id]);
  const avg = (k) => (rs.length ? rs.reduce((a, r) => a + r.ratings[k], 0) / rs.length : 0);
  const submit = async (e) => {
    e.preventDefault();
    try { await api('/reviews', { method: 'POST', body: { destinationId: id, ratings: { value: +form.value, safety: +form.safety, scenery: +form.scenery }, comment: form.comment } }); toast('Thanks for your review'); setForm({ ...form, comment: '' }); load(); }
    catch (er) { toast(er.message, 'bad'); }
  };
  return (
    <section>
      <h2 style={{ margin: '36px 0 14px' }}>Reviews and ratings</h2>
      <div className="grid g2">
        <div className="card bars">
          {['value', 'safety', 'scenery'].map((k) => <div key={k}><span style={{ textTransform: 'capitalize' }}>{k}</span><span className="vibe"><span className="bar" style={{ display: 'block', height: 9, background: 'var(--mist)', borderRadius: 9 }}><i style={{ display: 'block', height: '100%', width: avg(k) * 20 + '%', background: 'var(--marigold)', borderRadius: 9 }} /></span></span><b>{avg(k).toFixed(1)}</b></div>)}
          <p className="muted small" style={{ marginTop: 8 }}>{rs.length} traveller review{rs.length !== 1 && 's'}</p>
        </div>
        {user ? (
          <form className="card" onSubmit={submit}>
            <div className="row">{['value', 'safety', 'scenery'].map((k) => <div key={k} style={{ flex: 1, minWidth: 90 }}><label style={{ textTransform: 'capitalize' }}>{k}</label><select value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} ★</option>)}</select></div>)}</div>
            <div className="field" style={{ marginTop: 12 }}><label htmlFor="rc">Your experience</label><textarea id="rc" rows="3" required value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} /></div>
            <button className="btn sm">Post review</button>
          </form>
        ) : <div className="card"><p>Log in to rate this place.</p><Link className="btn sm" style={{ marginTop: 10 }} to="/login">Log in</Link></div>}
      </div>
      <div className="grid" style={{ marginTop: 18, gap: 12 }}>
        {rs.map((r) => (
          <div className="card" key={r.id}>
            <div className="row between"><b>{r.userName}</b><Stars value={(r.ratings.value + r.ratings.safety + r.ratings.scenery) / 3} /></div>
            <p style={{ margin: '6px 0' }}>{r.comment}</p>
            <button className="chip" onClick={() => api(`/reviews/${r.id}/helpful`, { method: 'POST' }).then(load)}>👍 Helpful ({r.helpful})</button>
          </div>
        ))}
      </div>
    </section>
  );
}

export function DestinationDetail() {
  const { id } = useParams();
  const [d, setD] = useState(null);
  const [lb, setLb] = useState(null);
  const { money, other } = useApp();
  useEffect(() => { setD(null); api('/destinations/' + id).then(setD).catch(() => setD(false)); }, [id]);
  if (d === false) return <div className="wrap section center"><h2>Destination not found</h2><Link to="/destinations" className="btn" style={{ marginTop: 14 }}>Back to destinations</Link></div>;
  if (!d) return <div className="wrap section"><div className="skeleton" /></div>;
  const shots = d.gallery.map((src, i) => ({ src, title: `${d.name} photo ${i + 1}` }));
  return (
    <>
      <div className="dhero">
        <div style={{ position: 'absolute', inset: 0 }}><Img src={d.image} alt={d.name} /></div>
        <div className="wrap">
          <div className="row">{d.moods.map((m) => <span key={m} className="tag" style={{ background: MOOD_COLORS[m] }}>{m}</span>)}</div>
          <h1>{d.name}</h1>
          <p>{d.state}. Best time: {d.season}. <Stars value={d.rating} /> {d.reviewCount} reviews</p>
        </div>
      </div>
      <div className="wrap section cols">
        <div>
          <p style={{ fontSize: '1.15rem' }}>{d.blurb}</p>
          <h3 style={{ margin: '22px 0 8px' }}>Don't miss</h3>
          <ul className="tick">{d.highlights.map((h) => <li key={h}>{h}</li>)}</ul>
          <h2 style={{ margin: '36px 0 14px' }}>Photo gallery</h2>
          <div className="masonry">{shots.map((s, i) => <button key={i} onClick={() => setLb(i)}><Img src={s.src} alt={s.title} /></button>)}</div>
          <Lightbox items={shots} index={lb} setIndex={setLb} />
          <h2 style={{ margin: '36px 0 14px' }}>Tour packages</h2>
          {d.packages.map((p) => (
            <div key={p.id} className="card row between" style={{ marginBottom: 12 }}>
              <div><h3>{p.title}</h3><p className="muted small">{p.days} days · per person</p></div>
              <div className="row"><div className="price">{money(p.price)}<small>≈ {other(p.price)}</small></div><Link className="btn pri sm" to={`/packages/${p.id}`}>View package</Link></div>
            </div>
          ))}
          <Reviews id={d.id} />
        </div>
        <aside className="sticky grid" style={{ gap: 16 }}>
          <div className="card"><h3 style={{ marginBottom: 12 }}>Trip vibe meter</h3><Vibe vibes={d.vibes} /></div>
          <div className="card"><h3>Stay here</h3><p className="muted small" style={{ margin: '4px 0 10px' }}>Hotels from <Money v={Math.min(...d.hotels.map((h) => h.pricePerNight))} /> per night</p><Link className="btn sm" to={`/hotels?dest=${d.id}`}>See hotels</Link></div>
          <div className="card"><h3>Fly here</h3><p className="muted small" style={{ margin: '4px 0 10px' }}>Nearest airport: {d.airportName} ({d.airport})</p><Link className="btn sm" to={`/flights?to=${d.airport}`}>Search flights</Link></div>
        </aside>
      </div>
    </>
  );
}
