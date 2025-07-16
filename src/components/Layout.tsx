import React, { useEffect } from "react";
import { usePerformanceTracking } from "@/lib/performance";
import { useTheme } from "next-themes";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { trackRender } = usePerformanceTracking('Layout');
  const { resolvedTheme } = useTheme();
  
  useEffect(() => {
    const endTimer = trackRender();
    return () => endTimer();
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
    }
  }, [resolvedTheme]);

  return (
    <div className="w-full min-h-screen pt-1 md:pt-5 px-[1%] md:px-0 overflow-x-hidden text-black dark:text-white bg-white dark:bg-black">
      {children}
    </div>
  );
} 