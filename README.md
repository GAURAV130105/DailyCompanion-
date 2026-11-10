# Student Life OS 🎓

> **All-in-One Student Productivity and Competitive Examination Management Platform**

A production-quality, responsive web application that serves as a personal operating system for students — combining daily planning, study tracking, competitive exam preparation, habit management, finance tracking, and AI-powered assistance.

---

## ✨ Feature Modules

| # | Module | Description |
|---|---|---|
| 1 | 🏠 Dashboard | Unified view of daily progress, tasks, habits, scores |
| 2 | 📅 Daily Planner | Time-blocked daily scheduling with drag-drop |
| 3 | ✅ Task Manager | Kanban + list task management with priorities |
| 4 | 🗓️ Calendar | Month/week/day views of all events |
| 5 | 📚 Study Tracker | Live session tracking with subject analytics |
| 6 | ⏱️ Pomodoro Timer | Focus sessions with configurable cycles |
| 7 | 🎯 Exam Preparation | Multi-exam profiles (UPSC, NDA, SSC, Banking, etc.) |
| 8 | 📋 Syllabus Tracker | Chapter/topic completion with progress rings |
| 9 | 🔁 Revision Manager | Spaced repetition revision scheduling |
| 10 | 📝 Mock Test Tracker | Score entry, accuracy analysis, subject breakdown |
| 11 | 🏆 Goals & Milestones | Goal setting with milestone tracking |
| 12 | 💪 Habit Tracker | Daily habits with streaks and heatmap |
| 13 | 💰 Finance Manager | Income/expense tracking with budgets |
| 14 | 📖 Journal | Daily reflection with mood tracking |
| 15 | ⭐ Productivity Score | Daily 10-point score with breakdown |
| 16 | 🏃 Health & Fitness | Sleep, water, exercise tracking |
| 17 | 🧠 Career & Skills | Skill development tracking |
| 18 | 📄 Notes | Subject-linked knowledge manager |
| 19 | 📊 Analytics | Comprehensive charts and reports |
| 20 | 🤖 AI Assistant | AI-powered schedule and prep analysis |
| 21 | 🔔 Notifications | Smart reminders for tasks and revisions |
| 22 | ⚙️ Settings | Profile, theme, score weights |

---

## 🛠️ Technology Stack

### Backend
- **Python 3.11+** / **Django 4.2 LTS**
- **Django REST Framework** — REST API
- **PostgreSQL 16** — Primary database
- **Redis** — Cache + Celery broker
- **Celery** — Async tasks (notifications, score computation)
- **JWT Authentication** — djangorestframework-simplejwt

### Frontend
- **React 18** + **TypeScript**
- **Vite** — Build tool
- **Tailwind CSS v3** + **shadcn/ui** — Styling
- **React Router v6** — Client-side routing
- **TanStack Query v5** — Server state management
- **React Hook Form** + **Zod** — Form validation
- **Recharts** — Data visualization
- **Zustand** — Local UI state

---

## 🚀 Quick Start (Docker)

### Prerequisites
- Docker Desktop
- Git

### 1. Clone & Configure
```bash
git clone <repo-url>
cd student-life-os
cp .env.example .env
# Edit .env with your values
```

### 2. Start All Services
```bash
docker-compose up --build
```

### 3. Create Admin User
```bash
docker-compose exec backend python manage.py createsuperuser
```

### 4. Access the App
| Service | URL |
|---|---|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000/api/v1/ |
| Django Admin | http://localhost:8000/admin/ |

---

## 🏃 Local Development (Without Docker)

### Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate      # Windows
source venv/bin/activate   # Linux/Mac

# Install dependencies
pip install -r requirements/development.txt

# Configure environment
cp .env.example .env
# Edit .env — set DATABASE_URL and REDIS_URL

# Run migrations
python manage.py migrate

# Start server
python manage.py runserver
```

### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Set VITE_API_BASE_URL=http://localhost:8000/api/v1

# Start dev server
npm run dev
```

---

## 🧪 Testing

### Backend Tests (Pytest)
```bash
cd backend
pytest -v
pytest --cov=apps --cov-report=html  # With coverage
```

### Frontend Tests (Vitest)
```bash
cd frontend
npm run test
npm run test:coverage
```

### E2E Tests (Playwright)
```bash
cd frontend
npx playwright test
```

---

## 📁 Project Structure
```
student-life-os/
├── backend/           # Django REST API
│   ├── config/        # Django settings + URLs
│   ├── apps/          # All Django apps (16 modules)
│   └── requirements/  # Python dependencies
├── frontend/          # React SPA
│   └── src/
│       ├── api/       # TanStack Query hooks
│       ├── components/# Reusable components
│       ├── pages/     # Route-level pages
│       ├── types/     # TypeScript interfaces
│       └── stores/    # Zustand state
├── nginx.conf         # Production reverse proxy
├── docker-compose.yml # Local development
└── Makefile           # Dev shortcuts
```

---

## 🔐 Security

- JWT authentication with short-lived access tokens (15 min)
- All API endpoints require authentication
- User-scoped data: users can only access their own records
- Journal and finance data protected as private records
- Environment variable management (no hardcoded secrets)
- CORS configured for explicit origins only
- Input validation on both frontend (Zod) and backend (DRF serializers)

---

## 📋 Exam Categories Supported

- UPSC Civil Services
- NDA (National Defence Academy)
- CDS (Combined Defence Services)
- AFCAT (Air Force Common Admission Test)
- SSC (Staff Selection Commission)
- Banking (IBPS, SBI, RBI)
- State-level examinations
- Custom examinations

---

## 🤖 AI Assistant

The AI assistant uses your own data (with explicit consent) to:
- Generate personalized daily schedules
- Analyze exam preparation progress
- Recommend study priorities
- Create revision plans
- Summarize weekly performance

> The AI **never** silently modifies your data. All suggestions require your explicit confirmation.

---

## 📄 License

MIT License — See [LICENSE](LICENSE) for details.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'Add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

*Built with ❤️ for students preparing for competitive examinations*
