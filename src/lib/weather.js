// Clima real con Open-Meteo: gratis, sin registro y con CORS abierto.
const CODES = {
  0: "despejado", 1: "mayormente despejado", 2: "parcialmente nublado", 3: "nublado",
  45: "niebla", 48: "niebla con escarcha",
  51: "llovizna débil", 53: "llovizna", 55: "llovizna intensa",
  56: "llovizna helada", 57: "llovizna helada intensa",
  61: "lluvia débil", 63: "lluvia", 65: "lluvia fuerte",
  66: "lluvia helada", 67: "lluvia helada fuerte",
  71: "nevada débil", 73: "nevada", 75: "nevada fuerte", 77: "granizo fino",
  80: "chaparrones débiles", 81: "chaparrones", 82: "chaparrones fuertes",
  85: "nevadas débiles", 86: "nevadas fuertes",
  95: "tormenta", 96: "tormenta con granizo", 99: "tormenta fuerte con granizo",
};
const desc = (c) => CODES[c] ?? "variable";

async function geocode(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=es&format=json`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("No pude buscar la ciudad");
  const j = await r.json();
  const p = j.results?.[0];
  if (!p) throw new Error(`No encontré la ciudad "${city}"`);
  return { lat: p.latitude, lon: p.longitude, name: [p.name, p.admin1, p.country].filter(Boolean).join(", ") };
}

export async function getWeather({ city, days = 3 }) {
  const place = await geocode(city);
  const d = Math.min(Math.max(Number(days) || 3, 1), 7);
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${place.lat}&longitude=${place.lon}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,uv_index` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max` +
    `&timezone=auto&forecast_days=${d}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error("No pude traer el pronóstico");
  const j = await r.json();
  const c = j.current;
  return {
    lugar: place.name,
    ahora: {
      temperatura: `${Math.round(c.temperature_2m)}°C`,
      sensacion: `${Math.round(c.apparent_temperature)}°C`,
      humedad: `${c.relative_humidity_2m}%`,
      viento: `${Math.round(c.wind_speed_10m)} km/h`,
      uv: c.uv_index,
      estado: desc(c.weather_code),
    },
    dias: j.daily.time.map((t, i) => ({
      fecha: t,
      estado: desc(j.daily.weather_code[i]),
      minima: `${Math.round(j.daily.temperature_2m_min[i])}°C`,
      maxima: `${Math.round(j.daily.temperature_2m_max[i])}°C`,
      lluvia: `${j.daily.precipitation_probability_max[i] ?? 0}%`,
      uv_max: j.daily.uv_index_max?.[i],
    })),
  };
}
