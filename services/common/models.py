"""
Modelos y validaciones compartidas (Pydantic).
Reutilizados por todos los microservicios.
"""
from datetime import date
from enum import Enum
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, field_validator


class TipoDocumento(str, Enum):
    TARJETA = "Tarjeta de identidad"
    CEDULA  = "Cedula"


class Genero(str, Enum):
    MASCULINO = "Masculino"
    FEMENINO  = "Femenino"
    NO_BINARIO = "No binario"
    NO_REPORTA = "Prefiero no reportar"


class PersonaIn(BaseModel):
    tipo_documento: TipoDocumento
    nro_documento:  str = Field(..., max_length=10)
    primer_nombre:  str = Field(..., max_length=30)
    segundo_nombre: Optional[str] = Field(None, max_length=30)
    apellidos:      str = Field(..., max_length=60)
    fecha_nacimiento: date
    genero:         Genero
    correo:         EmailStr
    celular:        str = Field(..., min_length=10, max_length=10)

    @field_validator("nro_documento", "celular")
    @classmethod
    def solo_numeros(cls, v: str) -> str:
        if not v.isdigit():
            raise ValueError("Debe contener solo numeros")
        return v

    @field_validator("primer_nombre", "segundo_nombre", "apellidos")
    @classmethod
    def no_numeros(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if any(ch.isdigit() for ch in v):
            raise ValueError("No debe contener numeros")
        return v


class PersonaOut(PersonaIn):
    id: int
