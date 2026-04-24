import { Routes, Route, NavLink } from 'react-router-dom'
import Home from './pages/Home.jsx'
import Crear from './pages/Crear.jsx'
import Modificar from './pages/Modificar.jsx'
import Consultar from './pages/Consultar.jsx'
import ChatNL from './pages/ChatNL.jsx'
import Borrar from './pages/Borrar.jsx'
import Log from './pages/Log.jsx'

const nav = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/crear', label: 'Crear' },
  { to: '/modificar', label: 'Modificar' },
  { to: '/consultar', label: 'Consultar' },
  { to: '/chat', label: 'Chat NL' },
  { to: '/borrar', label: 'Borrar' },
  { to: '/log', label: 'Log' }
]

export default function App() {
  return (
    <div className="layout">
      <header>
        <h1>Gestion de Datos Personales</h1>
        <nav>
          {nav.map(({ to, label, end }) => (
            <NavLink key={to} to={to} end={end}>{label}</NavLink>
          ))}
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/crear" element={<Crear />} />
          <Route path="/modificar" element={<Modificar />} />
          <Route path="/consultar" element={<Consultar />} />
          <Route path="/chat" element={<ChatNL />} />
          <Route path="/borrar" element={<Borrar />} />
          <Route path="/log" element={<Log />} />
        </Routes>
      </main>
      <footer>
        Diseno de Software 2 &middot; Trabajo final &middot; Grupo de 4
      </footer>
    </div>
  )
}
