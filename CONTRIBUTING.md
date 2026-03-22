# Contributing to @askalf/agent

## Setup

```bash
git clone https://github.com/askalf/agent.git
cd agent
npm install
```

## Development

```bash
# Run in dev mode
npm run dev

# Type check
npx tsc --noEmit

# Build
npm run build
```

## Testing

Connect to a running AskAlf instance:

```bash
npx tsx src/cli.ts connect <your-api-key> --url wss://localhost:3001
```

## Pull Requests

1. Fork the repo
2. Create a feature branch
3. Make your changes
4. Run `npx tsc --noEmit` to verify types
5. Open a PR with a clear description

## Code Style

- TypeScript strict mode
- No `any` types
- Async/await over callbacks
- Descriptive variable names
