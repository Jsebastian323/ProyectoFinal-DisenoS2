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
            """
            SELECT id, tipo_documento, nro_documento, primer_nombre, segundo_nombre,
                   apellidos, fecha_nacimiento, genero, correo, celular
            FROM persona
            WHERE tipo_documento=%s AND nro_documento=%s
            """,
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

    cols = ["id","tipo_documento","nro_documento","primer_nombre","segundo_nombre",
            "apellidos","fecha_nacimiento","genero","correo","celular"]
    return dict(zip(cols, row))
