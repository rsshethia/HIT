// Synthetic HL7v2 fixtures for the V2→FHIR Converter and Data-Quality Auditor.
// Fictional patients only. Safe to bundle, paste, and share.

export interface Hl7Sample {
  id: string;
  label: string;
  description: string;
  message: string;
}

export const V2_FHIR_SAMPLES: Hl7Sample[] = [
  {
    id: "adt-a01",
    label: "ADT-A01 — Emergency admit",
    description: "Standard admit with full PID/PV1 demographics.",
    message: [
      "MSH|^~\\&|EMR_APP|CITY_HOSP|FHIR_GW|HIT|20260310143000+1100||ADT^A01|MSG00001|P|2.5",
      "EVN|A01|20260310143000+1100",
      "PID|||PT10001^^^CITY_HOSP^MR||CITIZEN^ALEX^J||19900514|M|||42 SAMPLE ST^^SAMPLETOWN^VIC^3000^AU||0414000001||||||||||10001",
      "NK1|1|CITIZEN^SAM|SPO||||||",
      "PV1||E|ED^01^A^CITY_HOSP||||DRSMITH^JOHN^A|||SUR|||||||||V20260310001|||||||||||||||||||||||||20260310143000+1100",
    ].join("\n"),
  },
  {
    id: "adt-a08",
    label: "ADT-A08 — Update, repeat identifiers",
    description: "Patient update with repeat PID-3 identifiers and two NK1 contacts.",
    message: [
      "MSH|^~\\&|EMR_APP|CITY_HOSP|FHIR_GW|HIT|20260311100000+1100||ADT^A08|MSG00002|P|2.5",
      "EVN|A08|20260311100000+1100",
      "PID|||PT10001^^^CITY_HOSP^MR~998877^^^MEDICARE^MC||CITIZEN^ALEX^J||19900514|M|||42 SAMPLE ST^^SAMPLETOWN^VIC^3000^AU||0414000001||||||||||10001",
      "NK1|1|CITIZEN^SAM|SPO||||||",
      "NK1|2|CITIZEN^LEE|BRO||||||",
      "PV1||I|WARD3^12^B^CITY_HOSP||||DRJONES^AMY^B|||MED|||||||||V20260310001|||||||||||||||||||||||||20260310143000+1100",
    ].join("\n"),
  },
  {
    id: "oru-r01",
    label: "ORU-R01 — Lab results",
    description: "Two OBX results: coded potassium and free-text comment.",
    message: [
      "MSH|^~\\&|LIS|CITY_HOSP|EMR_APP|CITY_HOSP|20260311120000+1100||ORU^R01|MSG00003|P|2.5",
      "PID|||PT10001^^^CITY_HOSP^MR||CITIZEN^ALEX^J||19900514|M",
      "PV1||O|PATH^01^^CITY_HOSP|||||||||||||||||V20260310002",
      "ORC|RE|ORD9001",
      "OBR|1|ORD9001||NAK^SODIUM POTASSIUM PANEL^L|||20260311110000+1100",
      "OBX|1|NM|2823-3^POTASSIUM^LN||4.2|mmol/L|3.5-5.1|N|||F",
      "OBX|2|TX|-note^COMMENT^L||Specimen slightly haemolysed||||||F",
    ].join("\n"),
  },
  {
    id: "adt-a03",
    label: "ADT-A03 — Discharge with diagnosis",
    description: "Discharge with DG1 diagnosis and admit/discharge dates.",
    message: [
      "MSH|^~\\&|EMR_APP|CITY_HOSP|FHIR_GW|HIT|20260312150000+1100||ADT^A03|MSG00004|P|2.5",
      "EVN|A03|20260312150000+1100",
      "PID|||PT10002^^^CITY_HOSP^MR||EXAMPLE^RITA^M||19481102|F",
      "PV1||I|WARD2^08^A^CITY_HOSP||||DRPATEL^NEHA^C||||||||||V20260310009|||||||||||||||||||||||||20260309100000+1100|20260312150000+1100",
      "DG1|1||I10^ESSENTIAL HYPERTENSION^I10|||F",
    ].join("\n"),
  },
  {
    id: "adt-bad",
    label: "ADT-A01 — Typical feed problems",
    description: "Missing PID-3, bad patient class, discharge before admit, duplicate control ID.",
    message: [
      "MSH|^~\\&|EMR_APP|CITY_HOSP|FHIR_GW|HIT|20260313100000+1100||ADT^A01|MSG00001|P|2.5",
      "EVN|A01|20260313100000+1100",
      "PID||||||||||||||||||||||||||||||",
      "PV1||X|WARD9^99^Z^CITY_HOSP||||||||||||||||||||||||||||||20260313100000+1100|20260312100000+1100",
    ].join("\n"),
  },
];
