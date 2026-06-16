FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

ENTRYPOINT ["/bin/bash", "-c", "sed -i 's/\\r//g' /app/entrypoint.sh && chmod +x /app/entrypoint.sh && exec /app/entrypoint.sh \"$@\"", "--"]
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
