// API configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export interface ProcessingResult {
  original_image: string;
  noise_type: string;
  denoised_image: string;
  enhanced_image: string;
  segmented_image: string;
  processing_time_sequential: number;
  processing_time_parallel: number;
  speedup: number;
}

export interface BatchProcessingResult {
  results: ProcessingResult[];
  total_sequential_time: number;
  total_parallel_time: number;
  overall_speedup: number;
  thread_count?: number; // Added field for backend thread data
}

export interface PipelineStep {
  step: number;
  name: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

export const pipelineSteps: PipelineStep[] = [
  { step: 1, name: 'Load Images', status: 'pending' },
  { step: 2, name: 'Parallel Assignment', status: 'pending' },
  { step: 3, name: 'Noise Detection', status: 'pending' },
  { step: 4, name: 'Denoising (Parallel)', status: 'pending' },
  { step: 5, name: 'Enhancement', status: 'pending' },
  { step: 6, name: 'Segmentation', status: 'pending' },
  { step: 7, name: 'Performance Metrics', status: 'pending' },
];

export async function processImages(files: File[]): Promise<BatchProcessingResult> {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('images', file);
  });

  try {
    const response = await fetch(`${API_BASE_URL}/api/process`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server Error: ${response.status} ${errorText}`);
    }

    return response.json();
  } catch (error) {
    console.error("Backend Connection Failed:", error);
    throw error;
  }
}

export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    return response.ok;
  } catch {
    return false;
  }
}