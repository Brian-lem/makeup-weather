import { todayParts } from "./format.js";
import { iconSvg } from "./icons.js";

const SANS = '"PingFang SC", "Hiragino Sans GB", "Noto Sans SC", "Microsoft YaHei", "WenQuanYi Micro Hei", "Droid Sans Fallback", sans-serif';
const SERIF = '"Songti SC", "STSong", "Noto Serif SC", "Source Han Serif SC", "SimSun", "WenQuanYi Micro Hei", "Droid Sans Fallback", serif';
const LATIN = '"Iowan Old Style", Palatino, "Palatino Linotype", "Times New Roman", serif';

const WIDTH = 1080;
const HEIGHT = 1620;
let previousUrl = "";

export async function downloadShareCard(forecast, { sample = false, previewUrl = "" } = {}) {
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("这台浏览器做不出分享卡。");

  const photo = !sample && previewUrl ? await loadOptional(previewUrl) : null;
  const icon = await loadSvg(forecast.icon);
  drawCard(context, forecast, { photo, icon, sample });

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("分享卡没有导出成功。");
  const filename = `今日妆容天气预报-${todayParts().stamp}.png`;
  const url = URL.createObjectURL(blob);
  if (previousUrl) URL.revokeObjectURL(previousUrl);
  previousUrl = url;

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  return { url, filename };
}

function drawCard(context, forecast, { photo, icon, sample }) {
  const gradient = context.createLinearGradient(0, 0, 0, HEIGHT);
  gradient.addColorStop(0, "#f7f1e8");
  gradient.addColorStop(0.55, "#f3eee6");
  gradient.addColorStop(1, "#eadfd8");
  context.fillStyle = gradient;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  context.strokeStyle = "rgba(36, 28, 23, 0.18)";
  context.lineWidth = 2;
  context.strokeRect(36, 36, WIDTH - 72, HEIGHT - 72);

  let y = 86;
  center(context, "MAKEUP WEATHER", LATIN, 22, "#8d6b3a", y);
  y += 40;
  center(context, "今日妆容天气预报", SANS, 30, "#241c17", y);
  y += 42;
  center(context, forecast.dateLabel || "", SANS, 24, "#5e544c", y);
  y += 34;
  context.strokeStyle = "#9d454c";
  context.lineWidth = 1.5;
  context.beginPath();
  context.moveTo(180, y);
  context.lineTo(WIDTH - 180, y);
  context.stroke();
  y += 36;

  if (photo) {
    drawPhoto(context, photo, WIDTH / 2, y + 116, 112);
    y += 260;
  } else if (icon) {
    context.drawImage(icon, WIDTH / 2 - 70, y, 140, 140);
    y += 168;
  } else {
    y += 24;
  }

  if (sample) drawStamp(context, WIDTH - 150, 150);

  const titleLines = wrap(context, forecast.weatherTitle || "", SERIF, 56, 880);
  for (const line of titleLines.slice(0, 2)) {
    center(context, line, SERIF, 56, "#241c17", y);
    y += 72;
  }
  y += 8;
  const sentenceLines = wrap(context, forecast.sentence || "", SANS, 30, 860);
  for (const line of sentenceLines.slice(0, 3)) {
    center(context, line, SANS, 30, "#3f342e", y);
    y += 46;
  }
  y += 18;

  context.textAlign = "left";
  context.textBaseline = "top";
  context.fillStyle = "#6f3036";
  context.font = `600 108px ${SERIF}`;
  context.fillText(String(forecast.score ?? ""), 100, y);
  context.fillStyle = "#241c17";
  context.font = `600 28px ${SANS}`;
  context.fillText("出镜指数", 360, y + 18);
  context.fillStyle = "#5e544c";
  context.font = `400 24px ${SANS}`;
  const note = wrap(context, "78–96 的捧场刻度，不是诊断。", SANS, 24, 560);
  note.slice(0, 2).forEach((line, index) => {
    context.fillText(line, 360, y + 58 + index * 34);
  });
  y += 160;

  const entries = [
    ["肤质天气", forecast.dimensions?.skin?.summary],
    ["五官光线", forecast.dimensions?.light?.summary],
    ["色彩风向", forecast.dimensions?.color?.summary],
    ["妆容湿度", forecast.dimensions?.moisture?.summary],
  ];
  const cardW = 430;
  const cardH = 112;
  entries.forEach((entry, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = 96 + column * (cardW + 28);
    const top = y + row * (cardH + 16);
    roundRect(context, x, top, cardW, cardH, 18);
    context.fillStyle = "rgba(255, 252, 247, 0.72)";
    context.fill();
    context.fillStyle = "#8d6b3a";
    context.font = `500 22px ${SANS}`;
    context.fillText(entry[0], x + 24, top + 22);
    context.fillStyle = "#241c17";
    context.font = `600 30px ${SERIF}`;
    context.fillText(entry[1] || "柔和", x + 24, top + 58);
  });
  y += cardH * 2 + 16 + 36;

  const compliment = forecast.compliments?.[0] || "";
  const complimentLines = wrap(context, compliment, SERIF, 32, 860);
  complimentLines.slice(0, 2).forEach((line) => {
    center(context, line, SERIF, 32, "#241c17", y);
    y += 48;
  });
  y += 16;

  roundRect(context, 96, y, WIDTH - 192, 132, 20);
  context.fillStyle = "rgba(157, 69, 76, 0.08)";
  context.fill();
  context.textAlign = "left";
  context.fillStyle = "#6f3036";
  context.font = `600 22px ${SANS}`;
  context.fillText("一句轻轻的提醒", 124, y + 22);
  context.fillStyle = "#241c17";
  context.font = `400 26px ${SANS}`;
  wrap(context, forecast.tip || "", SANS, 26, 800)
    .slice(0, 2)
    .forEach((line, index) => context.fillText(line, 124, y + 62 + index * 36));

  context.textAlign = "center";
  context.fillStyle = "#5e544c";
  context.font = `400 22px ${SANS}`;
  context.fillText("美学娱乐建议，不是医疗诊断 · 照片未被网站保存", WIDTH / 2, 1528);
}

function drawPhoto(context, image, cx, cy, radius) {
  context.save();
  context.beginPath();
  context.arc(cx, cy, radius, 0, Math.PI * 2);
  context.clip();
  const scale = Math.max((radius * 2) / image.width, (radius * 2) / image.height);
  const dw = image.width * scale;
  const dh = image.height * scale;
  context.drawImage(image, cx - dw / 2, cy - dh / 2, dw, dh);
  context.restore();
  context.beginPath();
  context.arc(cx, cy, radius + 8, 0, Math.PI * 2);
  context.strokeStyle = "#9d454c";
  context.lineWidth = 3;
  context.stroke();
}

function drawStamp(context, x, y) {
  context.save();
  context.translate(x, y);
  context.rotate(-0.18);
  context.beginPath();
  context.arc(0, 0, 54, 0, Math.PI * 2);
  context.strokeStyle = "#9d454c";
  context.lineWidth = 3;
  context.stroke();
  context.fillStyle = "#9d454c";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `600 28px ${SANS}`;
  context.fillText("示例", 0, 2);
  context.restore();
}

function center(context, text, family, size, color, y) {
  context.fillStyle = color;
  context.font = `600 ${size}px ${family}`;
  context.textAlign = "center";
  context.textBaseline = "top";
  context.fillText(text, WIDTH / 2, y);
}

function wrap(context, text, family, size, maxWidth) {
  context.font = `600 ${size}px ${family}`;
  const lines = [];
  let line = "";
  for (const char of [...String(text)]) {
    const next = line + char;
    if (context.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = char;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function roundRect(context, x, y, width, height, radius) {
  context.beginPath();
  if (typeof context.roundRect === "function") {
    context.roundRect(x, y, width, height, radius);
    return;
  }
  context.moveTo(x + radius, y);
  context.arcTo(x + width, y, x + width, y + height, radius);
  context.arcTo(x + width, y + height, x, y + height, radius);
  context.arcTo(x, y + height, x, y, radius);
  context.arcTo(x, y, x + width, y, radius);
  context.closePath();
}

function loadOptional(url) {
  return loadImage(url).catch(() => null);
}

function loadSvg(name) {
  const blob = new Blob([iconSvg(name)], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  return loadImage(url)
    .catch(() => null)
    .finally(() => URL.revokeObjectURL(url));
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("image"));
    image.src = url;
  });
}
