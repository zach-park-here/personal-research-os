# Getting Started

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Redis (for job queue)
- Google Cloud project (for Calendar API)
- OpenAI API key (for agents)

## Installation

1. Clone and install dependencies:
```bash
cd personal-research-os
npm install
```

2. Set up environment variables:
```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your API keys
```

3. Initialize database:
```bash
npm run db:migrate
npm run db:seed  # Optional: add sample data
```

4. Start Redis (required for job queue):
```bash
# macOS
brew services start redis

# Linux
sudo systemctl start redis

# Windows (with WSL)
sudo service redis-server start
```

## Development

Start all services:
```bash
npm run dev
```

This runs:
- Backend API (http://localhost:3000)
- Frontend UI (http://localhost:5173)
- Agent workers (background)

Or run individually:
```bash
npm run dev:backend
npm run dev:frontend
npm run dev:mcp
```

## Configuration

### Google Calendar Setup

1. Create a Google Cloud project
2. Enable Google Calendar API
3. Create OAuth 2.0 credentials
4. Add credentials to `backend/.env`

### Chrome History Import

First import:
```bash
# macOS/Linux
npm run import:chrome -- --user-data-dir="$HOME/Library/Application Support/Google/Chrome"

# Windows
npm run import:chrome -- --user-data-dir="%LOCALAPPDATA%\Google\Chrome\User Data"
```

## Project Structure

```
personal-research-os/
├── backend/              # Express API, orchestrator, DB
│   ├── src/
│   │   ├── api/         # REST endpoints
│   │   ├── db/          # Database, migrations
│   │   ├── orchestrator/# Triggers, queue, agent caller
│   │   ├── services/    # Business logic
│   │   └── types/       # Backend-specific types
│   └── tests/
├── frontend/            # React web UI
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── pages/       # Page components
│   │   ├── hooks/       # Custom hooks
│   │   ├── services/    # API client
│   │   └── types/       # Frontend types
│   └── public/
├── agents/              # Agent library (imported by backend)
│   ├── src/
│   │   ├── workers/     # Agent implementations
│   │   ├── utils/       # Helper functions
│   │   └── types/       # Agent schemas
│   └── tests/
├── mcp-server/          # Desktop MCP for local files
│   ├── src/
│   │   └── tools/       # MCP tool implementations
│   └── tests/
├── shared/              # Shared types and utils
│   ├── types/
│   └── utils/
└── docs/                # Documentation
```

## Next Steps

1. Read [ARCHITECTURE.md](./ARCHITECTURE.md) for system design
2. Read [DATABASE.md](./DATABASE.md) for schema details
3. Import Chrome history for profiling
4. Create your first task in the UI
5. See triggered research in action

## Troubleshooting

### Redis connection fails
- Ensure Redis is running: `redis-cli ping` should return `PONG`
- Check `REDIS_HOST` and `REDIS_PORT` in `.env`

### Database errors
- Delete `backend/data/app.db` and re-run migrations
- Check file permissions

### MCP tools not working
- Ensure paths are absolute
- Check file system permissions
