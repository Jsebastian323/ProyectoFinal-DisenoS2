"""
Microservicio: Consulta del log de transacciones.
Filtra por tipo_documento + nro_documento, o por rango de fechas.
Expone ademas un endpoint interno para que n8n registre NL_QUERY.
"""
from datetime import datetime
from typing import Optional
from fastapi import FastAPI, Depends, Query
from pydantic import BaseModel
from common.db import get_conn
from common.auth import verify_token
from common.logger import log_action

app = FastAPI(title="log-service")


class LogEntry(BaseModel):
    accion: str
    usuario: Optional[str] = None
    tipo_documento: Optional[str] = None
    nro_documento: Optional[str] = None
    payload: Optional[dict] = None
    resultado: Optional[str] = None


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/internal/log", status_code=201)
def registrar_log(entry: LogEntry):
    # Endpoint interno (sin auth): n8n lo llama desde la red compose para
    # registrar preguntas/respuestas del chat NL. Nginx no lo expone.
    log_action(**entry.model_dump())
    return {"status": "logged"}


@app.get("/")
def consultar_log(
    tipo_documento: Optional[str] = None,
    nro_documento:  Optional[str] = None,
    desde: Optional[datetime] = Query(None),
    hasta: Optional[datetime] = Query(None),
    user = Depends(verify_token),
):
    where = []
    params: list = []
    if tipo_documento and nro_documento:
        where.append("tipo_documento=%s AND nro_documento=%s")
        params.extend([tipo_documento, nro_documento])
    if desde:
        where.append("fecha >= %s")
        params.append(desde)
    if hasta:
        where.append("fecha <= %s")
        params.append(hasta)

    sql = "SELECT id, fecha, usuario, accion, tipo_documento, nro_documento, payload, resultado FROM transaction_log"
    if where:
        sql += " WHERE " + " AND ".join(where)
    sql += " ORDER BY fecha DESC LIMIT 500"

    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(sql, params)
        rows = cur.fetchall()

    cols = ["id","fecha","usuario","accion","tipo_documento","nro_documento","payload","resultado"]
    return [dict(zip(cols, r)) for r in rows]
