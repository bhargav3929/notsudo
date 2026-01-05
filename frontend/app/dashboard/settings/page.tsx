"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Github, Check, AlertCircle, LogOut, Bot, Save, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface AIModel {
  id: string;
  name: string;
  provider: string;
}

export default function SettingsPage() {
  const { data: session } = authClient.useSession();
  const isConnected = !!session;

  // AI Settings state
  const [models, setModels] = useState<AIModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [customRules, setCustomRules] = useState<string>("");
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Fetch available models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const res = await fetch(`${API_URL}/api/models`);
        if (res.ok) {
          const data = await res.json();
          setModels(data.models || []);
          if (!selectedModel && data.default) {
            setSelectedModel(data.default);
          }
        }
      } catch (error) {
        console.error("Failed to fetch models:", error);
      }
    };
    fetchModels();
  }, []);

  // Fetch user's AI settings
  useEffect(() => {
    const fetchSettings = async () => {
      if (!session?.user?.id) return;
      setLoadingSettings(true);
      try {
        const res = await fetch(`${API_URL}/api/user/ai-settings?user_id=${session.user.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.selectedModel) setSelectedModel(data.selectedModel);
          if (data.customRules) setCustomRules(data.customRules);
        }
      } catch (error) {
        console.error("Failed to fetch AI settings:", error);
      } finally {
        setLoadingSettings(false);
      }
    };
    fetchSettings();
  }, [session?.user?.id]);

  const handleSaveSettings = async () => {
    if (!session?.user?.id) return;
    setSavingSettings(true);
    setSaveSuccess(false);
    try {
      const res = await fetch(`${API_URL}/api/user/ai-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: session.user.id,
          selectedModel,
          customRules,
        }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Failed to save AI settings:", error);
    } finally {
      setSavingSettings(false);
    }
  };

  const handleConnectGithub = async () => {
    await authClient.signIn.social({
        provider: "github",
        callbackURL: "/dashboard/settings"
    });
  };

  const handleDisconnect = async () => {
    await authClient.signOut();
  };

  return (
    <div className="min-h-screen bg-black">
      <Sidebar />
      
      {/* Main Content */}
      <main className="ml-64 min-h-screen">
        {/* Header */}
        <header className="h-16 border-b border-white/10 flex items-center px-8">
          <h1 className="font-mono text-xl font-bold text-white">Settings</h1>
        </header>

        <div className="p-8 space-y-6">
          <div className="max-w-2xl space-y-6">
            {/* GitHub Connection */}
            <div className="border border-white/10 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10">
                <h2 className="font-mono text-white font-medium">GitHub Connection</h2>
                <p className="font-mono text-xs text-gray-500 mt-1">
                  Connect your GitHub account to enable automated code reviews
                </p>
              </div>
              <div className="p-6">
                {isConnected ? (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                      {session?.user?.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={session.user.image}
                          alt={session.user.name || "User"}
                          className="w-12 h-12 rounded-full border border-white/10"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                          <Check className="w-6 h-6 text-green-500" />
                        </div>
                      )}
                      <div>
                        <p className="font-mono text-sm text-white">
                          Connected as {session?.user?.name || "User"}
                        </p>
                        <p className="font-mono text-xs text-gray-500">
                           {session?.user?.email}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 p-3 bg-white/5 rounded border border-white/10">
                        <p className="font-mono text-xs text-gray-400 mb-2">Granted Scopes:</p>
                        <div className="flex flex-wrap gap-2">
                            <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs font-mono rounded border border-green-500/20">repo</span>
                            <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs font-mono rounded border border-green-500/20">user</span>
                            <span className="px-2 py-1 bg-green-500/10 text-green-400 text-xs font-mono rounded border border-green-500/20">read:org</span>
                        </div>
                    </div>

                    <button
                        onClick={handleDisconnect}
                        className="inline-flex items-center gap-2 px-4 py-2 mt-2 bg-red-500/10 text-red-400 font-mono text-xs font-medium hover:bg-red-500/20 transition-colors rounded border border-red-500/20 w-fit"
                    >
                        <LogOut className="w-4 h-4" />
                        Disconnect
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 p-4 bg-orange-500/5 border border-orange-500/20 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                      <p className="font-mono text-sm text-gray-400">
                        Connect your GitHub account to allow NotSudo to analyze your repositories and create pull requests.
                      </p>
                    </div>
                    <button
                      onClick={handleConnectGithub}
                      className="inline-flex items-center gap-3 px-6 py-3 bg-white text-black font-mono text-sm font-medium hover:bg-gray-100 transition-colors rounded-lg"
                    >
                      <Github className="w-5 h-5" />
                      Connect to GitHub
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* AI Settings */}
            <div className="border border-white/10 rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-amber-500" />
                  <h2 className="font-mono text-white font-medium">AI Settings</h2>
                </div>
                <p className="font-mono text-xs text-gray-500 mt-1">
                  Configure which AI model to use and add custom rules for code generation
                </p>
              </div>
              <div className="p-6 space-y-6">
                {loadingSettings ? (
                  <div className="flex items-center gap-2 text-gray-500">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="font-mono text-sm">Loading settings...</span>
                  </div>
                ) : (
                  <>
                    {/* Model Selection */}
                    <div className="space-y-2">
                      <label className="font-mono text-xs text-gray-400 uppercase tracking-wider">
                        AI Model
                      </label>
                      <select
                        value={selectedModel}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors"
                      >
                        {models.map((model) => (
                          <option key={model.id} value={model.id} className="bg-black">
                            {model.name} ({model.provider})
                          </option>
                        ))}
                      </select>
                      <p className="font-mono text-xs text-gray-500">
                        Select the AI model to use for code analysis and generation
                      </p>
                    </div>

                    {/* Custom Rules */}
                    <div className="space-y-2">
                      <label className="font-mono text-xs text-gray-400 uppercase tracking-wider">
                        Custom Rules
                      </label>
                      <textarea
                        value={customRules}
                        onChange={(e) => setCustomRules(e.target.value)}
                        placeholder="Add custom instructions for the AI, e.g.:&#10;- Always use TypeScript&#10;- Follow eslint rules&#10;- Add JSDoc comments"
                        rows={5}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50 transition-colors resize-none"
                      />
                      <p className="font-mono text-xs text-gray-500">
                        These rules will be included in every AI prompt for code generation
                      </p>
                    </div>

                    {/* Save Button */}
                    <div className="flex items-center gap-4">
                      <button
                        onClick={handleSaveSettings}
                        disabled={savingSettings}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-black font-mono text-sm font-medium hover:bg-amber-400 transition-colors rounded-lg disabled:opacity-50"
                      >
                        {savingSettings ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        {savingSettings ? "Saving..." : "Save Settings"}
                      </button>
                      {saveSuccess && (
                        <span className="font-mono text-xs text-green-400 flex items-center gap-1">
                          <Check className="w-4 h-4" />
                          Settings saved!
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
