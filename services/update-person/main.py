"""
Microservicio: Actualizar persona.
Busca por tipo_documento + nro_documento (la llave segun el enunciado).
"""
from fastapi import FastAPI, Depends, HTTPException
from common.models import PersonaIn
from common.db import get_conn
from common.logger import log_action
from common.auth import verify_token

app = FastAPI(title="update-person")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.put("/")
def actualizar_persona(persona: PersonaIn, user=Depends(verify_token)):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            UPDATE persona SET
                primer_nombre=%s, segundo_nombre=%s, apellidos=%s,
                fecha_nacimiento=%s, genero=%s, correo=%s, celular=%s,
                updated_at=NOW()
            WHERE tipo_documento=%s AND nro_documento=%s
            RETURNING id
            """,
            (
                persona.primer_nombre,
                persona.segundo_nombre,
                persona.apellidos,
                persona.fecha_nacimiento,
                persona.genero.value,
                persona.correo,
                persona.celular,
                persona.tipo_documento.value,
                persona.nro_documento,
            ),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Persona no encontrada")
        pid = row[0]

    log_action(
        accion="UPDATE",
        usuario=user.get("email"),
        tipo_documento=persona.tipo_documento.value,
        nro_documento=persona.nro_documento,
        payload=persona.model_dump(mode="json"),
        resultado=f"id={pid}",
    )
    return {"id": pid, **persona.model_dump(mode="json")}
