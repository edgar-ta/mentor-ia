import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiArrowRight,
  FiCheck,
  FiClock,
  FiPlayCircle,
  FiShoppingBag,
  FiTarget,
  FiTrendingUp
} from 'react-icons/fi';

const heroModes = [
  {
    id: 'definir',
    label: 'Bajar grasa',
    title: 'Planes personalizados para verte, comer y progresar mejor.',
    description:
      'MentorIA une entrenamiento, nutricion, recetas y seguimiento en una portada clara, elegante y util desde el primer clic.',
    stat: '2,105 / 2,000 kcal',
    substat: 'Plan semanal ajustado a tu objetivo'
  },
  {
    id: 'ganar',
    label: 'Ganar musculo',
    title: 'Sube masa muscular con menus visuales, estructura y control real.',
    description:
      'Cambia el objetivo y la experiencia responde con calorias, recetas y compras listas para ejecutar sin perder claridad.',
    stat: '3,020 / 3,100 kcal',
    substat: 'Volumen magro con proteina alta'
  },
  {
    id: 'habitos',
    label: 'Comer mejor',
    title: 'Convierte tus habitos en una rutina facil de seguir y revisar.',
    description:
      'Todo mantiene contraste alto, componentes limpios y llamadas claras para que la portada se vea premium y siga siendo usable.',
    stat: '87% adherencia',
    substat: 'Checklist, recetas y lista automatizada'
  }
];

const planDays = [
  { day: 'L', value: 3, active: true },
  { day: 'M', value: 4 },
  { day: 'M', value: 5 },
  { day: 'J', value: 6 },
  { day: 'V', value: 7 },
  { day: 'S', value: 8 },
  { day: 'D', value: 9 }
];

const meals = [
  { title: 'Sandwich doble de huevos', meta: '483 kcal | 27P | 59C | 15G' },
  { title: 'Wrap de pollo parrillero', meta: '284 kcal | 27P | 21C | 10G' },
  { title: 'Yogurt con fruta y granola', meta: '210 kcal | 14P | 28C | 6G' }
];

const shoppingItems = [
  { icon: '🥚', name: 'Huevo', qty: '6 und · 330 g' },
  { icon: '🥩', name: 'Carne', qty: '225 g' },
  { icon: '🥝', name: 'Kiwi', qty: '4 und · 300 g' },
  { icon: '🍊', name: 'Naranja', qty: '3 und · 390 g' },
  { icon: '🍌', name: 'Platano', qty: '7 und · 900 g' }
];

const featureCards = [
  {
    icon: <FiTarget />,
    title: 'Objetivos que si aterrizan',
    text: 'Desde el home se entiende si la persona quiere definir, subir o mantener y el contenido cambia en consecuencia.'
  },
  {
    icon: <FiTrendingUp />,
    title: 'Seguimiento visible',
    text: 'Macros, adherencia y progreso aparecen como componentes reales, no como texto decorativo sin utilidad.'
  },
  {
    icon: <FiShoppingBag />,
    title: 'Compra automatizada',
    text: 'Las recetas se convierten en lista del super para que la experiencia se sienta completa y accionable.'
  }
];

const resourceCards = [
  {
    title: 'Planes semanales',
    text: 'Combina sesiones, porciones y snacks listos para ejecutar desde el primer dia.',
    action: 'Explorar planes',
    to: '/registro'
  },
  {
    title: 'Recetas inteligentes',
    text: 'Descubre platos por calorias, macros y momento del dia con una presentacion visual fuerte.',
    action: 'Ver recetas',
    to: '/registro'
  },
  {
    title: 'Acceso coach',
    text: 'Conecta progreso del alumno, metas y control nutricional en una sola vista.',
    action: 'Iniciar sesion',
    to: '/login'
  }
];

const LandingPage = () => {
  const [activeMode, setActiveMode] = useState(heroModes[0].id);
  const [acceptedCookies, setAcceptedCookies] = useState(false);

  const mode = useMemo(
    () => heroModes.find((item) => item.id === activeMode) || heroModes[0],
    [activeMode]
  );

  return (
    <div className="landing fitia-landing">
      <div className="fitia-shell">
        <header className="fitia-nav">
          <Link className="fitia-brand" to="/">
            <span className="fitia-brand-mark" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span className="fitia-brand-text">MentorIA</span>
          </Link>

          <nav className="fitia-links">
            <a href="#soluciones">Soluciones</a>
            <a href="#funciones">Funciones</a>
            <a href="#recursos">Recursos</a>
          </nav>

          <div className="fitia-nav-actions">
            <Link className="fitia-btn fitia-btn-soft" to="/login">Inicia sesion</Link>
            <Link className="fitia-btn fitia-btn-accent" to="/registro">
              Descargar
            </Link>
          </div>
        </header>

        <section className="fitia-hero" id="soluciones">
          <div className="fitia-copy">
            <div className="fitia-mode-switch" role="tablist" aria-label="Objetivos">
              {heroModes.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`fitia-chip ${item.id === mode.id ? 'active' : ''}`}
                  onClick={() => setActiveMode(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <p className="fitia-eyebrow">Nutricion + entrenamiento + coaches</p>
            <h1>{mode.title}</h1>
            <p className="fitia-lead">{mode.description}</p>

            <div className="fitia-hero-actions">
              <Link className="fitia-btn fitia-btn-accent fitia-btn-large" to="/registro">
                Crear mi plan
                <FiArrowRight />
              </Link>
              <a className="fitia-btn fitia-btn-soft fitia-btn-large" href="#funciones">
                <FiPlayCircle />
                Ver demo
              </a>
            </div>

            <div className="fitia-highlight-card">
              <div>
                <span className="fitia-label">Hoy</span>
                <strong>{mode.stat}</strong>
              </div>
              <p>{mode.substat}</p>
            </div>
          </div>

          <div className="fitia-showcase">
            <article className="fitia-showcase-card lime">
              <div className="fitia-card-copy">
                <h2>Tu plan semanal</h2>
                <p>Disenado para perder grasa o ganar musculo con decisiones claras.</p>
              </div>
              <div className="iphone-frame">
                <div className="iphone-notch" />
                <div className="iphone-screen">
                  <div className="phone-calendar">
                    <div className="phone-calendar-head">
                      {planDays.map((item) => (
                        <div key={`${item.day}-${item.value}`} className="phone-day">
                          <span>{item.day}</span>
                          <strong>{item.value}</strong>
                          <i className={item.active ? 'active' : ''} />
                        </div>
                      ))}
                    </div>
                    <div className="phone-progress-head">
                      <span>Calorias planeadas</span>
                      <strong>{mode.stat}</strong>
                    </div>
                    <div className="phone-progress-bar">
                      <span />
                    </div>
                  </div>

                  <div className="phone-meals">
                    <div className="phone-section-title">Breakfast</div>
                    {meals.map((item) => (
                      <div className="phone-meal-row" key={item.title}>
                        <div className="phone-meal-avatar" />
                        <div>
                          <strong>{item.title}</strong>
                          <span>{item.meta}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </article>

            <article className="fitia-showcase-card aqua featured">
              <div className="fitia-card-copy">
                <h2>Recetas inteligentes</h2>
                <p>Miles de recetas para cumplir tus macros con una experiencia mas visual.</p>
              </div>
              <div className="iphone-frame">
                <div className="iphone-notch" />
                <div className="iphone-screen recipe-screen">
                  <div className="recipe-bowl">
                    <div className="recipe-plate">
                      <div className="recipe-food" />
                    </div>
                    <div className="recipe-time">
                      <FiClock />
                      <span>15 min</span>
                    </div>
                  </div>
                  <div className="recipe-meta">
                    <strong>Ensalada de pollo, palta y col</strong>
                    <span>511 kcal | 45P | 21C | 29G</span>
                  </div>
                  <button type="button" className="recipe-action">
                    Agregar a almuerzo
                  </button>
                </div>
              </div>
            </article>

            <article className="fitia-showcase-card lavender">
              <div className="fitia-card-copy">
                <h2>Listas de compras</h2>
                <p>Tu plan convertido en una lista del super clara y lista para tachar.</p>
              </div>
              <div className="iphone-frame">
                <div className="iphone-notch" />
                <div className="iphone-screen shopping-screen">
                  <div className="shopping-dates">
                    <div className="shopping-date">
                      <span>Fecha inicial</span>
                      <strong>Lun, 6 Ene.</strong>
                    </div>
                    <div className="shopping-date">
                      <span>Fecha final</span>
                      <strong>Mar, 14 Ene.</strong>
                    </div>
                  </div>
                  <div className="shopping-group-title">Carnes, aves y pescados</div>
                  {shoppingItems.map((item) => (
                    <div className="shopping-item" key={item.name}>
                      <div className="shopping-item-main">
                        <span className="shopping-icon" aria-hidden="true">{item.icon}</span>
                        <span>{item.name}</span>
                      </div>
                      <div className="shopping-item-side">
                        <span>{item.qty}</span>
                        <i />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          </div>
        </section>

        <section className="fitia-stats-band" id="funciones">
          <div className="fitia-stat">
            <span>Planes activos</span>
            <strong>120+</strong>
          </div>
          <div className="fitia-stat">
            <span>Recetas visuales</span>
            <strong>3,000+</strong>
          </div>
          <div className="fitia-stat">
            <span>Objetivos guiados</span>
            <strong>3 modos</strong>
          </div>
          <div className="fitia-stat">
            <span>Roles integrados</span>
            <strong>Usuario · Coach · Admin</strong>
          </div>
        </section>

        <section className="fitia-feature-layout">
          <div className="fitia-feature-intro">
            <p className="fitia-eyebrow">Experiencia funcional</p>
            <h2>Se siente como producto real desde la portada.</h2>
            <p>
              La pagina ya no solo vende la idea: muestra plan semanal, receta accionable, lista de compras,
              objetivos y accesos reales a registro e inicio de sesion.
            </p>
          </div>

          <div className="fitia-feature-grid">
            {featureCards.map((card) => (
              <article className="fitia-feature-card" key={card.title}>
                <div className="fitia-feature-icon">{card.icon}</div>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="fitia-resource-section" id="recursos">
          <div className="fitia-resource-copy">
            <p className="fitia-eyebrow">Recursos</p>
            <h2>Una portada limpia, clara y con contraste en cada bloque.</h2>
            <p>
              Se mantuvo la paleta crema, amarillo, verde suave, aqua y lavanda. Ningun texto claro cae sobre
              fondos claros sin soporte de contraste.
            </p>
          </div>

          <div className="fitia-resource-grid">
            {resourceCards.map((card) => (
              <article className="fitia-resource-card" key={card.title}>
                <h3>{card.title}</h3>
                <p>{card.text}</p>
                <Link to={card.to}>
                  {card.action}
                  <FiArrowRight />
                </Link>
              </article>
            ))}
          </div>
        </section>
      </div>

      {!acceptedCookies ? (
        <div className="fitia-cookie-banner" role="dialog" aria-live="polite">
          <p>
            Utilizamos cookies para mejorar la experiencia, analizar el trafico y personalizar el contenido
            sin comprometer la legibilidad de la interfaz.
          </p>
          <div className="fitia-cookie-actions">
            <button type="button" className="fitia-btn fitia-btn-accent" onClick={() => setAcceptedCookies(true)}>
              Aceptar
            </button>
            <button type="button" className="fitia-btn fitia-btn-ghost" onClick={() => setAcceptedCookies(true)}>
              Denegar
            </button>
          </div>
        </div>
      ) : null}

      <div className="fitia-floating-proof">
        <FiCheck />
        <span>Diseño responsive con mockups iPhone 14 Pro</span>
      </div>
    </div>
  );
};

export default LandingPage;
