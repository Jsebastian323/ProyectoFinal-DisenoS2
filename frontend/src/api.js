import axios from 'axios'
import { getAccessToken, refreshAccessToken, clearAuth } from './auth.js'
import { loadingStart, loadingEnd } from './ui/notifications.js'

// En dev, Vite proxea /api al gateway (localhost:8080).
// En prod, Nginx sirve el frontend y los endpoints /api en el mismo origen.
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

// Interceptor request: agrega Bearer token + dispara LoadingBar.
api.interceptors.request.use((config) => {
  loadingStart()
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Interceptor response: cierra LoadingBar y, si 401, intenta refresh + reintenta.
let refreshing = null
api.interceptors.response.use(
  (r) => {
    loadingEnd()
    return r
  },
  async (err) => {
    loadingEnd()
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
export const consultarTodas = () => api.get('/query/all')
export const borrarPersona = (tipo_documento, nro_documento) =>
  api.delete('/delete/', { params: { tipo_documento, nro_documento } })
export const consultarLog = (filtros) => api.get('/log/', { params: filtros })

export function subirFoto(tipo_documento, nro_documento, file) {
  const fd = new FormData()
  fd.append('tipo_documento', tipo_documento)
  fd.append('nro_documento', nro_documento)
  fd.append('file', file)
  return api.post('/update/foto', fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// URL publica para mostrar una foto (Nginx la sirve desde el volumen).
export const fotoUrl = (foto_path) => foto_path ? `/media/${foto_path}` : null

export function extraerError(err) {
  const detail = err?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.map(d => d.msg || JSON.stringify(d)).join('; ')
  if (detail) return JSON.stringify(detail)
  return err?.message || 'Error desconocido'
}
