import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import VisitTracker from "./pages/VisitTracker";
import CompanyManagement from "./pages/CompanyManagement";
import PeopleManagement from "./pages/PeopleManagement";
import SellingPointManagement from "./pages/SellingPointManagement";
import ActivityManagement from "./pages/ActivityManagement";
import DataManagement from "./pages/DataManagement";
import NotFound from "./pages/NotFound";
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from "@/components/ui/sidebar";
import { PanelLeft, Home, Users, Building, MapPin, Activity, DatabaseZap } from "lucide-react";

const queryClient = new QueryClient();

function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarContent>
            <div className="flex items-center justify-between p-4">
              <span className="font-bold text-lg">StandUp</span>
              <SidebarTrigger />
            </div>
            <SidebarMenu>
              <SidebarMenuItem>
                <Link to="/visit-tracker">
                  <SidebarMenuButton isActive={location.pathname === "/visit-tracker"}>
                    <Home className="w-4 h-4 mr-2" /> Visit Tracker
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link to="/companies">
                  <SidebarMenuButton isActive={location.pathname === "/companies"}>
                    <Building className="w-4 h-4 mr-2" /> Company Management
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link to="/people">
                  <SidebarMenuButton isActive={location.pathname === "/people"}>
                    <Users className="w-4 h-4 mr-2" /> People Management
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link to="/selling-points">
                  <SidebarMenuButton isActive={location.pathname === "/selling-points"}>
                    <MapPin className="w-4 h-4 mr-2" /> Selling Point Management
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link to="/activities">
                  <SidebarMenuButton isActive={location.pathname === "/activities"}>
                    <Activity className="w-4 h-4 mr-2" /> Activity Management
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link to="/data-management">
                  <SidebarMenuButton isActive={location.pathname === "/data-management"}>
                    <DatabaseZap className="w-4 h-4 mr-2" /> Data Management
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <main className="flex-1 min-h-screen relative">
          <div className="md:hidden absolute top-4 left-4 z-50">
            <SidebarTrigger />
          </div>
          <div className="w-full h-full">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppLayout>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/visit-tracker" element={<VisitTracker />} />
            <Route path="/companies" element={<CompanyManagement />} />
            <Route path="/people" element={<PeopleManagement />} />
            <Route path="/selling-points" element={<SellingPointManagement />} />
            <Route path="/activities" element={<ActivityManagement />} />
            <Route path="/data-management" element={<DataManagement />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
