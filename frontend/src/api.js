const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

async function request(path, options = {}) {
  const res = await fetch(API_BASE + path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export const getFonts = () => request("/fonts");
export const searchFonts = ({ q, category, featured } = {}) => {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (category) params.set("category", category);
  if (featured != null) params.set("featured", String(featured));
  const qs = params.toString();
  return request("/fonts/search" + (qs ? "?" + qs : ""));
};
export const getFont = (slug) => request("/fonts/" + slug);
export const getCustomers = () => request("/customers");
export const getCustomerActivity = (userId) => request("/customer/" + userId + "/activity");
export const getCustomerAnalysis = (userId) => request("/customer/" + userId + "/analysis");
export const generateEmail = (userId, body = {}) => request("/customer/" + userId + "/generate-email", { method: "POST", body: JSON.stringify(body) });
