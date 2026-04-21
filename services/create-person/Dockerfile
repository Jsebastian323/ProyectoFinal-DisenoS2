FROM python:3.11-slim
WORKDIR /app

# El build se hace desde la raiz del repo (ver docker-compose.yml):
#   build: { context: ., dockerfile: services/create-person/Dockerfile }
COPY services/common /app/common
COPY services/create-person/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY services/create-person/main.py /app/main.py

EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
