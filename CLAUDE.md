# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BMS Session Demo Dashboard — a React/TypeScript web application that displays hospital statistics and patient data from HOSxP hospital management systems. The app uses BMS Session IDs for authentication and executes read-only SQL queries against hospital databases (MySQL, MariaDB, PostgreSQL).

## Key Documentation

- `docs/BMS-SESSION-FOR-DEV.md` — Complete BMS Session API specification (v2.0): session flow, `/api/sql` endpoint, field type codes, database compatibility, HOSxP table reference, example queries
- `.specify/memory/constitution.md` — Project constitution (v1.0.0): 9 mandatory development principles — the authoritative source for all development standards

## Architecture

### Session Flow

1. User arrives with `?bms-session-id=GUID` in URL (or from cookie/manual input)
2. App calls `https://hosxp.net/phapi/PasteJSON?Action=GET&code=SESSION_ID` to retrieve session data
3. Session response provides: `bms_url` (API endpoint), `bms_session_code` (JWT Bearer token), user info, database info
4. All queries go to `{bms_url}/api/sql` with Bearer token auth
5. Only SELECT, DESCRIBE, EXPLAIN, SHOW, WITH statements allowed (read-only)

### Source Structure

```
src/
├── services/bmsSession.ts       # Core: retrieveBmsSession(), executeSqlViaApi(), extractConnectionConfig()
├── hooks/useBmsSession.ts       # useBmsSession() hook, useQuery() hook
├── contexts/BmsSessionContext.tsx  # BmsSessionProvider, useBmsSessionContext()
├── utils/sessionStorage.ts      # Cookie CRUD, URL param extraction
├── components/                  # Reusable UI components
├── pages/                       # Page-level components
└── types/                       # TypeScript interfaces

tests/
├── unit/          # Pure function and service tests
├── component/     # React component rendering and interaction tests
├── integration/   # Cross-module and flow tests
└── api/           # BMS Session API contract tests
```

### Key Architectural Rules

- **Business logic in services only** — components handle rendering and interaction, delegate all data processing, transformation, and validation to `src/services/`
- **Session management centralized** in `bmsSession.ts`, exposed via context/hooks
- **SQL queries MUST use parameterized inputs** (`:param_name` syntax) to prevent injection; query construction centralized in service functions
- **No hardcoded values** — API URLs, config, and query parameters must be dynamic (retrieved from session response)
- **Reuse over duplication** — extract shared logic into hooks, utils, shared components; common UI patterns (loading states, error displays, data cards) MUST use shared components

## BMS Session API Quick Reference

**Session retrieval**: GET `https://hosxp.net/phapi/PasteJSON?Action=GET&code={sessionId}`

**SQL execution**: POST `{bms_url}/api/sql` with `Authorization: Bearer {bms_session_code}`
```json
{"sql": "SELECT COUNT(*) as total FROM patient", "app": "BMS.Dashboard.React"}
```

**Response shape**: `{ MessageCode, Message, data: [{...}], field: [int], field_name: [string], record_count }`

**Field type codes**: 1=Boolean, 2=Integer, 3=Float, 4=DateTime, 5=Time, 6=String, 7=Blob, 9=String

**Blacklisted tables**: opduser, opdconfig, sys_var, user_var, user_jwt (max 20 tables per query)

**PostgreSQL**: Use single quotes for string literals (double quotes = identifiers)

## Development Standards (Constitution v1.0.0)

### I. Code Quality First

- All code MUST pass linting and type-checking before commit
- TypeScript strict mode — no `any` without written justification in comments
- No hardcoded values for configuration, API endpoints, or query parameters
- Dead code, unused imports, and commented-out code MUST be removed
- Functions MUST have single responsibility; files MUST NOT exceed 400 lines without justification
- Clear naming that eliminates the need for comments; add comments only where logic is not self-evident

### II. Test-Driven Development (NON-NEGOTIABLE)

- TDD cycle MUST be followed: write test → confirm test fails → implement → confirm test passes → refactor
- Red-Green-Refactor is strictly enforced for all new features and bug fixes
- Tests MUST be written and approved BEFORE implementation begins
- No feature or fix is complete until all associated tests pass
- Test failures MUST be investigated to root cause — never suppressed, mocked away, or bypassed

### III. Comprehensive Test Coverage

All features MUST be validated across four test layers:

- **Unit Tests**: Every function, utility, and service method — happy path, edge cases, error conditions. Minimum 80% coverage for new code
- **Component Tests**: Every React component — rendering, interaction, state-change. Use React Testing Library; test behavior, not implementation
- **Integration Tests**: Cross-module interactions — session flow, API call chains, context provider integration, hook composition. MUST NOT mock internal modules
- **API Tests**: Every API endpoint interaction — contract tests for request format, response parsing, error handling, authentication flow

Test files co-located with source or in mirrored `tests/` directory. Test names: "MUST [expected behavior] when [condition]". Tests MUST produce detailed debug logs.

### IV. Reusable Components & Functions

- MUST NOT duplicate code — extract shared logic into reusable components, hooks, or utility functions
- React components MUST be composable with clear props interfaces
- Custom hooks MUST encapsulate complex state logic and be independently testable
- Utility functions MUST be pure, stateless, placed in `src/utils/` or `src/lib/`
- Common UI patterns (loading states, error displays, data cards) MUST use shared components

### V. Centralized Business Logic

- Business logic MUST reside in `src/services/` — never in UI components or event handlers
- UI components handle rendering and user interaction only; delegate all data processing to services/hooks
- Data transformation, validation, and computation in dedicated service modules
- SQL query construction centralized in service functions with parameterized inputs

### VI. Informative User Experience & Professional UI

- Every user-facing operation MUST provide visual feedback: loading spinners, progress bars, or status messages
- Error messages MUST be actionable — clearly state what went wrong and what the user can do
- Multi-step operations MUST show progress indication (step counts, percentages, or descriptive status)
- Session state changes (connecting, connected, expired, disconnected) MUST be clearly communicated
- Query execution MUST show loading state, result count, and execution time
- Network failures MUST display user-friendly messages with retry options — no raw error codes or stack traces
- Empty states MUST provide guidance (e.g., "No data for selected period. Try expanding the date range.")
- UI must be user-friendly and professional — consistent dark/light theme support, responsive design, accessible interactions

### VII. Performance & Reliability

- API calls MUST implement timeout handling (30s session, 60s queries) with graceful degradation
- SQL queries MUST use LIMIT clauses and aggregate functions to minimize data transfer
- Avoid unnecessary re-renders — use `React.memo`, `useMemo`, `useCallback` where measurable improvement exists
- Bundle size monitored; lazy loading for non-critical routes and heavy components
- Session validation before any API call; expired sessions trigger re-authentication automatically
- Database queries MUST use parameterized inputs to prevent SQL injection

### VIII. Version Control Discipline

- Commit after every meaningful change — a completed function, a passing test, a working feature increment
- Commit messages MUST be descriptive: prefix with type (feat/fix/test/refactor/docs) and describe the change
- MUST NOT commit broken code, failing tests, or debug artifacts (console.log, commented-out code)
- Each commit MUST represent a logically complete unit of work that does not break the build
- Feature branches MUST be used for all non-trivial changes

### IX. Skill-Driven Development

- Available development skills MUST be leveraged: brainstorming before features, TDD for implementation, debugging for issues, code-review before merge, verification before completion
- Feature development MUST start with brainstorming to explore requirements and design
- Non-trivial implementations MUST use a written plan before coding
- All completed work MUST be verified with the verification skill before claiming completion
- Code review MUST be performed before merging any feature branch

## Development Workflow

### Feature Implementation Flow

1. **Brainstorm** — explore requirements and design choices
2. **Plan** — write implementation plan for multi-step tasks
3. **Write Tests** — define expected behavior before implementation
4. **Implement** — write minimum code to pass tests
5. **Refactor** — improve code quality while keeping tests green
6. **Commit** — save each meaningful increment
7. **Review** — code review before merge
8. **Verify** — final verification before marking complete

### Code Review Checklist

- [ ] All tests pass (unit + component + integration + API)
- [ ] No TypeScript errors or warnings
- [ ] No duplicated code — shared logic extracted
- [ ] Business logic in services, not components
- [ ] User-facing operations provide feedback
- [ ] Error states handled with actionable messages
- [ ] Commits are atomic and descriptive
- [ ] Performance considerations addressed
- [ ] Professional UI — consistent theming, responsive, accessible

## Speckit Workflow

This project uses the speckit system for structured development:
- `/speckit.specify` — Create feature specifications
- `/speckit.plan` — Create implementation plans
- `/speckit.tasks` — Generate task lists from plans
- `/speckit.implement` — Execute implementation
- `/speckit.clarify` — Clarify ambiguous requirements
- `/speckit.analyze` — Cross-artifact consistency analysis

## Active Technologies
- TypeScript 5.x (strict mode) + React 19 + Vite 6, Recharts 3.x, shadcn/ui, Tailwind CSS v4, TanStack Table v8, date-fns (001-bms-kpi-dashboard)
- N/A (all data from BMS Session API; session cookie stored client-side) (001-bms-kpi-dashboard)

## Recent Changes
- 001-bms-kpi-dashboard: Added TypeScript 5.x (strict mode) + React 19 + Vite 6, Recharts 3.x, shadcn/ui, Tailwind CSS v4, TanStack Table v8, date-fns
