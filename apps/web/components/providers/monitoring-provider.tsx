"use client";

import { useEffect } from "react";
// import { initLogRocket } from "../../lib/logrocket";

interface MonitoringProviderProps {
  children: React.ReactNode;
}

export function MonitoringProvider({ children }: MonitoringProviderProps) {
  useEffect(() => {
    // Temporarily disable LogRocket to debug React hydration issue
    // Initialize LogRocket on client side
    // if (typeof window !== "undefined") {
    //   initLogRocket();
    // }
    console.log("MonitoringProvider mounted - LogRocket disabled for debugging");
  }, []);

  return <>{children}</>;
}
