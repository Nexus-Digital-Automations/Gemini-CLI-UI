# Gemini CLI UI - TypeScript Rewrite

This directory contains the complete TypeScript rewrite of Gemini CLI UI using a monorepo structure.

## Package Structure

- **`frontend/`** - React 19 + TypeScript + Vite frontend application
- **`backend/`** - Express + TypeScript API server with security built-in
- **`shared/`** - Shared TypeScript types and Zod validation schemas

## Quick Start

```bash
# Install dependencies (from root)
npm install

# Run all packages in development mode
npm run dev

# Build all packages
npm run build

# Run tests
npm run test

# Type check all packages
npm run type-check
```

## Development Workflow

1. Make changes in any package
2. Turborepo automatically rebuilds dependent packages
3. HMR (Hot Module Replacement) works in frontend
4. Backend auto-restarts on changes (tsx watch mode)

## Architecture

### Shared Package First
Always define types in `packages/shared` before implementing features. This ensures:
- Type safety across frontend and backend
- Runtime validation with Zod
- Single source of truth for data structures

### Feature-Based Modules
Both frontend and backend use feature-based organization:
- `auth/` - Authentication and authorization
- `projects/` - Project management
- `sessions/` - Chat sessions with Gemini
- `files/` - File operations
- `git/` - Git integration
- `gemini/` - Gemini CLI wrapper

### Security by Design
- JWT with automatic secret generation
- Zod validation on all inputs
- Rate limiting on all endpoints
- Path traversal protection
- XSS/CSRF protection via helmet
- No secrets in git

## Technology Stack

**Frontend:**
- React 19
- TypeScript 5.3+
- Vite 7
- TanStack Router & Query
- Zustand state management
- Tailwind CSS 4
- CodeMirror 6 & xterm.js

**Backend:**
- Node.js 20+ (ESM)
- TypeScript 5.3+
- Express 5
- Drizzle ORM (SQLite)
- Passport.js
- ws (WebSocket)

**Testing:**
- Vitest (unit/integration)
- Playwright (E2E)
- React Testing Library
- Supertest (API)

## Migration from v1

The old JavaScript version remains in the root directory. To migrate:

1. Run both versions side-by-side during development
2. Export data from old version using migration scripts
3. Import into new SQLite database
4. Test thoroughly
5. Switch to new version

See `MIGRATION.md` for detailed instructions.
