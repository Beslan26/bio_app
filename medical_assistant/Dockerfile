# Этап 1: Сборка зависимостей (чтобы не компилировать пакеты при каждом запуске)
FROM python:3.11-alpine AS builder

WORKDIR /app

# Системные зависимости для сборки бинарных пакетов (например, psycopg2 для Postgres)
RUN apk add --no-cache gcc musl-dev postgresql-dev libffi-dev

# Копируем файл зависимостей. Он должен лежать в вашей папке backend/
COPY requirements.txt .

# Устанавливаем библиотеки изолированно в папку пользователя
RUN pip install --no-cache-dir --user -r requirements.txt


# Этап 2: Финальный легковесный образ (минимизирует нагрузку на ваш Mac Intel)
FROM python:3.11-alpine

WORKDIR /app

# Минимальный пакет для работы Postgres в Alpine Linux
RUN apk add --no-cache libpq

# Переносим скомпилированные зависимости из первого этапа
COPY --from=builder /root/.local /root/.local
COPY . .

# Прописываем пути, чтобы Python видел установленные пакеты
ENV PATH=/root/.local/bin:$PATH
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

# Запуск в точности с вашей структурой директорий
CMD ["uvicorn", "medical_assistant.app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
# Этап 1: Легковесная сборка зависимостей (без мусора в финальном образе)
FROM python:3.11-alpine AS builder

WORKDIR /app

# Системные пакеты для сборки бинарных библиотек (например, psycopg2 для Postgres)
RUN apk add --no-cache gcc musl-dev postgresql-dev libffi-dev

# Копируем список зависимостей
COPY requirements.txt .

# Собираем пакеты изолированно и без кэша, чтобы Mac не тратил ресурсы
RUN pip install --no-cache-dir --user -r requirements.txt


# Этап 2: Финальный минимальный образ для экономии CPU вашего Mac
FROM python:3.11-alpine

WORKDIR /app

# Минимальный рантайм для работы базы данных PostgreSQL
RUN apk add --no-cache libpq

# Копируем чистые собранные библиотеки из этапа сборки
COPY --from=builder /root/.local /root/.local
COPY . .

# Настройка переменных окружения Python
ENV PATH=/root/.local/bin:$PATH
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

# Автозапуск: сначала накат миграций Alembic, затем старт FastAPI
CMD ["sh", "-c", "alembic upgrade head && uvicorn medical_assistant.app.main:app --host 0.0.0.0 --port 8000 --reload"]
