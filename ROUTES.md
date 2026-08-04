# Multi-Tenant Platform API Routes Specification

This document summarizes all available API endpoints, HTTP methods, required roles, tenant-scoping behavior, and request/response shapes.

---

## 1. Authentication Routes (`/api/auth`)

### `POST /api/auth/register`
- **Description**: Registers a global member account.
- **Auth**: None (Public)
- **Request Body**:
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecretPassword123",
    "phone": "+91 9876543210",
    "place": "Kozhikode"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "message": "Account created successfully",
    "token": "<JWT_TOKEN>",
    "user": {
      "id": "64f1...",
      "name": "John Doe",
      "email": "john@example.com",
      "role": "member",
      "tenantId": null
    }
  }
  ```

---

### `POST /api/auth/register-tenant`
- **Description**: Registers a new Event Team / Organization. Creates a `tenant_admin` user and a `Tenant` record with `status: "pending"`.
- **Auth**: None (Public)
- **Request Body**:
  ```json
  {
    "name": "Grand SwalathEvent Team",
    "slug": "grandsalath",
    "adminName": "Team Organizer",
    "email": "admin@grandsalath.org",
    "password": "AdminPassword123"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "message": "Event team registered successfully! Application submitted for Super Admin approval.",
    "tenant": {
      "id": "64f2...",
      "name": "Grand SwalathEvent Team",
      "slug": "grandsalath",
      "status": "pending"
    },
    "user": {
      "id": "64f3...",
      "name": "Team Organizer",
      "email": "admin@grandsalath.org",
      "role": "tenant_admin",
      "tenantId": "64f2..."
    }
  }
  ```

---

### `POST /api/auth/login`
- **Description**: Authenticates a user (super_admin, tenant_admin, or member). Returns JWT.
- **Auth**: None (Public)
- **Request Body**:
  ```json
  {
    "email": "admin@grandsalath.org",
    "password": "AdminPassword123"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "message": "Login successful",
    "token": "<JWT_TOKEN>",
    "user": {
      "id": "64f3...",
      "name": "Team Organizer",
      "email": "admin@grandsalath.org",
      "role": "tenant_admin",
      "tenantId": "64f2..."
    },
    "tenant": {
      "id": "64f2...",
      "name": "Grand SwalathEvent Team",
      "slug": "grandsalath",
      "status": "pending",
      "branding": { ... }
    }
  }
  ```

---

### `GET /api/auth/me`
- **Description**: Gets currently authenticated user profile and active tenant context.
- **Auth**: Bearer Token required (`requireAuth`)
- **Response (200 OK)**:
  ```json
  {
    "user": {
      "_id": "64f3...",
      "name": "Team Organizer",
      "email": "admin@grandsalath.org",
      "role": "tenant_admin",
      "tenantId": "64f2..."
    },
    "tenant": { ... }
  }
  ```

---

## 2. Super Admin Routes (`/api/super-admin`)
*All endpoints require Bearer Token with `role: "super_admin"`.*

### `GET /api/super-admin/tenants?status=pending`
- **Description**: Lists all registered Event Team tenants, optionally filtered by `status` (`pending`, `approved`, `rejected`, `suspended`).
- **Response (200 OK)**: Array of Tenant objects with populated owner and approver details.

### `GET /api/super-admin/tenants/:id`
- **Description**: Gets full detail and registration statistics for a specific tenant.
- **Response (200 OK)**: `{ "tenant": { ... }, "stats": { "registrationCount": 42 } }`

### `POST /api/super-admin/tenants/:id/approve`
- **Description**: Approves a pending Event Team tenant. Sets `status: "approved"`, `approvedBy`, and `approvedAt`.
- **Response (200 OK)**: `{ "message": "...", "tenant": { ... } }`

### `POST /api/super-admin/tenants/:id/reject`
- **Description**: Rejects a pending Event Team application. Sets `status: "rejected"`.
- **Request Body**: `{ "rejectionReason": "Incomplete verification details" }`
- **Response (200 OK)**: `{ "message": "...", "tenant": { ... } }`

### `POST /api/super-admin/tenants/:id/suspend`
- **Description**: Suspends an active Event Team tenant. Sets `status: "suspended"`.
- **Response (200 OK)**: `{ "message": "...", "tenant": { ... } }`

---

## 3. Tenant Admin Routes (`/api/admin`)
*All endpoints require Bearer Token with `role: "tenant_admin"` and `requireTenantMatch` guard.*

### `GET /api/admin/me/tenant`
- **Description**: Returns caller's own tenant record.
- **Response (200 OK)**: Tenant object.

### `PATCH /api/admin/me/tenant`
- **Description**: Updates tenant `branding` (title, tagline, logoUrl, themeColor) and custom `settings`.
- **Request Body**:
  ```json
  {
    "name": "Grand Swalath2026",
    "branding": {
      "title": "Grand Swalath2026 Event",
      "tagline": "Join our global campaign",
      "logoUrl": "https://example.com/logo.png",
      "themeColor": "#059669"
    },
    "settings": {
      "targetGoal": 100000
    }
  }
  ```
- **Response (200 OK)**: `{ "message": "...", "tenant": { ... } }`

### `GET /api/admin/registrations?page=1&limit=20&status=registered`
- **Description**: Lists paginated member registrations for caller's tenant only.
- **Response (200 OK)**: `{ "page": 1, "limit": 20, "totalPages": 1, "total": 5, "registrations": [ ... ] }`

### `PATCH /api/admin/registrations/:id`
- **Description**: Updates status or custom metadata for a specific registration under caller's tenant.
- **Request Body**: `{ "status": "attended", "data": { ... } }`
- **Response (200 OK)**: `{ "message": "...", "registration": { ... } }`

### `POST /api/admin/me/tenant/domain`
- **Description**: Submits a custom domain and returns TXT record verification instructions.
- **Request Body**: `{ "customDomain": "event.myorg.org" }`
- **Response (200 OK)**:
  ```json
  {
    "message": "Custom domain submitted...",
    "customDomain": "event.myorg.org",
    "dnsRecord": {
      "type": "TXT",
      "name": "_verify.event.myorg.org",
      "value": "verify_a1b2c3d4..."
    }
  }
  ```

### `POST /api/admin/me/tenant/domain/verify`
- **Description**: Performs live DNS TXT lookup (`_verify.<domain>`) and marks `customDomainVerified: true` if record matches.
- **Response (200 OK)**: `{ "message": "Custom domain verified successfully!", "customDomain": "event.myorg.org", "verified": true }`

### `DELETE /api/admin/me/tenant/domain`
- **Description**: Cancels and removes the active custom domain configuration for the tenant and triggers background removal from Vercel.
- **Response (200 OK)**: `{ "message": "Custom domain cancelled and removed successfully.", "customDomain": null, "customDomainVerified": false, "customDomainConnected": false }`
- **Error (400 Bad Request)**: `{ "error": "No custom domain is currently configured for this event team" }`

---

## 4. Member & Event Routes (`/api/events`)
*All endpoints require Bearer Token (`requireAuth`) and resolved tenant context (`req.tenant`).*

### `POST /api/events/register`
- **Description**: Registers authenticated global member for the active tenant event.
- **Request Body**: `{ "data": { "whatsapp": "+91 9876543210" } }`
- **Response (201 Created)**: `{ "message": "Successfully registered...", "registration": { ... } }`
- **Error (409 Conflict)**: Returns friendly message if user is already registered for this event.

### `GET /api/events/my-registration`
- **Description**: Returns authenticated caller's registration details for the active tenant event.
- **Response (200 OK)**: Registration object.

### `GET /api/events/leaderboard?limit=10`
- **Description**: Returns top participant leaderboard for the active tenant event.
- **Response (200 OK)**: `{ "tenant": { ... }, "leaderboard": [ ... ] }`

---

## 5. Daily Counts Routes (`/api/counts`)

- `POST /api/counts/entry`: Log daily count entry under current tenant.
- `GET /api/counts/me`: List caller's count entries for current tenant.
- `GET /api/counts/day?date=YYYY-MM-DD`: Get day total and entries for current tenant.
- `DELETE /api/counts/entry/:id`: Delete count entry.
- `GET /api/counts/leaderboard/today`: Today's leaderboard for active tenant.
- `GET /api/counts/leaderboard/all`: All-time leaderboard for active tenant.
