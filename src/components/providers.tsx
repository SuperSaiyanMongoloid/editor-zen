"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { AppProvider } from "@/contexts/app-context";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  // useState ensures a single QueryClient instance per browser session
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppProvider>
          <Toaster />
          <Sonner />
          {children}
        </AppProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
