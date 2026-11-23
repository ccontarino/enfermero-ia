// Preferencias en localStorage, a prueba de navegadores que lo bloquean.
const KEY = "enfermero-ia";

export function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; }
}
export function save(data) {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
}
