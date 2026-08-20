FROM node:22-slim AS frontend-builder

WORKDIR /frontend
RUN corepack enable
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY frontend/ ./
RUN pnpm run build


FROM python:3.12-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=7860 \
    DOWNLOAD_DIR=/app/downloads

RUN apt-get update && apt-get install -y \
    ca-certificates \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN groupadd --system quickclean \
    && useradd --system --gid quickclean --home-dir /app quickclean

COPY --chown=quickclean:quickclean . .
COPY --from=frontend-builder --chown=quickclean:quickclean /frontend/out /app/frontend/out
RUN mkdir -p /app/downloads && chown quickclean:quickclean /app/downloads

EXPOSE 7860

USER quickclean

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD curl --fail --silent "http://127.0.0.1:${PORT:-7860}/api/health" >/dev/null || exit 1

CMD ["sh", "-c", "exec gunicorn --bind 0.0.0.0:${PORT:-7860} --workers 1 --threads ${GUNICORN_THREADS:-8} --timeout 600 --graceful-timeout 30 --access-logfile - app:app"]
