import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function ReferenceGuidesPage() {
  return (
    <div className="bg-neutral-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:py-20 lg:px-8">
        <div className="mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-8">Mini Reference Guides</h2>
          <p className="text-lg text-gray-600 mb-6">
            Quick reference guides for common healthcare integration message types and standards. These guides are designed to provide a handy reference for integration professionals working with healthcare systems.
          </p>
          
          <div className="mb-12">
            <Link href="/resources">
              <Button variant="outline" className="inline-flex items-center w-full sm:w-auto">
                <span className="material-icons mr-1 text-sm">arrow_back</span>
                Back to Resources
              </Button>
            </Link>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Common HL7 Message Types for PAS</h3>
            
            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-800 mb-3">ADT (Admission, Discharge, Transfer) Messages</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Type</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Common Use</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PDF Guide</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">ADT^A01</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Admit/Visit Notification</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">New patient admission</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        <a 
                          href="/guides/adt-a01-guide.html" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary-700 flex items-center"
                        >
                          <span className="material-icons text-sm mr-1">picture_as_pdf</span>
                          View Guide
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">ADT^A02</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Transfer a Patient</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Move patient between locations</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        <a 
                          href="/guides/adt-a02-guide.html" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary-700 flex items-center"
                        >
                          <span className="material-icons text-sm mr-1">picture_as_pdf</span>
                          View Guide
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">ADT^A03</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Discharge/End Visit</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Patient discharge</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        <a 
                          href="/guides/adt-a03-guide.html" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary-700 flex items-center"
                        >
                          <span className="material-icons text-sm mr-1">picture_as_pdf</span>
                          View Guide
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">ADT^A04</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Register a Patient</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Outpatient registration</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        <a 
                          href="/guides/adt-a04-guide.html" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary-700 flex items-center"
                        >
                          <span className="material-icons text-sm mr-1">picture_as_pdf</span>
                          View Guide
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">ADT^A05</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Pre-admit a Patient</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Pre-admission registration</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        <a 
                          href="/guides/adt-a05-guide.html" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary-700 flex items-center"
                        >
                          <span className="material-icons text-sm mr-1">picture_as_pdf</span>
                          View Guide
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">ADT^A08</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Update Patient Information</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Demographics update</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        <a 
                          href="/guides/adt-a08-guide.html" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary-700 flex items-center"
                        >
                          <span className="material-icons text-sm mr-1">picture_as_pdf</span>
                          View Guide
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">ADT^A11</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Cancel Admission</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Cancel an admission</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        <span className="text-gray-400 flex items-center">
                          <span className="material-icons text-sm mr-1">schedule</span>
                          Coming soon
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">ADT^A13</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Cancel Discharge</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Undo a discharge</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        <span className="text-gray-400 flex items-center">
                          <span className="material-icons text-sm mr-1">schedule</span>
                          Coming soon
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">ADT^A28</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Add Person Information</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Add patient record</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        <span className="text-gray-400 flex items-center">
                          <span className="material-icons text-sm mr-1">schedule</span>
                          Coming soon
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">ADT^A31</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Update Person Information</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Update demographics</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        <a 
                          href="/guides/adt-a31-guide.html" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary-700 flex items-center"
                        >
                          <span className="material-icons text-sm mr-1">picture_as_pdf</span>
                          View Guide
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">ADT^A40</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Merge Patient - Patient ID</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Link patient records</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        <span className="text-gray-400 flex items-center">
                          <span className="material-icons text-sm mr-1">schedule</span>
                          Coming soon
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-800 mb-3">SIU (Scheduling Information Unsolicited) Messages</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Type</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Guide</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">SIU^S12</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Request New Appointment</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Schedule patient visits</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        <a 
                          href="/guides/siu-s12-guide.html" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary-700 flex items-center"
                        >
                          <span className="material-icons text-sm mr-1">picture_as_pdf</span>
                          View Guide
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">SIU^S13</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Notification of Appointment Rescheduling</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Reschedule appointments</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        <span className="text-gray-400 flex items-center">
                          <span className="material-icons text-sm mr-1">schedule</span>
                          Coming soon
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">SIU^S14</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Notification of Appointment Modification</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Modify appointment details</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        <span className="text-gray-400 flex items-center">
                          <span className="material-icons text-sm mr-1">schedule</span>
                          Coming soon
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">SIU^S15</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Notification of Appointment Cancellation</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Cancel scheduled visits</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        <span className="text-gray-400 flex items-center">
                          <span className="material-icons text-sm mr-1">schedule</span>
                          Coming soon
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">SIU^S17</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Notification of Appointment Addition</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-medium text-gray-800 mb-3">ORM (Order Message) & ORU (Observation Result)</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message Type</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Guide</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">ORM^O01</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">General Order Message</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Place lab/radiology orders</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        <a 
                          href="/guides/orm-o01-guide.html" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary-700 flex items-center"
                        >
                          <span className="material-icons text-sm mr-1">picture_as_pdf</span>
                          View Guide
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">ORU^R01</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Observation Result</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Return test results</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        <a 
                          href="/guides/oru-r01-guide.html" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary-700 flex items-center"
                        >
                          <span className="material-icons text-sm mr-1">picture_as_pdf</span>
                          View Guide
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Visual separator */}
            <div className="my-8 border-t-2 border-gray-200"></div>

            <div className="mb-6">
              <h4 className="text-lg font-medium text-gray-800 mb-3">SQL T-SQL Stored Procedure Reference</h4>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Procedure Name</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Guide</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">sp_SaveRawHL7Message</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Save RAW HL7 Message</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Store complete HL7 message for audit and processing</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        <a 
                          href="/guides/sp-save-raw-hl7-guide.html" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary-700 flex items-center"
                        >
                          <span className="material-icons text-sm mr-1">code</span>
                          View Guide
                        </a>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">sp_ExtractUpdatePID</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Extract and Insert/Update PID Segment</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Parse PID segment and update patient demographics</td>
                      <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                        <a 
                          href="/guides/sp-extract-update-pid-guide.html" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary-700 flex items-center"
                        >
                          <span className="material-icons text-sm mr-1">code</span>
                          View Guide
                        </a>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}