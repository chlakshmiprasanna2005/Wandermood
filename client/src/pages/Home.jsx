import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api.js';
import { DestCard, Img, MOOD_COLORS, MOOD_LINES } from '../components.jsx';

export default function Home() {
  const [all, setAll] = useState([]);
  const [mood, setMood] = useState('Chill');
  const [q, setQ] = useState('');
  const nav = useNavigate();
  useEffect(() => { api('/destinations?sort=rating').then(setAll).catch(() => {}); }, []);
  const picks = all.filter((d) => d.moods.includes(mood));
  const featured = [...all].sort((a, b) => b.reviewCount - a.reviewCount).slice(0, 6);

  return (
    <>
      <section className="hero" style={{ '--tint': MOOD_COLORS[mood] }}>
        <div className="wrap">
          <div>
            <h1>How do you want to <span>feel</span> on your next trip?</h1>
            <p className="lead">Choose a mood. We match it to places across India, then you book the stay, the flight and the whole plan in rupees or dollars.</p>
            <div className="moods" role="group" aria-label="Choose a mood">
              {Object.keys(MOOD_COLORS).map((m) => <button key={m} className={'mood' + (m === mood ? ' on' : '')} style={{ '--c': MOOD_COLORS[m] }} onClick={() => setMood(m)}>{m}</button>)}
            </div>
            <p className="muted" style={{ marginBottom: 16 }}>{MOOD_LINES[mood]} {picks.length} places match.</p>
            <div className="row">
              <Link to={`/destinations?mood=${mood}`} className="btn pri">See {mood.toLowerCase()} trips</Link>
              <form onSubmit={(e) => { e.preventDefault(); nav(`/destinations?q=${encodeURIComponent(q)}`); }} className="row" style={{ gap: 8 }}>
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Or search a place" aria-label="Search destinations" style={{ width: 200, borderRadius: 999 }} />
              </form>
            </div>
          </div>
          <div className="stack" aria-label={`Top ${mood} destinations`}>
            {picks.slice(0, 3).map((d) => (
              <Link key={d.id} to={`/destinations/${d.id}`}><Img src={d.image} alt={d.name} /><div className="cap">{d.name}<div style={{ fontWeight: 500, fontSize: '.8rem' }}>{d.state}</div></div></Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section wrap">
        <div className="row between" style={{ marginBottom: 22 }}>
          <div><h2>Travellers keep coming back to these</h2><p className="muted">Most-reviewed destinations this season.</p></div>
          <Link to="/destinations" className="btn ghost">Browse all 37</Link>
        </div>
        <div className="grid g3">{featured.length ? featured.map((d) => <DestCard key={d.id} d={d} />) : [1, 2, 3].map((i) => <div key={i} className="skeleton" />)}</div>
      </section>

      <section className="section" style={{ background: 'var(--mist)' }}>
        <div className="wrap">
          <h2 style={{ marginBottom: 26 }}>From mood to booked in three steps</h2>
          <div className="grid g3">
            {[['Pick a mood', 'Chill, Adventure, Spiritual and five more. Each destination is tagged by how it feels.'], ['Build the trip', 'Add a tour package, a hotel and flights to one trip cart. Reorder days in the itinerary planner.'], ['Pay your way', 'See every price in ₹ and $ side by side. Your passport collects a stamp for each trip.']].map(([t, p], i) => (
              <div className="card" key={t}><span className="tag" style={{ background: 'var(--marigold)', color: 'var(--ink)' }}>Step {i + 1}</span><h3 style={{ margin: '10px 0 6px' }}>{t}</h3><p className="muted">{p}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="section wrap center">
        <h2>Not sure where to start?</h2>
        <p className="muted" style={{ margin: '8px 0 20px' }}>Drag places into days and see the running cost, then share the plan with friends.</p>
        <Link to="/itinerary" className="btn">Open the itinerary planner</Link>
      </section>
    </>
  );
}
