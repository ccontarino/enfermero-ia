import { useEffect, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import * as m from "motion/react-m";
import Avatar from "./Avatar.jsx";
import { ask } from "../lib/ai.js";
import { canListen, listen, speak, stopSpeaking } from "../lib/voice.js";
import { ease } from "../motion.jsx";

const SUGGESTIONS = [
  "¿Cómo va a estar el clima?",
  "Contame las noticias de hoy",
  "Dormí mal, ¿qué hago?",
  "Me duele la cabeza",
  "¿Cuánta agua tengo que tomar?",
  "Contame algo lindo",
];

const bubble = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.24, ease } },
};

export default function Chat({ persona, voiceOn, setVoiceOn, onBack, onKeyError }) {
  const rol = persona.gender === "f" ? "enfermera" : "enfermero";
  const hello = `¡Hola! Soy ${persona.name}, tu ${rol}. ¿Cómo andás hoy? Podemos hablar de lo que quieras.`;
  const [msgs, setMsgs] = useState([{ role: "assistant", content: hello }]);
  const [text, setText] = useState("");
  const [partial, setPartial] = useState("");
  const [mode, setMode] = useState("idle"); // idle | listening | thinking | talking
  const [status, setStatus] = useState("");
  const stopRef = useRef(null);
  const abortRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, partial]);

  useEffect(() => () => { stopSpeaking(); abortRef.current?.abort(); stopRef.current?.(); }, []);

  const say = (t) => {
    if (!voiceOn) return;
    speak(t, persona.gender, { onStart: () => setMode("talking"), onEnd: () => setMode("idle") });
  };

  const send = async (raw) => {
    const q = (raw || "").trim();
    if (!q || mode === "thinking") return;
    stopSpeaking();
    const history = [...msgs, { role: "user", content: q }];
    setMsgs(history);
    setMode("thinking");
    setStatus(`${persona.name} está pensando…`);
    abortRef.current = new AbortController();
    try {
      const answer = await ask({
        key: persona.key,
        persona,
        history,
        signal: abortRef.current.signal,
        onStatus: setStatus,
      });
      const a = answer || "Perdón, no te entendí bien. ¿Me lo repetís?";
      setMsgs((h) => [...h, { role: "assistant", content: a }]);
      setStatus("");
      setMode("idle");
      say(a);
    } catch (e) {
      if (e.name === "AbortError") return;
      setMode("idle");
      setMsgs((h) => h.slice(0, -1));
      if (e.status === 401) { setStatus("La clave de la API no es válida."); onKeyError(); }
      else if (e.status === 429) setStatus("Muchas preguntas seguidas. Esperá un momento.");
      else if (e.status === 400 && /credit/i.test(e.message)) setStatus("Tu cuenta de la API no tiene crédito.");
      else setStatus("No pude responder. Revisá la conexión y probá de nuevo.");
    }
  };

  const toggleMic = () => {
    stopSpeaking();
    if (mode === "listening") { stopRef.current?.(); return; }
    if (mode === "thinking") return;
    setMode("listening");
    setStatus("Te escucho… tocá de nuevo para terminar");
    setPartial("");
    try {
      stopRef.current = listen({
        onPartial: setPartial,
        onError: (err) => {
          if (err === "not-allowed") setStatus("Dale permiso al micrófono para hablarme.");
          else if (err === "no-speech") setStatus("No te escuché. Probá de nuevo.");
        },
        onEnd: (final) => {
          setPartial("");
          setMode("idle");
          setStatus((s) => (s.startsWith("Te escucho") ? "" : s));
          if (final) send(final);
        },
      });
    } catch {
      setMode("idle");
      setStatus("El micrófono no está disponible en este navegador.");
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const v = text;
    setText("");
    send(v);
  };

  const toggleVoice = () => {
    if (voiceOn) { stopSpeaking(); setMode((md) => (md === "talking" ? "idle" : md)); }
    setVoiceOn(!voiceOn);
  };

  return (
    <div className="chat">
      <header className="nav">
        <Avatar gender={persona.gender} size={40} />
        <div className="nav__who">
          <b>{persona.name}</b>
          <small>Tu {rol} IA</small>
        </div>
        <button className="nav__btn" onClick={toggleVoice} aria-label={voiceOn ? "Silenciar voz" : "Activar voz"} aria-pressed={voiceOn}>
          {voiceOn ? <IconSound /> : <IconMute />}
        </button>
        <button className="nav__btn" onClick={onBack} aria-label="Cambiar enfermera o enfermero">
          <IconSettings />
        </button>
      </header>

      <div className="stage">
        <Avatar gender={persona.gender} state={mode} size={148} />
        <p className="status" aria-live="polite">{status}</p>
      </div>

      <div className="msgs" ref={listRef}>
        {msgs.map((msg, i) => (
          <m.p key={i} {...bubble} className={`msg msg--${msg.role === "user" ? "me" : "bot"}`}>{msg.content}</m.p>
        ))}
        {partial && <p className="msg msg--me msg--partial">{partial}</p>}
        {mode === "thinking" && (
          <p className="msg msg--bot msg--dots" aria-label="Pensando"><i /><i /><i /></p>
        )}
      </div>

      <AnimatePresence>
        {msgs.length === 1 && (
          <m.div className="chips" exit={{ opacity: 0, transition: { duration: 0.12 } }}>
            {SUGGESTIONS.map((s) => (
              <button key={s} className="chip" onClick={() => send(s)}>{s}</button>
            ))}
          </m.div>
        )}
      </AnimatePresence>

      <form className="bar" onSubmit={onSubmit}>
        {canListen && (
          <button
            type="button"
            className={`mic${mode === "listening" ? " is-on" : ""}`}
            onClick={toggleMic}
            aria-label={mode === "listening" ? "Terminar de hablar" : "Hablar"}
          >
            <IconMic />
          </button>
        )}
        <input
          value={text}
          onInput={(e) => setText(e.target.value)}
          placeholder={canListen ? "Tocá el micrófono o escribí…" : "Escribile acá…"}
          aria-label="Mensaje"
        />
        <button className="send" type="submit" aria-label="Enviar" disabled={!text.trim()}>
          <IconSend />
        </button>
      </form>
    </div>
  );
}

const Svg = (p) => <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p} />;
const IconMic = () => <Svg><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></Svg>;
const IconSend = () => <Svg><path d="M5 12h14M13 6l6 6-6 6" /></Svg>;
const IconSound = () => <Svg><path d="M4 9v6h4l5 4V5L8 9H4Z" /><path d="M16.5 8.5a5 5 0 0 1 0 7" /></Svg>;
const IconMute = () => <Svg><path d="M4 9v6h4l5 4V5L8 9H4Z" /><path d="m17 9 4 6M21 9l-4 6" /></Svg>;
const IconSettings = () => <Svg><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3 1a7 7 0 0 0-2-1.2L14.2 3h-4l-.4 2.7a7 7 0 0 0-2 1.2l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 2.4l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 2 1.2l.4 2.7h4l.4-2.7a7 7 0 0 0 2-1.2l2.3 1 2-3.4-2-1.5c.1-.4.1-.8.1-1.2Z" /></Svg>;
