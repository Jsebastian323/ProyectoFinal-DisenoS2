import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { consultarTodas, fotoUrl, extraerError } from '../api.js'

// Mini-galeria con thumbs de todas las personas registradas.
export default function Galeria() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    consultarTodas()
      .then((r) => setRows(r.data))
      .catch((e) => setError(extraerError(e)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p>Cargando...</p>
  if (error) return <div className="msg err">{error}</div>

  return (
    <>
      <h2>Galeria de personas registradas</h2>
      <p style={{ color: '#6b7280' }}>
        {rows.length} {rows.length === 1 ? 'persona registrada' : 'personas registradas'}.
      </p>

      {rows.length === 0 ? (
        <p>Aun no hay personas. <Link to="/crear">Crear la primera</Link>.</p>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '1rem',
          marginTop: '1rem'
        }}>
          {rows.map(p => (
            <div key={p.id} style={{
              background: 'white',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              padding: '0.75rem',
              textAlign: 'center'
            }}>
              {p.foto_path ? (
                <img src={fotoUrl(p.foto_path)} alt={p.primer_nombre}
                     style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: '6px' }} />
              ) : (
                <div style={{
                  width: '100%', aspectRatio: '1', borderRadius: '6px',
                  background: '#f3f4f6', color: '#9ca3af',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '2rem'
                }}>
                  {(p.primer_nombre[0] || '?').toUpperCase()}
                </div>
              )}
              <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', fontWeight: 600 }}>
                {[p.primer_nombre, p.segundo_nombre, p.apellidos].filter(Boolean).join(' ')}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                {p.tipo_documento} {p.nro_documento}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
