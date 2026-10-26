import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useApp } from '../context.jsx';
import { Img, Lightbox, PageHead } from '../components.jsx';

export default function Gallery() {
  const { config } = useApp();
  const [all, setAll] = useState([]);
  const [mood, setMood] = useState('');
  const [limit, setLimit] = useState(20);
  const [lb, setLb] = useState(null);
  useEffect(() => { api('/destinations?sort=name').then(setAll); }, []);
  const items = all.filter((d) => !mood || d.moods.includes(mood)).flatMap((d) => d.gallery.map((src, i) => ({ src, title: `${d.name}, ${d.state}` })));
  return (
    <>
      <PageHead title="Photo gallery" sub="Browse places by mood. Click a photo to open it full-size, then use the arrow keys." />
      <div className="wrap section">
        <div className="row" style={{ marginBottom: 20, gap: 6 }}>
          <button className={'chip' + (!mood ? ' on' : '')} onClick={() => { setMood(''); setLimit(20); }}>All</button>
          {config.moods.map((m) => <button key={m} className={'chip' + (mood === m ? ' on' : '')} onClick={() => { setMood(m); setLimit(20); }}>{m}</button>)}
        </div>
        <div className="masonry">{items.slice(0, limit).map((s, i) => <button key={s.src} onClick={() => setLb(i)}><Img src={s.src} alt={s.title} /><span>{s.title}</span></button>)}</div>
        {limit < items.length && <div className="center" style={{ marginTop: 20 }}><button className="btn ghost" onClick={() => setLimit(limit + 20)}>Show more photos</button></div>}
        <Lightbox items={items.slice(0, limit)} index={lb} setIndex={setLb} />
      </div>
    </>
  );
}
