// Small wrapper around localStorage (it can throw in private mode, so we guard it).
const read = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const write = (key, value) => {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
};

export const prefs = {
  units: () => read("skycast.units", "metric"),
  setUnits: (u) => write("skycast.units", u),
};

export const lastPlace = {
  get: () => read("skycast.place", null),
  set: (p) => write("skycast.place", p),
};

const samePlace = (a, b) => Math.abs(a.latitude - b.latitude) < 0.01 && Math.abs(a.longitude - b.longitude) < 0.01;

export const saved = {
  list: () => read("skycast.saved", []),
  has: (p) => saved.list().some((s) => samePlace(s, p)),
  toggle(p) {
    const list = saved.list();
    const next = saved.has(p) ? list.filter((s) => !samePlace(s, p)) : [...list, p];
    write("skycast.saved", next);
    return next;
  },
  remove(p) { write("skycast.saved", saved.list().filter((s) => !samePlace(s, p))); },
};
