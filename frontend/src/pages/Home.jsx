import { Link } from 'react-router-dom'

const tiles = [
  { to: '/crear', label: '1. Crear persona', desc: 'Registrar una persona nueva' },
  { to: '/modificar', label: '2. Modificar', desc: 'Actualizar datos existentes' },
  { to: '/consultar', label: '3. Consultar', desc: 'Buscar por tipo y numero de documento' },
  { to: '/chat', label: '4. Chat NL', desc: 'Preguntas en lenguaje natural (RAG con n8n)' },
  { to: '/borrar', label: '5. Borrar', desc: 'Eliminar una persona del sistema' },
  { to: '/log', label: '6. Log', desc: 'Historial de transacciones' }
]

export default function Home() {
  return (
    <>
      <h2>Bienvenido</h2>
      <p>Seleccioná una opcion del menu.</p>
      <div className="menu-grid">
        {tiles.map(t => (
          <Link to={t.to} key={t.to} className="menu-tile">
            <strong>{t.label}</strong>
            <p>{t.desc}</p>
          </Link>
        ))}
      </div>
    </>
  )
}
