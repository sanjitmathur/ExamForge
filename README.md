# ExamForge

AI-powered question paper generator for teachers and educational institutions.

**Live App:** [https://exam-forge-gray.vercel.app](https://exam-forge-gray.vercel.app)

---

## Features

### For Teachers & Users
- **Upload Papers** — Upload existing question papers (PDF, DOCX, images) for AI-powered extraction
- **Question Bank** — Automatically extract and categorize questions by type, difficulty, topic, subject, board, grade, and Bloom's taxonomy level
- **Paper Generation** — Generate new question papers with AI based on your question bank, with full control over title, board, grade, subject, topics, question types, difficulty mix, total marks, and duration
- **Chat Refinement** — Refine generated papers through a modern chat interface with instant messaging, stop generation, quick-action chips, and markdown rendering
- **Smart Learning** — The system learns your preferences over time (formatting, content style, structure) and applies them to future generations
- **Export** — Download papers and answer keys as PDF or Word documents
- **Dark / Light Mode** — Full theme support with smooth View Transitions API crossfade

### For Admins
- **Dashboard** — Platform-wide statistics (users, papers, questions) with charts
- **User Management** — Create, edit, delete users and reset passwords
- **User Details** — View per-user stats and paper history

---

## Live Demo

Visit **[https://exam-forge-gray.vercel.app](https://exam-forge-gray.vercel.app)** to try ExamForge. Sign up for a free account and start generating papers immediately.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite |
| **Backend** | FastAPI, SQLAlchemy (async), Pydantic |
| **Database** | PostgreSQL (Neon) in production, SQLite locally |
| **AI** | Google Gemini API (question extraction, paper generation, learning extraction) |
| **Auth** | JWT tokens, bcrypt password hashing, role-based access control |
| **Deployment** | Vercel (frontend) + Render (backend) |

---

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 18+
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

### Setup

1. **Clone the repo:**
   ```bash
   git clone https://github.com/sanjitmathur/ExamForge.git
   cd ExamForge
   ```

2. **Create a `.env` file** in the `backend/` directory (see `backend/.env.example`):
   ```env
   SECRET_KEY=your-secret-key-here
   GEMINI_API_KEY=your-gemini-api-key-here
   GEMINI_MODEL=gemini-2.5-flash
   ```

3. **Set up the backend:**
   ```bash
   python -m venv venv

   # Windows
   source venv/Scripts/activate
   # macOS / Linux
   source venv/bin/activate

   pip install -r backend/requirements.txt
   ```

4. **Set up the frontend:**
   ```bash
   cd frontend
   npm install
   ```

### Running Locally

Start both servers in separate terminals:

```bash
# Terminal 1 — Backend (http://localhost:8000)
cd backend
uvicorn app.main:app --reload --port 8000

# Terminal 2 — Frontend (http://localhost:5173)
cd frontend
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Admin Credentials

ExamForge includes pre-configured fixed administrator credentials:

- **Email:** `sanjitmathur08@gmail.com`
- **Username:** `sanjit`
- **Password:** `admin`

Sign in at `/login/admin` using either the email or username with the password.

### Creating Additional Accounts

```bash
cd backend
python create_teacher.py
```

---

## Project Structure

```
ExamForge/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI entry point & CORS config
│   │   ├── config.py            # Environment settings (Pydantic)
│   │   ├── database.py          # Async SQLAlchemy engine & sessions
│   │   ├── models.py            # ORM models (User, Paper, Question, etc.)
│   │   ├── schemas.py           # Request / response schemas
│   │   ├── constants.py         # Boards, grades, subjects, question types
│   │   ├── routers/
│   │   │   ├── auth.py          # Login, register, profile
│   │   │   ├── admin.py         # Admin stats & user management
│   │   │   ├── papers.py        # Upload, list, delete papers
│   │   │   ├── questions.py     # Question bank & stats
│   │   │   ├── generation.py    # Paper generation & chat refinement
│   │   │   ├── export.py        # PDF / Word export
│   │   │   └── conversations.py # Chat history
│   │   └── services/
│   │       ├── paper_generator.py  # Gemini integration & learning system
│   │       ├── export_service.py   # PDF & Word file generation
│   │       ├── paper_processor.py  # File text extraction orchestrator
│   │       └── text_extractor.py   # PDF / DOCX / image OCR extraction
│   ├── requirements.txt
│   ├── .env.example
│   └── create_teacher.py        # Admin user creation script
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx              # Routing & layout
│   │   ├── App.css              # Global styles (glass-card aesthetic)
│   │   ├── index.css            # CSS custom properties & theme variables
│   │   ├── constants.ts         # Shared board/grade/subject constants
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx         # Landing page with scroll-reveal
│   │   │   ├── UserAuthPage.tsx      # User login
│   │   │   ├── AdminLoginPage.tsx    # Admin login
│   │   │   ├── SignupPage.tsx        # Registration
│   │   │   ├── DashboardPage.tsx     # User dashboard with stats
│   │   │   ├── UploadPage.tsx        # Drag-and-drop paper upload
│   │   │   ├── QuestionsPage.tsx     # Browse & filter question bank
│   │   │   ├── GeneratePage.tsx      # Configure & generate papers
│   │   │   ├── ViewPaperPage.tsx     # Paper view + chat refinement
│   │   │   ├── SettingsPage.tsx      # Profile settings
│   │   │   ├── AdminDashboardPage.tsx
│   │   │   ├── AdminUsersPage.tsx
│   │   │   └── AdminUserDetailPage.tsx
│   │   ├── components/
│   │   │   ├── Navbar.tsx            # Navigation bar
│   │   │   └── ProtectedRoute.tsx    # Auth guard
│   │   ├── context/
│   │   │   ├── AuthContext.tsx       # Auth state & JWT management
│   │   │   └── ThemeContext.tsx      # Dark / light theme toggle
│   │   ├── services/
│   │   │   └── api.ts               # Axios HTTP client
│   │   └── types/
│   │       └── index.ts             # TypeScript interfaces
│   ├── vercel.json              # Vercel deployment & API rewrites
│   └── package.json
│
└── data/
    ├── uploads/                 # Uploaded paper files
    └── exports/                 # Generated PDF / Word exports
```

---

## API Overview

| Group | Endpoints | Description |
|-------|-----------|-------------|
| **Auth** | `POST /api/auth/login`, `/register`, `GET /me`, `PUT /profile` | Authentication & profile |
| **Papers** | `POST /api/papers/upload`, `GET /api/papers`, `DELETE /api/papers/:id` | Upload & manage source papers |
| **Questions** | `GET /api/questions`, `/stats`, `/topics` | Browse extracted question bank |
| **Generation** | `POST /api/generate`, `GET /api/generate/:id`, `POST /:id/chat` | Generate papers & chat refinement |
| **Export** | `GET /api/export/:id/pdf`, `/word`, `/answer-key/pdf`, `/answer-key/word` | Download papers & answer keys |
| **Admin** | `GET /api/admin/stats`, `/users`, `POST /users`, `PUT /users/:id` | Admin dashboard & user management |

Full API docs available at `/docs` (Swagger UI) when running the backend locally.

---

## Deployment

### Frontend (Vercel)
The frontend is deployed on [Vercel](https://vercel.com). API requests are rewritten to the Render backend via `vercel.json`.

### Backend (Render)
The backend runs on [Render](https://render.com) with a Neon PostgreSQL database.

### Environment Variables (Production)

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | JWT signing secret |
| `GEMINI_API_KEY` | Google Gemini API key |
| `GEMINI_MODEL` | Gemini model name (e.g. `gemini-2.5-flash`) |
| `DATABASE_URL` | PostgreSQL connection string (Neon) |

---

## Supported File Formats

| Format | Upload | Export |
|--------|--------|--------|
| PDF | Yes | Yes |
| Word (DOCX) | Yes | Yes |
| Images (PNG, JPG) | Yes (OCR via Tesseract) | — |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "Add your feature"`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## License

This project is open source. See the repository for license details.
