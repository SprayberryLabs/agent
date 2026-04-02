# @askalf/agent

### Connect any device to the organism.

WebSocket bridge that registers your machine as a node in the AskAlf fleet. Once connected, autonomous agents dispatch tasks to your device — executed via Claude CLI or native shell. Your device becomes part of a self-healing, self-growing AI workforce.

Part of [AskAlf](https://askalf.org) — the first self-healing AI workforce with a nervous system, immune system, and collective memory.

## Install

```bash
npm install -g @askalf/agent
```

## One Command Setup

```bash
askalf-agent connect <your-api-key> --url ws://your-server:3005 --name prod-box --install
```

That's it. Config saved, service installed, runs on boot. Close the terminal — it keeps running.

## What It Does

When connected, your device:

1. **Registers** with the fleet via WebSocket
2. **Scans capabilities** — CPU, RAM, 18 tools checked, Claude CLI detection
3. **Receives tasks** dispatched by the fleet's unified scheduler
4. **Executes autonomously** — Claude CLI or native shell
5. **Emits signals** — confidence, urgency, stuck status flow to the nervous system
6. **Receives alerts** — incident notifications, agent messages, signal broadcasts
7. **Reports results** — output, tokens, cost, duration back to the fleet
8. **Streams progress** — the dashboard sees output in real-time

## Nervous System Integration `v2.9.6`

The agent participates in the fleet's nervous system:

```
Fleet Chief  ──signal──>  Your Device  ──signal──>  Watchdog
     │                         │                        │
     └──── agent:message ──────┘                        │
                               │                        │
                               └── incident:alert ──────┘
```

- **Emits signals** after every execution (success, stuck, urgency)
- **Receives agent messages** with urgency levels (CRITICAL / HIGH / INFO)
- **Receives incident alerts** when the immune system activates
- **Receives signal broadcasts** from fleet-wide awareness

## Service Installation

```bash
askalf-agent install-service
```

| OS | Service Type | Auto-start |
|----|-------------|------------|
| **Linux** | systemd unit | On boot |
| **macOS** | launchd plist | On login |
| **Windows** | Scheduled Task (or nssm) | On login |

## Commands

```
askalf-agent connect <key>         Connect to fleet
askalf-agent connect <key> --install  Connect + install as service
askalf-agent install-service       Install as OS service
askalf-agent uninstall-service     Remove OS service
askalf-agent daemon                Background daemon
askalf-agent status                Connection + service status
askalf-agent scan                  Local capabilities scan
askalf-agent disconnect            Stop daemon
```

## Options

| Flag | Description | Default |
|------|-------------|---------|
| `--url <url>` | Server WebSocket URL | `wss://askalf.org` |
| `--name <name>` | Device display name | System hostname |
| `--install` | Install as service after connecting | |
| `-v, --version` | Show version | |
| `-h, --help` | Show help | |

## How It Works

```
Your Device                     AskAlf Fleet
┌──────────────┐    WSS     ┌────────────────────┐
│ askalf-agent  │◄──────────►│ Forge Orchestrator  │
│              │            │ Unified Scheduler   │
│ Claude CLI   │  signals   │ Nervous System      │
│ Shell        │◄──────────►│ Immune System       │
│ Your Tools   │  messages  │ Collective Memory   │
└──────────────┘            └────────────────────┘
```

- **Heartbeat** every 30s with memory usage and uptime
- **Auto-reconnect** with exponential backoff (2s → 60s max)
- **Capabilities scan** — responds to server requests with full system info
- **10 minute timeout** per execution (configurable)
- **Progress streaming** — real-time output to dashboard

## Programmatic Usage

```typescript
import { AgentBridge, scanCapabilities } from '@askalf/agent';

const caps = scanCapabilities();
console.log(caps);
// { cpu_cores: 8, tools: ['shell', 'git', 'docker', ...], claude_cli: true, ... }

const bridge = new AgentBridge({
  apiKey: 'your-api-key',
  url: 'ws://your-server:3005',
  deviceName: 'my-server',
  hostname: 'prod-01',
  os: 'Linux 6.1',
  capabilities: caps,
});

await bridge.connect();
```

## Requirements

- Node.js 22+
- [Claude CLI](https://docs.anthropic.com/en/docs/claude-code) for AI execution (`npm i -g @anthropic-ai/claude-code`)
- An AskAlf instance (`npx create-askalf` or `curl -fsSL https://get.askalf.org | bash`)

## Links

- [AskAlf](https://askalf.org) — Landing page
- [Demo](https://demo.askalf.org) — Try it free
- [GitHub](https://github.com/askalf/askalf) — Platform source
- [Discord](https://discord.gg/fENVZpdYcX) — Community

MIT — [askalf.org](https://askalf.org)
