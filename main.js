// App controller: state, routing (URL hash), events.
import { searchCities, fetchWeather, fetchAir, fetchMany, ApiError } from "./api.js";
import { prefs, lastPlace, saved } from "./store.js";
import { describe } from "./icons.js";
import * as v from "./views.js";

const $ = (sel) => document.querySelector(sel);
const view = $("#view");
const state = {
  route: "today", place: lastPlace.get(), units: prefs.units(),
  weather: null, air: null, loading: false, error: "",
  savedPlaces: saved.list(), savedData: null,
};
let loadToken = 0; // ignore answers from older requests

// ---------- rendering ----------
function render() {
  document.querySelectorAll(".tabs a").forEach((a) => a.classList.toggle("active", a.dataset.route === state.route));
  $("#unit-btn").textContent = state.units === "metric" ? "°C" : "°F";
  document.title = state.place && state.weather ? `${state.place.name} ${Math.round(state.weather.current.temperature_2m)}° · Skycast` : "Skycast – Weather App";

  if (state.route === "saved") { view.innerHTML = v.savedView(state); return; }
  if (state.loading) { view.innerHTML = v.skeleton(); return; }
  if (state.error) { view.innerHTML = v.errorCard(state.error); return; }
  if (!state.weather) { view.innerHTML = v.welcome(); return; }
  state.isSaved = saved.has(state.place);
  const views = { today: v.todayView, forecast: v.forecastView, details: v.detailsView };
  view.innerHTML = (views[state.route] || v.todayView)(state);
}

function setSky() {
  const sky = $(".sky");
  if (!state.weather) { document.body.dataset.sky = "clear-day"; return; }
  const c = state.weather.current;
  document.body.dataset.sky = describe(c.weather_code, c.is_day).sky;
}

// ---------- data ----------
async function loadPlace(place) {
  const token = ++loadToken;
  state.place = place; state.loading = true; state.error = "";
  lastPlace.set(place);
  render();
  try {
    const [weather, air] = await Promise.all([fetchWeather(place, state.units), fetchAir(place)]);
    if (token !== loadToken) return;
    state.weather = weather; state.air = air;
  } catch (err) {
    if (token !== loadToken) return;
    state.weather = null;
    state.error = err instanceof ApiError ? err.message : "Unexpected error. Please try again.";
  }
  state.loading = false;
  setSky(); render();
}

async function loadSaved() {
  state.savedPlaces = saved.list(); state.savedData = null; render();
  if (!state.savedPlaces.length) return;
  try { state.savedData = await fetchMany(state.savedPlaces, state.units); }
  catch { toast("Couldn't load saved cities' weather."); }
  if (state.route === "saved") render();
}

// ---------- routing ----------
function onRoute() {
  const r = location.hash.replace("#/", "") || "today";
  state.route = ["today", "forecast", "details", "saved"].includes(r) ? r : "today";
  if (state.route === "saved") loadSaved(); else render();
  window.scrollTo({ top: 0 });
}
window.addEventListener("hashchange", onRoute);

// ---------- toast ----------
let toastTimer;
function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.hidden = false;
  clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.hidden = true), 3000);
}

// ---------- search with suggestions ----------
const input = $("#city-input"), list = $("#suggestions");
let suggestions = [], active = -1, searchCtl, debounce;

function showSuggestions(items, message) {
  suggestions = items; active = -1;
  if (!items.length && !message) { list.hidden = true; return; }
  list.innerHTML = message
    ? `<li class="sug-msg">${v.esc(message)}</li>`
    : items.map((p, i) => `<li role="option" id="sug-${i}" data-i="${i}"><strong>${v.esc(p.name)}</strong><span>${v.esc([p.admin1, p.country].filter(Boolean).join(", "))}</span></li>`).join("");
  list.hidden = false;
}

input.addEventListener("input", () => {
  clearTimeout(debounce);
  const q = input.value.trim();
  if (q.length < 2) { showSuggestions([]); return; }
  debounce = setTimeout(async () => {
    searchCtl?.abort(); searchCtl = new AbortController();
    try {
      const results = await searchCities(q, searchCtl.signal);
      results.length ? showSuggestions(results) : showSuggestions([], `No city found for "${q}"`);
    } catch (err) {
      if (err.name !== "AbortError") showSuggestions([], err.message);
    }
  }, 250);
});

function choose(place) {
  showSuggestions([]); input.value = ""; input.blur();
  location.hash = "#/today";
  loadPlace(place);
}
list.addEventListener("mousedown", (e) => { // mousedown fires before the input loses focus
  const li = e.target.closest("[data-i]");
  if (li) { e.preventDefault(); choose(suggestions[+li.dataset.i]); }
});
input.addEventListener("keydown", (e) => {
  if (e.key === "ArrowDown" || e.key === "ArrowUp") {
    e.preventDefault();
    if (!suggestions.length) return;
    active = (active + (e.key === "ArrowDown" ? 1 : -1) + suggestions.length) % suggestions.length;
    [...list.children].forEach((li, i) => li.classList.toggle("active", i === active));
  } else if (e.key === "Escape") showSuggestions([]);
});
input.addEventListener("blur", () => setTimeout(() => (list.hidden = true), 100));
$("#search-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const q = input.value.trim();
  if (!q) return;
  if (suggestions.length) { choose(suggestions[Math.max(active, 0)]); return; }
  try {
    const results = await searchCities(q);
    if (results.length) choose(results[0]);
    else { state.error = `No city found for "${q}". Check the spelling and try again.`; state.weather = null; location.hash = "#/today"; render(); }
  } catch (err) { state.error = err.message; render(); }
});

// ---------- buttons ----------
$("#unit-btn").addEventListener("click", () => {
  state.units = state.units === "metric" ? "imperial" : "metric";
  prefs.setUnits(state.units);
  if (state.place) loadPlace(state.place);
  if (state.route === "saved") loadSaved();
  render();
});

$("#locate-btn").addEventListener("click", () => {
  if (!navigator.geolocation) { toast("Your browser doesn't support location."); return; }
  toast("Finding your location…");
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => choose({ name: "My location", admin1: "", country: "", latitude: +coords.latitude.toFixed(3), longitude: +coords.longitude.toFixed(3) }),
    () => toast("Location blocked. Allow it in your browser or search for a city."),
    { timeout: 10000 }
  );
});

view.addEventListener("click", (e) => {
  const el = e.target.closest("[data-action]");
  if (!el) return;
  const a = el.dataset.action;
  if (a === "retry") state.place ? loadPlace(state.place) : (state.error = "", render());
  if (a === "pick") choose(JSON.parse(el.dataset.place));
  if (a === "toggle-save") {
    const had = saved.has(state.place);
    saved.toggle(state.place); state.savedPlaces = saved.list();
    toast(had ? "Removed from saved cities" : "Saved!"); render();
  }
  if (a === "remove-saved") {
    saved.remove(state.savedPlaces[+el.dataset.index]);
    state.savedPlaces = saved.list(); loadSaved();
  }
});

// ---------- start ----------
onRoute();
if (state.place) loadPlace(state.place); else loadPlace({ name: "Cairo", admin1: "Cairo Governorate", country: "Egypt", latitude: 30.06263, longitude: 31.24967 });
