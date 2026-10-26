import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useApp } from "../context.jsx";
import { Img, PageHead, Stars, Money } from "../components.jsx";

const today = () => new Date().toISOString().slice(0, 10);

export function Hotels() {
  const { addToCart } = useApp();
  const [sp] = useSearchParams();
  const [dests, setDests] = useState([]);
  const [dest, setDest] = useState(sp.get("dest") || "goa");
  const [tier, setTier] = useState("");
  const [checkIn, setCheckIn] = useState(today());
  const [nights, setNights] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [guests, setGuests] = useState(2);
  const [list, setList] = useState(null);
  useEffect(() => {
    api("/destinations?sort=name").then(setDests);
  }, []);
  useEffect(() => {
    setList(null);
    api(`/hotels?destinationId=${dest}${tier ? "&tier=" + tier : ""}`).then(
      setList,
    );
  }, [dest, tier]);
  return (
    <>
      <PageHead
        title="Book a hotel"
        sub="Budget stays to palace resorts, priced per night in ₹ and $."
      />
      <div className="wrap section">
        <div
          className="card grid"
          style={{
            gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
            marginBottom: 24,
          }}
        >
          <div>
            <label htmlFor="hd">Destination</label>
            <select
              id="hd"
              value={dest}
              onChange={(e) => setDest(e.target.value)}
            >
              {dests.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="hc">Check-in</label>
            <input
              id="hc"
              type="date"
              min={today()}
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="hn">Nights</label>
            <input
              id="hn"
              type="number"
              min="1"
              max="30"
              value={nights}
              onChange={(e) => setNights(Math.max(1, +e.target.value || 1))}
            />
          </div>
          <div>
            <label htmlFor="hr">Rooms</label>
            <input
              id="hr"
              type="number"
              min="1"
              max="6"
              value={rooms}
              onChange={(e) => setRooms(Math.max(1, +e.target.value || 1))}
            />
          </div>
          <div>
            <label htmlFor="hg">Guests</label>
            <input
              id="hg"
              type="number"
              min="1"
              max="12"
              value={guests}
              onChange={(e) => setGuests(Math.max(1, +e.target.value || 1))}
            />
          </div>
          <div>
            <label htmlFor="ht">Type</label>
            <select
              id="ht"
              value={tier}
              onChange={(e) => setTier(e.target.value)}
            >
              <option value="">Any</option>
              <option>Budget</option>
              <option>Comfort</option>
              <option>Luxury</option>
            </select>
          </div>
        </div>
        {!list && <div className="skeleton" />}
        {list?.map((h) => {
          const total = h.pricePerNight * nights * rooms;
          return (
            <div className="hotel" key={h.id}>
              <div className="pic">
                <Img src={h.image} alt={h.name} />
              </div>
              <div className="mid">
                <span className="tag">{h.tier}</span>
                <h3 style={{ margin: "6px 0" }}>{h.name}</h3>
                <Stars value={h.stars} />{" "}
                <span className="small muted">Guest rating {h.rating}/5</span>
                <p className="small muted" style={{ marginTop: 6 }}>
                  {h.amenities.join(" · ")}
                </p>
              </div>
              <div className="end">
                <div className="price">
                  <small>Per night</small>
                  <Money v={h.pricePerNight} />
                </div>
                <div>
                  <p className="small muted">
                    {nights} night{nights > 1 && "s"}, {rooms} room
                    {rooms > 1 && "s"}:{" "}
                    <b>
                      <Money v={total} />
                    </b>
                  </p>
                  <button
                    className="btn pri sm"
                    style={{ marginTop: 8 }}
                    onClick={() =>
                      addToCart({
                        type: "hotel",
                        refId: h.id,
                        title: h.name,
                        sub: `${checkIn}, ${nights} night(s), ${rooms} room(s)`,
                        inr: total,
                        payload: { nights, rooms, guests, checkIn },
                      })
                    }
                  >
                    Add to trip cart
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export function Flights() {
  const { addToCart, config } = useApp();
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const [from, setFrom] = useState("DEL");
  const [to, setTo] = useState(sp.get("to") || "GOI");
  const [date, setDate] = useState(today());
  const [pax, setPax] = useState(1);
  const [res, setRes] = useState(null);
  const [sort, setSort] = useState("price");
  const codes = Object.entries(config.airports).sort((a, b) =>
    a[1].localeCompare(b[1]),
  );
  const search = (e) => {
    e?.preventDefault();
    setRes(null);
    api(`/flights/search?from=${from}&to=${to}&date=${date}`).then(setRes);
  };
  useEffect(() => {
    if (codes.length) search();
  }, [codes.length]);
  const sorted =
    res &&
    [...res].sort((a, b) =>
      sort === "price" ? a.price - b.price : a.durationMin - b.durationMin,
    );
  return (
    <>
      <PageHead
        title="Book a flight"
        sub="Domestic routes between 30 Indian airports."
      />
      <div className="wrap section">
        <form
          className="card grid"
          style={{
            gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))",
            alignItems: "end",
            marginBottom: 24,
          }}
          onSubmit={search}
        >
          <div>
            <label htmlFor="ff">From</label>
            <select
              id="ff"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            >
              {codes.map(([c, n]) => (
                <option key={c} value={c}>
                  {n} ({c})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ft">To</label>
            <select id="ft" value={to} onChange={(e) => setTo(e.target.value)}>
              {codes.map(([c, n]) => (
                <option key={c} value={c}>
                  {n} ({c})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="fd">Date</label>
            <input
              id="fd"
              type="date"
              min={today()}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="fp">Travellers</label>
            <input
              id="fp"
              type="number"
              min="1"
              max="9"
              value={pax}
              onChange={(e) => setPax(Math.max(1, +e.target.value || 1))}
            />
          </div>
          <button className="btn">Search flights</button>
        </form>
        {from === to && (
          <div className="card">Pick two different airports.</div>
        )}
        {res && res.length > 0 && (
          <div className="row between" style={{ marginBottom: 12 }}>
            <p className="muted">
              {res.length} flights, {config.airports[from]} to{" "}
              {config.airports[to]}
            </p>
            <select
              style={{ width: "auto" }}
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Sort flights"
            >
              <option value="price">Cheapest first</option>
              <option value="time">Fastest first</option>
            </select>
          </div>
        )}
        {!res && from !== to && (
          <div className="skeleton" style={{ height: 120 }} />
        )}
        {sorted?.map((f) => (
          <div className="flight" key={f.id}>
            <div>
              <b>{f.airline}</b>
              <p className="small muted">{f.flightNo}</p>
            </div>
            <div
              className="row"
              style={{ justifyContent: "space-between", flexWrap: "nowrap" }}
            >
              <div>
                <b style={{ fontSize: "1.2rem" }}>{f.departure}</b>
                <p className="small muted">{f.from}</p>
              </div>
              <div style={{ flex: 1, textAlign: "center" }}>
                <div className="line" />
                <span className="small muted">
                  {Math.floor(f.durationMin / 60)}h {f.durationMin % 60}m ·
                  Non-stop
                </span>
              </div>
              <div>
                <b style={{ fontSize: "1.2rem" }}>{f.arrival}</b>
                <p className="small muted">{f.to}</p>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="price">
                <Money v={f.price * pax} />
                <small>
                  {pax} traveller{pax > 1 && "s"}
                </small>
              </div>
              <button
                className="btn pri sm"
                style={{ marginTop: 6 }}
                onClick={() => {
                  addToCart({
                    type: "flight",
                    refId: f.id,
                    title: `${f.airline} ${f.flightNo}: ${f.fromCity} to ${f.toCity}`,
                    sub: `${f.date}, ${f.departure}, ${pax} traveller(s)`,
                    inr: f.price * pax,
                    payload: { travellers: pax },
                  });
                }}
              >
                Add to trip cart
              </button>
            </div>
          </div>
        ))}
        {res && (
          <p className="small muted" style={{ marginTop: 10 }}>
            Fares are sample data for this demo.{" "}
            <a
              href="#c"
              onClick={(e) => {
                e.preventDefault();
                nav("/checkout");
              }}
              style={{ textDecoration: "underline" }}
            >
              Go to trip cart
            </a>
          </p>
        )}
      </div>
    </>
  );
}
