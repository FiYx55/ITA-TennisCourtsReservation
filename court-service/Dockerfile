FROM python:3.14-slim

WORKDIR /app

RUN pip install poetry && poetry config virtualenvs.create false

COPY pyproject.toml poetry.lock ./
RUN poetry install --no-root --no-interaction

COPY . .

ENV PYTHONPATH=/app/src

CMD ["sh", "-c", "uvicorn court_service.main:app --host 0.0.0.0 --port ${APP_PORT}"]
