// Elige el proveedor de IA según lo que eligió la persona.
import { askGemini } from "./gemini.js";
import { askOpenAI } from "./openai.js";

export const PROVIDERS = {
  gemini: {
    name: "Gemini",
    keyLabel: "Clave de la API de Gemini",
    placeholder: "AIza…",
    link: "https://aistudio.google.com/apikey",
    linkText: "aistudio.google.com/apikey",
    ask: askGemini,
    valid: (k) => !k.startsWith("sk-"),
    invalid: "Esa parece una clave de OpenAI. Acá va la de Gemini (empieza con AIza o AQ.).",
  },
  openai: {
    name: "OpenAI (ChatGPT)",
    keyLabel: "Clave de la API de OpenAI",
    placeholder: "sk-…",
    link: "https://platform.openai.com/api-keys",
    linkText: "platform.openai.com/api-keys",
    ask: askOpenAI,
    valid: (k) => k.startsWith("sk-"),
    invalid: "La clave de OpenAI empieza con sk-. Es la de platform.openai.com, no la de la suscripción de ChatGPT.",
  },
};

export const ask = (args) => PROVIDERS[args.persona.provider || "gemini"].ask(args);
