# Practica: Busqueda en un Sitio Web con API

## 1. Contexto del proyecto

Para esta practica se adapto MentorIA como un **catalogo de recursos de mentoria**. El sistema expone un catalogo de 60 registros en cinco categorias (`blog`, `guia`, `plantilla`, `webinar`, `curso`) con los campos solicitados por la actividad: `id`, `title`, `description`, `category`, `tags`, `date` y `price`. Sobre ese catalogo se implemento una API `GET /api/search` consumida desde React en la ruta `/buscar`.

## 2. Busqueda simple vs avanzada

La **busqueda simple** usa una sola caja de texto (`q`) para localizar coincidencias por palabras clave en titulo, descripcion y tags. En MentorIA esta modalidad calcula un puntaje simple de relevancia: una coincidencia en titulo vale mas que una coincidencia en descripcion o tags, por lo que los resultados mas cercanos suben al inicio.

La **busqueda avanzada** parte de la misma consulta de texto pero agrega filtros que reducen el conjunto de resultados: categoria, rango de precio, rango de fechas, tags y ordenamiento. En este proyecto la regla es: si solo viaja `q`, el comportamiento es simple; si ademas viajan filtros, la respuesta se marca como busqueda avanzada.

## 3. Investigacion guiada

### Opcion 1. Busqueda en memoria (front o back)

La busqueda en memoria es la opcion mas rapida para un prototipo pequeno. Se puede resolver con arreglos y metodos como `Array.filter()` y `String.includes()` sobre un dataset controlado. Su ventaja es la simplicidad: no requiere infraestructura extra ni configuracion de indices, y deja toda la logica de scoring y filtros en codigo facil de explicar. Su desventaja es que escala mal cuando el catalogo crece mucho o cuando se necesita concurrencia, tolerancia a errores tipograficos o relevancia mas sofisticada. **Esta fue la opcion elegida para esta practica** porque el catalogo tiene solo 60 registros y el objetivo principal era demostrar API, filtros, scoring y paginacion.

### Opcion 2. Busqueda en base de datos

La busqueda en base de datos es el siguiente paso natural cuando el catalogo deja de ser pequeno. En MySQL se puede comenzar con `LIKE`, indices convencionales y, si el caso lo amerita, `FULLTEXT` con `MATCH() AGAINST()`. Su ventaja es que evita cargar todo en memoria del proceso y aprovecha al motor de datos para filtrar y ordenar. Su costo es mayor complejidad de consultas, ajustes de indices y limitaciones segun el motor y el idioma. En MentorIA seria la opcion correcta si el catalogo migrara a tablas reales y creciera a cientos o miles de registros.

### Opcion 3. Motor de busqueda

Un motor dedicado como OpenSearch, Meilisearch o Algolia conviene cuando la busqueda se vuelve una funcionalidad central del producto. Estos motores agregan relevancia avanzada, tolerancia a errores, facetas, ranking configurable y mejor rendimiento para volumen alto. La desventaja es el costo operativo o economico: hay que sincronizar datos, operar otro servicio o pagar un SaaS. Para MentorIA todavia seria excesivo, pero seria razonable si el proyecto creciera a multiples catalogos, miles de recursos y necesidad de autocompletado o busqueda semantica.

### Tabla comparativa

| Opcion | Ventajas | Cuando usarla |
| --- | --- | --- |
| En memoria | Muy rapida de implementar, sin infraestructura adicional, ideal para explicar scoring y filtros | Prototipos, practicas, catalogos pequenos (50-100 registros) |
| Base de datos | Centraliza datos, aprovecha `LIKE` e indices, evita duplicar almacenamiento | Catalogos medianos o cuando ya existe una BD como fuente de verdad |
| Motor de busqueda | Relevancia avanzada, escalabilidad, facetas, typo tolerance, mejor experiencia de descubrimiento | Productos donde buscar sea critico y el volumen o complejidad ya sean altos |

## 4. Herramienta elegida

Se eligio **busqueda en memoria desde el backend** con un catalogo JS/JSON porque la practica pide un prototipo funcional con evidencia, y el proyecto actual no necesita todavia un motor especializado para solo 60 registros. Esta decision permite mostrar con claridad la normalizacion de texto, el score simple, los filtros avanzados y la paginacion sin meter complejidad extra de infraestructura.

## 5. Diseño del endpoint

### Endpoint principal

`GET /api/search`

### Parametros aceptados

| Parametro | Tipo | Descripcion |
| --- | --- | --- |
| `q` | string | Texto libre para busqueda simple |
| `category` | string | Categoria del recurso |
| `min` / `max` | number | Rango de precio |
| `tags` | string | Lista separada por comas, por ejemplo `tags=ia,web` |
| `sort` | string | `relevance`, `newest`, `price_asc`, `price_desc` |
| `date_from` / `date_to` | string | Rango opcional de fechas en formato `YYYY-MM-DD` |
| `page` / `limit` | number | Paginacion |

### Reglas de negocio

- Si `q` viaja solo, el sistema actua como busqueda simple.
- Si viaja cualquier filtro adicional, el sistema actua como busqueda avanzada.
- El filtro por `tags` usa coincidencia por **al menos un tag**.
- Si `q` llega vacio o con espacios, el sistema muestra los recursos mas recientes del catalogo.

### Respuesta JSON

```json
{
  "query": {
    "q": "arduino",
    "category": null,
    "min": null,
    "max": null,
    "tags": [],
    "sort": "relevance",
    "date_from": null,
    "date_to": null,
    "mode": "simple"
  },
  "total": 5,
  "page": 1,
  "limit": 10,
  "totalPages": 1,
  "items": [
    {
      "id": 49,
      "title": "Curso intensivo de ABC de Arduino y sensores",
      "snippet": "Material base para crear prototipos...",
      "url": "/buscar/recurso/abc-arduino-sensores-curso",
      "category": "curso",
      "tags": ["arduino", "hardware", "prototipado", "makers", "capacitacion", "mentoria"],
      "date": "2025-03-21",
      "price": 249,
      "score": 23
    }
  ]
}
```

## 6. Evidencia de pruebas

Se dejo un comando reproducible para validar los casos solicitados:

```bash
cd backend
npm run test:search
```

### Tabla de 10 casos

| Caso | Consulta | Resultado esperado | Resultado obtenido |
| --- | --- | --- | --- |
| 1 | `q=arduino` | Encontrar recursos con Arduino | 5 resultados |
| 2 | `q=` vacio | Listar recursos recientes | 60 totales, 10 en pagina 1 |
| 3 | `q=` espacios | Tratarlo como vacio | 60 totales, 10 en pagina 1 |
| 4 | `q=ABC` | Buscar sin importar mayusculas/minusculas | 10 resultados |
| 5 | `q=web&category=blog` | Filtrar por texto y categoria | 12 resultados |
| 6 | `q=ia&tags=seguridad,datos` | Filtrar por texto y al menos un tag | 20 resultados |
| 7 | `min=100&max=200` | Filtrar por rango de precio | 18 resultados |
| 8 | `sort=newest` | Ordenar del mas reciente al mas antiguo | Primer resultado: `Curso intensivo de IA para seguridad de datos` |
| 9 | `page=2&limit=10` | Entregar segunda pagina | 10 resultados en pagina 2 |
| 10 | `q=sin coincidencia xyz` | Mostrar mensaje sin resultados | 0 resultados |

### Validacion directa del endpoint

Ademas del script de humo, se valido el endpoint real levantando el backend en `http://localhost:4000` y probando con `curl`.

#### Caso A. Busqueda simple con paginacion

```bash
curl "http://localhost:4000/api/search?q=arduino&page=1&limit=2"
```

Hallazgos observados:

- `mode` llega como `simple`.
- `total` llega con valor `5`.
- `page=1`, `limit=2` y `totalPages=3`, lo que confirma que la paginacion si esta siendo calculada por la API.
- La respuesta incluye `items` con los campos esperados (`id`, `title`, `snippet`, `url`, `category`, `tags`, `date`, `price`, `score`).

#### Caso B. Busqueda avanzada con 2 filtros + sort

```bash
curl "http://localhost:4000/api/search?q=ia&category=curso&tags=seguridad,datos&sort=price_desc&page=1&limit=3"
```

Hallazgos observados:

- `mode` llega como `advanced`.
- La consulta usa texto libre (`q`) mas dos filtros (`category`, `tags`) y ordenamiento (`sort=price_desc`).
- `total=4`, `limit=3` y `totalPages=2`, asi que la paginacion tambien funciona en modo avanzado.
- El primer resultado regresa primero el curso con mayor precio dentro del conjunto filtrado, lo que confirma el ordenamiento descendente por precio.

## 7. Archivos modificados para la practica

- `backend/data/searchCatalog.js`
- `backend/lib/searchService.js`
- `backend/server.js`
- `backend/scripts/search-smoke.mjs`
- `frontend/src/components/Search.jsx`
- `frontend/src/components/Topbar.jsx`
- `frontend/src/index.css`

## 8. Fuentes consultadas

- MDN, `Array.prototype.filter()`: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter
- MDN, `String.prototype.includes()`: https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/String/includes
- MySQL 8.4, Pattern Matching: https://dev.mysql.com/doc/refman/8.4/en/pattern-matching.html
- MySQL 8.4, Natural Language Full-Text Searches: https://dev.mysql.com/doc/refman/8.4/en/fulltext-natural-language.html
- Meilisearch, Getting started with self-hosted Meilisearch: https://www.meilisearch.com/docs/learn/self_hosted
- OpenSearch, Getting started: https://docs.opensearch.org/docs/getting-started/
- Algolia, What is Algolia?: https://www.algolia.com/doc/guides/getting-started/what-is-algolia

## 9. Texto sugerido para cada captura

### Captura 1. API funcionando y JSON correcto

Que mostrar:

- Postman, navegador o terminal con la consulta `GET /api/search?q=arduino&page=1&limit=2`.
- En la imagen deben verse `total`, `page`, `limit`, `totalPages` y al menos un objeto dentro de `items`.

Texto para el documento:

> En esta captura se comprueba que la API `GET /api/search` responde en formato JSON y devuelve tanto los datos de la consulta como la metadata de paginacion. Para el termino `arduino`, la API reporta `total=5`, `page=1`, `limit=2` y `totalPages=3`, lo que demuestra que la respuesta no solo entrega resultados sino tambien informacion suficiente para navegar entre paginas desde el frontend.

### Captura 2. Busqueda simple por palabras clave

Que mostrar:

- La vista `/buscar` con la caja de texto usando una palabra como `arduino`.
- El badge de resultados y las tarjetas encontradas.

Texto para el documento:

> Esta captura evidencia la busqueda simple por palabras clave. El usuario escribe un termino libre en la caja principal y el sistema localiza coincidencias en titulo, descripcion y tags. En este caso, la consulta `arduino` devuelve recursos relacionados y los ordena por relevancia, priorizando coincidencias mas fuertes en el titulo del recurso.

### Captura 3. Busqueda avanzada con al menos 2 filtros + sort

Que mostrar:

- La vista `/buscar` con `q=ia`, `category=curso`, tags `seguridad` y `datos`, y `sort=price_desc`.
- El contador de filtros activos y los resultados filtrados.

Texto para el documento:

> En esta evidencia se observa la busqueda avanzada. A la consulta por texto `ia` se le agregan filtros por categoria y tags, ademas de un ordenamiento por precio descendente. El resultado confirma que el sistema puede combinar multiples criterios en una misma peticion y devolver un subconjunto mas preciso del catalogo, manteniendo la paginacion y el orden solicitado.

### Captura 4. Usabilidad: mensajes, estados y limpiar filtros

Que mostrar:

- Uno de estos estados: `Buscando...`, `No se encontraron resultados` o el boton `Limpiar filtros` despues de aplicar filtros.
- Si es posible, conviene capturar el estado sin resultados y el boton de limpieza visible.

Texto para el documento:

> Esta captura documenta la parte de usabilidad del buscador. La interfaz informa cuando la consulta esta en proceso, muestra mensajes claros cuando no hay coincidencias y ofrece un boton de `Limpiar filtros` para regresar rapidamente al catalogo completo. Estos elementos reducen friccion y ayudan a que el usuario entienda el estado actual de la busqueda.

### Captura 5. Documento de investigacion con enlaces consultados

Que mostrar:

- La seccion del documento donde aparecen las opciones evaluadas (`en memoria`, `base de datos`, `motor de busqueda`) y la lista de fuentes.

Texto para el documento:

> Esta captura corresponde a la parte de investigacion. Aqui se comparan tres enfoques para resolver un buscador: procesamiento en memoria, consultas sobre base de datos y uso de motores especializados. La conclusion del proyecto fue elegir busqueda en memoria desde el backend, porque el catalogo actual tiene solo 60 registros y esta alternativa permite demostrar de forma clara scoring, filtros y paginacion sin agregar complejidad de infraestructura. Tambien se incluyen enlaces oficiales consultados para sustentar la comparacion tecnica.
