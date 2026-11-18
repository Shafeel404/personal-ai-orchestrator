# Architecture: Personal Multi-Agent Orchestration System

**Status:** Research proposal; no implementation started  
**Reviewed:** 2026-11-19

## Purpose and principles

Build a local Windows service that accepts a task, selects a capable execution adapter, creates an isolated Git worktree, records progress and artifacts, and presents a reviewable result. Coordinate documented command-line or API interfaces. A desktop app is not an automation API: the installed Antigravity IDE can remain useful for manual work, while its documented CLI is the automation candidate once installed and verified.

- Provider-neutral task model and adapter boundary; preserve provider-specific features as optional capabilities.
- Durable state in local SQLite; execution can resume after service restart.
- Each worker gets a dedicated branch/worktree and bounded process sandbox. No worker receives push credentials or permission to merge/deploy.
- Treat model output, tool calls, repository files, and logs as untrusted input.
- Human review is mandatory before accepting changes; deployment is outside v1 and separately approved.
- Start with one local user and one service process. Add dashboard and remote access only after the local control plane is secure.

## Proposed components

```mermaid
flowchart LR
  U[Local user / future dashboard] --> API[Fastify API]
  CH[Optional ChatGPT app / MCP control surface] --> API
  API --> S[Task service + policy engine]
  S --> DB[(SQLite)]
  S --> PM[Shared project memory + handoff service]
  PM --> DB
  S --> Q[SQLite-backed dispatcher]
  Q --> W[Execution supervisor]
  W --> WT[Git worktree manager]
  W --> A[Agent adapter registry]
  A --> C[Codex CLI]
  A --> G[Antigravity CLI]
  A --> CL[Claude Code CLI/SDK]
  A --> L[Ollama / compatible API]
  W --> E[Event/log store]
  E --> DB
  S --> H[Human approval UI/API]
```

A modular monolith is sufficient initially: Fastify routes, application services, SQLite repository, queue/worker loop, process supervisor, Git worktree manager, and adapters in one TypeScript codebase. Keep boundaries strict so the worker can later become a separate process. No Redis, Kubernetes, broker, or hosted control plane is needed for one workstation.

### Core modules

- **Task API:** create/read/cancel/retry tasks, request approvals, inspect events and artifacts.
- **Router:** capability and policy filtering first; weighted preferences second. Never route only by provider name.
- **Dispatcher/supervisor:** concurrency limits, heartbeat, timeout, cancellation, stdout/stderr capture, exit status, retries.
- **Worktree manager:** create a task branch from a selected commit, check repository identity, collect diff/status, and clean up only after retention permits.
- **Adapter registry:** identifies installed/authenticated agents and supports input/output modes, resumability, cancellation, file-edit behavior, and permission controls.
- **Review service:** separate review attempt on a read-only snapshot; records findings without changing implementation worktree.
- **Project memory and handoff service:** shared, project-scoped records for documentation, durable decisions, task context, execution reports, and cross-agent messages. Expose a stable API to the task service and authorized adapters; keep access controls, provenance, and revision history independent of any provider's conversation memory.
- **Audit/event store:** append-only task events and structured runs; redact secrets before persistence.

### ChatGPT as an optional control surface

ChatGPT is a user-facing external interface, not the orchestration engine. A future ChatGPT app built with the Apps SDK and MCP could expose narrow actions such as create task, inspect status, read project memory, request cancellation, and submit an approval decision. The app would call the same authenticated local orchestration API; scheduling, routing, retries, execution, isolation, and durable state stay in this service. Do not delegate shell access or repository credentials to the ChatGPT-facing MCP server.

This path requires a network-reachable HTTPS MCP endpoint or a supported secure MCP tunnel; ChatGPT cannot connect directly to a localhost-only endpoint. Full custom MCP write/modify support is plan and workspace dependent: current OpenAI documentation describes full MCP for Business and Enterprise/Edu, while Pro has read/fetch limits; availability can change. Custom MCP apps are web-only in the current docs, so they do not satisfy mobile access by themselves. ChatGPT may prompt for confirmation for actions, but that product prompt does not replace this service's mandatory approval check for merge. ChatGPT plan access is not an OpenAI API key or a promise of API credits. Keep the feature optional and do not require paid ChatGPT tiers or APIs for the core product. See [OpenAI's ChatGPT custom MCP guide](https://help.openai.com/en/articles/12584461-connecting-custom-mcp-servers-in-chatgpt), [Apps SDK overview](https://help.openai.com/en/articles/12515353-building-with-the-apps-sdk), and [ChatGPT API-credit plan guidance](https://help.openai.com/en/articles/20001626-api-credits-benefit-for-eligible-chatgpt-subscriptions).

## Agent adapter interface

The adapter contract is transport-neutral and capability-declared; it does not pretend every provider exposes identical control.

```ts
interface AgentAdapter {
  id: string;
  discover(): Promise<AgentAvailability>;
  capabilities(): AgentCapabilities;
  start(request: AgentRunRequest, signal: AbortSignal): Promise<AgentRunHandle>;
  stream(handle: AgentRunHandle, signal: AbortSignal): AsyncIterable<AgentEvent>;
  cancel?(handle: AgentRunHandle): Promise<void>;
  resume?(providerRunId: string, signal: AbortSignal): Promise<AgentRunHandle>;
  normalizeResult(handle: AgentRunHandle): Promise<AgentResult>;
}

type AgentCapabilities = {
  modes: Array<'agentic-cli' | 'sdk' | 'inference-api' | 'manual'>;
  structuredEvents: boolean; editsWorkspace: boolean; resumable: boolean;
  cancellable: boolean; permissionModes: string[];
  supportsModelSelection: boolean; supportsLocalInference: boolean;
};

type AgentRunRequest = {
  taskId: string; worktreePath: string; prompt: string; model?: string;
  timeoutMs: number; maxTurns?: number; taskBudget?: BudgetLimits;
  permissionProfile: PermissionProfile;
  environment: Record<string, string>;
};

type BudgetLimits = {
  maxWallTimeMs: number; maxRetries: number; maxInputTokens?: number;
  maxOutputTokens?: number; maxEstimatedCost?: number;
};

type AgentEvent =
  | { type: 'started' | 'heartbeat' | 'completed' | 'failed' | 'cancelled'; at: string }
  | { type: 'message'; at: string; text: string }
  | { type: 'tool'; at: string; name: string; status: string; summary?: string }
  | { type: 'approval-required'; at: string; action: string; detail: unknown }
  | { type: 'usage'; at: string; inputTokens?: number; outputTokens?: number; cost?: number }
  | { type: 'diagnostic'; at: string; code?: string; message: string };

type AgentResult = {
  status: 'succeeded' | 'failed' | 'cancelled' | 'needs-human';
  summary: string; providerRunId?: string; exitCode?: number;
  usage?: { inputTokens?: number; outputTokens?: number; estimatedCost?: number };
  artifacts: Array<{ kind: string; path?: string; content?: string }>;
  rawResultRef?: string;
};
```

`discover()` reports presence, version, safely detectable auth readiness, and blockers without reading/emitting credential material. Use native process spawning with argument arrays (never concatenate untrusted text into a shell command), known working directory, allowlisted environment, explicit timeouts, separate stdout/stderr. Parse versioned provider streams; store raw output only when needed and redact it. Manual tools create a user-input state rather than simulating clicks or keyboard input.

For Ollama and similar local inference APIs, distinguish a **model endpoint** from a **coding agent**. A raw chat endpoint cannot safely inspect/edit files or run tests by itself. Initially use it for review/planning/summarization unless wrapped by a separately permissioned harness.

## Task lifecycle

```text
queued -> validating -> waiting_for_agent -> preparing_worktree -> running
  -> collecting_result -> reviewing -> awaiting_human_review
  -> approved -> merge_ready -> merged (human action; later phase)

Any active state -> cancelling -> cancelled
running/validating/preparing -> retry_wait -> queued (within retry budget)
Any nonterminal state -> needs_human | failed
```

Each transition writes task state and an event transactionally. Define idempotency keys for submission and worker acquisition. On startup mark orphaned runs `interrupted`, reconcile process IDs/worktrees, then offer bounded retry or human recovery; never silently relaunch a possibly non-idempotent action. Cancellation kills the process tree and records cleanup status. Retry only transient availability/network errors with exponential backoff and jitter, capped per task/provider. Do not retry policy denials, bad input, human rejection, or uncertain partial operations.

Task record: ID, prompt, repository/root identity, base commit, priority, routing constraints, state, timestamps, attempt/retry counts, adapter/model, worktree/branch, run IDs, review outcome, approval identity/timestamps, artifacts, sanitized failure details. Keep secrets out of task payloads and logs.

The dispatcher must enforce per-agent concurrency ceilings, per-task budget/time/retry limits, and optional project-wide budgets. Persist provider-reported usage and label locally computed spend as estimates. Stop or request a human decision when a hard budget is reached; never auto-retry around it. Record budget and usage per attempt, agent, and task.

## Shared project memory and handoffs

Project memory is an orchestrator-owned, provider-neutral record set, not a prompt dump or a provider's private session history. Support typed items for project docs, decisions (including rationale and superseded state), task context, execution reports, and cross-agent handoff messages. Every item has project/task IDs, author/agent, source run, timestamps, visibility, and revision metadata. Provide append-only or versioned writes, search by project/task, bounded context retrieval, and explicit size/retention rules. Secrets should be excluded or encrypted with a separate policy; agents receive only the scoped items needed for their task.

Handoff flow: an agent writes a structured report (goal, completed work, changed paths, checks, unresolved questions, risks, and next steps) to the memory service; the next agent receives a task-scoped summary and source references, then acknowledges/updates the handoff. Never rely on direct agent-to-agent private channels. Store messages and delivery/acknowledgment events for audit. SQLite is the initial backing store; the interface should permit later indexing without adding a separate service now.

## Routing and review

Filter adapters by availability, task class, required tools, requested provider/model, permission compatibility, budget ceiling, and local/cloud policy. Score the rest by task fit, observed success/latency, queue depth, cost class, and user preference. Explain the choice and allow override. Start with deterministic rules, not opaque model routing.

Review runs after implementation on a separate read-only snapshot. Reviewers get criteria, base commit, and patch; they do not share the writable worktree or secrets. Review is advisory and cannot approve its own patch. Require explicit human acceptance before merge. A future merge action must run from the trusted controller after approval, re-check base/head/diff and branch policy, and never grant an agent `git push` or production credentials.

## Boundaries and future UI

Bind Fastify to loopback in v1, enforce authentication, add CSRF/origin protections for browser mutations, and keep API unavailable from LAN by default. A dashboard can call the same API and consume events by SSE. Mobile access later should use a private VPN/tunnel or authenticated relay with short-lived scoped credentials; never expose a raw API port or agent shell publicly.

Provider remote-control features (for example Antigravity) are separate product capabilities, not this system’s API contract. Avoid undocumented GUI automation, window scraping, or credential/session extraction.

## Limits and open decisions

- CLI flags, JSONL schemas, auth, model availability, rate limits, and prices change. Pin/test adapter versions and revalidate upgrades.
- A CLI approval-bypass option may create broad authority; isolate at OS/container level instead of trusting prompts as a boundary.
- Git worktrees and provider permission flags are workflow/tool controls, not security boundaries. Do not enable automated code modification until OS-level isolation is validated with escape and filesystem-access tests.
- Windows-native process containment varies. Validate a suitable Windows Sandbox/VM/container or restricted identity plus filesystem ACL and process controls; test that workers cannot read sibling projects, user profile secrets, or write outside the task area. A Job Object limits process lifetime/resources but is not filesystem isolation by itself.
- Concurrent worktrees share Git object storage and may contend for CPU/RAM/disk. Cap concurrency and clean up safely.
- Local models avoid per-token hosted charges but require hardware, disk, power, and setup. Large coding models may exceed VRAM/RAM.
- Subscription access does not imply API access or API credits. Confirm entitlement and billing before enabling automated runs.

## Sources

- [Codex as a platform](https://developers.openai.com/blog/codex-as-a-platform)
- [Codex CLI reference](https://developers.openai.com/codex/cli)
- [Antigravity CLI headless mode](https://antigravity.google/docs/cli/headless/)
- [Claude Code CLI usage](https://docs.anthropic.com/en/docs/claude-code/cli-usage)
- [Git worktree documentation](https://git-scm.com/docs/git-worktree)
- [MCP specification](https://modelcontextprotocol.io/specification/2025-11-25)
