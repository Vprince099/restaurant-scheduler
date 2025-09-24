import { DEFAULT_SETTINGS, validateAndMigrate } from "./schema";

const LS_KEY = "restaurantScheduler.settings.v1";

export function loadSettings() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return structuredClone(DEFAULT_SETTINGS);
    const parsed = JSON.parse(raw);
    return validateAndMigrate(parsed);
  } catch (e) {
    console.warn("Failed to load settings, using defaults", e);
    return structuredClone(DEFAULT_SETTINGS);
  }
}

export function saveSettings(settings) {
  try {
    const toSave = validateAndMigrate(settings);
    localStorage.setItem(LS_KEY, JSON.stringify(toSave));
    return true;
  } catch (e) {
    console.error("Failed to save settings", e);
    return false;
  }
}

export function exportSettingsFile(settings) {
  const blob = new Blob([JSON.stringify(validateAndMigrate(settings), null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  a.download = `restaurant-scheduler-settings-${ts}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function importSettingsFile(file) {
  const text = await file.text();
  const json = JSON.parse(text);
  return validateAndMigrate(json);
}
