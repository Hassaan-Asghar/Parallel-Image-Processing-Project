# ParallelVision 
### High Performance Parallel Image Processing System

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen?style=for-the-badge&logo=vercel)](https://parallel-image-processing-project.vercel.app/)

**ParallelVision** is a full-stack image processing engine engineered to demonstrate the superior efficiency of **parallel computing** over traditional sequential execution. 

Designed for medical imaging (specifically brain tumor MRI scans), it features a dual-mode processing pipeline ("Auto" & "Advanced") that leverages **multi-threading** to perform noise reduction, contrast enhancement, and **K-Means clustering segmentation**. The application provides real-time analytics, visualizing the speedup achieved by processing batched image data in parallel.

> **Experience the difference:** Compare serial vs. parallel execution times in real time with our interactive dashboard.

---

## Key Features

- **Parallel Performance Engine**
  - Utilizes `ThreadPoolExecutor` to process multiple images simultaneously.
  - Calculates and displays the exact **Speedup Factor** (Serial Time / Parallel Time).

- **Intelligent Segmentation**
  - **Robust K-Means Clustering:** Automatically groups pixel intensities to isolate tumor regions from brain tissue and background, superior to simple thresholding.
  - **Morphological Operations:** Cleans noise and refines tumor boundaries.

- **Dual Processing Modes**
  - **Auto Mode:** Automatically detects noise levels and applies optimal thresholds.
  - **Advanced Mode:** Granular control over algorithms (Bilateral Filter, NLM, CLAHE, etc.).

- **Real-Time Analytics Dashboard**
  - Live visualization of processing status, time taken, and performance metrics.

- **Interactive Visualization**
  - **Before/After Sliders:** Compare original vs. processed images side-by-side.
  - **Mask Overlay:** Clearly highlights segmented tumor regions in red.

- **Modern UI/UX**
  - "Midnight Aurora" theme featuring glassmorphism, smooth animations, and a responsive layout built with **Tailwind CSS**.

---

## The Pipeline

The system follows a strict 7-step pipeline to ensure high-quality output:

1. **Upload:** User uploads a batch of MRI scans via the frontend.
2. **Assignment:** The backend distributes tasks across available threads.
3. **Noise Detection:** Calculates noise sigma using Median Absolute Deviation (MAD).
4. **Denoising:** Applies Non-Local Means (NLM) or Bilateral Filtering based on noise intensity.
5. **Enhancement:** Improves contrast using CLAHE (Contrast Limited Adaptive Histogram Equalization).
6. **Segmentation:** Isolates the Region of Interest (ROI/Tumor) using K-Means Clustering.
7. **Metrics:** Aggregates timing data to generate performance reports.
8. **Output:** Visualize resultant images using a slider (tumor overlay on original image slide to see) and can download them. 

---

## Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React, TypeScript, Vite | Interactive UI & Visualization |
| **Styling** | Tailwind CSS, shadcn/ui | Modern, responsive components |
| **Backend** | Python 3.10+, FastAPI | High-performance async API |
| **Processing** | OpenCV, NumPy | Image manipulation algorithms |
| **Concurrency** | `concurrent.futures` | Multi-threaded execution management |
| **Deployment** | Vercel (FE), Railway (BE) | Cloud hosting |

---

## Installation & Setup

This project consists of two distinct parts: the **Backend API** and the **Frontend Dashboard**.

### Prerequisites
- Python 3.10+
- Node.js 16+ & npm

### Backend Setup (FastAPI)

Navigate to the `backend/` directory:

```bash
cd backend

# 1. Create a virtual environment
python -m venv venv

# 2. Activate the virtual environment
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 3. Install dependencies
# Note: Use 'opencv-python-headless' if deploying to a server without GUI
pip install -r requirements.txt

# 4. Start the API server
uvicorn main:app --reload
```
Backend running at → http://127.0.0.1:8000

### Frontend Setup (React)

Open a new terminal and navigate to the frontend/ directory:

```sh
cd frontend

# 1. Install dependencies
npm install

# 2. Start the development server
npm run dev
```
Frontend running at → http://localhost:5173

## Project Structure
```
ParallelVision/
├── backend/
│   ├── main.py
│   ├── image_pipeline.py
│   ├── processor.py
│   ├── job_store.py
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── uploads/
│   └── outputs/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/
│   │   │   ├── AdvancedControls.tsx
│   │   │   ├── ApiStatus.tsx
│   │   │   ├── CpuVisualization.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── ImageComparison.tsx
│   │   │   ├── ImageUploader.tsx
│   │   │   ├── LandingPipeline.tsx
│   │   │   ├── NavLink.tsx
│   │   │   ├── PerformanceChart.tsx
│   │   │   ├── PipelineVisualization.tsx
│   │   │   └── ResultCard.tsx
│   │   ├── hooks/
│   │   │   └── use-mobile.ts
│   │   ├── lib/
│   │   │   ├── api.ts
│   │   │   └── utils.ts
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Index.tsx
│   │   │   └── NotFound.tsx
│   │   ├── App.tsx
│   │   └── index.css
│   ├── public/
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## License
MIT License © 2025 ParallelVision. All rights reserved. Parallel and Distributed Computing Project.
