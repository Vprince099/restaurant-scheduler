import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { loadSettings, saveSettings } from "../settings/storage";
import { DEFAULT_SETTINGS } from "../settings/schema";

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => loadSettings());
  const saveTimer = useRef(null);

  useEffect(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveSettings(settings);
    }, 400);
    return () => clearTimeout(saveTimer.current);
  }, [settings]);

  const value = useMemo(() => ({
    settings,
    setSettings,
    resetSettings: () => setSettings(DEFAULT_SETTINGS)
  }), [settings]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettingsContext() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettingsContext must be used within <SettingsProvider>");
  return ctx;
}
