FROM python:3.11-slim AS base

RUN apt-get update && apt-get install -y \
    libatk1.0-0 libatk-bridge2.0-0 libcups2 libxkbcommon0 \
    libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 \
    libasound2 libpangocairo-1.0-0 libpango-1.0-0 libcairo2 \
    libatspi2.0-0 libgtk-3-0 libnss3 libxshmfence1 \
    && rm -rf /var/lib/apt/lists/*

FROM base AS deps
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

RUN python3 -m playwright install chromium \
    && python3 -m playwright install-deps chromium

FROM deps AS runner
WORKDIR /app

COPY . ./sunat_app/
RUN touch ./sunat_app/__init__.py

RUN mkdir -p ./sunat_app/data

EXPOSE 8000

CMD ["uvicorn", "sunat_app.main:app", "--host", "0.0.0.0", "--port", "8000"]
