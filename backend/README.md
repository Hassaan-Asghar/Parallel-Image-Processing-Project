# ParallelVision - Python Backend

Parallel Image Processing Backend with FastAPI.

## Algorithm Flow

```
1. Load Input Images
   └─> Images loaded from upload

2. Process Assignment  
   └─> Sequential: one-by-one
   └─> Parallel: distributed to workers

3. Noise Detection
   └─> Analyze pixel distribution
   └─> Detect: salt_pepper | gaussian | speckle | none

4. Noise Removal
   ├─> Salt & Pepper → Median Filter
   ├─> Gaussian → Gaussian Filter  
   └─> Speckle → Bilateral Filter

5. Image Enhancement
   ├─> CLAHE (contrast)
   ├─> Gamma Correction (brightness)
   └─> Unsharp Masking (sharpening)

6. Segmentation
   ├─> Otsu Thresholding (binary)
   ├─> Canny Edge Detection (boundaries)
   └─> K-Means Clustering (regions)

7. Performance Comparison
   └─> Sequential vs Parallel timing
```

## Quick Start

### 1. Create Virtual Environment

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Run the Server

```bash
python main.py
```

Server starts at `http://localhost:8000`

## API Endpoints

### Health Check
```
GET /api/health
```
Returns: `{ "status": "healthy", "message": "ParallelVision API is running" }`

### Process Images
```
POST /api/process
Content-Type: multipart/form-data
Body: images (multiple files)
```

Returns:
```json
{
  "results": [
    {
      "original_image": "data:image/png;base64,...",
      "noise_type": "gaussian",
      "denoised_image": "data:image/png;base64,...",
      "enhanced_image": "data:image/png;base64,...",
      "segmented_image": "data:image/png;base64,...",
      "processing_time_sequential": 2.45,
      "processing_time_parallel": 0.82,
      "speedup": 2.98
    }
  ],
  "total_sequential_time": 4.9,
  "total_parallel_time": 1.64,
  "overall_speedup": 2.98
}
```

## Project Structure

```
backend/
├── main.py              # FastAPI server & endpoints
├── processing.py        # Image processing algorithms
├── parallel_processor.py # Parallel/sequential processing
├── requirements.txt     # Python dependencies
└── README.md           # This file
```

## Processing Modules

### `processing.py`
- `ImageProcessor` class with all algorithms:
  - `detect_noise_type()` - Noise classification
  - `remove_noise()` - Adaptive denoising
  - `enhance_image()` - Multi-step enhancement
  - `segment_image()` - Combined segmentation

### `parallel_processor.py`
- `process_images_sequential()` - Baseline processing
- `process_images_parallel()` - ThreadPoolExecutor
- `BatchProcessor` - High-level with progress tracking
- `benchmark_processing()` - Performance comparison

## Connect to Frontend

Set the API URL in your React frontend:

```bash
# .env file in React project
VITE_API_URL=http://localhost:8000
```

## Deploy to Production

### Railway / Render

1. Push `backend/` folder to a separate repo
2. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
3. Update `VITE_API_URL` in frontend

### Docker

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Testing

```bash
# Test health endpoint
curl http://localhost:8000/api/health

# Test with sample image
curl -X POST http://localhost:8000/api/process \
  -F "images=@sample.jpg"
```
