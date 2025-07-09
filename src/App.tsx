import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import CompanyManagement from "./pages/CompanyManagement";
import PeopleManagement from "./pages/PeopleManagement";
import SellingPointManagement from "./pages/SellingPointManagement";
import ActivityManagement from "./pages/ActivityManagement";
import NotFound from "./pages/NotFound";
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar
} from "@/components/ui/sidebar";
import { Car } from "lucide-react";

const queryClient = new QueryClient();

function SidebarMenuContent() {
  const location = useLocation();
  const { state } = useSidebar();
  return (
    <SidebarContent>
      <SidebarMenu>
        <SidebarMenuItem>
          <Link to="/">
            <SidebarMenuButton isActive={location.pathname === "/"}>
              <Car className="w-5 h-5 flex-shrink-0" />
              {state === "expanded" && (
                <span className="truncate">Nuovo Rapporto Visita</span>
              )}
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarContent>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={false}>
      <div className="flex min-h-screen w-full">
        <Sidebar collapsible="icon">
          <div className="flex flex-col h-full">
            <div className="flex items-start justify-end p-2">
              <SidebarTrigger />
            </div>
            <SidebarMenuContent />
          </div>
        </Sidebar>
        <main className="flex-1 w-full min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-0 md:p-8 relative">
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
            <Route path="/companies" element={<CompanyManagement />} />
            <Route path="/people" element={<PeopleManagement />} />
            <Route path="/selling-points" element={<SellingPointManagement />} />
            <Route path="/activities" element={<ActivityManagement />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AppLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
