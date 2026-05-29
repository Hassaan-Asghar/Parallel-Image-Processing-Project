# Hugging Face Spaces Deployment Guide

## Overview
This guide explains how to deploy the **Parallel Image Processing Backend** on Hugging Face Spaces as a free alternative to Railway.

## Prerequisites
- GitHub account with your repository
- Hugging Face account (free)
- Docker knowledge (optional but helpful)

## Deployment Steps

### Step 1: Push Changes to GitHub ✅
All files have been created in your repository:
- `app.py` - Wrapper for HF Spaces
- `requirements.txt` - Root-level dependencies with Gunicorn
- `Dockerfile` - Production-ready Docker configuration
- `README_HF_DEPLOYMENT.md` - This file

### Step 2: Create Hugging Face Space

1. Go to [huggingface.co/spaces](https://huggingface.co/spaces)
2. Click **"Create new Space"**
3. Fill in the form:
   - **Space name**: `parallel-image-processing-backend`
   - **License**: Choose one (e.g., MIT)
   - **Space SDK**: Select **Docker**
   - **Space hardware**: CPU (free tier)
   - **Visibility**: Public or Private
4. Click **"Create Space"**

### Step 3: Connect GitHub Repository

1. In your new Space, go to **Settings**
2. Scroll to **Repository settings**
3. Connect your GitHub repository:
   - Click "Link Repository"
   - Select `Hassaan-Asghar/Parallel-Image-Processing-Project`
   - Choose the branch (typically `main` or `master`)
4. Save settings

The Space will automatically build and deploy using your Dockerfile!

### Step 4: Monitor Build

- Go to **Logs** tab to watch the build process
- First build may take 5-10 minutes
- Once complete, you'll get a public URL like: `https://huggingface.co/spaces/YOUR-USERNAME/parallel-image-processing-backend`

## Access Your API

Your backend will be available at:
```
https://huggingface.co/spaces/YOUR-USERNAME/parallel-image-processing-backend
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/upload` | POST | Upload images and start processing |
| `/status/{session_id}` | GET | Get job status |
| `/results/{session_id}` | GET | Get processing results |
| `/outputs/{session_id}/{filename}` | GET | Download output image |

### Example cURL Commands

**Health Check:**
```bash
curl https://YOUR-SPACE-URL/api/health
```

**Upload Images:**
```bash
curl -X POST "https://YOUR-SPACE-URL/upload" \
  -F "files=@image1.jpg" \
  -F "files=@image2.jpg" \
  -F "mode=auto"
```

**Check Status:**
```bash
curl https://YOUR-SPACE-URL/status/SESSION_ID
```

**Get Results:**
```bash
curl https://YOUR-SPACE-URL/results/SESSION_ID
```

## Important Limitations & Solutions

### 1. **Ephemeral Storage**
- Files are deleted when the Space restarts
- **Solution**: Use HF's persistent storage (paid) OR set up external cloud storage (AWS S3, Azure Blob)

### 2. **Cold Starts (Free Tier)**
- Spaces sleep after inactivity (no requests for ~48 hours)
- First request after sleep takes ~30-60 seconds
- **Solution**: Use a monitoring service to keep it warm, or upgrade to a paid tier

### 3. **Limited Memory (Free Tier)**
- ~16GB total, shared with other processes
- Large image batches may cause memory errors
- **Solution**: Keep image sizes reasonable (<50MB per batch) or upgrade hardware

### 4. **CPU Only**
- No GPU acceleration on free tier
- Processing is slower than Railway
- **Solution**: Upgrade to GPU tier for faster inference

### 5. **Processing Timeout**
- Gunicorn timeout set to 120 seconds
- Long-running jobs may timeout
- **Solution**: Increase `--timeout` in Dockerfile if needed

## Updating Your Space

### Automatic Updates (Recommended)
- Connected to your GitHub repo
- Automatically rebuilds when you push changes
- Just push to GitHub, Space updates automatically!

### Manual Update
1. Go to Space Settings
2. Click "Restart Space"
3. Space rebuilds from latest code

## Configuration for Production

### Update Backend Paths (Already Done!)
In `app.py`, paths are configured for HF Spaces:
```python
BASE_DIR = Path("/tmp/hf_spaces_data")
UPLOAD_DIR = str(BASE_DIR / "uploads")
OUTPUT_DIR = str(BASE_DIR / "outputs")
```

### CORS Configuration
Currently allows all origins. For production, update in `Backend/main.py`:
```python
allow_origins=["https://your-frontend-domain.com"]  # Restrict to specific domain
```

## Cost Comparison

| Service | Cost | Storage | Compute | GPU |
|---------|------|---------|---------|-----|
| **Railway** (Trial) | Free (1 month) | 5GB | Shared | Optional |
| **Railway** (Paid) | $5-50/mo | Variable | Shared | Yes |
| **HF Spaces** (Free) | Free | Ephemeral | Limited | No |
| **HF Spaces** (Paid) | $7-50/mo | 50GB+ | Better | Yes |

## Troubleshooting

### Build Fails
- Check **Logs** tab for errors
- Ensure `Dockerfile` and `requirements.txt` are in root
- Verify `app.py` imports are correct

### Space Keeps Restarting
- Check logs for out-of-memory errors
- Reduce max concurrent uploads in `Backend/main.py`
- Implement request queuing

### Slow Performance
- Check CPU usage in Space Hardware settings
- Optimize image processing (reduce resolution)
- Consider upgrading to higher tier

### CORS Errors
- Update `allow_origins` in `Backend/main.py` to match frontend URL

## Next Steps

### Optional: Setup Gradio UI
Create a Gradio interface for better user experience:

```python
# gradio_interface.py
import gradio as gr
from fastapi import FastAPI
from fastapi.responses import JSONResponse

# Create Gradio UI wrapper
```

### Optional: Setup External Storage
For persistent file storage, use AWS S3 or Azure Blob:

```python
# Modified storage code
import boto3
# Upload results to S3 instead of local storage
```

### Optional: Add Authentication
Protect endpoints with API keys or authentication tokens.

## Support & Resources

- **HF Spaces Docs**: https://huggingface.co/docs/hub/spaces
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **Docker Docs**: https://docs.docker.com/
- **HF Community**: https://huggingface.co/discussions

## Next Actions

1. ✅ Files created in your repository
2. 👉 Go to Hugging Face and create a new Space
3. 👉 Connect your GitHub repository
4. 👉 Wait for build to complete
5. 👉 Update your frontend URL to point to the new Space
6. 👉 Test all API endpoints

Good luck with your deployment! 🚀
