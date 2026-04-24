import { useState } from 'react'
import { consultarPersona, modificarPersona, extraerError } from '../api.js'

export default function Modificar() {
  const [busqueda, setBusqueda] = useState({ tipo_documento: 'Cedula', nro_documento: '' })
  const [form, setForm] = useState(null)
  const [status, setStatus] = useState({ type: null, msg: '' })
  const [loading, setLoading] = useState(false)

  const setBusq = (k) => (e) => setBusqueda({ ...busqueda, [k]: e.target.value })
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const buscar = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus({ type: null, msg: '' })
    setForm(null)
    try {
      const { data } = await consultarPersona(busqueda.tipo_documento, busqueda.nro_documento)
      setForm({ ...data, segundo_nombre: data.segundo_nombre || '' })
    } catch (err) {
      setStatus({ type: 'err', msg: extraerError(err) })
    } finally {
      setLoading(false)
    }
  }

  const actualizar = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus({ type: null, msg: '' })
    try {
      const body = { ...form }
      delete body.id
      if (!body.segundo_nombre) delete body.segundo_nombre
      await modificarPersona(body)
      setStatus({ type: 'ok', msg: `Persona ${body.tipo_documento} ${body.nro_documento} actualizada.` })
    } catch (err) {
      setStatus({ type: 'err', msg: extraerError(err) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h2>Modificar persona</h2>
      <form onSubmit={buscar}>
        <label>Tipo de documento
          <select value={busqueda.tipo_documento} onChange={setBusq('tipo_documento')}>
            <option>Cedula</option>
            <option>Tarjeta de identidad</option>
          </select>
        </label>
        <label>Numero de documento
          <input value={busqueda.nro_documento} onChange={setBusq('nro_documento')}
                 required pattern="\d{1,10}" maxLength={10} />
        </label>
        <button disabled={loading}>{loading ? 'Buscando...' : 'Buscar'}</button>
      </form>

      {status.type === 'err' && <div className="msg err">{status.msg}</div>}

      {form && (
        <>
          <hr className="sep" />
          <h3>Datos actuales (editá lo que quieras cambiar)</h3>
          <form onSubmit={actualizar}>
            <label>Primer nombre
              <input value={form.primer_nombre} onChange={set('primer_nombre')} required maxLength={30} />
            </label>
            <label>Segundo nombre
              <input value={form.segundo_nombre} onChange={set('segundo_nombre')} maxLength={30} />
            </label>
            <label>Apellidos
              <input value={form.apellidos} onChange={set('apellidos')} required maxLength={60} />
            </label>
            <label>Fecha de nacimiento
              <input type="date" value={form.fecha_nacimiento} onChange={set('fecha_nacimiento')} required />
            </label>
            <label>Genero
              <select value={form.genero} onChange={set('genero')}>
                <option>Masculino</option>
                <option>Femenino</option>
                <option>No binario</option>
                <option>Prefiero no reportar</option>
              </select>
            </label>
            <label>Correo
              <input type="email" value={form.correo} onChange={set('correo')} required maxLength={120} />
            </label>
            <label>Celular
              <input value={form.celular} onChange={set('celular')} required pattern="\d{10}" maxLength={10} />
            </label>
            <button disabled={loading}>{loading ? 'Actualizando...' : 'Actualizar'}</button>
          </form>
        </>
      )}

      {status.type === 'ok' && <div className="msg ok">{status.msg}</div>}
    </>
  )
}
