# Skycast – Weather App

A modern weather app built with **vanilla JavaScript** (no framework, no build step, no API key).
Search any city and see the current weather, a 24-hour chart, a 7-day forecast, air quality and your saved cities.

**Live demo:** https://alaa-emad-dev.github.io/weather-app/

## Features
- City search with live suggestions (keyboard friendly: arrows + Enter)
- "Use my location" button (browser geolocation)
- Current weather: temperature, feels like, humidity, wind, rain chance, UV index
- Hand-made SVG chart for the next 24 hours + hour-by-hour list
- 7-day forecast with temperature range bars
- Details page: sunrise/sunset with sun position, air quality (US AQI, PM2.5, PM10, ozone), pressure, cloud cover
- Saved cities (star button), stored in `localStorage`, with live temperatures
- °C / °F switch (also changes wind and rain units), remembered between visits
- Background colors change with the weather and with day/night
- Loading skeletons, clear error messages (city not found, network down, API error)
- Responsive: top tabs on desktop, bottom navigation on mobile
- Accessible: labels, keyboard focus styles, `aria-live`, reduced-motion support

## Tech
- HTML, CSS (custom properties, grid, flexbox, `backdrop-filter`) and **ES modules**
- [Open-Meteo](https://open-meteo.com/) Forecast, Geocoding and Air Quality APIs (free, no key)
- `fetch` with `async/await`, `AbortController` for search requests, `localStorage`, URL-hash routing

## Project structure
```
index.html        page shell (header, tabs, #view container)
style.css         all styling and the weather "sky" themes
main.js        app controller: state, routing, events
api.js         all network requests (Open-Meteo)
views.js       functions that return the HTML for each page
chart.js       SVG temperature chart
icons.js       weather code -> label, icon and sky theme
store.js       localStorage helpers (units, last city, saved cities)
```

## Run locally
ES modules need a web server (opening the file directly will not work):
```
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy
It is plain static files, so it runs on GitHub Pages: Settings → Pages → Deploy from branch → `main` / root.

## What I learned / notes
- Splitting code into modules (API, state, views) keeps each file small and easy to read.
- Always handle loading and error states; networks fail.
- Out-of-order responses are ignored with a request token so an old search can't overwrite a new one.

Weather data by [Open-Meteo.com](https://open-meteo.com/) (CC BY 4.0).
Built with AI assistance (code reviewed and understood by the author).
