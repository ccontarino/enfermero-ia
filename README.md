# Enfermero IA

Charlá por voz con tu enfermera o enfermero virtual. Elegís quién te acompaña, le ponés nombre y le hablás por micrófono de lo que quieras: cómo te sentís, el clima de tu ciudad, las noticias del día o simplemente charlar.

**Web:** https://ccontarino.github.io/enfermero-ia/

## Cómo funciona

- **IA:** a elección: Gemini (Google), Claude (Anthropic) u OpenAI (ChatGPT). Cada persona carga su propia clave de API ([Google AI Studio](https://aistudio.google.com/apikey), [platform.claude.com](https://platform.claude.com) o [platform.openai.com](https://platform.openai.com/api-keys)), que queda guardada solo en su navegador. Las claves de Claude y OpenAI son las de la API, no las de las suscripciones.
- **Clima real:** [Open-Meteo](https://open-meteo.com) (gratis, sin clave).
- **Noticias:** búsqueda web integrada en cada proveedor.
- **Voz:** la enfermera habla con la voz natural de Gemini TTS (con una clave de Gemini) y la boca sigue el volumen del audio; sin esa clave usa la voz del navegador. El micrófono usa la Web Speech API. Mejor en Chrome.

> Es una compañía para charlar y orientarte. No reemplaza a tu médico.

## Desarrollo

```bash
npm install
npm run dev
```

Cada push a `main` se publica solo en GitHub Pages.
