"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const API_BASE = "http://localhost:8000";

interface Job {
  id: string;
  repo: string;
  issueNumber: number;
  issueTitle: string;
  status: string;
  stage?: string;
  retryCount?: number;
  createdAt: string;
  prUrl?: string;
  error?: string;
  logs?: string[];
  validationLogs?: string[];
}

interface JobLogs {
  id: string;
  logs: string[];
  validationLogs: string[];
  retryCount: number;
  stage: string;
}

export default function Dashboard() {
  const [githubToken, setGithubToken] = useState("");
  const [openrouterKey, setOpenrouterKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [jobLogs, setJobLogs] = useState<JobLogs | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/jobs`);
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    }
  };

  const fetchJobLogs = async (jobId: string) => {
    setLoadingLogs(true);
    try {
      const response = await fetch(`${API_BASE}/api/jobs/${jobId}/logs`);
      if (response.ok) {
        const data = await response.json();
        setJobLogs(data);
      }
    } catch (error) {
      console.error("Failed to fetch job logs:", error);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    fetchJobLogs(job.id);
  };

  const handleSaveConfig = async () => {
    const response = await fetch(`${API_BASE}/api/config`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ githubToken, openrouterKey, webhookSecret }),
    });
    if (response.ok) {
      alert("Configuration saved successfully!");
    }
  };

  const handleGetWebhookUrl = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/webhook-url`);
      if (response.ok) {
        const data = await response.json();
        setWebhookUrl(data.webhookUrl);
      }
    } catch (error) {
      console.error("Failed to fetch webhook URL:", error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "failed":
        return "bg-red-500";
      case "processing":
        return "bg-yellow-500 animate-pulse";
      default:
        return "bg-gray-500";
    }
  };

  const getStageLabel = (stage?: string) => {
    switch (stage) {
      case "analyzing":
        return "🔍 Analyzing";
      case "generating":
        return "🤖 Generating";
      case "validating":
        return "🧪 Testing";
      case "completed":
        return "✅ Complete";
      case "failed":
        return "❌ Failed";
      case "error":
        return "⚠️ Error";
      default:
        return stage || "Unknown";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            NotSudo Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            AI-powered code automation for your GitHub repositories
          </p>
        </div>

        <Tabs defaultValue="jobs" className="max-w-5xl mx-auto">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="jobs">Job History</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="webhook">Webhook Setup</TabsTrigger>
          </TabsList>

          <TabsContent value="jobs">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Job List */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Jobs
                    <Badge variant="outline">{jobs.length} total</Badge>
                  </CardTitle>
                  <CardDescription>
                    Click a job to view execution logs
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {jobs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No jobs yet. Comment @my-tool on a GitHub issue to get
                      started!
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {jobs.map((job) => (
                        <div
                          key={job.id}
                          onClick={() => handleJobClick(job)}
                          className={`border rounded-lg p-3 cursor-pointer transition-all hover:border-blue-400 hover:shadow-md ${
                            selectedJob?.id === job.id
                              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                              : ""
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="font-medium text-sm truncate">
                                {job.repo}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                #{job.issueNumber}: {job.issueTitle}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <div
                                className={`w-2 h-2 rounded-full ${getStatusColor(
                                  job.status
                                )}`}
                              />
                              <span className="text-xs text-muted-foreground">
                                {getStageLabel(job.stage)}
                              </span>
                            </div>
                          </div>
                          {job.prUrl && (
                            <a
                              href={job.prUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-500 hover:underline mt-1 block"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View PR →
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Log Viewer */}
              <Card>
                <CardHeader>
                  <CardTitle>Execution Logs</CardTitle>
                  <CardDescription>
                    {selectedJob
                      ? `${selectedJob.repo} #${selectedJob.issueNumber}`
                      : "Select a job to view logs"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!selectedJob ? (
                    <div className="text-center py-8 text-muted-foreground">
                      ← Select a job from the list
                    </div>
                  ) : loadingLogs ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Loading logs...
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Status Summary */}
                      <div className="flex gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Status:</span>{" "}
                          <Badge
                            variant={
                              selectedJob.status === "completed"
                                ? "default"
                                : selectedJob.status === "failed"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {selectedJob.status}
                          </Badge>
                        </div>
                        {jobLogs?.retryCount !== undefined &&
                          jobLogs.retryCount > 0 && (
                            <div>
                              <span className="text-muted-foreground">
                                Retries:
                              </span>{" "}
                              <Badge variant="outline">
                                {jobLogs.retryCount}
                              </Badge>
                            </div>
                          )}
                      </div>

                      {/* Error Display */}
                      {selectedJob.error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                          <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                            Error
                          </p>
                          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                            {selectedJob.error}
                          </p>
                        </div>
                      )}

                      {/* Validation Logs */}
                      {jobLogs?.validationLogs &&
                        jobLogs.validationLogs.length > 0 && (
                          <div>
                            <p className="text-sm font-medium mb-2">
                              Validation Output
                            </p>
                            <div className="bg-gray-900 text-gray-100 p-3 rounded-md text-xs font-mono max-h-[300px] overflow-y-auto">
                              {jobLogs.validationLogs.map((log, i) => (
                                <div
                                  key={i}
                                  className={`py-0.5 ${
                                    log.includes("===")
                                      ? "text-yellow-400 font-bold mt-2"
                                      : log.includes("Error") ||
                                        log.includes("failed")
                                      ? "text-red-400"
                                      : log.includes("passed") ||
                                        log.includes("success")
                                      ? "text-green-400"
                                      : ""
                                  }`}
                                >
                                  {log}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* General Logs */}
                      {jobLogs?.logs && jobLogs.logs.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2">
                            Activity Log
                          </p>
                          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md text-xs max-h-[150px] overflow-y-auto">
                            {jobLogs.logs.map((log, i) => (
                              <div key={i} className="py-0.5">
                                {log}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="config">
            <Card>
              <CardHeader>
                <CardTitle>API Configuration</CardTitle>
                <CardDescription>
                  Configure your GitHub and OpenRouter API credentials
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="github-token">
                    GitHub Personal Access Token
                  </Label>
                  <Input
                    id="github-token"
                    type="password"
                    placeholder="ghp_xxxxxxxxxxxx"
                    value={githubToken}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setGithubToken(e.target.value)
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    Required permissions: repo, workflow
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="openrouter-key">OpenRouter API Key</Label>
                  <Input
                    id="openrouter-key"
                    type="password"
                    placeholder="sk-or-xxxxxxxxxxxx"
                    value={openrouterKey}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setOpenrouterKey(e.target.value)
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="webhook-secret">
                    Webhook Secret (Optional)
                  </Label>
                  <Input
                    id="webhook-secret"
                    type="password"
                    placeholder="your_webhook_secret"
                    value={webhookSecret}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setWebhookSecret(e.target.value)
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    For enhanced security, set this as the secret in your GitHub
                    webhook
                  </p>
                </div>

                <Button onClick={handleSaveConfig} className="w-full">
                  Save Configuration
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="webhook">
            <Card>
              <CardHeader>
                <CardTitle>GitHub Webhook Setup</CardTitle>
                <CardDescription>
                  Configure your repository to send events to this tool
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Webhook URL</Label>
                  <div className="flex gap-2">
                    <Input
                      value={webhookUrl}
                      readOnly
                      placeholder="Click 'Get Webhook URL' to generate"
                    />
                    <Button onClick={handleGetWebhookUrl}>
                      Get Webhook URL
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Setup Instructions</Label>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Go to your GitHub repository settings</li>
                    <li>
                      Navigate to Webhooks and click &quot;Add webhook&quot;
                    </li>
                    <li>Paste the webhook URL above</li>
                    <li>
                      If you set a webhook secret in Configuration, paste it in
                      the Secret field
                    </li>
                    <li>Content type: application/json</li>
                    <li>Select &quot;Let me select individual events&quot;</li>
                    <li>Check &quot;Issue comments&quot; event only</li>
                    <li>Click &quot;Add webhook&quot;</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
