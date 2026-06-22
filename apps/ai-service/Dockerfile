# Gunakan image python slim yang ringan
FROM python:3.11-slim-bookworm

# Copy uv dari image official uv agar instalasi super cepat
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

WORKDIR /app

# Copy requirements
COPY requirements.txt .

# Install dependencies dari requirements.txt, 
# DITAMBAH instalasi paksa fastapi dan uvicorn sebagai pengaman!
RUN uv pip install --system -r requirements.txt || true
RUN uv pip install --system fastapi uvicorn

# Copy source code FastAPI
COPY . .

EXPOSE 8000

# JURUS RAHASIA: Gunakan 'python -m' agar OS mencari modul uvicorn secara langsung
# tanpa perlu mempedulikan letak binary/path-nya
CMD ["python", "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]