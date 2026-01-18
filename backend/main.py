# main.py
print("\n\n---> 🟢 BACKEND LOADED WITH HEALTH CHECK ENABLED 🟢 <---\n\n")

from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks, HTTPException
from fastapi.staticfiles import StaticFiles
import os
import uuid
import shutil
import cv2
from job_store import job_status, job_results
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from image_pipeline import load_images, calculate_global_noise_thresholds
from processor import run_serial, run_parallel

app = FastAPI(title="Parallel Image Processing Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
OUTPUT_DIR = "outputs"

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

app.mount("/outputs", StaticFiles(directory="outputs"), name="outputs")
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# --- THIS IS THE FIX ---
@app.get("/api/health")
def health_check():
    return {"status": "online"}
# -----------------------

@app.get("/outputs/{session_id}/{filename}")
def get_output_file(session_id: str, filename: str):
    path = f"outputs/{session_id}/{filename}"
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path)

@app.post("/upload")
async def upload_images(
    background_tasks: BackgroundTasks,
    files: list[UploadFile] = File(...),
    mode: str = Form("auto"),
    noise_mode: str = Form("auto"),
    enhance_mode: str = Form("auto"),
    segment_mode: str = Form("auto")
):
    session_id = str(uuid.uuid4())
    total_images = len(files)
    job_status[session_id] = "processing"

    session_upload = f"{UPLOAD_DIR}/{session_id}"
    session_output = f"{OUTPUT_DIR}/{session_id}"

    os.makedirs(session_upload, exist_ok=True)
    os.makedirs(session_output, exist_ok=True)

    img_paths = []
    for file in files:
        path = f"{session_upload}/{file.filename}"
        with open(path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        img_paths.append(path)

    background_tasks.add_task(
        process_job,
        session_id,
        img_paths,
        mode,
        noise_mode,
        enhance_mode,
        segment_mode
    )

    return {
        "session_id": session_id,
        "totalImages": total_images
    }

@app.get("/status/{session_id}")
def get_status(session_id: str):
    if session_id not in job_status:
        raise HTTPException(
            status_code=404,
            detail="Session ID not found"
        )

    return {
        "session_id": session_id,
        "status": job_status[session_id]
    }

def process_job(
    session_id,
    img_paths,
    mode,
    noise_mode,
    enhance_mode,
    segment_mode
):
    try:
        image_data_list = load_images(img_paths)
        lower, upper = calculate_global_noise_thresholds(img_paths)

        args_list = [
            (
                path,
                data,
                mode,
                noise_mode,
                enhance_mode,
                segment_mode,
                lower,
                upper
            )
            for path, data in image_data_list
        ]

        serial_results, serial_time = run_serial(args_list)
        parallel_results, parallel_time = run_parallel(args_list)

        speedup = round(serial_time / parallel_time, 2) if parallel_time > 0 else 0

        response_images = []

        for path, img in parallel_results:
            name = os.path.basename(path)
            out_path = f"{OUTPUT_DIR}/{session_id}/final_{name}"
            cv2.imwrite(out_path, img)

            response_images.append({
                "original": f"/uploads/{session_id}/{os.path.basename(path)}",
                "processed": f"/outputs/{session_id}/final_{name}"
            })

        job_results[session_id] = {
            "session_id": session_id,
            "metrics": {
                "serial_time_sec": round(serial_time, 2),
                "parallel_time_sec": round(parallel_time, 2),
                "speedup": speedup
            },
            "results": response_images
        }

        job_status[session_id] = "done"

    except Exception as e:
        job_status[session_id] = "error"
        job_results[session_id] = {"error": str(e)}


@app.get("/results/{session_id}")
def get_results(session_id: str):
    if session_id not in job_status:
        raise HTTPException(
            status_code=404,
            detail="Session ID not found"
        )
    if job_status.get(session_id) != "done":
        return {"status": job_status.get(session_id)}

    return job_results[session_id]