export function todayParts(date = new Date()) {
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
  return {
    label: `${map.year}年${Number(map.month)}月${Number(map.day)}日 ${map.weekday}`,
    stamp: `${map.year}${map.month}${map.day}`,
  };
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return "";
  if (bytes < 1024) return `${Math.round(bytes)} B`;
  const kb = bytes / 1024;
  if (kb < 10) return `${kb.toFixed(1)} KB`;
  return `${Math.round(kb)} KB`;
}

export function withToday(forecast) {
  return { ...forecast, dateLabel: todayParts().label };
}
