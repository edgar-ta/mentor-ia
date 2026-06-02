export const sampleMetrics = {
  kpis: [
    { label: 'Clientes activos', value: 24, trend: 12 },
    { label: 'Sesiones mes', value: 68, trend: 5 },
    { label: 'NPS', value: 72, trend: -3 }
  ],
  campaigns: [
    {
      title: 'Sprint de Liderazgo',
      tag: 'Foco semanal',
      image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
      cta: 'Revisar playbook'
    },
    {
      title: 'Mindset de alto rendimiento',
      tag: 'Nueva guía',
      image: 'https://images.unsplash.com/photo-1529333166433-89e3ab167434?auto=format&fit=crop&w=1200&q=80',
      cta: 'Enviar a clientes'
    },
    {
      title: 'Preparación de feedback 360°',
      tag: 'Plantilla IA',
      image: 'https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=1200&q=80',
      cta: 'Configurar'
    }
  ],
  pipeline: [
    { name: 'Ana', engagement: 82 },
    { name: 'Luis', engagement: 75 },
    { name: 'Marta', engagement: 90 },
    { name: 'Carlos', engagement: 65 }
  ],
  goals: [
    { label: 'En curso', value: 18 },
    { label: 'Completados', value: 9 },
    { label: 'En riesgo', value: 5 }
  ],
  sessions: [
    { id: 1, client: 'Ana', topic: 'Liderazgo', date: '12 Feb 2026', time: '10:00' },
    { id: 2, client: 'Luis', topic: 'Productividad', date: '12 Feb 2026', time: '12:00' },
    { id: 3, client: 'Marta', topic: 'Cambio de rol', date: '13 Feb 2026', time: '09:00' }
  ],
  reminders: [
    { title: 'Enviar resumen post-sesión a Ana', time: 'Hace 1h' },
    { title: 'Automatizar check-in de motivación', time: 'Hoy 18:00' },
    { title: 'Revisar riesgo de Luis', time: 'Mañana' }
  ],
  mood: [
    { label: 'Motivado', value: 62 },
    { label: 'Neutro', value: 23 },
    { label: 'En riesgo', value: 15 }
  ]
};

export const sampleClients = [
  { id: 1, name: 'Ana', goal: 'Liderazgo', status: 'activo', statusLabel: 'Activo', nextSession: '12 Feb 2026', score: 82 },
  { id: 2, name: 'Luis', goal: 'Productividad', status: 'riesgo', statusLabel: 'En riesgo', nextSession: '15 Feb 2026', score: 68 },
  { id: 3, name: 'Marta', goal: 'Cambio de rol', status: 'activo', statusLabel: 'Activo', nextSession: '20 Feb 2026', score: 90 }
];

export const sampleSessions = [
  { id: 1, client: 'Ana', topic: 'Liderazgo', date: '12 Feb 2026', time: '10:00' },
  { id: 2, client: 'Luis', topic: 'Productividad', date: '12 Feb 2026', time: '12:00' },
  { id: 3, client: 'Marta', topic: 'Cambio de rol', date: '13 Feb 2026', time: '09:00' }
];
