# Aria — Premium 3D AI Interview Agent

This package is the **existing Aria / ABTalks AI Interview Agent**, upgraded in-place with a premium immersive interview experience.

## Run

1. Install Node.js 20+
2. Run `npm install`
3. Copy `.env.example` to `.env.local`
4. Set `GEMINI_API_KEY` in `.env.local` (or in your Vercel Environment Variables).
5. Run `npm run dev`
6. Open `http://localhost:3000`

## What changed

- Premium cinematic dark visual system with glass/metal surfaces and restrained blue/cyan accents.
- Interactive AI core for Aria with real 3D coordinate projection, depth, orbit rings and state-driven motion.
- Aria core reacts to idle, thinking and speaking states.
- Interview page now has an immersive Aria stage while keeping the chat as the primary readable surface.
- Candidate calibration/profile surfaces use the same premium depth system.
- Final report has animated overall score and an interactive 3D-style knowledge graph.
- Added reduced-motion handling and lightweight rendering so the interview remains responsive.
- Existing API routes, session persistence, agents, prompts, Gemini API integration, voice control, adaptive interview flow and report generation remain in place.

## 3D implementation note

The uploaded project did not contain a 3D runtime, and the packaging environment's npm registry could not provide `three` / `@react-three/fiber` / `@react-three/drei`. Rather than introducing a broken dependency or replacing the architecture, the redesign uses a **dependency-free lightweight 3D projection layer** in `components/3d/AriaCore.tsx` plus CSS 3D transforms for the knowledge graph.

This keeps the project runnable with the existing dependency set and avoids a large GPU/runtime dependency for the core interview surface.

## Validation

- `npx tsc --noEmit` — **passed**.
- Required existing API route files — **present**.
- No `window.location.reload()` or `router.refresh()` introduced in the frontend.
- A production `next build` could not be completed in the packaging sandbox because Next.js attempted to download its Linux SWC binary from the restricted npm registry and received HTTP 404. This is an environment/dependency-registry limitation, not a TypeScript error.

## Existing architecture preserved

React / Next.js App Router
→ Next.js API Routes
→ existing Node.js interview services
→ Gemini API

No Express migration, backend rewrite, or second parallel application was introduced.

## Premium 3D pass
- Added a layered cinematic interview environment with perspective floor/ceiling, horizon light, parallax depth and sparse floating markers.
- Upgraded ARIA Core with volumetric point projection, wireframe latitude arcs, orbit markers, iris rings and scanline depth cues.
- Kept the implementation dependency-free beyond the project's existing stack so the interview remains responsive and does not require a new 3D runtime.


### Interview calibration
After login, candidates choose a domain and then a Low, Medium, or High interview level. The selected level is persisted for the session and drives question depth. Domain question banks are randomized per interview and avoid repeating previously asked base questions before cycling.

## Server-side account authentication

ARIA now supports real persistent candidate accounts without changing the interview/AI engine. Accounts are stored server-side in SQLite, passwords are protected with salted `scrypt` hashing, and authenticated sessions use an HttpOnly signed cookie plus a server-side session record.

### Environment

Copy `.env.example` to `.env.local` and set:

```env
AUTH_SESSION_SECRET=use-a-long-random-secret
AUTH_DB_PATH=./data/auth.sqlite
```

Use Node.js 22.5+ because the project uses the built-in `node:sqlite` runtime. The SQLite file is created automatically on first authentication request.

For a multi-instance/serverless production deployment, replace the SQLite adapter with a managed PostgreSQL/MySQL adapter; the API/UI contract can remain the same.

## Gemini / Vercel deployment

The interview agents use Gemini through a server-side API call, so the deployed app does not require Ollama on the Vercel server.

Set these environment variables in Vercel:

```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
```

Keep `GEMINI_API_KEY` server-side and never commit it to GitHub. For production multi-instance deployments, use a managed database instead of the local SQLite adapter.
