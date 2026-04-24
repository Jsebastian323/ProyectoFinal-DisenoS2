import { Navigate, useLocation } from 'react-router-dom'
import { getAccessToken } from './auth.js'

// Envuelve las rutas privadas. Si no hay sesion, redirige a /login
// preservando la ruta destino para volver despues de autenticarse.
export default function RequireAuth({ children }) {
  const location = useLocation()
  if (!getAccessToken()) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return children
}
