# TriageSync

## 1. Overview

TriageSync is a support ticket triage and resource booking application built for the ENGN-F1 Full Stack Developer assessment. Support agents review automatically categorized tickets, track edits in an audit history, and request time on shared rooms, labs, and equipment. Administrators manage resources, decide booking requests, and review operational statistics.

## 2. Live links

| Service | URL |
| --- | --- |
| Frontend | https://engnf1-fullstack-bibek-roy-1.vercel.app/ |
| Backend | https://engnf1-fullstack-bibek-roy-1.onrender.com/api/health |

## 3. Seeded credentials

| Role | Name | Email | Demo password |
| --- | --- | --- | --- |
| ADMIN | Admin Lead | `admin@triagesync.test` | `Admin@123` |
| USER | Agent Demo | `user@triagesync.test` | `User@123` |

These credentials are for the assessment demo. Public registration creates USER accounts.

## 4. Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React, Vite |
| Backend | Node.js, Express |
| Database | MongoDB Atlas, Mongoose |

## 5. Folder structure

| Path | Purpose |
| --- | --- |
| `frontend/` | React application for agents and administrators |
| `backend/` | Express REST API, database models, and business logic |
| `.env.example` | Environment variable reference with dummy values |
| [SOLUTION.md](./SOLUTION.md) | Architecture, concurrency, and performance measurements |
| [AI_USAGE.md](./AI_USAGE.md) | AI usage disclosure |

## 6. Local setup and idempotent seed

Install Node.js and npm. Configure a MongoDB Atlas database or a local MongoDB replica set with transaction support. Use the project’s `.env.example` to configure the database connection, JWT signing secret, and frontend API URL as applicable.

Install the backend dependencies from the repository root.

```bash
cd backend
npm install
```

From `backend/`, seed the database before starting the API.

```bash
npm run seed
```

The idempotent seed populates both demo accounts, at least six resources (at least two per type and at least one inactive), and at least 15 tickets spanning all categories and priorities. The tickets include at least three reviewed entries and one with raw HTML or script tags. You can rerun the command against the same database without creating duplicates.

Start the backend from `backend/`.

```bash
npm start
```

In a second terminal, run the Vite frontend from the repository root.

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite and sign in with one of the demo accounts after seeding.

## 7. Database schema

| Entity | Fields and relationships |
| --- | --- |
| User | `id`, `name`, unique case-insensitive `email`, `passwordHash`, `role`, `createdAt`. The API keeps `passwordHash` private. |
| Ticket | `id`, unique `externalId`, `subject`, `body`, immutable `autoCategory`, `category`, `isHumanOverride`, `priority`, `status`, nullable `assigneeId` referencing User, `isReviewed`, `createdAt`, `updatedAt`. |
| TicketEvent | `id`, `ticketId` referencing Ticket, `field`, nullable `oldValue` and `newValue`, `actor`, `createdAt`. Each event records one changed field. |
| Resource | `id`, unique case-insensitive `name`, `type` (ROOM, LAB, EQUIPMENT), `capacity`, nullable `description`, `isActive`, `createdAt`. |
| Booking | `id`, `resourceId` referencing Resource, `userId` referencing User, nullable `ticketId` referencing Ticket, `startTime`, `endTime`, `purpose`, `status`, nullable `decisionNote`, `createdAt`. |

## 8. API summary

The table lists the assessment API contract. Paths are relative to `/api`. Authenticated requests use `Authorization: Bearer <token>`. Paginated responses include `data`, `page`, `pageSize`, `total`, and `totalPages`. Errors use `{ "error": { "code": "...", "message": "..." } }`. Booking timestamps use ISO 8601 UTC.

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/register` | Public | Create a USER account |
| POST | `/auth/login` | Public | Sign in and receive a JWT |
| GET | `/auth/me` | Signed in | Get the signed-in user |
| POST | `/tickets/import` | Signed in | Import a `{ tickets: [...] }` feed by external ID |
| GET | `/tickets` | Signed in | List tickets with status, category, priority, and text filters |
| GET | `/tickets/:id` | Signed in | Get ticket details and audit events |
| PATCH | `/tickets/:id` | Signed in | Edit review fields and record audit events |
| GET | `/stats` | Signed in | Get triage totals and model agreement rate |
| GET | `/resources` | Signed in | Search and filter resources by type and capacity |
| GET | `/resources/:id` | Signed in | Get resource details |
| POST | `/resources` | ADMIN | Create a resource |
| PATCH | `/resources/:id` | ADMIN | Update resource details or active status |
| GET | `/resources/:id/availability` | Signed in | Get blocking slots within a UTC date range |
| POST | `/bookings` | Signed in | Request a resource slot |
| GET | `/bookings/mine` | Signed in | List the signed-in user’s bookings |
| GET | `/bookings/:id` | Owner or ADMIN | Get a booking |
| GET | `/bookings` | ADMIN | List and filter all bookings |
| PATCH | `/bookings/:id/cancel` | Owner | Cancel an eligible future booking |
| PATCH | `/bookings/:id/approve` | ADMIN | Approve a future pending booking |
| PATCH | `/bookings/:id/reject` | ADMIN | Reject a future pending booking with a note |
| GET | `/admin/stats` | ADMIN | Get resource, booking, and ticket statistics |

## 9. Completed features checklist

- [x] Resource listing with name search, type and capacity filters, pagination, and active-only visibility for USER accounts.
- [x] Transaction logic for protecting booking overlaps and the per-user booking limit.
- [x] Registration, login, JWT expiry, and role-based access.
- [x] Deterministic ticket classification and idempotent re-import that preserves human overrides.
- [x] Ticket review, audit history, combined injection-safe search, and model agreement statistics.
- [x] Optimistic ticket updates with rollback and a visible error. Raw HTML in tickets displays as text.
- [x] Resource availability, 30-minute booking grid, and booking limits.
- [x] Owner cancellation, admin approval and rejection, and admin analytics.
- [x] Ten simultaneous requests for the same slot yield one `201` and nine `409` responses.
- [x] Responsive layouts at 375px, 768px, and 1280px, with loading, error, and empty states.
- [x] Idempotent seed and live HTTPS demo verified with both roles.

## 10. Known limitations

- Local booking setup requires a MongoDB replica set or Atlas because booking creation uses transactions.
- The application schedules reservations on a 30-minute UTC grid, with durations of 30–240 minutes and a booking horizon of 30 days.
