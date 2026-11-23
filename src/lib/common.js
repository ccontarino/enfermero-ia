// Piezas compartidas entre proveedores de IA: personalidad, clima y errores.
import { getWeather } from "./weather.js";

export function fail(code, message, status) {
  const e = new Error(message);
  e.code = code; // "key" | "quota" | "other"
  e.status = status;
  return e;
}

// Si el mensaje es sobre el clima, se trae el pronóstico real y se lo damos al modelo como contexto.
const WEATHER_RE =
  /\b(clima|temperatura|pron[oó]stico|llover|llueve|lluvia|paraguas|viento|tormenta|hace (fr[ií]o|calor)|va a (llover|hacer)|qu[eé] me pongo|abrigo|campera)\b/i;
const CITY_RE = /\b(?:en|de) ([A-ZÁÉÍÓÚÑ][\p{L}]+(?: (?:del |de |la )?[A-ZÁÉÍÓÚÑ][\p{L}]+)*)/u;

function basePrompt({ name, gender, city }) {
  const o = gender === "f" ? "a" : "o";
  const rol = gender === "f" ? "enfermera" : "enfermero";
  const fecha = new Date().toLocaleString("es-AR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
  return `Sos ${name}, ${rol} virtual: cálid${o}, cercan${o} y con buen humor. Hablás en español rioplatense con voseo, natural, como en una charla.
Tus respuestas se leen en voz alta: 2 a 4 oraciones cortas. Nada de listas, markdown, emojis, links ni citas entre corchetes.
Podés charlar de CUALQUIER tema: salud y bienestar, clima, noticias, deportes, cocina, chistes o simplemente hacer compañía.
Salud: orientá con calma y sin alarmar, con consejos prácticos de enfermería. Cuando algo lo amerite, sugerí con tranquilidad consultar al médico. No indiques dosis de medicamentos. Si alguien describe una emergencia clara (dolor fuerte en el pecho, falta de aire, desmayo, pérdida de fuerza de un lado), decile con calma que pida ayuda médica ya.
Clima: cuando te pasen "DATOS DEL CLIMA", usalos tal cual y contalo simple (temperatura, si llueve, qué ponerse, cuidados por calor o frío). No inventes datos del clima.
Noticias o cualquier dato actual: buscá en la web y resumí lo principal en pocas palabras, sin inventar.
Hoy es ${fecha}.${city ? ` La persona está en ${city}.` : ""}`;
}

// Devuelve { system, turns, useSearch } listo para cualquier proveedor.
export async function prepare({ persona, history, onStatus }) {
  const turns = history.map((m) => ({ role: m.role === "assistant" ? "assistant" : "user", text: m.content }));
  while (turns.length && turns[0].role !== "user") turns.shift(); // tiene que empezar por la persona

  const last = turns[turns.length - 1].text;
  let system = basePrompt(persona);
  let useSearch = true;

  if (WEATHER_RE.test(last)) {
    const city = last.match(CITY_RE)?.[1] || persona.city;
    if (!city) {
      system += `\nLa persona preguntó por el clima pero no hay ciudad configurada: preguntale en qué ciudad está.`;
    } else {
      onStatus?.("Mirando el pronóstico…");
      try {
        const w = await getWeather({ city, days: 3 });
        system += `\n\nDATOS DEL CLIMA (reales, de Open-Meteo):\n${JSON.stringify(w)}`;
        useSearch = false;
      } catch (e) {
        system += `\nNo se pudo consultar el clima (${e.message}). Decíselo con calma y ofrecé consejos generales.`;
      }
    }
  }
  return { system, turns: turns.slice(-16), useSearch };
}

export const tidy = (t) =>
  (t || "").replace(/\[\d+(?:,\s*\d+)*\]/g, "").replace(/\s+/g, " ").trim();
