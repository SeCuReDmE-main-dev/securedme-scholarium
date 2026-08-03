FROM python:3.12.11-slim@sha256:47ae396f09c1303b8653019811a8498470603d7ffefc29cb07c88f1f8cb3d19f

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
RUN groupadd --system engine && useradd --system --gid engine --home /app engine
WORKDIR /app
COPY pyproject.toml README.md ./
COPY src ./src
COPY packs ./packs
RUN pip install --no-cache-dir .
USER engine
EXPOSE 8080
CMD ["uvicorn", "scholarium_teach_engine.app:app", "--host", "0.0.0.0", "--port", "8080"]
