import { useEffect, useState } from "react";
import { api } from "../api.js";
import { useApp } from "../context.jsx";
import { Money } from "../components.jsx";

const TABS = [
  ["dash", "📊 Dashboard"],
  ["users", "👥 Users"],
  ["bookings", "🧾 Bookings"],
  ["packages", "🎒 Packages"],
  ["messages", "✉️ Messages"],
];

function Dashboard() {
  const { inr, usd } = useApp();
  const [s, setS] = useState(null);
  useEffect(() => {
    api("/admin/stats").then(setS);
  }, []);
  if (!s) return <div className="skeleton" />;
  const max = Math.max(1, ...s.months.map((m) => m.bookings));
  const cards = [
    ["Users", s.users, "#0f766e"],
    ["Bookings", s.bookings, "#e4572e"],
    ["Packages", s.packages, "#8e5bd0"],
    ["Messages", s.messages, "#2b59c3"],
  ];
  return (
    <>
      <div
        className="grid g3"
        style={{ gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))" }}
      >
        {cards.map(([l, v, c]) => (
          <div key={l} className="card stat" style={{ "--c": c }}>
            <span className="muted small">{l}</span>
            <b>{v}</b>
          </div>
        ))}
        <div className="card stat" style={{ "--c": "#f4a300" }}>
          <span className="muted small">Revenue (excl. cancelled)</span>
          <b>{inr(s.revenueINR)}</b>
          <span className="muted small">≈ {usd(s.revenueINR)}</span>
        </div>
      </div>
      <div className="card" style={{ marginTop: 22 }}>
        <h3 style={{ marginBottom: 6 }}>Bookings per month</h3>
        {s.months.length ? (
          <div className="chart">
            {s.months.map((m) => (
              <div key={m.month}>
                <span>{m.bookings}</span>
                <i style={{ height: (m.bookings / max) * 85 + "%" }} />
                <span className="muted">
                  {m.month.slice(5)}/{m.month.slice(2, 4)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="muted">No bookings yet.</p>
        )}
        <p className="small muted" style={{ marginTop: 10 }}>
          By type:{" "}
          {Object.entries(s.byType)
            .map(([k, v]) => `${k} ${v}`)
            .join(", ") || "none"}
        </p>
      </div>
    </>
  );
}

function Users() {
  const { toast } = useApp();
  const [list, setList] = useState([]);
  const [q, setQ] = useState("");
  const load = () => api("/admin/users").then(setList);
  useEffect(() => {
    load();
  }, []);
  const act = async (fn, msg) => {
    try {
      await fn();
      toast(msg);
      load();
    } catch (e) {
      toast(e.message, "bad");
    }
  };
  const rows = list.filter((u) =>
    (u.name + u.email).toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <>
      <input
        placeholder="Search users"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ maxWidth: 320, marginBottom: 14 }}
        aria-label="Search users"
      />
      <div className="scroll">
        <table className="tbl">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Joined</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td>
                  <b>{u.name}</b>
                </td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                <td>
                  <span
                    className={
                      "status " + (u.blocked ? "st-Cancelled" : "st-Confirmed")
                    }
                  >
                    {u.blocked ? "Blocked" : "Active"}
                  </span>
                </td>
                <td>
                  {u.role !== "admin" && (
                    <div className="row" style={{ gap: 6 }}>
                      <button
                        className="btn ghost sm"
                        onClick={() =>
                          act(
                            () =>
                              api(`/admin/users/${u.id}/block`, {
                                method: "PATCH",
                              }),
                            u.blocked ? "User unblocked" : "User blocked",
                          )
                        }
                      >
                        {u.blocked ? "Unblock" : "Block"}
                      </button>
                      <button
                        className="btn danger sm"
                        onClick={() =>
                          confirm(`Delete ${u.name}?`) &&
                          act(
                            () =>
                              api(`/admin/users/${u.id}`, { method: "DELETE" }),
                            "User deleted",
                          )
                        }
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Bookings() {
  const { toast } = useApp();
  const [list, setList] = useState([]);
  const [filter, setFilter] = useState("");
  const load = () => api("/admin/bookings").then(setList);
  useEffect(() => {
    load();
  }, []);
  const setStatus = async (id, status) => {
    try {
      await api("/admin/bookings/" + id, { method: "PATCH", body: { status } });
      toast("Status updated");
      load();
    } catch (e) {
      toast(e.message, "bad");
    }
  };
  return (
    <>
      <select
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        style={{ maxWidth: 220, marginBottom: 14 }}
        aria-label="Filter by status"
      >
        <option value="">All statuses</option>
        <option>Pending</option>
        <option>Confirmed</option>
        <option>Cancelled</option>
      </select>
      <div className="scroll">
        <table className="tbl">
          <thead>
            <tr>
              <th>Ref</th>
              <th>Customer</th>
              <th>Booking</th>
              <th>₹ / $</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {list
              .filter((b) => !filter || b.status === filter)
              .map((b) => (
                <tr key={b.id}>
                  <td className="small">{b.id.toUpperCase()}</td>
                  <td>{b.userName}</td>
                  <td>
                    {b.title}
                    <br />
                    <span className="small muted">{b.type}</span>
                  </td>
                  <td>
                    <Money v={b.totalINR} />
                  </td>
                  <td>
                    <select
                      value={b.status}
                      onChange={(e) => setStatus(b.id, e.target.value)}
                      aria-label="Booking status"
                      style={{ padding: "6px 8px" }}
                    >
                      <option>Pending</option>
                      <option>Confirmed</option>
                      <option>Cancelled</option>
                    </select>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Packages() {
  const { toast } = useApp();
  const [list, setList] = useState([]);
  const [dests, setDests] = useState([]);
  const blank = {
    destinationId: "goa",
    title: "",
    price: "",
    days: 4,
    summary: "",
  };
  const [f, setF] = useState(blank);
  const [editing, setEditing] = useState(null);
  const load = () => api("/packages").then(setList);
  useEffect(() => {
    load();
    api("/destinations?sort=name").then(setDests);
  }, []);
  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing)
        await api("/admin/packages/" + editing, { method: "PUT", body: f });
      else await api("/admin/packages", { method: "POST", body: f });
      toast(editing ? "Package updated" : "Package added");
      setF(blank);
      setEditing(null);
      load();
    } catch (er) {
      toast(er.message, "bad");
    }
  };
  return (
    <>
      <form
        className="card grid"
        style={{
          gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))",
          alignItems: "end",
          marginBottom: 20,
        }}
        onSubmit={save}
      >
        <div>
          <label htmlFor="pd">Destination</label>
          <select
            id="pd"
            disabled={!!editing}
            value={f.destinationId}
            onChange={(e) => setF({ ...f, destinationId: e.target.value })}
          >
            {dests.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="pt">Title</label>
          <input
            id="pt"
            required
            value={f.title}
            onChange={(e) => setF({ ...f, title: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="pp">Price per person (₹)</label>
          <input
            id="pp"
            type="number"
            min="1"
            required
            value={f.price}
            onChange={(e) => setF({ ...f, price: e.target.value })}
          />
        </div>
        <div>
          <label htmlFor="pk">Days</label>
          <input
            id="pk"
            type="number"
            min="1"
            max="30"
            value={f.days}
            onChange={(e) => setF({ ...f, days: e.target.value })}
          />
        </div>
        <div style={{ gridColumn: "1/-1" }}>
          <label htmlFor="ps">Summary</label>
          <input
            id="ps"
            value={f.summary}
            onChange={(e) => setF({ ...f, summary: e.target.value })}
          />
        </div>
        <div className="row">
          <button className="btn pri">
            {editing ? "Save changes" : "Add package"}
          </button>
          {editing && (
            <button
              type="button"
              className="btn ghost"
              onClick={() => {
                setEditing(null);
                setF(blank);
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
      <div className="scroll">
        <table className="tbl">
          <thead>
            <tr>
              <th>Package</th>
              <th>Days</th>
              <th>Price</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {list.map((p) => (
              <tr key={p.id}>
                <td>
                  <b>{p.title}</b>
                </td>
                <td>{p.days}</td>
                <td>
                  <Money v={p.price} />
                </td>
                <td>
                  <div className="row" style={{ gap: 6 }}>
                    <button
                      className="btn ghost sm"
                      onClick={() => {
                        setEditing(p.id);
                        setF({
                          destinationId: p.destinationId,
                          title: p.title,
                          price: p.price,
                          days: p.days,
                          summary: p.summary,
                        });
                        window.scrollTo(0, 0);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="btn danger sm"
                      onClick={async () => {
                        if (confirm("Delete this package?")) {
                          await api("/admin/packages/" + p.id, {
                            method: "DELETE",
                          });
                          toast("Package deleted");
                          load();
                        }
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Messages() {
  const { toast } = useApp();
  const [list, setList] = useState(null);
  const load = () => api("/admin/messages").then(setList);
  useEffect(() => {
    load();
  }, []);
  if (!list) return <div className="skeleton" />;
  if (!list.length)
    return (
      <div className="card">
        <p>No messages yet. Contact form entries show up here.</p>
      </div>
    );
  return (
    <div className="grid" style={{ gap: 12 }}>
      {list.map((m) => (
        <div className="card" key={m.id}>
          <div className="row between">
            <b>{m.subject}</b>
            <span className="small muted">
              {new Date(m.createdAt).toLocaleString()}
            </span>
          </div>
          <p className="small muted">
            {m.name} · {m.email}
          </p>
          <p style={{ margin: "8px 0" }}>{m.message}</p>
          <button
            className="btn ghost sm"
            onClick={async () => {
              await api("/admin/messages/" + m.id, { method: "DELETE" });
              toast("Message deleted");
              load();
            }}
          >
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}

export default function Admin() {
  const [tab, setTab] = useState("dash");
  const View = {
    dash: Dashboard,
    users: Users,
    bookings: Bookings,
    packages: Packages,
    messages: Messages,
  }[tab];
  return (
    <div className="wrap section admin">
      <aside className="sidebar" aria-label="Admin sections">
        {TABS.map(([k, l]) => (
          <button
            key={k}
            className={tab === k ? "on" : ""}
            onClick={() => setTab(k)}
          >
            {l}
          </button>
        ))}
      </aside>
      <div>
        <h1 style={{ fontSize: "2rem", marginBottom: 18 }}>
          {TABS.find((t) => t[0] === tab)[1].slice(3)}
        </h1>
        <View />
      </div>
    </div>
  );
}
