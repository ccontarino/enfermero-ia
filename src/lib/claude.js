// Chat con Claude (Anthropic) desde el navegador, con la búsqueda web de Claude para noticias.
// Ojo: la clave es de la API (platform.claude.com), no de la suscripción de Claude.ai.
import { fail, prepare, tidy } from "./common.js";

export const MODEL = "claude-haiku-5-5"; // el más rápido y barato de Claude
const URL = "https://api.anthropic.com/v1/messages";

export async function askClaude({ key, persona, history, signal, onStatus }) {
  const { system, turns, useSearch } = await prepare({ persona, history, onStatus });
  const messages = turns.map((t) => ({ role: t.role, content: t.text }));
  const base = { model: MODEL, max_tokens: 800, system };
  if (useSearch) base.tools = [{ type: "web_search_20250305", name: "web_search", max_uses: 3 }];

  for (let i = 0; i < 4; i++) {
    const r = await fetch(URL, {
      method: "POST",
      signal,
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({ ...base, messages }),
    });
    if (!r.ok) {
      let msg = `Error ${r.status}`;
      try { msg = (await r.json()).error?.message || msg; } catch {}
      if (r.status === 401 || r.status === 403) throw fail("key", msg, r.status);
      if (r.status === 429) throw fail("quota", msg, r.status);
      if (r.status === 400 && /credit/i.test(msg)) throw fail("quota", msg, r.status);
      throw fail("other", msg, r.status);
    }
    const res = await r.json();
    // Una búsqueda larga puede pausarse: se reenvía lo recibido, tal cual, para que siga.
    if (res.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: res.content });
      continue;
    }
    return tidy(res.content.filter((b) => b.type === "text").map((b) => b.text).join(""));
  }
  return "Perdón, me enredé un poco. ¿Me lo preguntás de nuevo?";
}
