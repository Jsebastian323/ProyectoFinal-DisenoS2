import { useEffect, useState } from 'react'

// Barra de progreso indeterminada arriba del viewport mientras haya requests
// pendientes. El interceptor de axios dispara los eventos start / end.
export default function LoadingBar() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const start = () => setCount((c) => c + 1)
    const end = () => setCount((c) => Math.max(0, c - 1))
    window.addEventListener('app:loading-start', start)
    window.addEventListener('app:loading-end', end)
    return () => {
      window.removeEventListener('app:loading-start', start)
      window.removeEventListener('app:loading-end', end)
    }
  }, [])

  return <div className={`loading-bar ${count > 0 ? 'visible' : ''}`} aria-hidden="true" />
}
