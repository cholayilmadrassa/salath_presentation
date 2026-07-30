# Implementation Prompt: Multi-Tenant Event Platform

Use this prompt with Claude Code (or any coding agent) to implement the system.

---

## Prompt

I have a Node.js + Express + MongoDB (Mongoose) backend that needs to become a **multi-tenant event registration platform**. Implement the full backend according to the spec below.

### Existing stack
- Express, Mongoose, morgan, cors, ES modules (`type: module`)
- Config in `./config.js` exporting `PORT`, `MONGODB_URI`
- Existing route files: `routes/auth.js`, `routes/counts.js`, `routes/admin.js`
- Entry point: `server.js`

### Data models (already defined — use as-is, don't redesign)
- `models/Tenant.js` — one Event Team. Fields: `name`, `slug` (unique, subdomain), `customDomain` (unique, sparse), `customDomainVerified`, `status` (`pending|approved|rejected|suspended`), `approvedBy`, `approvedAt`, `rejectionReason`, `ownerId`, `branding` (`title`, `tagline`, `logoUrl`, `themeColor`), `settings` (Mixed).
- `models/User.js` — global identity. Fields: `name`, `email` (unique), `passwordHash`, `role` (`super_admin|tenant_admin|member`), `tenantId` (required only for `tenant_admin`), `isActive`. Has a `pre('validate')` hook enforcing tenantId-by-role.
- `models/Registration.js` — join between a `User` and a `Tenant`. Tenant-scoped via `models/plugins/tenantScope.js`. Fields: `userId`, `data` (Mixed, per-tenant custom fields), `status`. Unique compound index on `{tenantId, userId}`.

### What to build

**1. Tenant resolution middleware** (`middleware/resolveTenant.js`)
- Read the incoming `Host` header.
- Strip port if present.
- If it matches `<slug>.yourplatform.com`, look up `Tenant` by `slug`.
- Else, look up `Tenant` by `customDomain` (exact match, and require `customDomainVerified: true`).
- Attach the resolved tenant to `req.tenant`. If no tenant matches and the route requires one, return 404 with a clear JSON error (not a generic 500).
- Skip resolution entirely for platform-level routes (e.g. `/api/super-admin/*`, the root health check).

**2. Auth updates** (`routes/auth.js`, `middleware/auth.js`)
- JWT payload must include `userId`, `role`, and `tenantId` (null for `super_admin`/`member`).
- `POST /api/auth/register` — creates a `member` by default. Body: `name`, `email`, `password`.
- `POST /api/auth/register-tenant` — registers a new Event Team: creates a `User` with role `tenant_admin`, creates a `Tenant` with `status: 'pending'` and `ownerId` set to that user, in a single transaction (use a Mongo session). Body: tenant `name`, `slug`, admin `name`/`email`/`password`.
- `POST /api/auth/login` — standard email/password login, returns JWT.
- Middleware `requireAuth` — verifies JWT, attaches `req.user`.
- Middleware `requireRole(...roles)` — 403s if `req.user.role` isn't in the allowed list.
- Middleware `requireTenantMatch` — for `tenant_admin` routes, 403s if `req.user.tenantId` doesn't match `req.tenant._id` (from `resolveTenant`). `super_admin` bypasses this check.

**3. Super admin routes** (`routes/superAdmin.js`, mounted at `/api/super-admin`, `requireAuth` + `requireRole('super_admin')` on all of them)
- `GET /tenants?status=pending` — list tenants, filterable by status.
- `POST /tenants/:id/approve` — sets `status: 'approved'`, `approvedBy`, `approvedAt`.
- `POST /tenants/:id/reject` — sets `status: 'rejected'`, `rejectionReason` from body.
- `POST /tenants/:id/suspend` — sets `status: 'suspended'`.
- `GET /tenants/:id` — full tenant detail.

**4. Tenant admin routes** (`routes/tenantAdmin.js`, mounted at `/api/admin`, `requireAuth` + `requireRole('tenant_admin')` + `requireTenantMatch`)
- `GET /me/tenant` — the caller's own tenant record.
- `PATCH /me/tenant` — update `branding` and `settings` only (never `slug`, `status`, `customDomain` directly — see domain verification flow below).
- `GET /registrations` — list registrations for `req.tenant._id` only, paginated.
- `PATCH /registrations/:id` — update a registration's `data`/`status`, scoped to own tenant (query must include `tenantId: req.tenant._id`, return 404 if it belongs to another tenant — never leak existence of other tenants' data).

**5. Member routes** (`routes/member.js`, mounted at `/api/events`, `requireAuth`, requires `resolveTenant` to have run)
- `POST /register` — creates a `Registration` for `req.user._id` under `req.tenant._id`. If one already exists (unique index), return 409 with a friendly message, not a raw Mongo duplicate-key error.
- `GET /my-registration` — the caller's own registration in the current tenant, 404 if none.
- `GET /leaderboard` — top registrations for the current tenant only, sorted by whatever count field the tenant uses (read from `req.tenant.settings`).

**6. Custom domain verification** (`routes/tenantAdmin.js` or separate `routes/domains.js`)
- `POST /me/tenant/domain` — tenant_admin submits a `customDomain`. Generate a verification token, store it on the tenant (e.g. `settings.domainVerificationToken`), and return DNS TXT record instructions (`_verify.<domain> TXT <token>`).
- `POST /me/tenant/domain/verify` — perform a DNS TXT lookup (Node's `dns.resolveTxt`) against `_verify.<domain>`, confirm the token matches, then set `customDomainVerified: true`. Return a clear error if the record isn't found or doesn't match — don't silently fail.

**7. Deployment considerations to account for in code (not infra)**
- Don't hardcode the platform's root domain (e.g. `yourplatform.com`) — read it from an env var (`PLATFORM_ROOT_DOMAIN`) so subdomain matching works identically on Vercel and a VPS.
- CORS: allow dynamic origins by checking the request origin against approved tenant domains (subdomain + verified custom domains) rather than a static whitelist, since tenants are added at runtime.
- No filesystem or in-memory state that would break under Vercel's serverless model (no local file caching, no long-lived in-process singletons that assume one persistent server instance).

### Constraints
- Every tenant-scoped query MUST include `tenantId` explicitly — do not rely on any middleware to inject it silently into Mongoose queries; make it visible in each route handler.
- Never let a `tenant_admin` or `member` request read or modify data belonging to a different `tenantId`, even by guessing an ID. Return 404, not 403, when a resource exists but belongs to another tenant (don't leak existence).
- Reuse the existing error-handling pattern in `server.js` (`next(err)` → global error handler) rather than inventing a new one.
- Write plain, readable Express route handlers — no framework abstractions beyond what's already in the project.

### Deliverables
- All new files listed above, fully implemented.
- A short `ROUTES.md` summarizing every endpoint, method, required role, and request/response shape.
- Do not modify `models/Tenant.js`, `models/User.js`, `models/Registration.js`, or `models/plugins/tenantScope.js` — they're final.

---

## Notes for whoever runs this prompt

- Point the agent at your actual repo (or paste the model files in) before running — it needs `config.js` and the existing `routes/*.js` files as real context, not just descriptions.
- If you're using Claude Code, this works well as a single message; for a chat-based agent, attach the four model files alongside this prompt.
