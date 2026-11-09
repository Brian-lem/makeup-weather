export function extractForecastObject(payload) {
  const content = payload?.choices?.[0]?.message?.content;
  let text = "";
  if (typeof content === "string") {
    text = content;
  } else if (Array.isArray(content)) {
    text = content
      .map((part) => {
        if (typeof part === "string") return part;
        if (typeof part?.text === "string") return part.text;
        return "";
      })
      .join("\n");
  } else {
    fail("模型响应里没有文本。");
  }

  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start < 0 || end <= start) fail("模型没有返回 JSON。");
  const slice = trimmed.slice(start, end + 1).replace(/,\s*([}\]])/g, "$1");
  try {
    return JSON.parse(slice);
  } catch {
    fail("模型返回的 JSON 读不出来。");
  }
}

function fail(message) {
  const error = new Error(message);
  error.code = "bad_model_output";
  throw error;
}
