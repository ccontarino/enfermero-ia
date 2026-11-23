// IA local, sin clave y sin salir del dispositivo. Elige sola el motor:
//  - "nano": Gemini Nano, el modelo que trae Chrome de compu (Prompt API, 148+, ~22 GB libres).
//  - "webllm": Qwen3 0.6B (~600 MB) con WebGPU, para celu u otros navegadores. Experimental: un modelo
//    tan chico se equivoca e inventa, así que el prompt le exige no inventar y se avisa en pantalla.
import { fail, prepare, tidy } from "./common.js";

let opts = {
  expectedInputs: [{ type: "text", languages: ["es"] }],
  expectedOutputs: [{ type: "text", languages: ["es"] }],
};

const hasNano = () => typeof LanguageModel !== "undefined";

async function nanoAvailability() {
  if (!hasNano()) return "unavailable";
  try {
    return await LanguageModel.availability(opts);
  } catch {
    opts = {}; // por si esta versión no acepta indicar el idioma
    try { return await LanguageModel.availability(); } catch { return "unavailable"; }
  }
}

async function pickEngine() {
  if ((await nanoAvailability()) !== "unavailable") return "nano";
  try {
    if (navigator.gpu && (await navigator.gpu.requestAdapter())) return "webllm";
  } catch {}
  return null;
}

const UNAVAILABLE =
  "Este navegador no puede correr la IA local. Hace falta Chrome de compu (148 o más) o un navegador con WebGPU, como Chrome en Android o Safari 26.";

// ---- WebLLM (Qwen3 0.6B) ----
let engine = null, enginePromise = null, onLoad = null;

function webllmEngine() {
  if (engine) return Promise.resolve(engine);
  enginePromise ||= (async () => {
    const { CreateMLCEngine } = await import("@mlc-ai/web-llm"); // se baja solo si hace falta
    const adapter = await navigator.gpu.requestAdapter();
    const f16 = adapter?.features?.has("shader-f16");
    const id = f16 ? "Qwen3-0.6B-q4f16_1-MLC" : "Qwen3-0.6B-q4f32_1-MLC";
    engine = await CreateMLCEngine(id, { initProgressCallback: (r) => onLoad?.(r.progress) });
    return engine;
  })().catch((e) => { enginePromise = null; throw e; });
  return enginePromise;
}

// Se llama desde un toque (la descarga del modelo de Chrome lo exige). onProgress recibe 0..1.
// Devuelve el motor elegido: "nano" | "webllm".
export async function setupLocal({ onProgress } = {}) {
  const kind = await pickEngine();
  if (!kind) throw fail("other", UNAVAILABLE);
  if (kind === "nano") {
    if ((await nanoAvailability()) !== "available") {
      const s = await LanguageModel.create({
        ...opts,
        monitor(m) { m.addEventListener("downloadprogress", (e) => onProgress?.(e.loaded)); },
      });
      s.destroy?.();
    }
    return "nano";
  }
  onLoad = onProgress;
  try {
    await webllmEngine();
  } catch (e) {
    throw fail("other", `No se pudo cargar el modelo local: ${e.message || "error"}`);
  } finally {
    onLoad = null;
  }
  return "webllm";
}

const NO_NET =
  "\nIMPORTANTE: no tenés internet. Si piden noticias o datos de hoy que no estén acá, decí con honestidad que no los podés ver y ofrecé lo que sí sabés.";
const SMALL =
  "\nSos un modelo chico: si no estás seguro de algo, sobre todo de salud, decí que no sabés y sugerí consultar al médico. No inventes datos, nombres ni números. Respondé en 2 o 3 oraciones.";

async function askNano({ sys, prior, last, signal }) {
  let session;
  try {
    session = await LanguageModel.create({ ...opts, initialPrompts: [{ role: "system", content: sys }, ...prior] });
  } catch (e) {
    if (e.name === "NotAllowedError") throw fail("other", "Falta preparar la IA local: tocá el engranaje y después Empezar a charlar.");
    throw fail("other", e.message || UNAVAILABLE);
  }
  try {
    return await session.prompt(last, { signal });
  } finally {
    session.destroy?.();
  }
}

async function askWebllm({ sys, prior, last, signal, onStatus }) {
  onLoad = (p) => onStatus?.(`Cargando la IA local… ${Math.round(p * 100)}%`);
  let eng;
  try { eng = await webllmEngine(); } finally { onLoad = null; }
  const stop = () => eng.interruptGenerate();
  signal?.addEventListener("abort", stop, { once: true });
  const r = await eng.chat.completions.create({
    messages: [{ role: "system", content: sys }, ...prior, { role: "user", content: last }],
    temperature: 0.5,
    max_tokens: 260,
    extra_body: { enable_thinking: false }, // Qwen3: sin "pensar" en voz alta, así responde rápido
  });
  return (r.choices?.[0]?.message?.content || "").replace(/<think>[\s\S]*?<\/think>/g, "");
}

export async function askLocal({ persona, history, signal, onStatus }) {
  const { system, turns } = await prepare({ persona, history, onStatus });
  const last = turns[turns.length - 1].text;
  const prior = turns.slice(0, -1).slice(-8).map((t) => ({ role: t.role, content: t.text }));
  const kind = persona.localEngine || (await pickEngine());
  if (!kind) throw fail("other", UNAVAILABLE);
  const args = { sys: system + NO_NET + (kind === "webllm" ? SMALL : ""), prior, last, signal, onStatus };
  try {
    return tidy(kind === "nano" ? await askNano(args) : await askWebllm(args));
  } catch (e) {
    if (e.code || e.name === "AbortError") throw e;
    throw fail("other", e.message || "No pude responder con la IA local.");
  }
}
