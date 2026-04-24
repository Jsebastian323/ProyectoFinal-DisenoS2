import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword, resetPassword } from '../auth.js'

// Dos pasos: pedir email (Roble manda token al correo) -> pegar token + nueva password.
export default function ForgotPassword() {
  const [step, setStep] = useState('email') // 'email' | 'reset' | 'done'
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const mostrarError = (err) => {
    const msg = err?.response?.data?.message || err?.message || 'Error'
    setError(Array.isArray(msg) ? msg.join(', ') : msg)
  }

  const pedir = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await forgotPassword(email)
      setStep('reset')
    } catch (err) { mostrarError(err) } finally { setLoading(false) }
  }

  const restablecer = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      await resetPassword(token, newPassword)
      setStep('done')
    } catch (err) { mostrarError(err) } finally { setLoading(false) }
  }

  return (
    <div style={{ maxWidth: '420px', margin: '3rem auto' }}>
      <h2>Recuperar contrasena</h2>

      {step === 'email' && (
        <form onSubmit={pedir}>
          <label>Correo
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          </label>
          <button disabled={loading}>{loading ? 'Enviando...' : 'Enviar codigo'}</button>
        </form>
      )}

      {step === 'reset' && (
        <>
          <div className="msg ok">Te enviamos un codigo a <strong>{email}</strong>.</div>
          <form onSubmit={restablecer} style={{ marginTop: '1rem' }}>
            <label>Codigo / token recibido
              <input value={token} onChange={(e) => setToken(e.target.value)} required />
            </label>
            <label>Nueva contrasena
              <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                     required minLength={8}
                     placeholder="min 8 chars, mayus, minus, numero y simbolo" />
            </label>
            <button disabled={loading}>{loading ? 'Guardando...' : 'Restablecer contrasena'}</button>
          </form>
        </>
      )}

      {step === 'done' && (
        <>
          <div className="msg ok">Contrasena actualizada. Ya podes iniciar sesion.</div>
          <p style={{ marginTop: '1rem' }}><Link to="/login">Ir al login</Link></p>
        </>
      )}

      {error && <div className="msg err">{error}</div>}
      <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
        <Link to="/login">Volver al login</Link>
      </p>
    </div>
  )
}
