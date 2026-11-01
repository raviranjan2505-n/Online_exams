# Online Exam System — MERN (TypeScript)

Conversion of the Spring Boot / Thymeleaf / H2 project into:

| Layer    | Java original                       | This version                          |
|----------|-------------------------------------|---------------------------------------|
| Frontend | Thymeleaf + Bootstrap + Chart.js    | **Next.js 14 (App Router) + TypeScript** |
| Backend  | Spring MVC + Spring Security + JPA  | **Express + TypeScript**              |
| Database | H2 / MySQL                          | **MongoDB (Mongoose)**                |
| Auth     | Session form-login, BCrypt          | JWT (Bearer token) + bcryptjs         |
| Uploads  | `FileStorageService` → `./uploads`  | multer → `backend/uploads`            |

No Redis, no queues, no extra infrastructure — just Node and MongoDB.

## Run it

Prerequisites: Node 18+, a running MongoDB (local or Atlas).

```bash
# 1) backend  (http://localhost:5000)
cd backend
cp .env.example .env        # edit MONGO_URI / JWT_SECRET if needed
npm install
npm run dev

# 2) frontend (http://localhost:3000)
cd ../frontend
cp .env.local.example .env.local
npm install
npm run dev
```

Production: `npm run build && npm start` in each folder.

**Default admin** (created on first start, same as the Java app): `admin` / `adminpass`
Change it via `ADMIN_USERNAME` / `ADMIN_PASSWORD` in `backend/.env` *before* the first run.
Students register themselves at `/register` (email is the login).

## Feature parity

**Admin** — **per-exam marking scheme (marks for a correct answer, negative marks for a wrong one; unattempted is always 0)** · dashboard (KPIs, submissions-per-exam chart, 5 most recent submissions) · exam CRUD ·
question CRUD per exam · deleting an exam cascades to its questions and results · questions that
students have already answered cannot be deleted · view all submissions per exam · list students ·
reset a student's password · delete a student (cascades to their results).

**Student** — register with profile picture · login · dashboard (KPIs + score history chart,
available vs. taken exams) · paginated exam page with question palette and live countdown that
auto-submits · instant result (pass mark 50%) · per-question review (correct vs. chosen) ·
my results · **marking scheme, total marks and a correct/wrong/unattempted breakdown shown before, during and after the exam** · update details / picture / password.

## Project layout

```
backend/src
  models/        User, Exam, Question, ExamResult (answers embedded)
  controllers/   auth, admin, student (+ exam taking)
  middleware/    JWT auth + role guard, multer upload, error handler
  routes/        all endpoints under /api
  server.ts      boot, Mongo connect, admin seed
frontend/src
  app/           pages (login, register, admin/*, student/*)
  components/    Navbar, RequireRole guard, forms, small bar chart
  lib/           api client, auth context, types, useFetch
```

## API summary

```
POST /api/auth/register  (multipart)   POST /api/auth/login   GET /api/auth/me

ADMIN  (Bearer token, role ADMIN)
GET  /api/admin/dashboard
GET/POST        /api/admin/exams
GET/PUT/DELETE  /api/admin/exams/:id
GET             /api/admin/exams/:id/results
GET/POST        /api/admin/exams/:id/questions
GET/PUT/DELETE  /api/admin/questions/:id
GET             /api/admin/students
DELETE          /api/admin/students/:id
POST            /api/admin/students/:id/reset-password

STUDENT (Bearer token, role STUDENT)
GET  /api/student/dashboard          GET /api/student/results
GET  /api/student/results/:id        (summary + review)
GET  /api/student/exams/:id          (questions WITHOUT correct answers)
POST /api/student/exams/:id/submit   { answers: { [questionId]: 1..4 } }
GET/PUT /api/student/profile         POST /api/student/profile/picture  POST /api/student/profile/password
```

## Negative marking

Set on each exam by the admin (defaults: +4 correct, −1 wrong, 0 unattempted).
- Total marks = number of questions × marks per correct answer.
- Score = correct × (+marks) − wrong × (negative marks). It can go below 0; the percentage shown is floored at 0.
- The scheme is copied onto each result when it's submitted, so editing an exam later never changes old results.
- Students see the scheme and total marks on the dashboard, on the exam page, on the result page and in the review.
- Because marks are now per exam, the per-question "marks" field from the Java app was removed.

## Differences from the Java version (deliberate)

- **Grading happens only on the server**, and the exam endpoint never sends `correctAnswer` to the
  browser (the Java app only did the same implicitly, via server-rendered HTML).
- **One attempt per exam** is enforced by a unique `(student, exam)` index, not just by hiding the
  exam in the list. Double-submits are rejected.
- Destructive actions use `DELETE`/`POST` with a confirm dialog instead of `GET` links
  (`GET /admin/exam/delete/{id}` in Java could be triggered by any link or crawler).
- Passwords must be at least 6 characters; the Java app had no minimum.
- The review endpoint returns 403 if a student asks for someone else's result.
- Chart.js was replaced by a tiny built-in bar chart to avoid an extra dependency.
- The timer uses a fixed deadline (`Date.now()`), so it doesn't drift or stall in background tabs.
  Note it is still enforced in the browser only, as in the original.
