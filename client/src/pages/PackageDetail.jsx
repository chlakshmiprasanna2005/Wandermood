import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useApp } from '../context.jsx';
import { Img, Vibe, Money } from '../components.jsx';

export default function PackageDetail() {
  const { id } = useParams();
  const { addToCart } = useApp();
  const nav = useNavigate();
  const [p, setP] = useState(null);
  const [open, setOpen] = useState(0);
  const [n, setN] = useState(2);
  const [date, setDate] = useState('');
  useEffect(() => { api('/packages/' + id).then(setP).catch(() => setP(false)); }, [id]);
  if (p === false) return <div className="wrap section center"><h2>Package not found</h2><Link className="btn" to="/destinations">Browse destinations</Link></div>;
  if (!p) return <div className="wrap section"><div className="skeleton" /></div>;
  const item = () => ({ type: 'package', refId: p.id, title: p.title, sub: `${n} traveller${n > 1 ? 's' : ''}${date ? ', starts ' + date : ''}`, inr: p.price * n, payload: { travellers: n, startDate: date } });
  const today = new Date().toISOString().slice(0, 10);
  return (
    <>
      <div className="dhero" style={{ height: 340 }}>
        <div style={{ position: 'absolute', inset: 0 }}><Img src={p.image} alt={p.title} /></div>
        <div className="wrap"><p>{p.destination.name}, {p.destination.state}</p><h1>{p.title}</h1><p>{p.days} days · Best time {p.destination.season}</p></div>
      </div>
      <div className="wrap section cols">
        <div>
          <p style={{ fontSize: '1.1rem' }}>{p.summary}</p>
          <h2 style={{ margin: '28px 0 12px' }}>Day by day</h2>
          {p.itinerary.map((it, i) => (
            <div className="acc" key={i}>
              <button onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i}><span>Day {it.day}: {it.title}</span><span>{open === i ? '−' : '+'}</span></button>
              {open === i && <div className="in">{it.details}</div>}
            </div>
          ))}
          <div className="grid g2" style={{ marginTop: 26 }}>
            <div className="card"><h3 style={{ marginBottom: 8 }}>Included</h3><ul className="tick">{p.inclusions.map((x) => <li key={x}>{x}</li>)}</ul></div>
            <div className="card"><h3 style={{ marginBottom: 8 }}>Not included</h3><ul className="tick x">{p.exclusions.map((x) => <li key={x}>{x}</li>)}</ul></div>
          </div>
        </div>
        <aside className="sticky grid" style={{ gap: 16 }}>
          <div className="card">
            <div className="price" style={{ marginBottom: 12 }}><small>Per person</small><Money v={p.price} /></div>
            <div className="field"><label htmlFor="d">Start date</label><input id="d" type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div className="field"><label htmlFor="n">Travellers</label><input id="n" type="number" min="1" max="12" value={n} onChange={(e) => setN(Math.max(1, +e.target.value || 1))} /></div>
            <p className="muted small" style={{ marginBottom: 12 }}>Total for {n}: <Money v={p.price * n} /></p>
            <div className="grid" style={{ gap: 8 }}>
              <button className="btn pri" onClick={() => { addToCart(item()); nav('/checkout'); }}>Book now</button>
              <button className="btn ghost" onClick={() => addToCart(item())}>Add to trip cart</button>
            </div>
          </div>
          <div className="card"><h3 style={{ marginBottom: 12 }}>Trip vibe meter</h3><Vibe vibes={p.vibes} /></div>
        </aside>
      </div>
    </>
  );
}
