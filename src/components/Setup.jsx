import { useState } from "react";
import * as m from "motion/react-m";
import Avatar from "./Avatar.jsx";
import { Stagger, fadeUp } from "../motion.jsx";
import { PROVIDERS } from "../lib/ai.js";

export const DEFAULT_NAME = { f: "Sofía", m: "Martín" };

export default function Setup({ initial, onStart }) {
  const [gender, setGender] = useState(initial.gender || "f");
  const [name, setName] = useState(initial.name || "");
  const [city, setCity] = useState(initial.city || "");
  const [provider, setProvider] = useState(initial.provider || "gemini");
  const [keys, setKeys] = useState(initial.keys || {});
  const [error, setError] = useState("");
  const P = PROVIDERS[provider];
  const key = keys[provider] || "";
  const setKey = (v) => { setKeys({ ...keys, [provider]: v }); setError(""); };

  const submit = (e) => {
    e.preventDefault();
    const k = key.trim();
    if (!P.valid(k)) { setError(P.invalid); return; }
    const gem = (keys.gemini || "").trim();
    if (provider !== "gemini" && gem && !PROVIDERS.gemini.valid(gem)) { setError(PROVIDERS.gemini.invalid); return; }
    onStart({
      gender, provider,
      name: name.trim() || DEFAULT_NAME[gender],
      city: city.trim(),
      keys: { ...keys, [provider]: k, ...(gem ? { gemini: gem } : {}) },
    });
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

          <div className="field">
            <span>Inteligencia artificial</span>
            <div className="seg" role="radiogroup" aria-label="Proveedor de IA">
              {Object.entries(PROVIDERS).map(([id, p]) => (
                <button
                  type="button"
                  key={id}
                  role="radio"
                  aria-checked={provider === id}
                  className={`seg__opt${provider === id ? " is-on" : ""}`}
                  onClick={() => { setProvider(id); setError(""); }}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          <label className="field">
            <span>{P.keyLabel}</span>
            <input
              type="password"
              value={key}
              onInput={(e) => setKey(e.target.value)}
              placeholder={P.placeholder}
              autoComplete="off"
              required
            />
            <small>
              Se guarda solo en este navegador. La sacás en{" "}
              <a href={P.link} target="_blank" rel="noreferrer">{P.linkText}</a>.
              {provider !== "gemini" && " Es la clave de la API, no la de la suscripción, y la cuenta necesita crédito."}
            </small>
          </label>

          {provider !== "gemini" && (
            <label className="field">
              <span>Clave de Gemini para la voz <em>opcional</em></span>
              <input
                type="password"
                value={keys.gemini || ""}
                onInput={(e) => { setKeys({ ...keys, gemini: e.target.value }); setError(""); }}
                placeholder="AIza…"
                autoComplete="off"
              />
              <small>Con ella habla con una voz natural. Sin ella usa la voz del navegador.</small>
            </label>
          )}

          {error && <p className="error" role="alert">{error}</p>}

          <button className="btn" type="submit">Empezar a charlar</button>
          <p className="fine">Es una compañía para charlar y orientarte. No reemplaza a tu médico.</p>
        </m.form>
      </Stagger>
    </main>
  );
}
