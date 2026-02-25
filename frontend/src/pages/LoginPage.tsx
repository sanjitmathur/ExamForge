import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Clock, Sparkles, Target,
  FileUp, BrainCircuit, Zap, MessageSquareText, Globe, BarChart3,
  Upload, Database, Rocket,
  Sun, Moon,
} from 'lucide-react';

/* ── Intersection Observer hook for scroll-reveal (replays on every enter) ── */
function useReveal() {
  const ref = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('lp-visible');
          } else {
            e.target.classList.remove('lp-visible');
          }
        });
      },
      { threshold: 0.12 }
    );

    const els = ref.current;
    els.forEach((el) => el && observer.observe(el));
    return () => els.forEach((el) => el && observer.unobserve(el));
  }, []);

  return (i: number) => (el: HTMLDivElement | null) => {
    if (el) ref.current[i] = el;
  };
}

/* ── Data ── */
const ICON_PROPS = { size: 20, strokeWidth: 1.8 } as const;
const STEP_ICON_PROPS = { size: 22, strokeWidth: 1.6 } as const;

const ABOUT_CARDS: { icon: ReactNode; title: string; text: string }[] = [
  {
    icon: <Clock {...ICON_PROPS} />,
    title: 'The Problem',
    text: 'Teachers spend countless hours manually creating question papers, searching through past exams, and ensuring curriculum alignment.',
  },
  {
    icon: <Sparkles {...ICON_PROPS} />,
    title: 'Our Solution',
    text: 'AI-powered extraction turns past papers into a structured question bank. Generate perfectly balanced exams in minutes, not hours.',
  },
  {
    icon: <Target {...ICON_PROPS} />,
    title: 'The Vision',
    text: 'Better assessments for every student. Empowering educators with intelligent tools so they can focus on what matters — teaching.',
  },
];

const FEATURES: { icon: ReactNode; title: string; text: string }[] = [
  { icon: <FileUp {...ICON_PROPS} />, title: 'Smart Paper Upload', text: 'Upload past papers in PDF format and let our system process them instantly.' },
  { icon: <BrainCircuit {...ICON_PROPS} />, title: 'AI Question Extraction', text: 'Advanced AI identifies, categorizes, and extracts every question with metadata.' },
  { icon: <Zap {...ICON_PROPS} />, title: 'Instant Paper Generation', text: 'Build new question papers in seconds with customizable difficulty and topics.' },
  { icon: <MessageSquareText {...ICON_PROPS} />, title: 'AI Chat Refinement', text: 'Refine generated papers through conversational AI — just describe what you want.' },
  { icon: <Globe {...ICON_PROPS} />, title: 'Multi-Board Support', text: 'Support for CBSE, ICSE, State Boards, and custom curricula out of the box.' },
  { icon: <BarChart3 {...ICON_PROPS} />, title: 'Question Bank Analytics', text: 'Insights into topic coverage, difficulty distribution, and bloom\'s taxonomy.' },
];

const STEPS: { icon: ReactNode; num: string; title: string; text: string }[] = [
  { icon: <Upload {...STEP_ICON_PROPS} />, num: '1', title: 'Upload Past Papers', text: 'Upload PDFs of previous exam papers' },
  { icon: <BrainCircuit {...STEP_ICON_PROPS} />, num: '2', title: 'AI Extracts Questions', text: 'AI parses and categorizes every question' },
  { icon: <Database {...STEP_ICON_PROPS} />, num: '3', title: 'Build Question Bank', text: 'Review, tag, and organize your bank' },
  { icon: <Rocket {...STEP_ICON_PROPS} />, num: '4', title: 'Generate New Papers', text: 'Create balanced papers in one click' },
];

export default function LoginPage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const reveal = useReveal();
  const [navScrolled, setNavScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 30);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/'} replace />;

  const scrollToSection = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="lp-page">
      {/* ── Sticky Navbar ── */}
      <nav className={`lp-nav${navScrolled ? ' lp-nav-scrolled' : ''}`}>
        <div className="lp-nav-inner">
          <span className="lp-nav-brand">ExamForge</span>
          <div className="lp-nav-links">
            <button type="button" onClick={() => scrollToSection('lp-about')}>About</button>
            <button type="button" onClick={() => scrollToSection('lp-features')}>Features</button>
            <button type="button" onClick={() => scrollToSection('lp-how')}>How It Works</button>
          </div>
          <div className="lp-nav-actions">
            <Link to="/login/admin" className="lp-nav-btn-outline">Admin</Link>
            <Link to="/login/user" className="lp-nav-btn-outline">Log In</Link>
            <Link to="/signup" className="lp-nav-signup">Sign Up</Link>
            <button
              className="lp-nav-theme"
              onClick={toggleTheme}
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon size={16} strokeWidth={2} /> : <Sun size={16} strokeWidth={2} />}
            </button>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="lp-hero">
        <div className="lp-hero-bg">
          <div className="lp-hero-orb" />
          <div className="lp-hero-orb" />
          <div className="lp-hero-orb" />
        </div>

        <div className="lp-hero-content">
          <div className="lp-hero-badge">
            <span className="lp-hero-badge-dot" />
            AI-Powered Exam Platform
          </div>

          <h1 className="lp-hero-title">
            Craft Perfect Exams{' '}
            <span className="lp-hero-title-gradient">in Minutes, Not Hours</span>
          </h1>

          <p className="lp-hero-subtitle">
            ExamForge uses artificial intelligence to extract questions from past papers,
            build intelligent question banks, and generate perfectly balanced exams instantly.
          </p>

          <div className="lp-hero-ctas">
            <Link to="/signup" className="lp-btn-primary">
              Get Started Free &rarr;
            </Link>
            <button
              type="button"
              className="lp-btn-secondary"
              onClick={() => scrollToSection('lp-about')}
            >
              Learn More
            </button>
          </div>

          <div className="lp-hero-stats">
            <div className="lp-hero-stat">
              <div className="lp-hero-stat-value">10x</div>
              <div className="lp-hero-stat-label">Faster</div>
            </div>
            <div className="lp-hero-stat">
              <div className="lp-hero-stat-value">AI</div>
              <div className="lp-hero-stat-label">Extraction</div>
            </div>
            <div className="lp-hero-stat">
              <div className="lp-hero-stat-value">100%</div>
              <div className="lp-hero-stat-label">Curriculum Aligned</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section className="lp-section lp-about" id="lp-about">
        <div className="lp-section-inner lp-reveal" ref={reveal(0)}>
          <span className="lp-section-tag">About ExamForge</span>
          <h2 className="lp-section-title">Why ExamForge?</h2>
          <p className="lp-section-subtitle">
            We're solving one of education's most time-consuming challenges — exam creation.
          </p>
          <div className="lp-about-grid">
            {ABOUT_CARDS.map((c) => (
              <div className="lp-glass-card lp-reveal-child" key={c.title}>
                <div className="lp-glass-card-icon">{c.icon}</div>
                <h3>{c.title}</h3>
                <p>{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="lp-section lp-features" id="lp-features">
        <div className="lp-section-inner lp-reveal" ref={reveal(1)}>
          <span className="lp-section-tag">Features</span>
          <h2 className="lp-section-title">Everything You Need</h2>
          <p className="lp-section-subtitle">
            Powerful tools designed to streamline every step of exam creation.
          </p>
          <div className="lp-features-grid">
            {FEATURES.map((f) => (
              <div className="lp-feature-card lp-reveal-child" key={f.title}>
                <div className="lp-feature-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="lp-section lp-how" id="lp-how">
        <div className="lp-section-inner lp-reveal" ref={reveal(2)}>
          <div style={{ textAlign: 'center' }}>
            <span className="lp-section-tag">How It Works</span>
            <h2 className="lp-section-title" style={{ textAlign: 'center' }}>
              Simple 4-Step Process
            </h2>
            <p className="lp-section-subtitle" style={{ margin: '0 auto' }}>
              From past papers to new exams in minutes.
            </p>
          </div>
          <div className="lp-how-steps">
            {STEPS.map((s) => (
              <div className="lp-step lp-reveal-child" key={s.num}>
                <div className="lp-step-num">{s.num}</div>
                <div className="lp-step-icon">{s.icon}</div>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <div className="lp-footer-brand">ExamForge</div>
        <div className="lp-footer-tagline">AI-Powered Question Paper Generator</div>
      </footer>
    </div>
  );
}
