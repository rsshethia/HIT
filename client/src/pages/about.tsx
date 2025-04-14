import { Link } from "wouter";

export default function AboutPage() {
  return (
    <div className="bg-neutral-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:py-20 lg:px-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">About This Tool</h2>
            <p className="mt-4 text-lg text-gray-500">
              Learn more about the Healthcare Integration Maturity Assessment tool, how it was developed, and how it can help your organization.
            </p>
          </div>
          <div className="mt-12 lg:mt-0 lg:col-span-2">
            <dl className="space-y-12">
              <div>
                <dt className="text-lg leading-6 font-medium text-gray-900">What is the Healthcare Integration Maturity Assessment?</dt>
                <dd className="mt-2 text-base text-gray-500">
                  This assessment tool helps healthcare organizations evaluate their integration capabilities across seven key dimensions: System Coverage, Timeliness, Data Quality, Monitoring, Scalability, Governance, and Security. The tool provides a maturity score and tailored recommendations to help organizations improve their integration landscape.
                </dd>
              </div>
              <div>
                <dt className="text-lg leading-6 font-medium text-gray-900">How was this tool developed?</dt>
                <dd className="mt-2 text-base text-gray-500">
                  This assessment was developed based on industry best practices, healthcare interoperability standards (such as HL7, FHIR, and IHE profiles), and real-world experience with healthcare integration challenges. The questions and scoring methodology were refined through feedback from healthcare IT professionals and integration specialists.
                </dd>
              </div>
              <div>
                <dt className="text-lg leading-6 font-medium text-gray-900">How does the assessment work?</dt>
                <dd className="mt-2 text-base text-gray-500">
                  The assessment consists of 18 questions across 7 categories. Each question is scored based on your response, and the scores are aggregated to calculate an overall maturity percentage. Based on this percentage, the tool assigns a maturity level (Low, Moderate, or High) and provides tailored recommendations for improvement.
                </dd>
              </div>
              <div>
                <dt className="text-lg leading-6 font-medium text-gray-900">Who should use this tool?</dt>
                <dd className="mt-2 text-base text-gray-500">
                  This assessment is designed for healthcare IT leaders, integration architects, CIOs, CTOs, and other stakeholders responsible for healthcare systems integration. It's particularly valuable for organizations that are planning integration strategy improvements or evaluating their current integration capabilities.
                </dd>
              </div>
              <div className="text-center pt-8">
                <Link href="/assessment">
                  <a className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary-700">
                    <span className="material-icons mr-2">assessment</span>
                    Start the Assessment
                  </a>
                </Link>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}