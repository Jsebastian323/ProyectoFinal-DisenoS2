import { useState } from 'react'
import { consultarLog, extraerError } from '../api.js'

export default function Log() {
  const [filtros, setFiltros] = useState({ tipo_documento: '', nro_documento: '', desde: '', hasta: '' })
  const [rows, setRows] = useState([])
  const [status, setStatus] = useState({ type: null, msg: '' })
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setFiltros({ ...filtros, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus({ type: null, msg: '' })
    setRows([])
    try {
      const params = {}
      if (filtros.tipo_documento && filtros.nro_documento) {
        params.tipo_documento = filtros.tipo_documento
        params.nro_documento = filtros.nro_documento
      }
      if (filtros.desde) params.desde = `${filtros.desde}T00:00:00`
      if (filtros.hasta) params.hasta = `${filtros.hasta}T23:59:59`
      const { data } = await consultarLog(params)
      setRows(data)
      if (data.length === 0) setStatus({ type: 'ok', msg: 'Sin resultados con esos filtros.' })
    } catch (err) {
      setStatus({ type: 'err', msg: extraerError(err) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h2>Log de transacciones</h2>
      <p>Filtros opcionales. Sin filtros trae los 500 registros mas recientes.</p>
      <form onSubmit={submit}>
        <label>Tipo de documento
          <select value={filtros.tipo_documento} onChange={set('tipo_documento')}>
            <option value="">(cualquiera)</option>
            <option>Cedula</option>
            <option>Tarjeta de identidad</option>
          </select>
        </label>
        <label>Numero de documento
          <input value={filtros.nro_documento} onChange={set('nro_documento')} pattern="\d{1,10}" maxLength={10} />
        </label>
        <label>Desde
          <input type="date" value={filtros.desde} onChange={set('desde')} />
        </label>
        <label>Hasta
          <input type="date" value={filtros.hasta} onChange={set('hasta')} />
        </label>
        <button disabled={loading}>{loading ? 'Consultando...' : 'Consultar log'}</button>
      </form>

      {status.type && <div className={`msg ${status.type}`}>{status.msg}</div>}

      {rows.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Accion</th>
              <th>Usuario</th>
              <th>Tipo</th>
              <th>Nro</th>
              <th>Resultado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.id}>
                <td>{new Date(r.fecha).toLocaleString()}</td>
                <td>{r.accion}</td>
                <td>{r.usuario || '-'}</td>
                <td>{r.tipo_documento || '-'}</td>
                <td>{r.nro_documento || '-'}</td>
                <td style={{ fontSize: '0.8rem' }}>{r.resultado || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  )
}
