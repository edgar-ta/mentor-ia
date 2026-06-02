import { useEffect, useState } from 'react';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

const ProfilePage = () => {
  const { user, updateUser, logout } = useAuth();
  const [profileForm, setProfileForm] = useState({
    nombre: '',
    currentWeightKg: '',
    targetWeightKg: '',
    heightCm: '',
    age: '',
    dailyCalories: '',
    trainingFrequency: '',
    desiredPace: '',
    objective: '',
    activityLevel: '',
    gender: ''
  });
  const [progressForm, setProgressForm] = useState({ weightKg: '', notes: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '' });
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    setProfileForm({
      nombre: user.nombre || '',
      currentWeightKg: user.profile?.currentWeightKg || '',
      targetWeightKg: user.profile?.targetWeightKg || '',
      heightCm: user.profile?.heightCm || '',
      age: user.profile?.age || '',
      dailyCalories: user.profile?.dailyCalories || '',
      trainingFrequency: user.profile?.trainingFrequency || '',
      desiredPace: user.profile?.desiredPace || '',
      objective: user.profile?.objetivo || '',
      activityLevel: user.profile?.activityLevel || '',
      gender: user.profile?.gender || ''
    });

    api.get('/users/me/progress').then(({ data }) => setHistory(data)).catch(() => setHistory([]));
  }, [user]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      const { data } = await api.patch('/auth/profile', {
        nombre: profileForm.nombre,
        currentWeightKg: profileForm.currentWeightKg,
        targetWeightKg: profileForm.targetWeightKg,
        heightCm: profileForm.heightCm,
        age: profileForm.age,
        dailyCalories: profileForm.dailyCalories,
        trainingFrequency: profileForm.trainingFrequency,
        desiredPace: profileForm.desiredPace,
        objetivo: profileForm.objective,
        activityLevel: profileForm.activityLevel,
        gender: profileForm.gender
      });
      updateUser(data.user);
      setMessage('Perfil actualizado.');
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo actualizar el perfil.');
    }
  };

  const saveProgress = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      const { data } = await api.post('/users/me/progress', progressForm);
      updateUser(data.user);
      setHistory(data.history);
      setProgressForm({ weightKg: '', notes: '' });
      setMessage('Progreso registrado.');
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo registrar el progreso.');
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setMessage('');
    setError('');

    try {
      const { data } = await api.post('/auth/change-password', passwordForm);
      setMessage(data.message);
      await logout();
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo cambiar la contrasena.');
    }
  };

  return (
    <section className="page-stack">
      {message ? <div className="success-banner">{message}</div> : null}
      {error ? <div className="error-banner">{error}</div> : null}

      <article className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Perfil</p>
            <h2>Tu informacion fisica</h2>
          </div>
        </div>

        <form className="form-grid" onSubmit={saveProfile}>
          <label>Nombre<input value={profileForm.nombre} onChange={(e) => setProfileForm({ ...profileForm, nombre: e.target.value })} /></label>
          <label>Peso actual<input value={profileForm.currentWeightKg} onChange={(e) => setProfileForm({ ...profileForm, currentWeightKg: e.target.value })} /></label>
          <label>Peso meta<input value={profileForm.targetWeightKg} onChange={(e) => setProfileForm({ ...profileForm, targetWeightKg: e.target.value })} /></label>
          <label>
            Estatura
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input 
                type="text"
                inputMode="numeric"
                placeholder="170"
                style={{ width: '100%', paddingRight: '40px' }}
                value={profileForm.heightCm} 
                onChange={(e) => setProfileForm({ ...profileForm, heightCm: e.target.value.replace(/\\D/g, '') })} 
              />
              <span style={{ position: 'absolute', right: '16px', pointerEvents: 'none' }} className="muted">cm</span>
            </div>
          </label>
          <label>Edad<input value={profileForm.age} onChange={(e) => setProfileForm({ ...profileForm, age: e.target.value })} /></label>
          <label>Calorias<input value={profileForm.dailyCalories} onChange={(e) => setProfileForm({ ...profileForm, dailyCalories: e.target.value })} /></label>
          <label>Entrenamientos/semana<input value={profileForm.trainingFrequency} onChange={(e) => setProfileForm({ ...profileForm, trainingFrequency: e.target.value })} /></label>
          <label>
            Objetivo
            <select value={profileForm.objective} onChange={(e) => setProfileForm({ ...profileForm, objective: e.target.value })}>
              <option value="bajar_peso">Bajar peso</option>
              <option value="subir_peso">Subir peso</option>
              <option value="mantenerme">Mantenerme</option>
              <option value="ganar_musculo">Ganar musculo</option>
            </select>
          </label>
          <label>
            Ritmo
            <select value={profileForm.desiredPace} onChange={(e) => setProfileForm({ ...profileForm, desiredPace: e.target.value })}>
              <option value="tranquilo">Tranquilo</option>
              <option value="equilibrado">Equilibrado</option>
              <option value="intenso">Intenso</option>
            </select>
          </label>
          <label>
            Actividad
            <select value={profileForm.activityLevel} onChange={(e) => setProfileForm({ ...profileForm, activityLevel: e.target.value })}>
              <option value="sedentario">Sedentario</option>
              <option value="ligero">Ligero</option>
              <option value="moderado">Moderado</option>
              <option value="alto">Alto</option>
              <option value="atleta">Atleta</option>
            </select>
          </label>
          <label>
            Genero
            <select value={profileForm.gender} onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
              <option value="otro">Otro</option>
            </select>
          </label>
          <button className="primary" type="submit">Guardar perfil</button>
        </form>
      </article>

      <article className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Seguimiento</p>
            <h2>Registrar peso</h2>
          </div>
        </div>
        <form className="form-grid" onSubmit={saveProgress}>
          <label>Peso de hoy<input value={progressForm.weightKg} onChange={(e) => setProgressForm({ ...progressForm, weightKg: e.target.value })} /></label>
          <label>Nota<input value={progressForm.notes} onChange={(e) => setProgressForm({ ...progressForm, notes: e.target.value })} /></label>
          <button className="ghost" type="submit">Guardar progreso</button>
        </form>
        <div className="history-list">
          {history.map((entry) => (
            <div key={entry.id} className="history-row">
              <strong>{entry.weightKg} kg</strong>
              <span>{entry.notes || 'Sin nota'}</span>
              <small>{new Date(entry.createdAt).toLocaleDateString('es-MX')}</small>
            </div>
          ))}
        </div>
      </article>

      <article className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Seguridad</p>
            <h2>Cambiar contrasena</h2>
            <p className="muted">Solo una vez cada 30 dias.</p>
          </div>
        </div>
        <form className="form-grid" onSubmit={changePassword}>
          <label>Contrasena actual<input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} /></label>
          <label>Nueva contrasena<input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} /></label>
          <button className="ghost" type="submit">Actualizar contrasena</button>
        </form>
      </article>
    </section>
  );
};

export default ProfilePage;
