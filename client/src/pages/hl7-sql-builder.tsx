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
import { useToast } from '@/hooks/use-toast';
import { Copy, Database, FileCode, Table, Play, RefreshCw } from 'lucide-react';

interface HL7Field {
  id: string;
  position: string;
  name: string;
  dataType: string;
  maxLength: number;
  description: string;
}

interface HL7Segment {
  id: string;
  name: string;
  description: string;
  fields: HL7Field[];
}

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
      { id: "PID-3", position: "PID-3", name: "Patient ID (MRN)", dataType: "VARCHAR", maxLength: 50, description: "Medical Record Number" },
      { id: "PID-4", position: "PID-4", name: "Alternate Patient ID", dataType: "VARCHAR", maxLength: 50, description: "Alternate patient identifier" },
      { id: "PID-5", position: "PID-5", name: "Patient Name", dataType: "VARCHAR", maxLength: 100, description: "Full patient name" },
      { id: "PID-6", position: "PID-6", name: "Mother's Maiden Name", dataType: "VARCHAR", maxLength: 50, description: "Mother's maiden name" },
      { id: "PID-7", position: "PID-7", name: "Date of Birth", dataType: "DATE", maxLength: 0, description: "Patient date of birth" },
      { id: "PID-8", position: "PID-8", name: "Sex", dataType: "CHAR", maxLength: 1, description: "Administrative sex (M/F/U)" },
      { id: "PID-9", position: "PID-9", name: "Patient Alias", dataType: "VARCHAR", maxLength: 100, description: "Patient alias/nickname" },
      { id: "PID-10", position: "PID-10", name: "Race", dataType: "VARCHAR", maxLength: 20, description: "Patient race" },
      { id: "PID-11", position: "PID-11", name: "Patient Address", dataType: "VARCHAR", maxLength: 200, description: "Patient home address" },
      { id: "PID-12", position: "PID-12", name: "County Code", dataType: "VARCHAR", maxLength: 20, description: "County of residence" },
      { id: "PID-13", position: "PID-13", name: "Home Phone", dataType: "VARCHAR", maxLength: 30, description: "Home phone number" },
      { id: "PID-14", position: "PID-14", name: "Business Phone", dataType: "VARCHAR", maxLength: 30, description: "Business phone number" },
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
  const [tableName, setTableName] = useState('PatientData');
  const [sourceTableName, setSourceTableName] = useState('HL7_RAW_Messages');
  const [procedureName, setProcedureName] = useState('usp_ParseHL7Message');
  const [dbPlatform, setDbPlatform] = useState<'sqlserver' | 'mysql' | 'postgresql'>('sqlserver');

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

  const generateSQL = useMemo(() => {
    if (selectedFields.size === 0) {
      return '-- Select fields from the left panel to generate SQL\n-- This stored procedure will parse HL7 messages from your raw message table';
    }

    const grouped = getSelectedFieldsGroupedBySegment;
    const allFields: HL7Field[] = [];
    Object.values(grouped).forEach(fields => allFields.push(...fields));

    let sql = '';

    if (dbPlatform === 'sqlserver') {
      // SQL Server syntax
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
  if (f.dataType === 'INT') return `        [${f.name.replace(/[^a-zA-Z0-9]/g, '_')}] INT NULL`;
  if (f.dataType === 'DATETIME') return `        [${f.name.replace(/[^a-zA-Z0-9]/g, '_')}] DATETIME NULL`;
  if (f.dataType === 'DATE') return `        [${f.name.replace(/[^a-zA-Z0-9]/g, '_')}] DATE NULL`;
  if (f.dataType === 'CHAR') return `        [${f.name.replace(/[^a-zA-Z0-9]/g, '_')}] CHAR(${f.maxLength}) NULL`;
  return `        [${f.name.replace(/[^a-zA-Z0-9]/g, '_')}] VARCHAR(${f.maxLength}) NULL`;
}).join(',\n')}
    );
END
GO

-- Create or alter stored procedure
CREATE OR ALTER PROCEDURE [dbo].[${procedureName}]
    @RawMessageID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @RawMessage NVARCHAR(MAX);
    DECLARE @CurrentSegment NVARCHAR(MAX);
    DECLARE @SegmentName VARCHAR(3);
    
    -- Cursor to process unprocessed messages
    DECLARE msg_cursor CURSOR FOR
        SELECT ID, RawHL7Message 
        FROM [dbo].[${sourceTableName}]
        WHERE (@RawMessageID IS NULL OR ID = @RawMessageID)
          AND ProcessedFlag = 0;
    
    DECLARE @MsgID INT;
    
    OPEN msg_cursor;
    FETCH NEXT FROM msg_cursor INTO @MsgID, @RawMessage;
    
    WHILE @@FETCH_STATUS = 0
    BEGIN
        BEGIN TRY
            -- Parse and insert data
            INSERT INTO [dbo].[${tableName}] (
                [RawMessageID],
${allFields.map(f => `                [${f.name.replace(/[^a-zA-Z0-9]/g, '_')}]`).join(',\n')}
            )
            SELECT 
                @MsgID,
${allFields.map(f => `                dbo.fn_GetHL7Field(@RawMessage, '${f.position}') AS [${f.name.replace(/[^a-zA-Z0-9]/g, '_')}]`).join(',\n')}
            
            -- Mark as processed
            UPDATE [dbo].[${sourceTableName}]
            SET ProcessedFlag = 1,
                ProcessedDateTime = GETDATE()
            WHERE ID = @MsgID;
            
        END TRY
        BEGIN CATCH
            -- Log error
            PRINT 'Error processing message ID: ' + CAST(@MsgID AS VARCHAR(10));
            PRINT ERROR_MESSAGE();
        END CATCH
        
        FETCH NEXT FROM msg_cursor INTO @MsgID, @RawMessage;
    END
    
    CLOSE msg_cursor;
    DEALLOCATE msg_cursor;
END
GO

-- ============================================
-- Helper Function: Extract HL7 Field Value
-- ============================================
CREATE OR ALTER FUNCTION [dbo].[fn_GetHL7Field]
(
    @HL7Message NVARCHAR(MAX),
    @FieldPath VARCHAR(20)  -- e.g., 'PID-3', 'PV1-7'
)
RETURNS NVARCHAR(500)
AS
BEGIN
    DECLARE @Result NVARCHAR(500) = NULL;
    DECLARE @SegmentName VARCHAR(3);
    DECLARE @FieldNum INT;
    DECLARE @Segment NVARCHAR(MAX);
    DECLARE @FieldDelim CHAR(1) = '|';
    DECLARE @SegmentDelim CHAR(1) = CHAR(13);
    
    -- Parse field path
    SET @SegmentName = LEFT(@FieldPath, 3);
    SET @FieldNum = CAST(SUBSTRING(@FieldPath, 5, LEN(@FieldPath)) AS INT);
    
    -- Find the segment
    DECLARE @StartPos INT = CHARINDEX(@SegmentName + '|', @HL7Message);
    IF @StartPos > 0
    BEGIN
        DECLARE @EndPos INT = CHARINDEX(@SegmentDelim, @HL7Message, @StartPos);
        IF @EndPos = 0 SET @EndPos = LEN(@HL7Message) + 1;
        
        SET @Segment = SUBSTRING(@HL7Message, @StartPos, @EndPos - @StartPos);
        
        -- Extract field value
        DECLARE @FieldStart INT = 1;
        DECLARE @FieldEnd INT;
        DECLARE @CurrentField INT = 0;
        
        WHILE @CurrentField < @FieldNum AND @FieldStart <= LEN(@Segment)
        BEGIN
            SET @FieldEnd = CHARINDEX(@FieldDelim, @Segment, @FieldStart);
            IF @FieldEnd = 0 SET @FieldEnd = LEN(@Segment) + 1;
            
            IF @CurrentField = @FieldNum - 1
            BEGIN
                SET @Result = SUBSTRING(@Segment, @FieldStart, @FieldEnd - @FieldStart);
                -- Handle component delimiter (^) - get first component
                IF CHARINDEX('^', @Result) > 0
                    SET @Result = LEFT(@Result, CHARINDEX('^', @Result) - 1);
                BREAK;
            END
            
            SET @FieldStart = @FieldEnd + 1;
            SET @CurrentField = @CurrentField + 1;
        END
    END
    
    RETURN @Result;
END
GO

-- ============================================
-- Example: Schedule the procedure to run
-- ============================================
-- EXEC [dbo].[${procedureName}];
-- Or for a specific message:
-- EXEC [dbo].[${procedureName}] @RawMessageID = 123;
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
  const colName = f.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
  if (f.dataType === 'INT') return `    ${colName} INT`;
  if (f.dataType === 'DATETIME') return `    ${colName} TIMESTAMP`;
  if (f.dataType === 'DATE') return `    ${colName} DATE`;
  if (f.dataType === 'CHAR') return `    ${colName} CHAR(${f.maxLength})`;
  return `    ${colName} VARCHAR(${f.maxLength})`;
}).join(',\n')}
);

-- Create helper function to extract HL7 field
CREATE OR REPLACE FUNCTION get_hl7_field(
    hl7_message TEXT,
    field_path VARCHAR(20)
)
RETURNS TEXT AS $$
DECLARE
    segment_name VARCHAR(3);
    field_num INT;
    segment_text TEXT;
    fields TEXT[];
    result TEXT;
BEGIN
    segment_name := LEFT(field_path, 3);
    field_num := CAST(SUBSTRING(field_path FROM 5) AS INT);
    
    -- Find segment
    SELECT s INTO segment_text
    FROM unnest(string_to_array(hl7_message, E'\\r')) s
    WHERE s LIKE segment_name || '|%'
    LIMIT 1;
    
    IF segment_text IS NULL THEN
        RETURN NULL;
    END IF;
    
    -- Split by pipe and get field
    fields := string_to_array(segment_text, '|');
    IF array_length(fields, 1) >= field_num THEN
        result := fields[field_num + 1];
        -- Get first component if contains ^
        IF position('^' in result) > 0 THEN
            result := split_part(result, '^', 1);
        END IF;
        RETURN result;
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
${allFields.map(f => `                ${f.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`).join(',\n')}
            )
            VALUES (
                rec.id,
${allFields.map(f => `                get_hl7_field(rec.raw_hl7_message, '${f.position}')`).join(',\n')}
            );
            
            UPDATE ${sourceTableName}
            SET processed_flag = TRUE,
                processed_datetime = CURRENT_TIMESTAMP
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
      // MySQL syntax
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
  if (f.dataType === 'INT') return `    \`${f.name.replace(/[^a-zA-Z0-9]/g, '_')}\` INT`;
  if (f.dataType === 'DATETIME') return `    \`${f.name.replace(/[^a-zA-Z0-9]/g, '_')}\` DATETIME`;
  if (f.dataType === 'DATE') return `    \`${f.name.replace(/[^a-zA-Z0-9]/g, '_')}\` DATE`;
  if (f.dataType === 'CHAR') return `    \`${f.name.replace(/[^a-zA-Z0-9]/g, '_')}\` CHAR(${f.maxLength})`;
  return `    \`${f.name.replace(/[^a-zA-Z0-9]/g, '_')}\` VARCHAR(${f.maxLength})`;
}).join(',\n')}
);

DELIMITER //

-- Helper function to extract HL7 field
CREATE FUNCTION IF NOT EXISTS fn_GetHL7Field(
    hl7_message TEXT,
    field_path VARCHAR(20)
)
RETURNS VARCHAR(500)
DETERMINISTIC
BEGIN
    DECLARE segment_name VARCHAR(3);
    DECLARE field_num INT;
    DECLARE segment_text TEXT;
    DECLARE result VARCHAR(500);
    
    SET segment_name = LEFT(field_path, 3);
    SET field_num = CAST(SUBSTRING(field_path, 5) AS UNSIGNED);
    
    -- Find and extract segment
    SET segment_text = SUBSTRING_INDEX(
        SUBSTRING_INDEX(hl7_message, CONCAT('\\r', segment_name, '|'), -1),
        '\\r', 1
    );
    
    IF segment_text IS NOT NULL THEN
        SET result = SUBSTRING_INDEX(
            SUBSTRING_INDEX(CONCAT(segment_name, '|', segment_text), '|', field_num + 1),
            '|', -1
        );
        
        -- Get first component
        IF LOCATE('^', result) > 0 THEN
            SET result = SUBSTRING_INDEX(result, '^', 1);
        END IF;
    END IF;
    
    RETURN result;
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
${allFields.map(f => `            \`${f.name.replace(/[^a-zA-Z0-9]/g, '_')}\``).join(',\n')}
        )
        VALUES (
            v_MsgID,
${allFields.map(f => `            fn_GetHL7Field(v_RawMessage, '${f.position}')`).join(',\n')}
        );
        
        UPDATE \`${sourceTableName}\`
        SET ProcessedFlag = 1,
            ProcessedDateTime = NOW()
        WHERE ID = v_MsgID;
    END LOOP;
    
    CLOSE msg_cursor;
END //

DELIMITER ;

-- Execute: CALL \`${procedureName}\`(NULL);
`;
    }

    return sql;
  }, [selectedFields, tableName, sourceTableName, procedureName, dbPlatform, getSelectedFieldsGroupedBySegment]);

  const copySQL = () => {
    navigator.clipboard.writeText(generateSQL);
    toast({ title: 'Copied!', description: 'SQL copied to clipboard' });
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-neutral-50">
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
        <ResizablePanel defaultSize={35} minSize={25}>
          <div className="h-full flex flex-col bg-white">
            <div className="px-4 py-3 bg-gray-50 border-b">
              <div className="flex items-center gap-2 mb-2">
                <Table className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">HL7 Message Segments</span>
                <span className="text-xs text-gray-500 ml-auto">{selectedFields.size} fields selected</span>
              </div>
              <p className="text-xs text-gray-500">Select the segments and fields you want to extract</p>
            </div>
            
            <ScrollArea className="flex-grow">
              <Accordion type="multiple" defaultValue={["PID", "PV1"]} className="p-2">
                {HL7_SEGMENTS.map((segment) => {
                  const selectedCount = segment.fields.filter(f => selectedFields.has(f.id)).length;
                  const allSelected = selectedCount === segment.fields.length;
                  
                  return (
                    <AccordionItem key={segment.id} value={segment.id} className="border rounded-lg mb-2 overflow-hidden">
                      <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-gray-50">
                        <div className="flex items-center gap-2 w-full">
                          <Checkbox 
                            checked={allSelected}
                            onCheckedChange={() => toggleSegment(segment)}
                            onClick={(e) => e.stopPropagation()}
                            data-testid={`checkbox-segment-${segment.id}`}
                          />
                          <span className="font-mono text-sm font-medium text-primary">{segment.id}</span>
                          <span className="text-xs text-gray-600 truncate">{segment.description}</span>
                          {selectedCount > 0 && (
                            <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                              {selectedCount}
                            </span>
                          )}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-3 pb-3">
                        <div className="space-y-1 pt-2">
                          {segment.fields.map((field) => (
                            <label 
                              key={field.id} 
                              className="flex items-start gap-2 p-2 rounded hover:bg-gray-50 cursor-pointer"
                            >
                              <Checkbox 
                                checked={selectedFields.has(field.id)}
                                onCheckedChange={() => toggleField(field.id)}
                                className="mt-0.5"
                                data-testid={`checkbox-field-${field.id}`}
                              />
                              <div className="flex-grow min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-xs text-gray-700">{field.position}</span>
                                  <span className="text-sm">{field.name}</span>
                                </div>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-gray-400">{field.dataType}{field.maxLength > 0 ? `(${field.maxLength})` : ''}</span>
                                  <span className="text-xs text-gray-400">•</span>
                                  <span className="text-xs text-gray-400 truncate">{field.description}</span>
                                </div>
                              </div>
                            </label>
                          ))}
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
        <ResizablePanel defaultSize={65}>
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
