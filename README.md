# LearnStudio – Learning Management System

A production-ready LMS built with modern full-stack technologies.

## Tech Stack

| Layer    | Technology                  |
|----------|-----------------------------|
| Frontend | HTML5 + CSS3 + Bootstrap 5  |
| Backend  | Java 17 + Spring Boot 3.2   |
| Database | MySQL 8                     |
| DevOps   | Docker + Jenkins            |
| Code     | GitHub                      |

## Project Structure

```
Minor Project/
├── .gitignore
├── README.md
│
├── frontend (root)
│   ├── css/
│   │   └── style.css          # Custom styles
│   ├── js/
│   │   └── api.js             # API calls to Spring Boot
│   ├── index.html             # Landing page
│   ├── login.html             # Login & Register
│   ├── dashboard.html         # Student dashboard
│   ├── courses.html           # Course catalog
│   └── course-detail.html     # Course detail & lessons
│
└── backend/
    ├── pom.xml                # Maven dependencies
    └── src/main/
        ├── java/com/learnhub/
        │   ├── LmsApplication.java
        │   ├── config/
        │   │   ├── SecurityConfig.java
        │   │   └── CorsConfig.java
        │   ├── controller/
        │   │   ├── AuthController.java
        │   │   ├── CourseController.java
        │   │   ├── EnrollmentController.java
        │   │   └── UserController.java
        │   ├── dto/
        │   │   ├── LoginRequest.java
        │   │   ├── RegisterRequest.java
        │   │   ├── AuthResponse.java
        │   │   └── CourseDTO.java
        │   ├── entity/
        │   │   ├── User.java
        │   │   ├── Course.java
        │   │   ├── Lesson.java
        │   │   └── Enrollment.java
        │   ├── repository/
        │   │   ├── UserRepository.java
        │   │   ├── CourseRepository.java
        │   │   ├── LessonRepository.java
        │   │   └── EnrollmentRepository.java
        │   ├── security/
        │   │   ├── JwtUtil.java
        │   │   ├── JwtFilter.java
        │   │   └── UserDetailsServiceImpl.java
        │   └── service/
        │       ├── AuthService.java
        │       ├── CourseService.java
        │       └── EnrollmentService.java
        └── resources/
            └── application.properties
```

## REST API Endpoints

| Method | Endpoint                        | Auth     | Description         |
|--------|---------------------------------|----------|---------------------|
| POST   | /api/auth/register              | Public   | Register new user   |
| POST   | /api/auth/login                 | Public   | Login → JWT token   |
| GET    | /api/courses                    | Public   | List all courses    |
| GET    | /api/courses/{id}               | Public   | Course detail       |
| POST   | /api/courses                    | INSTRUCTOR | Create course     |
| PUT    | /api/courses/{id}               | INSTRUCTOR | Update course     |
| DELETE | /api/courses/{id}               | ADMIN    | Delete course       |
| POST   | /api/enrollments/{courseId}     | STUDENT  | Enroll in course    |
| GET    | /api/enrollments/my             | STUDENT  | My enrollments      |
| PUT    | /api/enrollments/{id}/progress  | STUDENT  | Update progress     |
| GET    | /api/users/me                   | Any      | My profile          |

## How to Run

### Prerequisites
- Java 17+
- Maven 3.9+
- MySQL 8+

### Database Setup
```sql
CREATE DATABASE lms_db;
```

### Backend
```bash
cd backend
mvn spring-boot:run
```
Server starts at: `http://localhost:8080`

### Frontend
Open `index.html` with VS Code Live Server on port `5500`

## Database Schema

```
users         → id, name, email, password, role
courses       → id, title, description, price, level, instructor_id
lessons       → id, title, video_url, duration, position, course_id
enrollments   → id, user_id, course_id, progress, enrolled_at
```
