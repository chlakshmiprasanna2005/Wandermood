import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { api } from "./api.js";

const Ctx = createContext(null);
export const useApp = () => useContext(Ctx);

const load = (k, d) => {
  try {
    return JSON.parse(localStorage.getItem(k)) ?? d;
  } catch {
    return d;
  }
};

export function AppProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [config, setConfig] = useState({
    usdPerInr: 0.0115,
    airports: {},
    moods: [],
  });
  const [currency, setCurrency] = useState(load("wm-currency", "INR"));
  const [cart, setCart] = useState(load("wm-cart", []));
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    api("/config")
      .then(setConfig)
      .catch(() => {});
  }, []);
  useEffect(() => {
    if (!localStorage.getItem("wm-token")) return setReady(true);
    api("/auth/me")
      .then(setUser)
      .catch(() => localStorage.removeItem("wm-token"))
      .finally(() => setReady(true));
  }, []);
  useEffect(
    () => localStorage.setItem("wm-cart", JSON.stringify(cart)),
    [cart],
  );
  useEffect(
    () => localStorage.setItem("wm-currency", JSON.stringify(currency)),
    [currency],
  );

  const toast = useCallback((msg, kind = "ok") => {
    const id = Math.random();
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const inr = (v) => "₹" + Math.round(v).toLocaleString("en-IN");
  const usd = (v) =>
    "$" +
    (v * config.usdPerInr).toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  const money = (v) => (currency === "INR" ? inr(v) : usd(v));
  const other = (v) => (currency === "INR" ? usd(v) : inr(v));

  const login = (token, u) => {
    localStorage.setItem("wm-token", token);
    setUser(u);
  };
  const logout = () => {
    localStorage.removeItem("wm-token");
    setUser(null);
  };
  const addToCart = (item) => {
    setCart((c) => [...c, { ...item, key: Date.now() + Math.random() }]);
    toast("Added to your trip cart");
  };
  const removeFromCart = (key) =>
    setCart((c) => c.filter((x) => x.key !== key));
  const clearCart = () => setCart([]);

  return (
    <Ctx.Provider
      value={{
        user,
        ready,
        setUser,
        login,
        logout,
        config,
        currency,
        setCurrency,
        money,
        other,
        inr,
        usd,
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        toast,
      }}
    >
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={"toast " + t.kind}>
            {t.msg}
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
