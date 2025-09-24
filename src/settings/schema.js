export const SETTINGS_VERSION = 1;

export const DEFAULT_SETTINGS = {
  version: SETTINGS_VERSION,
  app: {
    name: "Restaurant Scheduler",
    theme: "system", // "light" | "dark" | "system"
  },
  business: {
    storeName: "",
    timezone: "America/Chicago",
    roles: ["Server", "Host", "Cook", "Dish"],
  },
  scheduling: {
    weekStart: "Monday", // Sunday | Monday
    openTime: "08:00",
    closeTime: "22:00",
    defaultShiftLengthHours: 8,
    allowOverlappingShifts: false,
  },
  labor: {
    wageByRole: {
      Server: 3.0,
      Host: 12.0,
      Cook: 18.0,
      Dish: 12.0,
    },
    overtimeRule: { thresholdHours: 40, multiplier: 1.5 },
  },
  features: {
    autoAssign: false,
    warnOnOvertime: true,
  },
};

export function validateAndMigrate(raw) {
  if (!raw || typeof raw !== "object") return structuredClone(DEFAULT_SETTINGS);

  let s = { ...raw };
  if (!("version" in s)) s.version = 1; // treat as v1 baseline

  s.app = {
    name: typeof s?.app?.name === "string" ? s.app.name : DEFAULT_SETTINGS.app.name,
    theme: ["light", "dark", "system"].includes(s?.app?.theme)
      ? s.app.theme
      : DEFAULT_SETTINGS.app.theme,
  };

  s.business = {
    storeName: typeof s?.business?.storeName === "string" ? s.business.storeName : "",
    timezone: typeof s?.business?.timezone === "string" ? s.business.timezone : DEFAULT_SETTINGS.business.timezone,
    roles: Array.isArray(s?.business?.roles) ? s.business.roles.filter(Boolean) : DEFAULT_SETTINGS.business.roles,
  };

  s.scheduling = {
    weekStart: ["Sunday", "Monday"].includes(s?.scheduling?.weekStart) ? s.scheduling.weekStart : DEFAULT_SETTINGS.scheduling.weekStart,
    openTime: isHHMM(s?.scheduling?.openTime) ? s.scheduling.openTime : DEFAULT_SETTINGS.scheduling.openTime,
    closeTime: isHHMM(s?.scheduling?.closeTime) ? s.scheduling.closeTime : DEFAULT_SETTINGS.scheduling.closeTime,
    defaultShiftLengthHours: numOrDefault(s?.scheduling?.defaultShiftLengthHours, DEFAULT_SETTINGS.scheduling.defaultShiftLengthHours),
    allowOverlappingShifts: !!s?.scheduling?.allowOverlappingShifts,
  };

  s.labor = {
    wageByRole: isPlainObject(s?.labor?.wageByRole) ? s.labor.wageByRole : DEFAULT_SETTINGS.labor.wageByRole,
    overtimeRule: {
      thresholdHours: numOrDefault(s?.labor?.overtimeRule?.thresholdHours, DEFAULT_SETTINGS.labor.overtimeRule.thresholdHours),
      multiplier: numOrDefault(s?.labor?.overtimeRule?.multiplier, DEFAULT_SETTINGS.labor.overtimeRule.multiplier),
    },
  };

  s.features = {
    autoAssign: !!s?.features?.autoAssign,
    warnOnOvertime: !!s?.features?.warnOnOvertime,
  };

  s.version = SETTINGS_VERSION;
  return s;
}

function isHHMM(v) {
  return typeof v === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
}
function numOrDefault(v, d) {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
}
function isPlainObject(o) {
  return o && typeof o === "object" && !Array.isArray(o);
}
