import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/components/AuthProvider";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Setup from "./pages/Setup";
import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import Invites from "./pages/Invites";
import Confirmations from "./pages/Confirmations";
import CheckIn from "./pages/CheckIn";
import SettingsPage from "./pages/SettingsPage";
import Plans from "./pages/Plans";
import Billing from "./pages/Billing";
import CompanyPublic from "./pages/CompanyPublic";
import InviteConfirmation from "./pages/InviteConfirmation";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/setup" element={<Setup />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/events" element={<Events />} />
            <Route path="/invites" element={<Invites />} />
            <Route path="/confirmations" element={<Confirmations />} />
            <Route path="/checkin" element={<CheckIn />} />
            <Route path="/plans" element={<Plans />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/:slug/convite/:inviteId" element={<InviteConfirmation />} />
            <Route path="/:slug" element={<CompanyPublic />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
