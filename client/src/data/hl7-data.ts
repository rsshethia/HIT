export const messageTypes = [
  {
    id: 'ADT',
    name: 'ADT (Admission, Discharge, Transfer)',
    segments: ['MSH', 'EVN', 'PID', 'PD1', 'NK1', 'PV1', 'PV2', 'DB1', 'OBX', 'AL1', 'DG1', 'PR1', 'GT1', 'IN1', 'IN2', 'ROL', 'ACC', 'UB1', 'UB2']
  },
  {
    id: 'ORU',
    name: 'ORU (Observation Result)',
    segments: ['MSH', 'PID', 'PD1', 'NK1', 'NTE', 'PV1', 'PV2', 'ORC', 'OBR', 'NTE', 'OBX', 'CTI', 'SPM', 'FT1']
  },
  {
    id: 'ORM',
    name: 'ORM (Order Message)',
    segments: ['MSH', 'PID', 'PD1', 'PV1', 'PV2', 'IN1', 'IN2', 'GT1', 'AL1', 'ORC', 'OBR', 'RQD', 'RQ1', 'RXO', 'ODS', 'ODT', 'NTE', 'CTD', 'DG1', 'OBX']
  },
  {
    id: 'SIU',
    name: 'SIU (Scheduling Information Unsolicited)',
    segments: ['MSH', 'SCH', 'NTE', 'PID', 'PD1', 'PV1', 'PV2', 'OBX', 'DG1', 'RGS', 'AIS', 'AIG', 'AIL', 'AIP', 'APR']
  },
  {
    id: 'MDM',
    name: 'MDM (Medical Document Management)',
    segments: ['MSH', 'EVN', 'PID', 'PV1', 'TXA', 'OBX']
  },
  {
    id: 'BAR',
    name: 'BAR (Billing Account Record)',
    segments: ['MSH', 'EVN', 'PID', 'PV1', 'DG1', 'PR1', 'GT1', 'IN1', 'IN2', 'ACC', 'UB1', 'UB2']
  },
  {
    id: 'DFT',
    name: 'DFT (Detailed Financial Transaction)',
    segments: ['MSH', 'EVN', 'PID', 'PV1', 'PV2', 'DB1', 'OBX', 'FT1', 'DG1', 'PR1', 'GT1', 'IN1', 'IN2', 'ROL']
  },
  {
    id: 'RDE',
    name: 'RDE (Pharmacy Encoded Order)',
    segments: ['MSH', 'PID', 'PD1', 'NTE', 'PV1', 'PV2', 'IN1', 'IN2', 'GT1', 'AL1', 'ORC', 'RXE', 'RXR', 'RXC', 'OBX', 'NTE', 'CTI']
  }
];

export const allSegments = [
  { id: 'MSH', name: 'Message Header', description: 'Contains information about the message itself' },
  { id: 'PID', name: 'Patient Identification', description: 'Contains patient demographic information' },
  { id: 'PV1', name: 'Patient Visit', description: 'Contains information about the patient visit' },
  { id: 'ORC', name: 'Common Order', description: 'Contains common order information' },
  { id: 'OBR', name: 'Observation Request', description: 'Contains information about an observation request' },
  { id: 'OBX', name: 'Observation Result', description: 'Contains observation result information' },
  { id: 'EVN', name: 'Event Type', description: 'Contains event type information' },
  { id: 'NTE', name: 'Notes and Comments', description: 'Contains notes and comments' },
  { id: 'AL1', name: 'Patient Allergy Information', description: 'Contains patient allergy information' },
  { id: 'DG1', name: 'Diagnosis', description: 'Contains diagnosis information' },
  { id: 'PD1', name: 'Patient Additional Demographic', description: 'Contains additional demographic info' },
  { id: 'NK1', name: 'Next of Kin', description: 'Contains information about patient\'s next of kin' },
  { id: 'PV2', name: 'Patient Visit - Additional Info', description: 'Contains additional visit information' },
  { id: 'IN1', name: 'Insurance', description: 'Contains insurance information' },
  { id: 'IN2', name: 'Insurance Additional Info', description: 'Contains additional insurance information' },
  { id: 'GT1', name: 'Guarantor', description: 'Contains guarantor information' },
  { id: 'PR1', name: 'Procedures', description: 'Contains procedure information' },
  { id: 'ROL', name: 'Role', description: 'Contains information about a person\'s role' },
  { id: 'FT1', name: 'Financial Transaction', description: 'Contains financial transaction information' },
  { id: 'SCH', name: 'Scheduling Activity', description: 'Contains scheduling information' },
  { id: 'RGS', name: 'Resource Group', description: 'Contains resource group information' },
  { id: 'AIS', name: 'Appointment Information - Service', description: 'Contains appointment service information' },
  { id: 'AIG', name: 'Appointment Information - General Resource', description: 'Contains general resource information' },
  { id: 'AIL', name: 'Appointment Information - Location Resource', description: 'Contains location resource information' },
  { id: 'AIP', name: 'Appointment Information - Personnel Resource', description: 'Contains personnel resource information' },
  { id: 'APR', name: 'Appointment Preferences', description: 'Contains appointment preferences' },
  { id: 'TXA', name: 'Document Notification', description: 'Contains document notification information' },
  { id: 'RXE', name: 'Pharmacy Encoded Order', description: 'Contains pharmacy encoded order information' },
  { id: 'RXR', name: 'Pharmacy Route', description: 'Contains pharmacy route information' },
  { id: 'RXC', name: 'Pharmacy Component Order', description: 'Contains pharmacy component order information' },
  { id: 'CTI', name: 'Clinical Trial Identification', description: 'Contains clinical trial identification' },
  { id: 'SPM', name: 'Specimen', description: 'Contains specimen information' },
  { id: 'DB1', name: 'Disability', description: 'Contains disability information' },
  { id: 'ACC', name: 'Accident', description: 'Contains accident information' },
  { id: 'UB1', name: 'UB82 Data', description: 'Contains UB82 data' },
  { id: 'UB2', name: 'UB92 Data', description: 'Contains UB92 data' },
  { id: 'RQD', name: 'Requisition Detail', description: 'Contains requisition detail' },
  { id: 'RQ1', name: 'Requisition Detail-1', description: 'Contains requisition detail 1' },
  { id: 'RXO', name: 'Pharmacy/Treatment Order', description: 'Contains pharmacy/treatment order' },
  { id: 'ODS', name: 'Dietary Orders, Supplements, and Preferences', description: 'Contains dietary orders' },
  { id: 'ODT', name: 'Diet Tray Instructions', description: 'Contains diet tray instructions' },
  { id: 'CTD', name: 'Contact Data', description: 'Contains contact data' }
];
