import { meetingElapsed, slotId } from "./meeting.ts";
import type { Report, Run } from "./types.ts";
import { csv } from "./backup.ts";
export function meetingReport(run: Run, now: number): Report {
  const original = run.originalAgenda ?? run.config.agenda,
    currentId = run.status === "done" ? undefined : slotId(run),
    at = meetingElapsed(run, now);
  const ids = [
    ...new Set([
      ...original.map((a) => a.id),
      ...run.config.agenda.map((a) => a.id),
      ...run.entries.map((a) => a.id).filter((id): id is string => !!id),
    ]),
  ];
  return {
    id: run.id,
    kind: "meeting",
    title: run.config.title,
    finishedAt: run.finishedAt ?? now,
    elapsed: at,
    laps: [],
    notes: run.notes,
    originalAgenda: original,
    planChanges: run.planChanges ?? [],
    parking: run.parking ?? [],
    entries: ids.map((id) => {
      const before = original.find((a) => a.id === id),
        current = run.config.agenda.find((a) => a.id === id),
        logs = run.entries.filter((e) => e.id === id);
      return {
        id,
        name: before?.name ?? current?.name ?? logs[0]?.name ?? "Removed slot",
        planned: (before?.seconds ?? 0) * 1000,
        actual:
          logs.reduce((n, e) => n + e.actual, 0) +
          (currentId === id ? Math.max(0, at - run.phaseStart) : 0),
        state:
          currentId === id
            ? "current"
            : logs.length
              ? "completed"
              : current
                ? "pending"
                : "skipped",
      };
    }),
  };
}
export function meetingCSV(r: Report) {
  return csv([
    ["Meeting", r.title],
    ["Elapsed seconds", r.elapsed / 1000],
    [],
    [
      "Slot",
      "Original plan (sec)",
      "Actual (sec)",
      "Difference (sec)",
      "State",
    ],
    ...r.entries.map((e) => [
      e.name,
      e.planned / 1000,
      e.actual / 1000,
      e.state === "pending" ? "" : (e.actual - e.planned) / 1000,
      e.state ?? "completed",
    ]),
    [],
    ["Plan edits", "Revised agenda"],
    ...(r.planChanges ?? []).map((change) => [
      change.at / 1000,
      change.agenda.map((a) => `${a.name} ${a.seconds / 60} min`).join(" / "),
    ]),
    [],
    ["For later", "Owner", "Done"],
    ...(r.parking ?? []).map((a) => [a.text, a.owner, a.done ? "Yes" : "No"]),
    [],
    ["Private notes", r.notes],
  ]);
}
export function reportText(r: Report) {
  return `${r.title}\nOriginal plan ${r.entries.reduce((n, a) => n + a.planned, 0) / 60000} min · actual ${(r.elapsed / 60000).toFixed(2)} min\n${r.entries.map((a) => `${a.name}: ${a.planned / 1000}s planned / ${a.state === "pending" ? "pending" : a.actual / 1000 + "s actual"}`).join("\n")}\n\n${(r.parking ?? []).map((a) => `${a.done ? "Done" : "Open"}: ${a.text}${a.owner ? " · " + a.owner : ""}`).join("\n")}`;
}
export function reportHTML(r: Report) {
  const escape = (s: string) =>
    s.replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c]!,
    );
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font:15px sans-serif;padding:32px;color:#20211e}h1{font-size:28px}table{border-collapse:collapse;width:100%}td,th{padding:12px 6px;text-align:left;border-bottom:1px solid #bbbcb4}pre{white-space:pre-wrap;font:inherit}</style></head><body><h1>${escape(r.title)}</h1><p>Original plan: ${r.entries.reduce((n, e) => n + e.planned, 0) / 60000} min. Actual: ${(r.elapsed / 60000).toFixed(2)} min.</p><table><tr><th>Slot</th><th>Planned sec</th><th>Actual sec</th><th>State</th></tr>${r.entries.map((e) => `<tr><td>${escape(e.name)}</td><td>${e.planned / 1000}</td><td>${Math.round(e.actual / 1000)}</td><td>${escape(e.state ?? "completed")}</td></tr>`).join("")}</table><h2>For later</h2><pre>${escape((r.parking ?? []).map((a) => `${a.done ? "Done" : "Open"}: ${a.text} · ${a.owner}`).join("\n"))}</pre><h2>Private notes</h2><pre>${escape(r.notes)}</pre></body></html>`;
}
