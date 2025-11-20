import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function LandingPage() {
  const [, setLocation] = useLocation();

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)]">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-50 to-indigo-50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block"><span className="text-primary">HIT</span> - Health</span>
                <span className="block text-primary">Integration Tools</span>
              </h1>
              <p className="mt-3 text-base text-gray-600 sm:mt-5 sm:text-xl">
                A comprehensive suite of tools to evaluate, visualize, and improve your healthcare integration capabilities across your entire organization.
              </p>
              <div className="mt-8 sm:max-w-lg sm:mx-auto sm:text-center lg:text-left lg:mx-0">
                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  <Button
                    size="lg"
                    className="w-full sm:w-auto px-6 py-3 text-base font-medium shadow-md h-14"
                    onClick={() => setLocation("/resources")}
                  >
                    <span className="material-icons mr-2">apps</span>
                    Explore Tools and Resources
                  </Button>
                </div>
              </div>
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <div className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md">
                <div className="relative block w-full bg-white rounded-lg overflow-hidden">
                  <span className="material-icons text-[150px] md:text-[240px] text-primary/10 mx-auto text-center block p-12">device_hub</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center">
            <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Our Tools</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Evolving Healthcare Integration Toolkit
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              A comprehensive suite of tools designed to help healthcare organizations evaluate, visualize, and improve their integration capabilities.
            </p>
          </div>

          <div className="mt-10">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-2 max-w-4xl mx-auto">
              {/* Tool 1 */}
              <div className="pt-6">
                <div className="flow-root bg-white rounded-lg px-6 pb-8 h-full border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-primary rounded-md shadow-lg">
                        <span className="material-icons text-white">library_books</span>
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Reference Guides</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Comprehensive guides for HL7 message types and healthcare integration standards.
                    </p>
                    <div className="mt-4">
                      <Button variant="outline" size="sm" onClick={() => setLocation("/reference-guides")} className="w-full">
                        <span className="material-icons text-sm mr-1">arrow_forward</span>
                        View Guides
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tool 2 */}
              <div className="pt-6">
                <div className="flow-root bg-white rounded-lg px-6 pb-8 h-full border border-gray-100 hover:shadow-md transition-shadow">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-primary rounded-md shadow-lg">
                        <span className="material-icons text-white">account_tree</span>
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Integration Mapping Tool</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Create interactive visualizations of healthcare system integrations and data flows.
                    </p>
                    <div className="mt-4">
                      <Button variant="outline" size="sm" onClick={() => setLocation("/integration-mapping")} className="w-full">
                        <span className="material-icons text-sm mr-1">arrow_forward</span>
                        Explore
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Resources Section */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:text-center mb-10">
            <h2 className="text-base text-primary font-semibold tracking-wide uppercase">Resources</h2>
            <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Integration Knowledge Hub
            </p>
            <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
              Explore our collection of healthcare integration resources to expand your knowledge.
            </p>
          </div>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <span className="material-icons text-primary mr-2">school</span>
                <h3 className="text-lg font-medium text-gray-900">Educational Material</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Access tutorials, guides, and best practices for healthcare system integration.
              </p>
              <Button variant="outline" size="sm" onClick={() => setLocation("/resources")} className="w-full">
                Browse Resources
              </Button>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <span className="material-icons text-primary mr-2">menu_book</span>
                <h3 className="text-lg font-medium text-gray-900">Message Guides</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Comprehensive documentation of HL7 message types and their implementation.
              </p>
              <Button variant="outline" size="sm" onClick={() => setLocation("/reference-guides")} className="w-full">
                View Message Guides
              </Button>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <span className="material-icons text-primary mr-2">help_outline</span>
                <h3 className="text-lg font-medium text-gray-900">About HIT</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Learn more about Health Integration Tools and our mission to improve healthcare interoperability.
              </p>
              <Button variant="outline" size="sm" onClick={() => setLocation("/about")} className="w-full">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mt-auto bg-primary">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Improve your healthcare integration?</span>
            <span className="block text-indigo-100">Explore our tools today</span>
          </h2>
          <div className="mt-8 lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow w-full">
              <Button 
                onClick={() => setLocation("/resources")}
                className="w-full inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-primary bg-white hover:bg-indigo-50 h-14"
                size="lg"
              >
                <span className="material-icons mr-2">apps</span>
                Explore Tools and Resources
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}