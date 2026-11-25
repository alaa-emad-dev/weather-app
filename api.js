// All network calls live here. Open-Meteo is free and needs no API key.
const GEO = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST = "https://api.open-meteo.com/v1/forecast";
const AIR = "https://air-quality-api.open-meteo.com/v1/air-quality";

export class ApiError extends Error {}

async function getJSON(url, signal) {
  let res;
  try {
    res = await fetch(url, { signal });
  } catch (err) {
    if (err.name === "AbortError") throw err;
    throw new ApiError("Can't reach the weather service. Check your internet connection and try again.");
  }
  if (!res.ok) throw new ApiError(`The weather service had a problem (error ${res.status}). Please try again later.`);
  return res.json();
}

export async function searchCities(query, signal, count = 6) {
  const url = `${GEO}?name=${encodeURIComponent(query)}&count=${count}&language=en&format=json`;
  const data = await getJSON(url, signal);
  return data.results || [];
}

const unitParams = (units) =>
  units === "imperial"
    ? { temperature_unit: "fahrenheit", wind_speed_unit: "mph", precipitation_unit: "inch" }
    : { temperature_unit: "celsius", wind_speed_unit: "kmh", precipitation_unit: "mm" };

export function fetchWeather(place, units) {
  const params = new URLSearchParams({
    latitude: place.latitude,
    longitude: place.longitude,
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,weather_code,is_day,pressure_msl,precipitation,cloud_cover",
    hourly: "temperature_2m,precipitation_probability,weather_code,is_day",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_sum,precipitation_probability_max,wind_speed_10m_max",
    timezone: "auto",
    forecast_days: 7,
    ...unitParams(units),
  });
  return getJSON(`${FORECAST}?${params}`);
}

// Air quality is a bonus: if it fails we just hide that card.
export async function fetchAir(place) {
  try {
    const params = new URLSearchParams({ latitude: place.latitude, longitude: place.longitude, current: "us_aqi,pm2_5,pm10,ozone", timezone: "auto" });
    return (await getJSON(`${AIR}?${params}`)).current || null;
  } catch {
    return null;
  }
}

// One request for many saved cities: Open-Meteo accepts comma separated coordinates.
export async function fetchMany(places, units) {
  if (places.length === 0) return [];
  const params = new URLSearchParams({
    latitude: places.map((p) => p.latitude).join(","),
    longitude: places.map((p) => p.longitude).join(","),
    current: "temperature_2m,weather_code,is_day",
    daily: "temperature_2m_max,temperature_2m_min",
    timezone: "auto",
    forecast_days: 1,
    ...unitParams(units),
  });
  const data = await getJSON(`${FORECAST}?${params}`);
  return Array.isArray(data) ? data : [data];
}
