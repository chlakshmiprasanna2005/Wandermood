// Thin fetch wrapper that attaches the JWT and throws readable errors.
export async function api(path, { method = "GET", body } = {}) {
  const token = localStorage.getItem("wm-token");
  const res = await fetch("/api" + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Something went wrong");
  return data;
}
