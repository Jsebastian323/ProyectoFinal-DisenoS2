import axios from 'axios'
import { getAccessToken, refreshAccessToken, clearAuth } from './auth.js'

// En dev, Vite proxea /api al gateway (localhost:8080).
// En prod, Nginx sirve el frontend y los endpoints /api en el mismo origen.
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

// Interceptor request: agrega Bearer token si hay sesion.
api.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Interceptor response: si 401 y no intentamos refresh aun, probamos refresh + reintentar.
let refreshing = null
api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const original = err.config
    if (err?.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        refreshing = refreshing || refreshAccessToken()
        const newToken = await refreshing
        refreshing = null
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch (refreshErr) {
        refreshing = null
        clearAuth()
        window.location.href = '/login'
        return Promise.reject(refreshErr)
      }
    }
    return Promise.reject(err)
  }
)

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
