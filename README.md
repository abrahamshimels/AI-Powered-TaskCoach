# AI-Powered Task Coach

## Problem Statement

Task management tools typically require users to manually structure, prioritize, and review work. This repository addresses that gap by combining a standard task CRUD system with natural-language AI workflows that can create, update, delete, and analyze tasks from user instructions.

Based on implemented routes and UI flows, the primary user is an authenticated individual user managing personal tasks with optional AI assistance.

## Solution Overview

The system is a two-part JavaScript monorepo:

- A Node.js/Express backend that provides JWT authentication, user-scoped task APIs, and AI-powered task operations.
- A React frontend that handles login/signup, dashboard task management, and an AI chat interface.

The backend stores users and tasks in MySQL, applies route-level auth middleware, and delegates AI generation to a provider abstraction supporting Gemini, OpenAI-compatible ChatGPT, and OpenRouter modes.

The frontend uses React Query for task fetching/mutation caching, loading states, retry behavior, and automatic refetch after task mutations (manual or AI-triggered).

## Features

- JWT-based register/login flow with password hashing.
- User-scoped task CRUD endpoints.
- AI task create from natural language:
  - Converts user text into strict JSON task fields.
  - Normalizes priority/status/due_date before DB insert.
- AI task update from natural language:
  - Reads current user tasks.
  - Requests structured JSON containing fields to update and task id.
- AI task delete from natural language:
  - Requests task id or ids from AI and deletes matching user tasks.
- AI task coaching/analysis based on the current task list.
- Dashboard task board with dynamic due-date labeling and categorization:
  - Due Soon (next 6 hours), Due Today, Due This Week, Due This Month, Later, No Deadline.
  - Overdue detection and sorting priority.
  - Live countdown refresh and animated transitions.
- Task detail view for in-place status/priority/due date edits and task deletion.
- Route guards:
  - Protected dashboard/task details for authenticated users.
  - Redirect authenticated users away from login/signup to home.

## Tech Stack

- Frontend
  - React 19
  - React Router
  - Vite
  - Axios
  - TanStack React Query
  - Framer Motion
  - React Markdown + Prism syntax highlighting

- Backend
  - Node.js (ES modules)
  - Express 5
  - dotenv
  - bcryptjs
  - jsonwebtoken
  - uuid
  - @google/genai

- Database
  - MySQL
  - mysql2/promise connection pool

- DevOps / Tools
  - npm workspaces via separate frontend/backend package roots
  - nodemon for backend development
  - ESLint (frontend)

## Architecture

Repository structure:

- backend
  - server.js: app bootstrap, CORS policy, middleware registration, DB init, route mounting.
  - src/config: DB pool configuration (port/SSL options).
  - src/database: table creation bootstrap for users/tasks.
  - src/routes: auth/task/ai route declarations.
  - src/controllers: HTTP handlers and request validation.
  - src/services: business logic and provider integration.
  - src/models: SQL access layer.
  - src/middleware: JWT authentication middleware.

- frontend/AI-Coach
  - src/main.jsx: providers (router, auth, theme, query client).
  - src/routes: route graph and route guards.
  - src/context: auth and theme context.
  - src/components:
    - Header/nav
    - Chatbox (AI action modes)
    - Task modules (create/list/detail)
  - src/services + src/api:
    - Axios client/interceptor
    - API service wrappers with normalized error handling.

Interaction model:

- Frontend calls backend REST endpoints through Axios.
- Axios interceptor injects Bearer token from localStorage.
- Backend auth middleware validates JWT and hydrates req.user from DB.
- Task operations always include user_id filtering to isolate user data.
- AI endpoints call AI service providers, then persist or return derived results.

## How It Works (Flow)

1. User registers or logs in from frontend auth pages.
2. Backend returns JWT and basic user data.
3. Frontend stores token/user in localStorage and AuthContext.
4. Protected routes become accessible; unauthenticated users are redirected to login.
5. Dashboard task list queries /api/task using React Query.
6. For manual task creation:
   - CreateTask mutation posts to /api/task.
   - On success, tasks query is invalidated and refetched.
7. For AI operations:
   - Chatbox posts to /api/ai/task/create, /update, or /delete.
   - On success, tasks query is invalidated and refetched.
8. Task board computes countdown labels and category sections client-side every 30 seconds.
9. Task details page fetches one task and allows updates/deletion through task endpoints.

## API Documentation

Base URL:

- Backend server default: http://localhost:5000
- API prefix: /api

Auth endpoints:

- POST /api/auth/register
  - Creates user, hashes password, returns JWT + user object.
- POST /api/auth/login
  - Validates credentials, returns JWT + user object.

Task endpoints (all require Bearer JWT):

- POST /api/task
  - Creates task for authenticated user.
- GET /api/task
  - Returns all tasks for authenticated user.
- GET /api/task/:id
  - Returns one task if owned by authenticated user.
- PUT /api/task/:id
  - Updates task fields for authenticated user.
- DELETE /api/task/:id
  - Deletes task for authenticated user.

AI endpoints (all require Bearer JWT):

- POST /api/ai/ask
  - General AI response for prompt/text.
- POST /api/ai/task/create
  - Natural language to structured task creation.
- POST /api/ai/task/update
  - Natural language to structured task update.
- DELETE /api/ai/task/delete
  - Natural language to task deletion id or ids.
- POST /api/ai/task/coach
  - Task analysis/coaching based on current tasks.

## Database Design

users table:

- id: CHAR(36), primary key (UUID)
- username: VARCHAR(100), required
- email: VARCHAR(255), required, unique
- password: VARCHAR(255), hashed
- created_at, updated_at timestamps

tasks table:

- id: CHAR(36), primary key (UUID)
- title: VARCHAR(255), required
- description: TEXT
- priority: ENUM(low, medium, high), default medium
- status: ENUM(pending, in-progress, completed), default pending
- due_date: DATETIME nullable
- created_by_ai: BOOLEAN default false
- user_id: CHAR(36), required, foreign key to users.id
- created_at, updated_at timestamps

Relationship:

- One user has many tasks.
- Deleting a user cascades delete of all their tasks.

## Setup Instructions

Prerequisites:

- Node.js 18+ (recommended for native fetch compatibility)
- MySQL server

1. Clone repository and install dependencies

   - Backend:

     cd backend
     npm install

   - Frontend:

     cd ../frontend/AI-Coach
     npm install

2. Configure environment files

   - Backend: create backend/.env from backend/.env.example and add values.
   - Frontend: create frontend/AI-Coach/.env from frontend/AI-Coach/.env.example.

Backend env keys used by code:

- PORT
- DB_HOST
- DB_PORT (optional; defaults to 3306)
- DB_USER
- DB_PASSWORD
- DB_NAME
- DB_SSL (optional true/false)
- DB_SSL_REJECT_UNAUTHORIZED (optional true/false)
- JWT_SECRET
- JWT_EXPIRES_IN
- CORS_ORIGINS (optional comma-separated list)
- AI_SERVICE_PROVIDER (gemini | chatgpt | openrouter)
- GEMINI_API_KEY (required when provider is gemini)
- OPENAI_API_KEY, OPENAI_API_MODEL (required when provider is chatgpt)
- OPENROUTER_API_KEY, OPENROUTER_MODE, OPENROUTER_CHAT_MODEL, OPENROUTER_RERANK_MODEL, OPENROUTER_RERANK_TOP_N, OPENROUTER_RERANK_DOCUMENTS (required by openrouter mode)

Frontend env keys:

- VITE_API_BASE_URL is present in .env.example.
- Assumption: axios client should consume this variable, but current implementation uses a hard-coded base URL.

3. Run backend

   cd backend
   npm run dev

4. Run frontend

   cd frontend/AI-Coach
   npm run dev

5. Open frontend URL shown by Vite and authenticate.

## Screenshots / UI Notes

Current UI composition from implemented components:

- Home page:
  - Hero + feature cards.
  - Embedded chat component.
  - Redirects authenticated users to dashboard.

- Header:
  - Shows login/signup links for guests.
  - Shows dashboard + logout for authenticated users.

- Dashboard:
  - Left panel: create-task toggle and categorized task board.
  - Right panel: AI chat with action modes (ask, add, update, delete, analysis).

- Task board:
  - Category headers and urgency colors.
  - Skeleton loading, retry error card, background refetch indicator.
  - Countdown labels and due-date sections update over time.

- Task details:
  - Editable status/priority/due date.
  - Progress bar toward due date.
  - Task deletion action.

## Limitations

- No automated tests are included for backend or frontend.
- Axios base URL is hard-coded; frontend env value is not currently wired into client configuration.
- AI endpoints rely on model responses being parseable strict JSON; malformed AI output returns 400.
- Task detail update flow expects updated task object client-side, but update endpoint currently returns only a success message.
- AI delete response maps fields success/message from the model layer delete result, but model delete currently returns raw mysql2 result fields.
- No refresh token or token revocation flow; authentication uses short-lived JWT only.
- No pagination/filtering at API level for task list.
- No role/multi-tenant model beyond per-user task ownership.

## Future Improvements

- Add unified request validation (for example, schema validation) across all controllers.
- Return updated entity payloads from update endpoints to simplify frontend state synchronization.
- Move frontend Axios base URL to environment-driven configuration.
- Add integration tests for auth/task/ai endpoints and UI tests for core flows.
- Add request rate limiting and structured logging for production hardening.
- Introduce optimistic updates for task mutations where appropriate.

## Author Notes

The project demonstrates a clear separation of concerns across route, controller, service, and model layers, with user-scoped data access enforced consistently. The strongest architectural choice is combining deterministic CRUD APIs with AI-assisted intent interpretation while still preserving a structured relational data model.

The most impactful next step is to strengthen reliability boundaries: enforce strict input schemas, tighten AI parsing safeguards, and align backend response contracts with frontend mutation expectations.
