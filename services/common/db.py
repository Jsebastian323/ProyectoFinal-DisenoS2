"""
Conexion a PostgreSQL compartida.
"""
import os
import psycopg
from contextlib import contextmanager


def dsn() -> str:
    return (
        f"host={os.getenv('POSTGRES_HOST','db')} "
        f"port={os.getenv('POSTGRES_PORT','5432')} "
        f"dbname={os.getenv('POSTGRES_DB','gdp')} "
        f"user={os.getenv('POSTGRES_USER','gdp_user')} "
        f"password={os.getenv('POSTGRES_PASSWORD','change_me')}"
    )


@contextmanager
def get_conn():
    conn = psycopg.connect(dsn())
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()
