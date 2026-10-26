import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useApp } from '../context.jsx';
import { PageHead, Money } from '../components.jsx';

let seq = 1;
const mk = (name, cost) => ({ id: 'p' + Date.now() + seq++, name, cost });

export default function Itinerary() {
  const { id } = useParams();
  const { toast } = useApp();
  const [dests, setDests] = useState([]);
  const [title, setTitle] = useState('My India trip');
  const [days, setDays] = useState([[], [], []]);
  const [pick, setPick] = useState('');
  const [custom, setCustom] = useState('');
  const [over, setOver] = useState(null);
  const [link, setLink] = useState('');

  useEffect(() => { api('/destinations?sort=name').then((l) => { setDests(l); setPick(l[0]?.id || ''); }); }, []);
  useEffect(() => { if (id) api('/itineraries/' + id).then((it) => { setTitle(it.title); setDays(it.days); }).catch(() => toast('Itinerary not found', 'bad')); }, [id]);

  const total = days.flat().reduce((a, p) => a + p.cost, 0);
  const addPlaces = (d) => {
    const per = Math.round(d.fromPrice / d.days / 100) * 100;
    setDays((ds) => { const n = ds.map((x) => [...x]); d.highlights.forEach((h, i) => n[Math.min(i, n.length - 1)].push(mk(`${d.name}: ${h}`, per))); return n; });
  };
  const drop = (to, e) => {
    e.preventDefault(); setOver(null);
    const pid = e.dataTransfer.getData('text/plain'); if (!pid) return;
    setDays((ds) => { let item; const stripped = ds.map((d) => d.filter((p) => (p.id === pid ? ((item = p), false) : true))); if (item) stripped[to].push(item); return stripped; });
  };
  const share = async () => {
    try { const it = await api('/itineraries', { method: 'POST', body: { title, days } }); const url = `${location.origin}/itinerary/${it.id}`; setLink(url); navigator.clipboard?.writeText(url); toast('Share link copied'); }
    catch (e) { toast(e.message, 'bad'); }
  };

  return (
    <>
      <PageHead title="Itinerary planner" sub="Add places, drag them between days and watch the cost update." />
      <div className="wrap section">
        <div className="card row between" style={{ marginBottom: 20 }}>
          <div className="row">
            <input value={title} onChange={(e) => setTitle(e.target.value)} aria-label="Trip title" style={{ width: 220, fontWeight: 700 }} />
            <select value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Destination" style={{ width: 190 }}>{dests.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
            <button className="btn sm" onClick={() => addPlaces(dests.find((d) => d.id === pick))}>Add top sights</button>
            <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Custom stop" aria-label="Custom stop" style={{ width: 160 }} />
            <button className="btn ghost sm" onClick={() => { if (custom.trim()) { setDays((ds) => { const n = ds.map((x) => [...x]); n[0].push(mk(custom.trim(), 500)); return n; }); setCustom(''); } }}>Add</button>
          </div>
          <div className="price" style={{ textAlign: 'right' }}><small>Estimated cost per person</small><Money v={total} /></div>
        </div>
        <div className="days">
          {days.map((d, i) => (
            <div key={i} className={'day' + (over === i ? ' over' : '')} onDragOver={(e) => { e.preventDefault(); setOver(i); }} onDragLeave={() => setOver(null)} onDrop={(e) => drop(i, e)}>
              <div className="row between"><b>Day {i + 1}</b>{days.length > 1 && !d.length && <button className="chip" onClick={() => setDays(days.filter((_, j) => j !== i))} aria-label="Remove day">✕</button>}</div>
              {!d.length && <p className="small muted" style={{ marginTop: 10 }}>Drop a place here</p>}
              {d.map((p) => (
                <div key={p.id} className="place" draggable onDragStart={(e) => e.dataTransfer.setData('text/plain', p.id)}>
                  <span>{p.name}<br /><span className="muted small">≈ <Money v={p.cost} /></span></span>
                  <button className="chip" onClick={() => setDays(days.map((x) => x.filter((q) => q.id !== p.id)))} aria-label={'Remove ' + p.name}>✕</button>
                </div>
              ))}
            </div>
          ))}
          <button className="day" style={{ border: '2px dashed var(--line)', cursor: 'pointer', background: 'none', fontWeight: 700 }} onClick={() => setDays([...days, []])}>+ Add a day</button>
        </div>
        <div className="row" style={{ marginTop: 22 }}>
          <button className="btn pri" onClick={share}>Copy share link</button>
          <button className="btn ghost" onClick={() => window.print()}>Print or save as PDF</button>
          {link && <span className="small muted">{link}</span>}
        </div>
      </div>
    </>
  );
}
