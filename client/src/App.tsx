import { Suspense, lazy } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import LandingPage from "@/pages/landing-page";

// Route-level code splitting: heavy deps (tldraw, mapbox-gl, d3, jspdf)
// only load when the user visits that tool, keeping the landing bundle lean.
const NotFound = lazy(() => import("@/pages/not-found"));
const Home = lazy(() => import("@/pages/home"));
const Results = lazy(() => import("@/pages/results"));
const AboutPage = lazy(() => import("@/pages/about"));
const ResourcesPage = lazy(() => import("@/pages/resources"));
const ReferenceGuidesPage = lazy(() => import("@/pages/reference-guides"));
const VisualizationsPage = lazy(() => import("@/pages/visualizations"));
const ObservableDemoPage = lazy(() => import("@/pages/observable-demo"));
const GuidesPage = lazy(() => import("@/pages/guides"));
const HL7FlowGamePage = lazy(() => import("@/pages/hl7-flow-game"));
const HL7SegmentMapper = lazy(() => import("@/pages/hl7-segment-mapper"));
const ClinicalIntegrationPlay = lazy(() => import("@/pages/clinical-integration-play"));
const SheetToBookletPage = lazy(() => import("@/pages/sheet-to-booklet"));
const IntegrationDiagramPage = lazy(() => import("@/pages/integration-diagram"));
const IntegrationArchitect = lazy(() => import("@/pages/integration-architect"));
const HL7SQLBuilder = lazy(() => import("@/pages/hl7-sql-builder"));
const MessageTracePage = lazy(() => import("@/pages/message-trace"));
const MapPage = lazy(() => import("@/pages/map"));

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
      <Route path="/assessment" component={Home} />
      <Route path="/results" component={Results} />
      <Route path="/about" component={AboutPage} />
      <Route path="/resources" component={ResourcesPage} />
      <Route path="/reference-guides" component={ReferenceGuidesPage} />
      <Route path="/visualizations" component={VisualizationsPage} />
      <Route path="/observable-demo" component={ObservableDemoPage} />
      <Route path="/guides" component={GuidesPage} />
      <Route path="/hl7-flow-game" component={HL7FlowGamePage} />
      <Route path="/hl7-segment-mapper" component={HL7SegmentMapper} />
      <Route path="/clinical-integration-play" component={ClinicalIntegrationPlay} />
      <Route path="/sheet-to-booklet" component={SheetToBookletPage} />
      <Route path="/integration-diagram" component={IntegrationDiagramPage} />
      <Route path="/integration-architect" component={IntegrationArchitect} />
      <Route path="/hl7-sql-builder" component={HL7SQLBuilder} />
      <Route path="/message-trace" component={MessageTracePage} />
      <Route path="/map" component={MapPage} />
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
