import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Field } from '../components/Field';
import { useAuth } from '../context/AuthContext';
export function Register() {
  const { register } = useAuth(); const navigate = useNavigate(); const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setError(''); const d = new FormData(event.currentTarget); try { await register({ firstName: String(d.get('firstName')), lastName: String(d.get('lastName')), birthDate: String(d.get('birthDate')), email: String(d.get('email')), password: String(d.get('password')) }); navigate('/'); } catch (e) { setError(e instanceof Error ? e.message : 'No se pudo crear la cuenta.'); } }
  return <section className="form-page"><form className="form-card" onSubmit={submit}><h1>Crear cuenta</h1><div className="form-row"><Field label="Nombre" name="firstName" required /><Field label="Apellido" name="lastName" required /></div><Field label="Fecha de nacimiento" name="birthDate" type="date" required /><Field label="Correo electrónico" name="email" type="email" required /><Field label="Contraseña" name="password" type="password" minLength={8} required />{error && <p className="error">{error}</p>}<button className="button" type="submit">Registrarme</button><p>¿Ya tienes cuenta? <Link to="/login">Ingresa</Link></p></form></section>;
}
