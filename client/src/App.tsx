import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Results from "@/pages/results";
import LandingPage from "@/pages/landing-page";
import AboutPage from "@/pages/about";
import ResourcesPage from "@/pages/resources";
import ReferenceGuidesPage from "@/pages/reference-guides";
import IntegrationFlowPage from "@/pages/integration-flow";
import VisualizationsPage from "@/pages/visualizations";
import IntegrationMappingPage from "@/pages/integration-mapping";
import ObservableDemoPage from "@/pages/observable-demo";
import GuidesPage from "@/pages/guides";
import HL7FlowGamePage from "@/pages/hl7-flow-game";
import HL7SegmentMapper from "@/pages/hl7-segment-mapper";
import ClinicalIntegrationPlay from "@/pages/clinical-integration-play";
import SheetToBookletPage from "@/pages/sheet-to-booklet";
import IntegrationDiagramPage from "@/pages/integration-diagram";
import IntegrationArchitect from "@/pages/integration-architect";

import NavBar from "@/components/nav-bar";
import Footer from "@/components/footer";
import { DevHeader } from "@/components/dev-header";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/assessment" component={Home} />
      <Route path="/results" component={Results} />
      <Route path="/about" component={AboutPage} />
      <Route path="/resources" component={ResourcesPage} />
      <Route path="/reference-guides" component={ReferenceGuidesPage} />
      <Route path="/integration-flow" component={IntegrationFlowPage} />
      <Route path="/visualizations" component={VisualizationsPage} />
      <Route path="/integration-mapping" component={IntegrationMappingPage} />
      <Route path="/observable-demo" component={ObservableDemoPage} />
      <Route path="/guides" component={GuidesPage} />
      <Route path="/hl7-flow-game" component={HL7FlowGamePage} />
      <Route path="/hl7-segment-mapper" component={HL7SegmentMapper} />
      <Route path="/clinical-integration-play" component={ClinicalIntegrationPlay} />
      <Route path="/sheet-to-booklet" component={SheetToBookletPage} />
      <Route path="/integration-diagram" component={IntegrationDiagramPage} />
      <Route path="/integration-architect" component={IntegrationArchitect} />
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
          <Router />
        </main>
        <Footer />
      </div>
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
