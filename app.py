# Wrapper for Hugging Face Spaces
import os
import sys
from pathlib import Path

# Add Backend directory to Python path
backend_path = os.path.join(os.path.dirname(__file__), 'Backend')
sys.path.insert(0, backend_path)

# Import the FastAPI app from main.py
from main import app

# Ensure persistent directory exists for HF Spaces
BASE_DIR = Path("/tmp/hf_spaces_data")
BASE_DIR.mkdir(parents=True, exist_ok=True)

# The app object should be available for Gunicorn/Uvicorn to run
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=7860)
