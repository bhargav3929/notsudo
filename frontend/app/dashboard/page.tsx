"use client";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { JobsTable } from "@/components/dashboard/jobs/JobsTable";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-black">
      <Sidebar />
      
      {/* Main Content */}
      <main className="ml-64 min-h-screen">
        {/* Header */}
        <header className="h-16 border-b border-white/10 flex items-center px-8">
          <h1 className="font-mono text-xl font-bold text-white">Jobs</h1>
        </header>

        <div className="p-8">
          <JobsTable />
        </div>
      </main>
    </div>
  );
}
