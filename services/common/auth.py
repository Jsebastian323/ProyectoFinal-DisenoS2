"""
Validacion de token contra el SSO de Proyecto Roble.

El usuario hace login en el frontend -> Roble responde con accessToken.
El frontend lo envia en cada request en el header Authorization: Bearer <token>.
Cada microservicio delega la validacion a Roble:

    GET {ROBLE_BASE_URL}/auth/{ROBLE_DB_NAME}/verify-token
    Authorization: Bearer <token>
    -> 200 {"valid": true, "user": {"sub","email","dbName","role","sessionId"}}
    -> 401 si el token es invalido o expiro

En cada request hacemos una llamada extra a Roble. Suma latencia (~100-300ms)
pero es lo mas simple y no requiere compartir un secreto de firma del JWT.
"""
import os
import httpx
from fastapi import Header, HTTPException, status

ROBLE_BASE_URL = os.getenv("ROBLE_BASE_URL", "https://roble-api.openlab.uninorte.edu.co")
ROBLE_DB_NAME = os.getenv("ROBLE_DB_NAME", "")
VERIFY_URL = f"{ROBLE_BASE_URL}/auth/{ROBLE_DB_NAME}/verify-token"


def verify_token(authorization: str = Header(default="")) -> dict:
    """
    Dependencia de FastAPI. Retorna los claims del usuario autenticado.
    Lanza 401 si el token falta o es invalido, 503 si Roble no responde.
    """
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token requerido")

    try:
        resp = httpx.get(VERIFY_URL, headers={"Authorization": authorization}, timeout=5.0)
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"SSO no disponible: {e}")

    if resp.status_code != 200:
        raise HTTPException(status_code=401, detail="Token invalido")

    data = resp.json()
    if not data.get("valid"):
        raise HTTPException(status_code=401, detail="Token invalido")

    return data["user"]
