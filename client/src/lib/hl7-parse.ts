// Lightweight client-side HL7v2 parser shared by the V2→FHIR Converter and
// the Data-Quality Auditor. No dependencies, no network calls, no PHI storage.
// Synthetic test messages only — never paste real patient data.

export interface ParsedSegment {
  /** Segment name, e.g. "PID". */
  name: string;
  /** Raw segment text (pipe-delimited, without segment terminator). */
  raw: string;
  /** Split fields. Index 0 is the segment name for non-MSH segments. */
  parts: string[];
}

export interface ParsedMessage {
  raw: string;
  segments: ParsedSegment[];
}

/** Split pasted text into individual messages (by MSH) or bare segments. */
export function splitMessages(input: string): string[] {
  const normalized = input.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!normalized) return [];
  // Messages are separated by a line starting with MSH (or blank-line groups).
  const chunks = normalized
    .split(/\n(?=MSH\|)/)
    .map((c) => c.trim())
    .filter(Boolean);
  if (chunks.length <= 1 && !/^MSH\|/m.test(normalized)) {
    // No MSH at all — treat each non-empty line as a segment of one message.
    return normalized ? [normalized] : [];
  }
  return chunks;
}

/** Parse one message (or segment group) into segments. */
export function parseMessage(raw: string): ParsedMessage {
  const lines = raw
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const segments: ParsedSegment[] = lines.map((line) => {
    const bar = line.indexOf("|");
    const name = (bar === -1 ? line : line.slice(0, bar)).trim().toUpperCase();
    return { name, raw: line, parts: line.split("|") };
  });
  return { raw, segments };
}

export function segmentsOf(msg: ParsedMessage, name: string): ParsedSegment[] {
  return msg.segments.filter((s) => s.name === name);
}

export function firstSegment(msg: ParsedMessage, name: string): ParsedSegment | undefined {
  return msg.segments.find((s) => s.name === name);
}

/**
 * Get field value by HL7 1-based field position.
 * Handles the MSH off-by-one: MSH-1 is the field separator itself, so
 * MSH-n (n>=2) lives at parts[n-1]. All other segments: SEG-n = parts[n].
 */
export function getField(seg: ParsedSegment | undefined, pos: number): string {
  if (!seg || pos < 1) return "";
  if (seg.name === "MSH") {
    if (pos === 1) return "|";
    return seg.parts[pos - 1] ?? "";
  }
  return seg.parts[pos] ?? "";
}

/** Repeats of a field, split on ~. */
export function getRepeats(seg: ParsedSegment | undefined, pos: number): string[] {
  const v = getField(seg, pos);
  return v ? v.split("~") : [];
}

/** Component of a field, 1-based, split on ^. */
export function comp(fieldValue: string, pos: number): string {
  if (!fieldValue || pos < 1) return "";
  return fieldValue.split("^")[pos - 1] ?? "";
}

/** Subcomponent, 1-based, split on & (within a component). */
export function subcomp(componentValue: string, pos: number): string {
  if (!componentValue || pos < 1) return "";
  return componentValue.split("&")[pos - 1] ?? "";
}

/** MSH-9 message type as "ADT^A01" (handles ^ and - separators). */
export function messageType(msg: ParsedMessage): string {
  const msh = firstSegment(msg, "MSH");
  const raw = getField(msh, 9).replace(/-/g, "^");
  const [type, trigger] = raw.split("^");
  return trigger ? `${type}^${trigger}` : type || "UNKNOWN";
}

/**
 * Parse HL7 DTM (YYYY[MM[DD[HH[MM[SS]]]]][+/-ZZZZ]) to an ISO-ish string.
 * Returns null when unparseable. Timezone offsets are preserved as +HH:MM.
 */
export function parseDTM(dtm: string): string | null {
  const s = (dtm ?? "").trim();
  const m = s.match(/^(\d{4})(\d{2})?(\d{2})?(\d{2})?(\d{2})?(\d{2})?([+-]\d{4})?/);
  if (!m) return null;
  const [, y, mo, d, h, mi, sec, tz] = m;
  if (!mo) return `${y}`;
  if (!d) return `${y}-${mo}`;
  let out = `${y}-${mo}-${d}`;
  if (h) {
    out += `T${h}:${mi ?? "00"}:${sec ?? "00"}`;
    out += tz ? `${tz.slice(0, 3)}:${tz.slice(3)}` : "";
  }
  return out;
}

/** Map HL7 PID-8 administrative sex to FHIR gender. */
export function fhirGender(adminSex: string): string | undefined {
  const v = (adminSex ?? "").trim().toUpperCase();
  if (v === "M") return "male";
  if (v === "F") return "female";
  if (v === "O") return "other";
  if (v === "U" || v === "A" || v === "N") return "unknown";
  return undefined;
}

/** Map HL7 PV1-2 patient class to FHIR Encounter.class code. */
export function fhirEncounterClass(pv12: string): { code: string; display: string } {
  const v = (pv12 ?? "").trim().toUpperCase();
  const map: Record<string, string> = {
    I: "Inpatient",
    O: "Outpatient",
    E: "Emergency",
    P: "Preadmit",
    R: "Recurring",
    B: "Obstetrics",
    N: "Newborn",
  };
  const known: Record<string, string> = {
    IMP: "inpatient",
    EMER: "emergency",
    AMB: "ambulatory",
    OBSENC: "observation",
    PRENC: "preadmission",
    SS: "short stay",
    VR: "virtual",
  };
  if (known[v]) return { code: v, display: known[v] };
  if (map[v]) {
    const codeMap: Record<string, string> = {
      I: "IMP",
      O: "AMB",
      E: "EMER",
      P: "PRENC",
      R: "AMB",
      B: "IMP",
      N: "IMP",
    };
    return { code: codeMap[v], display: map[v] };
  }
  return { code: "AMB", display: "ambulatory" };
}
