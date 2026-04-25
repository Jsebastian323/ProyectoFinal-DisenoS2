"""
Microservicio: Actualizar persona.
Busca por tipo_documento + nro_documento (la llave segun el enunciado).

Tambien expone POST /foto para subir/reemplazar la foto. La foto se guarda en
un volumen Docker compartido (montado en /app/media) que Nginx sirve via
/media/<archivo>. El nombre del archivo es <persona_id>.<ext> para que el
update sobrescriba la anterior.
"""
import os
from pathlib import Path
from fastapi import FastAPI, Depends, HTTPException, File, UploadFile, Form
from common.models import PersonaIn
from common.db import get_conn
from common.logger import log_action
from common.auth import verify_token
from common.reindex import reindex_persona

MEDIA_DIR = Path("/app/media")
MEDIA_DIR.mkdir(parents=True, exist_ok=True)
ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".webp"}
MAX_BYTES = 5 * 1024 * 1024  # 5 MB

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
    reindex_persona(pid)
    return {"id": pid, **persona.model_dump(mode="json")}


@app.post("/foto")
async def subir_foto(
    tipo_documento: str = Form(...),
    nro_documento: str = Form(...),
    file: UploadFile = File(...),
    user=Depends(verify_token),
):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail=f"Extension no permitida ({sorted(ALLOWED_EXT)})")

    contenido = await file.read()
    if len(contenido) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="Archivo demasiado grande (max 5MB)")

    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            "SELECT id FROM persona WHERE tipo_documento=%s AND nro_documento=%s",
            (tipo_documento, nro_documento),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Persona no encontrada")
        pid = row[0]

        # Borrar archivo previo (si tenia otra extension).
        for f in MEDIA_DIR.glob(f"{pid}.*"):
            f.unlink(missing_ok=True)

        nombre = f"{pid}{ext}"
        (MEDIA_DIR / nombre).write_bytes(contenido)

        cur.execute(
            "UPDATE persona SET foto_path=%s, updated_at=NOW() WHERE id=%s",
            (nombre, pid),
        )

    log_action(
        accion="UPDATE",
        usuario=user.get("email"),
        tipo_documento=tipo_documento,
        nro_documento=nro_documento,
        payload={"foto_path": nombre},
        resultado=f"id={pid}",
    )
    reindex_persona(pid)
    return {"id": pid, "foto_path": nombre}
