# Gestión de Datos Personales — Diseño de Software 2

Trabajo final de la materia **Diseño de Software 2** (Universidad del Norte). Aplicación de gestión de datos personales basada en microservicios contenerizados, con SSO real contra **Proyecto Roble**, consulta en lenguaje natural vía **n8n + RAG (pgvector + Gemini)**, log auditable de todas las transacciones, y carga de fotos por persona.

## Funcionalidades

Las 6 opciones del menú del enunciado, expuestas en una SPA:

1. **Crear persona** — formulario con todos los campos + foto opcional.
2. **Modificar** — busca por documento, prefilla datos y permite reemplazar foto.
3. **Consultar** — devuelve los datos y muestra la foto si existe.
4. **Chat NL (RAG)** — chat embebido (widget de n8n) que entiende preguntas como *"quién es Sofía"* o *"dame el correo de Juan"*. Si la persona tiene foto, el LLM la incluye en la respuesta como markdown.
5. **Borrar** — elimina la persona, la foto del disco y los embeddings asociados.
6. **Log** — historial completo (CRUD + NL_QUERY) filtrable por documento y/o rango de fechas.

Bonus: **Galería** con thumbs de todas las personas registradas.

## Arquitectura

Diagramas detallados en [`docs/arquitectura.md`](docs/arquitectura.md) (4 diagramas Mermaid: contenedores, login+CRUD, chat RAG, re-indexación). Versión textual rápida:

```
                    ┌─────────────────┐
                    │  Roble (SSO)    │   <-- valida tokens en cada request
                    └────────▲────────┘
                             │
  Browser ──── /api/* ────────┼─── Nginx (gateway)
     │                       │     ├─── frontend estático (React build)
     │                       │     ├─── /media/* (volumen Docker)
     │                       │     └─── /api/<op>/ → microservicio
     │                       │
     │                       │   ┌─ create-person  ┐
     │                       │   ├─ update-person  ┤   Postgres + pgvector
     │ chat /webhook/...     │   ├─ query-person   ├──►  ┌───────────────┐
     │                       │   ├─ delete-person  ┤     │ persona       │
     │                       │   └─ log-service    ┘     │ persona_emb.  │
     │                       │                           │ transaction…  │
     │                       │                           └───────────────┘
     │                       │
     │                       └─ webhook reindex ─►  ┌───────────────────┐
     └─ chat embebido ──────────────────────────────►│ n8n (3 workflows) │
                                                    └────────▲──────────┘
                                                             │
                                                             └─ Gemini API
                                                                (embeddings + chat)
```

- **Microservicios** (FastAPI, Python 3.11): uno por opción del menú. `query-person` corre en contenedor independiente y se puede apagar/encender on-demand sin tumbar el resto (requisito del enunciado).
- **Postgres 16 + pgvector** en contenedor independiente, con healthcheck.
- **n8n** con 3 workflows:
  - `01 - Indexación personas` (manual): refresca todos los embeddings.
  - `02 - Chat RAG` (chat trigger): responde preguntas en lenguaje natural.
  - `03 - Indexar persona` (webhook): los microservicios lo llaman tras create/update/delete para mantener `persona_embedding` al día en tiempo real.
- **Gemini** (`gemini-embedding-001` para embeddings 768-d, `gemini-2.5-flash` para chat).
- **Roble** valida cada request del backend (`GET /verify-token`) y autentica el frontend (`POST /login`, `/signup`, `/refresh-token`).

## Stack

- Frontend: React 18 + Vite + react-router + axios + `@n8n/chat`.
- Backend: FastAPI 0.115 + psycopg 3 + httpx (para SSO y webhook a n8n).
- DB: PostgreSQL 16 con `pgvector`.
- SSO: Proyecto Roble (OIDC-like con accessToken/refreshToken JWT).
- Orquestación: Docker Compose v2.

## Estructura del repo

```
.
├── docs/                       Documento de diseño + diagramas
├── frontend/                   SPA React (build estático sirvido por Nginx)
│   └── src/
│       ├── pages/              7 páginas (Login, Signup, ForgotPassword,
│       │                       Home, Crear, Modificar, Consultar, ChatNL,
│       │                       Borrar, Log, Galeria)
│       ├── api.js              Cliente axios con interceptor 401→refresh
│       ├── auth.js             Cliente Roble (login, signup, verify-email…)
│       └── RequireAuth.jsx     HOC para rutas privadas
├── gateway/nginx.conf          Reverse proxy + estáticos + /media
├── services/
│   ├── common/                 models · db · auth (vs Roble) · logger · reindex
│   ├── create-person/          POST  /api/create/
│   ├── update-person/          PUT   /api/update/   +  POST /api/update/foto
│   ├── query-person/           GET   /api/query/    +  GET  /api/query/all
│   ├── delete-person/          DELETE /api/delete/
│   └── log-service/            GET   /api/log/      +  POST /api/log/internal/log
├── n8n/workflows/              Workflows JSON exportados
├── db/init.sql                 Schema inicial (persona, transaction_log,
│                               persona_embedding con VECTOR(768))
├── scripts/smoke.sh            Smoke test end-to-end del CRUD + on-demand
├── docker-compose.yml          9 servicios + 3 volúmenes (pgdata, n8n_data, media)
├── Makefile                    Atajos (up, down, smoke, stop-query…)
├── .env.example                Plantilla; el .env real está gitignored
└── .gitignore
```

## Cómo arrancar en local

**Guía completa paso a paso para los compañeros del equipo en [`docs/setup-equipo.md`](docs/setup-equipo.md)** (incluye configuración de n8n, qué credenciales crear, cómo obtener la URL del chat, troubleshooting y lo que sí/no se automatiza).

Versión resumida:

```bash
git clone <url>
cd "Diseño 2"
cp .env.example .env
cp frontend/.env.example frontend/.env
cd frontend && npm install && npm run build && cd ..
docker compose up -d --build
make import-workflows                   # importa los 3 workflows en n8n
# luego en la UI de n8n: crear credenciales Postgres + Gemini,
# reasignar a los nodos, publicar 02 y 03, copiar webhook URL a frontend/.env
```

> **Windows:** si el path del repo contiene `ñ` o espacios, BuildKit falla. El `Makefile` ya prefija con `DOCKER_BUILDKIT=0 COMPOSE_DOCKER_CLI_BUILD=0`.

### Variables de entorno claves

`.env` (raíz):
```
ROBLE_BASE_URL=https://roble-api.openlab.uninorte.edu.co
ROBLE_DB_NAME=<id del proyecto creado en roble.openlab.uninorte.edu.co>
N8N_INDEX_WEBHOOK_URL=http://n8n:5678/webhook/indexar-persona
```

`frontend/.env`:
```
VITE_CHAT_WEBHOOK_URL=http://localhost:5678/webhook/<tu-webhook-id>/chat
```

## URLs locales

| Recurso         | URL                              | Auth                    |
|-----------------|----------------------------------|-------------------------|
| Frontend        | http://localhost:8080            | Roble (SSO real)        |
| API Gateway     | http://localhost:8080/api        | Bearer token Roble      |
| n8n             | http://localhost:5678            | `admin` / `admin_dev`   |
| Adminer (DB)    | http://localhost:8081            | DB credentials          |

## Atajos del Makefile

```bash
make up            # build + up -d (con DOCKER_BUILDKIT=0)
make down          # apaga sin borrar datos
make smoke         # smoke test del CRUD via gateway
make stop-query    # apaga solo query-person (requisito on-demand del profe)
make start-query   # reactiva query-person
make logs          # tail logs de todos los servicios
make ps            # estado
make clean         # ⚠️ down -v (borra volúmenes, pierde datos)
```

## Persistencia

Todo lo importante vive en volúmenes Docker named:

- `diseo2_pgdata` — Postgres (personas, embeddings, log).
- `diseo2_n8n_data` — n8n (cuenta owner, credenciales, ejecuciones).
- `diseo2_media` — fotos subidas (`<persona_id>.<ext>`).

`docker compose down` **no** borra los volúmenes. `down -v` o `make clean` sí.

## Repartición de tareas

| Miembro             | Responsabilidad                                              |
|---------------------|--------------------------------------------------------------|
| Juan Sebastián Ruiz | Infra (compose, gateway, DB), n8n + RAG                      |
| Dayana Molina       | Librería `common` (modelos/validaciones), create + update    |
| Sofía Palacios      | query-person (contenedor on-demand), frontend React          |
| José Sequeda        | SSO Roble (real, vivo), delete + log-service                 |

## Entregas

1. Documento de diseño → `docs/Documento_Diseno.docx`
2. Repositorio (este) con implementación y workflows versionados.
3. Demo final.
