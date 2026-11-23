import { useState } from "react";
import * as m from "motion/react-m";
import Avatar from "./Avatar.jsx";
import { Stagger } from "../motion.jsx";
import { fadeUp } from "../motion.jsx";

export const DEFAULT_NAME = { f: "Sofía", m: "Martín" };

export default function Setup({ initial, onStart }) {
  const [gender, setGender] = useState(initial.gender || "f");
  const [name, setName] = useState(initial.name || "");
  const [city, setCity] = useState(initial.city || "");
  const [key, setKey] = useState(initial.key || "");
  const [showKey, setShowKey] = useState(!initial.key);

  const submit = (e) => {
    e.preventDefault();
    onStart({ gender, name: name.trim() || DEFAULT_NAME[gender], city: city.trim(), key: key.trim() });
  };

  return (
    <main className="setup">
      <Stagger as="div" inView={false} className="setup__inner">
        <m.p variants={fadeUp} className="eyebrow">Enfermero IA</m.p>
        <m.h1 variants={fadeUp}>¿Quién te acompaña hoy?</m.h1>
        <m.p variants={fadeUp} className="lede">
          Elegí, ponele nombre y hablale por micrófono de lo que quieras: cómo te sentís, el clima, las noticias o simplemente charlar.
        </m.p>

        <m.form variants={fadeUp} onSubmit={submit} className="form">
          <div className="pick" role="radiogroup" aria-label="Elegí">
            {[["f", "Enfermera"], ["m", "Enfermero"]].map(([g, label]) => (
              <button
                type="button"
                key={g}
                role="radio"
                aria-checked={gender === g}
                className={`pick__opt${gender === g ? " is-on" : ""}`}
                onClick={() => setGender(g)}
              >
                <Avatar gender={g} size={104} />
                <span>{label}</span>
              </button>
            ))}
          </div>

          <label className="field">
            <span>Nombre</span>
            <input value={name} onInput={(e) => setName(e.target.value)} placeholder={DEFAULT_NAME[gender]} maxLength={24} />
          </label>

          <label className="field">
            <span>Tu ciudad <em>para el clima</em></span>
            <input value={city} onInput={(e) => setCity(e.target.value)} placeholder="Buenos Aires" maxLength={40} />
          </label>

          {showKey ? (
            <label className="field">
              <span>Clave de la API de Gemini</span>
              <input
                type="password"
                value={key}
                onInput={(e) => setKey(e.target.value)}
                placeholder="AIza…"
                autoComplete="off"
                required
              />
              <small>
                Se guarda solo en este navegador. La sacás en{" "}
                <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">aistudio.google.com/apikey</a>.
              </small>
            </label>
          ) : (
            <button type="button" className="link" onClick={() => setShowKey(true)}>Cambiar clave de la API</button>
          )}

          <button className="btn" type="submit">Empezar a charlar</button>
          <p className="fine">Es una compañía para charlar y orientarte. No reemplaza a tu médico.</p>
        </m.form>
      </Stagger>
    </main>
  );
}
