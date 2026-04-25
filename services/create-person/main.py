"""
Microservicio: Crear personas.
Responsable del endpoint POST / para insertar una nueva persona.
"""
from fastapi import FastAPI, Depends, HTTPException
from common.models import PersonaIn
from common.db import get_conn
from common.logger import log_action
from common.auth import verify_token
from common.reindex import reindex_persona

app = FastAPI(title="create-person")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/", status_code=201)
def crear_persona(persona: PersonaIn, user=Depends(verify_token)):
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO persona (
                tipo_documento, nro_documento, primer_nombre, segundo_nombre,
                apellidos, fecha_nacimiento, genero, correo, celular
            ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
            RETURNING id
            """,
            (
                persona.tipo_documento.value,
                persona.nro_documento,
                persona.primer_nombre,
                persona.segundo_nombre,
                persona.apellidos,
                persona.fecha_nacimiento,
                persona.genero.value,
                persona.correo,
                persona.celular,
            ),
        )
        new_id = cur.fetchone()[0]

    log_action(
        accion="CREATE",
        usuario=user.get("email"),
        tipo_documento=persona.tipo_documento.value,
        nro_documento=persona.nro_documento,
        payload=persona.model_dump(mode="json"),
        resultado=f"id={new_id}",
    )
    reindex_persona(new_id)
    return {"id": new_id, "foto_path": None, **persona.model_dump(mode="json")}
