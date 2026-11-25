// Weather codes (WMO) -> label, icon name and "sky" theme.
// Icons are small inline SVGs so they look the same on every device.

const CLOUD = '<path d="M18 48h28a10 10 0 0 0 1.2-19.9A15 15 0 0 0 19 31.5 8.8 8.8 0 0 0 18 48z" fill="#f1f5f9"/>';
const CLOUD_DARK = CLOUD.replace("#f1f5f9", "#cbd5e1");
const SUN_RAYS = [0, 45, 90, 135, 180, 225, 270, 315]
  .map((a) => `<line x1="32" y1="6" x2="32" y2="12" transform="rotate(${a} 32 32)"/>`).join("");

const ICONS = {
  sun: `<g stroke="#fdb813" stroke-width="4" stroke-linecap="round">${SUN_RAYS}</g><circle cx="32" cy="32" r="12" fill="#fdb813"/>`,
  moon: `<path d="M44 40A18 18 0 0 1 24 14a18 18 0 1 0 20 26z" fill="#e2e8f0"/><circle cx="46" cy="16" r="1.8" fill="#e2e8f0"/><circle cx="52" cy="26" r="1.2" fill="#e2e8f0"/>`,
  "partly-day": `<circle cx="24" cy="24" r="10" fill="#fdb813"/><g stroke="#fdb813" stroke-width="3.5" stroke-linecap="round">${[0, 60, 120, 180, 240, 300].map((a) => `<line x1="24" y1="4" x2="24" y2="8" transform="rotate(${a} 24 24)"/>`).join("")}</g>${CLOUD}`,
  "partly-night": `<path d="M32 28A12 12 0 0 1 20 8a12 12 0 1 0 12 20z" fill="#e2e8f0"/>${CLOUD}`,
  cloud: CLOUD,
  overcast: `<path d="M26 34h24a8 8 0 0 0 1-15.9A12 12 0 0 0 28 20a7 7 0 0 0-2 14z" fill="#94a3b8"/>${CLOUD}`,
  fog: `${CLOUD_DARK}<g stroke="#e2e8f0" stroke-width="3.5" stroke-linecap="round"><line x1="16" y1="54" x2="48" y2="54"/><line x1="22" y1="60" x2="52" y2="60"/></g>`,
  drizzle: `${CLOUD}<g stroke="#7dd3fc" stroke-width="3" stroke-linecap="round"><line x1="24" y1="52" x2="22" y2="57"/><line x1="34" y1="52" x2="32" y2="57"/><line x1="44" y1="52" x2="42" y2="57"/></g>`,
  rain: `${CLOUD_DARK}<g stroke="#38bdf8" stroke-width="3.5" stroke-linecap="round"><line x1="23" y1="52" x2="19" y2="60"/><line x1="33" y1="52" x2="29" y2="60"/><line x1="43" y1="52" x2="39" y2="60"/></g>`,
  snow: `${CLOUD}<g fill="#fff" stroke="#bae6fd" stroke-width="1"><circle cx="22" cy="55" r="3"/><circle cx="33" cy="58" r="3"/><circle cx="44" cy="55" r="3"/></g>`,
  storm: `${CLOUD_DARK}<polygon points="34,44 26,56 32,56 29,64 42,50 35,50 38,44" fill="#fde047"/>`,
};

// code -> [label, icon (day), icon (night), sky]
const T = {
  0: ["Clear sky", "sun", "moon", "clear"],
  1: ["Mostly clear", "sun", "moon", "clear"],
  2: ["Partly cloudy", "partly-day", "partly-night", "cloudy"],
  3: ["Overcast", "overcast", "overcast", "cloudy"],
  45: ["Fog", "fog", "fog", "fog"], 48: ["Freezing fog", "fog", "fog", "fog"],
  51: ["Light drizzle", "drizzle", "drizzle", "rain"], 53: ["Drizzle", "drizzle", "drizzle", "rain"], 55: ["Heavy drizzle", "drizzle", "drizzle", "rain"],
  56: ["Freezing drizzle", "drizzle", "drizzle", "rain"], 57: ["Freezing drizzle", "drizzle", "drizzle", "rain"],
  61: ["Light rain", "rain", "rain", "rain"], 63: ["Rain", "rain", "rain", "rain"], 65: ["Heavy rain", "rain", "rain", "rain"],
  66: ["Freezing rain", "rain", "rain", "rain"], 67: ["Freezing rain", "rain", "rain", "rain"],
  71: ["Light snow", "snow", "snow", "snow"], 73: ["Snow", "snow", "snow", "snow"], 75: ["Heavy snow", "snow", "snow", "snow"], 77: ["Snow grains", "snow", "snow", "snow"],
  80: ["Light showers", "rain", "rain", "rain"], 81: ["Showers", "rain", "rain", "rain"], 82: ["Violent showers", "rain", "rain", "rain"],
  85: ["Snow showers", "snow", "snow", "snow"], 86: ["Heavy snow showers", "snow", "snow", "snow"],
  95: ["Thunderstorm", "storm", "storm", "storm"], 96: ["Thunderstorm with hail", "storm", "storm", "storm"], 99: ["Thunderstorm with hail", "storm", "storm", "storm"],
};

export function describe(code, isDay = 1) {
  const [label, day, night, sky] = T[code] || ["Unknown", "cloud", "cloud", "cloudy"];
  return { label, icon: isDay ? day : night, sky: sky === "clear" ? (isDay ? "clear-day" : "clear-night") : (sky === "cloudy" && !isDay ? "cloudy-night" : sky) };
}

export function icon(name, size = 64, label = "") {
  const a11y = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
  return `<svg class="wx-icon" viewBox="0 0 64 64" width="${size}" height="${size}" ${a11y}>${ICONS[name] || ICONS.cloud}</svg>`;
}
