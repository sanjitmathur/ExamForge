# ExamForge - Claude Session Memory

## Project Overview
ExamForge is an AI-powered question paper generator built with:
- **Backend**: FastAPI + SQLAlchemy (async) + SQLite (aiosqlite), runs on port 8000
- **Frontend**: React 19 + Vite + TypeScript, runs on port 5173/5174
- **Database**: SQLite at `backend/examforge.db`
- **Virtual env**: `venv/` in project root, activate with `source venv/Scripts/activate`

## How to Run
- Backend: `cd backend && uvicorn app.main:app --reload --port 8000`
- Frontend: `cd frontend && npm run dev`
- Both use `start.bat` for quick launch

## Users in Database
- **Admin**: username `sanjit`, email `sanjitmathur08@gmail.com`, role `admin`
- **User**: username `bhawna`, email `bhawna@hotmail.com`, role `user`

## What Has Been Done (Session History)

### 1. Dark/Light Mode Toggle on Login Page
- Added a floating theme toggle button (sun/moon) to the top-right corner of the login page (`LoginPage.tsx`) where admin/user role is selected
- Uses `ThemeContext` for state, persists to localStorage
- CSS class: `.theme-toggle-floating` in `App.css`

### 2. Navbar Branding - ExamForgeUser / ExamForgeAdmin
- Updated `Navbar.tsx` to show "ExamForgeAdmin" for admin and "ExamForgeUser" for regular users
- Added `.navbar-user-suffix` CSS class matching the admin suffix style

### 3. Fixed Admin User Detail Page (Manage Button)
- **Problem**: Clicking "Manage" on admin user management page showed "Failed to load user details"
- **Root cause**: FastAPI route conflict - `/users/{user_id}/detail` was being swallowed by `/users/{user_id}` (PUT route). The `{user_id}` parameter greedily matched "detail" as a string.
- **Fix**: Changed route from `/users/{user_id}/detail` to `/user-detail/{user_id}` in both:
  - `backend/app/routers/admin.py` (route definition)
  - `frontend/src/services/api.ts` (API call)

### 4. Password Visibility for Admin
- Added SVG eye icon toggle (open eye / slashed eye) to password display in `AdminUserDetailPage.tsx`
- CSS class: `.password-eye-btn` in `App.css`
- **plain_password issue**: Existing users created before the `plain_password` column had null values
- **Fix**: Updated `auth.py` login handler to capture and store `plain_password` on successful login if not already stored
- When password is null, shows: "Set a new password below to view it here"

### 5. Back-to-Users Button Styling (Dark/Light Mode)
- Fixed `.back-link` CSS - added `background: none; border: none; cursor: pointer` since it's a `<button>` not `<a>`
- Added dark mode styles: `[data-theme="dark"] .back-link` color rules

## Key Architecture Notes
- Vite proxy: `/api` -> `http://localhost:8000` (configured in `vite.config.ts`)
- Auth: JWT tokens stored in localStorage, interceptor in `api.ts` adds Bearer header
- Theme: `ThemeContext.tsx` sets `data-theme` attribute on `<html>`, CSS variables in `index.css` handle theming
- Admin routes: All under `/api/admin` prefix in `backend/app/routers/admin.py`
- FastAPI route ordering matters: avoid putting parameterized paths like `{user_id}` that can conflict with literal sub-paths

## Known Issues / Notes
- Hot reload on Windows (WatchFiles) can sometimes get stuck - may need full server restart
- Two `examforge.db` files can exist (root and backend/) - the active one is `backend/examforge.db` since the server runs from the `backend/` directory
- The empty `examforge.db` at project root can be ignored/deleted
