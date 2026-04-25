"""
Helper fire-and-forget para avisarle a n8n que re-indexe una persona.

Cada microservicio que modifica persona (create, update, delete) llama
reindex_persona(id) al final de su operacion. El workflow 3 de n8n
(`03 - Indexar persona`) borra el embedding viejo y, si la persona aun
existe en la DB, genera uno nuevo con Gemini.

Swallow errors: si n8n esta caido o la URL no esta configurada, se
loggea pero NO se rompe la respuesta al cliente. El CRUD tiene que
seguir funcionando aunque el RAG este offline.
"""
import os
import sys
import httpx

N8N_INDEX_WEBHOOK_URL = os.getenv("N8N_INDEX_WEBHOOK_URL", "").strip()


def reindex_persona(persona_id: int) -> None:
    if not N8N_INDEX_WEBHOOK_URL:
        return
    try:
        httpx.post(
            N8N_INDEX_WEBHOOK_URL,
            json={"persona_id": persona_id},
            timeout=2.0,
        )
    except Exception as e:
        print(f"[reindex] fallo al llamar webhook: {e}", file=sys.stderr)
