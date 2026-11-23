// Cliente mínimo de la API de Claude desde el navegador.
// La clave la carga cada persona y queda solo en su navegador (localStorage).
import { getWeather } from "./weather.js";

const API = "https://api.anthropic.com/v1/messages";
export const MODEL = "claude-haiku-5-5"; // rápido y barato: ideal para charlar por voz

const TOOLS = [
  // Búsqueda web del lado de Anthropic: noticias, resultados, cualquier dato de hoy.
  { type: "web_search_20250305", name: "web_search", max_uses: 3 },
  {
    name: "get_weather",
    description:
      "Clima actual y pronóstico real de una ciudad (Open-Meteo). Usala siempre que pregunten por el clima, la temperatura, si va a llover o qué ponerse.",
    input_schema: {
      type: "object",
      properties: {
        city: { type: "string", description: "Ciudad, por ejemplo 'Buenos Aires' o 'Córdoba, Argentina'" },
        days: { type: "integer", description: "Días de pronóstico, de 1 a 7", minimum: 1, maximum: 7 },
      },
      required: ["city"],
    },
  },
];

function systemPrompt({ name, gender, city }) {
  const o = gender === "f" ? "a" : "o";
  const rol = gender === "f" ? "enfermera" : "enfermero";
  const fecha = new Date().toLocaleString("es-AR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
  return `Sos ${name}, ${rol} virtual: cálid${o}, cercan${o} y con buen humor. Hablás en español rioplatense con voseo, natural, como en una charla.
Tus respuestas se leen en voz alta: 2 a 4 oraciones cortas. Nada de listas, markdown, emojis, links ni citas entre corchetes.
Podés charlar de CUALQUIER tema: salud y bienestar, clima, noticias, deportes, cocina, chistes o simplemente hacer compañía.
Salud: orientá con calma y sin alarmar, con consejos prácticos de enfermería. Cuando algo lo amerite, sugerí con tranquilidad consultar al médico. No indiques dosis de medicamentos. Si alguien describe una emergencia clara (dolor fuerte en el pecho, falta de aire, desmayo, pérdida de fuerza de un lado), decile con calma que pida ayuda médica ya.
Clima: usá la herramienta get_weather y contalo simple (temperatura, si llueve, qué ponerse, cuidados por calor o frío).
Noticias o cualquier dato actual: usá web_search y resumí lo principal en pocas palabras, sin inventar.
Hoy es ${fecha}.${city ? ` La persona está en ${city}; si pregunta por el clima sin decir dónde, usá esa ciudad.` : ""}`;
}

async function call(key, body, signal) {
  const r = await fetch(API, {
    method: "POST",
    signal,
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    let msg = `Error ${r.status}`;
    try { msg = (await r.json()).error?.message || msg; } catch {}
    const e = new Error(msg);
    e.status = r.status;
    throw e;
  }
  return r.json();
}

const textOf = (content) =>
  content.filter((b) => b.type === "text").map((b) => b.text).join("").replace(/\s+/g, " ").trim();

// history: [{role, content: string}] -> devuelve el texto de la respuesta.
export async function ask({ key, persona, history, signal, onStatus }) {
  const messages = history.map((m) => ({ role: m.role, content: m.content }));
  // La API pide que la conversación empiece por el usuario.
  while (messages.length && messages[0].role !== "user") messages.shift();

  for (let turn = 0; turn < 6; turn++) {
    const res = await call(
      key,
      { model: MODEL, max_tokens: 600, system: systemPrompt(persona), tools: TOOLS, messages },
      signal
    );

    if (res.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: res.content });
      continue;
    }
    if (res.stop_reason !== "tool_use") return textOf(res.content);

    messages.push({ role: "assistant", content: res.content });
    const results = [];
    for (const b of res.content) {
      if (b.type !== "tool_use") continue;
      if (b.name === "get_weather") {
        onStatus?.("Mirando el pronóstico…");
        try {
          results.push({ type: "tool_result", tool_use_id: b.id, content: JSON.stringify(await getWeather(b.input)) });
        } catch (e) {
          results.push({ type: "tool_result", tool_use_id: b.id, content: e.message, is_error: true });
        }
      }
    }
    messages.push({ role: "user", content: results });
  }
  return "Perdón, me enredé un poco. ¿Me lo preguntás de nuevo?";
}
