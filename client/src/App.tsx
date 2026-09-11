import { Suspense, lazy } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import LandingPage from "@/pages/landing-page";

// Route-level code splitting: heavy deps (tldraw, d3, jspdf)
// only load when the user visits that tool, keeping the landing bundle lean.
const NotFound = lazy(() => import("@/pages/not-found"));
const AboutPage = lazy(() => import("@/pages/about"));
const ResourcesPage = lazy(() => import("@/pages/resources"));
const HL7SegmentMapper = lazy(() => import("@/pages/hl7-segment-mapper"));
const IntegrationDiagramPage = lazy(() => import("@/pages/integration-diagram"));
const IntegrationArchitect = lazy(() => import("@/pages/integration-architect"));
const HL7SQLBuilder = lazy(() => import("@/pages/hl7-sql-builder"));
const HL7DeidentifySQL = lazy(() => import("@/pages/hl7-deidentify-sql"));
const HL7CatchmentKit = lazy(() => import("@/pages/hl7-catchment-kit"));
const MessageTracePage = lazy(() => import("@/pages/message-trace"));

import NavBar from "@/components/nav-bar";
import Footer from "@/components/footer";
import { DevHeader } from "@/components/dev-header";

function PageFallback() {
  return (
    <div className="flex items-center justify-center py-24 text-sm text-gray-500">
      Loading…
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/about" component={AboutPage} />
      <Route path="/resources" component={ResourcesPage} />
      <Route path="/hl7-segment-mapper" component={HL7SegmentMapper} />
      <Route path="/integration-diagram" component={IntegrationDiagramPage} />
      <Route path="/integration-architect" component={IntegrationArchitect} />
      <Route path="/hl7-sql-builder" component={HL7SQLBuilder} />
      <Route path="/hl7-deidentify-sql" component={HL7DeidentifySQL} />
      <Route path="/hl7-catchment-kit" component={HL7CatchmentKit} />
      <Route path="/message-trace" component={MessageTracePage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex flex-col min-h-screen">
        <DevHeader />
        <NavBar />
        <main className="flex-grow">
          <Suspense fallback={<PageFallback />}>
            <Router />
          </Suspense>
        </main>
        <Footer />
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
