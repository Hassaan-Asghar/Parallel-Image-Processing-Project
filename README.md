# 🚀 ParallelVision  
### High-Performance Parallel Image Processing System

**ParallelVision** is a full-stack image processing engine designed to demonstrate the power of **parallel computing** over traditional sequential execution.  
It performs advanced image enhancement and segmentation while providing **real-time performance analytics** and **CPU utilization visualization**.

> ⚡ Experience the speed difference between **Parallel vs. Sequential** image processing!

📌 *(Insert system architecture / pipeline image here)*


## ✨ Features

- **Parallel Performance Engine**  
  Speedup calculation based on sequential vs. concurrent time comparison.

- **Real-Time Analytics Dashboard**  
  CPU core usage graphs + processing time charts.

- **Interactive Image Comparison**  
  Before/After image slider to visualize denoised or segmented output.

- **Complete Processing Pipeline**  
  Noise Detection → Denoising → Enhancement (CLAHE) → Segmentation

- **Modern UI/UX**  
  Midnight Aurora theme with glassmorphism visuals and smooth animations.


## 🏗️ Technology Stack

| Layer | Tech | Purpose |
|------|------|---------|
| **Frontend** | React, TypeScript, Vite | Visualization dashboard |
| **Styling** | Tailwind CSS, shadcn-ui | Modern UI components |
| **Backend** | Python 3.10+, FastAPI | Parallel image processing API |
| **Processing** | OpenCV, NumPy, `concurrent.futures` | Multi-thread execution |


## ⚙️ Installation & Setup

This project runs two services independently:
1️⃣ **Backend** (FastAPI)  
2️⃣ **Frontend** (React)


### Backend Setup — FastAPI (Python)

Go to the `backend/` folder and run:

```sh
# 1️⃣ Create Virtual Environment
python -m venv venv

# 2️⃣ Activate Virtual Environment
# Windows:
.\venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 3️⃣ Install Dependencies
pip install -r requirements.txt

# 4️⃣ Run Backend Server
uvicorn main:app --reload
```
Backend running at → http://127.0.0.1:8000

### Frontend Setup — React (Node.js)
```sh
# 1️⃣ Install Node Modules
npm install

# 2️⃣ Start Development Server
npm run dev
```
Frontend running at → http://localhost:5173

## Project Structure
```
ParallelVision/
 ├── backend/
 │   ├── main.py
 │   ├── processing/
 │   ├── requirements.txt
 │   └── uploads/
 ├── frontend/
 │   ├── src/
 │   ├── public/
 │   └── package.json
 └── README.md
```

## Screenshots

## Collaborators

## License
MIT License © 2025 — ParallelVision Contributors


