# Frontend

SPA en React + Vite. Menu principal con las 6 opciones del enunciado:

1. Crear personas
2. Modificar datos personales
3. Consultar datos personales
4. Consulta en lenguaje natural (redirige a la interfaz de n8n en http://localhost:5678)
5. Borrar personas
6. Consultar log

## Arranque rapido (cuando el equipo empiece a construir)

```bash
npm create vite@latest frontend -- --template react
cd frontend
npm install
npm install axios react-router-dom
npm run dev
```

El `docker-compose.yml` de la raiz sirve el build estatico (`/frontend/dist`) detras de Nginx en `http://localhost:8080`.
