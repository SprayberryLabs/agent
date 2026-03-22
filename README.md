# @askalf/agent

**Connect any device to your AskAlf team.**

WebSocket bridge that registers your machine as a worker in the AskAlf platform. Alf dispatches tasks to your device — executed via Claude CLI, Codex, or native shell. Works on Linux, macOS, Windows, Raspberry Pi, cloud VMs, CI runners.

Part of [AskAlf](https://askalf.org) — the self-hosted AI workforce platform. 109 templates, 16 categories, community skills library.

## Install

```bash
npm install -g @askalf/agent
```

Don't have AskAlf yet?

```bash
curl -fsSL https://get.askalf.org | bash
```

## Quick Start

```bash
# Connect this device to your team
askalf-agent connect <your-api-key>

# Connect to a self-hosted instance
askalf-agent connect <api-key> --url wss://your-server.com

# Run as a background daemon
askalf-agent daemon

# Check status + device capabilities
askalf-agent status

# View execution audit log
askalf-agent audit

# View security policy
askalf-agent policy

# Stop the agent
askalf-agent disconnect
```

## What It Does

When connected, your device:

1. **Registers** with AskAlf via encrypted WebSocket (WSS)
2. **Reports capabilities** — 26 tools auto-detected (git, docker, node, python, kubectl, terraform, etc.)
3. **Receives tasks** dispatched by Alf or the unified dispatcher
4. **Validates input** — security policy checks every task before execution
5. **Requests approval** — optional interactive approval gate for each task
6. **Executes** via the best available executor (Claude CLI, Codex, or native shell)
7. **Sanitizes output** — strips API keys, tokens, and credentials before sending results
8. **Reports results** with token counts, cost, duration — all logged to encrypted audit trail

## Executors

The agent picks the best executor available on your device:

| Priority | Executor | When |
|----------|----------|------|
| 1 | **Claude CLI** | AI-powered, full intent understanding, tool use |
| 2 | **Codex CLI** | AI-powered fallback |
| 3 | **Shell** | bash/PowerShell/cmd — direct execution with policy guardrails |

Devices without AI CLIs still work — shell mode executes commands directly with the security policy enforcing safety.

- **Windows**: prefers PowerShell (pwsh), falls back to cmd
- **Linux/macOS**: prefers bash, falls back to /bin/sh

## Security

### Encryption

| Layer | Protection |
|-------|-----------|
| **Config at rest** | AES-256-GCM, machine-derived key (scrypt) |
| **Audit log** | Task inputs + errors encrypted per-field |
| **In transit** | WSS (TLS 1.2+), reject self-signed certs |
| **Certificate pinning** | Optional SHA-256 fingerprint verification |
| **File permissions** | 0o600 on all sensitive files |

Config files are encrypted with a key derived from your machine's identity — they can't be decrypted on another machine.

### Execution Policy

Configurable via `~/.askalf/policy.json`:

```json
{
  "requireApproval": false,
  "trustedAgents": ["Watchdog", "Monitor"],
  "blockedPatterns": ["rm -rf /", "DROP TABLE", "..."],
  "allowedPaths": ["/home/user/projects"],
  "maxTimeoutMs": 600000,
  "sanitizeOutput": true,
  "auditLog": true
}
```

- **Approval gate** — require interactive Y/N before each execution (60s timeout)
- **Trusted agents** — auto-approve known workers
- **32 blocked patterns** — rm -rf, fork bombs, DROP TABLE, credential theft, remote code execution
- **Path boundaries** — restrict filesystem access
- **Output sanitization** — automatically strips API keys, tokens, JWTs, private keys, passwords, connection strings

### Audit Trail

Every execution is logged to `~/.askalf/audit.log` (encrypted):

```bash
askalf-agent audit --limit 20
```

Shows: timestamp, agent name, executor, result (success/failed/denied/blocked), cost, duration.

## Options

```
askalf-agent connect <api-key> [options]

  --url <url>           Server WebSocket URL (default: wss://askalf.org)
  --name <name>         Device display name (default: hostname)
  --concurrent <n>      Max concurrent tasks (default: 2)
  --timeout <minutes>   Execution timeout (default: 10)

askalf-agent daemon               Run as background service
askalf-agent status               Device info + capabilities
askalf-agent audit [--limit N]    View execution audit log
askalf-agent policy               View security policy
askalf-agent disconnect           Stop the agent
askalf-agent --version            Show version
```

## Capability Detection

The agent auto-detects 26 tools on your device:

**Core**: bash, powershell, git, docker, node, python
**AI**: claude, codex
**Network**: curl, wget, ssh, rsync
**Build**: make, go, rust (cargo), java, dotnet
**Cloud**: kubectl, terraform, aws, gcloud, az
**Media**: ffmpeg
**Data**: jq

Capabilities are reported to AskAlf so Alf knows what your device can handle.

## Task Queue

The agent handles multiple tasks concurrently:

- Default 2 concurrent executions (configurable with `--concurrent`)
- Overflow tasks queue automatically
- Queue position reported to server
- Tasks drain from queue as slots free up

## How It Works

```
Your Device                      AskAlf Platform
┌───────────────────┐   WSS    ┌──────────────────────┐
│  askalf-agent      │◄────────►│  Forge Orchestrator   │
│                   │  (TLS)  │  Unified Dispatcher   │
│  Security Policy  │         │  Event Bus (Redis)    │
│  Audit Log        │         │  Memory + Knowledge   │
│  Crypto Layer     │         │  26 MCP Tools         │
│                   │         │                      │
│  Claude/Codex/    │         │  ┌─────────────────┐  │
│  Shell Executor   │         │  │ Dashboard       │  │
└───────────────────┘         │  │ Ask Alf · Team  │  │
                              │  └─────────────────┘  │
                              └──────────────────────┘
```

## Programmatic Usage

```typescript
import { AgentBridge } from '@askalf/agent';

const bridge = new AgentBridge({
  apiKey: 'your-api-key',
  url: 'wss://your-server.com',
  deviceName: 'prod-01',
  hostname: 'prod-01.example.com',
  os: 'Linux 6.1 (linux)',
  capabilities: { shell: true, docker: true, git: true, node: true },
  maxConcurrent: 4,
  executionTimeoutMs: 300_000,
  tlsPinSha256: 'abc123...',  // optional cert pinning
});

await bridge.connect();
```

## Requirements

- Node.js 22+ (18+ may work)
- An AskAlf instance running
- Optional: [Claude CLI](https://docs.anthropic.com/en/docs/claude-code) for AI-powered execution

## Supported Platforms

Runs anywhere Node.js runs — Linux, macOS, Windows, Raspberry Pi, cloud VMs, CI runners, Docker containers.

## Related

- [AskAlf Platform](https://github.com/askalf/askalf) — the full platform
- [Discord](https://discord.gg/fENVZpdYcX) — community support
- [askalf.org](https://askalf.org) — landing page

## License

MIT — [askalf.org](https://askalf.org)
