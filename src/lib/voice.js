// Voz con las APIs del navegador: reconocimiento (Chrome, Edge, Safari) y síntesis.
const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
export const canListen = !!SR;
export const canSpeak = typeof window !== "undefined" && "speechSynthesis" in window;

// Escucha una frase. onPartial recibe el texto parcial; devuelve una función para cortar.
export function listen({ onPartial, onEnd, onError }) {
  const rec = new SR();
  rec.lang = "es-AR";
  rec.interimResults = true;
  rec.continuous = false;
  let finalText = "";
  rec.onresult = (ev) => {
    let interim = "";
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const r = ev.results[i];
      if (r.isFinal) finalText += r[0].transcript;
      else interim += r[0].transcript;
    }
    onPartial?.((finalText + " " + interim).trim());
  };
  rec.onerror = (e) => onError?.(e.error);
  rec.onend = () => onEnd?.(finalText.trim());
  rec.start();
  return () => { try { rec.stop(); } catch {} };
}

const FEM = /(female|mujer|paulina|m[oó]nica|helena|laura|sabina|elvira|dalia|luc[ií]a|elena|isabela|camila|valentina|google español)/i;
const MAL = /(male|hombre|jorge|diego|pablo|juan|carlos|[aá]lvaro|enrique|ra[uú]l|tom[aá]s|alonso|jos[eé])/i;

function pickVoice(gender) {
  const vs = speechSynthesis.getVoices().filter((v) => /^es/i.test(v.lang));
  if (!vs.length) return null;
  const want = gender === "f" ? FEM : MAL;
  const latam = (v) => /AR|419|US|MX|CO|CL/i.test(v.lang);
  return (
    vs.find((v) => want.test(v.name) && latam(v)) ||
    vs.find((v) => want.test(v.name)) ||
    vs.find(latam) ||
    vs[0]
  );
}

if (canSpeak) {
  speechSynthesis.getVoices();
  speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
}

export function speak(text, gender, { onStart, onEnd } = {}) {
  if (!canSpeak || !text) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/[*_#`>]/g, ""));
  const v = pickVoice(gender);
  if (v) { u.voice = v; u.lang = v.lang; } else u.lang = "es-AR";
  // Si no hay voz del género elegido, el tono ayuda a diferenciarlas.
  u.pitch = gender === "f" ? 1.1 : 0.85;
  u.rate = 1.02;
  u.onstart = () => onStart?.();
  u.onend = u.onerror = () => onEnd?.();
  speechSynthesis.speak(u);
}

export function stopSpeaking() {
  if (canSpeak) speechSynthesis.cancel();
}
