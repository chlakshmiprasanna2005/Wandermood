import { useState, useEffect } from "react";
import { Link, NavLink, Navigate, useNavigate } from "react-router-dom";
import { useApp } from "./context.jsx";

export const MOOD_COLORS = {
  Chill: "#2a9d8f",
  Adventure: "#e4572e",
  Spiritual: "#8e5bd0",
  Romantic: "#d9467a",
  Foodie: "#e09100",
  Heritage: "#a0522d",
  Wildlife: "#4f8a3c",
  Party: "#2b59c3",
};
export const MOOD_LINES = {
  Chill: "Slow mornings, no alarms.",
  Adventure: "Rapids, passes and sore legs.",
  Spiritual: "Bells, ghats and quiet.",
  Romantic: "Sunsets for two.",
  Foodie: "Plan the day around lunch.",
  Heritage: "Forts, temples and old stories.",
  Wildlife: "Early jeeps, patient eyes.",
  Party: "Beaches and late nights.",
};

export function Img({ src, alt, className = "img" }) {
  const [bad, setBad] = useState(false);
  return bad ? (
    <div className="fb" role="img" aria-label={alt}>
      {alt}
    </div>
  ) : (
    <img
      className={className}
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setBad(true)}
    />
  );
}

export const Stars = ({ value = 0 }) => {
  const n = Math.round(value);
  return (
    <span className="stars" title={value + " / 5"}>
      {"★".repeat(n)}
      <em>{"★".repeat(5 - n)}</em>
    </span>
  );
};

export function Vibe({ vibes }) {
  const rows = [
    ["Adventure", vibes.adventure, "#e4572e"],
    ["Relaxation", vibes.relax, "#2a9d8f"],
    ["Culture", vibes.culture, "#a0522d"],
    ["Nightlife", vibes.nightlife, "#2b59c3"],
  ];
  return (
    <div className="vibe">
      {rows.map(([l, v, c]) => (
        <div key={l}>
          <span>{l}</span>
          <span className="bar">
            <i style={{ width: v + "%", "--c": c }} />
          </span>
          <b>{v}</b>
        </div>
      ))}
    </div>
  );
}

export function Money({ v }) {
  const { money, other } = useApp();
  return (
    <span className="dual">
      <b>{money(v)}</b>
      <span>≈ {other(v)}</span>
    </span>
  );
}

export function DestCard({ d }) {
  const { money, other } = useApp();
  const [saved, setSaved] = useState(() =>
    JSON.parse(localStorage.getItem("wm-wish") || "[]").includes(d.id),
  );
  const toggle = (e) => {
    e.preventDefault();
    const list = JSON.parse(localStorage.getItem("wm-wish") || "[]");
    const next = list.includes(d.id)
      ? list.filter((x) => x !== d.id)
      : [...list, d.id];
    localStorage.setItem("wm-wish", JSON.stringify(next));
    setSaved(!saved);
  };
  return (
    <Link to={`/destinations/${d.id}`} className="dcard">
      <div className="pic">
        <Img src={d.image} alt={d.name} />
        <button
          className="heart"
          onClick={toggle}
          aria-label="Save to wishlist"
        >
          {saved ? "❤️" : "🤍"}
        </button>
        <div className="tags">
          {d.moods.map((m) => (
            <span
              key={m}
              className="tag"
              style={{ background: MOOD_COLORS[m] }}
            >
              {m}
            </span>
          ))}
        </div>
      </div>
      <div className="body">
        <h3>{d.name}</h3>
        <span className="muted small">
          {d.state} · Best: {d.season}
        </span>
        <p className="small muted">{d.blurb}</p>
        <div className="foot">
          <div>
            <Stars value={d.rating} />{" "}
            <span className="small muted">
              {d.reviewCount ? `(${d.reviewCount})` : "New"}
            </span>
          </div>
          <div className="price">
            <small>{d.days} days from</small>
            {money(d.fromPrice)}
            <small>≈ {other(d.fromPrice)}</small>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function PageHead({ title, sub }) {
  return (
    <div className="pagehead">
      <div className="wrap">
        <h1 style={{ fontSize: "clamp(2rem,4vw,3rem)" }}>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
    </div>
  );
}

export function Lightbox({ items, index, setIndex }) {
  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") setIndex(null);
      if (e.key === "ArrowRight") setIndex((index + 1) % items.length);
      if (e.key === "ArrowLeft")
        setIndex((index - 1 + items.length) % items.length);
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [index, items.length, setIndex]);
  if (index === null) return null;
  const it = items[index];
  return (
    <div
      className="lightbox"
      onClick={() => setIndex(null)}
      role="dialog"
      aria-modal="true"
    >
      <button
        className="nv"
        style={{ left: 16 }}
        onClick={(e) => {
          e.stopPropagation();
          setIndex((index - 1 + items.length) % items.length);
        }}
        aria-label="Previous"
      >
        ‹
      </button>
      <div onClick={(e) => e.stopPropagation()}>
        <img src={it.src} alt={it.title} />
        <p>
          {it.title} ({index + 1}/{items.length})
        </p>
      </div>
      <button
        className="nv"
        style={{ right: 16 }}
        onClick={(e) => {
          e.stopPropagation();
          setIndex((index + 1) % items.length);
        }}
        aria-label="Next"
      >
        ›
      </button>
    </div>
  );
}

export function Navbar() {
  const { user, logout, cart, currency, setCurrency } = useApp();
  const [open, setOpen] = useState(false);
  const nav = useNavigate();
  const close = () => setOpen(false);
  return (
    <header className="nav">
      <div className="wrap">
        <Link to="/" className="logo" onClick={close}>
          <i>🧭</i>WanderMood
        </Link>
        <nav className={"links" + (open ? " open" : "")} onClick={close}>
          <NavLink to="/destinations">Destinations</NavLink>
          <NavLink to="/hotels">Hotels</NavLink>
          <NavLink to="/flights">Flights</NavLink>
          <NavLink to="/itinerary">Itinerary</NavLink>
          <NavLink to="/gallery">Gallery</NavLink>
          <NavLink to="/contact">Contact</NavLink>
          {user?.role === "admin" && <NavLink to="/admin">Admin</NavLink>}
          <NavLink to="/checkout" className="cartlink">
            Trip cart{cart.length > 0 && <b>{cart.length}</b>}
          </NavLink>
          {user ? (
            <>
              <NavLink to="/profile">{user.name.split(" ")[0]}</NavLink>
              <a
                href="#out"
                onClick={(e) => {
                  e.preventDefault();
                  logout();
                  nav("/");
                }}
              >
                Log out
              </a>
            </>
          ) : (
            <NavLink to="/login">Log in</NavLink>
          )}
        </nav>
        <div className="row" style={{ gap: 8 }}>
          <div className="cur" role="group" aria-label="Currency">
            {["INR", "USD"].map((c) => (
              <button
                key={c}
                className={currency === c ? "on" : ""}
                onClick={() => setCurrency(c)}
              >
                {c === "INR" ? "₹ INR" : "$ USD"}
              </button>
            ))}
          </div>
          <button
            className="burger"
            onClick={() => setOpen(!open)}
            aria-label="Menu"
          >
            ☰
          </button>
        </div>
      </div>
    </header>
  );
}

export const Footer = () => (
  <footer className="footer">
    <div className="wrap">
      <div className="cols2">
        <div>
          <div className="logo" style={{ color: "#fff" }}>
            <i>🧭</i>WanderMood
          </div>
          <p style={{ marginTop: 10, maxWidth: 380 }}>
            Pick the feeling first. We line up the place, the stay and the
            flight. 37 destinations across India, priced in rupees and dollars.
          </p>
        </div>
        <div>
          <h4 style={{ color: "#fff", marginBottom: 8 }}>Explore</h4>
          <div className="grid" style={{ gap: 4 }}>
            <Link to="/destinations">Destinations</Link>
            <Link to="/hotels">Hotels</Link>
            <Link to="/flights">Flights</Link>
            <Link to="/gallery">Gallery</Link>
          </div>
        </div>
        <div>
          <h4 style={{ color: "#fff", marginBottom: 8 }}>Help</h4>
          <div className="grid" style={{ gap: 4 }}>
            <Link to="/contact">Contact us</Link>
            <Link to="/itinerary">Plan an itinerary</Link>
            <Link to="/login">Your account</Link>
          </div>
        </div>
      </div>
      <p className="small" style={{ marginTop: 28, opacity: 0.7 }}>
        © {new Date().getFullYear()} WanderMood. Demo project: payments are
        simulated. Photos are loaded from loremflickr and may vary.
      </p>
    </div>
  </footer>
);

export function Protected({ children, admin }) {
  const { user, ready } = useApp();
  if (!ready)
    return (
      <div className="wrap section">
        <div className="skeleton" />
      </div>
    );
  if (!user)
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (admin && user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}
