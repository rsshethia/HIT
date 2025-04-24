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
    },
    {
      title: "Mini Reference Guides",
      description: "Quick reference guides for common HL7 message types including ADT, SIU, ORM, and ORU messages used in healthcare integration.",
      link: "/reference-guides",
      category: "Education",
      isInternalLink: true
    },
    {
      title: "Integration Flow",
      description: "Visualize integration flows based on patient type. This visualization tool demonstrates how selecting different patient journeys reveals the systems integration touchpoints triggered by HL7 messages throughout the care process.",
      link: "/integration-flow",
      category: "Education",
      isInternalLink: true
    },
    {
      title: "D3.js Data Visualizations",
      description: "Interactive visualization components for assessment data. Explore pie charts, bar charts, and radar diagrams for visualizing integration metrics and assessment results.",
      link: "/visualizations",
      category: "Education",
      isInternalLink: true
    },
    {
      title: "Integration Mapping Tool",
      description: "Create interactive visualizations of your healthcare system integrations. Map system connections, specify data flow directions, and generate network diagrams, matrices, and Sankey diagrams.",
      link: "/integration-mapping",
      category: "Education",
      isInternalLink: true
    }
  ];

  // Filter resources to hide specific items
  const filteredResources = resources.filter(resource => 
    resource.title !== "HL7 Version 2" && 
    resource.title !== "IHE Profiles" &&
    resource.category !== "Tools" && 
    resource.category !== "Frameworks"
  );

  // Create a sorted array of categories with Education first and hide Tools and Frameworks
  const allCategories = Array.from(new Set(filteredResources.map(resource => resource.category)));
  const categories = [
    // Put Education first if it exists
    ...allCategories.filter(cat => cat === "Education"),
    // Then add all other categories except Tools and Frameworks
    ...allCategories.filter(cat => cat !== "Education")
  ];

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
                  {filteredResources
                    .filter(resource => resource.category === category)
                    .map(resource => (
                      <Card key={resource.title} className="p-6 border border-gray-200 rounded-lg shadow-sm hover:shadow">
                        <h4 className="text-lg font-medium text-gray-900">{resource.title}</h4>
                        <p className="mt-2 text-base text-gray-500">{resource.description}</p>
                        <div className="mt-4">
                          {resource.isInternalLink ? (
                            <Link 
                              href={resource.link}
                              className="text-primary hover:text-primary-700 font-medium flex items-center"
                            >
                              Learn more
                              <span className="material-icons ml-1 text-sm">arrow_forward</span>
                            </Link>
                          ) : (
                            <a 
                              href={resource.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary-700 font-medium flex items-center"
                            >
                              Learn more
                              <span className="material-icons ml-1 text-sm">arrow_forward</span>
                            </a>
                          )}
                        </div>
                      </Card>
                    ))}
                </div>
              </div>
            ))}


            
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