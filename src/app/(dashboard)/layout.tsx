"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 print:h-auto print:bg-white print:overflow-visible">
      {/* Sidebar - fixed height, never scrolls with content */}
      <div className="flex-shrink-0 h-full print:hidden">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      </div>
      {/* Right panel - only this scrolls */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden print:overflow-visible print:h-auto">
        <div className="print:hidden">
          <Header onMenuClick={() => setSidebarOpen(true)} />
        </div>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 print:p-0 print:overflow-visible print:h-auto">{children}</main>
      </div>
    </div>
  );
}
