import { Card } from "@/components/ui/card";
import { usePageMeta } from "@/hooks/use-page-meta";
import { Link } from "wouter";

export default function ResourcesPage() {
  usePageMeta("/resources");
  const resources = [
    {
      title: "HL7 FHIR",
      description: "Fast Healthcare Interoperability Resources (FHIR) is a standard for healthcare data exchange, published by HL7.",
      link: "https://www.hl7.org/fhir/",
      category: "Standards"
    },
    {
      title: "DICOM",
      description: "Digital Imaging and Communications in Medicine (DICOM) is the standard for medical imaging information.",
      link: "https://www.dicomstandard.org/",
      category: "Standards"
    },
    {
      title: "HL7 Segment Mapper",
      description: "An interactive force-directed graph visualization showing the relationships between HL7 segments and message types like ADT, ORU, ORM, and SIU.",
      link: "/hl7-segment-mapper",
      category: "Education",
      isInternalLink: true
    },
    {
      title: "Integration Diagram Tool",
      description: "Create professional integration diagrams, system architecture drawings, and workflow visualizations using an interactive drawing canvas. Perfect for documenting healthcare system connections and data flows.",
      link: "/integration-diagram",
      category: "Education",
      isInternalLink: true
    },
    {
      title: "Integration Architect",
      description: "The premier tool for designing healthcare integration flows. Features AI-assisted diagram generation, local saving, and professional export options.",
      link: "/integration-architect",
      category: "Featured",
      isInternalLink: true
    },
    {
      title: "HL7 SQL Builder",
      description: "Generate SQL stored procedures to parse RAW HL7 messages stored in your database. Select segments and fields from ADT messages, and get ready-to-use SQL for SQL Server, PostgreSQL, or MySQL.",
      link: "/hl7-sql-builder",
      category: "Featured",
      isInternalLink: true
    },
    {
      title: "HL7 De-Identify SQL",
      description: "Generate stored procedures that pseudonymize PHI inside your own database. Point at your HL7 table and column — consistent fictional IDs keep journeys linkable. Mapping tables stay internal.",
      link: "/hl7-deidentify-sql",
      category: "Featured",
      isInternalLink: true
    },
    {
      title: "Catchment Kit: PID-11 → SA2",
      description: "One-click SQL kit that turns patient street address into SA2 catchment codes inside your own SQL Server — offline, no PHI leaves the database. Maps by service, visit type, or attending doctor.",
      link: "/hl7-catchment-kit",
      category: "Featured",
      isInternalLink: true
    },
    {
      title: "Ward Analytics: PID × PV1",
      description: "Twelve copy-paste questions answered from your RAW HL7 — ward LOS, turnover, live census, boarding, readmissions and more. One foundation mart, thin views, scheduled refresh. SQL Server, PostgreSQL and MySQL.",
      link: "/hl7-ward-analytics",
      category: "Featured",
      isInternalLink: true
    },
    {
      title: "MessageTrace",
      description: "MessageTrace is a lightweight PowerShell tool for healthcare IT professionals to rapidly locate HL7 messages in production archives. Search by patient ID, visit number, or location across thousands of files in seconds. No database setup, no external dependencies — just pure PowerShell efficiency for critical incident response.",
      link: "/message-trace",
      category: "Featured",
      isInternalLink: true
    },

  ];

  const filteredResources = resources;

  // Create a sorted array of categories
  const allCategories = Array.from(new Set(filteredResources.map(resource => resource.category)));
  const categories = [
    // Put Featured first
    ...allCategories.filter(cat => cat === "Featured"),
    // Then Education
    ...allCategories.filter(cat => cat === "Education"),
    // Then others
    ...allCategories.filter(cat => cat !== "Featured" && cat !== "Education")
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
          </div>
        </div>
      </div>
    </div>
  );
}