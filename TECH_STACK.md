# Technical Stack Proposal

**Status:** Research proposal  
**Reviewed:** 2026-11-19

## Recommended initial stack

| Area | Proposal | Why / boundary |
|---|---|---|
| Runtime | Supported Node.js LTS with TypeScript | Inspected Node is in Codex's private runtime cache (v24.22.3); don't bind project to it. Install normal system Node before implementation. npm was not found on PATH. |
| HTTP | Fastify, schema-validated routes | Local API with runtime validation; bind to 127.0.0.1 initially. |
| Database | SQLite, one local file | Durable task/event state without a database server. WAL, single-writer discipline, migrations, busy timeout, backups and integrity checks. |
| SQLite driver | Decide after Node LTS/native build spike; likely better-sqlite3 | Native addon installation/build on Windows must be verified. Keep repository interface independent of driver. Avoid ORM until justified. |
| Queue | SQLite-backed leased jobs and one worker loop | Avoid Redis overhead. Lease expiry and startup reconciliation aid recovery; in-memory queue is not authoritative. |
| Validation | JSON Schema via Fastify Type Providers or TypeBox | Define runtime contracts as well as compile-time types. |
| Process management | Node child_process.spawn with argument arrays; Windows Job Objects or dedicated worker for process-tree cancellation | Avoid shell interpolation; allowlist environment and cap time/output. |
| Agent tools | Provider CLI first, official SDK where supported; direct API for inference/review roles | Preserve coding-agent harness without treating text inference as code execution. |
| Version control | Git for Windows and git worktree | Isolated branch and checkout per task. Inspected version 2.54.0.windows.1. |
| Logging | Structured JSON with task/run correlation; append-only task events in SQLite | Redact before persistence; rotate bounded diagnostic logs. |
| UI later | Local web UI and SSE | Reuse API and lifecycle. |
| MCP | Optional tool boundary, not required for core orchestration | Standardized tool exposure can help, but doesn't replace adapters, OS permissions, or auth. |

## Initial architecture

Start as a modular monolith with modules for tasks, routing, workers, worktrees, adapters, reviews, auth, and audit. A worker can become a separate Windows process after lifecycle behavior stabilizes. SQLite remains authoritative; the dashboard does not own task state.

## Local inspection (2026-11-19)

- Codex is on PATH, version codex-cli 0.169.0-alpha.11.1. codex exec is non-interactive; --json emits JSONL. Prerelease: pin and revalidate.
- Git is on PATH, version 2.54.0.windows.1.
- Node v24.22.3 is at C:\Users\shafe\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe; npm/npx aren't on PATH.
- Antigravity IDE is installed in %LOCALAPPDATA%\Programs\Antigravity IDE. agy isn't on PATH. IDE presence doesn't verify CLI install or auth.
- claude, gemini, ollama aren't on PATH. This doesn't prove absence in all user directories or that services are unreachable; normal PATH discovery can't find them.
- Repository directory was empty; no project instructions or app constraints were present.

## Dependency and operations policy

Keep runtime dependencies small and lock versions. Review native addon supply chain and install scripts. Use Windows Credential Manager or DPAPI-backed storage for user-managed credentials; don't put provider tokens in committed .env files, prompts, child process arguments, or logs. Prefer each CLI's supported login store. Never inspect/copy desktop app private session databases.

## Cost model

- Orchestrator can run locally without hosted bills; costs are machine capacity, disk, power, and maintenance.
- Codex, Claude Code, and Google tools may use different plans, API billing, or enterprise arrangements. Subscription access doesn't automatically grant API credits or unrestricted automation. Check entitlement and terms for every provider.
- API cost depends on model, tokens, retries, context, and tool usage. Add per-task/daily caps where usage supports them; don't promise an exact cost before model/workload selection.
- Ollama local inference avoids hosted per-token charges for local models but needs storage and adequate CPU/GPU/RAM. Ollama cloud has separate terms.
- Use provider-reported usage when available; label computed cost as estimated.

## Source references

- [Fastify validation](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/)
- [Node.js child processes](https://nodejs.org/api/child_process.html)
- [SQLite WAL](https://sqlite.org/wal.html)
- [Git worktrees](https://git-scm.com/docs/git-worktree)
- [Codex CLI](https://developers.openai.com/codex/cli)
- [Claude Code setup/authentication](https://docs.anthropic.com/en/docs/claude-code/getting-started)
- [Ollama API](https://docs.ollama.com/api/introduction)
- [Ollama pricing](https://ollama.com/pricing)
