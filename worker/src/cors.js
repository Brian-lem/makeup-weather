const PAGES_HOST = "brian-lem.github.io";
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

export function isAllowedOrigin(origin) {
  if (!origin || origin === "null") return false;
  let url;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }
  if (url.username || url.password) return false;
  if (url.pathname !== "/" || url.search || url.hash) return false;
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === PAGES_HOST) return url.protocol === "https:";
  if (LOCAL_HOSTS.has(host)) return url.protocol === "http:" || url.protocol === "https:";
  return false;
}

export function corsHeaders(request) {
  const headers = { Vary: "Origin" };
  const origin = request.headers.get("Origin");
  if (!origin || !isAllowedOrigin(origin)) return headers;
  return {
    ...headers,
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}
