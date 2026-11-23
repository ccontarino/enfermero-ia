// Elige el proveedor de IA según lo que eligió la persona.
import { askGemini } from "./gemini.js";
import { askClaude } from "./claude.js";
import { askOpenAI } from "./openai.js";
import { askLocal } from "./local.js";

export const PROVIDERS = {
  gemini: {
    name: "Gemini",
    keyLabel: "Clave de la API de Gemini",
    placeholder: "AIza…",
    link: "https://aistudio.google.com/apikey",
    linkText: "aistudio.google.com/apikey",
    ask: askGemini,
    valid: (k) => !k.startsWith("sk-"),
    invalid: "Esa no parece una clave de Gemini. La de Gemini empieza con AIza o AQ.",
  },
  claude: {
    name: "Claude",
    keyLabel: "Clave de la API de Claude",
    placeholder: "sk-ant-…",
    link: "https://platform.claude.com/settings/keys",
    linkText: "platform.claude.com",
    ask: askClaude,
    valid: (k) => k.startsWith("sk-ant-"),
    invalid: "La clave de Claude empieza con sk-ant-. Es la de la API, no la de la suscripción de Claude.ai.",
  },
  openai: {
    name: "OpenAI",
    keyLabel: "Clave de la API de OpenAI",
    placeholder: "sk-…",
    link: "https://platform.openai.com/api-keys",
    linkText: "platform.openai.com/api-keys",
    ask: askOpenAI,
    valid: (k) => k.startsWith("sk-") && !k.startsWith("sk-ant-"),
    invalid: "La clave de OpenAI empieza con sk-. Es la de platform.openai.com, no la de la suscripción de ChatGPT.",
  },
  local: {
    name: "Local",
    noKey: true,
    ask: askLocal,
    note: "Corre en tu navegador, gratis y sin clave. Solo en Chrome de compu (versión 148 o más). La primera vez baja el modelo, que necesita unos 22 GB libres en el disco. No ve noticias de hoy.",
  },
};

export const ask = (args) => PROVIDERS[args.persona.provider || "gemini"].ask(args);