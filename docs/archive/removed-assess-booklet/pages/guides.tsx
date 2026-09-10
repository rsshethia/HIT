import React, { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function GuidesPage() {
  const [activeTab, setActiveTab] = useState('organization');

  return (
    <div className="bg-neutral-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:py-20 lg:px-8">
        <div className="mb-12">
          <div className="flex items-center mb-6">
            <Link href="/">
              <Button variant="outline" className="mr-4">
                <span className="material-icons mr-1 text-sm">arrow_back</span>
                Back
              </Button>
            </Link>
            <div>
              <h2 className="text-3xl font-extrabold text-gray-900">Integration Guides</h2>
              <p className="mt-2 text-lg text-gray-600">
                Best practices and reference guides for healthcare integration at all levels
              </p>
            </div>
          </div>

          <Tabs defaultValue="organization" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-8">
              <TabsTrigger value="organization">Organization Level</TabsTrigger>
              <TabsTrigger value="system">System Level</TabsTrigger>
              <TabsTrigger value="interface">Interface Level</TabsTrigger>
            </TabsList>

            <TabsContent value="organization" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Organization Level Integration Guidelines</CardTitle>
                  <CardDescription>
                    Best practices for establishing a robust integration ecosystem at the organizational level
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="org-gov">
                      <AccordionTrigger>Integration Governance</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 text-gray-700">
                          <p>
                            <strong>Integration governance</strong> establishes how your organization 
                            makes decisions about integrations, including policies, processes, and 
                            roles & responsibilities.
                          </p>
                          <h4 className="font-semibold text-lg">Key Components:</h4>
                          <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Integration Steering Committee</strong> - Cross-functional team 
                            responsible for integration strategy and oversight</li>
                            <li><strong>Integration Policies</strong> - Documentation for standards, security, 
                            data quality, and maintenance schedules</li>
                            <li><strong>Change Management Process</strong> - Defined procedures for integration 
                            changes with impact analysis</li>
                            <li><strong>Integration Inventory</strong> - Centralized repository of all 
                            integration points with documentation</li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="org-arch">
                      <AccordionTrigger>Integration Architecture</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 text-gray-700">
                          <p>
                            <strong>Integration architecture</strong> defines the overall structure, patterns, 
                            and technology choices for your healthcare integration ecosystem.
                          </p>
                          <h4 className="font-semibold text-lg">Key Architectures:</h4>
                          <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Hub-and-Spoke</strong> - Centralized integration engine connects to 
                            multiple systems (like a wheel)</li>
                            <li><strong>Service Bus</strong> - Enterprise messaging backbone for all application 
                            communications</li>
                            <li><strong>Point-to-Point</strong> - Direct connections between systems (avoid at scale)</li>
                            <li><strong>API-led</strong> - Modern approach using RESTful APIs with management layer</li>
                          </ul>
                          <p className="mt-2">
                            Healthcare organizations typically benefit from a hybrid approach, with an 
                            integration engine for HL7v2, combined with API management for modern interfaces.
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="org-team">
                      <AccordionTrigger>Integration Team Structure</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 text-gray-700">
                          <p>
                            <strong>Integration teams</strong> are specialized resources that design, implement, 
                            monitor, and maintain integration solutions.
                          </p>
                          <h4 className="font-semibold text-lg">Common Roles:</h4>
                          <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Integration Architect</strong> - Designs integration patterns and sets standards</li>
                            <li><strong>Interface Analysts</strong> - Develops and maintains specific interfaces</li>
                            <li><strong>Integration Support</strong> - Monitors and troubleshoots production integrations</li>
                            <li><strong>Clinical Informatics</strong> - Ensures clinical data requirements are met</li>
                          </ul>
                          <p className="mt-2">
                            For healthcare organizations, having staff with both technical integration 
                            skills and healthcare domain knowledge is critical for successful integrations.
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="org-roadmap">
                      <AccordionTrigger>Integration Roadmap Development</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 text-gray-700">
                          <p>
                            An <strong>integration roadmap</strong> is a strategic plan that outlines how your 
                            integration capabilities will evolve over time.
                          </p>
                          <h4 className="font-semibold text-lg">Key Components:</h4>
                          <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Current State Assessment</strong> - Documentation of existing integrations and pain points</li>
                            <li><strong>Future State Vision</strong> - Target architecture and capabilities</li>
                            <li><strong>Gap Analysis</strong> - What needs to change to reach future state</li>
                            <li><strong>Prioritized Initiatives</strong> - Specific projects with timeline and dependencies</li>
                          </ul>
                          <p className="mt-2">
                            Effective roadmaps align integration initiatives with organizational 
                            strategic goals and clinical/business priorities.
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="system" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Level Integration Guidelines</CardTitle>
                  <CardDescription>
                    Best practices for integrating specific systems within your healthcare environment
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="sys-ehr">
                      <AccordionTrigger>EHR Integration Patterns</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 text-gray-700">
                          <p>
                            <strong>Electronic Health Record (EHR) systems</strong> are typically the central hub of 
                            healthcare IT environments and require specific integration approaches.
                          </p>
                          <h4 className="font-semibold text-lg">Common EHR Integration Patterns:</h4>
                          <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Inbound ADT Feed</strong> - Patient demographics and visit information</li>
                            <li><strong>Results Integration</strong> - Lab, radiology, and other diagnostic results</li>
                            <li><strong>Order Transmission</strong> - Computerized provider order entry (CPOE)</li>
                            <li><strong>Medication Reconciliation</strong> - Pharmacy and medication management</li>
                            <li><strong>Clinical Document Exchange</strong> - CDA, C-CDA for patient records</li>
                            <li><strong>FHIR API Access</strong> - Modern API access to discrete clinical data</li>
                          </ul>
                          <p className="mt-2">
                            Major EHR vendors (Epic, Cerner, Meditech, etc.) each have their own 
                            specific integration capabilities and limitations to consider.
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="sys-ancillary">
                      <AccordionTrigger>Ancillary System Integration</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 text-gray-700">
                          <p>
                            <strong>Ancillary systems</strong> are specialized healthcare applications that 
                            provide key departmental functions and must integrate with core clinical systems.
                          </p>
                          <h4 className="font-semibold text-lg">Key Ancillary Systems:</h4>
                          <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Laboratory Information Systems (LIS)</strong> - Lab order/results management</li>
                            <li><strong>Radiology Information Systems (RIS)</strong> - Imaging workflow</li>
                            <li><strong>Pharmacy Management Systems</strong> - Medication management</li>
                            <li><strong>PACS</strong> - Picture archiving and communication systems</li>
                            <li><strong>Patient Administration System (PAS)</strong> - ADT management</li>
                          </ul>
                          <p className="mt-2">
                            Integration with ancillary systems typically involves bidirectional 
                            messaging for orders and results, with HL7v2 remaining the dominant standard.
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="sys-revenue">
                      <AccordionTrigger>Revenue Cycle Integration</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 text-gray-700">
                          <p>
                            <strong>Revenue cycle management (RCM) systems</strong> handle the financial 
                            aspects of healthcare and must be tightly integrated with clinical systems.
                          </p>
                          <h4 className="font-semibold text-lg">Key RCM Integration Points:</h4>
                          <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Patient Registration</strong> - Demographics, insurance verification</li>
                            <li><strong>Charge Capture</strong> - Converting clinical activities to billable charges</li>
                            <li><strong>Claims Management</strong> - Preparing, submitting, and tracking claims</li>
                            <li><strong>Payment Posting</strong> - Recording and reconciling payments</li>
                            <li><strong>Denial Management</strong> - Tracking and appealing claim denials</li>
                          </ul>
                          <p className="mt-2">
                            Successful RCM integration requires careful attention to billing codes, 
                            insurance rules, and financial data quality to minimize denials.
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="sys-interop">
                      <AccordionTrigger>Health Information Exchange</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 text-gray-700">
                          <p>
                            <strong>Health Information Exchange (HIE)</strong> enables sharing of clinical 
                            information across different healthcare organizations.
                          </p>
                          <h4 className="font-semibold text-lg">HIE Integration Approaches:</h4>
                          <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Document Exchange</strong> - C-CDA, CDA documents for patient records</li>
                            <li><strong>Query-based Exchange</strong> - IHE XDS, XCA profiles for locating records</li>
                            <li><strong>Notifications</strong> - ADT alerts for care coordination</li>
                            <li><strong>API-based Access</strong> - FHIR APIs for discrete data exchange</li>
                            <li><strong>Directed Exchange</strong> - Secure email-like functionality</li>
                          </ul>
                          <p className="mt-2">
                            HIE integration generally requires robust patient matching strategies, 
                            consent management, and adherence to national interoperability frameworks.
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="interface" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Interface Level Integration Guidelines</CardTitle>
                  <CardDescription>
                    Technical standards and best practices for individual interfaces
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="int-hl7v2">
                      <AccordionTrigger>HL7v2 Messaging</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 text-gray-700">
                          <p>
                            <strong>HL7 v2.x</strong> is the most widely used healthcare integration standard, 
                            primarily for system-to-system messaging within a healthcare organization.
                          </p>
                          <h4 className="font-semibold text-lg">Common Message Types:</h4>
                          <ul className="list-disc pl-6 space-y-2">
                            <li><strong>ADT (Admission, Discharge, Transfer)</strong> - Patient demographic events</li>
                            <li><strong>ORM/OMG</strong> - Order messages</li>
                            <li><strong>ORU</strong> - Observation results (labs, etc.)</li>
                            <li><strong>SIU</strong> - Scheduling information</li>
                            <li><strong>MDM</strong> - Medical document management</li>
                            <li><strong>DFT</strong> - Detailed financial transactions</li>
                          </ul>
                          <h4 className="font-semibold text-lg mt-4">Best Practices:</h4>
                          <ul className="list-disc pl-6 space-y-2">
                            <li>Establish a consistent acknowledgment strategy (original or enhanced)</li>
                            <li>Define complete specifications with required/optional fields</li>
                            <li>Follow Z-segment naming conventions for extensions</li>
                            <li>Implement comprehensive message validation</li>
                            <li>Develop thorough test message suites with edge cases</li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="int-fhir">
                      <AccordionTrigger>FHIR Integration</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 text-gray-700">
                          <p>
                            <strong>Fast Healthcare Interoperability Resources (FHIR)</strong> is a modern 
                            standard for healthcare data exchange based on RESTful web services.
                          </p>
                          <h4 className="font-semibold text-lg">Key FHIR Concepts:</h4>
                          <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Resources</strong> - Core data structures (Patient, Observation, etc.)</li>
                            <li><strong>RESTful API</strong> - Standard HTTP operations (GET, POST, PUT, DELETE)</li>
                            <li><strong>Profiles</strong> - Constraints and extensions for specific use cases</li>
                            <li><strong>Implementation Guides</strong> - Common patterns for implementation</li>
                          </ul>
                          <h4 className="font-semibold text-lg mt-4">Integration Approaches:</h4>
                          <ul className="list-disc pl-6 space-y-2">
                            <li><strong>API Access</strong> - Direct API calls for real-time data access</li>
                            <li><strong>Bulk Data</strong> - Asynchronous bulk export/import for large datasets</li>
                            <li><strong>Subscriptions</strong> - Event-based notifications</li>
                            <li><strong>Smart on FHIR</strong> - App launch framework for EHR integration</li>
                          </ul>
                          <p className="mt-2">
                            When implementing FHIR, always specify the version (R4, etc.) and carefully 
                            document any extensions or constraints on base resources.
                          </p>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="int-dicom">
                      <AccordionTrigger>DICOM & Imaging</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 text-gray-700">
                          <p>
                            <strong>Digital Imaging and Communications in Medicine (DICOM)</strong> is 
                            the international standard for medical images and related information.
                          </p>
                          <h4 className="font-semibold text-lg">Key Components:</h4>
                          <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Image Format</strong> - Standardized format for medical images</li>
                            <li><strong>Network Protocol</strong> - DICOM services for transmission</li>
                            <li><strong>Query/Retrieve</strong> - Finding and accessing images</li>
                            <li><strong>Worklist Management</strong> - Integration with RIS/PACS workflow</li>
                            <li><strong>Storage Commitment</strong> - Confirming image archival</li>
                          </ul>
                          <h4 className="font-semibold text-lg mt-4">Integration Considerations:</h4>
                          <ul className="list-disc pl-6 space-y-2">
                            <li>Ensure sufficient network bandwidth for large image transfers</li>
                            <li>Implement proper patient identifier matching across systems</li>
                            <li>Configure appropriate compression settings for different image types</li>
                            <li>Consider web-based viewing with WADO (Web Access to DICOM Objects)</li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="int-api">
                      <AccordionTrigger>RESTful API Design</AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 text-gray-700">
                          <p>
                            <strong>RESTful APIs</strong> have become a standard approach for modern 
                            healthcare integrations beyond traditional HL7v2 messaging.
                          </p>
                          <h4 className="font-semibold text-lg">Design Best Practices:</h4>
                          <ul className="list-disc pl-6 space-y-2">
                            <li><strong>Resource-oriented URLs</strong> - /patients, /encounters, etc.</li>
                            <li><strong>Proper HTTP Methods</strong> - GET (read), POST (create), PUT (update), DELETE</li>
                            <li><strong>Consistent Response Codes</strong> - 200 OK, 201 Created, 400 Bad Request, etc.</li>
                            <li><strong>Pagination</strong> - For large result sets</li>
                            <li><strong>Filtering</strong> - Query parameters for result refinement</li>
                            <li><strong>Versioning</strong> - Strategy for API evolution</li>
                          </ul>
                          <h4 className="font-semibold text-lg mt-4">Security Requirements:</h4>
                          <ul className="list-disc pl-6 space-y-2">
                            <li>Use TLS/HTTPS for all healthcare API communications</li>
                            <li>Implement OAuth 2.0 or OpenID Connect for authorization</li>
                            <li>Consider SMART on FHIR for EHR-specific authorization</li>
                            <li>Apply rate limiting to prevent abuse</li>
                            <li>Log all API access for audit purposes</li>
                            <li>Implement data validation to prevent injection attacks</li>
                          </ul>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}