export const STORAGE_KEY = "makeup-weather.workerUrl";

// Built-in production endpoint. Visitors do not configure this.
export const DEFAULT_API_BASE = "https://makeup-weather-veefqfizvy.cn-hangzhou.fcapp.run";

const SENSITIVE_PARAMS = ["key", "token", "api_key", "apikey", "secret", "access_token", "dashscope_api_key"];

export function devOverrideEnabled(href = currentHref()) {
  if (!href) return false;
  try {
    return new URL(href).searchParams.get("dev") === "1";
  } catch {
    return false;
  }
}

// A previously saved Worker URL must not hijack a normal visit.
// Only ?dev=1 may replace the built-in endpoint, and only with a URL that passes validation.
export function resolveApiUrl({ dev = devOverrideEnabled(), saved = readWorkerUrl() } = {}) {
  if (!dev) return DEFAULT_API_BASE;
  const check = validateWorkerUrl(saved);
  return check.ok ? check.url : DEFAULT_API_BASE;
}

function currentHref() {
  if (typeof location === "undefined" || !location?.href) return "";
  return location.href;
}

export function readWorkerUrl() {
  try {
    return (localStorage.getItem(STORAGE_KEY) || "").trim();
  } catch {
    return "";
  }
}

export function writeWorkerUrl(url) {
  localStorage.setItem(STORAGE_KEY, url);
}

export function clearWorkerUrl() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Private mode can refuse storage. The in-memory field is already empty.
  }
}

export function validateWorkerUrl(input) {
  const value = String(input || "").trim();
  if (!value) return { ok: false, error: "请填写 Worker 地址。" };
  if (value.length > 300) return { ok: false, error: "这个地址太长了。" };
  if (/^sk-/i.test(value) || /DASHSCOPE_API_KEY/i.test(value)) {
    return { ok: false, error: "这里只填写 Worker 地址，不要填写 API 密钥。" };
  }

  let url;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, error: "地址需要以 https:// 开头。" };
  }
  if (url.username || url.password) {
    return { ok: false, error: "地址里不要带账号或密钥。" };
  }
  const host = url.hostname.toLowerCase();
  if (host === "dashscope.aliyuncs.com" || host.endsWith(".dashscope.aliyuncs.com")) {
    return { ok: false, error: "请填写你自己的 Worker 地址，不要直接填写通义千问的接口。密钥不能放在网页里。" };
  }
  for (const name of SENSITIVE_PARAMS) {
    if (url.searchParams.has(name)) {
      return { ok: false, error: "地址里不要附带密钥或 token。" };
    }
  }

  const local = host === "localhost" || host === "127.0.0.1" || host === "::1";
  if (url.protocol === "http:" && local) return { ok: true, url: normalize(url) };
  if (url.protocol !== "https:") {
    return { ok: false, error: "请使用 https 地址。本机调试可以用 http://localhost。" };
  }
  return { ok: true, url: normalize(url) };
}

export async function requestForecast(workerUrl, payload) {
  let response;
  try {
    response = await fetch(workerUrl, {
      method: "POST",
      referrerPolicy: "no-referrer",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageBase64: payload.imageBase64,
        mimeType: payload.mimeType,
        occasion: payload.occasion,
      }),
      signal: AbortSignal.timeout(45_000),
    });
  } catch {
    throw new Error("没有连上预报服务。可以稍后再试，或先看预览示例。照片还在这台设备上。");
  }

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }
  if (!response.ok || !data?.ok || !data.forecast) {
    throw new Error(cleanError(data?.error) || "这次没有得到完整预报。照片没有被网站保存。");
  }
  return data.forecast;
}

export async function probeWorker(workerUrl) {
  const response = await fetch(workerUrl, {
    method: "GET",
    referrerPolicy: "no-referrer",
    signal: AbortSignal.timeout(8_000),
  });
  const data = await response.json();
  if (!response.ok || data?.ok !== true || data?.service !== "makeup-weather") {
    throw new Error("地址有响应，但不是这个项目的预报服务。");
  }
  return data;
}

function normalize(url) {
  url.hash = "";
  return url.toString();
}

function cleanError(value) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  if (!text || text.length > 160) return "";
  return text;
}
