import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Link } from "wouter";

export default function IntegrationFlowPage() {
  const [selectedTab, setSelectedTab] = useState("inpatient");

  return (
    <div className="bg-neutral-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:py-20 lg:px-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">Integration Flow Visualization</h2>
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
              
              <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-8">
                  <TabsTrigger value="inpatient">Inpatient</TabsTrigger>
                  <TabsTrigger value="outpatient">Outpatient</TabsTrigger>
                  <TabsTrigger value="emergency">Emergency</TabsTrigger>
                </TabsList>
                
                <TabsContent value="inpatient" className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-700">Inpatient Journey</h3>
                  <p className="text-gray-600">
                    Inpatient journeys typically involve longer stays and more complex interactions between healthcare systems.
                  </p>
                  
                  <div className="mt-6 p-4 border border-gray-200 rounded-md bg-gray-50">
                    <p className="text-sm text-gray-500 mb-2">Integration flow diagram will be displayed here</p>
                    <div className="h-64 flex items-center justify-center border border-dashed border-gray-300 rounded-md">
                      <p className="text-gray-400">Inpatient flow visualization coming soon</p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="text-md font-medium text-gray-700 mb-2">Key Systems & Messages</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <span className="material-icons text-primary mr-2 text-sm">arrow_right</span>
                        <p className="text-gray-600">ADT^A01 (Admission) from Registration to EMR, Lab, Radiology</p>
                      </li>
                      <li className="flex items-start">
                        <span className="material-icons text-primary mr-2 text-sm">arrow_right</span>
                        <p className="text-gray-600">ORM^O01 (Order) from EMR to Ancillary Systems</p>
                      </li>
                      <li className="flex items-start">
                        <span className="material-icons text-primary mr-2 text-sm">arrow_right</span>
                        <p className="text-gray-600">ORU^R01 (Results) from Lab/Radiology back to EMR</p>
                      </li>
                      <li className="flex items-start">
                        <span className="material-icons text-primary mr-2 text-sm">arrow_right</span>
                        <p className="text-gray-600">ADT^A03 (Discharge) from Registration to all connected systems</p>
                      </li>
                    </ul>
                  </div>
                </TabsContent>
                
                <TabsContent value="outpatient" className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-700">Outpatient Journey</h3>
                  <p className="text-gray-600">
                    Outpatient journeys are typically shorter and involve scheduling, clinic visits, and follow-up care.
                  </p>
                  
                  <div className="mt-6 p-4 border border-gray-200 rounded-md bg-gray-50">
                    <p className="text-sm text-gray-500 mb-2">Integration flow diagram will be displayed here</p>
                    <div className="h-64 flex items-center justify-center border border-dashed border-gray-300 rounded-md">
                      <p className="text-gray-400">Outpatient flow visualization coming soon</p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="text-md font-medium text-gray-700 mb-2">Key Systems & Messages</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <span className="material-icons text-primary mr-2 text-sm">arrow_right</span>
                        <p className="text-gray-600">SIU^S12 (Appointment Booking) from Scheduling to EMR</p>
                      </li>
                      <li className="flex items-start">
                        <span className="material-icons text-primary mr-2 text-sm">arrow_right</span>
                        <p className="text-gray-600">ADT^A04 (Registration) from Registration to EMR and other systems</p>
                      </li>
                      <li className="flex items-start">
                        <span className="material-icons text-primary mr-2 text-sm">arrow_right</span>
                        <p className="text-gray-600">ORM^O01 (Orders) from EMR to Pharmacy, Lab</p>
                      </li>
                      <li className="flex items-start">
                        <span className="material-icons text-primary mr-2 text-sm">arrow_right</span>
                        <p className="text-gray-600">MDM^T02 (Document) from EMR to Document Management</p>
                      </li>
                    </ul>
                  </div>
                </TabsContent>
                
                <TabsContent value="emergency" className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-700">Emergency Journey</h3>
                  <p className="text-gray-600">
                    Emergency journeys require rapid information exchange between multiple systems to support critical care decisions.
                  </p>
                  
                  <div className="mt-6 p-4 border border-gray-200 rounded-md bg-gray-50">
                    <p className="text-sm text-gray-500 mb-2">Integration flow diagram will be displayed here</p>
                    <div className="h-64 flex items-center justify-center border border-dashed border-gray-300 rounded-md">
                      <p className="text-gray-400">Emergency flow visualization coming soon</p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="text-md font-medium text-gray-700 mb-2">Key Systems & Messages</h4>
                    <ul className="space-y-2">
                      <li className="flex items-start">
                        <span className="material-icons text-primary mr-2 text-sm">arrow_right</span>
                        <p className="text-gray-600">ADT^A04 (Registration) from ED Registration to EMR, Tracking Board</p>
                      </li>
                      <li className="flex items-start">
                        <span className="material-icons text-primary mr-2 text-sm">arrow_right</span>
                        <p className="text-gray-600">ORM^O01 (STAT Orders) from EMR to Lab, Radiology, Pharmacy</p>
                      </li>
                      <li className="flex items-start">
                        <span className="material-icons text-primary mr-2 text-sm">arrow_right</span>
                        <p className="text-gray-600">ORU^R01 (Critical Results) from Lab to EMR</p>
                      </li>
                      <li className="flex items-start">
                        <span className="material-icons text-primary mr-2 text-sm">arrow_right</span>
                        <p className="text-gray-600">ADT^A06 (Transfer) or ADT^A03 (Discharge) from ED to Inpatient or Home</p>
                      </li>
                    </ul>
                  </div>
                </TabsContent>
              </Tabs>
              
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