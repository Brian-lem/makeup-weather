import { corsHeaders, isAllowedOrigin } from "./cors.js";
import { createLimiter } from "./limit.js";
import { extractForecastObject } from "./model.js";
import { assertImage, assertOccasion, normalizeForecast } from "./normalize.js";
import { buildPrompt } from "./prompt.js";

const ENDPOINT = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
const MODEL = "qwen3-vl-plus";
const limiter = createLimiter({ limit: 8, windowMs: 60_000 });

function json(data, status, request) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      ...corsHeaders(request),
    },
  });
}

export async function handleRequest(request, env = {}) {
  const origin = request.headers.get("Origin");
  if (origin && !isAllowedOrigin(origin)) {
    return json({ ok: false, error: "这个来源不能调用预报。", code: "forbidden_origin" }, 403, request);
  }

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  if (request.method === "GET") {
    return json({ ok: true, service: "makeup-weather", storesPhotos: false }, 200, request);
  }

  if (request.method !== "POST") {
    return json({ ok: false, error: "只接受 POST。", code: "method_not_allowed" }, 405, request);
  }

  const ip = (request.headers.get("CF-Connecting-IP") || request.headers.get("X-Forwarded-For") || "anonymous")
    .split(",")[0]
    .trim();
  if (limiter(ip)) {
    return json({ ok: false, error: "这一分钟的预报有点多，请稍后再试。", code: "rate_limited" }, 429, request);
  }

  const declared = Number(request.headers.get("Content-Length") || 0);
  if (declared > 3_000_000) {
    return json({ ok: false, error: "照片太大了。", code: "too_large" }, 413, request);
  }

  let body;
  try {
    const text = await request.text();
    if (text.length > 3_000_000) {
      return json({ ok: false, error: "照片太大了。", code: "too_large" }, 413, request);
    }
    body = JSON.parse(text);
  } catch {
    return json({ ok: false, error: "请求不是 JSON。", code: "bad_request" }, 400, request);
  }

  let occasion = "";
  let imageBase64 = "";
  let mimeType = "";
  try {
    occasion = assertOccasion(body?.occasion);
    const image = assertImage(body || {});
    imageBase64 = image.imageBase64;
    mimeType = image.mimeType;
  } catch (error) {
    const status = error.code === "too_large" ? 413 : 400;
    return json({ ok: false, error: error.message, code: error.code || "bad_request" }, status, request);
  }

  const apiKey = env?.DASHSCOPE_API_KEY;
  if (!apiKey || typeof apiKey !== "string") {
    return json(
      {
        ok: false,
        error: "Worker 还没有配置 DASHSCOPE_API_KEY。密钥只放在 Cloudflare，不要写进网页。",
        code: "unconfigured",
      },
      500,
      request,
    );
  }

  let upstream;
  try {
    upstream = await fetch(ENDPOINT, {
      method: "POST",
      redirect: "manual",
      signal: AbortSignal.timeout(25_000),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.7,
        max_tokens: 1800,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${imageBase64}` },
              },
              { type: "text", text: buildPrompt(occasion) },
            ],
          },
        ],
      }),
    });
  } catch {
    return json({ ok: false, error: "预报服务暂时没有接上。", code: "upstream" }, 502, request);
  }

  if (upstream.status >= 300 && upstream.status < 400) {
    return json({ ok: false, error: "预报服务暂时没有接上。", code: "upstream" }, 502, request);
  }
  if (!upstream.ok) {
    const denied = upstream.status === 401 || upstream.status === 403;
    const busy = upstream.status === 429;
    return json(
      {
        ok: false,
        error: denied
          ? "密钥被上游拒绝。请检查 Cloudflare 里的 DASHSCOPE_API_KEY，不要把密钥填进网页。"
          : busy
            ? "上游有点忙，请稍后再试。"
            : "预报服务暂时没有接上。",
        code: denied ? "upstream_auth" : "upstream",
      },
      502,
      request,
    );
  }

  let payload;
  try {
    payload = await upstream.json();
  } catch {
    return json({ ok: false, error: "预报结果读不出来。", code: "bad_model_output" }, 502, request);
  }

  try {
    const forecast = normalizeForecast(extractForecastObject(payload), { occasion });
    return json({ ok: true, forecast }, 200, request);
  } catch {
    return json(
      { ok: false, error: "这次没有整理出完整预报。照片没有被保存。", code: "bad_model_output" },
      502,
      request,
    );
  }
}

export default {
  fetch(request, env) {
    return handleRequest(request, env);
  },
};
