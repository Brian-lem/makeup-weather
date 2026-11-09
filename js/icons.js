const WEATHER = {
  "rose-sun": `
    <circle cx="32" cy="32" r="9"/>
    <path d="M32 8v6M32 50v6M8 32h6M50 32h6M14.5 14.5l4.2 4.2M45.3 45.3l4.2 4.2M49.5 14.5l-4.2 4.2M18.7 45.3l-4.2 4.2"/>
    <path d="M32 27c2.2 2.4 2.2 5.2 0 8-2.2-2.8-2.2-5.6 0-8z"/>`,
  "soft-cloud": `
    <path d="M20 42h24a9 9 0 0 0 1.2-17.9A13 13 0 0 0 20.2 28 8 8 0 0 0 20 42z"/>
    <path d="M18 18h.1M44 16h.1"/>`,
  dew: `
    <path d="M32 10c8 12 16 18 16 28a16 16 0 0 1-32 0c0-10 8-16 16-28z"/>
    <path d="M26 36c1.5 3 4 4 6 4"/>`,
  breeze: `
    <path d="M10 24h30a6 6 0 1 0-6-6"/>
    <path d="M10 34h38a6 6 0 1 1-6 6"/>
    <path d="M10 44h22"/>`,
  moon: `
    <path d="M36 12a16 16 0 1 0 10 28 13 13 0 1 1-10-28z"/>`,
  haze: `
    <path d="M12 26h40M12 34h40M12 42h28"/>
    <circle cx="44" cy="16" r="5"/>`,
  clear: `
    <circle cx="32" cy="32" r="10"/>
    <path d="M32 8v5M32 51v5M8 32h5M51 32h5M14 14l3.5 3.5M46.5 46.5 50 50M50 14l-3.5 3.5M14 50l3.5-3.5"/>`,
  "mist-rain": `
    <path d="M22 36h22a8 8 0 0 0 1-15.8A12 12 0 0 0 22.4 24 7 7 0 0 0 22 36z"/>
    <path d="M24 44l-2 7M33 44l-2 7M42 44l-2 7"/>`,
};

const DIMENSIONS = {
  skin: `<circle cx="32" cy="28" r="12"/><path d="M18 48c2.5-7 8-10 14-10s11.5 3 14 10"/>`,
  light: `<circle cx="32" cy="32" r="8"/><path d="M32 12v6M32 46v6M12 32h6M46 32h6M17 17l4 4M43 43l4 4M47 17l-4 4M17 47l4-4"/>`,
  color: `<circle cx="26" cy="32" r="10"/><circle cx="38" cy="32" r="10"/>`,
  moisture: `<path d="M12 30c6 0 6-6 12-6s6 6 12 6 6-6 12-6"/><path d="M12 42c6 0 6-6 12-6s6 6 12 6 6-6 12-6"/>`,
};

export const WEATHER_ICONS = Object.keys(WEATHER);

export function iconSvg(name) {
  const body = WEATHER[name] || WEATHER["rose-sun"];
  return svg(body);
}

export function dimensionSvg(name) {
  return svg(DIMENSIONS[name] || DIMENSIONS.skin);
}

export function mountSvg(parent, markup) {
  const holder = document.createElement("div");
  holder.className = "svg-icon";
  holder.setAttribute("aria-hidden", "true");
  holder.innerHTML = markup;
  parent.replaceChildren(holder);
}

function svg(body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}
