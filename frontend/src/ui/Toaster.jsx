import { useEffect, useState } from 'react'

// Recibe eventos 'app:toast' y muestra una pila de toasts en bottom-right.
// Auto-descartan a los 3.5s. Maximo 4 visibles.
export default function Toaster() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const handler = (e) => {
      const t = e.detail
      setToasts((prev) => [...prev.slice(-3), t])
      setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== t.id))
      }, 3500)
    }
    window.addEventListener('app:toast', handler)
    return () => window.removeEventListener('app:toast', handler)
  }, [])

  if (toasts.length === 0) return null
  return (
    <div className="toaster">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>
      ))}
    </div>
  )
}
