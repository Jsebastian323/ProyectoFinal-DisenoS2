"""
Microservicio: Eliminar persona por documento.
"""
from fastapi import FastAPI, Depends, HTTPException
from common.db import get_conn
from common.logger import log_action
from common.auth import verify_token

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
    return {"deleted_id": row[0]}
