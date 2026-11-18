# Implementation Roadmap

**Status:** Proposal only; implementation requires approval after this research deliverable.  
**Reviewed:** 2026-11-19

## Phase 0 — Environment and integration spike

- Select supported system Node.js LTS and package manager; verify npm, TypeScript toolchain and Windows process-tree control.
- Pin supported Codex CLI and validate codex exec --json parsing in a disposable repository. No real coding task before worktree and sandbox controls exist.
- Install Antigravity CLI and/or Claude Code only if desired; confirm entitlement and non-interactive login without exposing secrets. Compare output protocol and version stability.
- Check RAM/VRAM/disk before deciding whether Ollama belongs in first release.
- Decide whether first adapter uses Codex CLI or SDK/app-server based on lifecycle needs.

**Exit:** compatibility matrix, cancellation proof, credential storage decision, provider billing/entitlement notes.

## Phase 1 — Safe local foundation

- Initialize TypeScript/Fastify modular monolith, config validation, redacted logs, SQLite migrations and backup/restore approach.
- Implement task CRUD, append-only lifecycle events, idempotent creation, queued/leased jobs, retry budgets, timeout and cancellation states.
- Implement repository registration, clean/base-commit checks, per-task branch/worktree, diff collection and safe cleanup.
- Add loopback-only listener, local authentication and API authorization; no remote bind.

**Exit:** tasks persist across restart; worktrees don't overlap; cancellation/recovery is observable.

## Phase 2 — One coding adapter

- Implement one adapter (recommend Codex CLI if Phase 0 succeeds), capability discovery, version check, event parser, normalization, bounded output and process-tree termination.
- Use task-specific prompts and allowlisted environment. Enforce write scope at OS/process boundary where available.
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
