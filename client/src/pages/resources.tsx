import { Card } from "@/components/ui/card";
import { Link } from "wouter";

export default function ResourcesPage() {
  const resources = [
    {
      title: "HL7 FHIR",
      description: "Fast Healthcare Interoperability Resources (FHIR) is a standard for healthcare data exchange, published by HL7.",
      link: "https://www.hl7.org/fhir/",
      category: "Standards"
    },
    {
      title: "HL7 Version 2",
      description: "The most widely implemented standard for healthcare information exchange between systems.",
      link: "https://www.hl7.org/implement/standards/product_brief.cfm?product_id=185",
      category: "Standards"
    },
    {
      title: "IHE Profiles",
      description: "Integrating the Healthcare Enterprise (IHE) provides integration profiles that define specific implementations of standards.",
      link: "https://www.ihe.net/resources/profiles/",
      category: "Standards"
    },
    {
      title: "DICOM",
      description: "Digital Imaging and Communications in Medicine (DICOM) is the standard for medical imaging information.",
      link: "https://www.dicomstandard.org/",
      category: "Standards"
    },
    {
      title: "ONC Interoperability Framework",
      description: "The Office of the National Coordinator for Health IT (ONC) provides frameworks for interoperability.",
      link: "https://www.healthit.gov/topic/interoperability",
      category: "Frameworks"
    },
    {
      title: "HIMSS Interoperability Showcase",
      description: "Healthcare Information and Management Systems Society (HIMSS) showcases interoperability solutions.",
      link: "https://www.himss.org/event-interoperability-showcase",
      category: "Frameworks"
    },
    {
      title: "HealthIT.gov Resources",
      description: "Resources and tools for healthcare IT professionals from the U.S. government.",
      link: "https://www.healthit.gov/topic/health-it-basics/health-it-resources",
      category: "Tools"
    },
    {
      title: "Mirth Connect",
      description: "An open-source integration engine specifically designed for healthcare.",
      link: "https://www.nextgen.com/products-and-services/integration-engine",
      category: "Tools"
    }
  ];

  const categories = Array.from(new Set(resources.map(resource => resource.category)));

  return (
    <div className="bg-neutral-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:py-20 lg:px-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">Integration Resources</h2>
            <p className="mt-4 text-lg text-gray-500">
              Explore these resources to help improve your healthcare integration capabilities and maturity.
            </p>
          </div>
          <div className="mt-12 lg:mt-0 lg:col-span-2">
            {categories.map(category => (
              <div key={category} className="mb-12">
                <h3 className="text-xl font-bold text-gray-900 mb-6">{category}</h3>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {resources
                    .filter(resource => resource.category === category)
                    .map(resource => (
                      <Card key={resource.title} className="p-6 border border-gray-200 rounded-lg shadow-sm hover:shadow">
                        <h4 className="text-lg font-medium text-gray-900">{resource.title}</h4>
                        <p className="mt-2 text-base text-gray-500">{resource.description}</p>
                        <div className="mt-4">
                          <a 
                            href={resource.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary-700 font-medium flex items-center"
                          >
                            Learn more
                            <span className="material-icons ml-1 text-sm">arrow_forward</span>
                          </a>
                        </div>
                      </Card>
                    ))}
                </div>
              </div>
            ))}

            {/* Mini Reference Guides */}
            <div className="mb-12">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Mini Reference Guides</h3>
              
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-8">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Common HL7 Message Types for PAS</h4>
                
                <div className="mb-6">
                  <h5 className="text-base font-medium text-gray-800 mb-3">ADT (Admission, Discharge, Transfer) Messages</h5>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Type</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Common Use</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">ADT^A01</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Admit/Visit Notification</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">New patient admission</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">ADT^A02</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Transfer a Patient</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Move patient between locations</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">ADT^A03</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Discharge/End Visit</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Patient discharge</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">ADT^A04</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Register a Patient</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Outpatient registration</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">ADT^A05</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Pre-admit a Patient</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Pre-admission registration</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">ADT^A08</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Update Patient Information</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Demographics update</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">ADT^A11</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Cancel Admission</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Cancel an admission</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">ADT^A13</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Cancel Discharge</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Undo a discharge</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">ADT^A28</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Add Person Information</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Add patient record</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">ADT^A31</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Update Person Information</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Update demographics</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">ADT^A40</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Merge Patient - Patient ID</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Link patient records</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="mb-6">
                  <h5 className="text-base font-medium text-gray-800 mb-3">SIU (Scheduling Information Unsolicited) Messages</h5>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Event Type</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">SIU^S12</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Notification of New Appointment</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">SIU^S13</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Notification of Appointment Rescheduling</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">SIU^S14</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Notification of Appointment Modification</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">SIU^S15</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Notification of Appointment Cancellation</td>
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
                  <h5 className="text-base font-medium text-gray-800 mb-3">ORM (Order Message) & ORU (Observation Result)</h5>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message Type</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        <tr>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">ORM^O01</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">General Order Message</td>
                        </tr>
                        <tr>
                          <td className="px-4 py-2 whitespace-nowrap text-sm font-medium text-gray-900">ORU^R01</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">Observation Result</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-12 bg-primary-50 p-6 rounded-lg border border-primary-100">
              <h3 className="text-lg font-medium text-gray-900">Want to improve your integration maturity?</h3>
              <p className="mt-2 text-base text-gray-600">
                Take our assessment to evaluate your current integration capabilities and get personalized recommendations for improvement.
              </p>
              <div className="mt-6">
                <Link
                  href="/assessment"
                  className="inline-flex items-center px-5 py-2 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary-700"
                >
                  <span className="material-icons mr-2">assessment</span>
                  Start Assessment
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}