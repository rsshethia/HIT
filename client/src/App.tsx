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
import NavBar from "@/components/nav-bar";
import Footer from "@/components/footer";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/assessment" component={Home} />
      <Route path="/results" component={Results} />
      <Route path="/about" component={AboutPage} />
      <Route path="/resources" component={ResourcesPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex flex-col min-h-screen">
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
