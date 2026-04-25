import { useEffect } from 'react'
import { createChat } from '@n8n/chat'
import '@n8n/chat/style.css'

// Webhook del Chat Trigger del workflow "02 - Chat RAG" de n8n.
// Cada miembro del equipo tiene su propio webhookId al importar el workflow,
// asi que se configura por env var (frontend/.env -> VITE_CHAT_WEBHOOK_URL).
// Si la variable no esta definida, usa el webhookId del laptop de Juan
// (sirve como fallback para que el repo arranque "out-of-the-box" en demo).
const CHAT_WEBHOOK_URL =
  import.meta.env.VITE_CHAT_WEBHOOK_URL ||
  'http://localhost:5678/webhook/8955cdc6-0dc0-41a5-8988-027752d0f7de/chat'

export default function ChatNL() {
  useEffect(() => {
    createChat({
      webhookUrl: CHAT_WEBHOOK_URL,
      mode: 'fullscreen',
      target: '#n8n-chat',
      showWelcomeScreen: false,
      initialMessages: [
        '¡Hola! Preguntame cualquier cosa sobre las personas registradas en el sistema.'
      ],
      i18n: {
        en: {
          title: 'Chat RAG',
          subtitle: 'Consulta en lenguaje natural',
          footer: '',
          getStarted: 'Nueva conversacion',
          inputPlaceholder: 'Escribi tu pregunta...',
          closeButtonTooltip: 'Cerrar'
        }
      }
    })
  }, [])

  return (
    <>
      <h2>Consulta en lenguaje natural</h2>
      <p>
        Chat conectado al workflow <strong>02 - Chat RAG</strong> de n8n. Convierte tu pregunta en un
        embedding, busca las personas mas similares en <code>persona_embedding</code> con pgvector, y
        un LLM responde usando ese contexto.
      </p>
      <p>Ejemplos: <em>"quien es Sofia"</em>, <em>"dame el correo de Juan Sebastian"</em>, <em>"que personas tienen cedula"</em>.</p>
      <div
        id="n8n-chat"
        style={{
          height: '600px',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          overflow: 'hidden',
          marginTop: '1rem',
          background: 'white'
        }}
      />
    </>
  )
}
