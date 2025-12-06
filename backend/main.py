"""
ParallelVision - Parallel Image Processing Backend
FastAPI server with endpoints for image processing pipeline
"""

import time
import base64
import io
import os
from typing import List
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from PIL import Image

# Import your custom modules
from processing import ImageProcessor
from parallel_processor import process_images_parallel, process_images_sequential

app = FastAPI(
    title="ParallelVision API",
    description="Parallel Image Processing Backend",
    version="1.0.0"
)

# CORS: Allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def image_to_base64(image: np.ndarray) -> str:
    """Convert numpy array image to base64 string"""
    try:
        if len(image.shape) == 2:
            pil_image = Image.fromarray(image)
        else:
            pil_image = Image.fromarray(image[:, :, ::-1] if image.shape[2] == 3 else image)
        
        buffer = io.BytesIO()
        pil_image.save(buffer, format="JPEG", quality=85)
        return f"data:image/jpeg;base64,{base64.b64encode(buffer.getvalue()).decode()}"
    except Exception as e:
        print(f"Error converting image to base64: {e}")
        return ""

def load_image_from_upload(file_contents: bytes) -> np.ndarray:
    """Load image from bytes"""
    pil_image = Image.open(io.BytesIO(file_contents))
    if pil_image.mode != 'RGB':
        pil_image = pil_image.convert('RGB')
    image = np.array(pil_image)[:, :, ::-1].copy() 
    return image

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "port": 8000}

@app.post("/api/process")
async def process_images_endpoint(images: List[UploadFile] = File(...)):
    if not images:
        raise HTTPException(status_code=400, detail="No images provided")
    
    try:
        print(f"Received {len(images)} images for processing...")
        
        # 1. Load Images
        loaded_images = []
        for img_file in images:
            content = await img_file.read()
            image = load_image_from_upload(content)
            loaded_images.append(image)
        
        processor = ImageProcessor()
        
        # Determine actual threads used (Logic from parallel_processor.py)
        # It defaults to CPU count if not specified
        active_threads = os.cpu_count() or 4
        
        # 2. Sequential Processing Benchmark
        start_seq = time.time()
        _ = process_images_sequential(loaded_images, processor)
        total_sequential_time = time.time() - start_seq
        
        # 3. Parallel Processing (Actual Results)
        start_parallel = time.time()
        parallel_results = process_images_parallel(loaded_images, processor)
        total_parallel_time = time.time() - start_parallel
        
        if total_parallel_time == 0: total_parallel_time = 0.001
        
        overall_speedup = total_sequential_time / total_parallel_time
        
        print(f"Sequential: {total_sequential_time:.4f}s, Parallel: {total_parallel_time:.4f}s, Threads: {active_threads}")
        
        # 4. Format Response
        formatted_results = []
        for i, res in enumerate(parallel_results):
            avg_seq = total_sequential_time / len(images)
            avg_par = total_parallel_time / len(images)
            
            formatted_results.append({
                "original_image": image_to_base64(loaded_images[i]),
                "noise_type": res["noise_type"],
                "denoised_image": image_to_base64(res["denoised"]),
                "enhanced_image": image_to_base64(res["enhanced"]),
                "segmented_image": image_to_base64(res["segmented"]),
                "processing_time_sequential": res.get("processing_time", avg_seq) * overall_speedup,
                "processing_time_parallel": res.get("processing_time", avg_par),
                "speedup": overall_speedup
            })

        return {
            "results": formatted_results,
            "total_sequential_time": total_sequential_time,
            "total_parallel_time": total_parallel_time,
            "overall_speedup": overall_speedup,
            "thread_count": active_threads  # SENDING THREAD COUNT
        }

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)