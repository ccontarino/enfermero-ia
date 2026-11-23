// Chat con OpenAI (Responses API) desde el navegador, con la búsqueda web de OpenAI para noticias.
// Ojo: la clave es de platform.openai.com (API), no de la suscripción de ChatGPT.
import { fail, prepare, tidy } from "./common.js";

export const MODEL = "gpt-5.4-mini";
const URL = "https://api.openai.com/v1/responses";

export async function askOpenAI({ key, persona, history, signal, onStatus }) {
  const { system, turns, useSearch } = await prepare({ persona, history, onStatus });
  const body = {
    model: MODEL,
    instructions: system,
    input: turns.map((t) => ({ role: t.role, content: t.text })),
    store: false,
    // la búsqueda web pide razonar un poco; sin búsqueda, respuesta inmediata
    reasoning: { effort: useSearch ? "low" : "none" },
  };
  if (useSearch) {
    body.tools = [{
      type: "web_search",
      user_location: {
        type: "approximate",
        country: "AR",
        ...(persona.city ? { city: persona.city } : {}),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    }];
  }

  const r = await fetch(URL, {
    method: "POST",
    signal,
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    let msg = `Error ${r.status}`;
    try { msg = (await r.json()).error?.message || msg; } catch {}
    if (r.status === 401 || r.status === 403) throw fail("key", msg, r.status);
    if (r.status === 429) throw fail("quota", msg, r.status);
    throw fail("other", msg, r.status);
  }
  const res = await r.json();
  const text =
    res.output_text ||
    (res.output || [])
      .filter((o) => o.type === "message")
      .flatMap((o) => o.content || [])
      .filter((c) => c.type === "output_text")
      .map((c) => c.text)
      .join("");
  return tidy(text);
}
