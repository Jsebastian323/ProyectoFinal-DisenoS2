"""
Helper para registrar transacciones en transaction_log.
Todos los microservicios deben llamar log_action al terminar una operacion.
"""
import json
from typing import Optional
from .db import get_conn


def log_action(
    accion: str,
    usuario: Optional[str] = None,
    tipo_documento: Optional[str] = None,
    nro_documento: Optional[str] = None,
    payload: Optional[dict] = None,
    resultado: Optional[str] = None,
) -> None:
    with get_conn() as conn, conn.cursor() as cur:
        cur.execute(
            """
            INSERT INTO transaction_log
                (usuario, accion, tipo_documento, nro_documento, payload, resultado)
            VALUES (%s, %s, %s, %s, %s::jsonb, %s)
            """,
            (
                usuario,
                accion,
                tipo_documento,
                nro_documento,
                json.dumps(payload) if payload else None,
                resultado,
            ),
        )
