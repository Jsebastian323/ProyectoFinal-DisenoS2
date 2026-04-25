import { useState } from 'react'
import { crearPersona, subirFoto, extraerError } from '../api.js'
import { notify } from '../ui/notifications.js'

const initial = {
  tipo_documento: 'Cedula',
  nro_documento: '',
  primer_nombre: '',
  segundo_nombre: '',
  apellidos: '',
  fecha_nacimiento: '',
  genero: 'Masculino',
  correo: '',
  celular: ''
}

export default function Crear() {
  const [form, setForm] = useState(initial)
  const [foto, setFoto] = useState(null)
  const [status, setStatus] = useState({ type: null, msg: '' })
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus({ type: null, msg: '' })
    try {
      const body = { ...form }
      if (!body.segundo_nombre) delete body.segundo_nombre
      const { data } = await crearPersona(body)
      let msg = `Persona creada con id ${data.id}.`
      if (foto) {
        try {
          await subirFoto(form.tipo_documento, form.nro_documento, foto)
          msg += ' Foto subida.'
        } catch (fe) {
          msg += ` Pero la foto fallo: ${extraerError(fe)}`
        }
      }
      setStatus({ type: 'ok', msg })
      notify.ok(msg)
      setForm(initial)
      setFoto(null)
      e.target.reset()
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
      <h2>Crear persona</h2>
      <form onSubmit={submit}>
        <label>Tipo de documento
          <select value={form.tipo_documento} onChange={set('tipo_documento')}>
            <option>Cedula</option>
            <option>Tarjeta de identidad</option>
          </select>
        </label>
        <label>Numero de documento
          <input value={form.nro_documento} onChange={set('nro_documento')}
                 required pattern="\d{1,10}" maxLength={10} placeholder="solo numeros, maximo 10" />
        </label>
        <label>Primer nombre
          <input value={form.primer_nombre} onChange={set('primer_nombre')} required maxLength={30} />
        </label>
        <label>Segundo nombre (opcional)
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
          <input value={form.celular} onChange={set('celular')} required pattern="\d{10}" maxLength={10} placeholder="10 digitos" />
        </label>
        <label>Foto (opcional)
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFoto(e.target.files[0] || null)} />
        </label>
        <button disabled={loading}>{loading ? 'Creando...' : 'Crear'}</button>
      </form>
      {status.type && <div className={`msg ${status.type}`}>{status.msg}</div>}
    </>
  )
}
