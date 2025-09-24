import React from "react";
import { useSettings } from "../hooks/useSettings";
import ImportExportButtons from "./ImportExportButtons.jsx";

export default function SettingsPanel() {
  const { settings, update, resetSettings } = useSettings();

  const rolesStr = settings.business.roles.join(", ");

  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 720 }}>
      <h2>Settings</h2>

      {/* Import / Export buttons */}
      <ImportExportButtons />

      <section>
        <h3>App</h3>
        <label>
          Theme:&nbsp;
          <select
            value={settings.app.theme}
            onChange={(e) => update("app.theme", e.target.value)}
          >
            <option value="system">System</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
      </section>

      <section>
        <h3>Business</h3>
        <label style={{ display: "block" }}>
          Store name
          <input
            type="text"
            value={settings.business.storeName}
            onChange={(e) => update("business.storeName", e.target.value)}
            placeholder="e.g., El Molino Grill"
          />
        </label>
        <label style={{ display: "block" }}>
          Timezone
          <input
            type="text"
            value={settings.business.timezone}
            onChange={(e) => update("business.timezone", e.target.value)}
            placeholder="America/Chicago"
          />
        </label>
        <label style={{ display: "block" }}>
          Roles (comma separated)
          <input
            type="text"
            value={rolesStr}
            onChange={(e) =>
              update(
                "business.roles",
                e.target.value.split(",").map(s => s.trim()).filter(Boolean)
              )
            }
          />
        </label>
      </section>

      <section>
        <h3>Scheduling</h3>
        <label>
          Week starts:&nbsp;
          <select
            value={settings.scheduling.weekStart}
            onChange={(e) => update("scheduling.weekStart", e.target.value)}
          >
            <option>Sunday</option>
            <option>Monday</option>
          </select>
        </label>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          <label>
            Open
            <input
              type="time"
              value={settings.scheduling.openTime}
              onChange={(e) => update("scheduling.openTime", e.target.value)}
            />
          </label>
          <label>
            Close
            <input
              type="time"
              value={settings.scheduling.closeTime}
              onChange={(e) => update("scheduling.closeTime", e.target.value)}
            />
          </label>
          <label>
            Default shift (hrs)
            <input
              type="number"
              min={1}
              max={16}
              value={settings.scheduling.defaultShiftLengthHours}
              onChange={(e) =>
                update("scheduling.defaultShiftLengthHours", Number(e.target.value))
              }
            />
          </label>
        </div>
        <label>
          <input
            type="checkbox"
            checked={settings.scheduling.allowOverlappingShifts}
            onChange={(e) => update("scheduling.allowOverlappingShifts", e.target.checked)}
          />
          &nbsp;Allow overlapping shifts
        </label>
      </section>

      <section>
        <h3>Labor</h3>
        <div style={{ display: "grid", gap: 8 }}>
          {Object.entries(settings.labor.wageByRole).map(([role, wage]) => (
            <label
              key={role}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 120px",
                gap: 8,
                alignItems: "center"
              }}
            >
              <span>{role}</span>
              <input
                type="number"
                step="0.01"
                value={wage}
                onChange={(e) => update(`labor.wageByRole.${role}`, Number(e.target.value))}
              />
            </label>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <label>
            OT threshold (hrs)
            <input
              type="number"
              value={settings.labor.overtimeRule.thresholdHours}
              onChange={(e) =>
                update("labor.overtimeRule.thresholdHours", Number(e.target.value))
              }
            />
          </label>
          <label>
            OT multiplier
            <input
              type="number"
              step="0.1"
              value={settings.labor.overtimeRule.multiplier}
              onChange={(e) =>
                update("labor.overtimeRule.multiplier", Number(e.target.value))
              }
            />
          </label>
        </div>
      </section>

      <section>
        <h3>Features</h3>
        <label>
          <input
            type="checkbox"
            checked={settings.features.autoAssign}
            onChange={(e) => update("features.autoAssign", e.target.checked)}
          />
          &nbsp;Enable auto-assign
        </label>
        <label>
          <input
            type="checkbox"
            checked={settings.features.warnOnOvertime}
            onChange={(e) => update("features.warnOnOvertime", e.target.checked)}
          />
          &nbsp;Warn on overtime
        </label>
      </section>
    </div>
  );
}

