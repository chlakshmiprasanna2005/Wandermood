import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useApp } from "../context.jsx";
import { MOOD_COLORS, Money } from "../components.jsx";

function AuthForm({ mode }) {
  const reg = mode === "register";
  const { login, toast } = useApp();
  const nav = useNavigate();
  const loc = useLocation();
  const [f, setF] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    const er = {};
    if (reg && f.name.trim().length < 2) er.name = "Enter your full name";
    if (!/^\S+@\S+\.\S+$/.test(f.email)) er.email = "Enter a valid email";
    if (f.password.length < 6) er.password = "Use at least 6 characters";
    if (reg && f.password !== f.confirm) er.confirm = "Passwords do not match";
    setErr(er);
    if (Object.keys(er).length) return;
    setBusy(true);
    try {
      const r = await api(`/auth/${mode}`, { method: "POST", body: f });
      login(r.token, r.user);
      toast(
        reg ? "Welcome aboard!" : "Welcome back, " + r.user.name.split(" ")[0],
      );
      nav(loc.state?.from || (r.user.role === "admin" ? "/admin" : "/profile"));
    } catch (e2) {
      setErr({ form: e2.message });
    }
    setBusy(false);
  };
  const F = (k, label, type = "text") => (
    <div className="field">
      <label htmlFor={k}>{label}</label>
      <input
        id={k}
        type={type}
        value={f[k]}
        onChange={(e) => setF({ ...f, [k]: e.target.value })}
      />
      {err[k] && <p className="err">{err[k]}</p>}
    </div>
  );
  return (
    <form className="card auth" onSubmit={submit} noValidate>
      <h2 style={{ marginBottom: 16 }}>
        {reg ? "Create your travel passport" : "Log in"}
      </h2>
      {reg && F("name", "Full name")}
      {F("email", "Email", "email")}
      {F("password", "Password", "password")}
      {reg && F("confirm", "Confirm password", "password")}
      {err.form && (
        <p className="err" style={{ marginBottom: 10 }}>
          {err.form}
        </p>
      )}
      <button className="btn pri" style={{ width: "100%" }} disabled={busy}>
        {reg ? "Sign up" : "Log in"}
      </button>
      <p className="small muted center" style={{ marginTop: 14 }}>
        {reg ? (
          <>
            Have an account?{" "}
            <Link to="/login">
              <u>Log in</u>
            </Link>
          </>
        ) : (
          <>
            New here?{" "}
            <Link to="/register">
              <u>Create an account</u>
            </Link>
          </>
        )}
      </p>
      {!reg && (
        <p className="small muted center" style={{ marginTop: 10 }}>
          Demo logins: user@wandermood.in / user123 · admin@wandermood.in /
          admin123
        </p>
      )}
    </form>
  );
}
export const Login = () => <AuthForm mode="login" />;
export const Register = () => <AuthForm mode="register" />;

export function Profile() {
  const { user, toast } = useApp();
  const [bk, setBk] = useState(null);
  const [names, setNames] = useState({});
  const load = () => api("/bookings/mine").then(setBk);
  useEffect(() => {
    load();
    api("/destinations").then((l) =>
      setNames(Object.fromEntries(l.map((d) => [d.id, d.name]))),
    );
  }, []);
  const cancel = async (id) => {
    if (!confirm("Cancel this booking?")) return;
    try {
      await api(`/bookings/${id}/cancel`, { method: "PATCH" });
      toast("Booking cancelled");
      load();
    } catch (e) {
      toast(e.message, "bad");
    }
  };
  const colors = Object.values(MOOD_COLORS);
  return (
    <div className="wrap section">
      <h1 style={{ fontSize: "2.4rem" }}>{user.name}'s travel passport</h1>
      <p className="muted">{user.email}</p>
      <h3 style={{ margin: "26px 0 12px" }}>
        Stamps collected ({user.stamps.length})
      </h3>
      {user.stamps.length ? (
        <div className="stamps">
          {user.stamps.map((s, i) => (
            <div
              key={s}
              className="stamp"
              style={{
                "--c": colors[i % colors.length],
                "--rot": ((i * 37) % 24) - 12 + "deg",
              }}
            >
              {names[s] || s}
            </div>
          ))}
        </div>
      ) : (
        <p className="muted">
          No stamps yet. Book a package or hotel to earn your first.
        </p>
      )}
      <h3 style={{ margin: "34px 0 12px" }}>My bookings</h3>
      {!bk ? (
        <div className="skeleton" style={{ height: 120 }} />
      ) : !bk.length ? (
        <div className="card">
          <p>No bookings yet.</p>
          <Link to="/destinations" className="btn sm" style={{ marginTop: 10 }}>
            Find a trip
          </Link>
        </div>
      ) : (
        <div className="scroll">
          <table className="tbl">
            <thead>
              <tr>
                <th>Ref</th>
                <th>Booking</th>
                <th>Amount</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {bk.map((b) => (
                <tr key={b.id}>
                  <td className="small">{b.id.toUpperCase()}</td>
                  <td>
                    <b>{b.title}</b>
                    <br />
                    <span className="small muted capitalize">
                      {b.type}, {new Date(b.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td>
                    <Money v={b.totalINR} />
                  </td>
                  <td>
                    <span className={"status st-" + b.status}>{b.status}</span>
                  </td>
                  <td>
                    {b.status !== "Cancelled" && (
                      <button
                        className="btn ghost sm"
                        onClick={() => cancel(b.id)}
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
