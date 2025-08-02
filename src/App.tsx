import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from "react-router-dom";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import Profile from './pages/Profile';

import ToVisit from "@/pages/ToVisit";
import Companies from "@/pages/Companies";
import SellingPoints from "@/pages/SellingPoints";
import People from "@/pages/People";
import GeneralCategories from "@/pages/GeneralCategories";
import MyData from "@/pages/MyData";
import { usePerformanceTracking } from "@/lib/performance";
import PerformanceDashboard from "@/components/PerformanceDashboard";
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Car, DatabaseZap, LogOut, Power, Lock, Building, MapPin, Users, Activity, FileText, User, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import Layout from '@/components/Layout';
import { RoleDisplay } from '@/components/ui/role-display';
import { useRoles } from '@/hooks/use-roles';
import { AdminModeProvider } from '@/hooks/use-admin-mode';
import { ProtectedRoute } from '@/components/ui/protected-route';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

function SidebarMenuContent() {
  const location = useLocation();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const [session, setSession] = useState<any>(null);
  const { userRole, userWithRole } = useRoles();
  const [authUserId, setAuthUserId] = useState<string | null>(null);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setAuthUserId(user?.id || null);
    });
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const handleLogoutClick = () => setShowLogoutDialog(true);

  const confirmLogout = async () => {
    await supabase.auth.signOut();
  };

  // Close mobile sidebar when navigation link is clicked
  const handleNavigationClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <SidebarContent className="flex flex-col h-full">
      <div className="flex-1 overflow-auto">
        <div className="p-2">
          {/* <RoleDisplay /> removed as per user request */}
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location.pathname === "/"}>
              <Link to="/" onClick={handleNavigationClick}>
                <Car className="w-5 h-5 flex-shrink-0" />
                {(state === 'expanded' || isMobile) && <span className="truncate">Nuova Visita/Ordine</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          
          {/* To Visit - visible to all authenticated users */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location.pathname === "/to-visit"}>
              <Link to="/to-visit" onClick={handleNavigationClick}>
                <Activity className="w-5 h-5 flex-shrink-0" />
                {(state === 'expanded' || isMobile) && <span className="truncate">Da Visitare</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* My Data - visible to all authenticated users */}
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={location.pathname === "/my-data"}>
              <Link to="/my-data" onClick={handleNavigationClick}>
                <FileText className="w-5 h-5 flex-shrink-0" />
                {(state === 'expanded' || isMobile) && <span className="truncate">I miei dati</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {/* Data Management Pages - only visible to admins */}
          {userRole === 'admin' && (
            <>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === "/companies"}>
                  <Link to="/companies" onClick={handleNavigationClick}>
                    <Building className="w-5 h-5 flex-shrink-0" />
                    {(state === 'expanded' || isMobile) && <span className="truncate">Gestione Aziende</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === "/selling-points"}>
                  <Link to="/selling-points" onClick={handleNavigationClick}>
                    <MapPin className="w-5 h-5 flex-shrink-0" />
                    {(state === 'expanded' || isMobile) && <span className="truncate">Gestione Punti Vendita</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === "/people"}>
                  <Link to="/people" onClick={handleNavigationClick}>
                    <Users className="w-5 h-5 flex-shrink-0" />
                    {(state === 'expanded' || isMobile) && <span className="truncate">Gestione Persone</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* General Categories - only visible to admins */}
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={location.pathname === "/general-categories"}>
                  <Link to="/general-categories" onClick={handleNavigationClick}>
                    <DatabaseZap className="w-5 h-5 flex-shrink-0" />
                    {(state === 'expanded' || isMobile) && <span className="truncate">Gestione Categorie</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </>
          )}
        </SidebarMenu>
      </div>
      <div className="flex flex-col gap-2 p-2">
        <SidebarMenuItem>
          <SidebarMenuButton asChild isActive={location.pathname === "/profile"}>
            <Link to="/profile" onClick={handleNavigationClick}>
              <User className="w-5 h-5 flex-shrink-0" />
              {(state === 'expanded' || isMobile) && <span className="truncate">Profilo</span>}
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <button
          onClick={handleLogoutClick}
          className="w-full flex items-center gap-2 px-4 py-3 text-base font-normal rounded-lg transition-colors hover:bg-background focus:outline-none focus:bg-background text-foreground"
        >
          <Power className="w-5 h-5 flex-shrink-0" />
          {(state === 'expanded' || isMobile) && <span className="truncate text-base">Logout</span>}
        </button>
      </div>
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Vuoi uscire?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={confirmLogout}>Sì</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SidebarContent>
  );
}

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError(error.message);
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
            <Lock className="w-6 h-6" />
            Accesso richiesto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Inserisci la tua email"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Inserisci la tua password"
                required
              />
            </div>
            {error && (
              <p className="text-sm text-red-600">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Accesso in corso..." : "Accedi"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function AppLayout({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<any>(undefined);
  const location = useLocation();
  
  useEffect(() => {
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
      });
      const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
      });
      return () => {
        listener?.subscription.unsubscribe();
      };
    });
  }, []);

  // Show loading state while checking session
  if (session === undefined) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // If not logged in, show login form
  if (!session) {
    return <LoginForm />;
  }

  // Only show sidebar if logged in
  return (
    <SidebarProvider defaultOpen={false} hoverToExpand={true}>
      <div className="flex w-full">
        <Sidebar collapsible="icon">
          <div className="flex flex-col h-full">
            <div className="flex items-start justify-end p-2">
              <SidebarTrigger className="md:hidden" />
            </div>
            <SidebarMenuContent />
          </div>
        </Sidebar>
        <main className="flex-1 w-full bg-background p-0 md:p-8 relative md:pt-0">
          <Layout>{children}</Layout>
        </main>
      </div>
    </SidebarProvider>
  );
}

const App = () => {
  const { trackRender } = usePerformanceTracking('App');
  
  // Track initial app render
  React.useEffect(() => {
    const endTimer = trackRender();
    return () => endTimer();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AdminModeProvider>
          <BrowserRouter>
            <AppLayout>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/my-data" element={<MyData />} />
                <Route path="/to-visit" element={<ToVisit />} />
                <Route path="/companies" element={<ProtectedRoute><Companies /></ProtectedRoute>} />
                <Route path="/selling-points" element={<ProtectedRoute><SellingPoints /></ProtectedRoute>} />
                <Route path="/people" element={<ProtectedRoute><People /></ProtectedRoute>} />
                <Route path="/general-categories" element={<ProtectedRoute><GeneralCategories /></ProtectedRoute>} />
                <Route path="/profile" element={<Profile />} />

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AppLayout>
          </BrowserRouter>
        </AdminModeProvider>
        {/* <PerformanceDashboard /> */} {/* Removed as per user request */}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;