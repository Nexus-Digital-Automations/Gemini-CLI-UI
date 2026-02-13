# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

**Gemini CLI UI** is a web-based interface for [Gemini CLI](https://github.com/google-gemini/gemini-cli), Google's official CLI for AI-assisted coding. The project provides a responsive desktop and mobile UI for managing projects, sessions, and interactions with Gemini CLI.

**Status:** Currently in TypeScript rewrite transition. Both legacy JavaScript server (`/server`) and new TypeScript monorepo (`/packages`) coexist.

---

## Architecture

### Dual Architecture (Transition Phase)

```
┌─────────────────────────────────────────────────────────────┐
│  ROOT (Legacy + New)                                        │
├─────────────────────────────────────────────────────────────┤
│  /server/          → Legacy Express server (JavaScript)     │
│  /packages/        → New TypeScript monorepo                │
│    ├── shared/     → Shared types and constants             │
│    ├── backend/    → TypeScript backend (Express + Drizzle) │
│    └── frontend/   → React 19 + Vite + Tailwind v4         │
└─────────────────────────────────────────────────────────────┘
```

**CRITICAL:** The root `npm run dev` now runs the NEW frontend from `packages/frontend`, NOT the legacy server.

### Technology Stack

**Frontend:**
- React 19 + React Router v7
- Vite 7 (build tool)
- Tailwind CSS v4.1 (requires `@tailwindcss/postcss` plugin)
- TanStack Query (data fetching)
- Zustand (state management)
- TypeScript (strict mode)

**Backend:**
- Node.js + Express
- Better-sqlite3 + Drizzle ORM
- WebSocket (ws) for real-time communication
- JWT authentication (bcrypt password hashing)
- TypeScript (strict mode)

**Legacy Server (JavaScript):**
- Express + WebSocket
- Session management via JSONL files
- Gemini CLI process spawning
- Located in `/server/` directory

---

## Development Commands

### Workspace Commands (npm workspaces)

```bash
# From project root - runs FRONTEND only
npm run dev

# Run backend only (TypeScript backend)
npm run dev:backend

# Run both frontend AND backend concurrently
npm run dev:all

# Build all packages (shared, backend, frontend)
npm run build
```

### Individual Package Commands

**Shared Package** (`packages/shared/`)
```bash
npm run build        # Build TypeScript types
npm run type-check   # Verify type safety
```

**Backend** (`packages/backend/`)
```bash
npm run dev          # Start dev server with hot reload (tsx watch)
npm run build        # Build TypeScript to dist/
npm start            # Start production server
npm test             # Run unit tests (vitest)
npm run test:e2e     # Run E2E tests
npm run type-check   # Type checking only
npm run db:generate  # Generate Drizzle migrations from schema
npm run db:migrate   # Run pending migrations
```

**Frontend** (`packages/frontend/`)
```bash
npm run dev          # Start Vite dev server
npm run build        # Build for production (tsc + vite build)
npm run preview      # Preview production build
npm test             # Run unit tests (vitest)
npm run type-check   # Type checking only (tsc --noEmit)
npm run lint         # ESLint check
npm run clean        # Remove dist/
```

### Legacy Server (JavaScript)

```bash
npm run server       # Start legacy server at /server/index.js
npm run client       # Start Vite from root (deprecated)
```

---

## Critical Setup Requirements

### 1. Tailwind CSS v4 PostCSS Configuration

**IMPORTANT:** Tailwind v4 requires a separate PostCSS plugin package.

`packages/frontend/postcss.config.js` MUST use:
```javascript
export default {
  plugins: {
    '@tailwindcss/postcss': {},  // ← NOT 'tailwindcss'
    autoprefixer: {},
  },
};
```

Package installed: `@tailwindcss/postcss` (already in devDependencies)

### 2. TypeScript Project References

`packages/frontend/tsconfig.node.json` MUST have `composite: true`:
```json
{
  "compilerOptions": {
    "composite": true,  // ← Required for project references
    // ...
  }
}
```

### 3. Build Order Dependency

**Always build `shared` package first** before building backend or frontend:
```bash
cd packages/shared && npm run build
```

Both backend and frontend import from `@gemini-ui/shared`, which must be compiled.

### 4. Environment Configuration

Backend requires `.env` file:
```bash
cd packages/backend
cp .env.example .env
```

Minimum required variables:
```env
PORT=4010                              # Backend API port
NODE_ENV=development
DATABASE_PATH=./data/gemini-ui.db
ALLOWED_ORIGINS=http://localhost:5173  # Frontend dev server
```

**JWT_SECRET** is auto-generated on first run and saved to `packages/backend/.jwt-secret`

---

## Database Management

### Schema & Migrations (Drizzle ORM)

**Schema definition:** `packages/backend/src/db/schema.ts`

**Migration workflow:**
1. Modify `schema.ts`
2. Generate migration: `npm run db:generate`
3. Review generated SQL in `src/db/migrations/`
4. Apply migration: `npm run db:migrate`

**Tables:**
- `users` - User accounts with bcrypt hashed passwords
- `refresh_tokens` - JWT refresh token management
- `sessions` - Chat sessions with Gemini
- `projects` - Project metadata
- `chat_messages` - Chat history

**Database file:** `packages/backend/data/gemini-ui.db` (SQLite)

---

## Module Architecture Pattern

The backend follows a strict modular pattern. **Follow this structure for all new features:**

```
packages/backend/src/modules/<feature>/
├── <feature>.service.ts     # Business logic layer
├── <feature>.controller.ts  # HTTP request handlers
├── <feature>.routes.ts      # Express route definitions
└── __tests__/               # Unit tests
    └── <feature>.service.test.ts
```

**Example:** Authentication module (`modules/auth/`)
- `auth.service.ts` - Password hashing, JWT generation, user lookup
- `auth.controller.ts` - Register, login, refresh, logout handlers
- `auth.routes.ts` - POST /register, POST /login, etc.

**Data flow:**
```
Request → Route → Controller → Service → Database
Response ← Route ← Controller ← Service ← Database
```

**Validation:** All input validation uses Zod schemas defined in `packages/shared/src/types/`

---

## Gemini CLI Integration

### Legacy Wrapper (JavaScript)

**Location:** `/server/gemini-cli.js`

**Key responsibilities:**
- Spawn Gemini CLI process via `child_process.spawn()`
- Pass model selection: `--model gemini-2.5-flash`
- Detect and pass MCP config: `--mcp-config ~/.gemini.json`
- Stream output back to client via WebSocket

**MCP Config Detection:**
Automatically checks for:
1. Global: `~/.gemini.json`
2. Project-specific: `.gemini/mcp.json` in project directory

### New TypeScript Implementation (In Progress)

**Module:** `packages/backend/src/modules/gemini/`

**Routes:**
- `GET /api/gemini/models` - List available Gemini models

**Planned:** Full Gemini CLI wrapper with model selection and MCP integration

---

## Frontend Structure

### Feature-Based Organization

```
packages/frontend/src/
├── features/              # Feature modules
│   ├── auth/              # Authentication (login, register)
│   │   ├── components/
│   │   ├── hooks/
│   │   └── __tests__/
│   ├── chat/              # Chat interface
│   ├── projects/          # Project management
│   ├── mcp/               # MCP server configuration (NEW)
│   └── files/             # File explorer
├── pages/                 # Route pages
├── components/            # Shared components
├── stores/                # Zustand state stores
├── lib/                   # Utilities
└── routes/                # React Router configuration
```

### State Management

**Zustand stores** for global state:
- Authentication state (user, tokens)
- Active project/session
- UI state (sidebar, modals)

**TanStack Query** for server state:
- Data fetching
- Cache management
- Optimistic updates

---

## Testing Strategy

### Backend Tests

**Framework:** Vitest

**Test locations:** `packages/backend/src/modules/**/__tests__/*.test.ts`

**Run tests:**
```bash
npm test              # Watch mode
npm run test:e2e      # E2E tests
```

**Pattern:**
```typescript
import { describe, it, expect } from 'vitest';
import { AuthService } from '../auth.service';

describe('AuthService', () => {
  it('should hash passwords with bcrypt', async () => {
    const password = 'SecurePass123!';
    const hash = await AuthService.hashPassword(password);
    expect(hash).not.toBe(password);
  });
});
```

### Frontend Tests

**Framework:** Vitest + Testing Library (in setup)

**Note:** Test files exist but have missing dependencies (`@testing-library/react`). Tests are excluded from TypeScript build.

**To run tests after setup:**
```bash
npm test
```

---

## Security Considerations

### Authentication Flow

1. **Registration:** POST `/api/auth/register`
   - Password hashed with bcrypt (12 rounds)
   - JWT access token (7 days) + refresh token (30 days)
   - Tokens stored in SQLite `refresh_tokens` table

2. **Login:** POST `/api/auth/login`
   - Validates credentials
   - Returns new access + refresh tokens

3. **Token Refresh:** POST `/api/auth/refresh`
   - Validates refresh token
   - Issues new access token

4. **Protected Routes:**
   - Middleware: `packages/backend/src/middleware/auth.middleware.ts`
   - Validates JWT from `Authorization: Bearer <token>` header

### Rate Limiting

Configured in `packages/backend/src/middleware/rate-limit.ts`:
- Auth endpoints: 5 requests/15 minutes
- Refresh: 100 requests/minute
- General: 100 requests/15 minutes

### Security Headers

Applied via Helmet middleware:
- CSP (Content Security Policy)
- HSTS (HTTP Strict Transport Security)
- X-Frame-Options
- X-Content-Type-Options

---

## Planned Features (Implementation Roadmap)

### PHASE 1: Foundation ✅ COMPLETE
- TypeScript monorepo setup
- Authentication system
- Database schema
- Security middleware

### PHASE 2: Backend Modules (In Progress)
- Projects CRUD
- Sessions management
- File operations
- Git integration
- Gemini CLI wrapper
- WebSocket server

### PHASE 3: Frontend (In Progress)
- React 19 migration
- Authentication UI
- Chat interface
- File explorer
- Terminal emulator

### PHASE 4: MCP Integration (Planned)
- MCP server management UI
- `~/.gemini.json` configuration
- stdio/SSE/HTTP transport support
- Server process hosting

### PHASE 5: Advanced Features (Planned)
- Model selection UI
- Folder picker (Web File System Access API)
- Session history and search
- Mobile responsive design
- PWA capabilities

---

## Common Issues and Solutions

### Issue: `npm run dev` shows "No workspaces found"

**Cause:** Missing `workspaces` config in root `package.json`

**Fix:** Ensure root package.json has:
```json
{
  "workspaces": ["packages/*"]
}
```

### Issue: Tailwind PostCSS error "trying to use tailwindcss directly"

**Cause:** Using old `tailwindcss` plugin instead of `@tailwindcss/postcss`

**Fix:**
1. Install: `npm install --save-dev @tailwindcss/postcss`
2. Update `postcss.config.js` to use `'@tailwindcss/postcss': {}`

### Issue: TypeScript errors about project references

**Cause:** `tsconfig.node.json` missing `composite: true`

**Fix:** Add `"composite": true` to compilerOptions in `tsconfig.node.json`

### Issue: Backend can't find shared types

**Cause:** Shared package not built

**Fix:**
```bash
cd packages/shared
npm run build
```

### Issue: Database locked or permission errors

**Fix:**
```bash
rm packages/backend/data/gemini-ui.db-shm
rm packages/backend/data/gemini-ui.db-wal
```

### Issue: Port 4010 already in use

**Fix:**
```bash
lsof -ti:4010 | xargs kill -9
# OR change port in packages/backend/.env
```

---

## Gemini CLI Configuration

### Project Discovery

Gemini CLI stores projects in: `~/.gemini/projects/`

Each project has:
- Metadata in `.gemini/project.json`
- Session transcripts in `.gemini/sessions/*.jsonl`

### Model Selection

Available models (as of implementation):
- **Gemini 3 (Preview):** `gemini-3-pro-preview`, `gemini-3-flash-preview`
- **Gemini 2.5 (Stable):** `gemini-2.5-pro`, `gemini-2.5-flash`, `gemini-2.5-flash-lite`
- **Gemini 2.0 (Deprecated):** `gemini-2.0-flash` (sunset March 31, 2026)

**Default model:** `gemini-2.5-flash`

### MCP Server Configuration

Located in: `~/.gemini.json`

Example:
```json
{
  "mcpServers": {
    "filesystem": {
      "transport": "stdio",
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/Users/username"]
    }
  }
}
```

**Supported transports:**
- `stdio` - Process spawning (can be hosted by UI)
- `sse` - Server-Sent Events (external)
- `http` - HTTP endpoints (external)

---

## Development Workflow Best Practices

### When Adding a New Feature

1. **Define types first** in `packages/shared/src/types/`
2. **Build shared package:** `cd packages/shared && npm run build`
3. **Create backend module** following pattern:
   - `<feature>.service.ts`
   - `<feature>.controller.ts`
   - `<feature>.routes.ts`
4. **Add route to server:** Update `packages/backend/src/server.ts`
5. **Write unit tests** in `__tests__/`
6. **Create frontend feature module** in `packages/frontend/src/features/`
7. **Test end-to-end** with both frontend and backend running

### Before Committing

```bash
# Type check all packages
cd packages/shared && npm run type-check
cd packages/backend && npm run type-check
cd packages/frontend && npm run type-check

# Run tests
cd packages/backend && npm test

# Build to verify no errors
cd packages && npm run build
```

### Database Schema Changes

1. Modify `packages/backend/src/db/schema.ts`
2. Generate migration: `npm run db:generate`
3. **Review SQL** in generated migration file
4. Apply: `npm run db:migrate`
5. Commit both schema.ts and migration files

---

## Port Configuration

| Service | Port | Configurable In |
|---------|------|-----------------|
| Backend API | 4010 | `packages/backend/.env` → PORT |
| Frontend Dev | 5173 | Vite default (auto-increments if occupied) |
| Legacy Server | 4008 | Root `.env` → PORT |
| Legacy Frontend | 4009 | Root `.env` → VITE_PORT |

**CORS:** Backend `ALLOWED_ORIGINS` must include frontend URL (default: `http://localhost:5173`)

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `packages/shared/src/types/` | TypeScript type definitions |
| `packages/backend/src/db/schema.ts` | Drizzle ORM database schema |
| `packages/backend/src/server.ts` | Backend entry point |
| `packages/backend/src/config/index.ts` | Environment configuration |
| `packages/frontend/src/App.tsx` | Frontend root component |
| `packages/frontend/postcss.config.js` | Tailwind v4 PostCSS config |
| `server/gemini-cli.js` | Legacy Gemini CLI wrapper |
| `server/index.js` | Legacy Express server |

---

## Related Documentation

- `README.md` - User-facing documentation
- `packages/QUICK_START.md` - Fast development setup
- `packages/SETUP.md` - Comprehensive setup guide
- `packages/IMPLEMENTATION_STATUS.md` - Project roadmap
- `.env.example` - Environment variable template

---

**This is an active rewrite project.** The legacy JavaScript server in `/server` still handles Gemini CLI integration, while the new TypeScript backend in `/packages/backend` provides the API layer. Both systems currently coexist during the transition phase.
