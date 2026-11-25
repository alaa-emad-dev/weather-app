// Each view is a function that takes data and returns an HTML string.
// User-controlled text (city names) always goes through esc() first.
import { describe, icon } from "./icons.js";
import { hourlyChart } from "./chart.js";

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

const deg = (n) => `${Math.round(n)}°`;
const timeOf = (iso) => iso.slice(11, 16);
const hourLabel = (iso) => { const h = +iso.slice(11, 13); return `${h % 12 || 12}${h < 12 ? "am" : "pm"}`; };
const dayName = (iso, i) => (i === 0 ? "Today" : new Date(iso + "T12:00:00").toLocaleDateString("en-US", { weekday: "long" }));
const shortDate = (iso) => new Date(iso + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
const compass = (d) => ["N", "NE", "E", "SE", "S", "SW", "W", "NW"][Math.round(d / 45) % 8];
export const placeName = (p) => [p.name, p.admin1, p.country].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(", ");
const windUnit = (u) => (u === "imperial" ? "mph" : "km/h");

export function nextHours(w, count = 24) {
  const now = w.current.time.slice(0, 13);
  let start = w.hourly.time.findIndex((t) => t.slice(0, 13) >= now);
  if (start < 0) start = 0;
  return Array.from({ length: count }, (_, k) => {
    const i = start + k;
    return { time: w.hourly.time[i], label: k === 0 ? "Now" : hourLabel(w.hourly.time[i]), temp: w.hourly.temperature_2m[i], rain: w.hourly.precipitation_probability[i] ?? 0, code: w.hourly.weather_code[i], isDay: w.hourly.is_day[i] };
  }).filter((h) => h.time);
}

export function skeleton() {
  return `<div class="card skeleton hero-skel"></div><div class="grid-4"><div class="card skeleton"></div><div class="card skeleton"></div><div class="card skeleton"></div><div class="card skeleton"></div></div><div class="card skeleton chart-skel"></div>`;
}

export function errorCard(message) {
  return `<div class="card center-card" role="alert">
    <div class="big-emoji">${icon("cloud", 72)}</div>
    <h2>Something went wrong</h2><p>${esc(message)}</p>
    <button class="primary-btn" data-action="retry">Try again</button></div>`;
}

export function welcome() {
  const picks = [["Cairo", 30.06263, 31.24967, "Cairo Governorate", "Egypt"], ["London", 51.50853, -0.12574, "England", "United Kingdom"], ["Tokyo", 35.6895, 139.69171, "Tokyo", "Japan"], ["New York", 40.71427, -74.00597, "New York", "United States"], ["Dubai", 25.07725, 55.30927, "Dubai", "United Arab Emirates"]];
  return `<div class="card center-card">
    <div class="big-emoji">${icon("partly-day", 84)}</div>
    <h2>Welcome to Skycast</h2>
    <p>Search for a city above, use your location, or pick one:</p>
    <div class="chips">${picks.map(([name, latitude, longitude, admin1, country]) =>
      `<button class="chip" data-action="pick" data-place='${esc(JSON.stringify({ name, latitude, longitude, admin1, country }))}'>${esc(name)}</button>`).join("")}</div></div>`;
}

export function todayView(s) {
  const { weather: w, place, units } = s;
  const cur = w.current;
  const d = describe(cur.weather_code, cur.is_day);
  const hours = nextHours(w);
  const isSaved = s.isSaved;
  const date = new Date(cur.time).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  return `
  <section class="card hero">
    <div class="hero-top">
      <div>
        <h1 class="place">${esc(placeName(place))}</h1>
        <p class="muted">${date} · ${timeOf(cur.time)} local time</p>
      </div>
      <button class="icon-btn ${isSaved ? "on" : ""}" data-action="toggle-save" aria-pressed="${isSaved}" title="${isSaved ? "Remove from saved" : "Save city"}" aria-label="${isSaved ? "Remove from saved cities" : "Save this city"}">
        <svg viewBox="0 0 24 24" width="22" height="22"><path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" fill="${isSaved ? "currentColor" : "none"}" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>
      </button>
    </div>
    <div class="hero-main">
      ${icon(d.icon, 120, d.label)}
      <div><div class="temp">${deg(cur.temperature_2m)}</div><div class="cond">${esc(d.label)}</div></div>
    </div>
    <p class="muted hi-lo">H ${deg(w.daily.temperature_2m_max[0])} · L ${deg(w.daily.temperature_2m_min[0])} · Feels like ${deg(cur.apparent_temperature)}</p>
  </section>

  <section class="grid-4">
    ${stat("Humidity", `${cur.relative_humidity_2m}%`, "droplet")}
    ${stat("Wind", `${Math.round(cur.wind_speed_10m)} ${windUnit(units)} ${compass(cur.wind_direction_10m)}`, "wind")}
    ${stat("Rain chance", `${w.daily.precipitation_probability_max[0] ?? 0}%`, "rain")}
    ${stat("UV index", `${Math.round(w.daily.uv_index_max[0])} · ${uvLevel(w.daily.uv_index_max[0])}`, "uv")}
  </section>

  <section class="card">
    <h2 class="card-title">Next 24 hours</h2>
    <div class="chart-scroll">${hourlyChart(hours)}</div>
  </section>

  <section class="card">
    <h2 class="card-title">Hour by hour</h2>
    <ul class="hours">${hours.map((h) => {
      const hd = describe(h.code, h.isDay);
      return `<li><span>${h.label}</span>${icon(hd.icon, 36, hd.label)}<strong>${deg(h.temp)}</strong><span class="rain-tag">${h.rain}%</span></li>`;
    }).join("")}</ul>
  </section>`;
}

const STAT_ICONS = {
  droplet: '<path d="M12 3s6 6.2 6 10.5A6 6 0 0 1 6 13.5C6 9.2 12 3 12 3z"/>',
  wind: '<path d="M3 9h10a3 3 0 1 0-3-3M3 15h14a3 3 0 1 1-3 3M3 12h7"/>',
  rain: '<path d="M7 16a4 4 0 0 1-.5-8A5.5 5.5 0 0 1 17 9a3.5 3.5 0 0 1 0 7zM9 19l-1 2m5-2-1 2m5-2-1 2"/>',
  uv: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M19 5l-2 2M7 17l-2 2"/>',
};
const stat = (label, value, ic) => `<div class="card stat"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${STAT_ICONS[ic]}</svg><span class="muted">${label}</span><strong>${value}</strong></div>`;

function uvLevel(v) { return v < 3 ? "Low" : v < 6 ? "Moderate" : v < 8 ? "High" : v < 11 ? "Very high" : "Extreme"; }

export function forecastView(s) {
  const d = s.weather.daily;
  const min = Math.min(...d.temperature_2m_min), max = Math.max(...d.temperature_2m_max);
  const span = max - min || 1;
  return `<section class="card">
    <h2 class="card-title">7-day forecast · ${esc(s.place.name)}</h2>
    <ul class="days">${d.time.map((t, i) => {
      const dd = describe(d.weather_code[i], 1);
      const left = ((d.temperature_2m_min[i] - min) / span) * 100;
      const width = Math.max(((d.temperature_2m_max[i] - d.temperature_2m_min[i]) / span) * 100, 6);
      return `<li>
        <div class="day-name"><strong>${dayName(t, i)}</strong><span class="muted">${shortDate(t)}</span></div>
        <div class="day-icon">${icon(dd.icon, 38, dd.label)}<span class="rain-tag">${d.precipitation_probability_max[i] ?? 0}%</span></div>
        <div class="day-cond muted">${esc(dd.label)}</div>
        <div class="range"><span class="lo">${deg(d.temperature_2m_min[i])}</span>
          <div class="bar"><i style="left:${left}%;width:${width}%"></i></div>
          <span class="hi">${deg(d.temperature_2m_max[i])}</span></div>
      </li>`;
    }).join("")}</ul></section>`;
}

const aqiLevel = (v) => v <= 50 ? ["Good", "#22c55e"] : v <= 100 ? ["Moderate", "#eab308"] : v <= 150 ? ["Unhealthy for sensitive groups", "#f97316"] : v <= 200 ? ["Unhealthy", "#ef4444"] : v <= 300 ? ["Very unhealthy", "#a855f7"] : ["Hazardous", "#9f1239"];

export function detailsView(s) {
  const { weather: w, air, units } = s;
  const c = w.current;
  const rise = w.daily.sunrise[0], set = w.daily.sunset[0];
  const t = (iso) => new Date(iso).getTime();
  const progress = Math.min(Math.max((t(c.time) - t(rise)) / (t(set) - t(rise)), 0), 1);
  const daylight = (t(set) - t(rise)) / 36e5;
  const dh = Math.floor(daylight), dm = Math.round((daylight - dh) * 60);
  // Position of the sun on a half-circle arc.
  const angle = Math.PI * (1 - progress);
  const sx = 100 + 80 * Math.cos(angle), sy = 100 - 80 * Math.sin(angle);
  const uv = w.daily.uv_index_max[0];
  const [aqiText, aqiColor] = air && air.us_aqi != null ? aqiLevel(air.us_aqi) : [];
  return `<div class="grid-2">
    <section class="card">
      <h2 class="card-title">Sunrise & sunset</h2>
      <svg viewBox="0 0 200 120" class="sun-arc" role="img" aria-label="Sun position">
        <path d="M20 100A80 80 0 0 1 180 100" fill="none" stroke="rgba(255,255,255,.3)" stroke-width="3" stroke-dasharray="4 6"/>
        <line x1="10" y1="100" x2="190" y2="100" stroke="rgba(255,255,255,.4)"/>
        ${progress > 0 && progress < 1 ? `<circle cx="${sx}" cy="${sy}" r="9" fill="#fdb813"/>` : ""}
      </svg>
      <div class="two-col"><div><span class="muted">Sunrise</span><strong>${timeOf(rise)}</strong></div><div><span class="muted">Sunset</span><strong>${timeOf(set)}</strong></div></div>
      <p class="muted">Daylight: ${dh}h ${dm}m</p>
    </section>

    <section class="card">
      <h2 class="card-title">Air quality</h2>
      ${air && air.us_aqi != null ? `
        <div class="aqi"><strong style="color:${aqiColor}">${Math.round(air.us_aqi)}</strong><span>${aqiText}</span></div>
        <div class="meter"><i style="width:${Math.min(air.us_aqi / 3, 100)}%;background:${aqiColor}"></i></div>
        <ul class="kv"><li><span>PM2.5</span><strong>${Math.round(air.pm2_5)} µg/m³</strong></li><li><span>PM10</span><strong>${Math.round(air.pm10)} µg/m³</strong></li><li><span>Ozone</span><strong>${Math.round(air.ozone)} µg/m³</strong></li></ul>`
        : `<p class="muted">Air quality data isn't available for this location.</p>`}
    </section>

    <section class="card">
      <h2 class="card-title">UV index</h2>
      <div class="aqi"><strong>${Math.round(uv)}</strong><span>${uvLevel(uv)}</span></div>
      <div class="meter uv"><i style="width:${Math.min((uv / 11) * 100, 100)}%"></i></div>
      <p class="muted">Highest value expected today.</p>
    </section>

    <section class="card">
      <h2 class="card-title">Conditions now</h2>
      <ul class="kv">
        <li><span>Wind</span><strong><span class="arrow" style="transform:rotate(${c.wind_direction_10m + 180}deg)">↑</span> ${Math.round(c.wind_speed_10m)} ${windUnit(units)} ${compass(c.wind_direction_10m)}</strong></li>
        <li><span>Pressure</span><strong>${Math.round(c.pressure_msl)} hPa</strong></li>
        <li><span>Humidity</span><strong>${c.relative_humidity_2m}%</strong></li>
        <li><span>Cloud cover</span><strong>${c.cloud_cover}%</strong></li>
        <li><span>Precipitation</span><strong>${c.precipitation} ${units === "imperial" ? "in" : "mm"}</strong></li>
      </ul>
    </section></div>`;
}

export function savedView(s) {
  if (s.savedPlaces.length === 0) {
    return `<div class="card center-card"><div class="big-emoji">${icon("partly-day", 72)}</div><h2>No saved cities yet</h2><p>Open a city and tap the star to save it here.</p></div>`;
  }
  const rows = s.savedPlaces.map((p, i) => {
    const w = s.savedData?.[i];
    const d = w ? describe(w.current.weather_code, w.current.is_day) : null;
    return `<li class="saved-item">
      <button class="saved-main" data-action="pick" data-place='${esc(JSON.stringify(p))}'>
        <div><strong>${esc(p.name)}</strong><span class="muted">${esc([p.admin1, p.country].filter(Boolean).join(", "))}</span></div>
        ${w ? `<div class="saved-wx">${icon(d.icon, 40, d.label)}<div><strong class="saved-temp">${deg(w.current.temperature_2m)}</strong><span class="muted">H ${deg(w.daily.temperature_2m_max[0])} L ${deg(w.daily.temperature_2m_min[0])}</span></div></div>` : `<div class="skeleton mini"></div>`}
      </button>
      <button class="icon-btn" data-action="remove-saved" data-index="${i}" aria-label="Remove ${esc(p.name)}" title="Remove">✕</button>
    </li>`;
  }).join("");
  return `<section class="card"><h2 class="card-title">Saved cities</h2><ul class="saved-list">${rows}</ul></section>`;
}
