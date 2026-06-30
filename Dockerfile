# Build stage: frontend
FROM node:22-alpine AS frontend-builder

WORKDIR /app

COPY package*.json ./
RUN npm install --ignore-scripts

COPY vite.config.js tailwind.config.js postcss.config.js index.html ./
COPY src/ src/
COPY public/ public/
RUN npm run build

# Production stage
FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
  curl libpq-dev && \
  rm -rf /var/lib/apt/lists/* && \
  addgroup --system appgroup && adduser --system --ingroup appgroup appuser

# Copy backend
COPY server/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY server/ .
RUN mkdir -p staticfiles uploads

# Copy frontend build
COPY --from=frontend-builder /app/dist/ /app/frontend/

ENV DJANGO_DEBUG=false
ENV PYTHONUNBUFFERED=1

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:8000/api/health/ || exit 1

CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4", "--timeout", "120"]
