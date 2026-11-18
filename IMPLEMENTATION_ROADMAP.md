# Implementation Roadmap

**Status:** Proposal only; implementation requires approval after this research deliverable.  
**Reviewed:** 2026-11-19

## Phase 0 — Environment and integration spike

- Keep the approved modular monolith, Node.js, TypeScript, Fastify, SQLite and Git worktree design unless a test demonstrates a concrete blocker. Avoid new infrastructure or paid APIs/subscriptions without documented need.
- Select supported system Node.js LTS/package manager; verify install, restart, logging and process supervision on Windows.
- **Codex CLI:** pin a specific release; run non-interactive execution in a disposable repository; capture representative JSONL events and validate parser behavior, exit/error handling, output limits, and version-to-version stability. Record whether the chosen release is stable enough for unattended use.
- **Antigravity CLI:** install the documented headless CLI, verify version, authenticate using supported cached credentials, run a bounded headless task, parse structured output/errors, and confirm behavior when unauthenticated.
- **Claude Code:** install using a documented Windows-supported path, authenticate without exposing tokens, run print/headless execution in a disposable repository, and verify structured output and permission behavior.
- **Windows cancellation:** run a parent agent process that spawns child/grandchild processes; cancel and prove the full process tree exits and is reaped, including after timeout/service restart.
- **Worktree isolation:** create simultaneous worktrees and prove branch, index, diff, cleanup, and base commits remain isolated and recoverable.
- **OS filesystem boundary:** test a worker identity/sandbox attempting reads/writes through relative paths, absolute paths, symlinks/junctions, subprocesses, and inherited environment. Verify denial for sibling repos, user profile secrets, and paths outside its assigned work area. Git worktrees/provider permission flags alone do not pass this gate.
- **Local models:** inventory CPU, RAM, GPU, VRAM, and disk; benchmark a candidate Ollama model for cold start, throughput, context limit, coding task quality, and concurrent load. Decide whether local inference is practical without buying hardware.
- **ChatGPT control option:** verify custom Apps SDK/MCP eligibility for the intended ChatGPT plan/workspace, remote HTTPS or supported secure tunnel requirement, action confirmation and read/write permissions. This remains optional; don't treat a ChatGPT subscription as API credits or a guarantee of write access. Avoid paid access until the use case and plan are justified.
- Decide whether first coding adapter uses CLI or official SDK/app-server based on these tests.

**Exit:** versioned compatibility/integration report; working Codex JSONL parser; demonstrated provider headless/auth checks; process-tree cancellation proof; worktree and filesystem boundary test evidence; local-model benchmark; decision on any provider costs. Automated code modification stays disabled until the OS isolation test passes.

## Phase 1 — Safe local foundation

- Initialize TypeScript/Fastify modular monolith, config validation, redacted logs, SQLite migrations and backup/restore approach.
- Implement task CRUD, append-only lifecycle events, idempotent creation, queued/leased jobs, retry budgets, timeout and cancellation states.
- Implement repository registration, clean/base-commit checks, per-task branch/worktree, diff collection and safe cleanup.
- Implement shared project memory and handoffs in SQLite: project docs, decisions, task-scoped context, execution reports, and cross-agent messages with source/run provenance, revisions, scoped retrieval, and audit events.
- Enforce per-agent concurrency ceilings, per-task timeout/retry/token-or-cost budgets, and usage reporting before adapters can run unattended.
- Add loopback-only listener, local authentication and API authorization; no remote bind.

**Exit:** tasks and project memory persist across restart; worktrees don't overlap; limits are enforced; cancellation/recovery is observable.

## Phase 2 — One coding adapter

- Implement one adapter (recommend Codex CLI if Phase 0 succeeds), capability discovery, version check, event parser, normalization, bounded output and process-tree termination.
- Use task-specific prompts and allowlisted environment. Enforce write scope at OS/process boundary where available.
- Keep automated modifications feature-flagged until Phase 0 OS isolation tests pass on the target host configuration.
- Keep push credentials, deployment secrets, and production environment variables out of child processes.

**Exit:** disposable task yields diff and normalized result; failure, timeout, cancellation and restart behave predictably.

## Phase 3 — Review, approval and audit

- Add separate read-only reviewer on patch and acceptance criteria.
- Add human review state with diff, summary, findings, logs and artifact links.
- Add approve/reject/request-changes with actor and timestamp. No automatic merge.
- Add redaction, retention and audit for lifecycle, routing, approvals, retries and cleanup.

**Exit:** reviewer cannot modify implementation worktree; no merge without explicit approval.

## Phase 4 — Provider expansion and routing

- Add Antigravity and Claude CLI adapters behind installation/auth checks.
- Add deterministic capability/rule routing and per-provider concurrency, rate and cost policy.
- Add Ollama inference for planning/summarization/review; add coding harness only after separate sandbox design.
- Version each parser and record provider version.

**Exit:** shared task model with multiple verified adapters, routing rationale and provider-specific errors/usage.

## Phase 5 — Dashboard

- Add local browser UI over existing API; render queue, live events, approvals, diff and logs.
- Use SSE and authenticated mutations with CSRF protection. Keep UI/API authorization identical.

**Exit:** manage/review tasks locally without expanding network exposure.

## Optional ChatGPT control surface

After the local API and auth model are stable, optionally add an Apps SDK/MCP app exposing narrow task, memory, status, cancellation, and approval-request actions. The local orchestration service remains authoritative for policy and lifecycle. Use remote HTTPS or a supported secure tunnel; do not expose a raw shell or unauthenticated API. Keep this separate from the dashboard and core product. ChatGPT's own action confirmation is supplementary; merge still requires a recorded service-side human approval. Re-check plan/workspace availability and do not make this depend on paid API usage.

## Phase 6 — Optional mobile/remote access

- Threat-model remote access and choose private VPN/overlay or authenticated relay; add device identity, scoped short-lived tokens, revocation, rate limits, TLS and audit.
- Keep remote access off by default; never forward raw terminal/process APIs.
- Consider service installation, backups and update policy after security review.

**Exit:** remote access is intentional, authenticated, revocable and tested independently of provider remote control.

## Release gates

- No implementation until user approves this research set.
- No agent push to main and no automated deployment at any phase.
- No remote listener in early phases.
- Future merge must be a trusted controller action after human approval, diff revalidation and branch protection.
