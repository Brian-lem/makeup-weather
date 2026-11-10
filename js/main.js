import {
  clearWorkerUrl,
  devOverrideEnabled,
  probeWorker,
  readWorkerUrl,
  requestForecast,
  resolveApiUrl,
  validateWorkerUrl,
  writeWorkerUrl,
} from "./api.js";
import { formatBytes, todayParts, withToday } from "./format.js";
import { readPhoto } from "./image.js";
import { buildMock } from "./mock.js";
import { renderForecast } from "./render.js";
import { downloadShareCard } from "./share.js";

const LOADING_LINES = ["正在看今天的光线", "正在把气色写成天气", "正在配三套出门的手法"];

let photo = null;
let busy = false;
let currentForecast = null;
let currentSample = false;
let shareUrl = "";

function init() {
  const today = document.getElementById("today");
  if (today) today.textContent = todayParts().label;
  if (devOverrideEnabled()) {
    const settingsButton = document.getElementById("open-settings");
    if (settingsButton) settingsButton.hidden = false;
    refreshConnection();
  }

  document.getElementById("station")?.addEventListener("submit", (event) => event.preventDefault());
  document.getElementById("open-settings")?.addEventListener("click", () => openSettings());
  document.getElementById("close-settings")?.addEventListener("click", () => {
    document.getElementById("settings-dialog")?.close();
  });
  document.getElementById("settings-form")?.addEventListener("submit", saveWorker);
  document.getElementById("clear-worker")?.addEventListener("click", clearWorker);
  document.getElementById("test-worker")?.addEventListener("click", testWorker);
  document.getElementById("photo")?.addEventListener("change", (event) => {
    const file = event.target.files?.[0];
    if (file) void onFile(file);
  });

  const dropzone = document.getElementById("dropzone");
  dropzone?.addEventListener("dragover", (event) => {
    event.preventDefault();
    dropzone.classList.add("is-drag");
  });
  dropzone?.addEventListener("dragleave", () => dropzone.classList.remove("is-drag"));
  dropzone?.addEventListener("drop", (event) => {
    event.preventDefault();
    dropzone.classList.remove("is-drag");
    const file = event.dataTransfer?.files?.[0];
    if (file) void onFile(file);
  });

  document.getElementById("clear-photo")?.addEventListener("click", clearPhoto);
  document.getElementById("preview")?.addEventListener("click", () => void preview());
  document.getElementById("generate")?.addEventListener("click", () => void generateLive());
}

async function onFile(file) {
  clearPhoto();
  setHomeError("");
  const meta = document.getElementById("photo-meta");
  if (meta) meta.textContent = "正在这台设备上压缩…";
  try {
    photo = await readPhoto(file);
    const preview = document.getElementById("photo-preview");
    preview.src = photo.previewUrl;
    preview.hidden = false;
    if (meta) {
      meta.textContent = `已在本地收成 JPEG，${photo.width}×${photo.height}，约 ${formatBytes(photo.bytes)}。重编码时去掉了原图里的位置信息。`;
    }
    document.getElementById("generate").disabled = false;
    document.getElementById("clear-photo").hidden = false;
  } catch (error) {
    if (meta) meta.textContent = "";
    setHomeError(error.message || "这张图没有读出来。");
    const input = document.getElementById("photo");
    if (input) input.value = "";
  }
}

function clearPhoto() {
  if (photo?.previewUrl) URL.revokeObjectURL(photo.previewUrl);
  photo = null;
  const preview = document.getElementById("photo-preview");
  if (preview) {
    preview.hidden = true;
    preview.removeAttribute("src");
  }
  const meta = document.getElementById("photo-meta");
  if (meta) meta.textContent = "";
  const generate = document.getElementById("generate");
  if (generate) generate.disabled = true;
  const clear = document.getElementById("clear-photo");
  if (clear) clear.hidden = true;
  const input = document.getElementById("photo");
  if (input) input.value = "";
}

async function preview() {
  const occasion = currentOccasion();
  await runBusy(async () => {
    await wait(500);
    showResult(buildMock(occasion), { sample: true });
  });
}

async function generateLive() {
  if (!photo) {
    setHomeError("先选一张自拍，或直接看预览示例。");
    return;
  }
  const occasion = currentOccasion();
  const payload = {
    imageBase64: photo.imageBase64,
    mimeType: photo.mimeType,
    occasion,
  };
  const endpoint = resolveApiUrl();
  await runBusy(async () => {
    const forecast = withToday(await requestForecast(endpoint, payload));
    showResult(forecast, { sample: false });
  });
}

function showResult(forecast, { sample }) {
  currentForecast = forecast;
  currentSample = sample;
  const root = document.getElementById("result");
  renderForecast(root, forecast, {
    sample,
    onDownload: () => void onDownload(),
    onBack: () => {
      show("home");
      document.getElementById("generate")?.focus();
    },
  });
  show("result");
}

async function onDownload() {
  if (!currentForecast) return;
  const button = document.getElementById("download-card");
  if (button) button.disabled = true;
  const error = document.getElementById("result-error");
  if (error) error.textContent = "";
  try {
    const file = await downloadShareCard(currentForecast, {
      sample: currentSample,
      previewUrl: currentSample ? "" : photo?.previewUrl || "",
    });
    if (shareUrl && shareUrl !== file.url) URL.revokeObjectURL(shareUrl);
    shareUrl = file.url;
    const fallback = document.getElementById("share-fallback");
    if (fallback) {
      fallback.href = file.url;
      fallback.download = file.filename;
      fallback.hidden = false;
      fallback.textContent = "如果没有自动下载，点此保存分享卡";
    }
  } catch (downloadError) {
    if (error) error.textContent = downloadError.message || "分享卡没有做成。";
  } finally {
    if (button) button.disabled = false;
  }
}

async function runBusy(task) {
  if (busy) return;
  busy = true;
  show("loading");
  const timer = startLoadingText();
  try {
    await task();
  } catch (error) {
    show("home");
    setHomeError(error.message || "没有完成。");
  } finally {
    clearInterval(timer);
    busy = false;
  }
}

function show(name) {
  document.getElementById("home").hidden = name !== "home";
  document.getElementById("loading").hidden = name !== "loading";
  document.getElementById("result").hidden = name !== "result";
}

function startLoadingText() {
  const node = document.getElementById("loading-text");
  let index = 0;
  if (node) node.textContent = LOADING_LINES[0];
  return setInterval(() => {
    index = (index + 1) % LOADING_LINES.length;
    if (node) node.textContent = LOADING_LINES[index];
  }, 1600);
}

function currentOccasion() {
  return document.querySelector('input[name="occasion"]:checked')?.value || "通勤";
}

function setHomeError(message) {
  const node = document.getElementById("home-error");
  if (node) node.textContent = message || "";
}

function refreshConnection() {
  const button = document.getElementById("open-settings");
  if (!button || !devOverrideEnabled()) return;
  const check = validateWorkerUrl(readWorkerUrl());
  if (!check.ok) {
    button.textContent = "接入设置 · 内置服务";
    return;
  }
  let host = "";
  try {
    host = new URL(check.url).host;
  } catch {
    host = "";
  }
  button.textContent = host ? `接入设置 · 已改用 ${host}` : "接入设置 · 已改用";
}

function openSettings(errorText = "") {
  if (!devOverrideEnabled()) return;
  const input = document.getElementById("worker-url");
  if (input) input.value = readWorkerUrl();
  const error = document.getElementById("settings-error");
  const message = document.getElementById("settings-message");
  if (error) error.textContent = errorText;
  if (message) message.textContent = "";
  document.getElementById("settings-dialog")?.showModal();
  input?.focus();
}

function saveWorker(event) {
  event.preventDefault();
  const input = document.getElementById("worker-url");
  const result = validateWorkerUrl(input?.value || "");
  const error = document.getElementById("settings-error");
  const message = document.getElementById("settings-message");
  if (message) message.textContent = "";
  if (!result.ok) {
    if (error) error.textContent = result.error;
    return;
  }
  writeWorkerUrl(result.url);
  if (error) error.textContent = "";
  if (message) message.textContent = "地址已保存在这台浏览器里。密钥不在这里。";
  refreshConnection();
}

function clearWorker() {
  clearWorkerUrl();
  const input = document.getElementById("worker-url");
  if (input) input.value = "";
  const message = document.getElementById("settings-message");
  const error = document.getElementById("settings-error");
  if (error) error.textContent = "";
  if (message) message.textContent = "已从这台浏览器清除地址。";
  refreshConnection();
}

async function testWorker() {
  const input = document.getElementById("worker-url");
  const result = validateWorkerUrl(input?.value || "");
  const error = document.getElementById("settings-error");
  const message = document.getElementById("settings-message");
  if (message) message.textContent = "";
  if (!result.ok) {
    if (error) error.textContent = result.error;
    return;
  }
  const button = document.getElementById("test-worker");
  if (button) button.disabled = true;
  try {
    await probeWorker(result.url);
    if (error) error.textContent = "";
    if (message) message.textContent = `可以访问 ${new URL(result.url).host}。密钥不要写进网页。`;
  } catch (probeError) {
    if (message) message.textContent = "";
    if (error) {
      error.textContent = probeError.message || "没有连上。请确认地址，以及它允许这个网页的来源。";
    }
  } finally {
    if (button) button.disabled = false;
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

if (typeof document !== "undefined") init();
