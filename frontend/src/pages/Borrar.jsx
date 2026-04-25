import { useState } from 'react'
import { borrarPersona, extraerError } from '../api.js'
import { notify } from '../ui/notifications.js'

export default function Borrar() {
  const [form, setForm] = useState({ tipo_documento: 'Cedula', nro_documento: '' })
  const [status, setStatus] = useState({ type: null, msg: '' })
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!confirm(`Seguro que queres borrar la persona ${form.tipo_documento} ${form.nro_documento}?`)) return
    setLoading(true)
    setStatus({ type: null, msg: '' })
    try {
      const { data } = await borrarPersona(form.tipo_documento, form.nro_documento)
      const msg = `Persona eliminada (id ${data.deleted_id}).`
      setStatus({ type: 'ok', msg })
      notify.ok(msg)
    } catch (err) {
      const m = extraerError(err)
      setStatus({ type: 'err', msg: m })
      notify.err(m)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h2>Borrar persona</h2>
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
        <button className="danger" disabled={loading}>{loading ? 'Borrando...' : 'Borrar'}</button>
      </form>
      {status.type && <div className={`msg ${status.type}`}>{status.msg}</div>}
    </>
  )
}
