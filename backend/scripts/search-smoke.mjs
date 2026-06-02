import { searchResources } from '../lib/searchService.js';

const cases = [
  {
    id: 1,
    label: 'q=arduino',
    params: { q: 'arduino' }
  },
  {
    id: 2,
    label: 'q vacio',
    params: {}
  },
  {
    id: 3,
    label: 'q=espacios',
    params: { q: '   ' }
  },
  {
    id: 4,
    label: 'q=ABC',
    params: { q: 'ABC' }
  },
  {
    id: 5,
    label: 'q=web&category=blog',
    params: { q: 'web', category: 'blog' }
  },
  {
    id: 6,
    label: 'q=ia&tags=seguridad,datos',
    params: { q: 'ia', tags: 'seguridad,datos' }
  },
  {
    id: 7,
    label: 'min=100&max=200',
    params: { min: 100, max: 200 }
  },
  {
    id: 8,
    label: 'sort=newest',
    params: { sort: 'newest' }
  },
  {
    id: 9,
    label: 'page=2&limit=10',
    params: { page: 2, limit: 10 }
  },
  {
    id: 10,
    label: 'sin resultados',
    params: { q: 'sin coincidencia xyz' }
  }
];

const report = cases.map((testCase) => {
  const result = searchResources(testCase.params);
  return {
    caso: testCase.id,
    consulta: testCase.label,
    total: result.total,
    pagina: result.page,
    itemsEnPagina: result.items.length,
    primerResultado: result.items[0]?.title || 'Sin resultados'
  };
});

console.table(report);
