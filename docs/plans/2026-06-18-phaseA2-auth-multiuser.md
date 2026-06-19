# CareerFlow OS — Phase A2: Auth + Multi-User

**Goal:** Real accounts. Auth.js (NextAuth v5) credentials login; every service scoped to the signed-in user's id instead of the hardcoded `LOCAL_USER_ID`.

**Architecture:** NextAuth v5 with a Credentials provider (bcrypt) and JWT sessions (no DB session table). Edge-safe `auth.config.ts` powers route-protecting middleware; full `auth.ts` (Node) holds the credentials provider. Services gain `userId` as their first argument; route handlers/pages resolve it via `requireUserId()`. Tests keep using `LOCAL_USER_ID` as the test user id, so test churn is just passing that arg.

**Tech Stack:** next-auth@5 (beta) · bcryptjs. **Env:** `wsl.exe bash -lc "cd /home/ala/gitlab/CareerFlow && <cmd>"`. Postgres up via docker.

---

### Task 1: User.passwordHash + deps + AUTH_SECRET

- [ ] Add to `User` model in `prisma/schema.prisma`: `passwordHash String?` (nullable so seed/demo can exist without one initially).
- [ ] `npx prisma migrate dev --name user_password`
- [ ] `npm install next-auth@beta bcryptjs && npm install -D @types/bcryptjs`
- [ ] Append to `.env`: `AUTH_SECRET="dev-secret-change-me"` and `AUTH_TRUST_HOST=true`
- [ ] Commit `feat(auth): add passwordHash + auth deps`

### Task 2: Auth config + helpers

- [ ] `src/auth.config.ts` (edge-safe):

```ts
import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt" },
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isAuthed = !!auth?.user;
      const isPublic =
        nextUrl.pathname.startsWith("/login") ||
        nextUrl.pathname.startsWith("/signup") ||
        nextUrl.pathname.startsWith("/api/auth");
      if (isPublic) return true;
      return isAuthed;
    },
    jwt({ token, user }) {
      if (user) token.sub = user.id;
      return token;
    },
    session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      return session;
    },
  },
} satisfies NextAuthConfig;
```

- [ ] `src/auth.ts` (Node runtime; credentials + bcrypt):

```ts
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { authConfig } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(creds) {
        const email = String(creds?.email ?? "").toLowerCase();
        const password = String(creds?.password ?? "");
        if (!email || !password) return null;
        const user = await db.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;
        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;
        return { id: user.id, email: user.email, name: user.name ?? undefined };
      },
    }),
  ],
});
```

- [ ] `src/middleware.ts`:

```ts
import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

- [ ] `src/lib/auth-helpers.ts`:

```ts
import { auth } from "@/auth";

export async function requireUserId(): Promise<string> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHENTICATED");
  return session.user.id;
}
```

- [ ] `src/types/next-auth.d.ts` (augment session.user.id):

```ts
import "next-auth";
declare module "next-auth" {
  interface Session {
    user: { id: string; email?: string | null; name?: string | null };
  }
}
```

- [ ] `src/app/api/auth/[...nextauth]/route.ts`:

```ts
export { GET, POST } from "@/auth";
```

Wait — handlers are exported as `handlers`. Use:

```ts
import { handlers } from "@/auth";
export const { GET, POST } = handlers;
```

- [ ] Build, commit `feat(auth): NextAuth config, middleware, helpers`.

### Task 3: Signup + login pages

- [ ] `src/app/api/auth/signup/route.ts`:

```ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json();
  const e = String(email ?? "").toLowerCase().trim();
  if (!e || !password || String(password).length < 6) {
    return NextResponse.json({ error: "email and 6+ char password required" }, { status: 400 });
  }
  const existing = await db.user.findUnique({ where: { email: e } });
  if (existing) return NextResponse.json({ error: "email already registered" }, { status: 409 });
  const passwordHash = await bcrypt.hash(String(password), 10);
  await db.user.create({ data: { email: e, name: name || null, passwordHash } });
  return NextResponse.json({ ok: true }, { status: 201 });
}
```

- [ ] `src/app/login/page.tsx` and `src/app/signup/page.tsx` — client forms. Login calls `signIn` server action; signup posts to `/api/auth/signup` then signs in. (Full code in execution.)
- [ ] Build, commit `feat(auth): signup + login pages`.

### Task 4: Thread userId through services

Change EVERY service function to take `userId: string` as its first parameter and use it instead of `LOCAL_USER_ID`. Files: `company-service.ts`, `job-service.ts`, `interview-service.ts`, `note-service.ts`, `cv-service.ts`, `stats-service.ts`, `ai-setting-service.ts`, and `ai/router.ts` (`runFeature(userId, ...)`), `ai/features.ts` (thread userId into runFeature).

- [ ] Keep `LOCAL_USER_ID` in constants (tests + seed use it as their user id).
- [ ] Update each `tests/*-service.test.ts` to pass `LOCAL_USER_ID` as the first arg; `ensureUser` still creates that id.
- [ ] `npm test` — 31 pass.
- [ ] Commit `refactor(auth): scope all services to a userId argument`.

### Task 5: Resolve userId in routes + pages

Every API route handler and every server page calls `const userId = await requireUserId()` and passes it to the service. AI feature routes thread userId into `matchScore`/`tailorCv`/etc. (which now require it for `runFeature` logging + settings lookup).

- [ ] Update all `src/app/api/**/route.ts` and all server pages (`page.tsx` for `/`, `/dashboard`, `/cvs`, `/settings`, `/jobs/[id]`).
- [ ] Build — clean.
- [ ] Commit `feat(auth): resolve session userId in routes and pages`.

### Task 6: Seed demo user + header logout

- [ ] Update `prisma/seed.ts`: create the demo user (`LOCAL_USER_ID`) with a bcrypt password `"password"` and email `demo@careerflow.local`, plus the sample data.
- [ ] Add a sign-out button + user email to the header in `layout.tsx` (server component reading `auth()`).
- [ ] `npm run db:reset` then `npm test` + `npm run build`.
- [ ] Commit `feat(auth): seed demo account + header session UI`.

---

## Notes
- JWT sessions → no session table, no DB round-trip per request.
- Demo login after reset: `demo@careerflow.local` / `password`.
- Encryption of AI keys still deferred; multi-user means keys are per-user now (already keyed by userId).
