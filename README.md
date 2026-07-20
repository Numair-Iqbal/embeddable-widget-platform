<div align="center">

# 🧩 Embeddable Widget Platform

**A multi-tenant backend platform for creating embeddable widgets, capturing visitor submissions in real time, and managing everything from a secure owner dashboard.**

Built as the capstone project for the **FlyRank AI — Backend Engineering Internship** (July 2026 cohort)

![Tests](https://img.shields.io/badge/tests-41%2F41%20passing-brightgreen?style=flat-square)
![Node](https://img.shields.io/badge/node-%3E%3D18-339933?style=flat-square&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/express-5.x-black?style=flat-square&logo=express)
![PostgreSQL](https://img.shields.io/badge/database-Supabase%20Postgres-3ecf8e?style=flat-square&logo=supabase&logoColor=white)
![Jest](https://img.shields.io/badge/tested%20with-Jest-C21325?style=flat-square&logo=jest&logoColor=white)

[Overview](#overview) • [Report](#-full-project-report) • [Architecture](#architecture) • [Features](#features) • [Setup](#getting-started) • [API](#api-endpoints) • [Testing](#testing) • [Screenshots](#screenshots)

</div>

---

## 🔍 Overview

Any website can embed a single `<script>` tag to render a fully functional widget — a signup form, a promotional popover, or a call-to-action banner. Every visitor submission is captured in real time, run through spam filtering and rate limiting, enriched with geolocation data, and instantly surfaced in a secure, owner-only dashboard where the widget's owner can search, filter, edit, delete, and export their data.

The project was built end-to-end — schema design → REST API → authentication & security → owner dashboard → automated test suite — matching the exact **Definition of Done** set out in the FlyRank capstone brief: CORS handling, payload validation, rate limiting, and geo-provider fallback, each covered by dedicated automated tests.
<br>
## 📄 Full Project Report

A complete technical report of this project is available as a PDF, covering the system end-to-end:

| | |
|---|---|
| 🎯 | Background & objectives |
| 🏗️ | System architecture |
| 🗄️ | Database design |
| 🔌 | API reference |
| 🔐 | Security implementation |
| ✅ | Testing & results |

<p align="center">
  <a href="docs/capstone-project-report.pdf"><b>📎 View Full Report (PDF)</b></a>
</p>

## Architecture

<p align="center">
  <img src="docs/architecture-diagram.svg" alt="Architecture Diagram" width="850">
</p>

**Request flow:** Client (visitor's site or owner's dashboard) → Express API (CORS allowlist, rate limiting, JWT auth) → Services (validation & business rules) → Repositories (parameterized SQL) → Supabase PostgreSQL.

## Features

| | |
|---|---|
| 🔐 **JWT Authentication** | bcrypt-hashed passwords, signed tokens, protected routes via middleware |
| 🏢 **Multi-tenant Widgets** | Full CRUD, every widget scoped to its owner (`owner_id`), tenant isolation enforced at the repository layer — verified by dedicated isolation tests |
| 🌐 **Public Embed Script** | Lightweight `widget.js` that renders the widget on any third-party site and posts submissions — no auth required from the visitor |
| 🛡️ **Spam & Abuse Protection** | Honeypot field detection, payload size limits, and per-IP rate limiting (5 requests / 15 min) on the public submission endpoint |
| 🌍 **Geo Enrichment with Fallback** | Every submission is enriched with visitor country/city via a primary provider (ip-api.com), automatically falling back to a secondary provider (ipapi.co) if the first is unavailable — degrades gracefully (no crash) if both fail |
| 📊 **Owner Dashboard** | Live stats, clickable widget filters, a searchable/filterable/exportable submissions table, and full Add/Edit/Delete flows |
| 🌐 **CORS Allowlisting** | Only explicitly permitted origins can call the API |
| ✅ **41 Automated Tests** | Auth, CRUD, owner isolation, spam detection, rate limiting, CORS preflight, and geo-fallback — all covered |

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Node.js, Express 5 |
| Database | PostgreSQL (Supabase) |
| Auth | JWT (`jsonwebtoken`), `bcrypt` |
| Rate Limiting | `express-rate-limit` |
| Testing | Jest, Supertest |
| API Documentation | Postman |
| Frontend | Vanilla HTML / CSS / JavaScript |

## Project Structure

```
src/
  config/              # database connection (db.js), schema.sql
  middleware/           # JWT auth middleware
  repositories/          # raw SQL — owners, widgets, submissions
  services/               # business logic — auth, widgets, submissions, geo, notifications
  routes/                 # Express route definitions
  public/dashboard/        # login.html, index.html, widget-detail.html, widget.js
  __tests__/                # Jest test suites (auth, widgets, submissions, cors, geo)
docs/
  capstone-project-report.pdf  # full written project report
  architecture-diagram.svg     # system architecture diagram
  api-collection.postman_collection.json
server.js
```

## Getting Started

### Prerequisites
- Node.js 18+
- A PostgreSQL database (this project uses [Supabase](https://supabase.com))

### Setup

```bash
git clone <your-repo-url>
cd embeddable-widget-platform
npm install
```

Create a `.env` file in the project root:

```dotenv
PORT=3000
DATABASE_URL=your_postgres_connection_string
JWT_SECRET=your_jwt_secret
```

Run `src/config/schema.sql` against your database (Supabase SQL Editor, or `psql`) to create the `owners`, `widgets`, and `submissions` tables.

### Run the server

```bash
npm start        # production
npm run dev        # development, with nodemon auto-restart
```

The API runs at `http://localhost:3000`. The dashboard is served at `http://localhost:3000/dashboard/login.html`.

### Run the tests

Create a `.env.test` file with a database connection string (each test file creates and cleans up its own uniquely-named data, so it never touches real records):

```dotenv
PORT=3000
DATABASE_URL=your_postgres_connection_string
JWT_SECRET=your_jwt_secret
```

```bash
npm test
```

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Create an owner account |
| POST | `/auth/login` | — | Log in, receive a JWT |
| POST | `/widgets` | ✅ | Create a widget |
| GET | `/widgets` | ✅ | List the owner's widgets |
| GET | `/widgets/:id` | ✅ | Get one widget (owner-only) |
| PUT | `/widgets/:id` | ✅ | Update a widget |
| DELETE | `/widgets/:id` | ✅ | Delete a widget |
| GET | `/owners/me/stats` | ✅ | Dashboard stats (totals, active count) |
| GET | `/widgets/:id/config` | — | Public widget config, used by `widget.js` |
| POST | `/widgets/:id/submissions` | — | Public — visitor submits the form (rate-limited) |
| GET | `/widgets/:id/submissions` | ✅ | List submissions for a widget |
| PATCH | `/widgets/:id/submissions/:subId` | ✅ | Edit a submission |
| DELETE | `/widgets/:id/submissions/:subId` | ✅ | Delete a submission |

## Testing

**41 automated tests across 5 suites**, written with Jest + Supertest, matching the exact Definition-of-Done requirements: CORS preflight handling, payload validation, rate-limiter triggering, and geo-provider fallback.

| Suite | Tests | Covers |
|---|---|---|
| `auth.test.js` | 9 | Register, login, duplicate-email rejection, protected-route access |
| `widgets.test.js` | 12 | Widget CRUD, **owner isolation** |
| `submissions.test.js` | 12 | Honeypot spam detection, invalid/oversized payload rejection, valid submission flow, **rate limiting**, Edit/Delete with owner isolation |
| `cors.test.js` | 3 | Preflight requests from allowed / disallowed origins |
| `geo.test.js` | 5 | Provider fallback chain — mocked, deterministic, no real network calls |

```
Test Suites: 5 passed, 5 total
Tests:       41 passed, 41 total
```

<p align="center">
  <img src="screenshots/09-tests-passing.png" alt="All Tests Passing" width="700">
</p>

## 📸 API Testing Screenshots

All endpoints were tested using Postman. Screenshots below confirm each request/response, including a live tenant-isolation check.

<table>
<tr>
<td width="50%">

### ✅ Health Check
`GET /health` → Status `200 OK`

Confirms the server is up and reachable before any other test runs.

<img src="screenshots/01-GET-Health-Check.png" width="100%">

</td>
<td width="50%">

### ✅ Register — Success
`POST /auth/register` → Status `201 Created`

A new owner account is created; the password is hashed with `bcrypt` before being stored.

<img src="screenshots/02-POST-Register-User.png" width="100%">

</td>
</tr>
<tr>
<td width="50%">

### ✅ Login — Success
`POST /auth/login` → Status `200 OK`

Valid credentials return a signed JWT, used to authenticate every request that follows.

<img src="screenshots/03-POST-Login-User.png" width="100%">

</td>
<td width="50%">

### 🔒 Create Widget
`POST /widgets` → Status `201 Created`

Authenticated request creates a new widget, automatically scoped to the logged-in owner.

<img src="screenshots/04-POST-Create-Widget.png" width="100%">

</td>
</tr>
<tr>
<td width="50%">

### 🔒 List Widgets
`GET /widgets` → Status `200 OK`

Returns every widget belonging to the authenticated owner.

<img src="screenshots/05-GET-All-Widgets.png" width="100%">

</td>
<td width="50%">

### 🔒 Get Single Widget
`GET /widgets/:id` → Status `200 OK`

Returns full widget details for one ID — owner-scoped.

<img src="screenshots/06-GET-Single-Widget.png" width="100%">

</td>
</tr>
<tr>
<td width="50%">

### 🔒 Update Widget
`PUT /widgets/:id` → Status `200 OK`

The widget's title, copy text, and fields are updated with the new payload.

<img src="screenshots/07-PUT-Update-Widget.png" width="100%">

</td>
<td width="50%">

### ✅ Login — Second Owner
`POST /auth/login` → Status `200 OK`

A second, independent owner account logs in with its own JWT — set up specifically to test tenant isolation.

<img src="screenshots/08-POST-Login-Second-User.png" width="100%">

</td>
</tr>
<tr>
<td width="50%">

### 🛡️ Tenant Isolation Test
`GET /widgets/:id` (second owner) → Status `404 Not Found`

The second owner tries to access the first owner's widget and is correctly blocked — API returns `404` instead of leaking that the widget exists, which is the safer pattern.

<img src="screenshots/09-GET-Tenant-Isolation-Test.png" width="100%">

</td>
<td width="50%">

### 🔒 Delete Widget
`DELETE /widgets/:id` → Status `200 OK`

Widget is permanently removed from the database, confirmed by the success message.

<img src="screenshots/10-DELETE-Widget.png" width="100%">

</td>
</tr>
</table>

## 🗄️ Database Schema

Three tables — `owners`, `widgets`, `submissions` — linked by `owner_id` and `widget_id` foreign keys that enforce tenant isolation at the database level, with indexes on the columns used for lookups and sorting.

<table>
<tr>
<td width="33%">

<h3>👤 Owners Table</h3>

Table: `owners`

Stores each registered account — email and `bcrypt`-hashed password. Every widget and submission is ultimately scoped back to an `owner_id` here.

<img src="screenshots/08-database-owners.png" width="100%">

</td>
<td width="33%">

<h3>🧩 Widgets Table</h3>

Table: `widgets`

Holds every widget's configuration — type, title, copy text, fields, and targeting rules — linked to its creator via `owner_id`.

<img src="screenshots/06-database-widgets.png" width="100%">

</td>
<td width="33%">

<h3>📝 Submissions Table</h3>

Table: `submissions`

Captures every visitor submission linked to a `widget_id`, enriched with geo data and flagged for spam before being stored.

<img src="screenshots/07-database-submissions.png" width="100%">

</td>
</tr>
</table>

### 📝 Submissions Table

Captures every visitor submission linked to a `widget_id`, enriched with geo data and flagged for spam before being stored.

<img src="screenshots/07-database-submissions.png" width="100%">

</td>
</tr>
</table>

## Screenshots

<table>
<tr>
<td align="center"><img src="screenshots/01-login.png" width="270"><br><sub><b>Login</b></sub></td>
<td align="center"><img src="screenshots/02-dashboard.png" width="270"><br><sub><b>Dashboard</b></sub></td>
<td align="center"><img src="screenshots/03-widget-detail.png" width="270"><br><sub><b>Widget Submissions</b></sub></td>
</tr>
<tr>
<td align="center"><img src="screenshots/04-edit-submission.png" width="270"><br><sub><b>Edit Submission</b></sub></td>
<td align="center"><img src="screenshots/05-add-submission.png" width="270"><br><sub><b>Add Submission</b></sub></td>
<td></td>
</tr>
</table>

## Live Embed Demo Walkthrough

An end-to-end walkthrough of the public embed script — from a visitor's view on a third-party page, through to the owner seeing the result in their dashboard and managing it.

| Step | Screenshot |
|---|---|
| 1️⃣ Widget rendered live via `widget.js` on a demo page | <img src="screenshots/10-embed-widget-live.png" width="500"> |
| 2️⃣ Visitor fills out the form | <img src="screenshots/10b-embed-widget-filled.png" width="500"> |
| 3️⃣ Visitor submits | <img src="screenshots/11-embed-widget-submitted.png" width="500"> |
| 4️⃣ Submission instantly visible in the owner's dashboard | <img src="screenshots/12-submission-in-dashboard.png" width="500"> |
| 5️⃣ Owner deletes a submission (with confirmation) | <img src="screenshots/13-delete-confirmation.png" width="500"> |
| 6️⃣ List updates immediately after deletion | <img src="screenshots/14-after-delete.png" width="500"> |

---

<div align="center">

## Author

**Numair Iqbal**
Backend AI Engineering Intern, FlyRank AI (July 2026 cohort)
BS Computer Science — University of Layyah

[![GitHub](https://img.shields.io/badge/GitHub-Numair--Iqbal-181717?style=flat-square&logo=github)](https://github.com/Numair-Iqbal)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-numair--iqbal-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://linkedin.com/in/numair-iqbal)

</div>
