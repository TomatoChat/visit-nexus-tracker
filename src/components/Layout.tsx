import React from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full min-h-screen pt-1 md:pt-5 px-[1%] md:px-0 overflow-x-hidden">
      {children}
    </div>
  );
} 