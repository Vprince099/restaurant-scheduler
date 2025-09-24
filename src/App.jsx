import React, { useMemo, useState, useEffect, useRef } from "react";
import { format, addDays, startOfWeek } from "date-fns";
import { v4 as uuidv4 } from "uuid";
import ImportExportButtons from "./components/ImportExportButtons.jsx";
import SettingsPanel from "./components/SettingsPanel.jsx";

// ---------------------- Global Styles ----------------------
function GlobalStyles() {
  return (
    <style>{`
      :root{
        /* Dark (default) */
        --bg:#0b0b0b; --surface:#121212; --surface-2:#1a1a1a; --ink:#f5f5f5; --muted:#b3b3b7; --border:#282828; --ring:rgba(59,130,246,.35);
        --primary:#22c55e; --primary-ink:#0b0b0b; --danger:#ef4444;
      }
      @media (prefers-color-scheme: light){
        :root{ --bg:#fafafa; --surface:#ffffff; --surface-2:#f9fafb; --ink:#111111; --muted:#6b7280; --border:#e5e7eb; --ring:rgba(37,99,235,.35); --primary:#111111; --primary-ink:#ffffff; --danger:#dc2626; }
      }
      *{ box-sizing:border-box } html,body,#root{ height:100% } body{ margin:0; background:var(--bg); color:var(--ink); font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial }
      .container{ padding:20px; max-width:1200px; margin:0 auto }
      .header{ margin-bottom:20px } .headline{ font-size:28px; font-weight:800; letter-spacing:-.02em } .muted{ color:var(--muted) }
      .card{ background:var(--surface); border:1px solid var(--border); border-radius:16px; box-shadow:0 1px 3px rgba(0,0,0,.18) } .card-content{ padding:16px }
      .section{ margin-bottom:24px } .section-head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; gap:8px; flex-wrap:wrap } .section-title{ font-size:20px; font-weight:700 }
      .btn{ appearance:none; border-radius:12px; padding:10px 14px; border:1px solid var(--border); cursor:pointer; font:inherit; transition:transform .02s, filter .15s, box-shadow .2s, background .15s }
      .btn:active{ transform:translateY(1px) } .btn:focus-visible{ outline:none; box-shadow:0 0 0 4px var(--ring) }
      .btn--primary{ background:var(--primary); color:var(--primary-ink); border-color:transparent } .btn--primary:hover{ filter:brightness(1.05) }
      .btn--secondary{ background:var(--surface-2); color:var(--ink) } .btn--secondary:hover{ filter:brightness(1.06) }
      .btn--ghost{ background:transparent; color:var(--ink) } .btn--ghost:hover{ background:var(--surface-2) }
      .btn--danger{ background:var(--danger); color:#fff; border-color:transparent }
      .input, .select, .textarea{ width:100%; padding:10px 12px; border:1px solid var(--border); border-radius:10px; background:var(--surface-2); color:var(--ink) }
      .input::placeholder, .textarea::placeholder{ color:var(--muted) } .input:focus, .select:focus, .textarea:focus{ outline:none; box-shadow:0 0 0 4px var(--ring) }
      .chip{ padding:6px 10px; border:1px solid var(--border); border-radius:999px; background:var(--surface-2); color:var(--ink); cursor:pointer }
      .chip--selected{ background:var(--primary); color:var(--primary-ink); border-color:transparent }
      .chip--danger-selected{ background:var(--danger); color:#fff; border-color:transparent }
      .grid-7{ display:grid; grid-template-columns:repeat(7, 1fr); gap:12px } .grid-auto{ display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:10px }
      .day-col{ background:var(--surface); border:1px solid var(--border); border-radius:16px; padding:10px } .day-title{ font-weight:700; margin-bottom:8px }
      .shift{ padding:10px; border:1px solid var(--border); border-radius:12px; background:var(--surface-2) }
      .shift--unassigned{ border-color: var(--danger); box-shadow: inset 0 0 0 1px var(--danger) }
      .small{ font-size:12px } .spacer-8{ height:8px }
      /* Availability / Closed toggles */
      .day-toggle-grid{ display:grid; grid-template-columns:repeat(auto-fit, minmax(72px,1fr)); gap:8 }
      .chip--toggle{ display:block; width:100%; text-align:center; font-weight:600; padding:10px 0; user-select:none; white-space:nowrap }
      .closed-banner{ padding:10px; text-align:center; border:1px dashed var(--border); border-radius:12px; opacity:.8 }
    `}</style>
  );
}

// ---------------------- Constants & Helpers ----------------------
function timeTo12h(t){
  try{
    const [H,M] = String(t).split(':').map(Number);
    if (Number.isNaN(H) || Number.isNaN(M)) return String(t);
    const ampm = H >= 12 ? 'PM' : 'AM';
    let h = H % 12; if (h === 0) h = 12;
    const hh = String(h).padStart(2,'0');
    const mm = String(M).padStart(2,'0');
    return `${hh}:${mm} ${ampm}`;
  }catch{ return String(t); }
}

const DAYS = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];

// ---- Lightweight UI primitives ----
function Button({ children, variant = 'secondary', className, style, ...props }) {
  const base = { padding:'8px 12px', borderRadius:12, border:'1px solid var(--border)', background:'var(--surface-2)', cursor:'pointer' };
  const variants = { primary:{ background:'var(--accent)', borderColor:'var(--accent)', color:'var(--on-accent)' }, danger:{ background:'transparent', borderColor:'var(--danger)', color:'var(--danger)' }, secondary:{} };
  const finalStyle = { ...base, ...(variants[variant]||{}), ...(style||{}) };
  return (<button className={className} style={finalStyle} {...props}>{children}</button>);
}
function Input({ className, style, ...props }) {
  const base = { padding:'8px 10px', borderRadius:12, border:'1px solid var(--border)', background:'var(--surface-2)', width:'100%', font:'inherit' };
  return (<input className={className} style={{ ...base, ...(style||{}) }} {...props} />);
}
function Select({ className, style, children, ...props }) {
  const base = { padding:'8px 10px', borderRadius:12, border:'1px solid var(--border)', background:'var(--surface-2)', width:'100%', font:'inherit' };
  return (<select className={className} style={{ ...base, ...(style||{}) }} {...props}>{children}</select>);
}
function Textarea({ className, style, ...props }) {
  const base = { padding:'8px 10px', borderRadius:12, border:'1px solid var(--border)', background:'var(--surface-2)', width:'100%', minHeight:80, font:'inherit' };
  return (<textarea className={className} style={{ ...base, ...(style||{}) }} {...props} />);
}
function Section({ title, actions, children }) {
  return (
    <section className="section" style={{ marginBottom: 16 }}>
      <div className="section__header" style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, marginBottom:8 }}>
        <h2 style={{ fontSize:16, margin:0 }}>{title}</h2>
        {actions ? <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>{actions}</div> : null}
      </div>
      <div className="section__body">{children}</div>
    </section>
  );
}
const STORAGE_KEY = "restaurantScheduler_v1";

function parseTimeToMinutes(t) { const [h, m] = String(t).split(":").map(Number); return h * 60 + m; }
function minutesToTime(mins) { const h = Math.floor(mins / 60).toString().padStart(2, "0"); const m = (mins % 60).toString().padStart(2, "0"); return `${h}:${m}`; }
function diffHours(start, end) { return (parseTimeToMinutes(end) - parseTimeToMinutes(start)) / 60; }
function overlap(aStart, aEnd, bStart, bEnd) { const aS = parseTimeToMinutes(aStart), aE = parseTimeToMinutes(aEnd), bS = parseTimeToMinutes(bStart), bE = parseTimeToMinutes(bEnd); return Math.max(aS, bS) < Math.min(aE, bE); }
// ---- Role-based time overrides ----
function resolveShiftTimesByRole(shift, roles) {
  const rn = String(shift.role || '').trim().toLowerCase();
  const role = (roles || []).find(
    r => String(r.name || '').trim().toLowerCase() === rn
  );
  const perLabel = role?.timeOverrides?.[shift.label];
  const start = (perLabel?.start && perLabel.start !== '') ? perLabel.start : shift.start;
  const end   = (perLabel?.end   && perLabel.end   !== '') ? perLabel.end   : shift.end;
  return { start, end };
}


function applyRoleTimeOverrides(shifts, roles){
  return (shifts || []).map(s => {
    const t = resolveShiftTimesByRole(s, roles);
    // Only clone if something actually changed
    if (t.start === s.start && t.end === s.end) return s;
    return { ...s, start: t.start, end: t.end };
  });
}

function buildWeekDates(weekStartDate) { const start = startOfWeek(weekStartDate, { weekStartsOn: 1 }); return Array.from({ length: 7 }, (_, i) => addDays(start, i)); }
function csvEscape(val) { return String(val ?? "").replaceAll('"', '""'); }
function empName(empId, employees) { const e = employees.find((x) => x.id === empId); return e ? e.name : ""; }
function safeLoad() { try { const raw = localStorage.getItem(STORAGE_KEY); if (!raw) return null; const data = JSON.parse(raw); if (typeof data !== "object" || data === null) return null; return data; } catch { return null; } }
function deepClone(obj){ return JSON.parse(JSON.stringify(obj)); }

// ---------------------- Default Data ----------------------
const defaultRoles = [ { id: uuidv4(), name: "Server", hourly: 12, priority: 10 }, { id: uuidv4(), name: "Cook", hourly: 16, priority: 8 }, { id: uuidv4(), name: "Host", hourly: 11, priority: 5 } ];
const defaultEmployees = [
  { id: uuidv4(), name: "Ava", roles: ["Server", "Host"], maxHours: 30, availability: {
    Mon:{ Lunch:true, Dinner:true }, Tue:{ Lunch:true, Dinner:true }, Wed:{ Lunch:true, Dinner:true }, Thu:{ Lunch:false, Dinner:false }, Fri:{ Lunch:true, Dinner:true }, Sat:{ Lunch:true, Dinner:true }, Sun:{ Lunch:false, Dinner:false }
  } },
  { id: uuidv4(), name: "Ben", roles: ["Cook"], maxHours: 35, availability: {
    Mon:{ Lunch:true, Dinner:true }, Tue:{ Lunch:true, Dinner:true }, Wed:{ Lunch:false, Dinner:false }, Thu:{ Lunch:true, Dinner:true }, Fri:{ Lunch:true, Dinner:true }, Sat:{ Lunch:false, Dinner:false }, Sun:{ Lunch:false, Dinner:false }
  } },
  { id: uuidv4(), name: "Cara", roles: ["Server"], maxHours: 25, availability: {
    Mon:{ Lunch:false, Dinner:false }, Tue:{ Lunch:true, Dinner:true }, Wed:{ Lunch:true, Dinner:true }, Thu:{ Lunch:true, Dinner:true }, Fri:{ Lunch:false, Dinner:false }, Sat:{ Lunch:true, Dinner:true }, Sun:{ Lunch:true, Dinner:true }
  } },
  { id: uuidv4(), name: "Diego", roles: ["Cook", "Server"], maxHours: 32, availability: {
    Mon:{ Lunch:true, Dinner:true }, Tue:{ Lunch:false, Dinner:false }, Wed:{ Lunch:true, Dinner:true }, Thu:{ Lunch:true, Dinner:true }, Fri:{ Lunch:true, Dinner:true }, Sat:{ Lunch:true, Dinner:true }, Sun:{ Lunch:false, Dinner:false }
  } },
];
const defaultShiftTemplates = [
  { label: "Lunch",     start: "12:00", end: "16:00" },
  { label: "Dinner",    start: "16:00", end: "22:00" },
];
const defaultDemand = { Lunch: { Server: 2, Cook: 2, Host: 1 }, Dinner: { Server: 3, Cook: 2, Host: 1 } };
const defaultDemandDaily = DAYS.reduce((acc, d) => { acc[d] = deepClone(defaultDemand); return acc; }, {});

// ----- Role helpers (rename / remove across app state) -----
function renameRoleInDemandObj(demand, oldName, newName){
  const out = {};
  for(const label of Object.keys(demand||{})){
    const inner = demand[label] || {};
    const nextInner = {};
    for(const k of Object.keys(inner)){
      nextInner[k === oldName ? newName : k] = inner[k];
    }
    out[label] = nextInner;
  }
  return out;
}
function removeRoleFromDemandObj(demand, roleName){
  const out = {};
  for(const label of Object.keys(demand||{})){
    const inner = demand[label] || {};
    const { [roleName]: _drop, ...rest } = inner;
    out[label] = rest;
  }
  return out;
}
function renameRoleInDemandDaily(demandDaily, oldName, newName){
  const out = {};
  for(const day of Object.keys(demandDaily||{})){
    out[day] = renameRoleInDemandObj(demandDaily[day]||{}, oldName, newName);
  }
  return out;
}
function removeRoleFromDemandDaily(demandDaily, roleName){
  const out = {};
  for(const day of Object.keys(demandDaily||{})){
    out[day] = removeRoleFromDemandObj(demandDaily[day]||{}, roleName);
  }
  return out;
}

// ----- Demand normalization (keeps JSON in sync with current templates & roles) -----
function normalizeDemand(demand, templates, roles){
  const out = {};
  const tplLabels = (templates||[]).map(t=>t.label);
  const roleNames = (roles||[]).map(r=>r.name);
  for(const label of tplLabels){
    const src = (demand && demand[label]) || {};
    const row = {};
    for(const role of roleNames){
      let n = src[role];
      if (typeof n !== 'number' || !isFinite(n)) n = Number(n);
      if (!isFinite(n) || n < 0) n = 0;
      row[role] = Math.round(n || 0);
    }
    out[label] = row;
  }
  return out;
}
function normalizeDemandDaily(demandDaily, templates, roles){
  const out = {};
  for(const d of DAYS){
    out[d] = normalizeDemand((demandDaily&&demandDaily[d])||{}, templates, roles);
  }
  return out;
}

// ----- Availability helpers (per-day, per-shift) -----
function makeDefaultAvailabilityForTemplates(templates){
  const labels = (templates||[]).map(t=>t.label);
  const weekdays = new Set(["Mon","Tue","Wed","Thu","Fri"]);
  const baseRow = (on)=> Object.fromEntries(labels.map(l => [l, !!on]));
  const out = {};
  for(const d of DAYS){ out[d] = baseRow(weekdays.has(d)); }
  return out;
}
function coerceEmpAvailability(av, templates){
  const labels = (templates||[]).map(t=>t.label);
  // If legacy boolean-by-day, expand to all labels with same flag
  if (av && typeof av.Mon === 'boolean'){
    const out = {};
    for(const d of DAYS){
      const on = !!av[d];
      out[d] = Object.fromEntries(labels.map(l => [l, on]));
    }
    return out;
  }
  // Otherwise, ensure each day has each label
  const out = {};
  for(const d of DAYS){
    const row = av?.[d] || {};
    const filled = {};
    for(const l of labels){ filled[l] = !!row[l]; }
    out[d] = filled;
  }
  return out;
}

// ---------------------- Core Logic ----------------------
function autoAssign({ shifts, employees, roles }) {
  const empState = employees.map((e) => ({
    id: e.id,
    name: e.name,
    roles: e.roles,
    maxHours: e.maxHours,
    availability: e.availability,
    assigned: {},
    totalHours: 0,
  }));

  const roleSet = new Set(roles.map((r) => r.name));
  const priorityMap = Object.fromEntries((roles || []).map(r => [r.name, Number(r.priority) || 0]));

  // Copy then sort shifts so that higher-priority roles are assigned first
  const assignedShifts = shifts.map((s) => ({ ...s, employeeId: null }));
  assignedShifts.sort((a, b) => {
    const pa = priorityMap[a.role] || 0;
    const pb = priorityMap[b.role] || 0;
    if (pb !== pa) return pb - pa;               // higher priority first
    if (a.day !== b.day) return a.day - b.day;   // then by day
    return parseTimeToMinutes(a.start) - parseTimeToMinutes(b.start); // then by time
  });

  for (let i = 0; i < assignedShifts.length; i++) {
    const s = assignedShifts[i];
    if (!roleSet.has(s.role)) continue;

    const candidates = empState.filter((e) => {
      if (!e.roles.includes(s.role)) return false;
      const dayAvail = e.availability?.[DAYS[s.day]];
      if (!dayAvail || !dayAvail[s.label]) return false;

      // prevent overlaps with this employee's own assignments
      const blocks = e.assigned[s.day] || [];
      for (const b of blocks) {
        if (overlap(s.start, s.end, b.start, b.end)) return false;
      }

      // cap to max hours
      const hours = diffHours(s.start, s.end);
      if (e.totalHours + hours > e.maxHours) return false;
      return true;
    });

    // Fairness heuristic: prefer people with more hours left, then fewer assigned blocks
    candidates.sort((a, b) => {
      const aLeft = a.maxHours - a.totalHours;
      const bLeft = b.maxHours - b.totalHours;
      if (bLeft !== aLeft) return bLeft - aLeft;
      const aCount = Object.values(a.assigned).reduce((n, blocks) => n + blocks.length, 0);
      const bCount = Object.values(b.assigned).reduce((n, blocks) => n + blocks.length, 0);
      return aCount - bCount;
    });

    if (candidates.length > 0) {
      const pick = candidates[0];
      assignedShifts[i].employeeId = pick.id;
      const hours = diffHours(s.start, s.end);
      pick.totalHours += hours;
      if (!pick.assigned[s.day]) pick.assigned[s.day] = [];
      pick.assigned[s.day].push({ start: s.start, end: s.end });
    }
  }
  return assignedShifts;
}
function makeInitialShifts(weekDates, demandGlobal, shiftTemplates, closedDays, useDailyDemand=false, demandDaily=null) {
  const result = [];
  weekDates.forEach((date, idx) => {
    const dayName = DAYS[idx];
    if (closedDays && closedDays[dayName]) return; // skip closed days
    const dayDemand = useDailyDemand ? (demandDaily?.[dayName] || {}) : (demandGlobal || {});
    shiftTemplates.forEach((tpl) => {
      const rolesDemand = dayDemand[tpl.label] || {};
      Object.entries(rolesDemand).forEach(([role, count]) => {
        for (let i = 0; i < count; i++) {
          result.push({ id: uuidv4(), day: idx, dateISO: date.toISOString(), role, label: tpl.label, start: tpl.start, end: tpl.end, employeeId: null });
        }
      });
    });
  });
  return result;
}
function exportScheduleCSV(shifts, employees) { const empMap = Object.fromEntries(employees.map((e) => [e.id, e.name])); const header = ["Day", "Date", "Shift", "Role", "Start", "End", "Hours", "Employee"]; const rows = shifts.map((s) => { const date = new Date(s.dateISO); const hours = diffHours(s.start, s.end).toFixed(2); return [DAYS[s.day], format(date, "yyyy-MM-dd"), s.label, s.role, s.start, s.end, hours, s.employeeId ? empMap[s.employeeId] : "(unassigned)"]; }); const lines = [header, ...rows].map((r) => r.map((v) => `"${csvEscape(v)}"`).join(",")).join("\n"); const blob = new Blob([lines], { type: "text/csv;charset=utf-8;" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `schedule_${format(new Date(), "yyyyMMdd_HHmm")}.csv`; a.click(); URL.revokeObjectURL(url); }
function calcLaborCost(shifts, roles) { const roleRates = Object.fromEntries(roles.map((r) => [r.name, r.hourly ?? 0])); let total = 0; for (const s of shifts) total += diffHours(s.start, s.end) * (roleRates[s.role] ?? 0); return total; }

// ---------------------- Print / Read-only ----------------------
function buildPrintableHTML({ title, weekDates, shifts, roles, employees, notes, closedDays }) {
  // Group shifts by day
  const byDay = Array.from({ length: 7 }, () => []);
  for (const s of (shifts || [])) byDay[s.day].push(s);

  // Sort each day by *overridden* start time
  for (const list of byDay) {
    list.sort((a, b) => {
      const { start: sa } = resolveShiftTimesByRole(a, roles);
      const { start: sb } = resolveShiftTimesByRole(b, roles);
      return parseTimeToMinutes(sa) - parseTimeToMinutes(sb);
    });
  }

  // Build per-day sections
  const rowsPerDay = byDay.map((list, day) => {
    const dateStr = format(weekDates[day], "yyyy-MM-dd");

    if (closedDays && closedDays[DAYS[day]]) {
      return `<section class="day">
        <h2>${DAYS[day]} • ${dateStr}</h2>
        <div style="border:1px dashed #e5e7eb; padding:8px; border-radius:8px; text-align:center; opacity:.8">Closed</div>
      </section>`;
    }

    const body = list.map((s) => {
      const t = resolveShiftTimesByRole(s, roles); // apply role overrides
      const emp = s.employeeId
        ? empName(s.employeeId, employees)
        : '<span style="color:#b91c1c;font-weight:600">Unassigned</span>';
      return `<tr>
        <td>${s.label}</td>
        <td>${s.role}</td>
        <td>${timeTo12h(t.start)}</td>
        <td>${timeTo12h(t.end)}</td>
        <td>${emp}</td>
      </tr>`;
    }).join("");

    return `<section class="day">
      <h2>${DAYS[day]} • ${dateStr}</h2>
      <table>
        <thead>
          <tr><th>Shift</th><th>Role</th><th>Start</th><th>End</th><th>Employee</th></tr>
        </thead>
        <tbody>
          ${body || `<tr><td colspan="5" style="text-align:center;opacity:.6">No shifts</td></tr>`}
        </tbody>
      </table>
    </section>`;
  }).join("");

  const notesHTML = notes
    ? `<div class="notes"><strong>Manager Notes:</strong><br/>${String(notes).replaceAll("\n", "<br/>")}</div>`
    : "";

  // Final document
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    :root{ --ink:#111; --muted:#6b7280; }
    *{ box-sizing:border-box }
    body{ font-family: system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial; color:var(--ink); margin:24px }
    h1{ margin:0 0 4px; font-size:24px }
    h2{ font-size:16px; margin:16px 0 6px }
    .meta{ color:var(--muted); margin-bottom:12px }
    .notes{ margin-top:12px; padding:8px; border:1px solid #e5e7eb; border-radius:8px; }
    table{ border-collapse:collapse; width:100%; margin-top:4px }
    th,td{ border:1px solid #e5e7eb; padding:6px 8px; font-size:12px }
    th{ background:#111; color:#fff; text-align:left }
    .toolbar{ position:sticky; top:0; background:#fff; padding:8px 0; margin-bottom:8px }
    @media print{ .no-print{ display:none } body{ margin:0 } }
  </style>
</head>
<body>
  <div class="toolbar no-print">
    <button onclick="window.print()" style="padding:8px 12px;border:1px solid #e5e7eb;border-radius:8px;background:#111;color:#fff">
      Print / Save as PDF
    </button>
  </div>
  <h1>${title}</h1>
  <div class="meta">Week of ${format(weekDates[0], "MMM d, yyyy")} – ${format(weekDates[6], "MMM d, yyyy")}</div>
  ${rowsPerDay}
  ${notesHTML}
</body>
</html>`;
}

function openPrintableView({ title, weekDates, shifts, roles, employees, notes, closedDays }) {
  try {
    const sortedEmps = [...(employees || [])].sort((a, b) =>
      String(a.name || '').localeCompare(String(b.name || ''))
    );

    function cellHTML(empId, dayIdx) {
      const isClosed = !!(closedDays && closedDays[DAYS[dayIdx]]);
      if (isClosed) return '<div class="closed">Closed</div>';

      const dayShifts = (shifts || []).filter(s => s.day === dayIdx && s.employeeId === empId);

      const listFor = (label) => {
        const items = dayShifts
          .filter(s => s.label === label)
          .map(s => {
            const { start } = resolveShiftTimesByRole(s, roles);
            return `${timeTo12h(start)}`; // start time ONLY
          });
        return items.length ? items.join('<br/>') : '—';
      };

      const lunchTxt  = listFor('Lunch');
      const dinnerTxt = listFor('Dinner');

      return `<div class="slot"><div><b>L:</b> ${lunchTxt}</div><div><b>D:</b> ${dinnerTxt}</div></div>`;
    }

    const rows = sortedEmps.map(emp => {
      const cells = DAYS.map((_, dayIdx) => `<td>${cellHTML(emp.id, dayIdx)}</td>`).join('');
      return `<tr><td class="emp">${emp.name || ''}</td>${cells}</tr>`;
    }).join('');

    const table = `
      <table class="print-grid">
        <thead>
          <tr>
            <th>Employee</th>
            ${DAYS.map(d => `<th>${d}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>`;

    const styles = `
      <style>
        *{ box-sizing:border-box; }
        body{ font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji","Segoe UI Emoji"; margin:20px; color:#111; }
        h1{ font-size:18px; margin:0 0 8px 0; }
        .meta{ color:#555; margin-bottom:12px; }
        table{ width:100%; border-collapse:collapse; page-break-inside:auto; }
        th, td{ border:1px solid #ddd; padding:6px 8px; vertical-align:top; }
        thead th{ background:#f8f8f8; position:sticky; top:0; text-align:left; }
        .emp{ font-weight:600; white-space:nowrap; }
        .slot{ display:flex; flex-direction:column; gap:4px; min-height:34px; }
        .closed{ color:#b91c1c; font-weight:700; text-align:center; }
        @media print{ body{ margin:0 } .no-print{ display:none } }
      </style>`;

    const win = window.open('', '_blank');
    if (!win) return;

    win.document.write(`<!doctype html><html><head><meta charset="utf-8"/>${styles}<title>Schedule — ${title || ''}</title></head><body>`);
    win.document.write(`<div class="no-print" style="margin-bottom:8px"><button onclick="window.print()" style="padding:8px 12px;border:1px solid #e5e7eb;border-radius:8px;background:#111;color:#fff">Print / Save as PDF</button></div>`);
    win.document.write(`<h1>${title || 'Schedule'}</h1>`);
    if (Array.isArray(weekDates) && weekDates[0] && weekDates[6]) {
      win.document.write(`<div class="meta">Week of ${format(weekDates[0], "MMM d, yyyy")} – ${format(weekDates[6], "MMM d, yyyy")}</div>`);
    }
    win.document.write(table);
    if (notes) win.document.write(`<div class="meta"><b>Notes:</b> ${String(notes).replaceAll('\n','<br/>')}</div>`);
    win.document.write(`</body></html>`);
    win.document.close();
  } catch (e) {
    console.error('Printable view failed', e);
    alert('Printable view failed: ' + (e?.message || e));
  }
}

function RoleEditor({ roles, setRoles, employees, setEmployees, demand, setDemand, demandDaily, setDemandDaily, useDailyDemand, setUseDailyDemand, setShifts, templates }) {
  const [name, setName] = useState("");

  function RoleRow({ r }) {
    const [editing, setEditing] = useState(false);
    const [n, setN] = useState(r.name);
    const [ov, setOv] = useState(() => ({ ...(r.timeOverrides || {}) }));

    function setOverride(label, field, value) {
      setOv(prev => ({ ...prev, [label]: { ...(prev[label] || {}), [field]: value || '' } }));
    }
    function clearOverride(label) {
      setOv(prev => {
        const next = { ...prev }; delete next[label]; return next;
      });
    }
    function save() {
      const newName = (n || "").trim();
      if (!newName) { alert('Role name is required'); return; }
      if (roles.some(x => x.id !== r.id && x.name.toLowerCase() === newName.toLowerCase())) {
        alert('Another role already has this name'); return;
      }
      const oldName = r.name;
      setRoles(prev => prev.map(x => x.id === r.id ? { ...x, name: newName, timeOverrides: ov } : x));
      if (newName !== oldName) {
        setEmployees(prev => prev.map(e => ({ ...e, roles: (e.roles || []).map(role => role === oldName ? newName : role) })));
        setDemand(prev => renameRoleInDemandObj(prev, oldName, newName));
        setDemandDaily(prev => renameRoleInDemandDaily(prev, oldName, newName));
        setShifts(prev => prev.map(s => s.role === oldName ? { ...s, role: newName } : s));
      }
      setEditing(false);
    }
    function remove() {
      if (!confirm(`Delete role "${r.name}"? This will remove it from employees, demand, and delete any shifts requiring it.`)) return;
      setRoles(prev => prev.filter(x => x.id !== r.id));
      setEmployees(prev => prev.map(e => ({ ...e, roles: (e.roles || []).filter(role => role !== r.name) })));
      setDemand(prev => removeRoleFromDemandObj(prev, r.name));
      setDemandDaily(prev => removeRoleFromDemandDaily(prev, r.name));
      setShifts(prev => prev.filter(s => s.role !== r.name));
    }

    if (!editing) {
      return (
        <div className="card" style={{ padding:10, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
          <div style={{ display:'flex', alignItems:'baseline', gap:10 }}>
            <div style={{ fontWeight:700 }}>{r.name}</div>
            <div className="muted small">Priority: {r.priority ?? 0}</div>
          </div>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <Button onClick={()=>setEditing(true)}>Edit</Button>
            <Button onClick={() => setRoles(prev => prev.map(x => x.id===r.id ? { ...x, priority: (Number(r.priority)||0) + 1 } : x))}>Priority +</Button>
            <Button onClick={() => setRoles(prev => prev.map(x => x.id===r.id ? { ...x, priority: Math.max(0,(Number(r.priority)||0) - 1) } : x))}>Priority −</Button>
            <Button variant="danger" onClick={remove}>Delete</Button>
          </div>
        </div>
      );
    }

    const labels = (templates || []).map(t => t.label);
    return (
      <div
        className="card"
        style={{
          padding:10,
          display:'grid',
          gap:12,
          maxHeight:'66vh',           // 👈 vertical scroll within the editor
          overflowY:'auto',
          minHeight:0
        }}
      >
        {/* sticky header so controls remain visible */}
        <div
          style={{
            display:'grid',
            gridTemplateColumns:'1fr auto auto',
            gap:8,
            alignItems:'end',
            position:'sticky',
            top:0,
            background:'var(--surface-1)',
            paddingTop:4,
            paddingBottom:6,
            zIndex:1
          }}
        >
          <div>
            <label className="muted">Role name</label>
            <Input value={n} onChange={(e)=>setN(e.target.value)} />
          </div>
          <Button variant="primary" onClick={save}>Save</Button>
          <Button onClick={()=>{ setEditing(false); setN(r.name); setOv(r.timeOverrides || {}); }}>Cancel</Button>
        </div>

        {/* Per-template time overrides */}
        <div>
          <div className="muted small" style={{ marginBottom:6 }}>
            Optional time overrides for this role (leave blank to use the template times).
          </div>
          {/* 👇 horizontal scroll if table is wider than the card */}
          <div style={{ overflowX:'auto' }}>
            <table style={{ borderCollapse:'collapse', minWidth:640, width:'100%' }}>
              <thead>
                <tr>
                  <th style={{ textAlign:'left', border:'1px solid var(--border)', padding:'6px 8px', position:'sticky', left:0, background:'var(--surface-1)', zIndex:1 }}>Template</th>
                  <th style={{ textAlign:'left', border:'1px solid var(--border)', padding:'6px 8px' }}>Start</th>
                  <th style={{ textAlign:'left', border:'1px solid var(--border)', padding:'6px 8px' }}>End</th>
                  <th style={{ border:'1px solid var(--border)' }}></th>
                </tr>
              </thead>
              <tbody>
                {labels.map(label => {
                  const tpl = (templates || []).find(t => t.label === label) || {};
                  const row = ov[label] || {};
                  return (
                    <tr key={label}>
                      <td style={{ border:'1px solid var(--border)', padding:'6px 8px', fontWeight:600, position:'sticky', left:0, background:'var(--surface-1)' }}>{label}</td>
                      <td style={{ border:'1px solid var(--border)', padding:'6px 8px' }}>
                        <input type="time" className="input" value={row.start || ''} placeholder={tpl.start || ''} onChange={(e)=> setOverride(label, 'start', e.target.value)} />
                      </td>
                      <td style={{ border:'1px solid var(--border)', padding:'6px 8px' }}>
                        <input type="time" className="input" value={row.end || ''} placeholder={tpl.end || ''} onChange={(e)=> setOverride(label, 'end', e.target.value)} />
                      </td>
                      <td style={{ border:'1px solid var(--border)', padding:'6px 8px' }}>
                        <Button onClick={()=> clearOverride(label)}>Clear</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Section title="Roles & Rates">
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr auto", alignItems: "end" }}>
        <div>
          <label className="muted">Role name</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Server" />
        </div>
        <Button
          variant="primary"
          onClick={() => {
            if (!name.trim()) return;
            if (roles.some(r => r.name.toLowerCase() === name.trim().toLowerCase())) {
              alert('Role name already exists'); return;
            }
            setRoles(prev => [...prev, { id: uuidv4(), name: name.trim(), hourly: 0, priority: 0 }]);
            setName("");
          }}
        >
          Add role
        </Button>
      </div>

      <div className="grid-auto" style={{ marginTop: 16 }}>
        {roles.map(r => (<RoleRow key={r.id} r={r} />))}
      </div>

      <div style={{ marginTop:16, display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
        <label className="muted">Demand mode:</label>
        <button className={`chip ${!useDailyDemand?'chip--selected':''}`} onClick={()=> setUseDailyDemand(false)}>Global (by template)</button>
        <button
          className={`chip ${useDailyDemand?'chip--selected':''}`}
          onClick={()=>{
            setUseDailyDemand(true);
            if (!Object.keys(demandDaily || {}).length) {
              const next = {};
              for (const d of DAYS) next[d] = deepClone(demand);
              setDemandDaily(next);
            }
          }}
        >
          Per-day
        </button>
      </div>
    </Section>
  );
}

function AvailabilityGrid({ avail, setAvail, templates }){
  const labels = (templates||[]).map(t=>t.label);
  return (
    <div style={{ display:'grid', gridTemplateColumns:`80px repeat(${labels.length}, 1fr)`, gap:8, alignItems:'center' }}>
      <div />{labels.map(l => (<div key={l} className="muted small" style={{ fontWeight:600 }}>{l}</div>))}
      {DAYS.map((d) => (
        <React.Fragment key={d}>
          <div className="muted small" style={{ fontWeight:600 }}>{d}</div>
          {labels.map(l => (
            <button
              key={`${d}-${l}`}
              type="button"
              className={`chip chip--toggle ${avail?.[d]?.[l] ? 'chip--selected' : ''}`}
              aria-pressed={!!(avail?.[d]?.[l])}
              onClick={() => setAvail(prev => {
                const next = { ...(prev||{}) };
                const row = { ...(next[d]||{}) };
                row[l] = !row[l];
                next[d] = row;
                return next;
              })}
            >
              {avail?.[d]?.[l] ? 'On' : 'Off'}
            </button>
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}

function EmployeeEditor({ employees, setEmployees, roles, templates, setShifts }) {
  const [name, setName] = useState(""); const [maxHours, setMaxHours] = useState("30"); const [roleSel, setRoleSel] = useState([]);
  const [availability, setAvailability] = useState(() => makeDefaultAvailabilityForTemplates(templates));
  function toggleRole(role) { setRoleSel((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role])); }
  function EmployeeCard({ e }){
    const [editing, setEditing] = useState(false); const [n, setN] = useState(e.name); const [mh, setMh] = useState(String(e.maxHours ?? 0)); const [rsel, setRsel] = useState([...(e.roles || [])]); const [avail, setAvail] = useState({ ...e.availability });
    function toggle(role){ setRsel((prev)=> prev.includes(role) ? prev.filter(x=>x!==role) : [...prev, role]); }
    function save(){ const trimmed = String(n||"").trim(); if(!trimmed){ alert('Name is required'); return; } if(rsel.length===0){ alert('Select at least one role'); return; } const updated = { ...e, name: trimmed, maxHours: Number(mh)||0, roles: rsel, availability: avail }; setEmployees((prev)=> prev.map(emp=> emp.id===e.id ? updated : emp)); setEditing(false); }
    function cancel(){ setN(e.name); setMh(String(e.maxHours||0)); setRsel([...(e.roles||[])]); setAvail({ ...e.availability }); setEditing(false); }
    function remove(){ if(!confirm('Remove this employee? Any assigned shifts for this person will be unassigned.')) return; setEmployees((prev)=> prev.filter(emp=> emp.id!==e.id)); if(typeof setShifts === 'function'){ setShifts((prev)=> prev.map(s=> s.employeeId===e.id ? { ...s, employeeId:null } : s)); } }
    if(!editing){ return (
      <div className="card" style={{ padding:12, borderRadius:16, background:'var(--surface-2)', border:'1px solid var(--border)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8 }}>
          <div><div style={{ fontWeight:600 }}>{e.name}</div><div className="small" style={{ opacity:.9 }}>Roles: {e.roles.join(', ')}</div><div className="small">Max: {e.maxHours}h • Avail: {DAYS.filter((d)=> e.availability[d]).join(', ')}</div></div>
          <div style={{ display:'flex', gap:8 }}><Button onClick={()=>setEditing(true)}>Edit</Button><Button variant="danger" onClick={remove}>Delete</Button></div>
        </div>
      </div>
    ); }
    return (
      <div className="card" style={{ padding:12, borderRadius:16, background:'var(--surface-2)', border:'1px solid var(--border)' }}>
        <div className="small muted" style={{ marginBottom:8 }}>Editing {e.name}</div>
        <div style={{ display:'grid', gap:12, gridTemplateColumns:'1fr 1fr 1fr' }}>
          <div><label className="muted">Name</label><Input value={n} onChange={(ev)=>setN(ev.target.value)} /></div>
          <div><label className="muted">Max hours / week</label><Input type="number" value={mh} onChange={(ev)=>setMh(ev.target.value)} /></div>
          <div><label className="muted">Can work roles</label><div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:4 }}>{roles.map((r)=> (<button key={r.id} onClick={()=>toggle(r.name)} className={`chip ${rsel.includes(r.name)?'chip--selected':''}`}>{r.name}</button>))}</div></div>
        </div>
        <div style={{ marginTop:12 }}>
          <label className="muted">Availability</label>
          <AvailabilityGrid avail={avail} setAvail={setAvail} templates={templates} />
        </div>
        <div style={{ marginTop:12, display:'flex', gap:8 }}>
          <Button variant="primary" onClick={save}>Save</Button>
          <Button onClick={cancel}>Cancel</Button>
          <Button variant="danger" onClick={remove} style={{ marginLeft:'auto' }}>Delete</Button>
        </div>
      </div>
    );
  }
  return (
    <Section title="Employees">
      <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr 1fr" }}>
        <div><label className="muted">Name</label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Alex" /></div>
        <div><label className="muted">Max hours / week</label><Input type="number" value={maxHours} onChange={(e) => setMaxHours(e.target.value)} /></div>
        <div><label className="muted">Can work roles</label><div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>{roles.map((r) => (<button key={r.id} onClick={() => toggleRole(r.name)} className={`chip ${roleSel.includes(r.name) ? 'chip--selected' : ''}`}>{r.name}</button>))}</div></div>
      </div>
      <div style={{ marginTop: 12 }}>
        <label className="muted">Availability</label>
        <AvailabilityGrid avail={availability} setAvail={setAvailability} templates={templates} />
      </div>
      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <Button variant="primary" onClick={() => { if (!name.trim() || roleSel.length === 0) return; setEmployees((prev) => [...prev, { id: uuidv4(), name: name.trim(), roles: roleSel, maxHours: Number(maxHours) || 0, availability }]); setName(""); setMaxHours("30"); setRoleSel([]); setAvailability({ Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: false, Sun: false }); }}>Add employee</Button>
        <Button variant="secondary" onClick={() => setEmployees([])}>Clear all</Button>
      </div>
      <div className="grid-auto" style={{ marginTop: 16 }}>{employees.map((e) => (<EmployeeCard key={e.id} e={e} />))}</div>
    </Section>
  );
}

function TwoShiftEditor({ templates, setTemplates }){
  const lunch = (templates||[]).find(t=>t.label==='Lunch') || { label:'Lunch', start:'12:00', end:'16:00' };
  const dinner = (templates||[]).find(t=>t.label==='Dinner') || { label:'Dinner', start:'16:00', end:'22:00' };
  const [lStart, setLStart] = useState(lunch.start);
  const [lEnd, setLEnd] = useState(lunch.end);
  const [dStart, setDStart] = useState(dinner.start);
  const [dEnd, setDEnd] = useState(dinner.end);
  function save(){
    setTemplates([{ label:'Lunch', start:lStart, end:lEnd }, { label:'Dinner', start:dStart, end:dEnd }]);
  }
  return (
    <Section title="Shift Templates (fixed: Lunch & Dinner)" actions={<Button variant="primary" onClick={save}>Save times</Button>}>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:8, alignItems:'end' }}>
        <div><label className="muted">Lunch start</label><Input type="time" value={lStart} onChange={(e)=>setLStart(e.target.value)} /></div>
        <div><label className="muted">Lunch end</label><Input type="time" value={lEnd} onChange={(e)=>setLEnd(e.target.value)} /></div>
        <div><label className="muted">Dinner start</label><Input type="time" value={dStart} onChange={(e)=>setDStart(e.target.value)} /></div>
        <div><label className="muted">Dinner end</label><Input type="time" value={dEnd} onChange={(e)=>setDEnd(e.target.value)} /></div>
      </div>
      <div className="small muted" style={{ marginTop:8 }}>Only two shifts are supported. You can adjust their times here.</div>
    </Section>
  );
}

function DemandEditor({ demand, setDemand, demandDaily, setDemandDaily, useDailyDemand }) {
  const [jsonStr, setJsonStr] = useState(JSON.stringify(demand, null, 2));
  const [jsonStrDaily, setJsonStrDaily] = useState(JSON.stringify(demandDaily?.Mon || {}, null, 2));
  const [selectedDay, setSelectedDay] = useState('Mon');
  useEffect(() => { setJsonStr(JSON.stringify(demand, null, 2)); }, [demand]);
  useEffect(() => { setJsonStrDaily(JSON.stringify(demandDaily?.[selectedDay] || {}, null, 2)); }, [demandDaily, selectedDay]);
  function applyGlobal() { try { const parsed = JSON.parse(jsonStr); setDemand(parsed); } catch { alert("Invalid global JSON"); } }
  function applyDaily() { try { const parsed = JSON.parse(jsonStrDaily); setDemandDaily(prev => ({ ...(prev||{}), [selectedDay]: parsed })); } catch { alert("Invalid daily JSON"); } }
  function copyGlobalToAllDays(){ setDemandDaily(() => { const next = {}; for(const d of DAYS) next[d] = deepClone(demand); return next; }); }
  return (
    <Section title="Shift Demand" actions={!useDailyDemand ? <Button onClick={applyGlobal}>Apply</Button> : <div style={{ display:'flex', gap:8 }}><Button onClick={applyDaily}>Apply {selectedDay}</Button><Button onClick={copyGlobalToAllDays}>Copy global → all days</Button></div>}>
      {!useDailyDemand ? (
        <>
          <p className="muted" style={{ fontSize: 14, marginBottom: 8 }}>Global demand by template. Example: {`{ "Breakfast": { "Server": 2 }, "Dinner": { "Cook": 2 } }`}</p>
          <Textarea rows={8} value={jsonStr} onChange={(e) => setJsonStr(e.target.value)} style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" }} />
        </>
      ) : (
        <>
          <div className="day-toggle-grid" style={{ marginBottom:8 }}>{DAYS.map(d => (<button key={d} className={`chip chip--toggle ${selectedDay===d?'chip--selected':''}`} onClick={()=>setSelectedDay(d)}>{d}</button>))}</div>
          <p className="muted" style={{ fontSize: 14, marginBottom: 8 }}>Per-day demand for <strong>{selectedDay}</strong>. Keys must match template labels and role names.</p>
          <Textarea rows={10} value={jsonStrDaily} onChange={(e)=>setJsonStrDaily(e.target.value)} style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace" }} />
        </>
      )}
      <div className="muted small" style={{ marginTop: 8 }}>Tip: labels must match Template names and Role names exactly (case-sensitive).</div>
    </Section>
  );
}

function DemandMatrixEditor({ templates, roles, demandDaily, setDemandDaily, useDailyDemand }){
  const [selDay, setSelDay] = useState('Mon');
  if (!useDailyDemand) return null;
  const roleNames = roles.map(r=>r.name);
  function setCell(dayName, tplLabel, roleName, value){
    const v = Math.max(0, Math.floor(Number(value)||0));
    setDemandDaily(prev => {
      const next = { ...(prev||{}) };
      const dayObj = { ...(next[dayName]||{}) };
      const tplObj = { ...(dayObj[tplLabel]||{}) };
      tplObj[roleName] = v;
      dayObj[tplLabel] = tplObj;
      next[dayName] = dayObj;
      return next;
    });
  }
  function clearDay(){
    setDemandDaily(prev => ({ ...(prev||{}), [selDay]: normalizeDemand({}, templates, roles) }));
  }
  return (
    <Section title="Shift Demand — Per‑day Matrix" actions={<Button onClick={clearDay}>Clear {selDay}</Button>}>
      <div className="day-toggle-grid" style={{ marginBottom:8 }}>
        {DAYS.map(d => (
          <button key={d} className={`chip chip--toggle ${selDay===d?'chip--selected':''}`} onClick={()=> setSelDay(d)}>{d}</button>
        ))}
      </div>
      {(templates.length===0 || roles.length===0) ? (
        <div className="muted small">Add at least one shift template and role to edit per‑day demand.</div>
      ) : (
        <div style={{ overflowX:'auto' }}>
          <table style={{ borderCollapse:'collapse', width:'100%' }}>
            <thead>
              <tr>
                <th style={{ textAlign:'left', border:'1px solid var(--border)', padding:'6px 8px' }}>Template</th>
                {roleNames.map(rn => (
                  <th key={rn} style={{ textAlign:'left', border:'1px solid var(--border)', padding:'6px 8px' }}>{rn}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {templates.map(tpl => (
                <tr key={tpl.label}>
                  <td style={{ border:'1px solid var(--border)', padding:'6px 8px', fontWeight:600 }}>{tpl.label}</td>
                  {roleNames.map(rn => {
                    const val = (((demandDaily||{})[selDay]||{})[tpl.label]||{})[rn] ?? 0;
                    return (
                      <td key={rn} style={{ border:'1px solid var(--border)', padding:'6px 8px' }}>
                        <input
                          className="input"
                          type="number" min={0}
                          value={val}
                          onChange={(e)=> setCell(selDay, tpl.label, rn, e.target.value)}
                          style={{ width:80 }}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="small muted" style={{ marginTop:6 }}>Numbers here update the per‑day JSON instantly.</div>
        </div>
      )}
    </Section>
  );
}

function ScheduleGridByShift({ shifts, employees, onAssign, closedDays, templates, roles }) {
  const labels = useMemo(
    () => (templates && templates.length ? templates.map(t => t.label) : ['Lunch', 'Dinner']),
    [templates]
  );

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {labels.map(label => (
        <div key={label}>
          <div className="day-title" style={{ marginBottom: 8 }}>{label}</div>
          <div className="grid-7">
            {DAYS.map((dayName, dayIdx) => {
              const isClosed = !!(closedDays && closedDays[dayName]);
              // filter + sort by OVERRIDDEN start time
              const list = (shifts || [])
                .filter(s => s.label === label && s.day === dayIdx)
                .sort((a, b) => {
                  const ta = resolveShiftTimesByRole(a, roles).start;
                  const tb = resolveShiftTimesByRole(b, roles).start;
                  return parseTimeToMinutes(ta) - parseTimeToMinutes(tb);
                });

              return (
                <div key={dayName} className="day-col">
                  <div className="day-title">{dayName}</div>
                  {isClosed ? (
                    <div className="closed-banner">Closed</div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {list.length ? (
                        list.map(s => {
                          const t = resolveShiftTimesByRole(s, roles);
                          return (
                            <div key={s.id} className={`shift ${!s.employeeId ? 'shift--unassigned' : ''}`}>
                              <div style={{ fontSize: 14, fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
                                <span>{s.role}</span>
                                <span>{timeTo12h(t.start)}–{timeTo12h(t.end)}</span>
                              </div>
                              <div style={{ marginTop: 6 }}>
                                <Select
                                  value={s.employeeId ?? ''}
                                  onChange={e => onAssign(s.id, e.target.value || null)}
                                  style={{ borderColor: s.employeeId ? undefined : 'var(--danger)' }}
                                >
                                  <option value="">(unassigned)</option>
                                  {employees.map(e => (
                                    <option key={e.id} value={e.id}>{e.name}</option>
                                  ))}
                                </Select>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="small muted">No shifts</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}


function ScheduleGrid({ shifts, employees, onAssign, closedDays, roles }) {
  const byDay = useMemo(() => {
    const m = Array.from({ length: 7 }, () => []);
    for (const s of (shifts || [])) m[s.day].push(s);

    // ✅ sort by overridden start time, not raw s.start
    for (const list of m) {
      list.sort((a, b) => {
        const ta = resolveShiftTimesByRole(a, roles).start;
        const tb = resolveShiftTimesByRole(b, roles).start;
        return parseTimeToMinutes(ta) - parseTimeToMinutes(tb);
      });
    }
    return m;
  }, [shifts, roles]); // ✅ re-run when overrides change

  return (
    <div className="grid-7">
      {byDay.map((list, day) => (
        <div key={day} className="day-col">
          <div className="day-title">{DAYS[day]}</div>
          {closedDays && closedDays[DAYS[day]] ? (
            <div className="closed-banner">Closed</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {list.map((s) => (
                <div key={s.id} className={`shift ${!s.employeeId ? 'shift--unassigned' : ''}`}>
                  <div style={{ fontSize: 14, fontWeight: 600, display: "flex", justifyContent: "space-between" }}>
                    <span>{s.label} • {s.role}</span>
                    {(() => {
                      const t = resolveShiftTimesByRole(s, roles);
                      return <span>{timeTo12h(t.start)}–{timeTo12h(t.end)}</span>;
                    })()}
                  </div>
                  <div style={{ marginTop: 6 }}>
                    <Select
                      value={s.employeeId ?? ""}
                      onChange={(e) => onAssign(s.id, e.target.value || null)}
                      style={{ borderColor: s.employeeId ? undefined : 'var(--danger)' }}
                    >
                      <option value="">(unassigned)</option>
                      {employees.map((e) => (<option key={e.id} value={e.id}>{e.name}</option>))}
                    </Select>
                  </div>
                </div>
              ))}
              {list.length === 0 && (<div className="small muted">No shifts</div>)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ---------------------- Cloud Sync (Firebase) ----------------------
// Accept JSON or Firebase JS snippet (allows comments / unquoted keys)
function parseFirebaseConfig(text){ let s = String(text || '').trim(); if (!s) throw new Error('Empty config'); if (s.charCodeAt(0) === 0xFEFF) s = s.slice(1); s = s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n\r]*/g, ''); const first = s.indexOf('{'); const last = s.lastIndexOf('}'); if (first !== -1 && last !== -1) s = s.slice(first, last + 1); s = s.replace(/'/g, '"'); s = s.replace(/([\{,]\s*)([A-Za-z_$][A-Za-z0-9_$]*)\s*:/g, (_m, p1, p2) => `${p1}"${p2}":`); s = s.replace(/,(\s*[}\]])/g, (_m, p1) => p1); return JSON.parse(s); }

function CloudSyncSection(props){
  const { weekStart, roles, employees, templates, demand, demandDaily, useDailyDemand, shifts, notes, closedDays, setWeekStart, setRoles, setEmployees, setTemplates, setDemand, setDemandDaily, setUseDailyDemand, setShifts, setNotes, setClosedDays } = props;
  const [fbConfigText, setFbConfigText] = useState(localStorage.getItem('fbConfigText') || '');
  const [status, setStatus] = useState('disconnected'); const [user, setUser] = useState(null);
  const [docId, setDocId] = useState(localStorage.getItem('cloudDocId') || (uuidv4().replace(/-/g,'').slice(0,16)));
  const fbRef = useRef({ app:null, auth:null, db:null });
  useEffect(()=>{ localStorage.setItem('cloudDocId', docId); }, [docId]); useEffect(()=>{ localStorage.setItem('fbConfigText', fbConfigText); }, [fbConfigText]);
  async function ensureFirebase(){ try{ const appMod = await import('firebase/app'); const authMod = await import('firebase/auth'); const fsMod = await import('firebase/firestore'); return { appMod, authMod, fsMod }; }catch(err){ alert('Firebase SDK not found. In your project, run:\n\n  npm i firebase\n'); throw err; } }
  async function connect(){ try{ setStatus('connecting'); const cfg = parseFirebaseConfig(fbConfigText); const { appMod, authMod, fsMod } = await ensureFirebase(); const app = appMod.initializeApp(cfg); const auth = authMod.getAuth(app); try { await authMod.setPersistence(auth, authMod.browserLocalPersistence); } catch {} const db = fsMod.getFirestore(app); fbRef.current = { app, auth, db }; authMod.onAuthStateChanged(auth, (u)=>{ setUser(u); setStatus(u? 'connected':'connected-no-auth'); }); }catch(e){ console.error(e); alert('Connect failed. Check Firebase config JSON/snippet.'); setStatus('disconnected'); } }
  async function signIn(){ try{ const { auth } = fbRef.current; if(!auth) return alert('Connect first'); const { GoogleAuthProvider, signInWithRedirect, setPersistence, browserLocalPersistence } = await import('firebase/auth'); await setPersistence(auth, browserLocalPersistence); const provider = new GoogleAuthProvider(); await signInWithRedirect(auth, provider); }catch(e){ console.error(e); alert('Google sign-in failed. Enable Google provider in Firebase Auth.'); } }
  async function signOutUser(){ try{ const { auth } = fbRef.current; if(!auth) return; const { signOut } = await import('firebase/auth'); await signOut(auth); }catch(e){ console.error(e); } }
  function currentPayload(){ return { version: 1, updatedAt: Date.now(), ownerUid: user?.uid || null, weekStartISO: weekStart.toISOString(), roles, employees, templates, demand, demandDaily, useDailyDemand, shifts, notes, closedDays }; }
  async function upload(){ try{ const { db } = fbRef.current; if(!db) return alert('Connect first'); const { doc, setDoc, serverTimestamp } = await import('firebase/firestore'); await setDoc(doc(db, 'schedules', docId), { ...currentPayload(), serverUpdatedAt: serverTimestamp() }, { merge:true }); alert('Uploaded to cloud. Share this Document ID: '+docId); }catch(e){ console.error(e); alert('Upload failed. Check Firestore rules and your sign-in.'); } }
  async function download(){ try{ const { db } = fbRef.current; if(!db) return alert('Connect first'); const { doc, getDoc } = await import('firebase/firestore'); const snap = await getDoc(doc(db, 'schedules', docId)); if(!snap.exists()){ alert('No document found for this ID.'); return; } const data = snap.data(); if (data.weekStartISO) setWeekStart(new Date(data.weekStartISO)); if (data.roles) setRoles(data.roles); if (data.employees) setEmployees(data.employees); if (data.templates) setTemplates(data.templates); if (data.demand) setDemand(data.demand); if (data.demandDaily) setDemandDaily(data.demandDaily); if (typeof data.useDailyDemand === 'boolean') setUseDailyDemand(data.useDailyDemand); if (data.shifts) setShifts(data.shifts); if (typeof data.notes==='string') setNotes(data.notes); if (data.closedDays) setClosedDays(data.closedDays); alert('Downloaded from cloud.'); }catch(e){ console.error(e); alert('Download failed. Check Firestore rules/network.'); } }
  return (
    <Section title="Cloud Sync (multi‑device)" actions={
      <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
        <Button onClick={connect}>{status==='disconnected'?'Connect':status==='connecting'?'Connecting…':'Reconnect'}</Button>
        <Button onClick={signIn} disabled={status==='disconnected' || !!user}>{user? 'Signed in':'Sign in with Google'}</Button>
        <Button onClick={signOutUser} disabled={!user}>Sign out</Button>
        <Button variant="primary" onClick={upload} disabled={!user}>Upload</Button>
        <Button onClick={download} disabled={!fbRef.current.db}>Download</Button>
      </div>
    }>
      <div style={{ display:'grid', gap:12, gridTemplateColumns:'1fr 1fr' }}>
        <div>
          <label className="muted">Firebase Config JSON</label>
          <Textarea rows={6} value={fbConfigText} onChange={(e)=>setFbConfigText(e.target.value)} placeholder='{"apiKey":"...","authDomain":"...","projectId":"...","appId":"..."}' />
          <div className="small muted">Paste your Firebase web app config here. Stored locally.</div>
          {user && (<div className="small" style={{ marginTop:6 }}>Signed in as <strong>{user.displayName || user.email || user.uid}</strong></div>)}
        </div>
        <div>
          <label className="muted">Document ID (share this)</label>
          <Input value={docId} onChange={(e)=>setDocId(e.target.value.replace(/\s/g,''))} />
          <div className="small muted">Use the same ID on another device to sync. Example: <code>{docId}</code></div>
          <div className="spacer-8"></div>
          <div className="small muted">Enable <strong>Authentication → Google</strong> in Firebase Console to use Google sign-in.</div>
        </div>
      </div>
    </Section>
  );
}

// ---------------------- Main App ----------------------
function App() {
  const persisted = useMemo(() => safeLoad(), []);
  const [weekStart, setWeekStart] = useState(() => persisted?.weekStartISO ? new Date(persisted.weekStartISO) : new Date());
  const weekDates = useMemo(() => buildWeekDates(weekStart), [weekStart]);
  const [roles, setRoles] = useState(persisted?.roles ?? defaultRoles);
  const [employees, setEmployees] = useState(persisted?.employees ?? defaultEmployees);
  const [templates, setTemplates] = useState(persisted?.templates ?? defaultShiftTemplates);
  const [demand, setDemand] = useState(persisted?.demand ?? defaultDemand);
  const [demandDaily, setDemandDaily] = useState(persisted?.demandDaily ?? defaultDemandDaily);
  const [useDailyDemand, setUseDailyDemand] = useState(persisted?.useDailyDemand ?? true);
  const [closedDays, setClosedDays] = useState(persisted?.closedDays ?? { Mon:false, Tue:false, Wed:false, Thu:false, Fri:false, Sat:false, Sun:false });
  const [shifts, setShifts] = useState(() => persisted?.shifts ?? makeInitialShifts(weekDates, persisted?.demand ?? defaultDemand, persisted?.templates ?? defaultShiftTemplates, persisted?.closedDays ?? { Mon:false, Tue:false, Wed:false, Thu:false, Fri:false, Sat:false, Sun:false }, persisted?.useDailyDemand ?? false, persisted?.demandDaily ?? defaultDemandDaily));
  const [notes, setNotes] = useState(persisted?.notes ?? "");
  const [viewMode, setViewMode] = useState('byShift');
  const laborCost = useMemo(() => calcLaborCost(shifts, roles), [shifts, roles]);
  const [scheduleTitle, setScheduleTitle] = useState(persisted?.title ?? "Restaurant Weekly Schedule");



  // Enforce exactly two shifts (Lunch & Dinner) on first mount
  useEffect(()=>{
    setTemplates(prev => {
      try{
        const lunch = (prev||[]).find(t=>t.label==='Lunch') || { label:'Lunch', start:'12:00', end:'16:00' };
        const dinner = (prev||[]).find(t=>t.label==='Dinner') || { label:'Dinner', start:'16:00', end:'22:00' };
        return [lunch, dinner];
      }catch{ return [{ label:'Lunch', start:'12:00', end:'16:00' }, { label:'Dinner', start:'16:00', end:'22:00' }]; }
    });
  }, []);

  useEffect(() => {
    setDemand(d => normalizeDemand(d, templates, roles));
    setDemandDaily(dd => normalizeDemandDaily(dd, templates, roles));
  }, [templates, roles]);
  useEffect(() => { const data = { version: 1, weekStartISO: weekStart.toISOString(), title: scheduleTitle, roles, employees, templates, demand, demandDaily, useDailyDemand, shifts, notes, closedDays }; try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {} }, [weekStart, roles, employees, templates, demand, demandDaily, useDailyDemand, shifts, notes, closedDays]);
  function regenerateShifts() { const newShifts = makeInitialShifts(weekDates, demand, templates, closedDays, useDailyDemand, demandDaily); setShifts(newShifts); }
  function handleAssign(shiftId, employeeId) { setShifts((prev) => prev.map((s) => (s.id === shiftId ? { ...s, employeeId } : s))); }
  function handleAutoAssign() { const assigned = autoAssign({ shifts, employees, roles }); setShifts(assigned); }
  function clearAssignments() { setShifts((prev) => prev.map((s) => ({ ...s, employeeId: null }))); }
  function resetAll() { if (!confirm("Reset to defaults? This will overwrite your saved local data.")) return; setWeekStart(new Date()); setRoles(defaultRoles); setEmployees(defaultEmployees); setTemplates(defaultShiftTemplates); setDemand(defaultDemand); setDemandDaily(defaultDemandDaily); setUseDailyDemand(false); setClosedDays({ Mon:false, Tue:false, Wed:false, Thu:false, Fri:false, Sat:false, Sun:false }); setShifts(makeInitialShifts(buildWeekDates(new Date()), defaultDemand, defaultShiftTemplates, { Mon:false, Tue:false, Wed:false, Thu:false, Fri:false, Sat:false, Sun:false }, false, defaultDemandDaily)); setNotes(""); try { localStorage.removeItem(STORAGE_KEY); } catch {} }
  function toggleClosed(dayName){ setClosedDays((prev)=>{ const next = { ...prev, [dayName]: !prev[dayName] }; if (next[dayName]) { if (confirm(`Mark ${dayName} closed and clear all its shifts for this week?`)) { setShifts((s)=> s.filter(x=> DAYS[x.day] !== dayName)); } } return next; }); }
  return (
    <div className="container">
      <GlobalStyles />
      <header className="header"><h1 className="headline">Restaurant Scheduler</h1><p className="muted">Plan weekly shifts, auto-assign, export/share/print. <span className="small">(Auto-saves locally)</span></p></header>
		<div style={{ padding: 16 }}>
		  <ImportExportButtons />
		  <SettingsPanel />
		</div>

      <CloudSyncSection weekStart={weekStart} roles={roles} employees={employees} templates={templates} demand={demand} demandDaily={demandDaily} useDailyDemand={useDailyDemand} shifts={shifts} notes={notes} closedDays={closedDays} setWeekStart={setWeekStart} setRoles={setRoles} setEmployees={setEmployees} setTemplates={setTemplates} setDemand={setDemand} setDemandDaily={setDemandDaily} setUseDailyDemand={setUseDailyDemand} setShifts={setShifts} setNotes={setNotes} setClosedDays={setClosedDays} />

      <Section title="Week" actions={
        <div style={{ display: "flex", gap: 8, flexWrap:'wrap' }}>
          <Button onClick={() => setWeekStart(addDays(weekStart, -7))}>Prev week</Button>
          <Button onClick={() => setWeekStart(addDays(weekStart, 7))}>Next week</Button>
          <Button onClick={() => exportStateJSON({ version:1, weekStartISO: weekStart.toISOString(), roles, employees, templates, demand, demandDaily, useDailyDemand, shifts, notes, closedDays })}>Export JSON</Button>
          <Button onClick={() => document.getElementById('file-import-proxy')?.click()}>Import JSON</Button>
          <Button variant="danger" onClick={resetAll}>Reset</Button>
        </div>
      }>
        <input id="file-import-proxy" type="file" accept="application/json" onChange={(ev)=>{ const file = ev.target.files?.[0]; if(!file) return; const reader = new FileReader(); reader.onload = ()=>{ try { const data = JSON.parse(String(reader.result)); if (data.weekStartISO) setWeekStart(new Date(data.weekStartISO)); if (data.roles) setRoles(data.roles); if (data.employees) setEmployees(data.employees); if (data.templates) setTemplates(data.templates); if (data.demand) setDemand(data.demand); if (data.demandDaily) setDemandDaily(data.demandDaily); if (typeof data.useDailyDemand === 'boolean') setUseDailyDemand(data.useDailyDemand); if (data.shifts) setShifts(data.shifts); if (typeof data.notes === 'string') setNotes(data.notes); if (typeof data.title === 'string') setScheduleTitle(data.title); if (data.closedDays) setClosedDays(data.closedDays); alert('Import complete.'); } catch { alert('Invalid JSON file.'); } ev.target.value = ""; }; reader.readAsText(file); }} style={{ display:'none' }} />

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>{weekDates.map((d, i) => (<div key={i} style={{ padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 12, background:'var(--surface-2)' }}><div style={{ fontSize: 14, fontWeight: 600 }}>{DAYS[i]}</div><div style={{ fontSize: 14 }}>{format(d, "MMM d, yyyy")}</div></div>))}</div>

        <div style={{ marginTop:12 }}>
          <label className="muted">Closed days this week</label>
          <div className="day-toggle-grid" style={{ marginTop:8 }}>
            {DAYS.map((d)=> (<button key={d} type="button" className={`chip chip--toggle ${closedDays[d] ? 'chip--danger-selected' : ''}`} aria-pressed={!!closedDays[d]} onClick={()=> toggleClosed(d)}>{d}</button>))}
          </div>
          <div className="small muted" style={{ marginTop:6 }}>Closed days are skipped when generating shifts and shown as "Closed" in the grid/print view.</div>
        </div>
      </Section>

      <RoleEditor
		  roles={roles} setRoles={setRoles}
		  employees={employees} setEmployees={setEmployees}
		  demand={demand} setDemand={setDemand}
		  demandDaily={demandDaily} setDemandDaily={setDemandDaily}
		  useDailyDemand={useDailyDemand} setUseDailyDemand={setUseDailyDemand}
		  setShifts={setShifts}
		  templates={templates}
		/>
		<EmployeeEditor employees={employees} setEmployees={setEmployees} roles={roles} templates={templates} setShifts={setShifts} />
      <TwoShiftEditor templates={templates} setTemplates={setTemplates} />
      {!useDailyDemand ? (
        <DemandEditor demand={demand} setDemand={setDemand} demandDaily={demandDaily} setDemandDaily={setDemandDaily} useDailyDemand={useDailyDemand} />
      ) : (
        <DemandMatrixEditor templates={templates} roles={roles} demandDaily={demandDaily} setDemandDaily={setDemandDaily} useDailyDemand={useDailyDemand} />
      )}

		<Section
		  title="Schedule"
		  actions={
			<div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
			  <Button variant={viewMode==='byDay'?'primary':'secondary'} onClick={()=> setViewMode('byDay')}>By Day</Button>
			  <Button variant={viewMode==='byShift'?'primary':'secondary'} onClick={()=> setViewMode('byShift')}>By Shift</Button>
			  <Button onClick={regenerateShifts}>Regenerate from demand</Button>
			  <Button onClick={clearAssignments}>Clear</Button>
			  <Button variant="primary" onClick={handleAutoAssign}>Auto-Assign</Button>
			  <Button onClick={() => exportScheduleCSV(shifts, employees)}>Export CSV</Button>

			  {/* ✅ fixed Button, pass roles + scheduleTitle */}
			  <Button
				onClick={() =>
				  openPrintableView({
					title: scheduleTitle,
					weekDates,
					shifts,
					roles,
					employees,
					notes,
					closedDays
				  })
				}
			  >
				Printable PDF
			  </Button>

			  {/* ✅ include roles here too so overrides match */}
			  <Button
				onClick={() =>
				  openReadonlyShare({
					title: scheduleTitle,
					weekDates,
					shifts,
					roles,
					employees,
					notes,
					closedDays
				  })
				}
			  >
				Copy Read-only Link
			  </Button>
			</div>
		  }
		>
		  {viewMode === 'byShift' ? (
			<ScheduleGridByShift
			  shifts={shifts}
			  employees={employees}
			  onAssign={handleAssign}
			  closedDays={closedDays}
			  templates={templates}
			  roles={roles}
			/>
		  ) : (
			<ScheduleGrid
			  shifts={shifts}
			  employees={employees}
			  onAssign={handleAssign}
			  closedDays={closedDays}
			  roles={roles}
			/>
		  )}
		</Section>


      <Section title="Manager Notes"><Textarea rows={4} placeholder="Special events, staff requests, blackout dates..." value={notes} onChange={(e) => setNotes(e.target.value)} /></Section>
      
    </div>
  );
}

// ---------------------- DEV TESTS (console) ----------------------
(function runDevTests() {
  try {
    console.assert(parseTimeToMinutes("08:30") === 510, "parseTimeToMinutes failed");
    console.assert(minutesToTime(510) === "08:30", "minutesToTime failed");
    console.assert(diffHours("08:00", "10:30") === 2.5, "diffHours failed");
    console.assert(overlap("08:00", "10:00", "09:00", "11:00") === true, "overlap true case failed");
    console.assert(overlap("08:00", "10:00", "10:00", "12:00") === false, "overlap boundary case failed");
    const w = buildWeekDates(new Date());
    const templates = [{ label: "Test", start: "09:00", end: "13:00" }];
    const demand = { Test: { Server: 1 } };
    const demandDaily = { Mon:{ Test:{ Server:0 } }, Tue:{ Test:{ Server:2 } }, Wed:{}, Thu:{}, Fri:{}, Sat:{}, Sun:{} };
    const closed = { Mon:false, Tue:false, Wed:false, Thu:false, Fri:false, Sat:false, Sun:false };
    const shiftsGlobal = makeInitialShifts(w, demand, templates, closed, false, null);
    console.assert(shiftsGlobal.filter(s=> s.day===0).length === 1, "global demand generation failed");
    const shiftsDaily = makeInitialShifts(w, demand, templates, closed, true, demandDaily);
    console.assert(shiftsDaily.filter(s=> s.day===0).length === 0, "daily demand override (Mon) failed");
    console.assert(shiftsDaily.filter(s=> s.day===1).length === 2, "daily demand override (Tue) failed");
    const roles = [{ name: "Server", hourly: 10 }];
    const employees = [ { id: "e1", name: "Emp1", roles: ["Server"], maxHours: 4, availability: { Mon: true, Tue: true, Wed: true, Thu: true, Fri: true, Sat: true, Sun: true } } ];
    const assigned = autoAssign({ shifts: shiftsDaily.filter(s=> s.day===1), employees, roles });
    console.assert(assigned.length === 2, "autoAssign with daily demand list failed");
    // shift-availability tests
    const twoTpl = [{ label:'Lunch', start:'12:00', end:'16:00' }, { label:'Dinner', start:'16:00', end:'20:00' }];
    const dem2 = { Lunch:{ Server:1 }, Dinner:{ Server:1 } };
    const closed2 = { Mon:false, Tue:false, Wed:false, Thu:false, Fri:false, Sat:false, Sun:false };
    const w2 = buildWeekDates(new Date());
    const s2 = makeInitialShifts(w2, dem2, twoTpl, closed2, false, null);
    const emp2 = [{ id:'e2', name:'Emp2', roles:['Server'], maxHours: 8, availability:{ Mon:{ Lunch:false, Dinner:true }, Tue:{ Lunch:true, Dinner:true }, Wed:{ Lunch:true, Dinner:true }, Thu:{ Lunch:true, Dinner:true }, Fri:{ Lunch:true, Dinner:true }, Sat:{ Lunch:false, Dinner:false }, Sun:{ Lunch:false, Dinner:false } } }];
    const a2 = autoAssign({ shifts:s2.filter(s=> s.day===0), employees: emp2, roles:[{ name:'Server' }] });
    const monLunch = a2.find(x=> x.day===0 && x.label==='Lunch');
    const monDinner = a2.find(x=> x.day===0 && x.label==='Dinner');
    console.assert(monLunch.employeeId === null, 'Lunch should be unassigned due to availability');
    console.assert(!!monDinner.employeeId, 'Dinner should be assigned');
    const cost = calcLaborCost([{ start: "09:00", end: "13:00", role: "Server" }], roles);
    console.assert(cost === 40, "calcLaborCost failed");
    // normalization tests
    const nd = normalizeDemand({ Breakfast:{ Server:2 } }, [{ label:'Breakfast' }], [{ name:'Server' }, { name:'Bar' }]);
    console.assert(nd.Breakfast.Server === 2 && nd.Breakfast.Bar === 0, 'normalizeDemand role fill failed');
    const ndd = normalizeDemandDaily({ Mon:{ Breakfast:{ Server:2 } } }, [{ label:'Breakfast' }], [{ name:'Server' }, { name:'Bar' }]);
    console.assert(ndd.Mon.Breakfast.Bar === 0, 'normalizeDemandDaily role fill failed');
    // role priority test
    const prRoles = [{ name:'High', priority:10 }, { name:'Low', priority:0 }];
    const prEmp = [{ id:'eP', name:'P', roles:['High','Low'], maxHours:4, availability:{ Mon:{ Lunch:true, Dinner:true }, Tue:{ Lunch:true, Dinner:true }, Wed:{ Lunch:true, Dinner:true }, Thu:{ Lunch:true, Dinner:true }, Fri:{ Lunch:true, Dinner:true }, Sat:{ Lunch:false, Dinner:false }, Sun:{ Lunch:false, Dinner:false } } }];
    const prShifts = [
      { id:'sLow', day:0, label:'Lunch', start:'12:00', end:'16:00', role:'Low', employeeId:null },
      { id:'sHigh', day:0, label:'Lunch', start:'12:00', end:'16:00', role:'High', employeeId:null },
    ];
    const prAssigned = autoAssign({ shifts: prShifts, employees: prEmp, roles: prRoles });
    const hi = prAssigned.find(x=> x.role==='High');
    const lo = prAssigned.find(x=> x.role==='Low');
    console.assert(!!hi.employeeId && !lo.employeeId, 'role priority should assign High before Low');
    console.log("✅ Dev tests passed");
  } catch (err) { console.error("❌ Dev tests encountered an error", err); }
})();


export default App;
