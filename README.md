# Gestión de Datos Personales — Diseño de Software 2

Trabajo final de la materia **Diseño de Software 2**. Aplicación de gestión de datos personales basada en microservicios, con autenticación SSO, contenedores, consulta en lenguaje natural vía n8n + RAG, y log de transacciones.

## Stack

- **Frontend:** React + Vite
- **Backend microservicios:** Python 3.11 + FastAPI
- **Base de datos:** PostgreSQL 16 con extensión `pgvector` (datos + embeddings para RAG)
- **Autenticación SSO:** Proyecto Roble
- **Orquestación RAG / Lenguaje natural:** n8n
- **Contenedores:** Docker + Docker Compose
- **Gateway:** Nginx

## Estructura del repo

```
.
├── docs/                 Documento de diseño y diagramas
├── frontend/             SPA en React + Vite
├── gateway/              Configuración de Nginx (reverse proxy)
├── services/
│   ├── common/           Librería compartida (modelos, validaciones, auth, log)
│   ├── create-person/    Microservicio: crear
│   ├── update-person/    Microservicio: actualizar
│   ├── query-person/     Microservicio: consultar (contenedor independiente, escalable)
│   ├── delete-person/    Microservicio: eliminar
│   └── log-service/      Microservicio: consulta de log
├── n8n/                  Workflows de n8n para el chat RAG
├── db/                   Scripts de inicialización de PostgreSQL
├── docker-compose.yml    Orquestación de todos los contenedores
├── .env.example          Plantilla de variables de entorno
└── .gitignore
```

## Cómo arrancar en local

Requisitos: Docker Desktop (o Docker Engine + Docker Compose v2), Git, y `make` (opcional).

```bash
git clone <url-del-repo>
cd <repo>
cp .env.example .env            # completar valores (credenciales Roble, API keys, etc.)
make up                         # build + arranque de todos los contenedores
make smoke                      # verifica que el CRUD corre de punta a punta
```

Si no tenés `make`, los comandos crudos están en el [Makefile](Makefile). En Windows, usar Git Bash.

> **Nota (Windows):** si el path del repo tiene caracteres como `ñ` o espacios,
> Docker BuildKit falla con un bug conocido. El `Makefile` ya lo evita usando
> `DOCKER_BUILDKIT=0 COMPOSE_DOCKER_CLI_BUILD=0` al buildear.

Cuando termine de levantar:

| Servicio       | URL local                     |
|----------------|-------------------------------|
| Frontend       | http://localhost:8080         |
| API Gateway    | http://localhost:8080/api     |
| n8n (RAG)      | http://localhost:5678         |
| Adminer (DB)   | http://localhost:8081         |

### Atajos útiles

```bash
make up            # build + up -d
make down          # apagar todo
make smoke         # smoke test end-to-end
make stop-query    # apagar solo query-person (requisito on-demand)
make start-query   # reactivar query-person
make logs          # tail de logs
make ps            # estado de contenedores
make clean         # down + borra volúmenes (pierde datos)
```

## Repartición de tareas sugerida

Ver `docs/plan_de_trabajo.md` (se incluye en el documento de diseño).

## Entregas

1. **Documento de diseño** → `docs/Documento_Diseno.docx`
2. Implementación y despliegue en contenedores
3. Demo final
