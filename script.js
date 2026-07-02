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

/* ---------- Rendering ---------- */

function renderCurrent(data) {
  const code = data.current.weather_code;
  const night = isNightHour(data.current.time);

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
    cond.textContent = condition;

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
    cond.textContent = condition;

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
