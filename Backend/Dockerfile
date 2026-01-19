# Use an official Python runtime as a parent image
FROM python:3.11-slim

# 1. Install system dependencies required by OpenCV
# NOTE: 'libgl1' replaces the obsolete 'libgl1-mesa-glx'
RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    libxcb1 \
    libx11-xcb1 \
    libxcb-render0 \
    libxcb-shape0 \
    libxcb-xfixes0 \
    && rm -rf /var/lib/apt/lists/*

# Set the working directory in the container
WORKDIR /app

# 2. Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 3. Copy the rest of the application code
COPY . .

# 4. Run the application
CMD uvicorn main:app --host 0.0.0.0 --port $PORT
