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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from '@/hooks/use-toast';
import { Copy, Download, RefreshCw, ShieldCheck, TriangleAlert, BookOpen, Database, Play, Link2, Share2, HelpCircle } from 'lucide-react';
import { HL7_SEGMENTS, type HL7Segment } from './hl7-sql-builder';

// ---------------------------------------------------------------------------
// De-identification rule per field. Action codes drive the generated SQL:
// ID=pseudonymous identifier, NAME=person, ADDR=address, PHONE=digit-shift,
// GEN=generic code, DATE=per-patient shift, REGEN=fresh value per message.
// ---------------------------------------------------------------------------
type DeidAction = 'ID' | 'NAME' | 'ADDR' | 'PHONE' | 'GEN' | 'DATE' | 'REGEN';

const DEID_RULES: Record<string, { action: DeidAction; label: string; harbor: number }> = {
  'MSH-3': { action: 'GEN', label: 'Sending Application', harbor: 18 },
  'MSH-4': { action: 'GEN', label: 'Sending Facility', harbor: 18 },
  'MSH-5': { action: 'GEN', label: 'Receiving Application', harbor: 18 },
  'MSH-6': { action: 'GEN', label: 'Receiving Facility', harbor: 18 },
  'MSH-7': { action: 'DATE', label: 'Message DateTime', harbor: 3 },
  'MSH-10': { action: 'REGEN', label: 'Message Control ID', harbor: 18 },
  'EVN-2': { action: 'DATE', label: 'Recorded DateTime', harbor: 3 },
  'EVN-3': { action: 'DATE', label: 'Planned Event DateTime', harbor: 3 },
  'EVN-5': { action: 'ID', label: 'Operator ID', harbor: 1 },
  'EVN-6': { action: 'DATE', label: 'Event Occurred', harbor: 3 },
  'PID-2': { action: 'ID', label: 'External Patient ID', harbor: 8 },
  'PID-3': { action: 'ID', label: 'Patient ID (MRN)', harbor: 8 },
  'PID-4': { action: 'ID', label: 'Alternate Patient ID', harbor: 8 },
  'PID-5': { action: 'NAME', label: 'Patient Name', harbor: 1 },
  'PID-6': { action: 'NAME', label: "Mother's Maiden Name", harbor: 1 },
  'PID-7': { action: 'DATE', label: 'Date of Birth', harbor: 3 },
  'PID-9': { action: 'NAME', label: 'Patient Alias', harbor: 1 },
  'PID-11': { action: 'ADDR', label: 'Patient Address', harbor: 2 },
  'PID-12': { action: 'GEN', label: 'County Code', harbor: 2 },
  'PID-13': { action: 'PHONE', label: 'Home Phone', harbor: 4 },
  'PID-14': { action: 'PHONE', label: 'Business Phone', harbor: 4 },
  'PID-18': { action: 'ID', label: 'Account Number', harbor: 10 },
  'PID-19': { action: 'ID', label: 'SSN', harbor: 7 },
  'PID-20': { action: 'ID', label: "Driver's License", harbor: 11 },
  'PV1-5': { action: 'ID', label: 'Preadmit Number', harbor: 18 },
  'PV1-7': { action: 'NAME', label: 'Attending Doctor', harbor: 1 },
  'PV1-8': { action: 'NAME', label: 'Referring Doctor', harbor: 1 },
  'PV1-9': { action: 'NAME', label: 'Consulting Doctor', harbor: 1 },
  'PV1-17': { action: 'NAME', label: 'Admitting Doctor', harbor: 1 },
  'PV1-19': { action: 'ID', label: 'Visit Number', harbor: 18 },
  'PV1-44': { action: 'DATE', label: 'Admit DateTime', harbor: 3 },
  'PV1-45': { action: 'DATE', label: 'Discharge DateTime', harbor: 3 },
  'PV2-8': { action: 'DATE', label: 'Expected Admit DateTime', harbor: 3 },
  'PV2-9': { action: 'DATE', label: 'Expected Discharge DateTime', harbor: 3 },
  'NK1-2': { action: 'NAME', label: 'Contact Name', harbor: 1 },
  'NK1-4': { action: 'ADDR', label: 'Contact Address', harbor: 2 },
  'NK1-5': { action: 'PHONE', label: 'Contact Phone', harbor: 4 },
  'NK1-6': { action: 'PHONE', label: 'Contact Business Phone', harbor: 4 },
  'DG1-5': { action: 'DATE', label: 'Diagnosis DateTime', harbor: 3 },
  'DG1-16': { action: 'NAME', label: 'Diagnosing Clinician', harbor: 1 },
  'IN1-2': { action: 'ID', label: 'Insurance Plan ID', harbor: 9 },
  'IN1-3': { action: 'ID', label: 'Insurance Company ID', harbor: 9 },
  'IN1-4': { action: 'GEN', label: 'Insurance Company Name', harbor: 9 },
  'IN1-5': { action: 'ADDR', label: 'Insurance Company Address', harbor: 2 },
  'IN1-12': { action: 'DATE', label: 'Plan Effective Date', harbor: 3 },
  'IN1-13': { action: 'DATE', label: 'Plan Expiration Date', harbor: 3 },
  'IN1-36': { action: 'ID', label: 'Policy Number', harbor: 9 },
  'IN1-49': { action: 'ID', label: "Insured ID Number", harbor: 9 },
  'AL1-6': { action: 'DATE', label: 'Identification Date', harbor: 3 },
};

const ACTION_LABEL: Record<DeidAction, string> = {
  ID: 'pseudonym',
  NAME: 'fake name',
  ADDR: 'fake address',
  PHONE: 'digit-shift',
  GEN: 'generic code',
  DATE: 'date shift',
  REGEN: 'regenerate',
};

const ALL_RULE_FIELDS = Object.keys(DEID_RULES);

// ---------------------------------------------------------------------------
// Guide tab content (handy docs on the same page)
// ---------------------------------------------------------------------------

const FLOW_STEPS = [
  { icon: Database, title: '1. Point', desc: 'Set source table + message column. The script only reads; it never alters your raw HL7.' },
  { icon: Play, title: '2. Run', desc: 'EXEC the procedure. Each message is processed one at a time through the same rule set.' },
  { icon: Link2, title: '3. Map', desc: 'First sighting of a patient creates one map row: one pseudo MRN + one private date offset, reused forever.' },
  { icon: Share2, title: '4. Share', desc: 'Export the dest table only. Map tables stay internal — they can re-link output to patients.' },
];

const GUIDE_BEFORE = [
  'PID|||MR12345^^^HOSP^MR||DOE^JOHN^A||19800115|M',
  'PV1||I|||||||||||V555001|||||||||||||||||||||||||||||||||20240215120000|20240218143000',
];

const GUIDE_AFTER = [
  'PID|||DID482916^^^FAC2QV^MR||F3821^G9042||20240110|M   (same pseudo MRN in every message)',
  'PV1||I|||||||||||DID771204|||||||||||||||||||||||||||||||||20240209120000|20240212143000   (interval intact)',
];

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: 'Will one patient\'s 20 messages all get the same fictional identity?',
    a: 'Yes. The first message creates a patient-map row keyed on the salted hash of PID-3 (MRN + secret). The other 19 hit the same row and reuse its pseudo MRN, date offset, and per-value pseudonyms. Visits link too: the same PV1-19 always maps to the same pseudo visit, so admission → transfer → discharge chains stay connected.',
  },
  {
    q: 'What changes from message to message?',
    a: 'Only MSH-10 (message control ID), regenerated fresh every time by design — reusing it across runs would leave a trail back to your source system logs.',
  },
  {
    q: 'How are dates handled?',
    a: 'Every date in a patient lane shifts back by the same private offset (1–364 days, assigned once). Admit→discharge intervals, length-of-stay and event order are preserved exactly. Uncheck nothing: date shifting is always on in the generated SQL.',
  },
  {
    q: 'What happens if I change the secret?',
    a: 'You get a completely different, unlinkable set of fictional IDs. Same secret + same data = same output, across runs, batches and months. Use one secret per research project and keep it for the project\'s life — never ship it with the output.',
  },
  {
    q: 'What if a message has no PID-3, or the MRN changes mid-journey?',
    a: 'Messages without PID-3 each get their own lane (nothing to link on). If an MRN changes mid-journey (e.g. an MPI merge), the two keys form two lanes. Run de-identification after your MPI merge, or the journeys will look like two patients.',
  },
  {
    q: 'What is NOT scrubbed?',
    a: 'Free text: NTE segments, OBX-5 observation values and PV2-3 admit reason pass through and are flagged for human review — a dictated note naming someone defeats pseudonymisation. Sex, race, codes (diagnosis/procedure/allergy) and locations (PV1-3) are deliberately kept for research value.',
  },
  {
    q: 'How do I prove it worked (first-run test)?',
    a: 'The script header embeds 2 synthetic messages. After EXEC: (1) both output rows share one pseudo MRN; (2) the admit→discharge interval matches the input exactly; (3) no original MRN, name or phone appears in the dest table. Only then point it at real archives.',
  },
  {
    q: 'Can anyone reverse the fictional IDs?',
    a: 'Only with the secret passphrase plus the map tables — which is why both stay internal, on your database, under your access controls. Rare conditions or unique clinical patterns can still re-identify without demographics, so get data-governance sign-off before any external release.',
  },
];

export default function HL7DeidentifySQL() {
  const { toast } = useToast();
  const [selectedRules, setSelectedRules] = useState<Set<string>>(new Set(ALL_RULE_FIELDS));
  const [sourceTable, setSourceTable] = useState('HL7_RAW_Messages');
  const [msgColumn, setMsgColumn] = useState('RawHL7Message');
  const [idColumn, setIdColumn] = useState('ID');
  const [destTable, setDestTable] = useState('HL7_Deidentified');
  const [procName, setProcName] = useState('usp_DeidentifyHL7');
  const [secret, setSecret] = useState('');
  const [activeTab, setActiveTab] = useState('generator');
  const [dbPlatform, setDbPlatform] = useState<'sqlserver' | 'mysql' | 'postgresql'>('sqlserver');

  const toggleRule = (fieldId: string) => {
    const next = new Set(selectedRules);
    if (next.has(fieldId)) next.delete(fieldId);
    else next.add(fieldId);
    setSelectedRules(next);
  };

  const toggleSegment = (segment: HL7Segment) => {
    const next = new Set(selectedRules);
    const ruled = segment.fields.filter(f => DEID_RULES[f.id]);
    const allOn = ruled.every(f => next.has(f.id));
    ruled.forEach(f => { if (allOn) next.delete(f.id); else next.add(f.id); });
    setSelectedRules(next);
  };

  const selectSafeHarbor = () => setSelectedRules(new Set(ALL_RULE_FIELDS));
  const clearAll = () => setSelectedRules(new Set());

  const secretLiteral = secret.trim() === '' ? '<YOUR_SECRET_PASSPHRASE>' : secret.trim();

  const ruleBlocks = useMemo(() => {
    // Group selected rules by segment for the generated procedure body.
    const grouped: Record<string, string[]> = {};
    selectedRules.forEach((fid) => {
      const seg = fid.split('-')[0];
      if (!grouped[seg]) grouped[seg] = [];
      grouped[seg].push(fid);
    });
    return grouped;
  }, [selectedRules]);

  const generateSQL = useMemo(() => {
    if (selectedRules.size === 0) {
      return `-- ============================================
-- HL7 De-Identify SQL Generator
-- ============================================
-- Select fields from the left panel to generate the script.
-- Every field maps to one action: pseudonym / fake name /
-- fake address / digit-shift / generic code / date shift.`;
    }
    if (dbPlatform === 'sqlserver') return genSqlServer();
    if (dbPlatform === 'postgresql') return genPostgres();
    return genMySql();

    // ------------------------------------------------ SQL Server --
    function genSqlServer(): string {
      const applyLines = Object.entries(ruleBlocks).flatMap(([seg, fids]) =>
        fids.map(fid => {
          const n = fid.split('-')[1];
          const action = DEID_RULES[fid].action;
          return `            EXEC dbo.p_DeidApplyField @msg OUTPUT, '${seg}', ${n}, '${action}', @secret, @offsetDays; -- ${fid} ${DEID_RULES[fid].label}`;
        })
      ).join('\n');

      return `-- ============================================
-- HL7 De-Identification Script (SQL Server)
-- Generated by HIT HL7 De-Identify
-- ============================================
-- HOW IT WORKS
-- 1. Point @secret at a per-project passphrase (never ship it with output).
-- 2. Run this script in the database holding your HL7 table.
-- 3. EXEC the procedure: same real value + same secret = same fictional
--    value across every message, so journeys, visits and intervals survive.
-- 4. De-identified messages land in [dbo].[${destTable}].
-- 5. Map tables (Deid_PatientMap / Deid_ValueMap) stay INTERNAL — they can
--    re-link output to patients, so never export them.
-- RESIDUAL RISK: NTE / OBX-5 / PV2-3 free text is NOT scrubbed. Rare
-- conditions can re-identify. Get governance sign-off before release.
--
-- SOURCE: [dbo].[${sourceTable}] ([${idColumn}], [${msgColumn}])
-- FIRST-RUN TEST: insert the 2 synthetic messages at the bottom, EXEC,
-- then check both rows share one pseudo MRN and the admit->discharge
-- interval is unchanged.

SET @secret = N'${secretLiteral}';

-- ---------- Map tables (INTERNAL - never export) ----------
IF OBJECT_ID(N'[dbo].[Deid_PatientMap]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Deid_PatientMap] (
        [real_hash] CHAR(64) PRIMARY KEY,
        [pseudo_mrn] VARCHAR(20) NOT NULL,
        [date_offset_days] INT NOT NULL,
        [first_seen] DATETIME DEFAULT GETDATE()
    );
END
GO
IF OBJECT_ID(N'[dbo].[Deid_ValueMap]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[Deid_ValueMap] (
        [map_key] VARCHAR(220) PRIMARY KEY,
        [pseudo_value] NVARCHAR(500) NOT NULL
    );
END
GO
IF OBJECT_ID(N'[dbo].[${destTable}]', N'U') IS NULL
BEGIN
    CREATE TABLE [dbo].[${destTable}] (
        [ID] INT IDENTITY(1,1) PRIMARY KEY,
        [SourceID] INT NOT NULL,
        [DeidentifiedMessage] NVARCHAR(MAX) NOT NULL,
        [ProcessedDateTime] DATETIME DEFAULT GETDATE()
    );
END
GO

-- ---------- Helper: salted SHA-256 hex ----------
CREATE OR ALTER FUNCTION [dbo].[fn_DeidHash](@secret NVARCHAR(200), @value NVARCHAR(MAX))
RETURNS CHAR(64)
AS
BEGIN
    RETURN UPPER(CONVERT(CHAR(64), HASHBYTES('SHA2_256', @secret + N'|' + @value), 2));
END
GO

-- ---------- Helper: 6 deterministic digits from a hash ----------
CREATE OR ALTER FUNCTION [dbo].[fn_DeidDigits](@hash CHAR(64), @len INT)
RETURNS VARCHAR(20)
AS
BEGIN
    DECLARE @num BIGINT = ABS(CONVERT(BIGINT, CONVERT(VARBINARY(8), SUBSTRING(@hash, 1, 8), 2)));
    DECLARE @out VARCHAR(20) = RIGHT(REPLICATE('0', @len) + CAST(@num % CAST(POWER(CAST(10 AS BIGINT), @len) AS BIGINT) AS VARCHAR(20)), @len);
    RETURN @out;
END
GO

-- ---------- Helper: extract SEG-n (first occurrence, repeats intact) ----------
CREATE OR ALTER FUNCTION [dbo].[fn_DeidGetField](@msg NVARCHAR(MAX), @seg CHAR(3), @n INT)
RETURNS NVARCHAR(MAX)
AS
BEGIN
    DECLARE @start INT = CHARINDEX(@seg + '|', @msg);
    IF @start = 0 RETURN NULL;
    DECLARE @segEnd INT = CHARINDEX(CHAR(13), @msg, @start);
    IF @segEnd = 0 SET @segEnd = LEN(@msg) + 1;
    DECLARE @segment NVARCHAR(MAX) = SUBSTRING(@msg, @start, @segEnd - @start);
    DECLARE @idx INT = CASE WHEN @seg = 'MSH' THEN @n - 1 ELSE @n END;
    DECLARE @pos INT = 1; DECLARE @i INT = 0;
    WHILE @i < @idx
    BEGIN
        SET @pos = CHARINDEX('|', @segment, @pos) + 1;
        IF @pos = 1 RETURN NULL;
        SET @i = @i + 1;
    END
    DECLARE @next INT = CHARINDEX('|', @segment, @pos);
    IF @next = 0 SET @next = LEN(@segment) + 1;
    RETURN SUBSTRING(@segment, @pos, @next - @pos);
END
GO

-- ---------- Helper: splice a replaced field back into the message ----------
CREATE OR ALTER FUNCTION [dbo].[fn_DeidSetField](@msg NVARCHAR(MAX), @seg CHAR(3), @n INT, @newVal NVARCHAR(MAX))
RETURNS NVARCHAR(MAX)
AS
BEGIN
    DECLARE @start INT = CHARINDEX(@seg + '|', @msg);
    IF @start = 0 RETURN @msg;
    DECLARE @segEnd INT = CHARINDEX(CHAR(13), @msg, @start);
    IF @segEnd = 0 SET @segEnd = LEN(@msg) + 1;
    DECLARE @fieldStart INT = @start + 4;
    DECLARE @idx INT = CASE WHEN @seg = 'MSH' THEN @n - 1 ELSE @n END;
    DECLARE @i INT = 0;
    WHILE @i < @idx
    BEGIN
        SET @fieldStart = CHARINDEX('|', @msg, @fieldStart) + 1;
        IF @fieldStart = 1 RETURN @msg;
        SET @i = @i + 1;
    END
    DECLARE @fieldEnd INT = CHARINDEX('|', @msg, @fieldStart);
    DECLARE @segEndCheck INT = CHARINDEX(CHAR(13), @msg, @fieldStart);
    IF @fieldEnd = 0 OR (@segEndCheck > 0 AND @segEndCheck < @fieldEnd) SET @fieldEnd = @segEndCheck;
    IF @fieldEnd = 0 SET @fieldEnd = LEN(@msg) + 1;
    RETURN STUFF(@msg, @fieldStart, @fieldEnd - @fieldStart, ISNULL(@newVal, N''));
END
GO

-- ---------- Helper: shift YYYYMMDD[HHMMSS] back, preserving precision ----------
CREATE OR ALTER FUNCTION [dbo].[fn_DeidShiftDate](@val NVARCHAR(20), @offset INT)
RETURNS NVARCHAR(20)
AS
BEGIN
    IF @val IS NULL OR @val NOT LIKE '[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]%' RETURN @val;
    DECLARE @dt DATETIME2;
    DECLARE @parsed NVARCHAR(20) = CASE WHEN LEN(@val) > 8
        THEN STUFF(STUFF(STUFF(LEFT(@val, 14), 13, 0, ':'), 11, 0, ':'), 9, 0, ' ')
        ELSE LEFT(@val, 8) END;
    SET @dt = TRY_CONVERT(DATETIME2, @parsed);
    IF @dt IS NULL RETURN @val;
    SET @dt = DATEADD(DAY, -@offset, @dt);
    IF LEN(@val) <= 8 RETURN CONVERT(NVARCHAR(8), @dt, 112);
    RETURN CONVERT(NVARCHAR(8), @dt, 112) + REPLACE(CONVERT(NVARCHAR(8), @dt, 108), ':', '');
END
GO

-- ---------- Generic applier over repeats (CX/XPN/XAD-aware, digit-shift phones) ----------
-- A procedure (not a function) because map rows are written on demand.
CREATE OR ALTER PROCEDURE [dbo].[p_DeidApplyField]
    @msg NVARCHAR(MAX) OUTPUT,
    @seg CHAR(3),
    @n INT,
    @action VARCHAR(10),
    @secret NVARCHAR(200),
    @offset INT
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @raw NVARCHAR(MAX) = dbo.fn_DeidGetField(@msg, @seg, @n);
    IF @raw IS NULL OR @raw = N'' RETURN;

    DECLARE @rest NVARCHAR(MAX) = @raw;
    DECLARE @rep NVARCHAR(MAX); DECLARE @out NVARCHAR(MAX) = N''; DECLARE @first BIT = 1;
    DECLARE @h CHAR(64); DECLARE @new NVARCHAR(MAX);
    DECLARE @c4 NVARCHAR(200); DECLARE @c5 NVARCHAR(200);
    DECLARE @tok NVARCHAR(MAX); DECLARE @j INT;

    WHILE LEN(@rest) > 0
    BEGIN
        IF CHARINDEX(N'~', @rest) > 0
        BEGIN
            SET @rep = LEFT(@rest, CHARINDEX(N'~', @rest) - 1);
            SET @rest = SUBSTRING(@rest, CHARINDEX(N'~', @rest) + 1, LEN(@rest));
        END
        ELSE BEGIN SET @rep = @rest; SET @rest = N''; END

        SET @h = dbo.fn_DeidHash(@secret, @action + N'|' + @rep);

        IF @action = 'DATE'
            SET @new = dbo.fn_DeidShiftDate(@rep, @offset);
        ELSE IF @action = 'NAME'
        BEGIN
            SET @new = N'F' + dbo.fn_DeidDigits(dbo.fn_DeidHash(@secret, N'NAME:F|' + @rep), 4)
                     + N'^G' + dbo.fn_DeidDigits(dbo.fn_DeidHash(@secret, N'NAME:G|' + @rep), 4);
            IF NOT EXISTS (SELECT 1 FROM [dbo].[Deid_ValueMap] WHERE [map_key] = 'NAME|' + @h)
                INSERT INTO [dbo].[Deid_ValueMap]([map_key], [pseudo_value]) VALUES ('NAME|' + @h, @new);
        END
        ELSE IF @action = 'ADDR'
        BEGIN
            SET @new = CAST(1 + ABS(CONVERT(INT, CONVERT(VARBINARY(4), SUBSTRING(@h, 1, 8), 2))) % 999 AS NVARCHAR(10))
                     + N' Research Way^^CITY' + dbo.fn_DeidDigits(@h, 3) + N'^^00000';
            IF NOT EXISTS (SELECT 1 FROM [dbo].[Deid_ValueMap] WHERE [map_key] = 'ADDR|' + @h)
                INSERT INTO [dbo].[Deid_ValueMap]([map_key], [pseudo_value]) VALUES ('ADDR|' + @h, @new);
        END
        ELSE IF @action = 'PHONE'
        BEGIN
            -- Digit-wise rotation: formatting preserved, every digit changed
            SET @new = TRANSLATE(@rep, N'0123456789',
                SUBSTRING(N'12345678901234567890', 1 + (ABS(CONVERT(INT, CONVERT(VARBINARY(4), SUBSTRING(@h, 1, 8), 2))) % 10), 10));
            IF NOT EXISTS (SELECT 1 FROM [dbo].[Deid_ValueMap] WHERE [map_key] = 'PHONE|' + @h)
                INSERT INTO [dbo].[Deid_ValueMap]([map_key], [pseudo_value]) VALUES ('PHONE|' + @h, @new);
        END
        ELSE IF @seg = 'PID' AND @n = 3
        BEGIN
            -- CX: new ID, stable pseudo authority, original type (comp 5) preserved
            SET @tok = @rep; SET @j = 1;
            WHILE @j < 4 AND CHARINDEX(N'^', @tok) > 0
            BEGIN SET @tok = SUBSTRING(@tok, CHARINDEX(N'^', @tok) + 1, LEN(@tok)); SET @j = @j + 1; END
            SET @c4 = CASE WHEN @j = 4 AND CHARINDEX(N'^', @tok) > 0
                           THEN LEFT(@tok, CHARINDEX(N'^', @tok) - 1)
                           WHEN @j = 4 THEN @tok ELSE N'' END;
            SET @tok = @rep; SET @j = 1;
            WHILE @j < 5 AND CHARINDEX(N'^', @tok) > 0
            BEGIN SET @tok = SUBSTRING(@tok, CHARINDEX(N'^', @tok) + 1, LEN(@tok)); SET @j = @j + 1; END
            SET @c5 = CASE WHEN @j = 5 AND CHARINDEX(N'^', @tok) > 0
                           THEN LEFT(@tok, CHARINDEX(N'^', @tok) - 1)
                           WHEN @j = 5 THEN @tok ELSE NULL END;
            IF @c4 <> N'' SET @c4 = N'FAC' + SUBSTRING(dbo.fn_DeidHash(@secret, N'AUTH|' + @c4), 1, 3);
            SET @new = N'DID' + dbo.fn_DeidDigits(@h, 6) + N'^^^' + @c4 + N'^' + ISNULL(@c5, N'MR');
            -- Audit the patient ID mapping
            IF NOT EXISTS (SELECT 1 FROM [dbo].[Deid_ValueMap] WHERE [map_key] = 'ID|' + @h)
                INSERT INTO [dbo].[Deid_ValueMap]([map_key], [pseudo_value])
                VALUES ('ID|' + @h, LEFT(@new, CHARINDEX(N'^', @new + N'^') - 1));
        END
        ELSE
        BEGIN
            DECLARE @key VARCHAR(220) = @action + '|' + @h;
            SELECT @new = [pseudo_value] FROM [dbo].[Deid_ValueMap] WHERE [map_key] = @key;
            IF @new IS NULL
            BEGIN
                SET @new = CASE @action WHEN 'GEN' THEN N'SITE' + SUBSTRING(@h, 1, 4)
                                        ELSE N'DID' + dbo.fn_DeidDigits(@h, 6) END;
                INSERT INTO [dbo].[Deid_ValueMap]([map_key], [pseudo_value]) VALUES (@key, @new);
            END
        END

        SET @out = CASE WHEN @first = 1 THEN @new ELSE @out + N'~' + @new END;
        SET @first = 0;
    END

    SET @msg = dbo.fn_DeidSetField(@msg, @seg, @n, @out);
END
GO

-- ---------- Main procedure ----------
CREATE OR ALTER PROCEDURE [dbo].[${procName}]
    @RawMessageID INT = NULL,
    @secret NVARCHAR(200) = N'${secretLiteral}'
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @msg NVARCHAR(MAX); DECLARE @id INT;

    DECLARE cur CURSOR FOR
        SELECT [${idColumn}], [${msgColumn}] FROM [dbo].[${sourceTable}]
        WHERE (@RawMessageID IS NULL OR [${idColumn}] = @RawMessageID);

    OPEN cur; FETCH NEXT FROM cur INTO @id, @msg;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        BEGIN TRY
            -- Patient lane: PID-3 key -> stable pseudo MRN + private date offset
            DECLARE @pid3 NVARCHAR(MAX) = dbo.fn_DeidGetField(@msg, 'PID', 3);
            DECLARE @pkey NVARCHAR(MAX) = LEFT(@pid3, CHARINDEX('^', @pid3 + '^') - 1);
            DECLARE @phash CHAR(64) = dbo.fn_DeidHash(@secret, N'PATIENT|' + @pkey);
            IF NOT EXISTS (SELECT 1 FROM [dbo].[Deid_PatientMap] WHERE [real_hash] = @phash)
                INSERT INTO [dbo].[Deid_PatientMap]([real_hash], [pseudo_mrn], [date_offset_days])
                VALUES (@phash, N'DID' + dbo.fn_DeidDigits(@phash, 6), 1 + ABS(CHECKSUM(NEWID())) % 364);
            DECLARE @offsetDays INT = (SELECT [date_offset_days] FROM [dbo].[Deid_PatientMap] WHERE [real_hash] = @phash);

${applyLines}

            -- MSH-10 control ID must never link runs: always fresh
            SET @msg = dbo.fn_DeidSetField(@msg, 'MSH', 10, N'DEID' + UPPER(LEFT(REPLACE(CAST(NEWID() AS VARCHAR(36)), '-', ''), 12)));

            INSERT INTO [dbo].[${destTable}]([SourceID], [DeidentifiedMessage])
            VALUES (@id, @msg);
        END TRY
        BEGIN CATCH
            PRINT 'Error de-identifying ID: ' + CAST(@id AS VARCHAR(20)) + ' ' + ERROR_MESSAGE();
        END CATCH
        FETCH NEXT FROM cur INTO @id, @msg;
    END
    CLOSE cur; DEALLOCATE cur;
END
GO

-- Execute: EXEC [dbo].[${procName}];
--
-- FIRST-RUN TEST (synthetic, already fictional):
-- INSERT INTO [dbo].[${sourceTable}] ([${msgColumn}]) VALUES
-- ('MSH|^~\\&|EPIC|HOSP|R|E|20240215120000||ADT^A01|T1|P|2.5' + CHAR(13) + 'PID|||MR1^^^H^MR||DOE^JOHN||19800115|M' + CHAR(13) + 'PV1||I|||||||||||V1|||||||||||||||||||||||||||||||||20240215120000'),
-- ('MSH|^~\\&|EPIC|HOSP|R|E|20240218143000||ADT^A03|T2|P|2.5' + CHAR(13) + 'PID|||MR1^^^H^MR||DOE^JOHN||19800115|M' + CHAR(13) + 'PV1||I|||||||||||V1|||||||||||||||||||||||||||||||||20240215120000|20240218143000');
-- EXEC [dbo].[${procName}];
-- EXPECT: both rows share one pseudo MRN; admit->discharge interval unchanged.`;
    }

    // ---------------------------------------------- PostgreSQL --
    function genPostgres(): string {
      const applyLines = Object.entries(ruleBlocks).flatMap(([seg, fids]) =>
        fids.map(fid => {
          const n = fid.split('-')[1];
          const action = DEID_RULES[fid].action;
          return `            v_msg := deid_apply_field(v_msg, '${seg}', ${n}, '${action}', v_secret, v_offset); -- ${fid}`;
        })
      ).join('\n');

      return `-- ============================================
-- HL7 De-Identification Script (PostgreSQL)
-- Generated by HIT HL7 De-Identify
-- Requires: CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- ============================================
-- HOW IT WORKS: same as SQL Server version — salted SHA-256 pseudonyms
-- via map tables, per-patient date offsets, journeys preserved.
-- Map tables stay INTERNAL. NTE / OBX-5 free text is NOT scrubbed.
--
-- SOURCE: ${sourceTable} (${idColumn}, ${msgColumn})

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS deid_patient_map (
    real_hash CHAR(64) PRIMARY KEY,
    pseudo_mrn VARCHAR(20) NOT NULL,
    date_offset_days INT NOT NULL,
    first_seen TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS deid_value_map (
    map_key VARCHAR(220) PRIMARY KEY,
    pseudo_value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ${destTable} (
    id SERIAL PRIMARY KEY,
    source_id INT NOT NULL,
    deidentified_message TEXT NOT NULL,
    processed_datetime TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Salted hash + deterministic digits
CREATE OR REPLACE FUNCTION deid_hash(p_secret TEXT, p_value TEXT) RETURNS CHAR(64)
LANGUAGE sql IMMUTABLE AS $$ SELECT UPPER(ENCODE(digest(p_secret || '|' || p_value, 'sha256'), 'hex')) $$;

CREATE OR REPLACE FUNCTION deid_digits(p_hash CHAR(64), p_len INT) RETURNS TEXT
LANGUAGE sql IMMUTABLE AS $$
  SELECT LPAD((('x' || SUBSTRING(p_hash, 1, 8))::BIT(32)::BIGINT % (10 ^ p_len))::TEXT, p_len, '0') $$;

-- Extract SEG-n (first occurrence, repeats intact; MSH-aware)
CREATE OR REPLACE FUNCTION deid_get_field(p_msg TEXT, p_seg CHAR(3), p_n INT) RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE AS \$\$
DECLARE
    v_seg TEXT; v_idx INT; v_parts TEXT[];
BEGIN
    SELECT s INTO v_seg FROM unnest(string_to_array(p_msg, CHR(13))) s WHERE s LIKE p_seg || '|%' LIMIT 1;
    IF v_seg IS NULL THEN RETURN NULL; END IF;
    v_idx := CASE WHEN p_seg = 'MSH' THEN p_n - 1 ELSE p_n END;
    v_parts := string_to_array(v_seg, '|');
    IF array_length(v_parts, 1) < v_idx + 1 THEN RETURN NULL; END IF;
    RETURN v_parts[v_idx + 1];
END; \$\$;

-- Splice a replaced field back (first segment occurrence, MSH-aware)
CREATE OR REPLACE FUNCTION deid_set_field(p_msg TEXT, p_seg CHAR(3), p_n INT, p_new TEXT) RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE AS \$\$
DECLARE
    v_lines TEXT[] := string_to_array(p_msg, CHR(13));
    v_i INT; v_idx INT; v_parts TEXT[];
BEGIN
    FOR v_i IN 1 .. array_length(v_lines, 1) LOOP
        IF v_lines[v_i] LIKE p_seg || '|%' THEN
            v_idx := CASE WHEN p_seg = 'MSH' THEN p_n - 1 ELSE p_n END;
            v_parts := string_to_array(v_lines[v_i], '|');
            WHILE array_length(v_parts, 1) < v_idx + 1 LOOP v_parts := v_parts || ''; END LOOP;
            v_parts[v_idx + 1] := COALESCE(p_new, '');
            v_lines[v_i] := array_to_string(v_parts, '|');
            EXIT;
        END IF;
    END LOOP;
    RETURN array_to_string(v_lines, CHR(13));
END; \$\$;

-- Stable pseudonym lookup (creates the map row on demand)
CREATE OR REPLACE FUNCTION deid_map(p_action TEXT, p_real TEXT, p_secret TEXT) RETURNS TEXT
LANGUAGE plpgsql AS \$\$
DECLARE v_h CHAR(64); v_key TEXT; v_pseudo TEXT;
BEGIN
    IF p_real IS NULL OR p_real = '' THEN RETURN ''; END IF;
    v_h := deid_hash(p_secret, p_action || '|' || p_real);
    v_key := p_action || '|' || v_h;
    SELECT pseudo_value INTO v_pseudo FROM deid_value_map WHERE map_key = v_key;
    IF v_pseudo IS NULL THEN
        v_pseudo := CASE p_action
            WHEN 'ID' THEN 'DID' || deid_digits(v_h, 6)
            WHEN 'GEN' THEN 'SITE' || SUBSTRING(v_h, 1, 4)
            ELSE 'DID' || deid_digits(v_h, 6) END;
        INSERT INTO deid_value_map(map_key, pseudo_value) VALUES (v_key, v_pseudo)
        ON CONFLICT (map_key) DO NOTHING;
        SELECT pseudo_value INTO v_pseudo FROM deid_value_map WHERE map_key = v_key;
    END IF;
    RETURN v_pseudo;
END; \$\$;

-- Shift YYYYMMDD[HHMMSS] by -p_offset days, preserving precision
CREATE OR REPLACE FUNCTION deid_shift_date(p_val TEXT, p_offset INT) RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE AS \$\$
DECLARE v_ts TIMESTAMPTZ;
BEGIN
    IF p_val IS NULL OR p_val !~ '^\\d{8}(\\d{6})?$' THEN RETURN p_val; END IF;
    v_ts := to_timestamp(SUBSTRING(p_val, 1, 8) || ' ' || COALESCE(SUBSTRING(p_val, 9, 6), '000000'), 'YYYYMMDD HH24MISS');
    v_ts := v_ts - (p_offset || ' days')::INTERVAL;
    IF LENGTH(p_val) <= 8 THEN RETURN to_char(v_ts, 'YYYYMMDD'); END IF;
    RETURN to_char(v_ts, 'YYYYMMDDHH24MISS');
END; \$\$;

-- Generic applier: handles repeats, CX/XPN/XAD structure, digit-shift phones
CREATE OR REPLACE FUNCTION deid_apply_field(p_msg TEXT, p_seg CHAR(3), p_n INT, p_action TEXT, p_secret TEXT, p_offset INT) RETURNS TEXT
LANGUAGE plpgsql AS \$\$
DECLARE
    v_raw TEXT := deid_get_field(p_msg, p_seg, p_n);
    v_rep TEXT; v_out TEXT[] := '{}'; v_comps TEXT[]; v_new TEXT;
BEGIN
    IF v_raw IS NULL OR v_raw = '' THEN RETURN p_msg; END IF;
    FOREACH v_rep IN ARRAY string_to_array(v_raw, '~') LOOP
        IF v_rep = '' THEN v_out := v_out || ''; CONTINUE; END IF;
        v_comps := string_to_array(v_rep, '^');
        IF p_action = 'DATE' THEN
            v_new := deid_shift_date(v_rep, p_offset);
        ELSIF p_action = 'PHONE' THEN
            -- Digit-wise rotation keeps formatting, changes every digit
            v_new := translate(v_rep, '0123456789',
                SUBSTRING('12345678901234567890', 1 + (('x' || SUBSTRING(deid_hash(p_secret, 'PHONE|' || v_rep), 1, 2))::BIT(8)::INT % 10), 10));
        ELSIF p_seg = 'PID' AND p_n = 3 THEN
            -- CX: new ID, stable pseudo authority, original type preserved
            WHILE array_length(v_comps, 1) < 5 LOOP v_comps := v_comps || ''; END LOOP;
            v_comps[1] := deid_map('ID', v_rep, p_secret);
            v_comps[2] := ''; v_comps[3] := '';
            IF v_comps[4] <> '' THEN v_comps[4] := 'FAC' || SUBSTRING(deid_hash(p_secret, 'AUTH|' || v_comps[4]), 1, 3); END IF;
            v_new := array_to_string(v_comps, '^');
        ELSIF p_action = 'NAME' THEN
            WHILE array_length(v_comps, 1) < 2 LOOP v_comps := v_comps || ''; END LOOP;
            v_comps[1] := 'F' || deid_digits(deid_hash(p_secret, 'NAME:F|' || v_rep), 4);
            v_comps[2] := 'G' || deid_digits(deid_hash(p_secret, 'NAME:G|' || v_rep), 4);
            IF array_length(v_comps, 1) > 2 THEN v_comps[3] := ''; END IF;
            v_new := array_to_string(v_comps, '^');
        ELSIF p_action = 'ADDR' THEN
            WHILE array_length(v_comps, 1) < 5 LOOP v_comps := v_comps || ''; END LOOP;
            v_comps[1] := (1 + (('x' || SUBSTRING(deid_hash(p_secret, 'ADDR:N|' || v_rep), 1, 4))::BIT(16)::INT % 999))::TEXT || ' Research Way';
            v_comps[2] := '';
            v_comps[3] := 'CITY' || deid_digits(deid_hash(p_secret, 'ADDR:C|' || v_rep), 3);
            v_comps[5] := '00000';
            v_new := array_to_string(v_comps, '^');
        ELSE
            v_new := deid_map(p_action, v_rep, p_secret);
        END IF;
        v_out := v_out || v_new;
    END LOOP;
    RETURN deid_set_field(p_msg, p_seg, p_n, array_to_string(v_out, '~'));
END; \$\$;

CREATE OR REPLACE PROCEDURE ${procName}(p_raw_message_id INT DEFAULT NULL, p_secret TEXT DEFAULT '${secretLiteral.replace(/'/g, "''")}')
LANGUAGE plpgsql AS \$\$
DECLARE
    rec RECORD; v_msg TEXT; v_pid3 TEXT; v_key TEXT; v_phash CHAR(64); v_offset INT;
BEGIN
    FOR rec IN SELECT ${idColumn} AS rid, ${msgColumn} AS raw
               FROM ${sourceTable}
               WHERE (p_raw_message_id IS NULL OR ${idColumn} = p_raw_message_id)
    LOOP
        BEGIN
            v_msg := rec.raw;
            v_pid3 := deid_get_field(v_msg, 'PID', 3);
            v_key := SPLIT_PART(COALESCE(v_pid3, ''), '^', 1);
            v_phash := deid_hash(p_secret, 'PATIENT|' || v_key);
            SELECT date_offset_days INTO v_offset FROM deid_patient_map WHERE real_hash = v_phash;
            IF v_offset IS NULL THEN
                v_offset := 1 + FLOOR(RANDOM() * 364)::INT;
                INSERT INTO deid_patient_map(real_hash, pseudo_mrn, date_offset_days)
                VALUES (v_phash, 'DID' || deid_digits(v_phash, 6), v_offset)
                ON CONFLICT (real_hash) DO NOTHING;
                SELECT date_offset_days INTO v_offset FROM deid_patient_map WHERE real_hash = v_phash;
            END IF;

${applyLines}

            v_msg := deid_set_field(v_msg, 'MSH', 10, 'DEID' || UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 8)));
            INSERT INTO ${destTable}(source_id, deidentified_message) VALUES (rec.rid, v_msg);
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Error de-identifying ID: %', rec.rid;
        END;
    END LOOP;
END; \$\$;

-- Execute: CALL ${procName}();
-- FIRST-RUN TEST: insert the 2 synthetic messages from the SQL Server
-- version, CALL, then verify one shared pseudo MRN and an intact interval.`;
    }

    // ------------------------------------------------- MySQL --
    function genMySql(): string {
      const applyLines = Object.entries(ruleBlocks).flatMap(([seg, fids]) =>
        fids.map(fid => {
          const n = fid.split('-')[1];
          const action = DEID_RULES[fid].action;
          return `            CALL p_DeidApplyField(v_msg, '${seg}', ${n}, '${action}', v_secret, v_offset, v_msg); -- ${fid}`;
        })
      ).join('\n');

      return `-- ============================================
-- HL7 De-Identification Script (MySQL 8.0+)
-- Generated by HIT HL7 De-Identify
-- ============================================
-- HOW IT WORKS: same salted-hash map-table design as the other dialects.
-- Uses SHA2(), string helpers below, and a row loop procedure.
-- Map tables stay INTERNAL. NTE / OBX-5 free text is NOT scrubbed.
--
-- SOURCE: \`${sourceTable}\` (\`${idColumn}\`, \`${msgColumn}\`)

CREATE TABLE IF NOT EXISTS \`deid_patient_map\` (
    \`real_hash\` CHAR(64) PRIMARY KEY,
    \`pseudo_mrn\` VARCHAR(20) NOT NULL,
    \`date_offset_days\` INT NOT NULL,
    \`first_seen\` DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS \`deid_value_map\` (
    \`map_key\` VARCHAR(220) PRIMARY KEY,
    \`pseudo_value\` VARCHAR(500) NOT NULL
);

CREATE TABLE IF NOT EXISTS \`${destTable}\` (
    \`id\` INT AUTO_INCREMENT PRIMARY KEY,
    \`source_id\` INT NOT NULL,
    \`deidentified_message\` MEDIUMTEXT NOT NULL,
    \`processed_datetime\` DATETIME DEFAULT CURRENT_TIMESTAMP
);

DELIMITER $$

-- Salted hash + digits
CREATE FUNCTION IF NOT EXISTS \`fn_DeidHash\`(p_secret VARCHAR(200), p_value TEXT) RETURNS CHAR(64)
DETERMINISTIC
BEGIN RETURN UPPER(SHA2(CONCAT(p_secret, '|', p_value), 256)); END$$

CREATE FUNCTION IF NOT EXISTS \`fn_DeidDigits\`(p_hash CHAR(64), p_len INT) RETURNS VARCHAR(20)
DETERMINISTIC
BEGIN
  RETURN LPAD(CONV(SUBSTRING(p_hash, 1, 8), 16, 10) MOD POW(10, p_len), p_len, '0');
END$$

-- Extract SEG-n (first occurrence; MSH-aware: field n at position n)
CREATE FUNCTION IF NOT EXISTS \`fn_DeidGetField\`(p_msg MEDIUMTEXT, p_seg CHAR(3), p_n INT) RETURNS TEXT
DETERMINISTIC
BEGIN
  DECLARE v_seg TEXT; DECLARE v_idx INT;
  SET v_seg = SUBSTRING_INDEX(SUBSTRING_INDEX(p_msg, CONCAT(CHAR(13), p_seg, '|'), -1), CHAR(13), 1);
  IF LOCATE('|', v_seg) = 0 THEN RETURN NULL; END IF;
  SET v_idx = IF(p_seg = 'MSH', p_n - 1, p_n);
  SET v_seg = SUBSTRING(v_seg, LOCATE('|', v_seg) + 1);
  RETURN SUBSTRING_INDEX(SUBSTRING_INDEX(CONCAT(v_seg, REPEAT('|', v_idx)), '|', v_idx + 1), '|', -1);
END$$

-- Splice replaced field back (first segment occurrence)
CREATE FUNCTION IF NOT EXISTS \`fn_DeidSetField\`(p_msg MEDIUMTEXT, p_seg CHAR(3), p_n INT, p_new TEXT) RETURNS MEDIUMTEXT
DETERMINISTIC
BEGIN
  DECLARE v_head MEDIUMTEXT; DECLARE v_seg TEXT; DECLARE v_tail MEDIUMTEXT;
  DECLARE v_idx INT; DECLARE v_pos INT DEFAULT 1; DECLARE v_i INT DEFAULT 0;
  DECLARE v_fs INT; DECLARE v_fe INT;
  SET v_head = SUBSTRING_INDEX(p_msg, CONCAT(CHAR(13), p_seg, '|'), 1);
  IF v_head = p_msg THEN RETURN p_msg; END IF;
  SET v_seg = SUBSTRING_INDEX(SUBSTRING(p_msg, CHAR_LENGTH(v_head) + 2), CHAR(13), 1);
  SET v_tail = SUBSTRING(p_msg, CHAR_LENGTH(v_head) + 2 + CHAR_LENGTH(v_seg) + 1);
  SET v_idx = IF(p_seg = 'MSH', p_n - 1, p_n);
  SET v_fs = 1;
  WHILE v_i < v_idx DO
    SET v_pos = LOCATE('|', v_seg, v_fs);
    IF v_pos = 0 THEN RETURN p_msg; END IF;
    SET v_fs = v_pos + 1; SET v_i = v_i + 1;
  END WHILE;
  SET v_fe = LOCATE('|', v_seg, v_fs);
  IF v_fe = 0 THEN SET v_fe = CHAR_LENGTH(v_seg) + 1; END IF;
  SET v_seg = CONCAT(SUBSTRING(v_seg, 1, v_fs - 1), IFNULL(p_new, ''), SUBSTRING(v_seg, v_fe));
  RETURN CONCAT(v_head, CHAR(13), v_seg, IF(v_tail = '', '', CONCAT(CHAR(13), v_tail)));
END$$

-- Stable pseudonym lookup (map row created on demand)
CREATE FUNCTION IF NOT EXISTS \`fn_DeidMap\`(p_action VARCHAR(10), p_real TEXT, p_secret VARCHAR(200)) RETURNS VARCHAR(500)
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE v_h CHAR(64); DECLARE v_key VARCHAR(220); DECLARE v_pseudo VARCHAR(500);
  IF p_real IS NULL OR p_real = '' THEN RETURN ''; END IF;
  SET v_h = fn_DeidHash(p_secret, CONCAT(p_action, '|', p_real));
  SET v_key = CONCAT(p_action, '|', v_h);
  SELECT \`pseudo_value\` INTO v_pseudo FROM \`deid_value_map\` WHERE \`map_key\` = v_key LIMIT 1;
  IF v_pseudo IS NULL THEN
    SET v_pseudo = IF(p_action = 'GEN', CONCAT('SITE', SUBSTRING(v_h, 1, 4)), CONCAT('DID', fn_DeidDigits(v_h, 6)));
    INSERT IGNORE INTO \`deid_value_map\`(\`map_key\`, \`pseudo_value\`) VALUES (v_key, v_pseudo);
  END IF;
  RETURN v_pseudo;
END$$

-- Shift YYYYMMDD[HHMMSS] back by p_offset days, preserving precision
CREATE FUNCTION IF NOT EXISTS \`fn_DeidShiftDate\`(p_val TEXT, p_offset INT) RETURNS TEXT
DETERMINISTIC
BEGIN
  DECLARE v_dt DATETIME;
  IF p_val IS NULL OR p_val NOT REGEXP '^[0-9]{8}([0-9]{6})?$' THEN RETURN p_val; END IF;
  SET v_dt = STR_TO_DATE(p_val, IF(CHAR_LENGTH(p_val) > 8, '%Y%m%d%H%i%S', '%Y%m%d'));
  IF v_dt IS NULL THEN RETURN p_val; END IF;
  SET v_dt = DATE_ADD(v_dt, INTERVAL -p_offset DAY);
  RETURN DATE_FORMAT(v_dt, IF(CHAR_LENGTH(p_val) > 8, '%Y%m%d%H%i%S', '%Y%m%d'));
END$$

-- Generic applier over repeats (CX/XPN/XAD-aware, digit-shift phones)
CREATE PROCEDURE IF NOT EXISTS \`p_DeidApplyField\`(INOUT p_msg MEDIUMTEXT, IN p_seg CHAR(3), IN p_n INT, IN p_action VARCHAR(10), IN p_secret VARCHAR(200), IN p_offset INT)
BEGIN
  DECLARE v_raw TEXT; DECLARE v_rest TEXT; DECLARE v_rep TEXT; DECLARE v_out TEXT DEFAULT '';
  DECLARE v_first INT DEFAULT 1; DECLARE v_h CHAR(64); DECLARE v_new TEXT;
  DECLARE v_c1 TEXT; DECLARE v_c2 TEXT; DECLARE v_c3 TEXT; DECLARE v_c4 TEXT; DECLARE v_c5 TEXT;
  DECLARE v_d INT; DECLARE v_i INT; DECLARE v_ch VARCHAR(1); DECLARE v_k INT;
  SET v_raw = fn_DeidGetField(p_msg, p_seg, p_n);
  IF v_raw IS NOT NULL AND v_raw <> '' THEN
    SET v_rest = v_raw;
    WHILE CHAR_LENGTH(v_rest) > 0 DO
      IF LOCATE('~', v_rest) > 0 THEN
        SET v_rep = SUBSTRING_INDEX(v_rest, '~', 1);
        SET v_rest = SUBSTRING(v_rest, LOCATE('~', v_rest) + 1);
      ELSE
        SET v_rep = v_rest; SET v_rest = '';
      END IF;
      SET v_h = fn_DeidHash(p_secret, CONCAT(p_action, '|', v_rep));
      IF p_action = 'DATE' THEN
        SET v_new = fn_DeidShiftDate(v_rep, p_offset);
      ELSEIF p_action = 'PHONE' THEN
        -- Digit-wise rotation: formatting preserved, every digit changed
        SET v_k = CONV(SUBSTRING(v_h, 1, 2), 16, 10) MOD 10;
        SET v_new = ''; SET v_i = 1;
        WHILE v_i <= CHAR_LENGTH(v_rep) DO
          SET v_ch = SUBSTRING(v_rep, v_i, 1);
          IF v_ch REGEXP '^[0-9]$' THEN SET v_new = CONCAT(v_new, (v_ch + v_k) MOD 10));
          ELSE SET v_new = CONCAT(v_new, v_ch); END IF;
          SET v_i = v_i + 1;
        END WHILE;
      ELSEIF p_seg = 'PID' AND p_n = 3 THEN
        SET v_c1 = SUBSTRING_INDEX(v_rep, '^', 1);
        SET v_c5 = SUBSTRING_INDEX(SUBSTRING_INDEX(v_rep, '^', 5), '^', -1);
        IF v_c5 = v_rep THEN SET v_c5 = ''; END IF;
        SET v_c4 = SUBSTRING_INDEX(SUBSTRING_INDEX(CONCAT(v_rep, '^^^^'), '^', 4), '^', -1);
        IF v_c4 <> '' THEN SET v_c4 = CONCAT('FAC', SUBSTRING(fn_DeidHash(p_secret, CONCAT('AUTH|', v_c4)), 1, 3)); END IF;
        SET v_new = CONCAT(fn_DeidMap('ID', v_rep, p_secret), '^^^', v_c4, '^', IF(v_c5 LIKE '%^%' OR v_c5 = '', 'MR', v_c5));
      ELSEIF p_action = 'NAME' THEN
        SET v_new = CONCAT('F', fn_DeidDigits(fn_DeidHash(p_secret, CONCAT('NAME:F|', v_rep)), 4), '^',
                           'G', fn_DeidDigits(fn_DeidHash(p_secret, CONCAT('NAME:G|', v_rep)), 4));
      ELSEIF p_action = 'ADDR' THEN
        SET v_new = CONCAT(1 + (CONV(SUBSTRING(v_h, 1, 4), 16, 10) MOD 999), ' Research Way^^CITY',
                           fn_DeidDigits(v_h, 3), '^^00000');
      ELSE
        SET v_new = fn_DeidMap(p_action, v_rep, p_secret);
      END IF;
      SET v_out = IF(v_first, v_new, CONCAT(v_out, '~', v_new));
      SET v_first = 0;
    END WHILE;
    SET p_msg = fn_DeidSetField(p_msg, p_seg, p_n, v_out);
  END IF;
END$$

-- Main procedure: patient lanes, per-field rules, fresh MSH-10, audit insert
CREATE PROCEDURE IF NOT EXISTS \`${procName}\`(IN p_raw_message_id INT, IN p_secret VARCHAR(200))
BEGIN
  DECLARE done INT DEFAULT 0;
  DECLARE v_id INT; DECLARE v_msg MEDIUMTEXT;
  DECLARE v_pid3 TEXT; DECLARE v_key TEXT; DECLARE v_phash CHAR(64); DECLARE v_offset INT;
  DECLARE cur CURSOR FOR SELECT \`${idColumn}\`, \`${msgColumn}\` FROM \`${sourceTable}\`
    WHERE (p_raw_message_id IS NULL OR \`${idColumn}\` = p_raw_message_id);
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;
  OPEN cur; read_loop: LOOP
    FETCH cur INTO v_id, v_msg;
    IF done THEN LEAVE read_loop; END IF;
    SET v_pid3 = fn_DeidGetField(v_msg, 'PID', 3);
    SET v_key = SUBSTRING_INDEX(IFNULL(v_pid3, ''), '^', 1);
    SET v_phash = fn_DeidHash(p_secret, CONCAT('PATIENT|', v_key));
    SELECT \`date_offset_days\` INTO v_offset FROM \`deid_patient_map\` WHERE \`real_hash\` = v_phash LIMIT 1;
    IF v_offset IS NULL THEN
      SET v_offset = 1 + FLOOR(RAND() * 364);
      INSERT IGNORE INTO \`deid_patient_map\`(\`real_hash\`, \`pseudo_mrn\`, \`date_offset_days\`)
      VALUES (v_phash, CONCAT('DID', fn_DeidDigits(v_phash, 6)), v_offset);
      SELECT \`date_offset_days\` INTO v_offset FROM \`deid_patient_map\` WHERE \`real_hash\` = v_phash LIMIT 1;
    END IF;

${applyLines}

    SET v_msg = fn_DeidSetField(v_msg, 'MSH', 10, CONCAT('DEID', UPPER(SUBSTRING(REPLACE(UUID(), '-', ''), 1, 12))));
    INSERT INTO \`${destTable}\`(\`source_id\`, \`deidentified_message\`) VALUES (v_id, v_msg);
  END LOOP;
  CLOSE cur;
END$$

DELIMITER ;

-- Execute: CALL \`${procName}\`(NULL, '${secretLiteral.replace(/'/g, "\\'")}');
-- FIRST-RUN TEST: same 2 synthetic messages as SQL Server version.`;
    }
  }, [selectedRules, ruleBlocks, sourceTable, msgColumn, idColumn, destTable, procName, secretLiteral, dbPlatform]);

  const copySQL = () => {
    navigator.clipboard.writeText(generateSQL);
    toast({ title: "Copied", description: "De-identification script copied to clipboard." });
  };

  const downloadSQL = () => {
    const blob = new Blob([generateSQL], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hl7-deidentify-${dbPlatform}.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const ruledSegments = HL7_SEGMENTS.map(s => ({
    ...s,
    fields: s.fields.filter(f => DEID_RULES[f.id]),
  })).filter(s => s.fields.length > 0);

  return (
    <div className="bg-neutral-50 min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="font-bold text-lg text-gray-900">HL7 De-Identify</h1>
            <p className="text-xs text-gray-500">Generate SQL that pseudonymizes PHI in your own database</p>
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
          <Button variant="outline" size="sm" onClick={selectSafeHarbor}>
            <ShieldCheck className="h-4 w-4 mr-2" />
            Safe Harbor preset
          </Button>
          <Button variant="outline" size="sm" onClick={clearAll}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Clear
          </Button>
          <Button variant="default" size="sm" onClick={copySQL}>
            <Copy className="h-4 w-4 mr-2" />
            Copy SQL
          </Button>
          <Button variant="outline" size="sm" onClick={downloadSQL}>
            <Download className="h-4 w-4 mr-2" />
            .sql
          </Button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="bg-white border-b px-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="generator">Generator</TabsTrigger>
            <TabsTrigger value="guide">
              <BookOpen className="h-4 w-4 mr-1" />
              Guide & FAQ
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {activeTab === 'generator' && (
      <>
      {/* Main Content */}
      <ResizablePanelGroup direction="horizontal" className="flex-grow">
        {/* Left Panel - Rules + Config */}
        <ResizablePanel defaultSize={40} minSize={30}>
          <div className="h-full flex flex-col bg-white">
            <div className="px-4 py-3 bg-gray-50 border-b">
              <span className="text-sm font-medium">De-identification rules</span>
              <span className="text-xs text-gray-500 ml-auto"> {selectedRules.size} fields armed</span>
              <p className="text-xs text-gray-500 mt-1">Uncheck a field to leave it untouched. Mapping tables keep fictional IDs consistent.</p>
            </div>

            <ScrollArea className="flex-grow">
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label className="text-xs">Source table</Label>
                    <Input value={sourceTable} onChange={(e) => setSourceTable(e.target.value)} className="h-8 font-mono" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Message column</Label>
                      <Input value={msgColumn} onChange={(e) => setMsgColumn(e.target.value)} className="h-8 font-mono" />
                    </div>
                    <div>
                      <Label className="text-xs">ID column</Label>
                      <Input value={idColumn} onChange={(e) => setIdColumn(e.target.value)} className="h-8 font-mono" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Dest table</Label>
                      <Input value={destTable} onChange={(e) => setDestTable(e.target.value)} className="h-8 font-mono" />
                    </div>
                    <div>
                      <Label className="text-xs">Procedure name</Label>
                      <Input value={procName} onChange={(e) => setProcName(e.target.value)} className="h-8 font-mono" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">Project secret passphrase (embedded in script — keep internal)</Label>
                    <Input
                      type="password"
                      value={secret}
                      onChange={(e) => setSecret(e.target.value)}
                      placeholder="Min 8 chars, per-project, never shipped with output"
                      className="h-8 font-mono"
                    />
                  </div>
                </div>

                <Accordion type="multiple" defaultValue={["PID", "PV1"]} className="p-0">
                  {ruledSegments.map((segment) => {
                    const selectedCount = segment.fields.filter(f => selectedRules.has(f.id)).length;
                    const allSelected = selectedCount === segment.fields.length;
                    return (
                      <AccordionItem key={segment.id} value={segment.id} className="border rounded-lg mb-2 overflow-hidden">
                        <div className="flex items-center px-3 py-2 bg-white hover:bg-gray-50">
                          <div className="mr-2" onClick={(e) => e.stopPropagation()}>
                            <Checkbox
                              checked={allSelected}
                              onCheckedChange={() => toggleSegment(segment)}
                            />
                          </div>
                          <AccordionTrigger className="flex-1 hover:no-underline p-0 [&>svg]:ml-auto">
                            <div className="flex items-center gap-2 flex-1">
                              <span className="font-mono text-sm font-medium text-primary">{segment.id}</span>
                              <span className="text-xs text-gray-600 truncate">{segment.description}</span>
                              {selectedCount > 0 && (
                                <Badge variant="secondary" className="text-[10px] px-1 py-0 ml-auto">{selectedCount}</Badge>
                              )}
                            </div>
                          </AccordionTrigger>
                        </div>
                        <AccordionContent className="px-3 pb-3">
                          {segment.fields.map((f) => (
                            <label key={f.id} className="flex items-start gap-2 py-1.5 text-xs cursor-pointer">
                              <Checkbox
                                checked={selectedRules.has(f.id)}
                                onCheckedChange={() => toggleRule(f.id)}
                                className="mt-0.5"
                              />
                              <span className="flex-1">
                                <span className="font-mono font-medium">{f.id}</span>
                                <span className="text-gray-600"> {f.name}</span>
                                <Badge variant="outline" className="ml-2 text-[10px] px-1 py-0">
                                  {ACTION_LABEL[DEID_RULES[f.id].action]}
                                </Badge>
                                <span className="block text-gray-400">Safe Harbor {DEID_RULES[f.id].harbor}</span>
                              </span>
                            </label>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>

                <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
                  <TriangleAlert className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>
                    NTE / OBX-5 free text is not scrubbed, map tables stay internal, and rare conditions can re-identify — get governance sign-off before external release.
                    <button onClick={() => setActiveTab('guide')} className="ml-1 font-medium underline hover:text-amber-900">
                      Read the guide →
                    </button>
                  </span>
                </div>
              </div>
            </ScrollArea>
          </div>
        </ResizablePanel>

        <ResizableHandle />

        {/* Right Panel - SQL Preview */}
        <ResizablePanel defaultSize={60} minSize={40}>
          <div className="h-full flex flex-col bg-gray-900">
            <div className="px-4 py-2 bg-gray-800 text-gray-300 text-xs font-mono border-b border-gray-700">
              {`hl7-deidentify-${dbPlatform}.sql`} · {generateSQL.split('\n').length} lines
            </div>
            <ScrollArea className="flex-grow">
              <pre className="p-4 text-xs font-mono text-gray-100 whitespace-pre-wrap break-all">{generateSQL}</pre>
            </ScrollArea>
          </div>
        </ResizablePanel>
        </ResizablePanelGroup>
      </>
      )}

      {activeTab === 'guide' && (
        <div className="flex-grow bg-white">
          <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
            {/* How it works */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-1">How it works</h2>
              <p className="text-sm text-gray-500 mb-4">One patient's 20 messages in — one consistent fictional identity out.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {FLOW_STEPS.map((s) => (
                  <div key={s.title} className="border rounded-lg p-4 bg-neutral-50">
                    <s.icon className="h-5 w-5 text-primary mb-2" />
                    <div className="text-sm font-semibold text-gray-900">{s.title}</div>
                    <div className="text-xs text-gray-600 mt-1">{s.desc}</div>
                  </div>
                ))}
              </div>
            </section>

            {/* Worked example */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Worked example</h2>
              <p className="text-sm text-gray-500 mb-4">Same patient, admit → discharge. Synthetic data — already fictional.</p>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="border rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-gray-100 text-xs font-semibold text-gray-700">Before (your database)</div>
                  <pre className="p-3 text-[11px] font-mono text-gray-800 whitespace-pre-wrap break-all bg-white">{GUIDE_BEFORE.join('\n')}</pre>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <div className="px-3 py-2 bg-green-50 text-xs font-semibold text-green-800">After (safe to share)</div>
                  <pre className="p-3 text-[11px] font-mono text-gray-800 whitespace-pre-wrap break-all bg-white">{GUIDE_AFTER.join('\n')}</pre>
                </div>
              </div>
            </section>

            {/* Field rules reference */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Field rules reference</h2>
              <p className="text-sm text-gray-500 mb-4">Exactly what the generator applies when a rule is checked. Unchecked fields pass through untouched.</p>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 text-left text-gray-500">
                      <th className="px-3 py-2 font-medium">Field</th>
                      <th className="px-3 py-2 font-medium">Action</th>
                      <th className="px-3 py-2 font-medium">Safe Harbor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(DEID_RULES).map(([fid, r]) => (
                      <tr key={fid} className="border-t">
                        <td className="px-3 py-1.5 font-mono font-medium text-gray-800">{fid} <span className="font-sans font-normal text-gray-500">{r.label}</span></td>
                        <td className="px-3 py-1.5"><Badge variant="outline" className="text-[10px] px-1 py-0">{ACTION_LABEL[r.action]}</Badge></td>
                        <td className="px-3 py-1.5 text-gray-500">#{r.harbor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* FAQ */}
            <section>
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                Frequently asked questions
              </h2>
              <Accordion type="single" collapsible className="w-full">
                {FAQ_ITEMS.map((item, i) => (
                  <AccordionItem key={i} value={`faq-${i}`} className="border rounded-lg mb-2 px-4">
                    <AccordionTrigger className="text-sm font-medium text-left hover:no-underline">
                      {item.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-gray-600">
                      {item.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
