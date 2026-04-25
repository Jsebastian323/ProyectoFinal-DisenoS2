# Arquitectura

Diagramas en [Mermaid](https://mermaid.js.org/). GitHub los renderiza al abrir este archivo.

## 1. Vista de contenedores

Topología del stack (todo corre con `docker compose up -d`).

```mermaid
flowchart TB
    Browser[Browser del usuario]

    subgraph Roble[Proyecto Roble - SSO externo]
        RobleAuth[/auth/dbName/login/<br/>verify-token/<br/>refresh-token/]
    end

    subgraph Gemini[Google Gemini API - LLM]
        GeminiEmb[gemini-embedding-001<br/>768 dims]
        GeminiChat[gemini-2.5-flash<br/>generate]
    end

    subgraph Stack[docker-compose - red gdp_net]
        Gateway[gateway<br/>nginx:alpine<br/>:8080]

        subgraph Microservicios[5 microservicios FastAPI - Python 3.11]
            Create[create-person]
            Update[update-person<br/>+ POST /foto]
            Query[query-person<br/>+ GET /all<br/>contenedor on-demand]
            Delete[delete-person]
            Log[log-service<br/>+ POST /internal/log]
        end

        subgraph N8N[n8n - 3 workflows]
            WF1[01 - Indexacion masiva<br/>manual trigger]
            WF2[02 - Chat RAG<br/>chat trigger publicado]
            WF3[03 - Indexar persona<br/>webhook publicado]
        end

        DB[(Postgres 16 + pgvector<br/>persona, persona_embedding,<br/>transaction_log)]
        Adminer[adminer<br/>:8081]

        MediaVol[(volumen media<br/>fotos)]
    end

    Browser -->|HTTPS POST login| RobleAuth
    Browser -->|HTTPS chat| WF2
    Browser -->|HTTP /api/* + Bearer| Gateway
    Browser -->|HTTP /media/| Gateway

    Gateway -->|/api/create/| Create
    Gateway -->|/api/update/| Update
    Gateway -->|/api/query/| Query
    Gateway -->|/api/delete/| Delete
    Gateway -->|/api/log/| Log
    Gateway -->|/media/*| MediaVol

    Create -->|verify-token| RobleAuth
    Update -->|verify-token| RobleAuth
    Query -->|verify-token| RobleAuth
    Delete -->|verify-token| RobleAuth
    Log -->|verify-token| RobleAuth

    Create --> DB
    Update --> DB
    Query --> DB
    Delete --> DB
    Log --> DB

    Update --> MediaVol
    Delete --> MediaVol

    Create -.->|webhook reindex| WF3
    Update -.->|webhook reindex| WF3
    Delete -.->|webhook reindex| WF3

    WF1 --> DB
    WF1 --> GeminiEmb
    WF2 --> DB
    WF2 --> GeminiEmb
    WF2 --> GeminiChat
    WF2 -->|log NL_QUERY| Log
    WF3 --> DB
    WF3 --> GeminiEmb

    Adminer -.-> DB
```

**Notas**:

- El usuario hace login contra Roble **directamente** (CORS abierto). El frontend nunca proxea credenciales.
- Cada request a `/api/*` viaja con `Authorization: Bearer <accessToken>`. Cada microservicio valida llamando a `verify-token` de Roble. Si el token expira, el frontend renueva con el `refreshToken` automáticamente.
- `query-person` es el único microservicio "apagable on-demand" según el enunciado: `make stop-query` lo detiene; el resto sigue funcionando.
- Las fotos se guardan en un **volumen Docker** compartido entre los microservicios (read-write) y Nginx (read-only). Nginx las sirve en `/media/<persona_id>.<ext>`.

---

## 2. Login + CRUD (crear persona)

```mermaid
sequenceDiagram
    actor U as Usuario
    participant FE as Frontend (React)
    participant R as Roble
    participant GW as Nginx Gateway
    participant CR as create-person
    participant DB as Postgres
    participant N as n8n (workflow 03)
    participant G as Gemini API

    U->>FE: email + password
    FE->>R: POST /auth/dbName/login
    R-->>FE: { accessToken, refreshToken, user }
    Note over FE: localStorage.setItem(...)

    U->>FE: completa form Crear + foto
    FE->>GW: POST /api/create/ + Bearer
    GW->>CR: POST /
    CR->>R: GET /verify-token + Bearer
    R-->>CR: { valid:true, user:{email,...} }
    CR->>DB: INSERT INTO persona RETURNING id
    DB-->>CR: id=42
    CR->>DB: INSERT INTO transaction_log<br/>(usuario=user.email, accion=CREATE)
    CR->>N: POST /webhook/indexar-persona<br/>{persona_id:42}
    Note over N: fire-and-forget, timeout 2s
    CR-->>FE: 201 { id:42, ... }

    par paralelo: subir foto
        FE->>GW: POST /api/update/foto<br/>multipart + Bearer
        GW->>CR: (en realidad update-person)
        Note over CR: guarda 42.png en /app/media,<br/>UPDATE persona SET foto_path
    and reindex en background
        N->>DB: DELETE FROM persona_embedding WHERE persona_id=42
        N->>DB: SELECT * FROM persona WHERE id=42
        N->>G: POST /embedContent (texto)
        G-->>N: vector 768d
        N->>DB: INSERT INTO persona_embedding
    end
```

**Lo que importa**:

- El backend **delega** la validación de identidad a Roble — no decodifica JWTs por sí mismo, no comparte secrets.
- El log queda con el email **real** del usuario autenticado (`test@uninorte.edu.co`, no un mock).
- El reindex es **fire-and-forget**: si n8n está caído, el CRUD igual responde 201. La consistencia eventual del RAG no bloquea el camino crítico.

---

## 3. Chat en lenguaje natural (RAG)

```mermaid
sequenceDiagram
    actor U as Usuario
    participant FE as Widget @n8n/chat
    participant N as n8n (workflow 02)
    participant DB as Postgres + pgvector
    participant G as Gemini API
    participant LS as log-service

    U->>FE: "quien es Sofia"
    FE->>N: POST /webhook/.../chat<br/>{ chatInput }

    N->>G: POST /embedContent (pregunta)
    G-->>N: vector 768d de la pregunta

    N->>DB: SELECT contenido FROM persona_embedding<br/>ORDER BY embedding <=> $1::vector LIMIT 5
    DB-->>N: top 5 contenidos similares

    Note over N: Code "Armar prompt"<br/>concatena contextos + pregunta

    N->>G: POST /generateContent<br/>(prompt con contextos)
    G-->>N: respuesta del LLM<br/>(texto + markdown de imagen si hay foto)

    N->>LS: POST /internal/log<br/>{ accion:"NL_QUERY",<br/>  payload:{pregunta, respuesta} }
    LS->>DB: INSERT INTO transaction_log

    N-->>FE: { output: <texto markdown> }
    FE->>U: renderiza texto + imagen embebida
```

**Por qué pgvector y no llamar al LLM con TODA la base**:

- Escalabilidad: con 1000 personas, mandarle todas al LLM es 100KB+ por request. Con top-K=5 mandamos sólo los 5 más relevantes.
- Costo: cada token cuesta. Top-K reduce drásticamente.
- Calidad: el LLM se enfoca en lo relevante, no se distrae con datos irrelevantes.

---

## 4. Re-indexación automática (webhook)

```mermaid
sequenceDiagram
    participant MS as create / update / delete-person
    participant N as n8n (workflow 03)
    participant DB as Postgres
    participant G as Gemini API

    Note over MS: Tras INSERT/UPDATE/DELETE en persona,<br/>llama reindex_persona(id)

    MS->>N: POST /webhook/indexar-persona<br/>{ persona_id }
    Note over MS: timeout 2s, errores silenciados

    N->>DB: DELETE FROM persona_embedding<br/>WHERE persona_id = X
    N->>DB: SELECT * FROM persona WHERE id = X

    alt persona existe (create / update)
        DB-->>N: 1 fila
        Note over N: Code "Armar contenido"<br/>(incluye URL de foto si hay)
        N->>G: POST /embedContent
        G-->>N: vector 768d
        N->>DB: INSERT INTO persona_embedding
    else persona no existe (delete)
        DB-->>N: 0 filas
        Note over N: pipeline termina<br/>(Code "Run Once Each Item"<br/>no ejecuta con 0 items)
    end
```

**Idempotencia**: el workflow 3 hace siempre `DELETE` antes de `INSERT`. Si lo invocás 5 veces seguidas para el mismo `persona_id`, el resultado es el mismo. Eso lo hace robusto frente a reintentos o webhooks duplicados.

**Falla del webhook**: el helper `common/reindex.py` **swallow errores**. Si n8n está caído cuando se crea una persona, la persona queda en `persona` pero no en `persona_embedding`. Para corregir, basta correr el **workflow 1** manualmente — limpia y re-genera todo. Es el plan B documentado.
