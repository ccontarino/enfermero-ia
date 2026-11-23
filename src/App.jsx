import { useState } from "react";
import { LazyMotion, MotionConfig, domAnimation } from "motion/react";
import Setup from "./components/Setup.jsx";
import Chat from "./components/Chat.jsx";
import { load, save } from "./lib/store.js";

export default function App() {
  const [prefs, setPrefs] = useState(() => ({ voiceOn: true, ...load() }));
  const [fresh, setFresh] = useState(false);
  const [view, setView] = useState(prefs.key && prefs.name ? "chat" : "setup");

  const update = (patch) => {
    const next = { ...prefs, ...patch };
    setPrefs(next);
    save(next);
  };

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
            persona={prefs}
            greet={fresh}
            voiceOn={prefs.voiceOn}
            setVoiceOn={(v) => update({ voiceOn: v })}
            onBack={() => setView("setup")}
            onKeyError={() => update({ key: "" })}
          />
        )}
      </MotionConfig>
    </LazyMotion>
  );
}
