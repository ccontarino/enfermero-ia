# Enfermero IA

Charlá por voz con tu enfermera o enfermero virtual. Elegís quién te acompaña, le ponés nombre y le hablás por micrófono de lo que quieras: cómo te sentís, el clima de tu ciudad, las noticias del día o simplemente charlar.

**Web:** https://ccontarino.github.io/enfermero-ia/

## Cómo funciona

- **IA:** Gemini (API de Google, modelo `gemini-3.5-flash-lite`). Cada persona carga su clave de [Google AI Studio](https://aistudio.google.com/apikey), que queda guardada solo en su navegador.
- **Clima real:** [Open-Meteo](https://open-meteo.com) (gratis, sin clave).
- **Noticias:** búsqueda de Google integrada en Gemini.
- **Voz:** Web Speech API del navegador (micrófono y lectura en voz alta). Mejor en Chrome.

> Es una compañía para charlar y orientarte. No reemplaza a tu médico.

## Desarrollo

```bash
npm install
npm run dev
```

Cada push a `main` se publica solo en GitHub Pages.
