// IA local: Gemini Nano, el modelo que trae Chrome (Prompt API). Corre en el navegador, gratis y sin clave.
// Solo Chrome de compu (148 o más); el modelo se baja una vez, aparte de la web.
import { fail, prepare, tidy } from "./common.js";

let opts = {
  expectedInputs: [{ type: "text", languages: ["es"] }],
  expectedOutputs: [{ type: "text", languages: ["es"] }],
};

export const hasLocalApi = () => typeof LanguageModel !== "undefined";

async function availability() {
  if (!hasLocalApi()) return "unavailable";
  try {
    return await LanguageModel.availability(opts);
  } catch {
    opts = {}; // por si esta versión no acepta indicar el idioma
    try { return await LanguageModel.availability(); } catch { return "unavailable"; }
  }
}

const UNAVAILABLE =
  "Este navegador no puede correr la IA local. Hace falta Chrome de compu (versión 148 o más), 22 GB libres en el disco y una GPU con más de 4 GB de memoria (o 16 GB de RAM).";

// Se llama desde un toque (la descarga lo exige). onProgress recibe 0..1.
export async function setupLocal({ onProgress } = {}) {
  const a = await availability();
  if (a === "unavailable") throw fail("other", UNAVAILABLE);
  if (a === "available") return;
  const s = await LanguageModel.create({
    ...opts,
    monitor(m) { m.addEventListener("downloadprogress", (e) => onProgress?.(e.loaded)); },
  });
  s.destroy?.();
}

export async function askLocal({ persona, history, signal, onStatus }) {
  const { system, turns } = await prepare({ persona, history, onStatus });
  const last = turns[turns.length - 1].text;
  const prior = turns.slice(0, -1).slice(-8).map((t) => ({ role: t.role, content: t.text }));
  const sys =
    system +
    "\nIMPORTANTE: no tenés internet. Si piden noticias o datos de hoy que no estén acá, decí con honestidad que no los podés ver y ofrecé lo que sí sabés.";

  let session;
  try {
    session = await LanguageModel.create({ ...opts, initialPrompts: [{ role: "system", content: sys }, ...prior] });
  } catch (e) {
    if (e.name === "NotAllowedError") throw fail("other", "Falta preparar la IA local: tocá el engranaje y después Empezar a charlar.");
    throw fail("other", e.message || UNAVAILABLE);
  }
  try {
    return tidy(await session.prompt(last, { signal }));
  } finally {
    session.destroy?.();
  }
}
