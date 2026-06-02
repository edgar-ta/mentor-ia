import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiArrowRight, FiTarget, FiZap } from 'react-icons/fi';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

const steps = [
  'objetivo',
  'cuerpo',
  'habitos',
  'ritmo',
  'resultado'
];

const objectiveOptions = [
  { value: 'bajar_peso', label: 'Bajar peso' },
  { value: 'subir_peso', label: 'Subir peso' },
  { value: 'mantenerme', label: 'Mantenerme' },
  { value: 'ganar_musculo', label: 'Ganar musculo' }
];

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { updateUser } = useAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    objetivo: 'bajar_peso',
    currentWeightKg: '',
    targetWeightKg: '',
    heightCm: '',
    age: '',
    gender: 'masculino',
    activityLevel: 'moderado',
    dailyCalories: '',
    trainingFrequency: 3,
    desiredPace: 'equilibrado'
  });

  const progress = useMemo(() => Math.round(((step + 1) / steps.length) * 100), [step]);

  const calculateCalories = async () => {
    const { data } = await api.post('/tools/calculate-calories', form);
    setForm((prev) => ({ ...prev, dailyCalories: data.calories }));
  };

  const handleNext = async () => {
    if (steps[step] === 'cuerpo') {
      if (!form.currentWeightKg || !form.targetWeightKg || !form.heightCm || !form.age) {
        setError('Por favor, completa todos los datos de tu cuerpo para continuar.');
        return;
      }
      setError('');
      if (!form.dailyCalories) {
        try {
          await calculateCalories();
        } catch (err) {
          console.error('Error calculando calorias:', err);
        }
      }
    }

    if (step < steps.length - 1) {
      setStep((current) => current + 1);
      return;
    }

    try {
      setLoading(true);
      setError('');
      const { data } = await api.post('/auth/onboarding', form);
      updateUser(data.user);
      navigate('/app', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo completar el tour.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="tour-shell">
      <div className="tour-card">
        <div className="tour-top">
          <div>
            <p className="eyebrow">Primer ingreso</p>
            <h1>Vamos a construir tu plan.</h1>
          </div>
          <div className="tour-progress">
            <span>{progress}%</span>
            <div className="kpi-bar"><span style={{ width: `${progress}%` }} /></div>
          </div>
        </div>

        <div className="tour-stage">
          <aside className="tour-sidebar">
            {steps.map((item, index) => (
              <div key={item} className={`tour-step ${index === step ? 'active' : ''}`}>
                <span>{index + 1}</span>
                <strong>{item}</strong>
              </div>
            ))}
          </aside>

          <div className="tour-content">
            {step === 0 ? (
              <div className="tour-panel">
                <div className="tour-arrow">Elige primero tu meta principal →</div>
                <h2>¿Cual es tu objetivo?</h2>
                <div className="choice-grid">
                  {objectiveOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`choice-card ${form.objetivo === option.value ? 'selected' : ''}`}
                      onClick={() => setForm((prev) => ({ ...prev, objetivo: option.value }))}
                    >
                      <FiTarget />
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {step === 1 ? (
              <div className="tour-panel">
                <div className="tour-arrow">Completa tus datos para estimar calorias ↓</div>
                <h2>Datos de tu cuerpo</h2>
                <div className="form-grid">
                  <label>
                    Peso actual
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input type="text" inputMode="numeric" placeholder="70" style={{ width: '100%', paddingRight: '40px' }} value={form.currentWeightKg} onChange={(e) => setForm({ ...form, currentWeightKg: e.target.value.replace(/\D/g, '') })} />
                      <span style={{ position: 'absolute', right: '16px', pointerEvents: 'none' }} className="muted">kg</span>
                    </div>
                  </label>
                  <label>
                    Peso meta
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input type="text" inputMode="numeric" placeholder="65" style={{ width: '100%', paddingRight: '40px' }} value={form.targetWeightKg} onChange={(e) => setForm({ ...form, targetWeightKg: e.target.value.replace(/\D/g, '') })} />
                      <span style={{ position: 'absolute', right: '16px', pointerEvents: 'none' }} className="muted">kg</span>
                    </div>
                  </label>
                  <label>
                    Estatura
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input type="text" inputMode="numeric" placeholder="170" style={{ width: '100%', paddingRight: '40px' }} value={form.heightCm} onChange={(e) => setForm({ ...form, heightCm: e.target.value.replace(/\D/g, '') })} />
                      <span style={{ position: 'absolute', right: '16px', pointerEvents: 'none' }} className="muted">cm</span>
                    </div>
                  </label>
                  <label>
                    Edad
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input type="text" inputMode="numeric" placeholder="25" style={{ width: '100%' }} value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value.replace(/\D/g, '') })} />
                    </div>
                  </label>
                  <label>
                    Genero
                    <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
                      <option value="masculino">Masculino</option>
                      <option value="femenino">Femenino</option>
                      <option value="otro">Otro</option>
                    </select>
                  </label>
                  <label>
                    Actividad diaria
                    <select value={form.activityLevel} onChange={(e) => setForm({ ...form, activityLevel: e.target.value })}>
                      <option value="sedentario">Sedentario</option>
                      <option value="ligero">Ligero</option>
                      <option value="moderado">Moderado</option>
                      <option value="alto">Alto</option>
                      <option value="atleta">Atleta</option>
                    </select>
                  </label>
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="tour-panel">
                <div className="tour-arrow">Si no sabes tus calorias, el sistema las calcula por ti →</div>
                <h2>Habitos y calorias</h2>
                <div className="form-grid">
                  <label>
                    Calorias diarias
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input type="text" inputMode="numeric" value={form.dailyCalories} onChange={(e) => setForm({ ...form, dailyCalories: e.target.value.replace(/\D/g, '') })} placeholder="Si no sabes, dejalo vacio" style={{ width: '100%', paddingRight: '50px' }} />
                      <span style={{ position: 'absolute', right: '16px', pointerEvents: 'none' }} className="muted">kcal</span>
                    </div>
                  </label>
                  <label>
                    Veces que entrenas por semana
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input type="text" inputMode="numeric" value={form.trainingFrequency} onChange={(e) => setForm({ ...form, trainingFrequency: e.target.value.replace(/\D/g, '') })} style={{ width: '100%' }} />
                    </div>
                  </label>
                </div>
                <button type="button" className="ghost inline-action" onClick={calculateCalories}>
                  <FiZap />
                  Calcular mis calorias
                </button>
              </div>
            ) : null}

            {step === 3 ? (
              <div className="tour-panel">
                <div className="tour-arrow">Ajusta que tan rapido quieres ver cambios ↘</div>
                <h2>¿Que tan rapido quieres resultados?</h2>
                <div className="choice-grid">
                  {[
                    ['tranquilo', 'Tranquilo'],
                    ['equilibrado', 'Equilibrado'],
                    ['intenso', 'Intenso']
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      className={`choice-card ${form.desiredPace === value ? 'selected' : ''}`}
                      onClick={() => setForm((prev) => ({ ...prev, desiredPace: value }))}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {step === 4 ? (
              <div className="tour-panel">
                <div className="tour-arrow">Ultimo paso: confirma y entra a tu panel →</div>
                <h2>Tu ruta recomendada</h2>
                <div className="summary-stack">
                  <div className="summary-card">
                    <span>Objetivo</span>
                    <strong>{objectiveOptions.find((item) => item.value === form.objetivo)?.label}</strong>
                  </div>
                  <div className="summary-card">
                    <span>Calorias estimadas</span>
                    <strong>{form.dailyCalories || 'Se calcularan automaticamente'}</strong>
                  </div>
                  <div className="summary-card">
                    <span>Entrenamiento sugerido</span>
                    <strong>{Number(form.trainingFrequency) >= 4 ? 'Fuerza + cardio inteligente' : 'Fuerza basica + constancia'}</strong>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {error ? <div className="error-banner">{error}</div> : null}

        <div className="tour-actions">
          <button type="button" className="ghost" disabled={step === 0} onClick={() => setStep((current) => current - 1)}>
            <FiArrowLeft />
            Atras
          </button>
          <button type="button" className="primary" disabled={loading} onClick={handleNext}>
            {step === steps.length - 1 ? 'Entrar al panel' : 'Siguiente'}
            <FiArrowRight />
          </button>
        </div>
      </div>
    </section>
  );
};

export default OnboardingPage;
