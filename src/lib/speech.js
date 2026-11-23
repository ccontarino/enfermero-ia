// Voz de la enfermera: primero la voz natural de Gemini (TTS), con la boca siguiendo el volumen real del audio.
// Si algo falla (cuota, red, modelo), cae a la voz del navegador y la boca se mueve igual.
import { speak as browserSpeak, stopSpeaking as browserStop } from "./voice.js";

const TTS_MODEL = "gemini-3.8-flash-lite-tts"; // el rápido; el otro es gemini-3.8-flash-tts
const VOICE = { f: "Sulafat", m: "Achird" }; // cálida / amistosa
const STYLE = "warm, calm and friendly, natural conversational Argentine Spanish";

let ctx = null;
function audioCtx() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

const clean = (t) =>
  t.replace(/https?:\/\/\S+/g, "").replace(/[*_#`>~]/g, "").replace(/\s+/g, " ").trim().slice(0, 900);

// Busca el primer audio en base64 dentro de la respuesta, sin depender de la forma exacta del JSON.
function findAudio(node) {
  if (!node || typeof node !== "object") return null;
  if (typeof node.data === "string" && node.data.length > 500) {
    return { b64: node.data, mime: node.mime_type || node.mimeType || "" };
  }
  for (const v of Object.values(node)) {
    const r = findAudio(v);
    if (r) return r;
  }
  return null;
}

const b64ToBytes = (b64) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

async function decode(ac, bytes, mime) {
  const isWav = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46; // "RIFF"
  if (isWav) return ac.decodeAudioData(bytes.buffer.slice(0));
  // PCM crudo 16 bits, 24 kHz, mono (audio/l16)
  const rate = Number(/rate=(\d+)/.exec(mime)?.[1]) || 24000;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength - (bytes.byteLength % 2));
  const n = view.byteLength / 2;
  const buf = ac.createBuffer(1, n, rate);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < n; i++) ch[i] = view.getInt16(i * 2, true) / 32768;
  return buf;
}

async function fetchAudio({ key, text, gender, signal }) {
  const build = (withStyle) => ({
    model: TTS_MODEL,
    input: [
      {
        type: "user_input",
        content: [
          {
            type: "text",
            text,
            ...(withStyle ? { annotations: [{ type: "speech_metadata", style: STYLE }] } : {}),
          },
        ],
      },
    ],
    response_format: { type: "audio", mime_type: "audio/wav", sample_rate: 24000 },
    generation_config: { speech_config: [{ voice: VOICE[gender] }] },
  });
  const post = (body) =>
    fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
      method: "POST",
      signal,
      headers: { "content-type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify(body),
    });
  let r = await post(build(true));
  if (r.status === 400) r = await post(build(false)); // por si el estilo no es aceptado
  if (!r.ok) throw new Error(`TTS ${r.status}`);
  const audio = findAudio(await r.json());
  if (!audio) throw new Error("TTS sin audio");
  return audio;
}

// Devuelve { stop }. onLevel(0..1) se llama ~60 veces por segundo mientras suena.
export function speakText({ key, text, gender, onLevel, onStart, onEnd }) {
  const t = clean(text || "");
  if (!t) return { stop() {} };
  const ctl = new AbortController();
  let stopped = false, src = null, raf = 0, fallbackTimer = 0;

  const finish = () => {
    cancelAnimationFrame(raf);
    clearInterval(fallbackTimer);
    onLevel?.(0);
    onEnd?.();
  };

  const stop = () => {
    if (stopped) return;
    stopped = true;
    ctl.abort();
    try { src?.stop(); } catch {}
    browserStop();
    finish();
  };

  const useBrowser = () => {
    if (stopped) return;
    let tick = 0;
    browserSpeak(t, gender, {
      onStart: () => {
        onStart?.();
        // La voz del navegador no da volumen: la boca se mueve con un ritmo parecido al habla.
        fallbackTimer = setInterval(() => {
          tick++;
          onLevel?.(0.15 + 0.7 * Math.abs(Math.sin(tick * 0.9)) * (0.6 + 0.4 * Math.random()));
        }, 70);
      },
      onEnd: () => { if (!stopped) { stopped = true; finish(); } },
    });
  };

  (async () => {
    try {
      const ac = audioCtx();
      if (!ac || !key) throw new Error("sin audio");
      if (ac.state === "suspended") await ac.resume();
      const { b64, mime } = await fetchAudio({ key, text: t, gender, signal: ctl.signal });
      if (stopped) return;
      const buffer = await decode(ac, b64ToBytes(b64), mime);
      if (stopped) return;

      const analyser = ac.createAnalyser();
      analyser.fftSize = 512;
      const data = new Uint8Array(analyser.fftSize);
      src = ac.createBufferSource();
      src.buffer = buffer;
      src.connect(analyser);
      analyser.connect(ac.destination);

      let smooth = 0;
      const loop = () => {
        analyser.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v; }
        const rms = Math.sqrt(sum / data.length);
        const target = Math.min(1, rms * 5); // el habla ronda 0.05–0.2 de RMS
        smooth += (target - smooth) * (target > smooth ? 0.6 : 0.25); // abre rápido, cierra suave
        onLevel?.(smooth);
        raf = requestAnimationFrame(loop);
      };
      src.onended = () => { if (!stopped) { stopped = true; finish(); } };
      onStart?.();
      src.start();
      loop();
    } catch (e) {
      if (stopped || e.name === "AbortError") return;
      console.warn("Voz de Gemini no disponible, uso la del navegador:", e.message);
      useBrowser();
    }
  })();

  return { stop };
}
