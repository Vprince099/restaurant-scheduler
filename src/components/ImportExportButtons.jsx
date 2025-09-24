import React, { useRef } from "react";
import { useSettings } from "../hooks/useSettings";
import { exportSettingsFile } from "../settings/storage";
import { validateAndMigrate } from "../settings/schema";

export default function ImportExportButtons() {
  const { settings, setSettings } = useSettings();
  const fileRef = useRef(null);

  const onImportClick = () => fileRef.current?.click();
  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const cleaned = validateAndMigrate(json);
      setSettings(cleaned);
      alert("Settings imported.");
    } catch (err) {
      console.error(err);
      alert("Invalid settings file.");
    } finally {
      e.target.value = ""; // allow re-importing same file
    }
  };

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <button type="button" onClick={() => exportSettingsFile(settings)}>Export Settings</button>
      <button type="button" onClick={onImportClick}>Import Settings</button>
      <input ref={fileRef} type="file" accept="application/json" onChange={onFile} style={{ display: "none" }} />
    </div>
  );
}
