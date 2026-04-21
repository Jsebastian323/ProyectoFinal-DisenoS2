# n8n — Chat RAG

Contenedor n8n donde vive el workflow que implementa el patron RAG:

1. **Trigger:** Chat Trigger de n8n (expone `/webhook/chat` y UI de chat).
2. **Embeddings:** nodo OpenAI Embeddings para convertir la pregunta a vector.
3. **Recuperacion:** nodo Postgres con query sobre `persona_embedding` usando
   operador `<=>` (cosine distance) + `LIMIT k`.
4. **Generacion:** nodo OpenAI Chat con prompt que incluye el contexto recuperado.
5. **Log:** nodo HTTP Request a `http://log-service:8000/internal/log` con accion
   `NL_QUERY`, la pregunta y la respuesta.

Los workflows exportados (JSON) deben guardarse en `n8n/workflows/` y se montan
en el contenedor en `/workflows` (solo lectura) para que queden versionados.

Acceso: http://localhost:5678 (user/pass definidos en `.env`).
