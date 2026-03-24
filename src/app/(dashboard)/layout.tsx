"use client";

import { TopNav } from "@/components/layout/TopNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50 print:h-auto print:bg-white print:overflow-visible">
      <TopNav />
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-6 print:p-0 print:overflow-visible print:h-auto">
        {children}
      </main>
    </div>
  );
}
