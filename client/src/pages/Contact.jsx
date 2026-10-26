import { useState } from 'react';
import { api } from '../api.js';
import { useApp } from '../context.jsx';
import { PageHead } from '../components.jsx';

export default function Contact() {
  const { toast } = useApp();
  const [f, setF] = useState({ name: '', email: '', subject: '', message: '' });
  const [err, setErr] = useState({});
  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (!f.name.trim()) er.name = 'Tell us your name';
    if (!/^\S+@\S+\.\S+$/.test(f.email)) er.email = 'Enter a valid email';
    if (f.message.trim().length < 10) er.message = 'Write at least 10 characters';
    setErr(er); if (Object.keys(er).length) return;
    try { await api('/contact', { method: 'POST', body: f }); toast('Message sent. We reply within one working day.'); setF({ name: '', email: '', subject: '', message: '' }); }
    catch (x) { toast(x.message, 'bad'); }
  };
  const I = (k, l, type = 'text') => <div className="field"><label htmlFor={k}>{l}</label><input id={k} type={type} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />{err[k] && <p className="err">{err[k]}</p>}</div>;
  return (
    <>
      <PageHead title="Contact us" sub="Questions about a trip? Our planners answer within one working day." />
      <div className="wrap section grid g2">
        <form className="card" onSubmit={submit} noValidate>
          {I('name', 'Your name')}{I('email', 'Email', 'email')}{I('subject', 'Subject')}
          <div className="field"><label htmlFor="message">Message</label><textarea id="message" rows="5" value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} />{err.message && <p className="err">{err.message}</p>}</div>
          <button className="btn pri">Send message</button>
        </form>
        <div className="grid" style={{ gap: 16 }}>
          <div className="card"><h3>Visit or call</h3><p className="muted" style={{ marginTop: 6 }}>WanderMood Travel, Beach Road, Visakhapatnam, Andhra Pradesh<br />+91 98765 43210<br />hello@wandermood.in</p></div>
          <iframe title="Office map" style={{ border: 0, borderRadius: 14, width: '100%', height: 260 }} loading="lazy" src="https://www.openstreetmap.org/export/embed.html?bbox=83.28%2C17.69%2C83.34%2C17.73&layer=mapnik" />
        </div>
      </div>
    </>
  );
}
