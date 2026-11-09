import { el } from "./dom.js";
import { dimensionSvg, iconSvg, mountSvg } from "./icons.js";

const DIMENSIONS = [
  ["skin", "肤质天气"],
  ["light", "五官光线"],
  ["color", "色彩风向"],
  ["moisture", "妆容湿度"],
];

const RECIPE_FIELDS = [
  ["base", "底妆"],
  ["eyes", "眉眼"],
  ["lips", "唇色"],
  ["technique", "手法"],
];

export function renderForecast(root, forecast, { sample, onDownload, onBack }) {
  const iconHost = el("div", { class: "hero-icon" });
  mountSvg(iconHost, iconSvg(forecast.icon));

  const title = el("h2", {
    id: "weather-title",
    class: "weather-title",
    tabindex: "-1",
    text: forecast.weatherTitle,
  });

  const error = el("p", { id: "result-error", class: "home-error", role: "alert" });
  const fallback = el("a", {
    id: "share-fallback",
    class: "share-fallback",
    hidden: true,
  });

  const sheet = el("article", { class: "sheet", "data-sample": sample ? "true" : "false" }, [
    el("header", { class: "sheet-mast" }, [
      el("p", { class: "kicker", text: "今日妆容天气预报" }),
      el("p", { class: "date", text: forecast.dateLabel || "" }),
      el("p", {
        class: "mode-note",
        text: sample
          ? "预览示例 · 没有读取照片，也没有联网"
          : "照片只留在这次浏览里，用来预览和做分享卡，网站没有保存它",
      }),
    ]),
    el("div", { class: "sheet-hero" }, [
      iconHost,
      el("div", {}, [
        title,
        el("p", { class: "sentence", text: forecast.sentence || "" }),
      ]),
    ]),
    el("section", { class: "score-block", "aria-label": "出镜指数" }, [
      el("p", {
        class: "score-number",
        "data-score": String(forecast.score),
        text: String(forecast.score),
      }),
      el("div", {}, [
        el("p", { class: "score-label", text: "出镜指数" }),
        el("p", {
          class: "score-note",
          text: "刻度只落在 78 到 96，用来形容今天适不适合被看见。它是捧场，不是评分，更不是诊断。",
        }),
      ]),
    ]),
    el("section", {}, [
      el("h3", { text: "四维天气" }),
      dimensionList(forecast),
    ]),
    el("section", { class: "compliments" }, [
      el("h3", { text: "三句想告诉你的" }),
      el(
        "ol",
        {},
        (forecast.compliments || []).map((line) => el("li", { "data-compliment": "true", text: line })),
      ),
    ]),
    el("section", { class: "recipes" }, [
      el("h3", { text: "三套出门配方" }),
      el("p", { class: "recipe-intro", text: `这次更贴「${forecast.focusOccasion || "通勤"}」。另外两套也写好了，换场合可以直接用。` }),
      el(
        "div",
        { class: "recipe-grid" },
        (forecast.recipes || []).map((recipe) => recipeCard(recipe, forecast.focusOccasion)),
      ),
    ]),
    el("aside", { class: "tip" }, [
      el("h3", { text: "一句轻轻的提醒" }),
      el("p", { "data-tip": "true", text: forecast.tip || "" }),
    ]),
    error,
    el("div", { class: "sheet-actions" }, [
      el("button", { type: "button", class: "btn btn-primary", id: "download-card", onClick: onDownload, text: "下载竖版分享卡" }),
      el("button", { type: "button", class: "btn btn-line", id: "back-home", onClick: onBack, text: "返回修改" }),
    ]),
    fallback,
    el("p", { class: "fineprint", text: "美学娱乐建议，不是医疗诊断。" }),
  ]);

  root.replaceChildren(sheet);
  title.focus();
}

function dimensionList(forecast) {
  const list = el("ul", { class: "dimensions" });
  for (const [key, name] of DIMENSIONS) {
    const item = forecast.dimensions?.[key] || {};
    const iconHost = el("div", { class: "dimension-icon" });
    mountSvg(iconHost, dimensionSvg(key));
    list.append(
      el("li", { class: "dimension", "data-dimension": key }, [
        iconHost,
        el("div", {}, [
          el("p", { class: "dimension-name", text: name }),
          el("p", { class: "dimension-summary", text: item.summary || "" }),
          el("p", { class: "dimension-detail", text: item.detail || "" }),
        ]),
      ]),
    );
  }
  return list;
}

function recipeCard(recipe, focus) {
  const focused = recipe.occasion === focus;
  return el("article", {
    class: focused ? "recipe is-focus" : "recipe",
    "data-occasion": recipe.occasion,
  }, [
    el("header", { class: "recipe-head" }, [
      el("h3", { text: recipe.occasion }),
      focused ? el("span", { class: "ribbon", text: "今天更贴这套" }) : null,
    ]),
    ...RECIPE_FIELDS.map(([key, label]) =>
      el("p", { class: "recipe-field" }, [el("span", { text: label }), recipe[key] || ""]),
    ),
  ]);
}
