FROM python:3.11-slim

# Install system dependencies required by OpenCV
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libxcb1 \
    libx11-xcb1 \
    libxcb-render0 \
    libxcb-shape0 \
    libxcb-xfixes0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire project
COPY . .

# Create persistent directory for uploads and outputs
RUN mkdir -p /tmp/hf_spaces_data/uploads /tmp/hf_spaces_data/outputs

# Expose port 7860 (HF Spaces default)
EXPOSE 7860

# Run with Gunicorn for production with Uvicorn workers
CMD ["gunicorn", "-w", "1", "-k", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:7860", "--timeout", "120", "app:app"]
