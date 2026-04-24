import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signup, verifyEmail, login } from '../auth.js'

// Flujo de 2 pasos:
// 1) Usuario llena email + password + name -> POST /signup -> Roble manda codigo al correo.
// 2) Usuario ingresa el codigo -> POST /verify-email -> listo. Se loguea automatico y redirige.
export default function Signup() {
  const [step, setStep] = useState('datos')  // 'datos' | 'codigo'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const mostrarError = (err) => {
    const msg = err?.response?.data?.message || err?.message || 'Error'
    setError(Array.isArray(msg) ? msg.join(', ') : msg)
  }

  const submitDatos = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await signup(email, password, name)
      setStep('codigo')
    } catch (err) {
      mostrarError(err)
    } finally { setLoading(false) }
  }

  const submitCodigo = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await verifyEmail(email, code)
      // Login automatico para no obligar al usuario a retipear.
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err) {
      mostrarError(err)
    } finally { setLoading(false) }
  }

  return (
    <div style={{ maxWidth: '420px', margin: '3rem auto' }}>
      <h2>Crear cuenta</h2>

      {step === 'datos' && (
        <>
          <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
            Regístrate con tu correo institucional. Te enviaremos un código de verificación.
          </p>
          <form onSubmit={submitDatos}>
            <label>Nombre completo
              <input value={name} onChange={(e) => setName(e.target.value)} required />
            </label>
            <label>Correo
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label>Contrasena
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                     minLength={8} placeholder="min 8 chars, mayus, minus, numero y simbolo (!@#$_-)" />
            </label>
            <button disabled={loading}>{loading ? 'Registrando...' : 'Registrarme'}</button>
          </form>
          <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
            ¿Ya tienes cuenta? <Link to="/login">Iniciar sesion</Link>
          </p>
        </>
      )}

      {step === 'codigo' && (
        <>
          <div className="msg ok">
            Te enviamos un codigo a <strong>{email}</strong>. Revisa tu bandeja (y spam).
          </div>
          <form onSubmit={submitCodigo} style={{ marginTop: '1rem' }}>
            <label>Codigo de verificacion
              <input value={code} onChange={(e) => setCode(e.target.value)} required
                     placeholder="6 digitos" autoFocus />
            </label>
            <button disabled={loading}>{loading ? 'Verificando...' : 'Verificar y entrar'}</button>
          </form>
          <p style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#6b7280' }}>
            ¿No recibiste el codigo? Revisa spam o <button type="button" onClick={() => setStep('datos')}
              style={{ background: 'none', color: '#3b82f6', padding: 0, textDecoration: 'underline' }}>
              volver atras
            </button>.
          </p>
        </>
      )}

      {error && <div className="msg err">{error}</div>}
    </div>
  )
}
