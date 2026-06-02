import searchCatalog from '../data/searchCatalog.js';

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 24;
const SORT_OPTIONS = new Set(['relevance', 'newest', 'price_asc', 'price_desc']);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function normalizeText(value = '') {
  return String(value)
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function tokenize(value) {
  return normalizeText(value)
    .split(/\s+/)
    .filter(Boolean);
}

function parseNumber(value) {
  if (value === undefined || value === null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}

function parsePositiveInt(value, fallback, maxValue = Infinity) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, maxValue);
}

function parseTags(rawTags) {
  if (!rawTags) return [];
  const values = Array.isArray(rawTags) ? rawTags : String(rawTags).split(',');
  return [...new Set(values.map((tag) => normalizeText(tag)).filter(Boolean))];
}

function buildSnippet(item, tokens) {
  if (!tokens.length) {
    return item.description.slice(0, 140);
  }

  const normalizedDescription = normalizeText(item.description);
  const firstToken = tokens.find((token) => normalizedDescription.includes(token));
  if (!firstToken) {
    return item.description.slice(0, 140);
  }

  const rawIndex = normalizedDescription.indexOf(firstToken);
  const start = Math.max(0, rawIndex - 30);
  const end = Math.min(item.description.length, rawIndex + 110);
  const snippet = item.description.slice(start, end).trim();
  return start > 0 ? `...${snippet}` : snippet;
}

function scoreItem(item, normalizedQuery, tokens) {
  if (!normalizedQuery) return 0;

  const title = normalizeText(item.title);
  const description = normalizeText(item.description);
  const tags = item.tags.map((tag) => normalizeText(tag)).join(' ');

  let score = 0;

  if (title.includes(normalizedQuery)) score += 12;
  if (description.includes(normalizedQuery)) score += 6;
  if (tags.includes(normalizedQuery)) score += 4;

  for (const token of tokens) {
    if (title.includes(token)) score += 5;
    if (description.includes(token)) score += 3;
    if (tags.includes(token)) score += 2;
    if (normalizeText(item.category) === token) score += 1;
  }

  return score;
}

function isAdvancedSearch({ category, min, max, tags, dateFrom, dateTo, sort }) {
  return Boolean(category || min !== null || max !== null || tags.length || dateFrom || dateTo || sort !== 'relevance');
}

function validateQuery(params) {
  const q = String(params.q ?? '');
  const normalizedQuery = normalizeText(q);
  const category = normalizeText(params.category);
  const min = parseNumber(params.min);
  const max = parseNumber(params.max);
  const tags = parseTags(params.tags);
  const sort = SORT_OPTIONS.has(params.sort) ? params.sort : 'relevance';
  const dateFrom = params.date_from ? String(params.date_from) : '';
  const dateTo = params.date_to ? String(params.date_to) : '';

  if (Number.isNaN(min) || Number.isNaN(max)) {
    throw new Error('Los parametros min y max deben ser numericos.');
  }
  if (min !== null && max !== null && min > max) {
    throw new Error('El valor min no puede ser mayor que max.');
  }
  if (dateFrom && !DATE_PATTERN.test(dateFrom)) {
    throw new Error('date_from debe tener formato YYYY-MM-DD.');
  }
  if (dateTo && !DATE_PATTERN.test(dateTo)) {
    throw new Error('date_to debe tener formato YYYY-MM-DD.');
  }

  return {
    q,
    normalizedQuery,
    tokens: tokenize(q),
    category,
    min,
    max,
    tags,
    sort,
    dateFrom,
    dateTo,
    page: parsePositiveInt(params.page, 1),
    limit: parsePositiveInt(params.limit, DEFAULT_LIMIT, MAX_LIMIT)
  };
}

export function getSearchMeta() {
  const categories = [...new Set(searchCatalog.map((item) => item.category))].sort();
  const tags = [...new Set(searchCatalog.flatMap((item) => item.tags))].sort((a, b) => a.localeCompare(b));
  const prices = searchCatalog.map((item) => item.price);

  return {
    categories,
    tags,
    limits: {
      default: DEFAULT_LIMIT,
      max: MAX_LIMIT
    },
    priceRange: {
      min: Math.min(...prices),
      max: Math.max(...prices)
    },
    totalItems: searchCatalog.length
  };
}

export function getResourceBySlug(slug) {
  const item = searchCatalog.find((entry) => entry.slug === slug);
  if (!item) return null;

  return {
    id: item.id,
    slug: item.slug,
    title: item.title,
    description: item.description,
    category: item.category,
    tags: item.tags,
    date: item.date,
    price: item.price,
    isFree: item.isFree,
    level: item.level,
    duration: item.duration,
    coverImage: item.coverImage,
    videoUrl: item.videoUrl,
    exercises: item.exercises,
    mealPlan: item.mealPlan,
    steps: item.steps
  };
}

export function searchResources(params = {}) {
  const query = validateQuery(params);
  const advanced = isAdvancedSearch(query);

  const rows = searchCatalog
    .map((item) => {
      const score = scoreItem(item, query.normalizedQuery, query.tokens);
      return { ...item, score };
    })
    .filter((item) => {
      if (query.normalizedQuery && item.score === 0) return false;
      if (query.category && normalizeText(item.category) !== query.category) return false;
      if (query.min !== null && item.price < query.min) return false;
      if (query.max !== null && item.price > query.max) return false;
      if (query.dateFrom && item.date < query.dateFrom) return false;
      if (query.dateTo && item.date > query.dateTo) return false;
      if (query.tags.length) {
        const normalizedTags = item.tags.map((tag) => normalizeText(tag));
        const matchesAtLeastOneTag = query.tags.some((tag) => normalizedTags.includes(tag));
        if (!matchesAtLeastOneTag) return false;
      }
      return true;
    });

  rows.sort((left, right) => {
    if (query.sort === 'newest') {
      return right.date.localeCompare(left.date);
    }
    if (query.sort === 'price_asc') {
      return left.price - right.price || right.date.localeCompare(left.date);
    }
    if (query.sort === 'price_desc') {
      return right.price - left.price || right.date.localeCompare(left.date);
    }

    if (!query.normalizedQuery) {
      return right.date.localeCompare(left.date);
    }

    return right.score - left.score || right.date.localeCompare(left.date);
  });

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / query.limit));
  const page = Math.min(query.page, totalPages);
  const start = (page - 1) * query.limit;
  const items = rows.slice(start, start + query.limit).map((item) => ({
    id: item.id,
    slug: item.slug,
    title: item.title,
    snippet: buildSnippet(item, query.tokens),
    url: item.url,
    category: item.category,
    tags: item.tags,
    date: item.date,
    price: item.price,
    isFree: item.isFree,
    level: item.level,
    duration: item.duration,
    coverImage: item.coverImage,
    score: item.score
  }));

  return {
    query: {
      q: query.q,
      category: query.category || null,
      min: query.min,
      max: query.max,
      tags: query.tags,
      sort: query.sort,
      date_from: query.dateFrom || null,
      date_to: query.dateTo || null,
      mode: advanced ? 'advanced' : 'simple'
    },
    total,
    page,
    limit: query.limit,
    totalPages,
    items
  };
}
