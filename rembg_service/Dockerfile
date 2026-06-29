FROM python:3.11-slim
WORKDIR /app
RUN apt-get update && apt-get install -y libglib2.0-0 libgl1 && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .
EXPOSE 8001
CMD ["gunicorn", "-w", "2", "-b", "0.0.0.0:8001", "app:app", "--timeout", "120"]
