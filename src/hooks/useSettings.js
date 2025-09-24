import { useSettingsContext } from "../context/SettingsContext";

export function useSettings() {
  const { settings, setSettings, resetSettings } = useSettingsContext();
  const update = (path, value) => {
    const parts = path.split(".");
    setSettings(prev => {
      const next = structuredClone(prev);
      let cur = next;
      for (let i = 0; i < parts.length - 1; i++) {
        const key = parts[i];
        if (!(key in cur) || typeof cur[key] !== "object") cur[key] = {};
        cur = cur[key];
      }
      cur[parts[parts.length - 1]] = value;
      return next;
    });
  };
  return { settings, setSettings, update, resetSettings };
}
