const searchCatalog = [
  {
    id: 1,
    slug: 'pecho-triceps-gratuito',
    title: 'Plan Gratuito Pecho + Triceps',
    description: 'Rutina gratuita para trabajar pecho y triceps con tecnica, series y repeticiones claras.',
    category: 'entrenamiento',
    tags: ['gratis', 'pecho', 'triceps', 'gym'],
    date: '2026-03-01',
    price: 0,
    isFree: true,
    level: 'principiante',
    duration: '4 semanas',
    coverImage: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
    exercises: [
      { name: 'Press de banca', series: '4', reps: '8-10', tip: 'Controla la bajada y no rebotes la barra.' },
      { name: 'Press inclinado con mancuernas', series: '3', reps: '10-12', tip: 'Busca recorrido completo y hombros estables.' },
      { name: 'Fondos asistidos', series: '3', reps: '8-12', tip: 'Inclina ligeramente el torso para sentir mas el pecho.' },
      { name: 'Extension de triceps en polea', series: '3', reps: '12-15', tip: 'No separes los codos del cuerpo.' }
    ],
    mealPlan: null,
    steps: [],
    url: '/buscar/recurso/pecho-triceps-gratuito'
  },
  {
    id: 2,
    slug: 'torso-elite',
    title: 'Plan Torso Completo Elite',
    description: 'Programa premium para pecho, espalda y hombro con progresion de cargas y volumen semanal.',
    category: 'entrenamiento',
    tags: ['torso', 'premium', 'espalda', 'hombros'],
    date: '2026-03-04',
    price: 349,
    isFree: false,
    level: 'intermedio',
    duration: '8 semanas',
    coverImage: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=GViX8riaHX4',
    exercises: [
      { name: 'Dominadas asistidas', series: '4', reps: '6-8', tip: 'Sube el pecho al frente y evita colgarte de hombros.' },
      { name: 'Press militar', series: '4', reps: '8-10', tip: 'Aprieta gluteos y abdomen para mantener estabilidad.' },
      { name: 'Remo con barra', series: '4', reps: '8-10', tip: 'Tira con el codo y no con el antebrazo.' },
      { name: 'Press plano con mancuernas', series: '3', reps: '10-12', tip: 'Pausa breve abajo para mas control.' }
    ],
    mealPlan: null,
    steps: [],
    url: '/buscar/recurso/torso-elite'
  },
  {
    id: 3,
    slug: 'full-body-fit',
    title: 'Full Body Inteligente',
    description: 'Rutina completa para tres dias por semana ideal para ganar condicion y base muscular.',
    category: 'entrenamiento',
    tags: ['full body', 'gratis', '3 dias', 'fuerza'],
    date: '2026-03-06',
    price: 0,
    isFree: true,
    level: 'principiante',
    duration: '6 semanas',
    coverImage: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=ixkQaZXVQjs',
    exercises: [
      { name: 'Sentadilla goblet', series: '4', reps: '10-12', tip: 'Mantente erguido y baja con control.' },
      { name: 'Peso muerto rumano', series: '3', reps: '10', tip: 'Empuja la cadera atras y cuida espalda neutra.' },
      { name: 'Press de pecho', series: '3', reps: '10', tip: 'No bloquees codos arriba.' },
      { name: 'Remo sentado', series: '3', reps: '12', tip: 'Aprieta escapulas en cada repeticion.' }
    ],
    mealPlan: null,
    steps: [],
    url: '/buscar/recurso/full-body-fit'
  },
  {
    id: 4,
    slug: 'cardio-hiit-burn',
    title: 'HIIT + Cardio Burn',
    description: 'Bloque combinado para mejorar condicion, quemar calorias y sostener definicion.',
    category: 'entrenamiento',
    tags: ['hiit', 'cardio', 'fat loss', 'premium'],
    date: '2026-03-08',
    price: 179,
    isFree: false,
    level: 'todos',
    duration: '5 semanas',
    coverImage: 'https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=ml6cT4AZdqI',
    exercises: [
      { name: 'Sprint en bicicleta', series: '8', reps: '20 seg / 40 seg', tip: 'Mantente explosivo pero sin perder tecnica.' },
      { name: 'Burpees', series: '4', reps: '12', tip: 'No sacrifiques postura por velocidad.' },
      { name: 'Mountain climbers', series: '4', reps: '30 seg', tip: 'Abdomen apretado en todo momento.' }
    ],
    mealPlan: null,
    steps: [],
    url: '/buscar/recurso/cardio-hiit-burn'
  },
  {
    id: 5,
    slug: 'plan-bajar-peso-clean',
    title: 'Plan de Alimentacion para Bajar Peso',
    description: 'Deficit inteligente, menus faciles, colaciones y recetas paso a paso para perder grasa sin complicarte.',
    category: 'alimentacion',
    tags: ['gratis', 'bajar peso', 'menus', 'recetas'],
    date: '2026-03-10',
    price: 0,
    isFree: true,
    level: 'todos',
    duration: '14 dias',
    coverImage: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=qH__o17xHls',
    exercises: [],
    mealPlan: {
      calories: 1800,
      goal: 'Bajar peso',
      macros: '140g proteina / 180g carbos / 55g grasa'
    },
    steps: [
      'Desayuno: yogurt griego con avena y frutos rojos.',
      'Comida: pollo a la plancha con arroz y ensalada.',
      'Cena: tortilla de claras con vegetales y aguacate.',
      'Snack: manzana con crema de cacahuate.'
    ],
    url: '/buscar/recurso/plan-bajar-peso-clean'
  },
  {
    id: 6,
    slug: 'plan-volumen-magro',
    title: 'Plan de Comida para Subir Peso',
    description: 'Volumen magro con calorias bien distribuidas, recetas altas en energia y enfoque en masa muscular.',
    category: 'alimentacion',
    tags: ['subir peso', 'volumen', 'masa muscular', 'premium'],
    date: '2026-03-12',
    price: 239,
    isFree: false,
    level: 'todos',
    duration: '21 dias',
    coverImage: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=VQqP6g1mQw4',
    exercises: [],
    mealPlan: {
      calories: 2600,
      goal: 'Subir peso',
      macros: '165g proteina / 300g carbos / 80g grasa'
    },
    steps: [
      'Desayuno: hotcakes de avena con platano y miel.',
      'Comida: pasta con carne magra y aceite de oliva.',
      'Cena: salmon con pure y vegetales.',
      'Snack: licuado alto en calorias con avena y crema de cacahuate.'
    ],
    url: '/buscar/recurso/plan-volumen-magro'
  },
  {
    id: 7,
    slug: 'recetario-fitia-visual',
    title: 'Recetario Visual Fit',
    description: 'Recetas paso a paso con calorias estimadas, porciones y consejos de adherencia nutricional.',
    category: 'recetario',
    tags: ['recetas', 'fitia', 'calorias', 'gratis'],
    date: '2026-03-14',
    price: 0,
    isFree: true,
    level: 'todos',
    duration: '20 recetas',
    coverImage: 'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=1xIpsP_r8Sg',
    exercises: [],
    mealPlan: {
      calories: 2000,
      goal: 'Recetas flexibles',
      macros: 'Variable por receta'
    },
    steps: [
      'Receta 1: bowl de pollo, arroz y brocoli.',
      'Receta 2: tostadas de atun con aguacate.',
      'Receta 3: avena proteica con cacao y fruta.',
      'Receta 4: wrap de pavo con queso ligero.'
    ],
    url: '/buscar/recurso/recetario-fitia-visual'
  },
  {
    id: 8,
    slug: 'programa-recomp-corporal',
    title: 'Programa de Recomp Corporal',
    description: 'Combina entrenamiento y alimentacion para perder grasa y ganar tono muscular.',
    category: 'programa',
    tags: ['recomp', 'programa', 'premium', 'integral'],
    date: '2026-03-16',
    price: 399,
    isFree: false,
    level: 'intermedio',
    duration: '10 semanas',
    coverImage: 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?auto=format&fit=crop&w=1200&q=80',
    videoUrl: 'https://www.youtube.com/watch?v=U0bhE67HuDY',
    exercises: [
      { name: 'Sentadilla', series: '4', reps: '8-10', tip: 'Prioriza rango y profundidad.' },
      { name: 'Remo unilateral', series: '4', reps: '10-12', tip: 'No rotes el torso.' },
      { name: 'Press inclinado', series: '3', reps: '10-12', tip: 'Aprieta escapulas en el banco.' }
    ],
    mealPlan: {
      calories: 2200,
      goal: 'Recomposicion corporal',
      macros: '160g proteina / 230g carbos / 65g grasa'
    },
    steps: [
      'Semana 1-3: crear adherencia y tecnica.',
      'Semana 4-7: progresar cargas y pasos diarios.',
      'Semana 8-10: ajustar calorias y sostener intensidad.'
    ],
    url: '/buscar/recurso/programa-recomp-corporal'
  }
];

export default searchCatalog;
