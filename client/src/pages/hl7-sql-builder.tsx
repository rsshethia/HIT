import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup
} from "@/components/ui/resizable";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { Copy, Database, FileCode, Table, Play, RefreshCw, Filter, Settings2 } from 'lucide-react';

interface IdentifierOption {
  code: string;
  name: string;
  description: string;
}

interface HL7Field {
  id: string;
  position: string;
  name: string;
  dataType: string;
  maxLength: number;
  description: string;
  repeating?: boolean;
  identifierComponent?: number;
  identifierOptions?: IdentifierOption[];
}

interface HL7Segment {
  id: string;
  name: string;
  description: string;
  fields: HL7Field[];
  repeating?: boolean;
}

interface FieldConfig {
  repeatHandling: 'first' | 'concatenate' | 'filter';
  identifierFilter?: string;
}

const IDENTIFIER_TYPES = {
  patientId: [
    { code: 'MR', name: 'Medical Record', description: 'Medical Record Number' },
    { code: 'SS', name: 'Social Security', description: 'Social Security Number' },
    { code: 'DL', name: 'Driver License', description: "Driver's License" },
    { code: 'PI', name: 'Patient Internal', description: 'Patient Internal Identifier' },
    { code: 'PT', name: 'Patient External', description: 'Patient External Identifier' },
    { code: 'AN', name: 'Account Number', description: 'Account Number' },
    { code: 'VN', name: 'Visit Number', description: 'Visit Number' },
  ],
  patientName: [
    { code: 'L', name: 'Legal', description: 'Legal Name' },
    { code: 'A', name: 'Alias', description: 'Alias/Nickname' },
    { code: 'M', name: 'Maiden', description: 'Maiden Name' },
    { code: 'B', name: 'Birth', description: 'Name at Birth' },
    { code: 'C', name: 'Adopted', description: 'Adopted Name' },
    { code: 'D', name: 'Display', description: 'Display Name' },
    { code: 'N', name: 'Nickname', description: 'Nickname' },
  ],
  address: [
    { code: 'H', name: 'Home', description: 'Home Address' },
    { code: 'B', name: 'Business', description: 'Business/Office Address' },
    { code: 'M', name: 'Mailing', description: 'Mailing Address' },
    { code: 'C', name: 'Current', description: 'Current/Temporary Address' },
    { code: 'P', name: 'Permanent', description: 'Permanent Address' },
    { code: 'L', name: 'Legal', description: 'Legal Address' },
  ],
  phone: [
    { code: 'PRN', name: 'Primary', description: 'Primary Residence Number' },
    { code: 'ORN', name: 'Other', description: 'Other Residence Number' },
    { code: 'WPN', name: 'Work', description: 'Work Phone Number' },
    { code: 'VHN', name: 'Vacation', description: 'Vacation Home Number' },
    { code: 'ASN', name: 'Answering', description: 'Answering Service' },
    { code: 'EMR', name: 'Emergency', description: 'Emergency Number' },
    { code: 'NET', name: 'Email', description: 'Network/Email Address' },
    { code: 'BPN', name: 'Beeper', description: 'Beeper/Pager' },
  ],
};

const FIELD_VALUE_COMPONENTS: Record<string, number> = {
  'PID-3': 1,
  'PID-5': 1,
  'PID-11': 1,
  'PID-13': 1,
  'PID-14': 1,
};

const HL7_SEGMENTS: HL7Segment[] = [
  {
    id: "MSH",
    name: "MSH - Message Header",
    description: "Message header segment containing metadata",
    fields: [
      { id: "MSH-3", position: "MSH-3", name: "Sending Application", dataType: "VARCHAR", maxLength: 50, description: "Application sending the message" },
      { id: "MSH-4", position: "MSH-4", name: "Sending Facility", dataType: "VARCHAR", maxLength: 50, description: "Facility sending the message" },
      { id: "MSH-5", position: "MSH-5", name: "Receiving Application", dataType: "VARCHAR", maxLength: 50, description: "Application receiving the message" },
      { id: "MSH-6", position: "MSH-6", name: "Receiving Facility", dataType: "VARCHAR", maxLength: 50, description: "Facility receiving the message" },
      { id: "MSH-7", position: "MSH-7", name: "Message DateTime", dataType: "DATETIME", maxLength: 0, description: "Date/time message was created" },
      { id: "MSH-9", position: "MSH-9", name: "Message Type", dataType: "VARCHAR", maxLength: 20, description: "Message type (e.g., ADT^A01)" },
      { id: "MSH-10", position: "MSH-10", name: "Message Control ID", dataType: "VARCHAR", maxLength: 50, description: "Unique message identifier" },
      { id: "MSH-11", position: "MSH-11", name: "Processing ID", dataType: "VARCHAR", maxLength: 10, description: "P=Production, T=Training, D=Debug" },
      { id: "MSH-12", position: "MSH-12", name: "Version ID", dataType: "VARCHAR", maxLength: 10, description: "HL7 version (e.g., 2.5.1)" },
    ]
  },
  {
    id: "EVN",
    name: "EVN - Event Type",
    description: "Event type segment with trigger event info",
    fields: [
      { id: "EVN-1", position: "EVN-1", name: "Event Type Code", dataType: "VARCHAR", maxLength: 10, description: "Trigger event code" },
      { id: "EVN-2", position: "EVN-2", name: "Recorded DateTime", dataType: "DATETIME", maxLength: 0, description: "When event was recorded" },
      { id: "EVN-3", position: "EVN-3", name: "Planned Event DateTime", dataType: "DATETIME", maxLength: 0, description: "Planned date/time for event" },
      { id: "EVN-4", position: "EVN-4", name: "Event Reason Code", dataType: "VARCHAR", maxLength: 20, description: "Reason for the event" },
      { id: "EVN-5", position: "EVN-5", name: "Operator ID", dataType: "VARCHAR", maxLength: 50, description: "User who triggered the event" },
      { id: "EVN-6", position: "EVN-6", name: "Event Occurred", dataType: "DATETIME", maxLength: 0, description: "When the event occurred" },
    ]
  },
  {
    id: "PID",
    name: "PID - Patient Identification",
    description: "Patient demographic information",
    fields: [
      { id: "PID-1", position: "PID-1", name: "Set ID", dataType: "INT", maxLength: 0, description: "Sequence number" },
      { id: "PID-2", position: "PID-2", name: "External Patient ID", dataType: "VARCHAR", maxLength: 50, description: "External patient identifier" },
      { id: "PID-3", position: "PID-3", name: "Patient ID (MRN)", dataType: "VARCHAR", maxLength: 50, description: "Medical Record Number", repeating: true, identifierComponent: 5, identifierOptions: IDENTIFIER_TYPES.patientId },
      { id: "PID-4", position: "PID-4", name: "Alternate Patient ID", dataType: "VARCHAR", maxLength: 50, description: "Alternate patient identifier" },
      { id: "PID-5", position: "PID-5", name: "Patient Name", dataType: "VARCHAR", maxLength: 100, description: "Full patient name", repeating: true, identifierComponent: 7, identifierOptions: IDENTIFIER_TYPES.patientName },
      { id: "PID-6", position: "PID-6", name: "Mother's Maiden Name", dataType: "VARCHAR", maxLength: 50, description: "Mother's maiden name" },
      { id: "PID-7", position: "PID-7", name: "Date of Birth", dataType: "DATE", maxLength: 0, description: "Patient date of birth" },
      { id: "PID-8", position: "PID-8", name: "Sex", dataType: "CHAR", maxLength: 1, description: "Administrative sex (M/F/U)" },
      { id: "PID-9", position: "PID-9", name: "Patient Alias", dataType: "VARCHAR", maxLength: 100, description: "Patient alias/nickname" },
      { id: "PID-10", position: "PID-10", name: "Race", dataType: "VARCHAR", maxLength: 20, description: "Patient race" },
      { id: "PID-11", position: "PID-11", name: "Patient Address", dataType: "VARCHAR", maxLength: 200, description: "Patient home address", repeating: true, identifierComponent: 7, identifierOptions: IDENTIFIER_TYPES.address },
      { id: "PID-12", position: "PID-12", name: "County Code", dataType: "VARCHAR", maxLength: 20, description: "County of residence" },
      { id: "PID-13", position: "PID-13", name: "Home Phone", dataType: "VARCHAR", maxLength: 30, description: "Home phone number", repeating: true, identifierComponent: 2, identifierOptions: IDENTIFIER_TYPES.phone },
      { id: "PID-14", position: "PID-14", name: "Business Phone", dataType: "VARCHAR", maxLength: 30, description: "Business phone number", repeating: true, identifierComponent: 2, identifierOptions: IDENTIFIER_TYPES.phone },
      { id: "PID-15", position: "PID-15", name: "Primary Language", dataType: "VARCHAR", maxLength: 20, description: "Primary language" },
      { id: "PID-16", position: "PID-16", name: "Marital Status", dataType: "VARCHAR", maxLength: 10, description: "Marital status code" },
      { id: "PID-17", position: "PID-17", name: "Religion", dataType: "VARCHAR", maxLength: 20, description: "Religion code" },
      { id: "PID-18", position: "PID-18", name: "Account Number", dataType: "VARCHAR", maxLength: 50, description: "Patient account number" },
      { id: "PID-19", position: "PID-19", name: "SSN", dataType: "VARCHAR", maxLength: 20, description: "Social Security Number" },
      { id: "PID-20", position: "PID-20", name: "Driver's License", dataType: "VARCHAR", maxLength: 30, description: "Driver's license number" },
    ]
  },
  {
    id: "PV1",
    name: "PV1 - Patient Visit",
    description: "Patient visit information",
    fields: [
      { id: "PV1-1", position: "PV1-1", name: "Set ID", dataType: "INT", maxLength: 0, description: "Sequence number" },
      { id: "PV1-2", position: "PV1-2", name: "Patient Class", dataType: "VARCHAR", maxLength: 10, description: "I=Inpatient, O=Outpatient, E=Emergency" },
      { id: "PV1-3", position: "PV1-3", name: "Assigned Location", dataType: "VARCHAR", maxLength: 50, description: "Point of care location" },
      { id: "PV1-4", position: "PV1-4", name: "Admission Type", dataType: "VARCHAR", maxLength: 10, description: "Type of admission" },
      { id: "PV1-5", position: "PV1-5", name: "Preadmit Number", dataType: "VARCHAR", maxLength: 30, description: "Pre-admission identifier" },
      { id: "PV1-6", position: "PV1-6", name: "Prior Location", dataType: "VARCHAR", maxLength: 50, description: "Prior patient location" },
      { id: "PV1-7", position: "PV1-7", name: "Attending Doctor", dataType: "VARCHAR", maxLength: 100, description: "Attending physician" },
      { id: "PV1-8", position: "PV1-8", name: "Referring Doctor", dataType: "VARCHAR", maxLength: 100, description: "Referring physician" },
      { id: "PV1-9", position: "PV1-9", name: "Consulting Doctor", dataType: "VARCHAR", maxLength: 100, description: "Consulting physician" },
      { id: "PV1-10", position: "PV1-10", name: "Hospital Service", dataType: "VARCHAR", maxLength: 20, description: "Hospital service code" },
      { id: "PV1-11", position: "PV1-11", name: "Temporary Location", dataType: "VARCHAR", maxLength: 50, description: "Temporary location" },
      { id: "PV1-14", position: "PV1-14", name: "Admit Source", dataType: "VARCHAR", maxLength: 10, description: "Source of admission" },
      { id: "PV1-15", position: "PV1-15", name: "Ambulatory Status", dataType: "VARCHAR", maxLength: 10, description: "Ambulatory status code" },
      { id: "PV1-16", position: "PV1-16", name: "VIP Indicator", dataType: "VARCHAR", maxLength: 10, description: "VIP indicator" },
      { id: "PV1-17", position: "PV1-17", name: "Admitting Doctor", dataType: "VARCHAR", maxLength: 100, description: "Admitting physician" },
      { id: "PV1-18", position: "PV1-18", name: "Patient Type", dataType: "VARCHAR", maxLength: 10, description: "Patient type code" },
      { id: "PV1-19", position: "PV1-19", name: "Visit Number", dataType: "VARCHAR", maxLength: 50, description: "Visit/encounter number" },
      { id: "PV1-36", position: "PV1-36", name: "Discharge Disposition", dataType: "VARCHAR", maxLength: 10, description: "Discharge disposition code" },
      { id: "PV1-44", position: "PV1-44", name: "Admit DateTime", dataType: "DATETIME", maxLength: 0, description: "Admission date/time" },
      { id: "PV1-45", position: "PV1-45", name: "Discharge DateTime", dataType: "DATETIME", maxLength: 0, description: "Discharge date/time" },
    ]
  },
  {
    id: "PV2",
    name: "PV2 - Patient Visit (Additional)",
    description: "Additional patient visit information",
    fields: [
      { id: "PV2-1", position: "PV2-1", name: "Prior Pending Location", dataType: "VARCHAR", maxLength: 50, description: "Prior pending location" },
      { id: "PV2-3", position: "PV2-3", name: "Admit Reason", dataType: "VARCHAR", maxLength: 100, description: "Reason for admission" },
      { id: "PV2-8", position: "PV2-8", name: "Expected Admit DateTime", dataType: "DATETIME", maxLength: 0, description: "Expected admit date/time" },
      { id: "PV2-9", position: "PV2-9", name: "Expected Discharge DateTime", dataType: "DATETIME", maxLength: 0, description: "Expected discharge date/time" },
      { id: "PV2-22", position: "PV2-22", name: "Visit Protection Indicator", dataType: "VARCHAR", maxLength: 10, description: "Visit protection indicator" },
    ]
  },
  {
    id: "NK1",
    name: "NK1 - Next of Kin",
    description: "Next of kin/emergency contact information",
    repeating: true,
    fields: [
      { id: "NK1-1", position: "NK1-1", name: "Set ID", dataType: "INT", maxLength: 0, description: "Sequence number" },
      { id: "NK1-2", position: "NK1-2", name: "Name", dataType: "VARCHAR", maxLength: 100, description: "Contact name" },
      { id: "NK1-3", position: "NK1-3", name: "Relationship", dataType: "VARCHAR", maxLength: 30, description: "Relationship to patient" },
      { id: "NK1-4", position: "NK1-4", name: "Address", dataType: "VARCHAR", maxLength: 200, description: "Contact address" },
      { id: "NK1-5", position: "NK1-5", name: "Phone Number", dataType: "VARCHAR", maxLength: 30, description: "Contact phone" },
      { id: "NK1-6", position: "NK1-6", name: "Business Phone", dataType: "VARCHAR", maxLength: 30, description: "Contact business phone" },
      { id: "NK1-7", position: "NK1-7", name: "Contact Role", dataType: "VARCHAR", maxLength: 30, description: "Role of contact" },
    ]
  },
  {
    id: "DG1",
    name: "DG1 - Diagnosis",
    description: "Diagnosis information",
    repeating: true,
    fields: [
      { id: "DG1-1", position: "DG1-1", name: "Set ID", dataType: "INT", maxLength: 0, description: "Sequence number" },
      { id: "DG1-2", position: "DG1-2", name: "Diagnosis Coding Method", dataType: "VARCHAR", maxLength: 10, description: "Coding method (ICD-10, etc.)" },
      { id: "DG1-3", position: "DG1-3", name: "Diagnosis Code", dataType: "VARCHAR", maxLength: 20, description: "Diagnosis code" },
      { id: "DG1-4", position: "DG1-4", name: "Diagnosis Description", dataType: "VARCHAR", maxLength: 200, description: "Diagnosis description" },
      { id: "DG1-5", position: "DG1-5", name: "Diagnosis DateTime", dataType: "DATETIME", maxLength: 0, description: "Diagnosis date/time" },
      { id: "DG1-6", position: "DG1-6", name: "Diagnosis Type", dataType: "VARCHAR", maxLength: 10, description: "Admission, working, final" },
      { id: "DG1-15", position: "DG1-15", name: "Diagnosis Priority", dataType: "INT", maxLength: 0, description: "Priority ranking" },
      { id: "DG1-16", position: "DG1-16", name: "Diagnosing Clinician", dataType: "VARCHAR", maxLength: 100, description: "Diagnosing provider" },
    ]
  },
  {
    id: "IN1",
    name: "IN1 - Insurance",
    description: "Insurance information",
    repeating: true,
    fields: [
      { id: "IN1-1", position: "IN1-1", name: "Set ID", dataType: "INT", maxLength: 0, description: "Sequence number" },
      { id: "IN1-2", position: "IN1-2", name: "Insurance Plan ID", dataType: "VARCHAR", maxLength: 50, description: "Insurance plan identifier" },
      { id: "IN1-3", position: "IN1-3", name: "Insurance Company ID", dataType: "VARCHAR", maxLength: 50, description: "Insurance company identifier" },
      { id: "IN1-4", position: "IN1-4", name: "Insurance Company Name", dataType: "VARCHAR", maxLength: 100, description: "Insurance company name" },
      { id: "IN1-5", position: "IN1-5", name: "Insurance Company Address", dataType: "VARCHAR", maxLength: 200, description: "Insurance company address" },
      { id: "IN1-12", position: "IN1-12", name: "Plan Effective Date", dataType: "DATE", maxLength: 0, description: "Coverage effective date" },
      { id: "IN1-13", position: "IN1-13", name: "Plan Expiration Date", dataType: "DATE", maxLength: 0, description: "Coverage expiration date" },
      { id: "IN1-36", position: "IN1-36", name: "Policy Number", dataType: "VARCHAR", maxLength: 50, description: "Policy number" },
      { id: "IN1-49", position: "IN1-49", name: "Insured ID Number", dataType: "VARCHAR", maxLength: 50, description: "Insured's ID number" },
    ]
  },
  {
    id: "AL1",
    name: "AL1 - Allergy Information",
    description: "Patient allergy information",
    repeating: true,
    fields: [
      { id: "AL1-1", position: "AL1-1", name: "Set ID", dataType: "INT", maxLength: 0, description: "Sequence number" },
      { id: "AL1-2", position: "AL1-2", name: "Allergen Type", dataType: "VARCHAR", maxLength: 20, description: "Type of allergen" },
      { id: "AL1-3", position: "AL1-3", name: "Allergen Code", dataType: "VARCHAR", maxLength: 50, description: "Allergen identifier" },
      { id: "AL1-4", position: "AL1-4", name: "Allergy Severity", dataType: "VARCHAR", maxLength: 20, description: "Severity of reaction" },
      { id: "AL1-5", position: "AL1-5", name: "Allergy Reaction", dataType: "VARCHAR", maxLength: 100, description: "Description of reaction" },
      { id: "AL1-6", position: "AL1-6", name: "Identification Date", dataType: "DATE", maxLength: 0, description: "Date allergy was identified" },
    ]
  }
];

export default function HL7SQLBuilder() {
  const { toast } = useToast();
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [fieldConfigs, setFieldConfigs] = useState<Record<string, FieldConfig>>({});
  const [tableName, setTableName] = useState('PatientData');
  const [sourceTableName, setSourceTableName] = useState('HL7_RAW_Messages');
  const [procedureName, setProcedureName] = useState('usp_ParseHL7Message');
  const [dbPlatform, setDbPlatform] = useState<'sqlserver' | 'mysql' | 'postgresql'>('sqlserver');

  const getFieldConfig = (fieldId: string): FieldConfig => {
    return fieldConfigs[fieldId] || { repeatHandling: 'first' };
  };

  const updateFieldConfig = (fieldId: string, config: Partial<FieldConfig>) => {
    setFieldConfigs(prev => ({
      ...prev,
      [fieldId]: { ...getFieldConfig(fieldId), ...config }
    }));
  };

  const toggleField = (fieldId: string) => {
    const newSet = new Set(selectedFields);
    if (newSet.has(fieldId)) {
      newSet.delete(fieldId);
    } else {
      newSet.add(fieldId);
    }
    setSelectedFields(newSet);
  };

  const toggleSegment = (segment: HL7Segment) => {
    const newSet = new Set(selectedFields);
    const allSelected = segment.fields.every(f => selectedFields.has(f.id));
    
    if (allSelected) {
      segment.fields.forEach(f => newSet.delete(f.id));
    } else {
      segment.fields.forEach(f => newSet.add(f.id));
    }
    setSelectedFields(newSet);
  };

  const selectCommonFields = () => {
    const commonFields = new Set([
      'MSH-7', 'MSH-9', 'MSH-10',
      'PID-3', 'PID-5', 'PID-7', 'PID-8', 'PID-11', 'PID-13', 'PID-18',
      'PV1-2', 'PV1-3', 'PV1-7', 'PV1-19', 'PV1-44', 'PV1-45'
    ]);
    setSelectedFields(commonFields);
  };

  const clearAll = () => {
    setSelectedFields(new Set());
    setFieldConfigs({});
  };

  const getSelectedFieldsGroupedBySegment = useMemo(() => {
    const grouped: Record<string, HL7Field[]> = {};
    HL7_SEGMENTS.forEach(segment => {
      const fields = segment.fields.filter(f => selectedFields.has(f.id));
      if (fields.length > 0) {
        grouped[segment.id] = fields;
      }
    });
    return grouped;
  }, [selectedFields]);

  const getFieldInfo = (fieldId: string): HL7Field | undefined => {
    for (const segment of HL7_SEGMENTS) {
      const field = segment.fields.find(f => f.id === fieldId);
      if (field) return field;
    }
    return undefined;
  };

  const generateSQL = useMemo(() => {
    if (selectedFields.size === 0) {
      return `-- ============================================
-- HL7 SQL Builder
-- ============================================
-- Select fields from the left panel to generate SQL
-- This tool creates stored procedures to parse HL7 messages

-- REPEAT HANDLING OPTIONS:
-- Fields with repeating values (like PID-3, PID-5, PID-11)
-- can be configured with these options:
--   * First Only: Gets the first occurrence
--   * Concatenate: Joins all values with semicolons
--   * Filter by Type: Extracts only matching identifier types
--     (e.g., Legal Name only, Home Address only, MRN only)

-- NOTE ON HL7 DATA TYPES:
-- Complex HL7 fields use components separated by ^
-- By default, this tool extracts the first component:
--   * Names (XPN): Last^First^Middle -> extracts "Last"
--   * Addresses (XAD): Street^City^State^Zip -> extracts "Street"
--   * IDs (CX): ID^Check^Type -> extracts "ID"
--   * Phones (XTN): Multiple formats supported
--
-- To extract different components, modify the helper function
-- or adjust the component position in the FILTER call.`;
    }

    const grouped = getSelectedFieldsGroupedBySegment;
    const allFields: HL7Field[] = [];
    Object.values(grouped).forEach(fields => allFields.push(...fields));

    const getColumnName = (f: HL7Field): string => {
      const config = getFieldConfig(f.id);
      let name = f.name.replace(/[^a-zA-Z0-9]/g, '_');
      if (config.repeatHandling === 'filter' && config.identifierFilter) {
        const opt = f.identifierOptions?.find(o => o.code === config.identifierFilter);
        if (opt) {
          name = `${opt.name.replace(/[^a-zA-Z0-9]/g, '_')}_${f.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
        }
      }
      return name;
    };

    let sql = '';

    if (dbPlatform === 'sqlserver') {
      sql = `-- ============================================
-- HL7 Message Parser Stored Procedure
-- Generated by HIT HL7 SQL Builder
-- Database Platform: SQL Server
-- ============================================

-- Create destination table if not exists
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[${tableName}]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[${tableName}] (
        [ID] INT IDENTITY(1,1) PRIMARY KEY,
        [RawMessageID] INT NOT NULL,
        [ProcessedDateTime] DATETIME DEFAULT GETDATE(),
${allFields.map(f => {
  const colName = getColumnName(f);
  if (f.dataType === 'INT') return `        [${colName}] INT NULL`;
  if (f.dataType === 'DATETIME') return `        [${colName}] DATETIME NULL`;
  if (f.dataType === 'DATE') return `        [${colName}] DATE NULL`;
  if (f.dataType === 'CHAR') return `        [${colName}] CHAR(${f.maxLength}) NULL`;
  const config = getFieldConfig(f.id);
  const len = config.repeatHandling === 'concatenate' ? 500 : f.maxLength;
  return `        [${colName}] VARCHAR(${len}) NULL`;
}).join(',\n')}
    );
END
GO

-- ============================================
-- Helper Function: Extract HL7 Field Value
-- Supports: first occurrence, concatenation, and type filtering
-- ============================================
CREATE OR ALTER FUNCTION [dbo].[fn_GetHL7Field]
(
    @HL7Message NVARCHAR(MAX),
    @FieldPath VARCHAR(20),
    @RepeatMode VARCHAR(20) = 'FIRST',
    @TypeFilter VARCHAR(20) = NULL,
    @TypeComponent INT = 0
)
RETURNS NVARCHAR(1000)
AS
BEGIN
    DECLARE @Result NVARCHAR(1000) = NULL;
    DECLARE @SegmentName VARCHAR(3);
    DECLARE @FieldNum INT;
    DECLARE @Segment NVARCHAR(MAX);
    DECLARE @FieldValue NVARCHAR(MAX);
    DECLARE @Repeat NVARCHAR(500);
    DECLARE @RepeatDelim CHAR(1) = '~';
    DECLARE @CompDelim CHAR(1) = '^';
    DECLARE @FieldDelim CHAR(1) = '|';
    DECLARE @SegmentDelim CHAR(1) = CHAR(13);
    DECLARE @StartPos INT;
    DECLARE @EndPos INT;
    DECLARE @RepeatStart INT;
    DECLARE @RepeatEnd INT;
    DECLARE @TypeValue NVARCHAR(50);
    DECLARE @FirstComponent NVARCHAR(500);
    
    SET @SegmentName = LEFT(@FieldPath, 3);
    SET @FieldNum = CAST(SUBSTRING(@FieldPath, 5, LEN(@FieldPath)) AS INT);
    
    SET @StartPos = CHARINDEX(@SegmentName + '|', @HL7Message);
    IF @StartPos = 0 RETURN NULL;
    
    SET @EndPos = CHARINDEX(@SegmentDelim, @HL7Message, @StartPos);
    IF @EndPos = 0 SET @EndPos = LEN(@HL7Message) + 1;
    
    SET @Segment = SUBSTRING(@HL7Message, @StartPos, @EndPos - @StartPos);
    
    -- Extract field
    DECLARE @FieldStart INT = 1;
    DECLARE @FieldEnd INT;
    DECLARE @CurrentField INT = 0;
    
    WHILE @CurrentField < @FieldNum AND @FieldStart <= LEN(@Segment)
    BEGIN
        SET @FieldEnd = CHARINDEX(@FieldDelim, @Segment, @FieldStart);
        IF @FieldEnd = 0 SET @FieldEnd = LEN(@Segment) + 1;
        
        IF @CurrentField = @FieldNum - 1
        BEGIN
            SET @FieldValue = SUBSTRING(@Segment, @FieldStart, @FieldEnd - @FieldStart);
            BREAK;
        END
        
        SET @FieldStart = @FieldEnd + 1;
        SET @CurrentField = @CurrentField + 1;
    END
    
    IF @FieldValue IS NULL RETURN NULL;
    
    -- Handle repeat mode
    IF @RepeatMode = 'FIRST'
    BEGIN
        IF CHARINDEX(@RepeatDelim, @FieldValue) > 0
            SET @Result = LEFT(@FieldValue, CHARINDEX(@RepeatDelim, @FieldValue) - 1);
        ELSE
            SET @Result = @FieldValue;
        
        IF CHARINDEX(@CompDelim, @Result) > 0
            SET @Result = LEFT(@Result, CHARINDEX(@CompDelim, @Result) - 1);
    END
    ELSE IF @RepeatMode = 'CONCAT'
    BEGIN
        SET @Result = '';
        SET @RepeatStart = 1;
        WHILE @RepeatStart <= LEN(@FieldValue)
        BEGIN
            SET @RepeatEnd = CHARINDEX(@RepeatDelim, @FieldValue, @RepeatStart);
            IF @RepeatEnd = 0 SET @RepeatEnd = LEN(@FieldValue) + 1;
            
            SET @Repeat = SUBSTRING(@FieldValue, @RepeatStart, @RepeatEnd - @RepeatStart);
            SET @FirstComponent = CASE WHEN CHARINDEX(@CompDelim, @Repeat) > 0 
                THEN LEFT(@Repeat, CHARINDEX(@CompDelim, @Repeat) - 1) 
                ELSE @Repeat END;
            
            IF LEN(@Result) > 0 SET @Result = @Result + '; ';
            SET @Result = @Result + @FirstComponent;
            
            SET @RepeatStart = @RepeatEnd + 1;
        END
    END
    ELSE IF @RepeatMode = 'FILTER' AND @TypeFilter IS NOT NULL AND @TypeComponent > 0
    BEGIN
        SET @RepeatStart = 1;
        WHILE @RepeatStart <= LEN(@FieldValue)
        BEGIN
            SET @RepeatEnd = CHARINDEX(@RepeatDelim, @FieldValue, @RepeatStart);
            IF @RepeatEnd = 0 SET @RepeatEnd = LEN(@FieldValue) + 1;
            
            SET @Repeat = SUBSTRING(@FieldValue, @RepeatStart, @RepeatEnd - @RepeatStart);
            
            -- Get type component
            DECLARE @CompStart INT = 1;
            DECLARE @CompEnd INT;
            DECLARE @CompNum INT = 1;
            WHILE @CompNum < @TypeComponent AND @CompStart <= LEN(@Repeat)
            BEGIN
                SET @CompEnd = CHARINDEX(@CompDelim, @Repeat, @CompStart);
                IF @CompEnd = 0 BREAK;
                SET @CompStart = @CompEnd + 1;
                SET @CompNum = @CompNum + 1;
            END
            
            SET @CompEnd = CHARINDEX(@CompDelim, @Repeat, @CompStart);
            IF @CompEnd = 0 SET @CompEnd = LEN(@Repeat) + 1;
            SET @TypeValue = SUBSTRING(@Repeat, @CompStart, @CompEnd - @CompStart);
            
            IF @TypeValue = @TypeFilter
            BEGIN
                SET @FirstComponent = CASE WHEN CHARINDEX(@CompDelim, @Repeat) > 0 
                    THEN LEFT(@Repeat, CHARINDEX(@CompDelim, @Repeat) - 1) 
                    ELSE @Repeat END;
                SET @Result = @FirstComponent;
                BREAK;
            END
            
            SET @RepeatStart = @RepeatEnd + 1;
        END
    END
    
    RETURN @Result;
END
GO

-- Create or alter stored procedure
CREATE OR ALTER PROCEDURE [dbo].[${procedureName}]
    @RawMessageID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @RawMessage NVARCHAR(MAX);
    DECLARE @MsgID INT;
    
    DECLARE msg_cursor CURSOR FOR
        SELECT ID, RawHL7Message 
        FROM [dbo].[${sourceTableName}]
        WHERE (@RawMessageID IS NULL OR ID = @RawMessageID)
          AND ProcessedFlag = 0;
    
    OPEN msg_cursor;
    FETCH NEXT FROM msg_cursor INTO @MsgID, @RawMessage;
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        BEGIN TRY
            INSERT INTO [dbo].[${tableName}] (
                [RawMessageID],
${allFields.map(f => `                [${getColumnName(f)}]`).join(',\n')}
            )
            SELECT 
                @MsgID,
${allFields.map(f => {
  const config = getFieldConfig(f.id);
  if (config.repeatHandling === 'first' || !f.repeating) {
    return `                dbo.fn_GetHL7Field(@RawMessage, '${f.position}', 'FIRST', NULL, 0)`;
  } else if (config.repeatHandling === 'concatenate') {
    return `                dbo.fn_GetHL7Field(@RawMessage, '${f.position}', 'CONCAT', NULL, 0)`;
  } else if (config.repeatHandling === 'filter' && config.identifierFilter) {
    return `                dbo.fn_GetHL7Field(@RawMessage, '${f.position}', 'FILTER', '${config.identifierFilter}', ${f.identifierComponent || 0})`;
  }
  return `                dbo.fn_GetHL7Field(@RawMessage, '${f.position}', 'FIRST', NULL, 0)`;
}).join(',\n')}
            
            UPDATE [dbo].[${sourceTableName}]
            SET ProcessedFlag = 1, ProcessedDateTime = GETDATE()
            WHERE ID = @MsgID;
            
        END TRY
        BEGIN CATCH
            PRINT 'Error processing message ID: ' + CAST(@MsgID AS VARCHAR(10));
            PRINT ERROR_MESSAGE();
        END CATCH
        
        FETCH NEXT FROM msg_cursor INTO @MsgID, @RawMessage;
    END
    
    CLOSE msg_cursor;
    DEALLOCATE msg_cursor;
END
GO

-- Execute: EXEC [dbo].[${procedureName}];
`;
    } else if (dbPlatform === 'postgresql') {
      sql = `-- ============================================
-- HL7 Message Parser Stored Procedure
-- Generated by HIT HL7 SQL Builder  
-- Database Platform: PostgreSQL
-- ============================================

-- Create destination table if not exists
CREATE TABLE IF NOT EXISTS ${tableName} (
    id SERIAL PRIMARY KEY,
    raw_message_id INT NOT NULL,
    processed_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
${allFields.map(f => {
  const colName = getColumnName(f).toLowerCase();
  if (f.dataType === 'INT') return `    ${colName} INT`;
  if (f.dataType === 'DATETIME') return `    ${colName} TIMESTAMP`;
  if (f.dataType === 'DATE') return `    ${colName} DATE`;
  if (f.dataType === 'CHAR') return `    ${colName} CHAR(${f.maxLength})`;
  const config = getFieldConfig(f.id);
  const len = config.repeatHandling === 'concatenate' ? 500 : f.maxLength;
  return `    ${colName} VARCHAR(${len})`;
}).join(',\n')}
);

-- Helper function with repeat handling
CREATE OR REPLACE FUNCTION get_hl7_field(
    hl7_message TEXT,
    field_path VARCHAR(20),
    repeat_mode VARCHAR(20) DEFAULT 'FIRST',
    type_filter VARCHAR(20) DEFAULT NULL,
    type_component INT DEFAULT 0
)
RETURNS TEXT AS $$
DECLARE
    segment_name VARCHAR(3);
    field_num INT;
    segment_text TEXT;
    field_value TEXT;
    fields TEXT[];
    repeats TEXT[];
    repeat_item TEXT;
    components TEXT[];
    result TEXT;
    type_value TEXT;
BEGIN
    segment_name := LEFT(field_path, 3);
    field_num := CAST(SUBSTRING(field_path FROM 5) AS INT);
    
    SELECT s INTO segment_text
    FROM unnest(string_to_array(hl7_message, E'\\r')) s
    WHERE s LIKE segment_name || '|%'
    LIMIT 1;
    
    IF segment_text IS NULL THEN RETURN NULL; END IF;
    
    fields := string_to_array(segment_text, '|');
    IF array_length(fields, 1) < field_num + 1 THEN RETURN NULL; END IF;
    
    field_value := fields[field_num + 1];
    IF field_value IS NULL OR field_value = '' THEN RETURN NULL; END IF;
    
    repeats := string_to_array(field_value, '~');
    
    IF repeat_mode = 'FIRST' THEN
        result := repeats[1];
        IF position('^' in result) > 0 THEN
            result := split_part(result, '^', 1);
        END IF;
        RETURN result;
    ELSIF repeat_mode = 'CONCAT' THEN
        result := '';
        FOREACH repeat_item IN ARRAY repeats LOOP
            IF result <> '' THEN result := result || '; '; END IF;
            IF position('^' in repeat_item) > 0 THEN
                result := result || split_part(repeat_item, '^', 1);
            ELSE
                result := result || repeat_item;
            END IF;
        END LOOP;
        RETURN result;
    ELSIF repeat_mode = 'FILTER' AND type_filter IS NOT NULL AND type_component > 0 THEN
        FOREACH repeat_item IN ARRAY repeats LOOP
            components := string_to_array(repeat_item, '^');
            IF array_length(components, 1) >= type_component THEN
                type_value := components[type_component];
                IF type_value = type_filter THEN
                    RETURN components[1];
                END IF;
            END IF;
        END LOOP;
        RETURN NULL;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create stored procedure
CREATE OR REPLACE PROCEDURE ${procedureName}(
    p_raw_message_id INT DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN 
        SELECT id, raw_hl7_message 
        FROM ${sourceTableName}
        WHERE (p_raw_message_id IS NULL OR id = p_raw_message_id)
          AND processed_flag = FALSE
    LOOP
        BEGIN
            INSERT INTO ${tableName} (
                raw_message_id,
${allFields.map(f => `                ${getColumnName(f).toLowerCase()}`).join(',\n')}
            )
            VALUES (
                rec.id,
${allFields.map(f => {
  const config = getFieldConfig(f.id);
  if (config.repeatHandling === 'first' || !f.repeating) {
    return `                get_hl7_field(rec.raw_hl7_message, '${f.position}', 'FIRST', NULL, 0)`;
  } else if (config.repeatHandling === 'concatenate') {
    return `                get_hl7_field(rec.raw_hl7_message, '${f.position}', 'CONCAT', NULL, 0)`;
  } else if (config.repeatHandling === 'filter' && config.identifierFilter) {
    return `                get_hl7_field(rec.raw_hl7_message, '${f.position}', 'FILTER', '${config.identifierFilter}', ${f.identifierComponent || 0})`;
  }
  return `                get_hl7_field(rec.raw_hl7_message, '${f.position}', 'FIRST', NULL, 0)`;
}).join(',\n')}
            );
            
            UPDATE ${sourceTableName}
            SET processed_flag = TRUE, processed_datetime = CURRENT_TIMESTAMP
            WHERE id = rec.id;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error processing message ID: %', rec.id;
        END;
    END LOOP;
END;
$$;

-- Execute: CALL ${procedureName}();
`;
    } else {
      sql = `-- ============================================
-- HL7 Message Parser Stored Procedure
-- Generated by HIT HL7 SQL Builder
-- Database Platform: MySQL
-- ============================================

-- Create destination table if not exists
CREATE TABLE IF NOT EXISTS \`${tableName}\` (
    \`ID\` INT AUTO_INCREMENT PRIMARY KEY,
    \`RawMessageID\` INT NOT NULL,
    \`ProcessedDateTime\` DATETIME DEFAULT CURRENT_TIMESTAMP,
${allFields.map(f => {
  const colName = getColumnName(f);
  if (f.dataType === 'INT') return `    \`${colName}\` INT`;
  if (f.dataType === 'DATETIME') return `    \`${colName}\` DATETIME`;
  if (f.dataType === 'DATE') return `    \`${colName}\` DATE`;
  if (f.dataType === 'CHAR') return `    \`${colName}\` CHAR(${f.maxLength})`;
  const config = getFieldConfig(f.id);
  const len = config.repeatHandling === 'concatenate' ? 500 : f.maxLength;
  return `    \`${colName}\` VARCHAR(${len})`;
}).join(',\n')}
);

DELIMITER //

-- Helper function with repeat handling
CREATE FUNCTION IF NOT EXISTS fn_GetHL7Field(
    hl7_message TEXT,
    field_path VARCHAR(20),
    repeat_mode VARCHAR(20),
    type_filter VARCHAR(20),
    type_component INT
)
RETURNS VARCHAR(1000)
DETERMINISTIC
BEGIN
    DECLARE segment_name VARCHAR(3);
    DECLARE field_num INT;
    DECLARE segment_text TEXT;
    DECLARE field_value TEXT;
    DECLARE result VARCHAR(1000);
    DECLARE repeat_item VARCHAR(500);
    DECLARE type_value VARCHAR(50);
    DECLARE repeat_count INT;
    DECLARE i INT;
    
    SET segment_name = LEFT(field_path, 3);
    SET field_num = CAST(SUBSTRING(field_path, 5) AS UNSIGNED);
    
    SET segment_text = SUBSTRING_INDEX(
        SUBSTRING_INDEX(hl7_message, CONCAT('\\r', segment_name, '|'), -1),
        '\\r', 1
    );
    
    IF segment_text IS NULL OR segment_text = '' THEN
        RETURN NULL;
    END IF;
    
    SET field_value = SUBSTRING_INDEX(
        SUBSTRING_INDEX(CONCAT(segment_name, '|', segment_text), '|', field_num + 1),
        '|', -1
    );
    
    IF field_value IS NULL OR field_value = '' THEN
        RETURN NULL;
    END IF;
    
    IF repeat_mode = 'FIRST' OR repeat_mode IS NULL THEN
        SET result = SUBSTRING_INDEX(field_value, '~', 1);
        IF LOCATE('^', result) > 0 THEN
            SET result = SUBSTRING_INDEX(result, '^', 1);
        END IF;
        RETURN result;
    ELSEIF repeat_mode = 'CONCAT' THEN
        SET result = '';
        SET repeat_count = LENGTH(field_value) - LENGTH(REPLACE(field_value, '~', '')) + 1;
        SET i = 1;
        WHILE i <= repeat_count DO
            SET repeat_item = SUBSTRING_INDEX(SUBSTRING_INDEX(field_value, '~', i), '~', -1);
            IF LOCATE('^', repeat_item) > 0 THEN
                SET repeat_item = SUBSTRING_INDEX(repeat_item, '^', 1);
            END IF;
            IF result <> '' THEN SET result = CONCAT(result, '; '); END IF;
            SET result = CONCAT(result, repeat_item);
            SET i = i + 1;
        END WHILE;
        RETURN result;
    ELSEIF repeat_mode = 'FILTER' AND type_filter IS NOT NULL THEN
        SET repeat_count = LENGTH(field_value) - LENGTH(REPLACE(field_value, '~', '')) + 1;
        SET i = 1;
        WHILE i <= repeat_count DO
            SET repeat_item = SUBSTRING_INDEX(SUBSTRING_INDEX(field_value, '~', i), '~', -1);
            SET type_value = SUBSTRING_INDEX(SUBSTRING_INDEX(repeat_item, '^', type_component), '^', -1);
            IF type_value = type_filter THEN
                SET result = SUBSTRING_INDEX(repeat_item, '^', 1);
                RETURN result;
            END IF;
            SET i = i + 1;
        END WHILE;
        RETURN NULL;
    END IF;
    
    RETURN NULL;
END //

-- Create stored procedure
CREATE PROCEDURE IF NOT EXISTS \`${procedureName}\`(
    IN p_RawMessageID INT
)
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE v_MsgID INT;
    DECLARE v_RawMessage TEXT;
    
    DECLARE msg_cursor CURSOR FOR
        SELECT ID, RawHL7Message 
        FROM \`${sourceTableName}\`
        WHERE (p_RawMessageID IS NULL OR ID = p_RawMessageID)
          AND ProcessedFlag = 0;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
    
    OPEN msg_cursor;
    
    read_loop: LOOP
        FETCH msg_cursor INTO v_MsgID, v_RawMessage;
        IF done THEN
            LEAVE read_loop;
        END IF;
        
        INSERT INTO \`${tableName}\` (
            \`RawMessageID\`,
${allFields.map(f => `            \`${getColumnName(f)}\``).join(',\n')}
        )
        VALUES (
            v_MsgID,
${allFields.map(f => {
  const config = getFieldConfig(f.id);
  if (config.repeatHandling === 'first' || !f.repeating) {
    return `            fn_GetHL7Field(v_RawMessage, '${f.position}', 'FIRST', NULL, 0)`;
  } else if (config.repeatHandling === 'concatenate') {
    return `            fn_GetHL7Field(v_RawMessage, '${f.position}', 'CONCAT', NULL, 0)`;
  } else if (config.repeatHandling === 'filter' && config.identifierFilter) {
    return `            fn_GetHL7Field(v_RawMessage, '${f.position}', 'FILTER', '${config.identifierFilter}', ${f.identifierComponent || 0})`;
  }
  return `            fn_GetHL7Field(v_RawMessage, '${f.position}', 'FIRST', NULL, 0)`;
}).join(',\n')}
        );
        
        UPDATE \`${sourceTableName}\`
        SET ProcessedFlag = 1, ProcessedDateTime = NOW()
        WHERE ID = v_MsgID;
    END LOOP;
    
    CLOSE msg_cursor;
END //

DELIMITER ;

-- Execute: CALL \`${procedureName}\`(NULL);
`;
    }

    return sql;
  }, [selectedFields, fieldConfigs, tableName, sourceTableName, procedureName, dbPlatform, getSelectedFieldsGroupedBySegment]);

  const copySQL = () => {
    navigator.clipboard.writeText(generateSQL);
    toast({ title: 'Copied!', description: 'SQL copied to clipboard' });
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-neutral-50" data-testid="hl7-sql-builder-page">
      {/* Header */}
      <div className="bg-white border-b px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Database className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-900">HL7 SQL Builder</h1>
              <p className="text-xs text-gray-500">Generate stored procedures to parse HL7 messages</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label className="text-xs text-gray-500">Platform:</Label>
            <Select value={dbPlatform} onValueChange={(v) => setDbPlatform(v as 'sqlserver' | 'mysql' | 'postgresql')}>
              <SelectTrigger className="w-[140px] h-8" data-testid="select-db-platform">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sqlserver">SQL Server</SelectItem>
                <SelectItem value="postgresql">PostgreSQL</SelectItem>
                <SelectItem value="mysql">MySQL</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" onClick={selectCommonFields} data-testid="button-select-common">
            <Play className="h-4 w-4 mr-2" />
            Common Fields
          </Button>
          <Button variant="outline" size="sm" onClick={clearAll} data-testid="button-clear-all">
            <RefreshCw className="h-4 w-4 mr-2" />
            Clear
          </Button>
          <Button variant="default" size="sm" onClick={copySQL} data-testid="button-copy-sql">
            <Copy className="h-4 w-4 mr-2" />
            Copy SQL
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <ResizablePanelGroup direction="horizontal" className="flex-grow">
        {/* Left Panel - Segment Selector */}
        <ResizablePanel defaultSize={40} minSize={30}>
          <div className="h-full flex flex-col bg-white">
            <div className="px-4 py-3 bg-gray-50 border-b">
              <div className="flex items-center gap-2 mb-2">
                <Table className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">HL7 Message Segments</span>
                <span className="text-xs text-gray-500 ml-auto">{selectedFields.size} fields selected</span>
              </div>
              <p className="text-xs text-gray-500">Select fields to extract. Fields with <Filter className="h-3 w-3 inline" /> support type filtering.</p>
            </div>
            
            <ScrollArea className="flex-grow">
              <Accordion type="multiple" defaultValue={["PID", "PV1"]} className="p-2">
                {HL7_SEGMENTS.map((segment) => {
                  const selectedCount = segment.fields.filter(f => selectedFields.has(f.id)).length;
                  const allSelected = selectedCount === segment.fields.length && segment.fields.length > 0;
                  
                  return (
                    <AccordionItem key={segment.id} value={segment.id} className="border rounded-lg mb-2 overflow-hidden">
                      <div className="flex items-center px-3 py-2 bg-white hover:bg-gray-50">
                        <div className="mr-2" onClick={(e) => e.stopPropagation()}>
                          <Checkbox 
                            checked={allSelected}
                            onCheckedChange={() => toggleSegment(segment)}
                            data-testid={`checkbox-segment-${segment.id}`}
                          />
                        </div>
                        <AccordionTrigger className="flex-1 hover:no-underline p-0 [&>svg]:ml-auto" data-testid={`accordion-trigger-${segment.id}`}>
                          <div className="flex items-center gap-2 flex-1">
                            <span className="font-mono text-sm font-medium text-primary">{segment.id}</span>
                            <span className="text-xs text-gray-600 truncate">{segment.description}</span>
                            {segment.repeating && (
                              <Badge variant="outline" className="text-[10px] px-1 py-0">repeating</Badge>
                            )}
                            {selectedCount > 0 && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                {selectedCount}
                              </span>
                            )}
                          </div>
                        </AccordionTrigger>
                      </div>
                      <AccordionContent className="px-3 pb-3">
                        <div className="space-y-1 pt-2">
                          {segment.fields.map((field) => {
                            const isSelected = selectedFields.has(field.id);
                            const config = getFieldConfig(field.id);
                            
                            return (
                              <div key={field.id} className="rounded hover:bg-gray-50">
                                <label className="flex items-start gap-2 p-2 cursor-pointer">
                                  <Checkbox 
                                    checked={isSelected}
                                    onCheckedChange={() => toggleField(field.id)}
                                    className="mt-0.5"
                                    data-testid={`checkbox-field-${field.id}`}
                                  />
                                  <div className="flex-grow min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-xs text-gray-700">{field.position}</span>
                                      <span className="text-sm">{field.name}</span>
                                      {field.repeating && (
                                        <span title="Supports filtering"><Filter className="h-3 w-3 text-amber-500" /></span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-xs text-gray-400">{field.dataType}{field.maxLength > 0 ? `(${field.maxLength})` : ''}</span>
                                      <span className="text-xs text-gray-400">•</span>
                                      <span className="text-xs text-gray-400 truncate">{field.description}</span>
                                    </div>
                                  </div>
                                </label>
                                
                                {isSelected && field.repeating && field.identifierOptions && (
                                  <div className="ml-8 mr-2 mb-2 p-2 bg-amber-50 rounded border border-amber-100">
                                    <div className="flex items-center gap-2 mb-2">
                                      <Settings2 className="h-3 w-3 text-amber-600" />
                                      <span className="text-xs font-medium text-amber-800">Repeat Handling</span>
                                    </div>
                                    <div className="flex gap-2 mb-2">
                                      <Select 
                                        value={config.repeatHandling} 
                                        onValueChange={(v) => updateFieldConfig(field.id, { repeatHandling: v as 'first' | 'concatenate' | 'filter' })}
                                      >
                                        <SelectTrigger className="h-7 text-xs" data-testid={`select-repeat-${field.id}`}>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="first">First Only</SelectItem>
                                          <SelectItem value="concatenate">Concatenate All</SelectItem>
                                          <SelectItem value="filter">Filter by Type</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    
                                    {config.repeatHandling === 'filter' && (
                                      <div>
                                        <Label className="text-xs text-amber-700 mb-1 block">Select Type:</Label>
                                        <Select 
                                          value={config.identifierFilter || ''} 
                                          onValueChange={(v) => updateFieldConfig(field.id, { identifierFilter: v })}
                                        >
                                          <SelectTrigger className="h-7 text-xs" data-testid={`select-filter-${field.id}`}>
                                            <SelectValue placeholder="Choose identifier type..." />
                                          </SelectTrigger>
                                          <SelectContent>
                                            {field.identifierOptions.map(opt => (
                                              <SelectItem key={opt.code} value={opt.code}>
                                                {opt.code} - {opt.name}
                                              </SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </ScrollArea>
          </div>
        </ResizablePanel>

        <ResizableHandle data-testid="panel-resize-handle" />

        {/* Right Panel - SQL Output */}
        <ResizablePanel defaultSize={60}>
          <div className="h-full flex flex-col bg-slate-900">
            <div className="px-4 py-3 bg-slate-950 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-300">Generated SQL</span>
                </div>
              </div>
              <div className="flex gap-4 mt-3">
                <div className="flex-1">
                  <Label className="text-xs text-slate-400">Source Table (RAW HL7)</Label>
                  <Input 
                    value={sourceTableName}
                    onChange={(e) => setSourceTableName(e.target.value)}
                    className="mt-1 h-8 bg-slate-800 border-slate-700 text-slate-200 text-sm"
                    data-testid="input-source-table"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-slate-400">Destination Table</Label>
                  <Input 
                    value={tableName}
                    onChange={(e) => setTableName(e.target.value)}
                    className="mt-1 h-8 bg-slate-800 border-slate-700 text-slate-200 text-sm"
                    data-testid="input-dest-table"
                  />
                </div>
                <div className="flex-1">
                  <Label className="text-xs text-slate-400">Procedure Name</Label>
                  <Input 
                    value={procedureName}
                    onChange={(e) => setProcedureName(e.target.value)}
                    className="mt-1 h-8 bg-slate-800 border-slate-700 text-slate-200 text-sm"
                    data-testid="input-procedure-name"
                  />
                </div>
              </div>
            </div>
            
            <ScrollArea className="flex-grow" data-testid="sql-output-area">
              <pre className="p-4 text-sm font-mono text-slate-300 leading-relaxed whitespace-pre-wrap" data-testid="sql-code-preview">
                {generateSQL}
              </pre>
            </ScrollArea>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
