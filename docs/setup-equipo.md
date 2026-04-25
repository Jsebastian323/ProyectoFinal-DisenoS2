# Setup para los compañeros del equipo

Guía paso a paso para arrancar el proyecto en una máquina nueva. Tiempo estimado la primera vez: **15-20 min** (la mayoría es esperar a que Docker baje imágenes y a configurar n8n).

## 0. Pre-requisitos

| Herramienta | Versión | Para qué |
|---|---|---|
| **Docker Desktop** | última | Levantar todos los contenedores |
| **Git** | cualquiera | Clonar el repo |
| **Node.js** | 18+ | Buildear el frontend |
| **API key de Gemini** | gratis | Para que el RAG funcione (cada uno la suya) |

Conseguir API key de Gemini: ir a [aistudio.google.com](https://aistudio.google.com) → "Get API key" → no pide tarjeta.

> **Windows**: usar **Git Bash** como terminal. Si tu carpeta de usuario tiene `ñ` o espacios, los comandos del Makefile ya lo manejan con `DOCKER_BUILDKIT=0`.

## 1. Clonar y configurar `.env`

```bash
git clone https://github.com/Jsebastian323/ProyectoFinal-DisenoS2.git
cd ProyectoFinal-DisenoS2
cp .env.example .env
cp frontend/.env.example frontend/.env
```

Editá `.env` (en la raíz). Los valores que ya están sirven; **solo asegurate de tener**:

```
ROBLE_DB_NAME=diseno2gestion_61540ca813
N8N_INDEX_WEBHOOK_URL=http://n8n:5678/webhook/indexar-persona
```

`frontend/.env` lo dejás como está por ahora — vas a editarlo cuando configures n8n (paso 4).

## 2. Buildear el frontend y levantar el stack

```bash
cd frontend && npm install && npm run build && cd ..
docker compose up -d --build
```

(Primera vez: 3-5 min descargando imágenes.)

Cuando termine, verificá:
```bash
docker compose ps
```
Los 9 contenedores deben estar `Up`. `gdp_db` debe decir `(healthy)`.

## 3. Configurar n8n (la primera vez en cada máquina)

Abrí **http://localhost:5678**.

### 3.1 Crear cuenta de owner

n8n te pide:
- **Basic auth**: `admin` / `admin_dev` (vienen del `.env`).
- **Owner account**: email/password local de tu n8n. Pueden ser inventados — n8n no los valida. Guardalos vos para volver a entrar.
- Saltar onboarding.

### 3.2 Crear las credenciales (`Credentials` en sidebar)

**Postgres**: `Add credential` → buscá `Postgres` → llená:
| Campo | Valor |
|---|---|
| Host | `db` |
| Database | `gdp` |
| User | `gdp_user` |
| Password | `gdp_pass_dev` |
| Port | `5432` |
| SSL | Disable |

**Google Gemini (PaLM) API**: `Add credential` → buscá `Google Gemini` → pegá tu API key (la de [aistudio.google.com](https://aistudio.google.com)).

### 3.3 Importar los 3 workflows

Desde la terminal en la raíz del repo (con el stack ya levantado):

```bash
make import-workflows
# Sin make:
# docker exec gdp_n8n n8n import:workflow --separate --input=/workflows/
```

En la UI de n8n vas a ver `01 - Indexacion personas`, `02 - Chat RAG`, `03 - Indexar persona`.

### 3.4 Reasignar las credenciales

Esto es manual y necesario porque los IDs de credenciales son locales a cada instancia. En cada workflow (`01`, `02`, `03`):

- Abrí el workflow.
- Cada nodo Postgres y cada nodo HTTP Request con auth Google Gemini va a tener un triángulo rojo de "credential not found". Clic en el nodo → en el dropdown de Credential, seleccioná la que creaste en 3.2 → Save.
- Total de nodos a tocar: ~6 en el workflow 01, ~3 en el 02, ~3 en el 03.

### 3.5 Publicar workflows 02 y 03

Solo workflows 02 y 03 necesitan estar publicados (el 01 puede correr en manual desde el botón "Test workflow", aunque también se beneficia de publicarse para que el cron de fallback corra cada 30 min).

En cada uno: arriba a la derecha → clic **Publish**. Si dice "Publish" en azul, lo publicás. Si ya dice "Unpublish", está activo.

### 3.6 Activar el chat público y obtener tu webhook URL

Esto solo aplica al workflow **02 - Chat RAG**:

1. Abrir el workflow 02 → clic en el primer nodo **"When chat message received"**.
2. Activar el toggle **"Make Chat Publicly Available"**.
3. Clic en el botón **"Open chat"** arriba — abre el chat de n8n en otra pestaña.
4. Copiar la URL de esa pestaña. Va a verse así:
   ```
   http://localhost:5678/webhook/<tu-uuid>/chat
   ```
5. Pegar esa URL en `frontend/.env`:
   ```
   VITE_CHAT_WEBHOOK_URL=http://localhost:5678/webhook/<tu-uuid>/chat
   ```
6. **Re-buildear el frontend** para que Vite inyecte la nueva variable:
   ```bash
   cd frontend && npm run build && cd ..
   ```

   El gateway sirve `frontend/dist` en bind-mount, así que con solo re-buildear ya queda.

## 4. Crear tu usuario de Roble

El SSO usa el proyecto Roble compartido del grupo (`diseno2gestion_61540ca813`). Para registrarte:

- Abrí **http://localhost:8080** → te redirige a `/login`.
- Clic **"Crear cuenta"** → llená email `@uninorte.edu.co`, password (`min 8 chars`, mayús, minús, número, símbolo `!@#$_-`), nombre.
- Te llega un código a tu correo institucional.
- Pegás el código → ya quedás logueado y entrás al menú.

> Si querés probar rápido sin registrarte vos, el usuario `test@uninorte.edu.co` con password `Test_1234` ya está creado y funciona.

## 5. Verificar que todo anda

Smoke test del CRUD:
```bash
make smoke
```

En el frontend (http://localhost:8080):
- Crear persona con foto → aparece en `/galeria` y `/consultar`.
- Chat NL: preguntar "quién es {nombre}" → responde con datos + foto embebida.
- Log: aparecen las acciones con tu correo real (no `demo@unisabana.edu.co`).

## 6. Apagar / retomar

```bash
docker compose stop          # apaga sin borrar contenedores
docker compose start         # los reanuda

docker compose down          # apaga y borra contenedores (volúmenes intactos)
docker compose up -d         # los recrea

# NO usar make clean ni docker compose down -v -- borran los volúmenes (datos perdidos).
```

## Problemas conocidos

| Síntoma | Causa | Solución |
|---|---|---|
| `BuildKit failed: header key … contains non-printable ASCII` | Path con `ñ` o espacios en Windows | Usar `make up` (ya prefija `DOCKER_BUILDKIT=0`) o exportar las vars manualmente |
| Chat responde `<Empty response>` | Workflow 02 sin publicar o webhook URL mal en `frontend/.env` | Verificar Publish + URL + rebuild frontend |
| Microservicio responde 401 con token válido | Workflow 02 / 03 con webhook stale tras rebuild | `docker compose restart gateway` |
| `404` al pedir `/media/<archivo>` | Volumen `media` no montado en gateway | `docker compose up -d gateway` (recrea con la nueva config de compose) |
| `make: command not found` | No tenés make instalado | `choco install make` (Windows con Chocolatey), o copiá los comandos del Makefile a mano |

## Lo que NO se puede automatizar (y por qué)

- **Crear el owner account de n8n**: es interactivo y vincula la sesión del browser. Cada uno tiene que hacerlo en su máquina.
- **Crear las credenciales de Postgres y Gemini en n8n**: la API de credenciales requiere un Personal Access Token de n8n, que también es interactivo. Y la API key de Gemini es de cada uno, no se comparte.
- **Reasignar credenciales en los nodos**: los IDs de credenciales son locales. n8n los resuelve por ID interno, no por nombre.
- **Publicar workflows**: en n8n self-hosted no hay CLI estable para activar workflows en bulk (en versiones Enterprise sí; nosotros usamos Community).

Lo que **sí** automatizamos:
- Importar los 3 workflows con `make import-workflows`.
- Levantar todo el stack con un solo comando.
- El frontend se buildea con `npm` estándar.
- El webhook URL del chat ahora es env var, no hardcodeada.
