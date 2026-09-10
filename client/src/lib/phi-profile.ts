/**
 * PHI field profile for HL7 v2 de-identification.
 *
 * Each rule maps a SEG-FIELD position to a handling strategy. Field
 * positions mirror the model in the HL7 SQL Builder (HL7_SEGMENTS), so the
 * two tools stay consistent about where patient data lives.
 *
 * Rules:
 * - replace-id      Stable pseudonymous identifier (MRN, account, visit…)
 * - replace-name    Stable pseudonymous person name (patient, kin, doctor)
 * - replace-address Stable pseudonymous address
 * - replace-phone   Stable pseudonymous phone (555 fictional range)
 * - replace-generic Stable pseudonymous code/name (facility, insurer…)
 * - shift-date      Shift by the patient's private offset (order preserved)
 * - regenerate      Fresh random value per message (MSH-10 control ID)
 * - keep            Left untouched (clinical content, coded values)
 */

export type PhiRule =
  | "replace-id"
  | "replace-name"
  | "replace-address"
  | "replace-phone"
  | "replace-generic"
  | "shift-date"
  | "regenerate"
  | "keep";

export interface PhiFieldRule {
  /** e.g. "PID-3" */
  field: string;
  segment: string;
  rule: PhiRule;
  label: string;
  /** Which HIPAA Safe Harbor identifier this covers (1-18), if any. */
  safeHarbor?: number;
}

export const SAFE_HARBOR_NAMES: Record<number, string> = {
  1: "Names",
  2: "Geographic subdivisions smaller than state",
  3: "Dates (except year) related to an individual",
  4: "Phone numbers",
  5: "Fax numbers",
  6: "Email addresses",
  7: "Social Security numbers",
  8: "Medical record numbers",
  9: "Health plan beneficiary numbers",
  10: "Account numbers",
  11: "Certificate/license numbers",
  12: "Vehicle identifiers and serial numbers",
  13: "Device identifiers and serial numbers",
  14: "Web URLs",
  15: "IP addresses",
  16: "Biometric identifiers",
  17: "Full-face photographs",
  18: "Any other unique identifying number or code",
};

export const PHI_RULES: PhiFieldRule[] = [
  // -- MSH: Message Header ---------------------------------------------
  { field: "MSH-3", segment: "MSH", rule: "replace-generic", label: "Sending Application", safeHarbor: 18 },
  { field: "MSH-4", segment: "MSH", rule: "replace-generic", label: "Sending Facility", safeHarbor: 18 },
  { field: "MSH-5", segment: "MSH", rule: "replace-generic", label: "Receiving Application", safeHarbor: 18 },
  { field: "MSH-6", segment: "MSH", rule: "replace-generic", label: "Receiving Facility", safeHarbor: 18 },
  { field: "MSH-7", segment: "MSH", rule: "shift-date", label: "Message DateTime", safeHarbor: 3 },
  { field: "MSH-10", segment: "MSH", rule: "regenerate", label: "Message Control ID", safeHarbor: 18 },

  // -- EVN: Event Type ---------------------------------------------------
  { field: "EVN-2", segment: "EVN", rule: "shift-date", label: "Recorded DateTime", safeHarbor: 3 },
  { field: "EVN-3", segment: "EVN", rule: "shift-date", label: "Planned Event DateTime", safeHarbor: 3 },
  { field: "EVN-5", segment: "EVN", rule: "replace-id", label: "Operator ID", safeHarbor: 1 },
  { field: "EVN-6", segment: "EVN", rule: "shift-date", label: "Event Occurred", safeHarbor: 3 },

  // -- PID: Patient Identification ---------------------------------------
  { field: "PID-2", segment: "PID", rule: "replace-id", label: "External Patient ID", safeHarbor: 8 },
  { field: "PID-3", segment: "PID", rule: "replace-id", label: "Patient ID (MRN)", safeHarbor: 8 },
  { field: "PID-4", segment: "PID", rule: "replace-id", label: "Alternate Patient ID", safeHarbor: 8 },
  { field: "PID-5", segment: "PID", rule: "replace-name", label: "Patient Name", safeHarbor: 1 },
  { field: "PID-6", segment: "PID", rule: "replace-name", label: "Mother's Maiden Name", safeHarbor: 1 },
  { field: "PID-7", segment: "PID", rule: "shift-date", label: "Date of Birth", safeHarbor: 3 },
  { field: "PID-9", segment: "PID", rule: "replace-name", label: "Patient Alias", safeHarbor: 1 },
  { field: "PID-11", segment: "PID", rule: "replace-address", label: "Patient Address", safeHarbor: 2 },
  { field: "PID-12", segment: "PID", rule: "replace-generic", label: "County Code", safeHarbor: 2 },
  { field: "PID-13", segment: "PID", rule: "replace-phone", label: "Home Phone", safeHarbor: 4 },
  { field: "PID-14", segment: "PID", rule: "replace-phone", label: "Business Phone", safeHarbor: 4 },
  { field: "PID-18", segment: "PID", rule: "replace-id", label: "Account Number", safeHarbor: 10 },
  { field: "PID-19", segment: "PID", rule: "replace-id", label: "SSN", safeHarbor: 7 },
  { field: "PID-20", segment: "PID", rule: "replace-id", label: "Driver's License", safeHarbor: 11 },

  // -- PV1: Patient Visit --------------------------------------------------
  { field: "PV1-5", segment: "PV1", rule: "replace-id", label: "Preadmit Number", safeHarbor: 18 },
  { field: "PV1-7", segment: "PV1", rule: "replace-name", label: "Attending Doctor", safeHarbor: 1 },
  { field: "PV1-8", segment: "PV1", rule: "replace-name", label: "Referring Doctor", safeHarbor: 1 },
  { field: "PV1-9", segment: "PV1", rule: "replace-name", label: "Consulting Doctor", safeHarbor: 1 },
  { field: "PV1-17", segment: "PV1", rule: "replace-name", label: "Admitting Doctor", safeHarbor: 1 },
  { field: "PV1-19", segment: "PV1", rule: "replace-id", label: "Visit Number", safeHarbor: 18 },
  { field: "PV1-44", segment: "PV1", rule: "shift-date", label: "Admit DateTime", safeHarbor: 3 },
  { field: "PV1-45", segment: "PV1", rule: "shift-date", label: "Discharge DateTime", safeHarbor: 3 },

  // -- PV2: Patient Visit (Additional) --------------------------------------
  { field: "PV2-8", segment: "PV2", rule: "shift-date", label: "Expected Admit DateTime", safeHarbor: 3 },
  { field: "PV2-9", segment: "PV2", rule: "shift-date", label: "Expected Discharge DateTime", safeHarbor: 3 },

  // -- NK1: Next of Kin ------------------------------------------------------
  { field: "NK1-2", segment: "NK1", rule: "replace-name", label: "Contact Name", safeHarbor: 1 },
  { field: "NK1-4", segment: "NK1", rule: "replace-address", label: "Contact Address", safeHarbor: 2 },
  { field: "NK1-5", segment: "NK1", rule: "replace-phone", label: "Contact Phone", safeHarbor: 4 },
  { field: "NK1-6", segment: "NK1", rule: "replace-phone", label: "Contact Business Phone", safeHarbor: 4 },

  // -- DG1: Diagnosis ----------------------------------------------------------
  { field: "DG1-5", segment: "DG1", rule: "shift-date", label: "Diagnosis DateTime", safeHarbor: 3 },
  { field: "DG1-16", segment: "DG1", rule: "replace-name", label: "Diagnosing Clinician", safeHarbor: 1 },

  // -- IN1: Insurance ------------------------------------------------------------
  { field: "IN1-2", segment: "IN1", rule: "replace-id", label: "Insurance Plan ID", safeHarbor: 9 },
  { field: "IN1-3", segment: "IN1", rule: "replace-id", label: "Insurance Company ID", safeHarbor: 9 },
  { field: "IN1-4", segment: "IN1", rule: "replace-generic", label: "Insurance Company Name", safeHarbor: 9 },
  { field: "IN1-5", segment: "IN1", rule: "replace-address", label: "Insurance Company Address", safeHarbor: 2 },
  { field: "IN1-12", segment: "IN1", rule: "shift-date", label: "Plan Effective Date", safeHarbor: 3 },
  { field: "IN1-13", segment: "IN1", rule: "shift-date", label: "Plan Expiration Date", safeHarbor: 3 },
  { field: "IN1-36", segment: "IN1", rule: "replace-id", label: "Policy Number", safeHarbor: 9 },
  { field: "IN1-49", segment: "IN1", rule: "replace-id", label: "Insured ID Number", safeHarbor: 9 },

  // -- AL1: Allergy ---------------------------------------------------------------
  { field: "AL1-6", segment: "AL1", rule: "shift-date", label: "Identification Date", safeHarbor: 3 },
];

export const PHI_RULE_MAP: Record<string, PhiFieldRule> = Object.fromEntries(
  PHI_RULES.map((r) => [r.field, r])
);

/**
 * Segments that routinely carry unstructured free text. The tool cannot
 * prove these clean, so their presence is reported as residual risk and
 * the rescan gate checks them for leaked PHI values.
 */
export const UNSTRUCTURED_RISK_SEGMENTS: { segment: string; note: string }[] = [
  { segment: "NTE", note: "Notes and Comments often embed names, dates, or phone numbers in free text." },
  { segment: "OBX", note: "OBX-5 observation values can contain dictated or transcribed free text." },
  { segment: "PV2", note: "PV2-3 admit reason is free text and may name people or places." },
];

/** Fields deliberately left untouched (clinical/coded content). */
export const KEPT_FIELDS_NOTE =
  "Sex, race, language, marital status, diagnosis/procedure/allergy codes, locations (PV1-3), and message types are preserved — they carry research value without directly identifying the patient in most cohorts.";
