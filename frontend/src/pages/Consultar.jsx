import { useState } from 'react'
import { Link } from 'react-router-dom'
import { consultarPersona, fotoUrl, extraerError } from '../api.js'

export default function Consultar() {
  const [form, setForm] = useState({ tipo_documento: 'Cedula', nro_documento: '' })
  const [result, setResult] = useState(null)
  const [status, setStatus] = useState({ type: null, msg: '' })
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus({ type: null, msg: '' })
    setResult(null)
    try {
      const { data } = await consultarPersona(form.tipo_documento, form.nro_documento)
      setResult(data)
    } catch (err) {
      setStatus({ type: 'err', msg: extraerError(err) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h2>Consultar persona</h2>
      <form onSubmit={submit}>
        <label>Tipo de documento
          <select value={form.tipo_documento} onChange={(e) => setForm({ ...form, tipo_documento: e.target.value })}>
            <option>Cedula</option>
            <option>Tarjeta de identidad</option>
          </select>
        </label>
        <label>Numero de documento
          <input value={form.nro_documento} onChange={(e) => setForm({ ...form, nro_documento: e.target.value })}
                 required pattern="\d{1,10}" maxLength={10} />
        </label>
        <button disabled={loading}>{loading ? 'Buscando...' : 'Consultar'}</button>
      </form>

      {status.type && <div className={`msg ${status.type}`}>{status.msg}</div>}

      {result && (
        <>
          {result.foto_path && (
            <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
              <img src={fotoUrl(result.foto_path)} alt={result.primer_nombre}
                   style={{ maxWidth: '220px', maxHeight: '220px', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }} />
            </div>
          )}
          <table>
            <tbody>
              {Object.entries(result).filter(([k]) => k !== 'foto_path').map(([k, v]) => (
                <tr key={k}>
                  <th style={{ width: '35%' }}>{k}</th>
                  <td>{v == null || v === '' ? '-' : String(v)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <p style={{ marginTop: '1.5rem', fontSize: '0.9rem' }}>
        ¿Quieres ver todas las personas registradas? <Link to="/galeria">Ir a la galeria</Link>
      </p>
    </>
  )
}
