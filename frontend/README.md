# ExamForge — Frontend

React + TypeScript frontend for ExamForge, the AI-powered question paper generator.

**Live App:** [https://exam-forge-gray.vercel.app](https://exam-forge-gray.vercel.app)

## Tech Stack

- **React 19** with TypeScript
- **Vite** for build tooling and HMR
- **React Router DOM** for client-side routing
- **Axios** for HTTP requests
- **Recharts** for dashboard charts
- **Lucide React** for icons
- **React Markdown** for rendering AI-generated content
- CSS custom properties for theming (dark / light mode with View Transitions API)

## Getting Started

```bash
# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

## Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | User home with paper stats and charts |
| `/login` | Landing Page | Public landing with scroll-reveal sections |
| `/login/user` | User Auth | Login form |
| `/login/admin` | Admin Login | Admin login form |
| `/signup` | Sign Up | New user registration |
| `/upload` | Upload | Drag-and-drop paper upload |
| `/questions` | Questions | Browse and filter extracted question bank |
| `/generate` | Generate | Configure and create new papers |
| `/paper/:id` | View Paper | Paper view with chat refinement sidebar |
| `/settings` | Settings | Profile and password management |
| `/admin` | Admin Dashboard | Platform stats and charts |
| `/admin/users` | Admin Users | User management list |
| `/admin/users/:id` | User Detail | Per-user stats and history |

## Deployment

Deployed on Vercel. API requests are proxied to the backend via rewrites in `vercel.json`.
