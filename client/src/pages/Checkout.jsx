import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { useApp } from '../context.jsx';
import { PageHead, Money } from '../components.jsx';

export default function Checkout() {
  const { cart, removeFromCart, clearCart, user, toast, inr, usd } = useApp();
  const [method, setMethod] = useState('card');
  const [f, setF] = useState({ name: user?.name || '', card: '', upi: '' });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);
  const total = cart.reduce((a, c) => a + c.inr, 0);

  const pay = async (e) => {
    e.preventDefault();
    if (method === 'card' && f.card.replace(/\s/g, '').length < 12) return toast('Enter a 12 to 16 digit card number (any digits work in this demo)', 'bad');
    if (method === 'upi' && !/^\S+@\S+$/.test(f.upi)) return toast('Enter a UPI ID like name@bank', 'bad');
    setBusy(true);
    try {
      const r = await api('/bookings', { method: 'POST', body: { paymentMethod: method, items: cart.map((c) => ({ type: c.type, refId: c.refId, ...c.payload })) } });
      setDone(r); clearCart();
    } catch (er) { toast(er.message, 'bad'); }
    setBusy(false);
  };

  if (done) return (
    <div className="wrap section" style={{ maxWidth: 680 }}>
      <div className="card center">
        <div style={{ fontSize: '3rem' }}>🎉</div><h2>Trip booked</h2>
        <p className="muted" style={{ margin: '8px 0 18px' }}>Paid {inr(done.totalINR)} (≈ {usd(done.totalINR)}). A passport stamp was added to your profile.</p>
        <ul style={{ listStyle: 'none', textAlign: 'left', marginBottom: 20 }}>{done.bookings.map((b) => <li key={b.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--line)' }}><b>{b.title}</b><br /><span className="small muted">Ref {b.id.toUpperCase()} · {inr(b.totalINR)} / {usd(b.totalINR)}</span></li>)}</ul>
        <Link className="btn" to="/profile">View my bookings</Link>
      </div>
    </div>
  );

  return (
    <>
      <PageHead title="Your trip cart" sub="Package, hotel and flight in one checkout. Totals shown in both currencies." />
      <div className="wrap section">
        {!cart.length ? (
          <div className="card center"><h3>Your cart is empty</h3><p className="muted" style={{ margin: '6px 0 16px' }}>Add a package, hotel or flight to get started.</p><div className="row" style={{ justifyContent: 'center' }}><Link className="btn" to="/destinations">Browse destinations</Link><Link className="btn ghost" to="/flights">Find flights</Link></div></div>
        ) : (
          <div className="cols">
            <div>
              {cart.map((c) => (
                <div key={c.key} className="card row between" style={{ marginBottom: 12 }}>
                  <div><span className="tag" style={{ textTransform: 'capitalize' }}>{c.type}</span><h3 style={{ margin: '6px 0 2px' }}>{c.title}</h3><p className="small muted">{c.sub}</p></div>
                  <div className="row"><div className="price"><Money v={c.inr} /></div><button className="btn ghost sm" onClick={() => removeFromCart(c.key)}>Remove</button></div>
                </div>
              ))}
            </div>
            <aside className="sticky card">
              <h3>Order summary</h3>
              <div style={{ margin: '14px 0', padding: '12px 0', borderBlock: '1px solid var(--line)' }}>
                <div className="row between"><span>Total in rupees</span><b style={{ fontSize: '1.3rem' }}>{inr(total)}</b></div>
                <div className="row between"><span>Total in dollars</span><b style={{ fontSize: '1.3rem' }}>{usd(total)}</b></div>
              </div>
              {!user ? (
                <><p className="muted small" style={{ marginBottom: 10 }}>Log in to pay and save this trip to your passport.</p><Link to="/login" state={{ from: '/checkout' }} className="btn pri" style={{ width: '100%' }}>Log in to continue</Link></>
              ) : (
                <form onSubmit={pay}>
                  <div className="pay">{[['card', '💳 Card'], ['upi', '📱 UPI'], ['net', '🏦 Net banking']].map(([k, l]) => <label key={k} className={method === k ? 'on' : ''}><input type="radio" name="m" checked={method === k} onChange={() => setMethod(k)} />{l}</label>)}</div>
                  <div className="field"><label htmlFor="cn">Name</label><input id="cn" required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
                  {method === 'card' && <div className="field"><label htmlFor="cc">Card number</label><input id="cc" inputMode="numeric" placeholder="4242 4242 4242 4242" value={f.card} onChange={(e) => setF({ ...f, card: e.target.value })} /></div>}
                  {method === 'upi' && <div className="field"><label htmlFor="cu">UPI ID</label><input id="cu" placeholder="name@upi" value={f.upi} onChange={(e) => setF({ ...f, upi: e.target.value })} /></div>}
                  {method === 'net' && <p className="small muted" style={{ marginBottom: 12 }}>You'd be redirected to your bank. In this demo, payment is simulated.</p>}
                  <button className="btn pri" style={{ width: '100%' }} disabled={busy}>{busy ? 'Processing…' : `Pay ${inr(total)}`}</button>
                  <p className="small muted center" style={{ marginTop: 8 }}>Demo only: no real payment is taken.</p>
                </form>
              )}
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
