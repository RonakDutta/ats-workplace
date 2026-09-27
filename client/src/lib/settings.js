/**
 * Analysis preferences live in this browser only. Every read and write goes
 * through here so the storage keys are defined once.
 */
const API_KEY = "gemini_api_key";
const STRICTNESS = "ml_strictness";
export const DEFAULT_STRICTNESS = 50;

function read(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage can be unavailable in private browsing.
  }
}

export function getApiKey() {
  return read(API_KEY) ?? "";
}

export function setApiKey(value) {
  write(API_KEY, value);
}

export function getStrictness() {
  const raw = read(STRICTNESS);
  const value = Number(raw);
  return raw !== null && Number.isFinite(value)
    ? Math.min(100, Math.max(0, value))
    : DEFAULT_STRICTNESS;
}

export function setStrictness(value) {
  write(STRICTNESS, String(value));
}

export function looksLikeGeminiKey(value) {
  return value.startsWith("AIza") && value.length > 20;
}
