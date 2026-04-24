// Auth client que consume el SSO de Roble directamente (tiene CORS abierto).
// Guarda accessToken + refreshToken + user en localStorage.
// Expone helpers para login, logout, leer user, y un refresh automatico
// (lo usa el interceptor de api.js cuando un /api/* responde 401).
import axios from 'axios'

const ROBLE_BASE = 'https://roble-api.openlab.uninorte.edu.co'
const DB_NAME = 'diseno2gestion_61540ca813'
const AUTH = `${ROBLE_BASE}/auth/${DB_NAME}`

const roble = axios.create({ baseURL: AUTH })

export async function login(email, password) {
  const { data } = await roble.post('/login', { email, password })
  localStorage.setItem('accessToken', data.accessToken)
  localStorage.setItem('refreshToken', data.refreshToken)
  localStorage.setItem('user', JSON.stringify(data.user))
  return data.user
}

export async function signup(email, password, name) {
  // Roble envia un codigo de verificacion al correo. Luego el usuario
  // debe llamar verifyEmail con ese codigo para activar la cuenta.
  const { data } = await roble.post('/signup', { email, password, name })
  return data
}

export async function verifyEmail(email, code) {
  const { data } = await roble.post('/verify-email', { email, code })
  return data
}

export async function forgotPassword(email) {
  const { data } = await roble.post('/forgot-password', { email })
  return data
}

export async function resetPassword(token, newPassword) {
  const { data } = await roble.post('/reset-password', { token, newPassword })
  return data
}

export async function logout() {
  const token = getAccessToken()
  try {
    if (token) {
      await roble.post('/logout', null, {
        headers: { Authorization: `Bearer ${token}` }
      })
    }
  } catch { /* ignorar errores: igual limpiamos el storage */ }
  clearAuth()
}

export async function refreshAccessToken() {
  const refreshToken = localStorage.getItem('refreshToken')
  if (!refreshToken) throw new Error('No refresh token')
  const { data } = await roble.post('/refresh-token', { refreshToken })
  localStorage.setItem('accessToken', data.accessToken)
  if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken)
  return data.accessToken
}

export function getAccessToken() {
  return localStorage.getItem('accessToken')
}

export function getUser() {
  const raw = localStorage.getItem('user')
  return raw ? JSON.parse(raw) : null
}

export function clearAuth() {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('user')
}
