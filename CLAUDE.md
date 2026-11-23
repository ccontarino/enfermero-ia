# CLAUDE.md

Proyecto: "Enfermero IA", web estática para charlar por voz con una enfermera o un enfermero virtual. Se elige género, nombre y ciudad; después se habla por micrófono (o se escribe) de cualquier tema: salud, clima, noticias o charla. Mismo estilo y stack que `columna-sana` (blanco, tinta #101B27, verde #6E9F3F, Schibsted Grotesk, líneas finas, nav oscuro, botones casi cuadrados).

- Idioma: español rioplatense (voseo).
- Stack: React (JSX + hooks, importando de "react") con Vite; runtime Preact vía @preact/preset-vite para que el bundle sea mínimo. No agregar librerías salvo pedido explícito. Única extra: Motion.
- Estructura: `src/App.jsx` (vista setup/chat, preferencias), `src/components/Setup.jsx` (elegir enfermera/enfermero, nombre, ciudad, clave), `src/components/Chat.jsx` (charla, micrófono, voz, sugerencias), `src/components/Avatar.jsx` (SVG propio; estados idle/talking/listening/thinking), `src/lib/ai.js` (API de Gemini), `src/lib/weather.js` (Open-Meteo), `src/lib/voice.js` (Web Speech API), `src/lib/store.js` (localStorage).
- IA: API de Gemini (`generateContent`) llamada desde el navegador con la clave de cada persona (guardada solo en su localStorage, header `x-goog-api-key`). Modelo en `MODEL` de ai.js (`gemini-3.5-flash-lite`: el más rápido y barato). Noticias y datos de hoy: grounding con `googleSearch`. Clima: si el mensaje lo pide (`WEATHER_RE`), se trae el pronóstico real de Open-Meteo (sin clave) y se inyecta en el prompt de sistema; en ese turno se apaga la búsqueda. El prompt de sistema define la personalidad: respuestas cortas para voz, sin markdown.
- Voz: reconocimiento con `SpeechRecognition` (es-AR; Chrome, Edge y Safari) y síntesis con `speechSynthesis`, eligiendo una voz en español del género elegido. Si el navegador no tiene micrófono, se oculta el botón y se escribe.
- Contenido de salud: tono calmo, no alarmista, sin dosis de medicamentos, recomendar consulta médica cuando corresponda y pedir ayuda inmediata solo ante emergencias claras. Siempre visible el aviso de que no reemplaza al médico.
- Estilos en `src/styles.css`, todo color nuevo como variable en `:root`. Solo tema claro.
- Animaciones: `LazyMotion features={domAnimation} strict` + `MotionConfig reducedMotion="user"`; usar `import * as m from "motion/react-m"` (nunca `motion.*`). Helpers en `src/motion.jsx`. UI ≤ 300ms. Todo lo que se presiona hace `scale(0.97)`; hovers dentro de `@media (hover: hover) and (pointer: fine)`.
- Skills de diseño en `.claude/skills/` (copiadas de columna-sana): `emil-design-eng`, `impeccable`, `taste-skill`, `frontend-design`, `motion` y `find-skills`. Este CLAUDE.md manda sobre ellas.
- Deploy: GitHub Actions (`.github/workflows/deploy.yml`) buildea y publica en GitHub Pages en cada push a `main`. `base` en vite.config.js es `/enfermero-ia/`.
- Mobile first: verificar en ~380px.
