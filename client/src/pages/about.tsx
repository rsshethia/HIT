import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function AboutPage() {
  return (
    <div className="bg-neutral-50 min-h-[calc(100vh-4rem)]">
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:py-20 lg:px-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900">About <span className="text-primary">HIT</span></h2>
            <p className="mt-4 text-lg text-gray-500">
              Learn more about Health Integration Tools, a comprehensive platform designed to help healthcare organizations improve their integration capabilities.
            </p>
            <div className="mt-6 flex items-center text-sm text-gray-500">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                v 0.8.7
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Updated: November 03, 2025
              </span>
            </div>
          </div>
          <div className="mt-12 lg:mt-0 lg:col-span-2">
            <dl className="space-y-12">
              <div>
                <dt className="text-lg leading-6 font-medium text-gray-900">What is HIT?</dt>
                <dd className="mt-2 text-base text-gray-500">
                  Health Integration Tools (HIT) is a comprehensive platform that provides healthcare organizations with various tools to evaluate, visualize, and improve their integration capabilities. Our platform includes a maturity assessment tool, integration flow visualizations, reference guides, and educational resources to support all aspects of healthcare integration.
                </dd>
              </div>
              
              <div>
                <dt className="text-lg leading-6 font-medium text-gray-900">Who is HIT designed for?</dt>
                <dd className="mt-2 text-base text-gray-500">
                  HIT is designed to cater to multiple roles within healthcare organizations:
                  
                  <ul className="list-disc pl-5 mt-2 space-y-2">
                    <li><span className="font-medium">Directors and Managers</span>: The Maturity Assessment Tool helps leadership evaluate organizational integration capabilities and plan strategic improvements.</li>
                    <li><span className="font-medium">Analysts</span>: The Integration Flow Visualizer helps analysts understand message flows across different patient journeys and system touchpoints.</li>
                    <li><span className="font-medium">Developers</span>: The Reference Guides provide technical documentation on HL7 message types and implementation details for integration projects.</li>
                    <li><span className="font-medium">Project Teams</span>: The comprehensive resources support cross-functional teams working on healthcare integration initiatives.</li>
                  </ul>
                </dd>
              </div>
              
              <div>
                <dt className="text-lg leading-6 font-medium text-gray-900">Our Approach</dt>
                <dd className="mt-2 text-base text-gray-500">
                  HIT was developed based on industry best practices, healthcare interoperability standards (such as HL7, FHIR, and IHE profiles), and real-world experience with healthcare integration challenges. Our tools and methodologies are continuously refined through feedback from healthcare IT professionals and integration specialists.
                </dd>
              </div>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8">
                <Button 
                  asChild
                  className="w-full sm:w-auto inline-flex items-center justify-center h-14"
                  size="lg"
                >
                  <Link href="/resources">
                    <span className="material-icons mr-2">apps</span>
                    Explore All Tools
                  </Link>
                </Button>
                
                <Button 
                  asChild
                  variant="outline"
                  className="w-full sm:w-auto inline-flex items-center justify-center h-14"
                  size="lg"
                >
                  <Link href="/assessment">
                    <span className="material-icons mr-2">assessment</span>
                    Start the Assessment
                  </Link>
                </Button>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}