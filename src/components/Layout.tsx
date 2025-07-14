import React, { useEffect } from "react";
import { usePerformanceTracking } from "@/lib/performance";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { trackRender } = usePerformanceTracking('Layout');
  
  useEffect(() => {
    const endTimer = trackRender();
    return () => endTimer();
  }, []);

  return (
    <div className="w-full min-h-screen pt-1 md:pt-5 px-[1%] md:px-0 overflow-x-hidden">
      {children}
    </div>
  );
} 