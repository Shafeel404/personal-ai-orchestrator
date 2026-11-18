# Security Model

**Status:** Initial threat model for design review  
**Reviewed:** 2026-11-19

## Security objectives

Protect host, repositories, provider credentials, task history, and approval decisions while letting an agent make bounded changes in a disposable worktree. Make every run inspectable and recoverable. Human approval is mandatory before merge; production deployment is not an initial capability.

## Assets and trust boundaries

- **Assets:** source code, files outside project, provider/Git credentials, prompts, diffs, logs, SQLite/backups, machine resources, approval identity.
- **Untrusted inputs:** task text, repository contents, dependency scripts, generated commands, MCP responses, provider output, API paths/branches.
- **Boundaries:** browser/API to service; service to worker; worker to worktree/host/network; service to provider; reviewer to patch; service to Git; local user to future remote client.
- **Assumption:** local Windows account and host aren't compromised. This design cannot make malicious code safe when run as the logged-in user.

## Threats and controls

| Threat | Required controls |
|---|---|
| Prompt injection in source/docs causes exfiltration or destructive commands | Treat repository/provider content as untrusted; no secrets in task environment; deny network where possible; allowlist tools; task-specific writable worktree; human diff review. |
| Escape through absolute paths, symlinks/junctions, shell or subprocess | Validate canonical paths and reparse points; least-privilege Windows identity or OS sandbox; Job Objects/container/WSL after validation; deny profile/sibling repos where practical. Working directory alone isn't a security boundary. |
| Shell injection from prompt, branch, or path | Spawn executable with argument array and shell false; validate IDs/paths; fixed command templates; never interpolate task text into shell. |
| Secret theft from environment/config/output | Pass only necessary environment; use CLI-supported credential store; no API keys in command args; no push/deploy secrets in workers; redact logs; never copy desktop session DBs. |
| Agent commits/pushes protected branch or deploys | No push credentials in worker; block main checkout/merge; no deploy tools/secrets; trusted controller and human gate before merge. |
| Compromised dependency/setup command | Don't auto-run install/build hooks without policy; pin lockfiles, control package scripts/network, cap resources; consider disposable environments. |
| Misconfigured MCP server | Explicitly register/review servers, grant least privilege, obtain consent and audit; deny by default. MCP isn't authorization or sandboxing. |
| Local API abuse, CSRF, or LAN exposure | Loopback bind, auth, Origin/Host checks, CSRF for browser mutations, strict CORS, request/rate limits, no wildcard bind, secure session storage. |
| DB/log disclosure or tampering | Restrict filesystem ACLs; encrypt volume/backups as appropriate; bounded retention; audit approvals; integrity checks; no secrets in DB. |
| Runaway task/retries | Wall-clock, turn, output and disk caps; concurrency limits; retry ceiling/backoff; process-tree cancellation and circuit breaker. |
| Fake approval or self-approval | Authenticated actor; approval binds to task revision/diff hash; reviewer read-only and cannot approve; changed diff invalidates approval. |

## Permission profiles

1. **Inspect/review:** read-only snapshot, no shell or minimal bounded commands, network disabled unless needed.
2. **Standard coding:** writes limited to task worktree; no Git push/merge, production secrets, or broad home access. Build/test commands follow project policy and time/output caps.
3. **Elevated action:** network, package install, broader workspace, or irreversible action denied by default and requires distinct human decision. No unattended approve-all profile.
4. **Manual handoff:** service records needed user action and waits; no GUI simulation.

Provider permission flags are defense-in-depth only. A CLI skip-approval switch suppresses its prompts; it isn't OS containment. Process/filesystem isolation are enforcement.

## Worktree and Git policy

- Create orchestrator-owned branch with opaque task ID; never check out or modify main in worker.
- Record base commit, branch and worktree path; verify registered repository; collect patch through trusted controller.
- Workers may make local commits only if needed; no remote push credentials. Controller checks changed paths, symlinks, branch, status, binary size and base before review.
- Approval binds to diff hash and base commit. Any patch change invalidates approval.
- Cleanup only after preserving artifacts and confirming worker exit. Use Git worktree remove/prune; never recursively delete an unchecked computed path.

## API and process handling

- Loopback-only service; random local auth secret in OS-protected storage; rotation/revocation.
- Spawn with shell false, argument arrays, known cwd, allowlisted environment, bounded streams, timeout, process-tree kill.
- Task-scoped scratch directories. Don't expose all of %USERPROFILE%, SSH keys, cloud credentials, browser profiles, or Codex/IDE state.
- Restrict network where practical; when needed for model APIs, allow provider endpoints and record policy. Validate Windows enforcement.
- Verify provider version/capability before start. Don't infer a desktop subscription, CLI login, or API key grants another product's entitlement.

## Approval boundaries

- Human explicitly accepts a named revision/diff before merge. AI review is advisory.
- Future merge is performed by trusted service/user after rechecking base, target, branch policy and approval hash. Agent credentials cannot merge/push.
- Production credentials and deployment are excluded. Future deployment requires separate approval and independent control plane.

## Residual risk

Agents can generate malicious code or abuse granted tools. A process under logged-in Windows user may access broadly despite a task worktree; strong confinement requires validated OS/container/VM setup. Local administrators can bypass controls. Providers may retain submitted data under their terms; don't submit sensitive code until account data handling is understood.

## References

- [OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/)
- [MCP authorization](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization)
- [Node.js child process API](https://nodejs.org/api/child_process.html)
- [Git worktree](https://git-scm.com/docs/git-worktree)
- [Codex sandbox options](https://developers.openai.com/codex/cli)
- [Claude Code permissions](https://docs.anthropic.com/en/docs/claude-code/permissions)
- [Antigravity CLI permissions](https://antigravity.google/docs/cli/permissions/)
