"use client";

import { useEffect } from "react";
import { initLogRocket } from "../../lib/logrocket";

interface MonitoringProviderProps {
  children: React.ReactNode;
}

export function MonitoringProvider({ children }: MonitoringProviderProps) {
  useEffect(() => {
    // Initialize LogRocket on client side
    if (typeof window !== "undefined") {
      initLogRocket();
    }
  }, []);

  return <>{children}</>;
}
