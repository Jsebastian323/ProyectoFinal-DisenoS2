"""
Microservicio: Consultar persona por documento.
Este servicio corre en un contenedor INDEPENDIENTE.
Se habilita/deshabilita con:
    docker compose stop query-person
    docker compose start query-person
"""
from fastapi import FastAPI, Depends, HTTPException, Query
from common.db import get_conn
from common.logger import log_action
from common.auth import verify_token

app = FastAPI(title="query-person")

COLS = [
    "id", "tipo_documento", "nro_documento", "primer_nombre", "segundo_nombre",
    "apellidos", "fecha_nacimiento", "genero", "correo", "celular", "foto_path",
]
SELECT_COLS = ", ".join(COLS)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/")
def consultar(
    tipo_documento: str = Query(...),
    nro_documento: str = Query(...),
    user = Depends(verify_token),
):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            f"SELECT {SELECT_COLS} FROM persona WHERE tipo_documento=%s AND nro_documento=%s",
            (tipo_documento, nro_documento),
        )
        row = cur.fetchone()

    log_action(
        accion="QUERY",
        usuario=user.get("email"),
        tipo_documento=tipo_documento,
        nro_documento=nro_documento,
        resultado="encontrado" if row else "no_encontrado",
    )

    if not row:
        raise HTTPException(status_code=404, detail="Persona no encontrada")

    return dict(zip(COLS, row))


@app.get("/all")
def listar_todas(user=Depends(verify_token)):
    # Soporte para la galeria: lista todas las personas registradas.
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(f"SELECT {SELECT_COLS} FROM persona ORDER BY id DESC")
        rows = cur.fetchall()

    log_action(
        accion="QUERY",
        usuario=user.get("email"),
        resultado=f"galeria n={len(rows)}",
    )
    return [dict(zip(COLS, r)) for r in rows]
