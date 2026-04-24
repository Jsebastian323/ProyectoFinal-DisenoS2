import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { login } from '../auth.js'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const from = location.state?.from?.pathname || '/'

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Error al iniciar sesion'
      setError(Array.isArray(msg) ? msg.join(', ') : msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: '420px', margin: '3rem auto' }}>
      <h2>Iniciar sesion</h2>
      <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
        Usa tu cuenta de <strong>Proyecto Roble</strong> (correo @uninorte.edu.co).
      </p>
      <form onSubmit={submit}>
        <label>Correo
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
        </label>
        <label>Contrasena
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        <button disabled={loading}>{loading ? 'Entrando...' : 'Iniciar sesion'}</button>
      </form>
      {error && <div className="msg err">{error}</div>}
      <div style={{ marginTop: '1.5rem', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between' }}>
        <Link to="/signup">Crear cuenta</Link>
        <Link to="/forgot-password">Olvide mi contrasena</Link>
      </div>
    </div>
  )
}
