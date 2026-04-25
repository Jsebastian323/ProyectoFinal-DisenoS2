"""
Microservicio: Eliminar persona por documento.
"""
from pathlib import Path
from fastapi import FastAPI, Depends, HTTPException
from common.db import get_conn
from common.logger import log_action
from common.auth import verify_token
from common.reindex import reindex_persona

MEDIA_DIR = Path("/app/media")

app = FastAPI(title="delete-person")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.delete("/")
def borrar(
    tipo_documento: str,
    nro_documento: str,
    user = Depends(verify_token),
):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            "DELETE FROM persona WHERE tipo_documento=%s AND nro_documento=%s RETURNING id",
            (tipo_documento, nro_documento),
        )
        row = cur.fetchone()

    log_action(
        accion="DELETE",
        usuario=user.get("email"),
        tipo_documento=tipo_documento,
        nro_documento=nro_documento,
        resultado="eliminado" if row else "no_encontrado",
    )
    if not row:
        raise HTTPException(status_code=404, detail="Persona no encontrada")
    deleted_id = row[0]

    # Borrar foto del disco (si existe). Cualquier extension permitida.
    if MEDIA_DIR.exists():
        for f in MEDIA_DIR.glob(f"{deleted_id}.*"):
            f.unlink(missing_ok=True)

    # CASCADE en persona_embedding ya borro el embedding viejo, pero llamamos
    # al webhook igual: el workflow es idempotente y el log de n8n queda
    # consistente con la accion.
    reindex_persona(deleted_id)
    return {"deleted_id": deleted_id}
