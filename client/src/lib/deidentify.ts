/**
 * Client-side HL7 v2 de-identification engine.
 *
 * Pure functions, no React, no network. All PHI stays in the browser.
 *
 * Strategy (agreed): deterministic salted pseudonyms — the same real value
 * plus the same secret passphrase always yields the same fictional value,
 * so patient journeys stay linkable across messages and batches. Dates are
 * shifted by a per-patient private offset so intervals and event order are
 * preserved exactly.
 */
import { PHI_RULE_MAP, UNSTRUCTURED_RISK_SEGMENTS, type PhiRule } from "./phi-profile";

export interface Separators {
  field: string;
  component: string;
  repeat: string;
  escape: string;
  sub: string;
}

export const DEFAULT_SEPARATORS: Separators = {
  field: "|",
  component: "^",
  repeat: "~",
  escape: "\\",
  sub: "&",
};

export interface DeidentifyOptions {
  /** Per-project secret. The security boundary — never exported. */
  secret: string;
  /** Field positions to SKIP (leave untouched). Everything else in the profile applies. */
  disabledFields?: Set<string>;
  /** Shift dates by the per-patient offset. If false, dates are blanked instead. */
  shiftDates?: boolean;
}

export interface PatientSummary {
  /** Pseudonymous patient ID shown in the report. */
  pseudoId: string;
  messages: number;
  /** Pseudonymous visit numbers seen for this patient. */
  visits: string[];
  fieldsReplaced: number;
  datesShifted: number;
}

export interface DeidentifyResult {
  outputs: { index: number; messageType: string; text: string }[];
  combined: string;
  patients: PatientSummary[];
  stats: {
    messages: number;
    patients: number;
    fieldsReplaced: number;
    datesShifted: number;
    idsRegenerated: number;
  };
  residualRisks: string[];
  /** Original PHI values still found in the output — blocks download. */
  gateFailures: string[];
  /** Original PHI too short to verify (reported, not blocking). */
  unverifiable: string[];
  /** True when WebCrypto was unavailable and the weaker fallback hash was used. */
  usedFallbackHash: boolean;
}

// ---------------------------------------------------------------------------
// Hashing (salted, deterministic)
// ---------------------------------------------------------------------------

let fallbackHashUsed = false;

function fnv1a(text: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 16777619);
    h2 = Math.imul(h2 ^ (c + 31), 16777619);
  }
  const hex = (n: number) => (n >>> 0).toString(16).padStart(8, "0");
  return hex(h1) + hex(h2) + hex(h1 ^ h2) + hex(h2 ^ 0x9e3779b9);
}

async function sha256Hex(text: string): Promise<string> {
  try {
    const subtle = globalThis.crypto?.subtle;
    if (!subtle) throw new Error("no subtle crypto");
    const digest = await subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    fallbackHashUsed = true;
    return fnv1a("DEIDv1:" + text);
  }
}

/** Deterministic integer in [0, mod) from a hex hash. */
function hashInt(hex: string, mod: number): number {
  return parseInt(hex.slice(0, 8), 16) % mod;
}

function digitsFromHash(hex: string, length: number): string {
  let out = "";
  let h = hex;
  while (out.length < length) {
    for (let i = 0; i < h.length; i++) {
      if (out.length >= length) break;
      out += (parseInt(h[i], 16) % 10).toString();
    }
    // Extend deterministically if more digits are needed.
    h = fnv1a(h);
  }
  return out;
}

// ---------------------------------------------------------------------------
// HL7 parsing helpers (MSH-aware)
// ---------------------------------------------------------------------------

export function detectSeparators(firstLine: string): Separators {
  if (!firstLine.startsWith("MSH") || firstLine.length < 8) return DEFAULT_SEPARATORS;
  const field = firstLine[3];
  const enc = firstLine.slice(4, 8);
  return {
    field,
    component: enc[0] || "^",
    repeat: enc[1] || "~",
    escape: enc[2] || "\\",
    sub: enc[3] || "&",
  };
}

/** Split a batch into individual messages on MSH boundaries. */
export function splitBatch(input: string): string[] {
  const normalized = input.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const lines = normalized.split("\n").filter((l) => l.trim().length > 0);
  const messages: string[][] = [];
  let current: string[] = [];
  for (const line of lines) {
    if (line.startsWith("MSH") && current.length > 0) {
      messages.push(current);
      current = [];
    }
    current.push(line);
  }
  if (current.length > 0) messages.push(current);
  return messages.map((m) => m.join("\r"));
}

export function splitSegments(message: string): string[][] {
  return message
    .split("\r")
    .filter((s) => s.length > 0)
    .map((s) => {
      const seps = detectSeparators(message.split("\r")[0]);
      return splitFields(s, seps.field);
    });
}

/** Split on the field separator, honouring the HL7 escape character. */
function splitFields(line: string, sep: string): string[] {
  const out: string[] = [];
  let cur = "";
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === "\\" && i + 1 < line.length) {
      cur += ch + line[i + 1];
      i++;
    } else if (ch === sep) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

/**
 * Field numbering: for normal segments field n lives at index n
 * (index 0 is the segment name). MSH is shifted by one because MSH-1
 * is the separator character itself: MSH-n lives at index n-1.
 */
export function getField(fields: string[], segId: string, n: number): string {
  const idx = segId === "MSH" ? n - 1 : n;
  return fields[idx] ?? "";
}

export function setField(fields: string[], segId: string, n: number, value: string): void {
  const idx = segId === "MSH" ? n - 1 : n;
  while (fields.length <= idx) fields.push("");
  fields[idx] = value;
}

// ---------------------------------------------------------------------------
// Fictional value generators (deterministic per secret + original)
// ---------------------------------------------------------------------------

const FAMILY_NAMES = [
  "Research", "Anonym", "Sample", "Placeholder", "Study", "Cohort",
  "Blinded", "Masked", "Redacted", "Shield", "Harbor", "Beacon",
  "Quarry", "Meadow", "Grove", "Harbor", "Summit", "Valley",
  "Comet", "Delta", "Ember", "Flint", "Garnet", "Hazel",
];

const GIVEN_NAMES = [
  "Alex", "Robin", "Casey", "Jordan", "Taylor", "Morgan",
  "Riley", "Avery", "Quinn", "Hayden", "Emerson", "Finley",
  "Rowan", "Sage", "Ellis", "Marlowe", "Indigo", "Onyx",
  "Parker", "Reese", "Shiloh", "Tatum", "Wren", "Yael",
];

const FAKE_CITIES = [
  "Port Anonym", "Lake Blinded", "Mount Redacted", "Cohort Bay",
  "Study Falls", "Harbor View", "Beacon Hill", "Meadow Park",
  "Grove Street", "Summit Ridge", "Valley Forge", "Comet Town",
];

function pseudoFor(rule: PhiRule, secret: string, original: string, hex: string): string {
  switch (rule) {
    case "replace-id":
      return `DID${digitsFromHash(hex, 6)}`;
    case "replace-name": {
      const fam = FAMILY_NAMES[hashInt(hex, FAMILY_NAMES.length)];
      const giv = GIVEN_NAMES[hashInt(fnv1a(hex + "g"), GIVEN_NAMES.length)];
      return `${fam}^${giv}`;
    }
    case "replace-address": {
      const city = FAKE_CITIES[hashInt(hex, FAKE_CITIES.length)];
      return `${1 + hashInt(fnv1a(hex + "n"), 999)} Research Way^^${city}^^00000`;
    }
    case "replace-phone": {
      // Format-preserving: swap digit runs for fictional 555-range digits.
      let counter = 0;
      return original.replace(/\d{3,}/g, (run) => {
        counter++;
        const d = digitsFromHash(fnv1a(hex + counter), run.length);
        return run.length >= 7 ? `555${d.slice(3)}` : d;
      });
    }
    case "replace-generic":
      return `SITE${hex.slice(0, 4).toUpperCase()}`;
    default:
      return original;
  }
}

// ---------------------------------------------------------------------------
// Dates: per-patient offset shifting
// ---------------------------------------------------------------------------

const DATE_RE = /^(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?(\.\d+)?([+-]\d{4})?$/;

export function shiftDate(value: string, offsetDays: number): string | null {
  const m = DATE_RE.exec(value.trim());
  if (!m) return null;
  const [, y, mo, d, h = "00", mi = "00", s = "00"] = m;
  const ms = Date.UTC(+y, +mo - 1, +d, +h, +mi, +s) - offsetDays * 86400000;
  if (Number.isNaN(ms)) return null;
  const dt = new Date(ms);
  const p = (n: number, l = 2) => n.toString().padStart(l, "0");
  const full =
    `${dt.getUTCFullYear()}${p(dt.getUTCMonth() + 1)}${p(dt.getUTCDate())}` +
    `${p(dt.getUTCHours())}${p(dt.getUTCMinutes())}${p(dt.getUTCSeconds())}`;
  // Preserve the original precision (date-only stays date-only).
  const precision = m[4] !== undefined ? 14 : 8;
  return full.slice(0, precision);
}

// ---------------------------------------------------------------------------
// Patient key (links a journey across messages)
// ---------------------------------------------------------------------------

const PREFERRED_ID_TYPES = new Set(["MR", "MRN", "PI", "PT", "MC", "SS"]);

function patientKey(pidFields: string[], seps: Separators): string {
  const raw = getField(pidFields, "PID", 3);
  if (!raw) return "";
  const repeats = raw.split(seps.repeat).filter((r) => r.length > 0);
  if (repeats.length === 0) return "";
  const parsed = repeats.map((r) => r.split(seps.component));
  const preferred = parsed.find((c) => PREFERRED_ID_TYPES.has((c[4] || "").toUpperCase()));
  const chosen = preferred ?? parsed[0];
  return `${chosen[0] || ""}^^${chosen[3] || ""}`;
}

// ---------------------------------------------------------------------------
// Main pipeline
// ---------------------------------------------------------------------------

export async function deidentifyBatch(
  input: string,
  secret: string,
  options: Omit<DeidentifyOptions, "secret"> = {}
): Promise<DeidentifyResult> {
  fallbackHashUsed = false;
  const { disabledFields = new Set(), shiftDates = true } = options;
  const rawMessages = splitBatch(input);

  const stats = { messages: 0, patients: 0, fieldsReplaced: 0, datesShifted: 0, idsRegenerated: 0 };
  const outputs: DeidentifyResult["outputs"] = [];
  const residualRisks: string[] = [];
  const gateWatch = new Map<string, string>(); // original value -> where it was seen
  const unverifiable = new Set<string>();
  const lanes = new Map<
    string,
    { pseudoId: string; offsetDays: number; messages: number; visits: Set<string>; replaced: number; shifted: number }
  >();

  const trackOriginal = (value: string, where: string) => {
    const v = value.trim();
    if (!v) return;
    if (v.length >= 4) {
      if (!gateWatch.has(v)) gateWatch.set(v, where);
    } else {
      unverifiable.add(`${v} (${where})`);
    }
  };

  for (let mi = 0; mi < rawMessages.length; mi++) {
    const raw = rawMessages[mi];
    const seps = detectSeparators(raw.split("\r")[0]);
    const segments = splitSegments(raw);

    const pidSeg = segments.find((f) => f[0] === "PID");
    const key = pidSeg ? patientKey(pidSeg, seps) : "";
    const laneKey = key || `__NOPID_${mi}`;

    let lane = lanes.get(laneKey);
    if (!lane) {
      const keyHex = await sha256Hex(`lane|${secret}|${laneKey}`);
      lane = {
        pseudoId: `DID${digitsFromHash(keyHex, 6)}`,
        offsetDays: 1 + hashInt(fnv1a(keyHex + "offset"), 364),
        messages: 0,
        visits: new Set(),
        replaced: 0,
        shifted: 0,
      };
      lanes.set(laneKey, lane);
    }
    lane.messages++;
    stats.messages++;

    const mshSeg = segments.find((f) => f[0] === "MSH");
    const messageType = mshSeg ? getField(mshSeg, "MSH", 9).split(seps.component).slice(0, 2).join("^") : "UNK";

    const outSegs: string[] = [];

    for (const fields of segments) {
      const segId = fields[0];

      // Residual-risk scan: unstructured segments pass through but are flagged.
      if (segId === "NTE" || segId === "OBX" || segId === "PV2") {
        const content = fields.slice(1).join(seps.field);
        if (content.trim()) {
          const flag = `Message ${mi + 1} (${messageType}): ${segId} carries free text — verify no names/dates leak.`;
          if (!residualRisks.includes(flag)) residualRisks.push(flag);
        }
      }

      // Discover the highest addressed field for this segment so repeats parse.
      const ruleNums = Object.keys(PHI_RULE_MAP)
        .filter((k) => k.startsWith(segId + "-") && !disabledFields.has(k))
        .map((k) => parseInt(k.split("-")[1], 10));

      for (const n of ruleNums) {
        const rule = PHI_RULE_MAP[`${segId}-${n}`];
        const current = getField(fields, segId, n);
        if (!current) continue;

        if (rule.rule === "keep") continue;

        if (rule.rule === "regenerate") {
          // Fresh per message by design — control IDs must not link runs.
          trackOriginal(current, `${segId}-${n}`);
          const fresh = `DEID${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 1296).toString(36).toUpperCase().padStart(2, "0")}`;
          setField(fields, segId, n, fresh);
          stats.idsRegenerated++;
          continue;
        }

        if (rule.rule === "shift-date") {
          if (shiftDates) {
            const shifted = shiftDate(current, lane.offsetDays);
            if (shifted && shifted !== current) {
              trackOriginal(current, `${segId}-${n}`);
              setField(fields, segId, n, shifted);
              lane.shifted++;
              stats.datesShifted++;
            }
          } else {
            trackOriginal(current, `${segId}-${n}`);
            setField(fields, segId, n, "");
            lane.replaced++;
            stats.fieldsReplaced++;
          }
          continue;
        }

        // Replacement rules: handle repeats + components while preserving
        // the structural (type) components that keep the message parseable.
        const repeats = current.split(seps.repeat);
        const newRepeats = await Promise.all(
          repeats.map(async (rep) => {
            if (!rep) return rep;
            if (rule.rule === "replace-phone") {
              const hex = await sha256Hex(`phi|${secret}|${rule.rule}|${rep}`);
              trackOriginal(rep, `${segId}-${n}`);
              lane.replaced++;
              stats.fieldsReplaced++;
              return pseudoFor(rule.rule, secret, rep, hex);
            }
            const comps = rep.split(seps.component);
            const hex = await sha256Hex(`phi|${secret}|${rule.rule}|${rep}`);
            trackOriginal(rep, `${segId}-${n}`);
            lane.replaced++;
            stats.fieldsReplaced++;

            if (segId === "PID" && n === 3) {
              // CX: ID^check^scheme^authority^type — new ID, stable pseudo
              // authority, original type code preserved (MR stays MR).
              const pseudo = `DID${digitsFromHash(hex, 6)}`;
              const authHex = await sha256Hex(`phi|${secret}|authority|${comps[3] || ""}`);
              const out = [...comps];
              out[0] = pseudo;
              out[1] = "";
              out[2] = "";
              out[3] = comps[3] ? `FAC${authHex.slice(0, 3).toUpperCase()}` : "";
              return out.join(seps.component);
            }
            if (rule.rule === "replace-name") {
              // XPN: family^given^...^suffix^prefix^degree^type — keep type.
              const [fam, giv] = pseudoFor(rule.rule, secret, rep, hex).split("^");
              const out = [...comps];
              out[0] = fam;
              out[1] = giv;
              if (out.length > 2) out[2] = "";
              return out.join(seps.component);
            }
            if (rule.rule === "replace-address") {
              // XAD: street^other^city^state^zip^country^type — keep state,
              // country and type; fictionalise the rest.
              const fake = pseudoFor(rule.rule, secret, rep, hex).split("^");
              const out = [...comps];
              out[0] = fake[0] || "";
              out[1] = "";
              out[2] = fake[2] || "";
              if (out.length > 4) out[4] = "00000";
              return out.join(seps.component);
            }
            return pseudoFor(rule.rule, secret, rep, hex);
          })
        );
        setField(fields, segId, n, newRepeats.join(seps.repeat));

        // Visit linkage summary (pseudonymous by construction).
        if (segId === "PV1" && n === 19) {
          const v = getField(fields, segId, n).split(seps.component)[0];
          if (v) lane.visits.add(v);
        }
      }

      outSegs.push(fields.join(seps.field));
    }

    outputs.push({ index: mi, messageType, text: outSegs.join("\r") });
  }

  const combined = outputs.map((o) => o.text).join("\r");

  // Rescan gate: no tracked original PHI may survive in the output.
  const gateFailures: string[] = [];
  gateWatch.forEach((where, value) => {
    if (combined.includes(value)) gateFailures.push(`${value} (from ${where})`);
  });

  const patients: PatientSummary[] = Array.from(lanes.values()).map((l) => ({
    pseudoId: l.pseudoId,
    messages: l.messages,
    visits: Array.from(l.visits),
    fieldsReplaced: l.replaced,
    datesShifted: l.shifted,
  }));
  stats.patients = patients.length;

  return {
    outputs,
    combined,
    patients,
    stats,
    residualRisks,
    gateFailures,
    unverifiable: Array.from(unverifiable).slice(0, 50),
    usedFallbackHash: fallbackHashUsed,
  };
}
