import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/main";
import NotFound from "./pages/NotFound";
import SystemDashboard from "./pages/SystemDashboard";
import SystemRankings from "./pages/SystemRankings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<SystemDashboard />} />
          <Route path="/live-metrics" element={<Index isLive />} />
          <Route path="/system/:filename" element={<Index isLive={false} />} />
          <Route path="/rankings" element={<SystemRankings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
