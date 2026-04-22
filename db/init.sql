-- Inicialización de la base de datos
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabla principal de personas
CREATE TABLE IF NOT EXISTS persona (
    id              BIGSERIAL PRIMARY KEY,
    tipo_documento  VARCHAR(30) NOT NULL CHECK (tipo_documento IN ('Tarjeta de identidad', 'Cedula')),
    nro_documento   VARCHAR(10) NOT NULL,
    primer_nombre   VARCHAR(30) NOT NULL,
    segundo_nombre  VARCHAR(30),
    apellidos       VARCHAR(60) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    genero          VARCHAR(30) NOT NULL CHECK (genero IN ('Masculino','Femenino','No binario','Prefiero no reportar')),
    correo          VARCHAR(120) NOT NULL,
    celular         VARCHAR(10) NOT NULL,
    foto_path       VARCHAR(255),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_persona_doc UNIQUE (tipo_documento, nro_documento)
);

-- Tabla de log de transacciones
CREATE TABLE IF NOT EXISTS transaction_log (
    id              BIGSERIAL PRIMARY KEY,
    fecha           TIMESTAMPTZ DEFAULT NOW(),
    usuario         VARCHAR(120),
    accion          VARCHAR(30) NOT NULL, -- CREATE | UPDATE | QUERY | DELETE | NL_QUERY
    tipo_documento  VARCHAR(30),
    nro_documento   VARCHAR(10),
    payload         JSONB,
    resultado       TEXT
);

CREATE INDEX IF NOT EXISTS idx_log_fecha    ON transaction_log(fecha);
CREATE INDEX IF NOT EXISTS idx_log_doc      ON transaction_log(tipo_documento, nro_documento);

-- Tabla de embeddings para RAG (la llena n8n / el servicio de indexación).
-- VECTOR(768) para modelos tipo Gemini text-embedding-004.
-- Si se cambia de modelo (ej. OpenAI 3-small: 1536), actualizar aqui + recrear tabla.
CREATE TABLE IF NOT EXISTS persona_embedding (
    id          BIGSERIAL PRIMARY KEY,
    persona_id  BIGINT REFERENCES persona(id) ON DELETE CASCADE,
    contenido   TEXT NOT NULL,
    embedding   VECTOR(768)
);

CREATE INDEX IF NOT EXISTS idx_persona_embedding
    ON persona_embedding USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
