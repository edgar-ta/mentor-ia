import { useEffect, useMemo, useRef, useState } from 'react';
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { FiArrowUpRight, FiChevronLeft, FiChevronRight, FiPlay, FiTrendingUp } from 'react-icons/fi';

const colors = ['#7cc6ff', '#4da3ff', '#d0e7ff'];

const RevealSection = ({ className = '', children, delay = 0 }) => (
  <section className={`reveal panel ${className}`} style={{ transitionDelay: `${delay}ms` }}>
    {children}
  </section>
);

const Dashboard = ({ metrics }) => {
  const {
    kpis = [],
    pipeline = [],
    sessions = [],
    campaigns = [],
    goals = [],
    reminders = [],
    mood = []
  } = metrics || {};
  const [activeSlide, setActiveSlide] = useState(0);
  const [hoveredSlide, setHoveredSlide] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [heroTilt, setHeroTilt] = useState({ x: 0, y: 0 });
  const heroCardRef = useRef(null);

  const highlightStats = useMemo(
    () => [
      { label: 'Planes premium', value: '12', note: 'Alta retencion semanal' },
      { label: 'Rutinas activas', value: '48', note: 'Actualizadas por IA coach' },
      { label: 'Progreso medio', value: '87%', note: 'Sobre metas del mes' }
    ],
    []
  );

  useEffect(() => {
    if (!campaigns.length || hoveredSlide) return;
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % campaigns.length);
    }, 5200);
    return () => clearInterval(timer);
  }, [campaigns.length, hoveredSlide]);

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 320);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.18 }
    );

    const revealNodes = document.querySelectorAll('.reveal');
    revealNodes.forEach((node) => observer.observe(node));
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    return () => {
      revealNodes.forEach((node) => observer.unobserve(node));
      observer.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  const moveHero = (event) => {
    const rect = heroCardRef.current?.getBoundingClientRect();
    if (!rect) return;

    const relativeX = (event.clientX - rect.left) / rect.width;
    const relativeY = (event.clientY - rect.top) / rect.height;
    setHeroTilt({
      x: (relativeY - 0.5) * 8,
      y: (relativeX - 0.5) * -10
    });
  };

  const resetHero = () => {
    setHeroTilt({ x: 0, y: 0 });
  };

  const goPrev = () => {
    setActiveSlide((prev) => (prev === 0 ? campaigns.length - 1 : prev - 1));
  };

  const goNext = () => {
    setActiveSlide((prev) => (prev + 1) % campaigns.length);
  };

  return (
    <div className="dashboard-grid premium-grid">
      <RevealSection className="hero hero-shell span-2" delay={20}>
        <div className="hero-copy">
          <p className="eyebrow">Mentoría asistida por IA</p>
          <h1>Entrenamientos personalizados con presencia visual, ritmo y control profesional.</h1>
          <p className="muted">
            MentorIA mezcla diseño editorial, seguimiento inteligente y experiencias premium para que
            cada cliente sienta que su programa fue construido a medida.
          </p>
          <div className="hero-actions">
            <button className="primary">Programar sesion</button>
            <button className="ghost">Ver colecciones</button>
          </div>
          <div className="hero-ribbon">
            <FiTrendingUp />
            <span>Scroll inteligente, animaciones y sesiones protegidas en un mismo panel.</span>
          </div>
          <div className="hero-stats">
            {kpis.slice(0, 3).map((item) => (
              <div key={item.label} className="stat-card">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <small className={item.trend > 0 ? 'trend up' : 'trend down'}>
                  {item.trend > 0 ? '▲' : '▼'} {Math.abs(item.trend)}%
                </small>
              </div>
            ))}
          </div>
          <div className="hero-mini-grid">
            {highlightStats.map((item) => (
              <article key={item.label} className="mini-metric">
                <p>{item.label}</p>
                <strong>{item.value}</strong>
                <span>{item.note}</span>
              </article>
            ))}
          </div>
        </div>
        <div
          className="hero-stage"
          onMouseMove={moveHero}
          onMouseLeave={resetHero}
        >
          <div
            ref={heroCardRef}
            className="hero-image-card"
            style={{ transform: `perspective(1400px) rotateX(${heroTilt.x}deg) rotateY(${heroTilt.y}deg)` }}
          >
            <div className="badge">AI Coach</div>
            <div className="hero-glow" />
            <img src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80" alt="Coach" />
            <div className="floating-note top-note">
              <span>Sesiones 1:1</span>
              <strong>Premium</strong>
            </div>
            <div className="floating-note bottom-note">
              <span>Scroll reveal</span>
              <strong>Activo</strong>
            </div>
          </div>
        </div>
      </RevealSection>

      <RevealSection className="kpi-grid premium-kpis" delay={80}>
        {kpis.map((item) => (
          <div key={item.label} className="kpi-card">
            <div className="kpi-top">
              <p className="muted">{item.label}</p>
              <span className={item.trend > 0 ? 'pill pill-up' : 'pill pill-down'}>
                {item.trend > 0 ? '+' : '-'}{Math.abs(item.trend)}%
              </span>
            </div>
            <h3>{item.value}</h3>
            <div className="kpi-bar">
              <span style={{ width: `${Math.min(100, Math.abs(item.trend) * 2)}%` }} />
            </div>
          </div>
        ))}
      </RevealSection>

      <RevealSection className="carousel cinematic-carousel" delay={120}>
        <div className="carousel-header">
          <div>
            <p className="eyebrow">Campañas activas</p>
            <h3>Experiencias curadas con transiciones cinematograficas</h3>
          </div>
          <div className="carousel-controls">
            <button className="ghost icon-btn" onClick={goPrev} aria-label="Anterior">
              <FiChevronLeft />
            </button>
            <button className="ghost icon-btn" onClick={goNext} aria-label="Siguiente">
              <FiChevronRight />
            </button>
          </div>
        </div>
        <div
          className="slides"
          onMouseEnter={() => setHoveredSlide(true)}
          onMouseLeave={() => setHoveredSlide(false)}
        >
          <div className="slides-track" style={{ transform: `translateX(-${activeSlide * 100}%)` }}>
            {campaigns.map((c) => (
              <article key={c.title} className="slide slide-wide">
                <img src={c.image} alt={c.title} />
                <div className="slide-overlay">
                  <span className="pill pill-glow">{c.tag}</span>
                  <h4>{c.title}</h4>
                  <p>Rutinas premium, mentorias visuales y automatizacion elegante para cada cliente.</p>
                  <div className="slide-actions">
                    <button className="primary ghosty">{c.cta}</button>
                    <button className="ghost glass-btn">
                      <FiPlay />
                      Ver teaser
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <div className="dots">
            {campaigns.map((_, idx) => (
              <button
                key={idx}
                className={idx === activeSlide ? 'dot active' : 'dot'}
                onClick={() => setActiveSlide(idx)}
              />
            ))}
          </div>
        </div>
      </RevealSection>

      <RevealSection delay={160}>
        <div className="panel-header">
          <div>
            <p className="eyebrow">Engagement</p>
            <h3>Pulso por cliente</h3>
          </div>
          <span className="muted">Últimos 14 días</span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={pipeline} margin={{ left: -20 }}>
            <Line type="monotone" dataKey="engagement" stroke="#7cc6ff" strokeWidth={3} dot={false} />
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#9ca3af' }} />
            <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} />
            <Tooltip />
          </LineChart>
        </ResponsiveContainer>
      </RevealSection>

      <RevealSection delay={180}>
        <p className="eyebrow">Objetivos</p>
        <h3>Estado general</h3>
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={goals} dataKey="value" nameKey="label" outerRadius={90} innerRadius={50} paddingAngle={4}>
              {goals.map((_, index) => (
                <Cell key={index} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </RevealSection>

      <RevealSection delay={210}>
        <p className="eyebrow">Clima</p>
        <h3>Estado emocional reportado</h3>
        <div className="mood-grid">
          {mood.map((m) => (
            <div key={m.label}>
              <div className="mood-top">
                <span>{m.label}</span>
                <span className="muted">{m.value}%</span>
              </div>
              <div className="kpi-bar">
                <span style={{ width: `${m.value}%` }} />
              </div>
            </div>
          ))}
        </div>
      </RevealSection>

      <RevealSection className="reminders" delay={240}>
        <div className="panel-header">
          <div>
            <p className="eyebrow">Acciones rapidas</p>
            <h3>Recordatorios IA</h3>
          </div>
          <button className="ghost small">Ver n8n</button>
        </div>
        <ul className="list">
          {reminders.map((r, idx) => (
            <li key={idx}>
              <div>
                <strong>{r.title}</strong>
                <p className="muted">Generado por IA</p>
              </div>
              <span className="muted">{r.time}</span>
            </li>
          ))}
        </ul>
      </RevealSection>

      <RevealSection className="span-2" delay={260}>
        <div className="panel-header">
          <div>
            <p className="eyebrow">Agenda</p>
            <h3>Próximas sesiones</h3>
          </div>
          <button className="primary">Nueva sesión</button>
        </div>
        <div className="session-grid">
          {sessions.map((s) => (
            <article key={s.id} className="session-card">
              <div>
                <p className="muted">{s.date} · {s.time}</p>
                <h4>{s.client}</h4>
                <p className="muted">{s.topic}</p>
              </div>
              <button className="ghost small session-link">
                Ver detalle
                <FiArrowUpRight />
              </button>
            </article>
          ))}
        </div>
      </RevealSection>

      <button
        type="button"
        className={`scroll-top ${showScrollTop ? 'visible' : ''}`}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      >
        Subir
      </button>
    </div>
  );
};

export default Dashboard;
