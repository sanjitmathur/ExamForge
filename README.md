# ExamForge

AI-powered question paper generator for teachers and educational institutions.

## Features

- **Upload Papers**: Upload existing question papers (PDF, DOCX, images) for AI extraction
- **Question Bank**: Automatically extract and categorize questions by type, difficulty, topic, and Bloom's taxonomy level
- **Paper Generation**: Generate new question papers with AI based on your question bank
- **Chat Refinement**: Refine generated papers through a conversational interface
- **Export**: Download papers and answer keys as PDF or Word documents
- **Admin Panel**: Manage users, view platform stats, reset passwords
- **Dark/Light Mode**: Full theme support across the entire app

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Backend**: FastAPI, SQLAlchemy (async), SQLite
- **AI**: Anthropic Claude API for question extraction and paper generation

## Getting Started

### Prerequisites

- Python 3.12+
- Node.js 18+
- Anthropic API key

### Setup

1. Clone the repo:
   ```bash
   git clone https://github.com/sanjitmathur/ExamForge.git
   cd ExamForge
   ```

2. Create a `.env` file in the project root:
   ```
   ANTHROPIC_API_KEY=your-api-key-here
   ```

3. Set up the backend:
   ```bash
   python -m venv venv
   source venv/Scripts/activate  # Windows
   # source venv/bin/activate    # macOS/Linux
   pip install -r backend/requirements.txt
   ```

4. Set up the frontend:
   ```bash
   cd frontend
   npm install
   ```

### Running

Start both servers:

```bash
# Terminal 1 - Backend
cd backend
uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Open http://localhost:5173 in your browser.

## Project Structure

```
ExamForge/
├── backend/
│   └── app/
│       ├── main.py           # FastAPI app entry point
│       ├── models.py         # SQLAlchemy models
│       ├── schemas.py        # Pydantic schemas
│       ├── database.py       # DB engine and session
│       ├── config.py         # Settings
│       ├── routers/          # API route handlers
│       └── utils/            # Auth, dependencies
├── frontend/
│   └── src/
│       ├── pages/            # Page components
│       ├── components/       # Shared components
│       ├── context/          # React contexts (Auth, Theme)
│       ├── services/         # API client
│       └── types/            # TypeScript types
└── data/
    ├── uploads/              # Uploaded paper files
    └── exports/              # Generated exports
```
