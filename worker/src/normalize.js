export const OCCASIONS = ["通勤", "约会", "轻松出门"];
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const ICONS = new Set(["rose-sun", "soft-cloud", "dew", "breeze", "moon", "haze", "clear", "mist-rain"]);

const DIMENSIONS = [
  ["skin", "肤质天气"],
  ["light", "五官光线"],
  ["color", "色彩风向"],
  ["moisture", "妆容湿度"],
];

const FALLBACK_COMPLIMENTS = [
  "今天的光线站在你这边。",
  "气色看着干净，适合被近处看见。",
  "五官清楚，妆不用做满。",
];

const FALLBACK_RECIPES = {
  通勤: {
    base: "薄涂一层接近肤色的底妆，只在需要的地方再按一下。",
    eyes: "眉色淡淡补在空隙里，眼尾用灰棕轻轻拉开。",
    lips: "豆沙或玫瑰奶茶，用指腹晕开唇线。",
    technique: "粉扑按压，不要来回擦，最后用大刷把边缘扫匀。",
  },
  约会: {
    base: "遮瑕留在眼下和鼻翼，颧骨最高处点一点细高光。",
    eyes: "眼皮中段铺一层暖杏，眼尾细细加深，眉尾顺着骨线收住。",
    lips: "玫瑰豆沙先铺满，唇中心再叠一点更饱和的颜色。",
    technique: "腮红从太阳穴斜向唇角，边缘用干净的刷子晕开。",
  },
  轻松出门: {
    base: "润色隔离打底，遮瑕只点一颗在最需要的地方。",
    eyes: "眉毛梳顺即可，深棕眼影沿睫毛根轻扫，代替眼线。",
    lips: "带一点颜色的润唇膏，比口红色更轻。",
    technique: "用手温把妆按进皮肤，宁少勿多，保留皮肤自己的光。",
  },
};

export function assertOccasion(value) {
  if (!OCCASIONS.includes(value)) {
    throw coded("场合需要是通勤、约会或轻松出门。", "bad_request");
  }
  return value;
}

export function assertImage(body) {
  const mimeType = body?.mimeType;
  if (!ALLOWED_MIME.has(mimeType)) {
    throw coded("只接受 JPEG、PNG 或 WebP。", "bad_request");
  }
  const imageBase64 = String(body.imageBase64 || "").replace(/\s+/g, "");
  if (imageBase64.startsWith("data:")) {
    throw coded("请只传 base64 正文，不要带 data: 前缀。", "bad_request");
  }
  if (imageBase64.length > 2_500_000) {
    throw coded("照片太大了。", "too_large");
  }
  if (imageBase64.length < 40 || !/^[A-Za-z0-9+/]+={0,2}$/.test(imageBase64)) {
    throw coded("照片不是有效的 base64。", "bad_request");
  }
  if (!magicOk(mimeType, imageBase64)) {
    throw coded("文件内容和图片类型对不上。", "bad_request");
  }
  return { imageBase64, mimeType };
}

export function normalizeForecast(raw, { occasion }) {
  assertOccasion(occasion);
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw coded("模型没有返回预报。", "bad_model_output");
  }
  const weatherTitle = clip(raw.weatherTitle, 16);
  const sentence = clip(raw.sentence, 90);
  if (!weatherTitle || !sentence) {
    throw coded("模型返回的预报不完整。", "bad_model_output");
  }

  const dimensions = {};
  for (const [key, name] of DIMENSIONS) {
    const source = raw.dimensions?.[key] || {};
    dimensions[key] = {
      name,
      summary: clip(source.summary, 16) || "柔和",
      detail: clip(source.detail, 80) || "今天适合薄妆，把皮肤自己的光留住。",
    };
  }

  const given = Array.isArray(raw.compliments)
    ? raw.compliments.map((item) => clip(item, 60)).filter(Boolean)
    : [];
  const compliments = [];
  for (const item of [...given, ...FALLBACK_COMPLIMENTS]) {
    if (compliments.length === 3) break;
    if (!compliments.includes(item)) compliments.push(item);
  }

  const byOccasion = new Map();
  if (Array.isArray(raw.recipes)) {
    for (const recipe of raw.recipes) {
      if (recipe && OCCASIONS.includes(recipe.occasion)) byOccasion.set(recipe.occasion, recipe);
    }
  }
  const recipes = OCCASIONS.map((name) => {
    const source = byOccasion.get(name) || {};
    const fallback = FALLBACK_RECIPES[name];
    return {
      occasion: name,
      base: clip(source.base, 80) || fallback.base,
      eyes: clip(source.eyes, 80) || fallback.eyes,
      lips: clip(source.lips, 80) || fallback.lips,
      technique: clip(source.technique, 80) || fallback.technique,
    };
  });

  let score = Math.round(Number(raw.score));
  if (!Number.isFinite(score)) score = 88;
  score = Math.min(96, Math.max(78, score));

  return {
    weatherTitle,
    icon: ICONS.has(raw.icon) ? raw.icon : "rose-sun",
    sentence,
    score,
    dimensions,
    compliments,
    recipes,
    tip: clip(raw.tip, 80) || "出门前到窗边对一下颜色，自然光比室内灯更接近别人看见的你。",
    dateLabel: shanghaiLabel(),
    focusOccasion: occasion,
  };
}

export function shanghaiLabel(date = new Date()) {
  const map = Object.fromEntries(
    new Intl.DateTimeFormat("zh-CN", {
      timeZone: "Asia/Shanghai",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "long",
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value]),
  );
  return `${map.year}年${Number(map.month)}月${Number(map.day)}日 ${map.weekday}`;
}

function magicOk(mimeType, imageBase64) {
  if (mimeType === "image/jpeg") return imageBase64.startsWith("/9j/");
  if (mimeType === "image/png") return imageBase64.startsWith("iVBORw0KGgo");
  if (mimeType === "image/webp") return imageBase64.startsWith("UklGR");
  return false;
}

function clip(value, max) {
  const clean = String(value ?? "")
    .replace(/[\u0000-\u001F]+/g, " ")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1)}…`;
}

function coded(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}
