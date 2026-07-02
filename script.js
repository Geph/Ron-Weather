/* =========================================================
   Glen Ellyn Weather — data + rendering
   API: Open-Meteo (free, no key, no account required)
   ========================================================= */

"use strict";

// Glen Ellyn, IL
const LATITUDE = 41.8775;
const LONGITUDE = -88.0670;
const TIMEZONE = "America/Chicago";

const API_URL =
  "https://api.open-meteo.com/v1/forecast" +
  "?latitude=" + LATITUDE +
  "&longitude=" + LONGITUDE +
  "&current=temperature_2m,weather_code" +
  "&hourly=temperature_2m,weather_code" +
  "&daily=weather_code,temperature_2m_max,temperature_2m_min,sunset" +
  "&temperature_unit=fahrenheit" +
  "&timezone=" + encodeURIComponent(TIMEZONE) +
  "&forecast_days=10";

// Refresh the data every 30 minutes so the page can be left
// open all day and stay current.
const REFRESH_MINUTES = 30;

/* ---------- Plain-English sky conditions ----------
   Open-Meteo uses standard WMO weather codes. We translate
   them into short, simple words — no jargon. */
const SKY_CONDITIONS = {
  0: "Sunny",
  1: "Mostly Sunny",
  2: "Partly Cloudy",
  3: "Cloudy",
  45: "Foggy",
  48: "Foggy",
  51: "Light Drizzle",
  53: "Drizzle",
  55: "Heavy Drizzle",
  56: "Freezing Drizzle",
  57: "Freezing Drizzle",
  61: "Light Rain",
  63: "Rain",
  65: "Heavy Rain",
  66: "Freezing Rain",
  67: "Freezing Rain",
  71: "Light Snow",
  73: "Snow",
  75: "Heavy Snow",
  77: "Snow",
  80: "Rain Showers",
  81: "Rain Showers",
  82: "Heavy Rain Showers",
  85: "Snow Showers",
  86: "Heavy Snow Showers",
  95: "Thunderstorm",
  96: "Thunderstorm with Hail",
  99: "Thunderstorm with Hail"
};

// Codes 0 and 1 mean clear skies — at night that is
// "Clear", not "Sunny".
const NIGHT_OVERRIDES = { 0: "Clear", 1: "Mostly Clear" };

function skyCondition(code, isNight) {
  if (isNight && NIGHT_OVERRIDES[code]) return NIGHT_OVERRIDES[code];
  return SKY_CONDITIONS[code] || "See Outside";
}

/* ---------- Formatting helpers ---------- */

/* The API returns times as plain wall-clock strings in Chicago
   time with no UTC offset (e.g. "2026-07-01T20:15"). Parsing and
   formatting them without any timezone conversion displays the
   correct Glen Ellyn time no matter where the page is viewed. */

// "2026-07-01T20:15" -> "8:15 PM"
function formatClockTime(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit"
  });
}

// "2026-07-01T21:00" -> "9 PM"
function formatHourLabel(isoString) {
  const date = new Date(isoString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric"
  });
}

// "2026-07-02" -> "Thursday"; today -> "Today"; tomorrow -> "Tomorrow"
function formatDayLabel(dateString, index) {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  // Parse as local noon to avoid any timezone edge cases.
  const date = new Date(dateString + "T12:00:00");
  return date.toLocaleDateString("en-US", { weekday: "long" });
}

function roundTemp(value) {
  return Math.round(value);
}

// True if the given hour is before sunrise-ish or after sunset,
// approximated simply: 8 PM–6 AM counts as night for wording.
function isNightHour(isoString) {
  const hour = new Date(isoString).getHours();
  return hour >= 20 || hour < 6;
}

/* ---------- Icon & sky theme mapping ---------- */

function weatherKind(code, isNight) {
  if (code <= 1) return isNight ? "clear-night" : "clear-day";
  if (code === 2) return isNight ? "partly-night" : "partly-day";
  if (code === 3) return "cloudy";
  if (code === 45 || code === 48) return "fog";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "rain";
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return "snow";
  if (code >= 95) return "thunder";
  return "cloudy";
}

function skyThemeClass(code, isNight) {
  const kind = weatherKind(code, isNight);
  const map = {
    "clear-day": "sky-clear-day",
    "clear-night": "sky-clear-night",
    "partly-day": "sky-partly-day",
    "partly-night": "sky-partly-night",
    cloudy: "sky-cloudy",
    fog: "sky-fog",
    rain: "sky-rain",
    snow: "sky-snow",
    thunder: "sky-thunder"
  };
  return map[kind] || "sky-default";
}

function setSkyTheme(code, isNight) {
  const theme = skyThemeClass(code, isNight);
  document.body.className = theme;
}

/* Bold, simple SVG icons — decorative only (text labels carry meaning) */
const ICONS = {
  "clear-day":
    '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">' +
    '<circle cx="32" cy="32" r="16" fill="#FFE600"/>' +
    '<g stroke="#FFE600" stroke-width="4" stroke-linecap="round">' +
    '<line x1="32" y1="4" x2="32" y2="12"/>' +
    '<line x1="32" y1="52" x2="32" y2="60"/>' +
    '<line x1="4" y1="32" x2="12" y2="32"/>' +
    '<line x1="52" y1="32" x2="60" y2="32"/>' +
    '<line x1="12.2" y1="12.2" x2="17.9" y2="17.9"/>' +
    '<line x1="46.1" y1="46.1" x2="51.8" y2="51.8"/>' +
    '<line x1="12.2" y1="51.8" x2="17.9" y2="46.1"/>' +
    '<line x1="46.1" y1="17.9" x2="51.8" y2="12.2"/>' +
    "</g></svg>",

  "clear-night":
    '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">' +
    '<path d="M44 10c-10 2-17 11-17 22 0 13 10 23 23 23 3 0 6-.5 8.5-1.5C52 62 42 64 32 64 15 64 2 51 2 34S15 4 32 4c5 0 9.5 1 13.5 3C43 5 44 7 44 10z" fill="#FFE600"/>' +
    "</svg>",

  "partly-day":
    '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">' +
    '<circle cx="22" cy="22" r="10" fill="#FFE600"/>' +
    '<path d="M18 44h32a12 12 0 0 0-4.2-23.2A14 14 0 0 0 18 44z" fill="#FFFFFF"/>' +
    "</svg>",

  "partly-night":
    '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">' +
    '<path d="M36 8c-7 1-12 7-12 14 0 8 6 14 14 14 2 0 4-.3 5.5-1A16 16 0 1 0 36 8z" fill="#FFE600"/>' +
    '<path d="M16 46h36a10 10 0 0 0-3.5-19.3A12 12 0 0 0 16 46z" fill="#FFFFFF" opacity="0.85"/>' +
    "</svg>",

  cloudy:
    '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">' +
    '<path d="M14 44h38a12 12 0 0 0-4.2-23.2A14 14 0 0 0 14 44z" fill="#FFFFFF"/>' +
    '<path d="M8 50h42a8 8 0 0 0-2.8-15.5A10 10 0 0 0 8 50z" fill="#E0E0E0" opacity="0.7"/>' +
    "</svg>",

  fog:
    '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">' +
    '<path d="M10 22h44a8 8 0 0 0-2.8-15.5A10 10 0 0 0 10 22z" fill="#FFFFFF" opacity="0.9"/>' +
    '<line x1="8" y1="36" x2="56" y2="36" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round"/>' +
    '<line x1="14" y1="46" x2="50" y2="46" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity="0.7"/>' +
    '<line x1="20" y1="56" x2="44" y2="56" stroke="#FFFFFF" stroke-width="5" stroke-linecap="round" opacity="0.5"/>' +
    "</svg>",

  rain:
    '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">' +
    '<path d="M12 30h40a10 10 0 0 0-3.5-19.3A12 12 0 0 0 12 30z" fill="#FFFFFF"/>' +
    '<line x1="20" y1="40" x2="16" y2="52" stroke="#64B5F6" stroke-width="4" stroke-linecap="round"/>' +
    '<line x1="32" y1="40" x2="28" y2="52" stroke="#64B5F6" stroke-width="4" stroke-linecap="round"/>' +
    '<line x1="44" y1="40" x2="40" y2="52" stroke="#64B5F6" stroke-width="4" stroke-linecap="round"/>' +
    "</svg>",

  snow:
    '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">' +
    '<path d="M12 28h40a10 10 0 0 0-3.5-19.3A12 12 0 0 0 12 28z" fill="#FFFFFF"/>' +
    '<circle cx="22" cy="44" r="3" fill="#FFFFFF"/>' +
    '<circle cx="32" cy="50" r="3" fill="#FFFFFF"/>' +
    '<circle cx="42" cy="44" r="3" fill="#FFFFFF"/>' +
    "</svg>",

  thunder:
    '<svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">' +
    '<path d="M10 26h42a10 10 0 0 0-3.5-19.3A12 12 0 0 0 10 26z" fill="#9E9E9E"/>' +
    '<polygon points="34,30 26,44 32,44 28,58 42,40 34,40" fill="#FFE600"/>' +
    "</svg>"
};

function createIcon(code, isNight) {
  const kind = weatherKind(code, isNight);
  const span = document.createElement("span");
  span.className = "row-icon";
  span.innerHTML = ICONS[kind] || ICONS.cloudy;
  return span;
}

function setHeroIcon(code, isNight) {
  const kind = weatherKind(code, isNight);
  document.getElementById("hero-icon").innerHTML = ICONS[kind] || ICONS.cloudy;
}

/* ---------- Rendering ---------- */

function renderCurrent(data) {
  const code = data.current.weather_code;
  const night = isNightHour(data.current.time);

  setSkyTheme(code, night);
  setHeroIcon(code, night);

  document.getElementById("current-temp").textContent =
    roundTemp(data.current.temperature_2m) + "\u00B0";

  document.getElementById("current-condition").textContent =
    skyCondition(code, night);

  const sunsetToday = data.daily.sunset[0];
  document.getElementById("sunset-time").textContent =
    "Sunset at " + formatClockTime(sunsetToday);
}

function renderHourly(data) {
  const list = document.getElementById("hourly-list");
  list.innerHTML = "";

  // Find the first hourly entry after the current time,
  // then show the next 8 hours.
  const now = new Date(data.current.time);
  let startIndex = data.hourly.time.findIndex(function (t) {
    return new Date(t) > now;
  });
  if (startIndex === -1) startIndex = 0;

  for (let i = startIndex; i < startIndex + 8 && i < data.hourly.time.length; i++) {
    const time = data.hourly.time[i];
    const temp = roundTemp(data.hourly.temperature_2m[i]);
    const condition = skyCondition(data.hourly.weather_code[i], isNightHour(time));

    const li = document.createElement("li");

    const label = document.createElement("span");
    label.className = "row-label";
    label.textContent = formatHourLabel(time);

    const tempEl = document.createElement("span");
    tempEl.className = "row-temp";
    tempEl.textContent = temp + "\u00B0";

    const cond = document.createElement("span");
    cond.className = "row-condition";
    cond.appendChild(createIcon(data.hourly.weather_code[i], isNightHour(time)));
    const condText = document.createElement("span");
    condText.textContent = condition;
    cond.appendChild(condText);

    li.appendChild(label);
    li.appendChild(tempEl);
    li.appendChild(cond);
    list.appendChild(li);
  }
}

function renderDaily(data) {
  const list = document.getElementById("daily-list");
  list.innerHTML = "";

  for (let i = 0; i < data.daily.time.length && i < 10; i++) {
    const high = roundTemp(data.daily.temperature_2m_max[i]);
    const low = roundTemp(data.daily.temperature_2m_min[i]);
    const condition = skyCondition(data.daily.weather_code[i], false);

    const li = document.createElement("li");

    const label = document.createElement("span");
    label.className = "row-label";
    label.textContent = formatDayLabel(data.daily.time[i], i);

    const tempEl = document.createElement("span");
    tempEl.className = "row-temp";
    tempEl.textContent = high + "\u00B0";

    const lowEl = document.createElement("span");
    lowEl.className = "low";
    lowEl.textContent = " / " + low + "\u00B0";
    tempEl.appendChild(lowEl);

    const cond = document.createElement("span");
    cond.className = "row-condition";
    cond.appendChild(createIcon(data.daily.weather_code[i], false));
    const condText = document.createElement("span");
    condText.textContent = condition;
    cond.appendChild(condText);

    li.appendChild(label);
    li.appendChild(tempEl);
    li.appendChild(cond);
    list.appendChild(li);
  }
}

function renderUpdatedTime() {
  const now = new Date();
  document.getElementById("updated-text").textContent =
    "Weather updated at " +
    now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function showSections() {
  document.getElementById("status-message").hidden = true;
  document.getElementById("current").hidden = false;
  document.getElementById("hourly").hidden = false;
  document.getElementById("daily").hidden = false;
  document.getElementById("updated").hidden = false;
}

function showError() {
  const status = document.getElementById("status-message");
  status.hidden = false;
  status.innerHTML =
    '<p class="error-text">The weather could not be loaded.<br><br>' +
    "Please check the internet connection,<br>or try again in a few minutes.</p>";
}

/* ---------- Fetch & refresh ---------- */

async function loadWeather() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("HTTP " + response.status);
    const data = await response.json();

    renderCurrent(data);
    renderHourly(data);
    renderDaily(data);
    renderUpdatedTime();
    showSections();
  } catch (err) {
    // Only show the error screen if we have nothing on screen yet;
    // if a background refresh fails, keep showing the last good data.
    if (document.getElementById("current").hidden) {
      showError();
    }
  }
}

loadWeather();
setInterval(loadWeather, REFRESH_MINUTES * 60 * 1000);
