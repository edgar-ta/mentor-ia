import { useEffect, useState } from 'react';
import { FiPlayCircle, FiX } from 'react-icons/fi';
import { useSearchParams } from 'react-router-dom';
import api from '../lib/api';

const DEFAULT_LIMIT = 10;

const sortOptions = [
  { value: 'relevance', label: 'Relevancia' },
  { value: 'newest', label: 'Mas recientes' },
  { value: 'price_asc', label: 'Precio: menor a mayor' },
  { value: 'price_desc', label: 'Precio: mayor a menor' }
];

const emptyMeta = {
  categories: [],
  tags: [],
  priceRange: { min: 0, max: 0 },
  totalItems: 0
};

function getDefaultFilters() {
  return {
    q: '',
    category: '',
    min: '',
    max: '',
    tags: [],
    sort: 'relevance',
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: DEFAULT_LIMIT
  };
}

function parseFilters(searchParams) {
  return {
    q: searchParams.get('q') || '',
    category: searchParams.get('category') || '',
    min: searchParams.get('min') || '',
    max: searchParams.get('max') || '',
    tags: (searchParams.get('tags') || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
    sort: searchParams.get('sort') || 'relevance',
    dateFrom: searchParams.get('date_from') || '',
    dateTo: searchParams.get('date_to') || '',
    page: Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1),
    limit: Math.max(1, Number.parseInt(searchParams.get('limit') || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT)
  };
}

function buildRequestParams(filters) {
  return {
    q: filters.q || undefined,
    category: filters.category || undefined,
    min: filters.min || undefined,
    max: filters.max || undefined,
    tags: filters.tags.length ? filters.tags.join(',') : undefined,
    sort: filters.sort,
    date_from: filters.dateFrom || undefined,
    date_to: filters.dateTo || undefined,
    page: filters.page,
    limit: filters.limit
  };
}

function buildSearchParams(filters) {
  const nextParams = new URLSearchParams();

  if (filters.q.trim()) nextParams.set('q', filters.q.trim());
  if (filters.category) nextParams.set('category', filters.category);
  if (filters.min) nextParams.set('min', filters.min);
  if (filters.max) nextParams.set('max', filters.max);
  if (filters.tags.length) nextParams.set('tags', filters.tags.join(','));
  if (filters.sort && filters.sort !== 'relevance') nextParams.set('sort', filters.sort);
  if (filters.dateFrom) nextParams.set('date_from', filters.dateFrom);
  if (filters.dateTo) nextParams.set('date_to', filters.dateTo);
  if (filters.page > 1) nextParams.set('page', String(filters.page));
  if (filters.limit !== DEFAULT_LIMIT) nextParams.set('limit', String(filters.limit));

  return nextParams;
}

function formatCategory(category) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(getDefaultFilters());
  const [meta, setMeta] = useState(emptyMeta);
  const [results, setResults] = useState({
    items: [],
    total: 0,
    page: 1,
    limit: DEFAULT_LIMIT,
    totalPages: 1,
    query: { mode: 'simple', q: '' }
  });
  const [loading, setLoading] = useState(true);
  const [metaLoading, setMetaLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedResource, setSelectedResource] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const loadMeta = async () => {
      try {
        const { data } = await api.get('/search/meta');
        setMeta(data);
      } catch (_err) {
        setMeta(emptyMeta);
      } finally {
        setMetaLoading(false);
      }
    };

    loadMeta();
  }, []);

  useEffect(() => {
    const nextFilters = parseFilters(searchParams);
    setFilters(nextFilters);

    const loadResults = async () => {
      setLoading(true);
      setError('');

      try {
        const { data } = await api.get('/search', {
          params: buildRequestParams(nextFilters)
        });
        setResults(data);
      } catch (err) {
        const message = err.response?.data?.message || 'No se pudo completar la busqueda.';
        setError(message);
        setResults({
          items: [],
          total: 0,
          page: 1,
          limit: nextFilters.limit,
          totalPages: 1,
          query: { mode: 'simple', q: nextFilters.q }
        });
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, [searchParams]);

  const activeFilterCount = [
    filters.category,
    filters.min,
    filters.max,
    filters.tags.length ? 'tags' : '',
    filters.dateFrom,
    filters.dateTo,
    filters.sort !== 'relevance' ? filters.sort : ''
  ].filter(Boolean).length;

  const applyFilters = (nextFilters) => {
    setSearchParams(buildSearchParams(nextFilters));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    applyFilters({ ...filters, page: 1 });
  };

  const handleClear = () => {
    const reset = getDefaultFilters();
    setFilters(reset);
    setSearchParams(buildSearchParams(reset));
  };

  const toggleTag = (tag) => {
    const exists = filters.tags.includes(tag);
    const nextTags = exists ? filters.tags.filter((value) => value !== tag) : [...filters.tags, tag];
    setFilters({ ...filters, tags: nextTags });
  };

  const changePage = (nextPage) => {
    if (nextPage < 1 || nextPage > (results.totalPages || 1)) return;
    applyFilters({ ...filters, page: nextPage });
  };

  const openDetail = async (slug) => {
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/search/resource/${slug}`);
      setSelectedResource(data);
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <section className="panel span-2 search-panel">
      <div className="panel-header search-header">
        <div>
          <p className="eyebrow">Practica</p>
          <h2>Buscador con API</h2>
          <p className="muted">
            Catalogo de recursos de mentoria con busqueda simple por texto y busqueda avanzada por
            categoria, precio, fecha y tags.
          </p>
        </div>
        <div className="search-summary">
          <span className="pill pill-glow">{results.total} resultados</span>
          <span className="pill search-mode">
            {results.query?.mode === 'advanced' ? 'Busqueda avanzada' : 'Busqueda simple'}
          </span>
        </div>
      </div>

      <form className="search-shell" onSubmit={handleSubmit}>
        <div className="search-simple">
          <label htmlFor="catalog-search" className="search-label">
            Palabras clave
          </label>
          <div className="search-row">
            <input
              id="catalog-search"
              value={filters.q}
              onChange={(event) => setFilters({ ...filters, q: event.target.value })}
              placeholder="Ej. recetario, perdida de grasa, pecho, desayuno proteico..."
            />
            <button type="submit" className="primary">
              Buscar
            </button>
          </div>
          <p className="muted search-hint">
            Si dejas el texto vacio, el sistema muestra los recursos mas recientes.
          </p>
        </div>

        <div className="advanced-grid">
          <label>
            Categoria
            <select
              value={filters.category}
              onChange={(event) => setFilters({ ...filters, category: event.target.value })}
            >
              <option value="">Todas</option>
              {meta.categories.map((category) => (
                <option key={category} value={category}>
                  {formatCategory(category)}
                </option>
              ))}
            </select>
          </label>

          <label>
            Precio minimo
            <input
              type="number"
              min={meta.priceRange.min}
              max={meta.priceRange.max}
              value={filters.min}
              onChange={(event) => setFilters({ ...filters, min: event.target.value })}
              placeholder={`Desde ${String(meta.priceRange.min || 0)}`}
            />
          </label>

          <label>
            Precio maximo
            <input
              type="number"
              min={meta.priceRange.min}
              max={meta.priceRange.max}
              value={filters.max}
              onChange={(event) => setFilters({ ...filters, max: event.target.value })}
              placeholder={`Hasta ${String(meta.priceRange.max || 0)}`}
            />
          </label>

          <label>
            Desde
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(event) => setFilters({ ...filters, dateFrom: event.target.value })}
            />
          </label>

          <label>
            Hasta
            <input
              type="date"
              value={filters.dateTo}
              onChange={(event) => setFilters({ ...filters, dateTo: event.target.value })}
            />
          </label>

          <label>
            Ordenar por
            <select
              value={filters.sort}
              onChange={(event) => setFilters({ ...filters, sort: event.target.value })}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="tags-block">
          <div className="tags-header">
            <span className="search-label">Tags</span>
            <span className="muted">
              {filters.tags.length ? `${filters.tags.length} seleccionados` : 'Seleccion opcional'}
            </span>
          </div>
          <div className="tag-grid">
            {(metaLoading ? [] : meta.tags).map((tag) => {
              const active = filters.tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  className={`tag-chip ${active ? 'active' : ''}`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        <div className="search-actions">
          <div className="muted">
            {activeFilterCount
              ? `${activeFilterCount} filtros avanzados activos`
              : `Catalogo base de ${meta.totalItems || 0} recursos`}
          </div>
          <div className="search-buttons">
            <button type="button" className="ghost" onClick={handleClear}>
              Limpiar filtros
            </button>
            <button type="submit" className="primary">
              Aplicar busqueda
            </button>
          </div>
        </div>
      </form>

      <div className="search-feedback">
        {loading && <div className="info">Buscando...</div>}
        {!loading && !error && !results.query?.q && activeFilterCount === 0 && (
          <div className="info">Mostrando los recursos mas recientes del catalogo.</div>
        )}
        {!loading && !error && results.query?.q && (
          <div className="info">
            Resultados para <strong>{results.query.q}</strong>.
          </div>
        )}
        {!loading && error && <div className="error">{error}</div>}
      </div>

      {!loading && !error && (
        results.items.length ? (
          <div className="results-grid">
            {results.items.map((item) => (
              <article key={item.id} className="result-card catalog-card">
                <div className="result-top">
                  <span className="pill result-category">{formatCategory(item.category)}</span>
                  <span className="result-price">{item.isFree ? 'Gratis' : `$${item.price}`}</span>
                </div>
                <h3>{item.title}</h3>
                <p className="muted">{item.snippet}</p>
                <div className="result-meta">
                  <span>{item.date}</span>
                  <span>{item.level}</span>
                  <span>{item.duration}</span>
                </div>
                <div className="result-tags">
                  {item.tags.map((tag) => (
                    <span key={`${item.id}-${tag}`} className="mini-tag">
                      {tag}
                    </span>
                  ))}
                </div>
                <button type="button" className="primary" onClick={() => openDetail(item.slug)}>
                  Ver plan
                </button>
              </article>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <h3>No se encontraron resultados</h3>
            <p className="muted">
              Ajusta la consulta o limpia filtros para explorar otros recursos del catalogo.
            </p>
          </div>
        )
      )}

      {!loading && !error && results.items.length > 0 && (
        <div className="pagination">
          <button
            type="button"
            className="ghost small"
            onClick={() => changePage(results.page - 1)}
            disabled={results.page === 1}
          >
            Anterior
          </button>
          <span className="muted">
            Pagina {results.page} de {results.totalPages}
          </span>
          <button
            type="button"
            className="ghost small"
            onClick={() => changePage(results.page + 1)}
            disabled={results.page === results.totalPages}
          >
            Siguiente
          </button>
        </div>
      )}

      {selectedResource ? (
        <div className="member-modal-layer">
          <div className="member-modal resource-modal">
            <div
              className="member-modal-media resource-media"
              style={{ backgroundImage: `url(${selectedResource.coverImage})` }}
            />
            <div className="member-modal-copy">
              <button type="button" className="close-modal" onClick={() => setSelectedResource(null)}>
                <FiX />
              </button>
              <p className="eyebrow">{selectedResource.category}</p>
              <h2>{selectedResource.title}</h2>
              <p>{selectedResource.description}</p>
              <div className="result-meta">
                <span>{selectedResource.isFree ? 'Gratis' : `$${selectedResource.price}`}</span>
                <span>{selectedResource.level}</span>
                <span>{selectedResource.duration}</span>
              </div>

              {selectedResource.videoUrl ? (
                <a className="ghost landing-btn" href={selectedResource.videoUrl} target="_blank" rel="noreferrer">
                  <FiPlayCircle />
                  Ver video
                </a>
              ) : null}

              {selectedResource.exercises?.length ? (
                <div className="detail-list">
                  <h3>Rutina</h3>
                  {selectedResource.exercises.map((exercise) => (
                    <div key={exercise.name} className="detail-row">
                      <strong>{exercise.name}</strong>
                      <span>{exercise.series} series · {exercise.reps}</span>
                      <small>{exercise.tip}</small>
                    </div>
                  ))}
                </div>
              ) : null}

              {selectedResource.mealPlan ? (
                <div className="detail-list">
                  <h3>Plan de comida</h3>
                  <div className="detail-row">
                    <strong>{selectedResource.mealPlan.goal}</strong>
                    <span>{selectedResource.mealPlan.calories} kcal</span>
                    <small>{selectedResource.mealPlan.macros}</small>
                  </div>
                  {selectedResource.steps.map((step) => (
                    <div key={step} className="detail-row">
                      <small>{step}</small>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {detailLoading ? <div className="info">Cargando detalle...</div> : null}
    </section>
  );
};

export default Search;
