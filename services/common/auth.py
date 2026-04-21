"""
Validacion de token del SSO (Proyecto Roble) via OIDC.
TODO: completar ISSUER_URL y JWKS una vez el equipo tenga acceso a Roble.
"""
import os
from fastapi import Header, HTTPException, status

ISSUER = os.getenv("ROBLE_ISSUER_URL", "")
CLIENT_ID = os.getenv("ROBLE_CLIENT_ID", "")


def verify_token(authorization: str = Header(default="")) -> dict:
    """
    Dependencia de FastAPI que valida el Bearer token contra el IdP de Roble.
    Retorna el claim set del usuario autenticado.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token requerido")
    # token = authorization.split(" ", 1)[1]
    # TODO: validar firma con JWKS del issuer de Roble.
    # Placeholder hasta tener credenciales del SSO.
    return {"sub": "usuario_demo", "email": "demo@unisabana.edu.co"}
