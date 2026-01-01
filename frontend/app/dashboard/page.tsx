"use client";

import { Sidebar } from "@/components/dashboard/Sidebar";
import { RepoList } from "@/components/dashboard/RepoList";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-black">
      <Sidebar />
      
      {/* Main Content */}
      <main className="ml-64 min-h-screen">
        {/* Header */}
        <header className="h-16 border-b border-white/10 flex items-center px-8">
          <h1 className="font-mono text-xl font-bold text-white">Repository Automation</h1>
        </header>

        <div className="p-8">
          <div className="max-w-5xl mx-auto">
             <div className="mb-8">
               <h2 className="text-2xl font-bold text-white mb-2">Configure Repositories</h2>
               <p className="text-gray-400">
                 Select which repositories you want to enable automation for.
                 When enabled, we will listen for issues and comments to automatically generate PRs.
               </p>
             </div>

             <RepoList />
          </div>
        </div>
      </main>
    </div>
  );
}
