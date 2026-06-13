# MOCKUP-AI Mock Interview Platform

## Project Overview

AI Mock Interview Platform is an intelligent web application that helps job seekers practice interviews using AI. The platform generates questions, evaluates answers, and provides detailed feedback to improve interview skills.

**Team ByteForce**
- Anushka Bisht 
- Ayushi Aswal 
- Manas Joshi
---

## Features

**Core Features**
- AI-Powered Questions Generation
- Real-time Answer Evaluation (0-100% scoring)
- Chat-based and Video-based Interview Modes
- Domain-Specific Questions (CSE, IT, MBA, Design, Data Science)
- Resume-Based Personalized Interviews

**User Features**
- Email/Password Authentication with JWT
- Google OAuth 2.0 Integration
- Password Reset with Email OTP
- User Profile Management (Skills, Projects, Experience)
- First-time User Onboarding Flow

**Interview Features**
- Proctoring System (Tab switch, copy-paste detection)
- Fullscreen Enforcement during interviews
- Violation Tracking (3 warnings before termination)
- Progress Tracking with Question Counter

**Feedback & Analytics**
- Per-question Detailed Analysis
- Model Answers for Comparison
- Strengths and Improvement Areas
- Personalized Practice Plan
- Score Breakdown (Overall, Clarity, Relevance, Confidence)

---

## Tech Stack

**Backend**
- Node.js + Express.js
- PostgreSQL + Knex.js
- JWT for authentication
- Groq API (primary AI)
- Google Gemini API (fallback AI)
- Nodemailer for emails
- Multer for file uploads

**Frontend**
- React 18 + Vite
- Tailwind CSS
- React Router DOM
- Axios + React Query
- Lucide Icons

**DevOps**
- Docker + Docker Compose

---

## Project Structure
```
ai-mock-interview-ecosystem/
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── database.js
│   │   ├── services/ai/
│   │   │   ├── baseAIService.js
│   │   │   ├── groqService.js
│   │   │   ├── chatInterviewService.js
│   │   │   └── questionGeneratorService.js
│   │   ├── routes/v2/aiRoutes.js
│   │   └── middleware/auth.js
│   ├── uploads/
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── OnboardingPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── InterviewSelectionPage.jsx
│   │   │   ├── ChatInterviewPage.jsx
│   │   │   ├── VideoInterviewPage.jsx
│   │   │   ├── FeedbackPage.jsx
│   │   │   ├── QuestionsPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   └── SessionHistoryPage.jsx
│   │   ├── components/Navbar.jsx
│   │   ├── contexts/AuthContext.jsx
│   │   └── services/aiInterviewService.js
│   └── package.json
│
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
└── README.md
```
---

## Installation

### Prerequisites
- Node.js 18 or higher
- PostgreSQL 14 or higher
- Docker (optional)

### Local Setup

**Step 1: Clone Repository**
git clone <repository-url>
cd ai-mock-interview-ecosystem

**Step 2: Setup Backend**
cd backend
npm install

**Step 3: Setup Database**
psql -U postgres
- CREATE DATABASE amie_db;
- CREATE USER amie_user WITH PASSWORD 'amie_password';
- GRANT ALL PRIVILEGES ON DATABASE amie_db TO amie_user;

**Step 4: Setup Frontend**
cd frontend
npm install

Create .env file:
VITE_API_URL=http://localhost:5000/api/v1
VITE_GOOGLE_CLIENT_ID=your-google-client-id

**Step 5: Run Application**

Terminal 1 - Backend:
cd backend
npm run dev

Terminal 2 - Frontend:
cd frontend
npm run dev

Open http://localhost:3000

---

### Docker Setup

**Step 1: Create .env files** (as shown above in local setup)

**Step 2: Build and Run**
docker-compose up --build

**Step 3: Access**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- PostgreSQL: localhost:5432

**Docker Commands**
- docker-compose up               # Start containers
- docker-compose up -d           # Start in background
- docker-compose down            # Stop containers
- docker-compose down -v         # Stop and remove volumes
- docker-compose logs -f         # View logs
- docker-compose up --build      # Rebuild after changes

---

## How to Use

### 1. Create an Account
- Go to http://localhost:3000/register
- Fill in your name, email, and password
- Click "Create Account"
- OR click "Continue with Google" on login page

### 2. Complete Your Profile
- After first login, you will be redirected to Onboarding page
- Fill personal information (headline, role, experience, location)
- Add skills with proficiency levels
- Add projects with descriptions
- Add certifications
- Add work experience
- Set career goals (target roles, dream companies)

### 3. Start an Interview
- Go to Dashboard
- Click "Start New Interview"
- Select Interview Type: Resume-Based / Domain-Based / Behavioral
- Select Domain (if Domain-Based)
- Choose Difficulty: Easy / Medium / Hard
- Select Number of Questions (5, 10, 15, 20)
- Click "Generate AI Questions"
- Select Interview Mode: Chat / Video
- Click "Start Interview"

### 4. During the Interview
- Stay in fullscreen mode (automatically enforced)
- Do not switch tabs (3 warnings will terminate interview)
- Do not copy-paste (disabled during interview)
- Type or speak your answers
- Press Enter to submit (Chat mode)

### 5. Review Feedback
- After completing all questions, click "View Feedback Report"
- Review overall score and level
- See per-question analysis
- Compare your answer with model answer
- Read strengths and improvement areas
- Follow personalized practice plan

### 6. Browse Questions
- Go to Questions page
- Filter by domain, type, and difficulty
- Ask AI assistant any interview-related question

### 7. View Session History
- Go to History page
- View all past interviews
- Click "View Report" for detailed feedback

---

## API Endpoints

**Authentication**

- POST   /api/v1/auth/register      - Register new user
- POST   /api/v1/auth/login         - Login user
- POST   /api/v1/auth/google        - Google OAuth login
- POST   /api/v1/auth/forgot-password - Send OTP for reset
- POST   /api/v1/auth/reset-password - Reset password with OTP
- GET    /api/v1/auth/me            - Get current user

**User Profile**

- POST   /api/v1/onboarding         - Save/update profile
- GET    /api/v1/profile            - Get user profile
- POST   /api/v1/upload/profile-picture - Upload profile picture

**Interviews**

- POST   /api/v1/interviews/schedule - Schedule new interview
- GET    /api/v1/interviews/sessions/:sessionId - Get session
- POST   /api/v1/interviews/sessions/:sessionId/responses - Submit answer
- POST   /api/v1/interviews/sessions/:sessionId/complete - Complete interview
- GET    /api/v1/interviews/sessions/:sessionId/feedback - Get feedback

**AI**

- POST   /api/v1/ai/generate-questions - Generate AI questions
- POST   /api/v1/ai/evaluate        - Evaluate an answer
- POST   /api/v1/ai/chat/evaluate   - Chat evaluation
- POST   /api/v1/ai/follow-up       - Generate follow-up question

**Proctoring**

- POST   /api/v1/interviews/:sessionId/flag - Report violation
- GET    /api/v1/interviews/:sessionId/proctoring - Get status

**Questions**

- GET    /api/v1/questions           - Get questions with filters

**Sessions**

- GET    /api/v1/sessions/history    - Get session history
- DELETE /api/v1/sessions/:sessionId - Delete a session
- DELETE /api/v1/sessions/all        - Delete all sessions

---

## Environment Variables

### Backend .env

| Variable | Required | Description |
|----------|----------|-------------|
| PORT | No | Server port (default: 5000) |
| NODE_ENV | No | Environment (development/production) |
| DB_HOST | Yes | Database host |
| DB_PORT | Yes | Database port |
| DB_USER | Yes | Database user |
| DB_PASSWORD | Yes | Database password |
| DB_NAME | Yes | Database name |
| JWT_SECRET | Yes | JWT signing secret |
| GROQ_API_KEY | Yes | Groq API key |
| GROQ_MODEL | No | Groq model name |
| GOOGLE_CLIENT_ID | For Google Login | Google OAuth client ID |
| GOOGLE_CLIENT_SECRET | For Google Login | Google OAuth secret |
| EMAIL_SERVICE | For Email | Email service (gmail/outlook) |
| EMAIL_USER | For Email | Email account |
| EMAIL_PASS | For Email | Email password/app password |

### Frontend .env

| Variable | Required | Description |
|----------|----------|-------------|
| VITE_API_URL | Yes | Backend API URL |
| VITE_GOOGLE_CLIENT_ID | For Google Login | Google OAuth client ID |

---

