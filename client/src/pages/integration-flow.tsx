import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Link } from "wouter";

// Define types for journey data
type JourneyStep = {
  step: string;
  message: string;
  systems: string[];
  downstreamSystems: string[];
  data: string[];
  timeframe: string;
  risk: "Low" | "Medium" | "High" | "Critical";
}

type PatientJourneyType = "inpatient" | "outpatient" | "emergency";

type Journeys = {
  [key in PatientJourneyType]: JourneyStep[];
}

export default function IntegrationFlowPage() {
  const [patientType, setPatientType] = useState<PatientJourneyType>("inpatient");
  const [activeStep, setActiveStep] = useState(0);

  // Define different patient journeys based on type
  const journeys: Journeys = {
    inpatient: [
      {
        step: "Registration",
        message: "A01 - Patient Admission",
        systems: ["Patient Administration System (PAS)", "Electronic Medical Record (EMR)"],
        downstreamSystems: ["Billing System", "Bed Management", "Food Service System", "Pharmacy System"],
        data: ["Patient Demographics", "Insurance Information", "Primary Diagnosis"],
        timeframe: "Real-time",
        risk: "Low"
      },
      {
        step: "Bed Movement",
        message: "A02 - Patient Transfer",
        systems: ["Patient Administration System (PAS)", "Bed Management System", "EMR"],
        downstreamSystems: ["Food Service System", "Nursing Assignment System"],
        data: ["Bed Location", "Department", "Care Level"],
        timeframe: "Real-time",
        risk: "Medium"
      },
      {
        step: "Physician Orders",
        message: "O01 - Order Message",
        systems: ["Patient Administration System (PAS)", "Computerized Physician Order Entry (CPOE)", "EMR"],
        downstreamSystems: ["Pharmacy System", "Laboratory System", "Radiology System", "Food Service System"],
        data: ["Medication Orders", "Lab Orders", "Diet Orders", "Activity Orders"],
        timeframe: "Real-time",
        risk: "High"
      },
      {
        step: "Medication Administration",
        message: "RAS - Pharmacy/Treatment Administration",
        systems: ["Patient Administration System (PAS)", "Pharmacy System", "Medication Administration Record"],
        downstreamSystems: ["Billing System", "EMR"],
        data: ["Medication Details", "Administration Time", "Administering Staff"],
        timeframe: "Real-time",
        risk: "High"
      },
      {
        step: "Discharge Planning",
        message: "A03 - Patient Discharge",
        systems: ["Patient Administration System (PAS)", "EMR"],
        downstreamSystems: ["Billing System", "Bed Management", "Food Service System", "Pharmacy System"],
        data: ["Discharge Summary", "Follow-up Instructions", "Prescriptions"],
        timeframe: "Real-time",
        risk: "Medium"
      }
    ],
    outpatient: [
      {
        step: "Appointment Scheduling",
        message: "SIU - Schedule Information Unsolicited",
        systems: ["Patient Administration System (PAS)", "Scheduling System"],
        downstreamSystems: ["EMR", "Billing System"],
        data: ["Appointment Time", "Provider", "Clinic Location"],
        timeframe: "Real-time",
        risk: "Low"
      },
      {
        step: "Check-in",
        message: "ADT^A04 - Registration",
        systems: ["Patient Administration System (PAS)", "EMR"],
        downstreamSystems: ["Billing System"],
        data: ["Patient Demographics", "Insurance Verification"],
        timeframe: "Real-time",
        risk: "Low"
      },
      {
        step: "Clinician Visit",
        message: "MDM - Medical Document Management",
        systems: ["Patient Administration System (PAS)", "EMR"],
        downstreamSystems: ["Billing System", "Lab System", "Radiology System"],
        data: ["Clinical Notes", "Diagnoses", "Orders"],
        timeframe: "Real-time",
        risk: "Medium"
      },
      {
        step: "Check-out",
        message: "BAR - Billing Account Record",
        systems: ["Patient Administration System (PAS)", "Billing System"],
        downstreamSystems: ["EMR", "Claims Management System"],
        data: ["Charges", "Follow-up Appointment"],
        timeframe: "Real-time",
        risk: "Low"
      }
    ],
    emergency: [
      {
        step: "Emergency Registration",
        message: "ADT^A04 - Emergency Registration",
        systems: ["Patient Administration System (PAS)", "Emergency Department System", "EMR"],
        downstreamSystems: ["Billing System", "Bed Management"],
        data: ["Patient Demographics", "Chief Complaint", "Triage Level"],
        timeframe: "Real-time",
        risk: "High"
      },
      {
        step: "Triage Assessment",
        message: "ORU - Observation Result",
        systems: ["Patient Administration System (PAS)", "Emergency Department System", "EMR"],
        downstreamSystems: ["Bed Management", "Clinical Decision Support"],
        data: ["Vital Signs", "Triage Assessment", "Priority Level"],
        timeframe: "Real-time",
        risk: "High"
      },
      {
        step: "Diagnostic Orders",
        message: "ORM - Order Message",
        systems: ["Patient Administration System (PAS)", "Emergency Department System", "CPOE"],
        downstreamSystems: ["Laboratory System", "Radiology System", "Pharmacy System"],
        data: ["Lab Orders", "Imaging Orders", "Medication Orders"],
        timeframe: "STAT/Real-time",
        risk: "Critical"
      },
      {
        step: "Disposition Decision",
        message: "ADT^A06 - Transfer or ADT^A03 - Discharge",
        systems: ["Patient Administration System (PAS)", "Emergency Department System", "EMR"],
        downstreamSystems: ["Bed Management", "Billing System"],
        data: ["Disposition Plan", "Admission or Discharge Orders"],
        timeframe: "Real-time",
        risk: "High"
      }
    ]
  };

  const currentJourney = journeys[patientType];

  const handleNext = () => {
    if (activeStep < currentJourney.length - 1) {
      setActiveStep(activeStep + 1);
    }
  };

  const handlePrevious = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
    }
  };

  const handleReset = () => {
    setActiveStep(0);
  };

  const getRiskColor = (risk: JourneyStep['risk']): string => {
    switch(risk) {
      case 'Low':
        return 'bg-green-100 text-green-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'High':
        return 'bg-orange-100 text-orange-800';
      case 'Critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-neutral-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:py-20 lg:px-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">Integration Flow</h2>
            <p className="mt-4 text-lg text-gray-500">
              Select a patient journey type to visualize how different healthcare systems interact 
              through HL7 messages across the care process.
            </p>
            
            <div className="mt-8 flex flex-col space-y-4">
              <Link href="/resources">
                <Button variant="outline" className="inline-flex items-center w-full sm:w-auto">
                  <span className="material-icons mr-1 text-sm">arrow_back</span>
                  Back to Resources
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="mt-12 lg:mt-0 lg:col-span-2">
            <Card className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex items-center mb-6">
                <span className="material-icons text-primary mr-2 text-2xl">diagram</span>
                <h2 className="text-xl font-semibold text-gray-800">Patient Journey Integration Flow</h2>
              </div>
              
              {/* Configuration Section */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h3 className="text-lg font-medium text-gray-700 mb-3">Configuration</h3>
                <div className="flex flex-wrap gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Patient Type</label>
                    <div className="flex flex-wrap gap-4">
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                          checked={patientType === 'inpatient'}
                          onChange={() => {setPatientType('inpatient'); setActiveStep(0);}}
                        />
                        <span className="ml-2">Inpatient</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                          checked={patientType === 'outpatient'}
                          onChange={() => {setPatientType('outpatient'); setActiveStep(0);}}
                        />
                        <span className="ml-2">Outpatient</span>
                      </label>
                      <label className="inline-flex items-center">
                        <input
                          type="radio"
                          className="h-4 w-4 text-primary border-gray-300 focus:ring-primary"
                          checked={patientType === 'emergency'}
                          onChange={() => {setPatientType('emergency'); setActiveStep(0);}}
                        />
                        <span className="ml-2">Emergency</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Journey Steps Navigation */}
              <div className="flex mb-6 overflow-x-auto pb-2">
                {currentJourney.map((step: JourneyStep, index: number) => (
                  <div 
                    key={index} 
                    className={`flex items-center ${index === currentJourney.length - 1 ? '' : 'mr-2'}`}
                  >
                    <div 
                      className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-colors
                        ${index === activeStep ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                      onClick={() => setActiveStep(index)}
                    >
                      {step.step}
                    </div>
                    {index < currentJourney.length - 1 && (
                      <span className="material-icons mx-1 text-gray-400 text-sm">chevron_right</span>
                    )}
                  </div>
                ))}
              </div>
              
              {/* Current Step Details */}
              <div className="mb-6 p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-bold text-gray-800">{currentJourney[activeStep].step}</h3>
                  <div className="flex items-center">
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getRiskColor(currentJourney[activeStep].risk)}`}>
                      {currentJourney[activeStep].risk} Risk
                    </div>
                  </div>
                </div>
                
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center mb-2">
                    <span className="material-icons text-primary mr-2">timeline</span>
                    <h4 className="font-semibold text-gray-800">HL7 Message Trigger: {currentJourney[activeStep].message}</h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    This step initiates HL7 messages that flow between systems to ensure coordinated patient care.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center text-gray-700">
                      <span className="material-icons text-gray-500 mr-2">dns</span>
                      Primary Systems
                    </h4>
                    <ul className="space-y-2">
                      {currentJourney[activeStep].systems.map((system: string, idx: number) => (
                        <li key={idx} className="flex items-center bg-gray-100 p-2 rounded">
                          <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                          <span className="text-gray-800">{system}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center text-gray-700">
                      <span className="material-icons text-gray-500 mr-2">schedule</span>
                      Integration Timeframe
                    </h4>
                    <div className="bg-gray-100 p-3 rounded mb-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold
                        ${currentJourney[activeStep].timeframe.includes('Real-time') ? 'bg-green-100 text-green-800' : 
                          'bg-yellow-100 text-yellow-800'}`}>
                        {currentJourney[activeStep].timeframe}
                      </span>
                    </div>
                    
                    <h4 className="font-semibold mb-3 flex items-center text-gray-700">
                      <span className="material-icons text-gray-500 mr-2">warning</span>
                      Critical Data Elements
                    </h4>
                    <ul className="bg-gray-100 p-3 rounded">
                      {currentJourney[activeStep].data.map((item: string, idx: number) => (
                        <li key={idx} className="mb-1 text-gray-700 flex items-center">
                          <span className="material-icons text-primary mr-1 text-sm">arrow_right</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h4 className="font-semibold mb-3 text-gray-700">Downstream Systems Impact</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {currentJourney[activeStep].downstreamSystems.map((system: string, idx: number) => (
                      <div key={idx} className="bg-gray-50 border border-gray-200 rounded p-2 text-sm text-center text-gray-700">
                        {system}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Navigation Buttons */}
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={activeStep === 0}
                  className={`${activeStep === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span className="material-icons mr-1 text-sm">arrow_back</span>
                  Previous
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleReset}
                >
                  <span className="material-icons mr-1 text-sm">refresh</span>
                  Reset
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleNext}
                  disabled={activeStep === currentJourney.length - 1}
                  className={`${activeStep === currentJourney.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Next
                  <span className="material-icons ml-1 text-sm">arrow_forward</span>
                </Button>
              </div>
              
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-700 mb-4">Understanding HL7 Message Flow</h3>
                <p className="text-gray-600">
                  HL7 messages are triggered by specific events in the patient journey. Each message type serves 
                  a distinct purpose in communicating clinical and administrative information between systems.
                </p>
                <div className="mt-4">
                  <Link href="/reference-guides">
                    <Button variant="outline" className="inline-flex items-center">
                      View Message Type Reference
                      <span className="material-icons ml-1 text-sm">open_in_new</span>
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}