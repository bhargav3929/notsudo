# Cloud Agent PR - Architecture & Implementation Plan

## Overview

A GitHub automation tool that creates pull requests in response to issue comments. When someone comments `@my-tool` on an issue, an AI agent analyzes the codebase, generates fixes, **validates them in a Docker sandbox**, and creates a PR.

---

## Current Architecture

```
GitHub Webhook → Flask API → AI Analysis → GitHub API → Create PR
```

**Limitation**: No code validation before PR creation.

---

## Target Architecture (Docker Sandbox)

```
GitHub Webhook
    ↓
Flask API
    ↓
Stack Detection (Python? Node.js? Java?)
    ↓
AI Analysis → Generate Code Changes
    ↓
Docker Sandbox
  ├── Clone repo
  ├── Apply changes
  ├── Install dependencies
  └── Run tests
    ↓
┌─────────────────┐
│  Tests Pass?    │
│   Yes → Create PR
│   No  → AI Retry (max 3x)
└─────────────────┘
```

---

## Key Components

### Backend Services (`backend/services/`)

| Service | Purpose |
|---------|---------|
| `ai_service.py` | OpenAI GPT-4 integration with function calling |
| `github_service.py` | GitHub API operations (repos, branches, PRs) |
| `pr_service.py` | Orchestrates the full issue → PR workflow |
| `stack_detector.py` | Detect project type by marker files |
| `docker_sandbox.py` | **[TODO]** Container lifecycle management |
| `code_execution.py` | **[TODO]** Clone → apply → test inside container |

### Frontend (`frontend/`)

Next.js 14 dashboard for:
- Configuration (API keys)
- Job history with status
- Execution logs viewer

---

## Implementation Tasks

### Phase 1: Stack Detection
- [ ] `StackDetectorService` - identify Python/Node.js by marker files
- [ ] Return: `{type, package_manager, install_cmd, test_cmd}`

### Phase 2: Docker Infrastructure  
- [ ] Dockerfiles for Python 3.11, Node.js 20
- [ ] `DockerSandboxService` with resource limits
- [ ] Container lifecycle: create → exec → cleanup

### Phase 3: Sandbox Execution
- [ ] `CodeExecutionService` orchestrates full flow
- [ ] Clone repo, apply changes, run tests
- [ ] Timeout handling, error capture

### Phase 4: AI Retry Loop
- [ ] On test failure, send error logs to AI
- [ ] AI generates fix, retry execution
- [ ] Max 3 retries, then fail

### Phase 5: Dashboard Updates
- [ ] Show execution status (queued → running → testing)
- [ ] Display logs, retry count

### Phase 6: Testing
- [ ] E2E tests for Python and Node.js repos
- [ ] Security review for container isolation

---

## Tech Stack

- **Backend**: Python 3.11, Flask, PyGithub, OpenAI SDK, Docker SDK
- **Frontend**: Next.js 14, TypeScript, Tailwind, shadcn/ui
- **Infrastructure**: Docker for sandboxing

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhook` | GitHub webhook handler |
| GET | `/api/jobs` | List all jobs |
| GET | `/api/jobs/:id/logs` | Get execution logs |
| GET | `/api/config` | Check credential status |
| GET | `/health` | Health check |

---

## Environment Variables

```bash
GITHUB_TOKEN=       # GitHub PAT with repo access
OPENAI_API_KEY=     # OpenAI API key
WEBHOOK_SECRET=     # Optional: GitHub webhook secret
```
