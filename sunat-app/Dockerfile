FROM python:3.12-slim-bookworm

RUN apt-get update && apt-get install -y \
    wget \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt \
    && playwright install --with-deps chromium

COPY main.py .

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=10s --retries=5 --start-period=20s \
    CMD python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/docs')"

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
