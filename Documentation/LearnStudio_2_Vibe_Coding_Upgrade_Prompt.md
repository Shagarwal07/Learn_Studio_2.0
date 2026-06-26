# LearnStudio 2.0 — AI Vibe Coding Upgrade Prompt File

## Goal
Upgrade the existing LearnStudio LMS into a serious, deployable, production-style learning platform while preserving the current Spring Boot backend foundation.

Current project snapshot:
- Frontend: HTML5, CSS3, Bootstrap 5, Vanilla JavaScript
- Backend: Java 17, Spring Boot 3.2, Maven
- Database: MySQL 8
- Auth: Spring Security + JWT
- DevOps: Docker, Docker Compose, GitHub, Jenkins mentioned
- AI: Gemini and Grok support
- Modules: Auth, Role-Based Dashboards, Courses, Lessons, Enrollments, Progress, AI Doubt Solver, AI Quiz, Admin Controls

Target upgraded stack:
- Frontend: Next.js 15+ App Router, TypeScript, Tailwind CSS, React Query/Axios
- Backend: Spring Boot 3.2+/Java 17 REST API
- Database: PostgreSQL
- Auth: Spring Security + JWT + Refresh Token
- File Storage: Cloudinary first, S3-compatible storage later
- AI: Gemini/OpenRouter provider abstraction
- Deployment: Vercel frontend, Render/Railway backend, Neon/Supabase PostgreSQL, Cloudinary media
- DevOps: Docker, Docker Compose, environment-based config, GitHub Actions/Jenkins optional

---

## Master Prompt for AI Coding Assistant

You are a senior full-stack engineer. I already have an LMS project named LearnStudio with Spring Boot backend, MySQL, JWT auth, Docker Compose, Bootstrap/Vanilla JS frontend, and AI features. I want to upgrade it into a serious production-style LMS called LearnStudio 2.0.

Do not blindly rewrite everything. First inspect the existing structure, controllers, entities, services, security config, database schema, README, Docker setup, and frontend pages. Then migrate the project step by step.

### Core Rules
1. Preserve the existing working Spring Boot logic wherever possible.
2. Do not remove features unless they are replaced with a better equivalent.
3. Keep backend and frontend separated.
4. Use clean REST API conventions.
5. Make the app deployable.
6. Add clear README instructions.
7. Never hardcode API keys or secrets.
8. Use `.env.example` files.
9. Keep code beginner-debuggable with clear naming and comments only where useful.
10. After every major step, explain what changed and how to test it.

---

## Phase 1 — Backend Cleanup and Production Structure

Upgrade the Spring Boot backend structure:

- Use layered architecture:
  - controller
  - service
  - repository
  - entity
  - dto
  - config
  - security
  - exception
  - mapper
- Add DTOs instead of exposing entities directly.
- Add global exception handling using `@ControllerAdvice`.
- Add validation using `jakarta.validation`.
- Add consistent API response format:
  - success
  - message
  - data
  - timestamp

Keep existing modules:
- Auth
- Users
- Courses
- Lessons
- Enrollments
- Progress
- AI Assistant
- Admin dashboard APIs

Add missing production-grade modules:
- Refresh token support
- Instructor course analytics
- Certificate generation API
- Course reviews/ratings
- Lesson completion tracking
- Search/filter/pagination for courses
- Audit timestamps

---

## Phase 2 — Database Upgrade

Migrate database from MySQL 8 to PostgreSQL.

Tasks:
1. Update Maven dependencies for PostgreSQL.
2. Update `application.yml` or `application.properties`.
3. Create environment variables:
   - DATABASE_URL
   - DB_USERNAME
   - DB_PASSWORD
   - JWT_SECRET
   - AI_PROVIDER
   - GEMINI_API_KEY
   - OPENROUTER_API_KEY
   - CLOUDINARY_CLOUD_NAME
   - CLOUDINARY_API_KEY
   - CLOUDINARY_API_SECRET
4. Update Docker Compose to include PostgreSQL.
5. Add seed data for:
   - Admin
   - Instructor
   - Student
   - Categories
   - Courses
   - Lessons
   - Enrollments

Make sure the app can run locally using Docker Compose.

---

## Phase 3 — Authentication and Role-Based Access

Improve authentication:

- Register
- Login
- JWT access token
- Refresh token
- Logout
- Role-based access:
  - ADMIN
  - INSTRUCTOR
  - STUDENT

Protect APIs:
- Admin APIs only for ADMIN
- Instructor course create/update/delete only for INSTRUCTOR or ADMIN
- Student enroll/progress APIs only for STUDENT
- AI APIs only for authenticated users

Return clean auth responses:
- token
- refreshToken
- userId
- name
- email
- role

---

## Phase 4 — Next.js Frontend Migration

Create a new frontend folder using:

- Next.js 15+ App Router
- TypeScript
- Tailwind CSS
- Axios or Fetch wrapper
- React Query/TanStack Query
- Zustand or Context for auth state
- Responsive dashboard layout

Pages to create:

Public:
- `/`
- `/courses`
- `/courses/[slug]`
- `/login`
- `/register`

Student:
- `/dashboard`
- `/dashboard/my-courses`
- `/dashboard/course/[id]/learn`
- `/dashboard/ai`
- `/dashboard/certificates`
- `/dashboard/profile`

Instructor:
- `/instructor`
- `/instructor/courses`
- `/instructor/courses/new`
- `/instructor/courses/[id]/edit`
- `/instructor/analytics`

Admin:
- `/admin`
- `/admin/users`
- `/admin/courses`
- `/admin/system`

Design requirements:
- Modern LMS dashboard
- Sidebar layout
- Course cards
- Progress bars
- Clean typography
- Mobile responsive
- Loading states
- Error states
- Empty states

---

## Phase 5 — AI Assistant Upgrade

Refactor AI into a provider-based service.

Create:
- `AiProvider` interface
- `GeminiAiProvider`
- `OpenRouterAiProvider`
- `AiService`
- fallback handling

AI features:
1. Doubt Solver
   - Student asks question
   - Optional course/lesson context
   - AI replies in simple explanation
2. Quiz Generator
   - Topic input
   - Difficulty selection
   - 5 or 10 MCQs
   - Score calculation
   - Store quiz attempt
3. Lesson Summary
   - Summarize lesson content
4. Course Recommendation
   - Based on enrolled courses and progress
5. Interview Prep Mode
   - Generate viva/interview questions from course topic

Important:
- Never expose API keys in frontend.
- All AI requests must go through Spring Boot backend.
- Add graceful error message if quota fails.
- Store AI quiz attempts in database.

---

## Phase 6 — File Upload and Media

Add Cloudinary integration.

Features:
- Course thumbnail upload
- User profile image upload
- Certificate image/PDF storage
- Optional lesson resource upload

Rules:
- Frontend sends file to backend.
- Backend uploads to Cloudinary.
- Store only secure URL in database.
- Validate file type and size.

---

## Phase 7 — Deployment

Make the project deployable.

Frontend:
- Deploy Next.js to Vercel.
- Configure `NEXT_PUBLIC_API_BASE_URL`.

Backend:
- Deploy Spring Boot backend to Render or Railway.
- Use Dockerfile.
- Configure environment variables.

Database:
- Use Neon PostgreSQL or Supabase PostgreSQL.

Media:
- Use Cloudinary.

Add:
- Production README
- Local setup guide
- Deployment guide
- API documentation
- Postman collection if possible

---

## Phase 8 — Final Quality Checklist

Before final output, verify:

- User can register/login.
- JWT works.
- Role-based routes work.
- Student can browse and enroll in courses.
- Student can complete lessons and progress updates.
- Instructor can create/edit courses and lessons.
- Admin can view users/courses.
- AI doubt solver works.
- AI quiz works.
- Cloudinary upload works.
- Frontend and backend run separately.
- Docker Compose runs locally.
- Deployment environment variables are documented.
- README is clean and professional.

---

## Output Format for AI Assistant

For every phase, respond with:

1. Files created/modified
2. Code changes
3. Commands to run
4. How to test
5. Common bugs and fixes

Do not skip testing instructions.

Start by analyzing my current project structure and then begin Phase 1.
