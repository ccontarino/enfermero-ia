import { useState } from "react";
import { LazyMotion, MotionConfig, domAnimation } from "motion/react";
import Setup from "./components/Setup.jsx";
import Chat from "./components/Chat.jsx";
import { load, save } from "./lib/store.js";

export default function App() {
  const [prefs, setPrefs] = useState(() => {
    const p = { voiceOn: true, provider: "gemini", ...load() };
    if (!p.keys) p.keys = p.key ? { gemini: p.key } : {}; // versión anterior: una sola clave, de Gemini
    delete p.key;
    return p;
  });
  const [fresh, setFresh] = useState(false);
  const ready = (p) => p.name && (p.provider === "local" || p.keys[p.provider]);
  const [view, setView] = useState(ready(prefs) ? "chat" : "setup");

  const update = (patch) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    save(next);
  };

  // Lo que necesita el chat: la clave del proveedor elegido y, para la voz natural, la de Gemini.
  const persona = { ...prefs, key: prefs.keys[prefs.provider], voiceKey: prefs.keys.gemini || "" };

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        {view === "setup" ? (
          <Setup
            initial={prefs}
            onStart={(p) => { update(p); setFresh(true); setView("chat"); }}
          />
        ) : (
          <Chat
            key={prefs.gender + prefs.name}
            persona={persona}
            greet={fresh}
            voiceOn={prefs.voiceOn}
            setVoiceOn={(v) => update({ voiceOn: v })}
            onBack={() => setView("setup")}
            onKeyError={() => { update({ keys: { ...prefs.keys, [prefs.provider]: "" } }); setView("setup"); }}
          />
        )}
      </MotionConfig>
    </LazyMotion>
  );
}
