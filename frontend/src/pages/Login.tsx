import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Field } from '../components/Field';
import { useAuth } from '../context/AuthContext';
export function Login() {
  const { login } = useAuth(); const navigate = useNavigate(); const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setError(''); const d = new FormData(event.currentTarget); try { await login({ email: String(d.get('email')), password: String(d.get('password')) }); navigate('/'); } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo ingresar.'); } }
  return <section className="form-page"><form className="form-card" onSubmit={submit}><h1>Ingresar</h1><Field label="Correo electrónico" name="email" type="email" required /><Field label="Contraseña" name="password" type="password" required />{error && <p className="error">{error}</p>}<button className="button" type="submit">Ingresar</button><p>¿No tienes cuenta? <Link to="/register">Regístrate</Link></p></form></section>;
}
