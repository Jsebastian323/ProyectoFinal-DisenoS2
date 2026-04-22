"""
Validacion de token del SSO (Proyecto Roble) via OIDC.

Modo mock mientras no haya credenciales de Roble: devuelve siempre un usuario
demo, con o sin header Authorization. Cuando el equipo tenga las credenciales,
reemplazar por validacion de firma contra JWKS del issuer.
"""
import os
from fastapi import Header

ISSUER = os.getenv("ROBLE_ISSUER_URL", "")
CLIENT_ID = os.getenv("ROBLE_CLIENT_ID", "")


def verify_token(authorization: str = Header(default="")) -> dict:
    # TODO(Jose): cuando Roble este listo, validar Bearer token con JWKS del issuer.
    return {"sub": "usuario_demo", "email": "demo@unisabana.edu.co"}
