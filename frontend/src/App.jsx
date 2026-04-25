import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Crear from './pages/Crear.jsx'
import Modificar from './pages/Modificar.jsx'
import Consultar from './pages/Consultar.jsx'
import ChatNL from './pages/ChatNL.jsx'
import Borrar from './pages/Borrar.jsx'
import Log from './pages/Log.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import Galeria from './pages/Galeria.jsx'
import RequireAuth from './RequireAuth.jsx'
import Toaster from './ui/Toaster.jsx'
import LoadingBar from './ui/LoadingBar.jsx'
import { getUser, logout } from './auth.js'

const nav = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/crear', label: 'Crear' },
  { to: '/modificar', label: 'Modificar' },
  { to: '/consultar', label: 'Consultar' },
  { to: '/chat', label: 'Chat NL' },
  { to: '/borrar', label: 'Borrar' },
  { to: '/log', label: 'Log' }
]

function UserBox() {
  const user = getUser()
  const navigate = useNavigate()
  if (!user) return null
  const salir = async () => {
    await logout()
    navigate('/login', { replace: true })
  }
  return (
    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.85rem', color: '#d1d5db' }}>
      <span>{user.email}</span>
      <button onClick={salir} style={{ padding: '0.25rem 0.75rem', fontSize: '0.8rem' }}>Salir</button>
    </div>
  )
}

export default function App() {
  return (
    <div className="layout">
      <LoadingBar />
      <header>
        <h1>Gestion de Datos Personales</h1>
        <nav>
          {nav.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end}>{label}</NavLink>
          ))}
          <UserBox />
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
          <Route path="/crear" element={<RequireAuth><Crear /></RequireAuth>} />
          <Route path="/modificar" element={<RequireAuth><Modificar /></RequireAuth>} />
          <Route path="/consultar" element={<RequireAuth><Consultar /></RequireAuth>} />
          <Route path="/chat" element={<RequireAuth><ChatNL /></RequireAuth>} />
          <Route path="/borrar" element={<RequireAuth><Borrar /></RequireAuth>} />
          <Route path="/log" element={<RequireAuth><Log /></RequireAuth>} />
          <Route path="/galeria" element={<RequireAuth><Galeria /></RequireAuth>} />
        </Routes>
      </main>
      <footer>
        Diseno de Software 2 &middot; Trabajo final &middot; Grupo de 4
      </footer>
      <Toaster />
    </div>
  )
}
