
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import VisitTracker from "./pages/VisitTracker";
import CompanyManagement from "./pages/CompanyManagement";
import PeopleManagement from "./pages/PeopleManagement";
import SellingPointManagement from "./pages/SellingPointManagement";
import ActivityManagement from "./pages/ActivityManagement";
import DataManagement from "./pages/DataManagement"; // Import the new page
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/visit-tracker" element={<VisitTracker />} />
          <Route path="/companies" element={<CompanyManagement />} />
          <Route path="/people" element={<PeopleManagement />} />
          <Route path="/selling-points" element={<SellingPointManagement />} />
          <Route path="/activities" element={<ActivityManagement />} />
          <Route path="/data-management" element={<DataManagement />} /> {/* Add route for DataManagement */}
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
