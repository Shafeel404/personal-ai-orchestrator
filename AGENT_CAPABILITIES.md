# Agent Capabilities: Verified Interfaces and Host Findings

**Reviewed:** 2026-11-19

This separates provider documentation from host inspection. CLI and pricing behavior change; verify again during implementation and each adapter release.

## Summary

| Agent/tool | Documented automation path | Local finding | Recommendation |
|---|---|---|---|
| OpenAI Codex CLI | codex exec; JSONL with --json; sandbox/approval flags; CLI/app-server/SDK surfaces | Installed, codex-cli 0.169.0-alpha.11.1; local help confirms exec and --json. | Best first adapter to prototype, with explicit sandbox/account policy. Auth wasn't tested. |
| Google Antigravity | agy -p headless; text, JSON, stream-json; documented permissions | IDE installed; agy not on PATH and auth not tested. | Automatable after supported CLI install and account setup. IDE alone is manual; don't automate UI. |
| Gemini CLI | Official project docs -p and JSON/stream-json headless modes. Google announced transition to Antigravity CLI; terms differ by account. | gemini not on PATH. | Treat as legacy/conditional until current distribution and eligibility are confirmed. |
| Anthropic Claude Code | claude -p; JSON/stream-json; turn/model/permission controls; Agent SDK | claude not on PATH. | Automatable after install and valid subscription/API/enterprise auth. Don't use permission bypass as security design. |
| Ollama | Local REST API /api/chat and /api/generate; OpenAI-compatible endpoint; inference, not automatically coding agent | ollama not on PATH; service not probed. | Add for planning/review first; later pair with sandboxed coding harness. |
| Antigravity IDE / GUI apps | Manual unless supported CLI/API exists; Antigravity has documented CLI | IDE installation observed. | Manual handoff only; no coordinate/click/key automation. |

## OpenAI Codex CLI

**Local CLI help:** Installed binary reports codex-cli 0.169.0-alpha.11.1. It has non-interactive exec, JSONL --json, model selection, --cd, --worktree, sandbox modes (read-only, workspace-write, danger-full-access), approval policy, and output-last-message. app-server and exec-server are experimental; don't assume remote execution is a stable local API.

**Official docs:** OpenAI describes CLI, SDK and app-server integration surfaces; codex exec is for bounded scripted tasks. Self-hosted execution is documented but requires Agents API credentials and outbound service access. Start with local codex exec; consider SDK/app-server after compatibility tests.

**Limits/unknowns:** Auth/billing weren't checked. CLI is alpha; flags/schemas may change. Installation doesn't establish subscription entitlement or API cost.

Sources: [Codex as a platform](https://developers.openai.com/blog/codex-as-a-platform), [Codex CLI](https://developers.openai.com/codex/cli), [Codex self-hosted sandboxes](https://developers.openai.com/api/docs/guides/agents-api/environments/self-hosted).

## Google Antigravity / Gemini

**Official Antigravity docs:** CLI supports headless single-prompt mode (agy -p / --prompt) and text, json, stream-json. It uses cached credentials; in an unauthenticated non-interactive environment it errors rather than prompting. CLI documents command allow/deny permissions and remote control. Keep response on stdout and diagnostics on stderr; parse structured events/errors, not prose heuristics.

**Transition notice:** Google's May 19, 2026 announcement says Gemini CLI and Antigravity are unifying into Antigravity CLI. Enterprise/API-key access may remain under distinct terms. Treat Gemini CLI as legacy/conditional until current distribution and eligibility are confirmed.

**Local findings:** Antigravity IDE exists under Programs, but agy and gemini aren't on PATH. IDE presence doesn't establish CLI availability or auth.

Sources: [Antigravity headless mode](https://antigravity.google/docs/cli/headless/), [Antigravity features](https://antigravity.google/docs/features), [Google transition announcement](https://developers.googleblog.com/an-important-update-transitioning-gemini-cli-to-antigravity-cli/).

## Anthropic Claude Code

**Official docs:** Claude Code provides print mode (claude -p), json and stream-json, model/turn controls, permission modes, tool allow/deny rules, and documented Agent SDK. Windows support is via WSL or native Windows with Git for Windows. Authentication can involve Anthropic Console billing, eligible Claude subscriptions, or enterprise platforms. Confirm entitlement before automation.

**Local finding:** No claude command on PATH; auth not tested.

**Limits:** Non-interactive permissions need deliberate configuration. Force/bypass permission option is dangerous; don't make it routine worker mode. Provider/subscription terms can change.

Sources: [Claude Code CLI usage](https://docs.anthropic.com/en/docs/claude-code/cli-usage), [Claude Code setup](https://docs.anthropic.com/en/docs/claude-code/getting-started), [Claude Agent SDK](https://docs.anthropic.com/en/docs/claude-code/sdk).

## Ollama and compatible local inference

**Official docs:** Ollama exposes local chat/generate and OpenAI-compatible APIs. An endpoint returns model responses but doesn't itself grant safe repository access, file edits, or test execution. Compatible servers vary in tool calling and streaming.

**Local finding:** No ollama CLI on PATH; no request was made to a presumed service. Installation, models, and hardware are unknown.

**Limits/costs:** Local models avoid hosted per-token charges but shift cost to hardware, electricity, disk, and latency. Coding quality, context, tool support, and RAM/VRAM vary. Ollama cloud isn't local inference and has separate terms.

Sources: [Ollama API](https://docs.ollama.com/api/introduction), [OpenAI compatibility](https://docs.ollama.com/openai), [Ollama pricing](https://ollama.com/pricing).

## Execution classes

1. **Automated coding agents:** documented CLI/SDK may inspect/edit a worktree and run tools. Initial candidates: Codex and, once installed, Antigravity/Claude Code.
2. **Inference endpoints:** generate/review text; no implicit filesystem or shell powers. Initial candidate: Ollama.
3. **Manual agents:** desktop app/account without supported automation surface. Orchestrator pauses for user action and accepts pasted result/diff; no GUI simulation.

Availability distinguishes missing, present_unauthenticated, ready, unsupported_version, blocked_by_policy, and unknown. Never test auth by printing environment variables or reading app credential stores.
