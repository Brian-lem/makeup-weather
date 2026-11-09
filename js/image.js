const MAX_EDGE = 1280;
const JPEG_QUALITY = 0.86;
const MAX_FILE_BYTES = 12 * 1024 * 1024;
const MAX_PIXELS = 40_000_000;

export async function readPhoto(file) {
  if (!file) throw new Error("请选择一张图片。");
  const type = (file.type || "").toLowerCase();
  const name = (file.name || "").toLowerCase();
  const extensionOk = /\.(jpe?g|png|webp|heic|heif)$/.test(name);
  if (type && !type.startsWith("image/")) {
    throw new Error("请选择 JPG、PNG 或 WebP 图片。");
  }
  if (!type && !extensionOk) {
    throw new Error("请选择 JPG、PNG 或 WebP 图片。");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("原图超过 12MB，请换一张小一点的。");
  }

  const source = await decodeImage(file);
  try {
    const size = sourceSize(source);
    if (!size.width || !size.height) throw new Error("这张图没有尺寸，换一张试试。");
    if (size.width * size.height > MAX_PIXELS) throw new Error("这张图太大了，请换一张。");

    const scale = Math.min(1, MAX_EDGE / Math.max(size.width, size.height));
    const width = Math.max(1, Math.round(size.width * scale));
    const height = Math.max(1, Math.round(size.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("这台浏览器没能处理这张图。");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(source, 0, 0, width, height);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
    if (!blob) throw new Error("压缩没有成功，请换一张 JPG 或 PNG。");
    const imageBase64 = await blobToBase64(blob);
    return {
      imageBase64,
      mimeType: "image/jpeg",
      previewUrl: URL.createObjectURL(blob),
      width,
      height,
      bytes: blob.size,
    };
  } finally {
    source.close?.();
  }
}

async function decodeImage(file) {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      try {
        return await createImageBitmap(file);
      } catch {
        // Fall through to HTMLImageElement for formats the bitmap path rejects.
      }
    }
  }
  const url = URL.createObjectURL(file);
  try {
    return await loadImage(url);
  } catch {
    throw new Error("这张图浏览器读不了，请先导出成 JPG 再试。");
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("decode"));
    image.src = url;
  });
}

function sourceSize(source) {
  if (typeof HTMLImageElement !== "undefined" && source instanceof HTMLImageElement) {
    return { width: source.naturalWidth, height: source.naturalHeight };
  }
  return { width: source.width, height: source.height };
}

async function blobToBase64(blob) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  const stride = 0x8000;
  for (let index = 0; index < bytes.length; index += stride) {
    binary += String.fromCharCode(...bytes.subarray(index, index + stride));
  }
  return btoa(binary);
}
