// Chat con Gemini (Google) desde el navegador, con búsqueda de Google para noticias.
import { fail, prepare, tidy } from "./common.js";

export const MODEL = "gemini-3.5-flash-lite"; // el más rápido y barato de la familia
const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export async function askGemini({ key, persona, history, signal, onStatus }) {
  const { system, turns, useSearch } = await prepare({ persona, history, onStatus });
  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: turns.map((t) => ({ role: t.role === "assistant" ? "model" : "user", parts: [{ text: t.text }] })),
  };
  if (useSearch) body.tools = [{ googleSearch: {} }];

  const r = await fetch(url, {
    method: "POST",
    signal,
    headers: { "content-type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    let msg = `Error ${r.status}`;
    try { msg = (await r.json()).error?.message || msg; } catch {}
    if (/api key/i.test(msg) || r.status === 401 || r.status === 403) throw fail("key", msg, r.status);
    if (r.status === 429) throw fail("quota", msg, r.status);
    throw fail("other", msg, r.status);
  }
  const res = await r.json();
  const cand = res.candidates?.[0];
  const text = tidy((cand?.content?.parts || []).filter((p) => p.text && !p.thought).map((p) => p.text).join(""));
  if (!text && cand?.finishReason === "SAFETY") return "Prefiero no hablar de eso. ¿Hablamos de otra cosa?";
  return text;
}
