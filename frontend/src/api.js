import axios from 'axios'

// En dev, Vite proxea /api al gateway (localhost:8080).
// En prod, Nginx sirve el frontend y los endpoints /api en el mismo origen.
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

export const crearPersona = (data) => api.post('/create/', data)
export const modificarPersona = (data) => api.put('/update/', data)
export const consultarPersona = (tipo_documento, nro_documento) =>
  api.get('/query/', { params: { tipo_documento, nro_documento } })
export const borrarPersona = (tipo_documento, nro_documento) =>
  api.delete('/delete/', { params: { tipo_documento, nro_documento } })
export const consultarLog = (filtros) => api.get('/log/', { params: filtros })

export function extraerError(err) {
  const detail = err?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.map(d => d.msg || JSON.stringify(d)).join('; ')
  if (detail) return JSON.stringify(detail)
  return err?.message || 'Error desconocido'
}
