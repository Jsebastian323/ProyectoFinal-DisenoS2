# Atajos de desarrollo para el trabajo final de Diseno de Software 2.
# Uso: make <target>
#
# NOTA: En Windows con el path "C:\Users\juans\Diseno 2" (contiene ñ/espacio),
# Docker BuildKit falla con un bug de gRPC. Por eso los targets que buildean
# imagenes prefijan con DOCKER_BUILDKIT=0 COMPOSE_DOCKER_CLI_BUILD=0.

SHELL := /bin/bash
COMPOSE := docker compose
NO_BUILDKIT := DOCKER_BUILDKIT=0 COMPOSE_DOCKER_CLI_BUILD=0

.PHONY: help up down build rebuild logs ps smoke stop-query start-query clean import-workflows

help:
	@echo "Targets:"
	@echo "  make up            - Build (sin BuildKit) y levanta todo en segundo plano"
	@echo "  make down          - Apaga todos los contenedores"
	@echo "  make build         - Solo rebuild de imagenes (sin levantar)"
	@echo "  make rebuild       - down + up --build"
	@echo "  make logs          - Tail de logs de todos los servicios"
	@echo "  make ps            - Estado de contenedores"
	@echo "  make smoke         - Smoke test end-to-end del CRUD via gateway"
	@echo "  make stop-query    - Apaga el microservicio de consulta (requisito del profesor)"
	@echo "  make start-query   - Reactiva el microservicio de consulta"
	@echo "  make import-workflows - Importa los 3 workflows JSON en n8n (post-setup)"
	@echo "  make clean         - down + borra volumenes (pierde los datos)"

up:
	$(NO_BUILDKIT) $(COMPOSE) up -d --build

build:
	$(NO_BUILDKIT) $(COMPOSE) build

down:
	$(COMPOSE) down

rebuild: down up

logs:
	$(COMPOSE) logs -f

ps:
	$(COMPOSE) ps

smoke:
	@bash scripts/smoke.sh

stop-query:
	$(COMPOSE) stop query-person

start-query:
	$(COMPOSE) start query-person

clean:
	$(COMPOSE) down -v

# Importa los 3 workflows (.json) al contenedor n8n. Util para que un
# miembro nuevo del equipo no tenga que importarlos a mano por la UI.
# El directorio n8n/workflows del host ya esta montado en /workflows del
# contenedor (ver docker-compose.yml), asi que el CLI los lee directo.
# Despues hay que reasignar credenciales y publicar (eso si es manual).
import-workflows:
	@echo "Importando workflows en n8n (necesita el contenedor up)..."
	docker exec gdp_n8n n8n import:workflow --separate --input=/workflows/
	@echo "Listo. Abri http://localhost:5678 y reasigna las credenciales en cada workflow."
