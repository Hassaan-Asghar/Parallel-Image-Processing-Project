import axios from 'axios';

export const API_BASE_URL = 'http://127.0.0.1:8000';

export interface ProcessingResult {
  original: string;
  processed: string;
}

export interface BatchResponse {
  session_id: string;
  metrics: {
    serial_time_sec: number;
    parallel_time_sec: number;
    speedup: number;
  };
  results: ProcessingResult[];
}

export interface ProcessOptions {
  mode: 'auto' | 'advanced';
  noise_mode: 'none' | 'median' | 'gaussian' | 'bilateral' | 'nlm' | 'auto';
  enhance_mode: 'none' | 'clahe' | 'gamma' | 'unsharp' | 'hist' | 'auto';
  segment_mode: 'none' | 'auto' | 'grabcut';
}

export const healthCheck = async (): Promise<boolean> => {
  try {
    const res = await axios.get(`${API_BASE_URL}/api/health`);
    return res.data.status === 'online';
  } catch (error) {
    return false;
  }
};

export const processImages = async (
  files: File[], 
  options: ProcessOptions
): Promise<BatchResponse> => {
  const formData = new FormData();

  files.forEach((file) => {
    formData.append('files', file);
  });

  formData.append('mode', options.mode);
  formData.append('noise_mode', options.noise_mode);
  formData.append('enhance_mode', options.enhance_mode);
  formData.append('segment_mode', options.segment_mode);

  const uploadRes = await axios.post(`${API_BASE_URL}/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  const { session_id } = uploadRes.data;

  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const statusRes = await axios.get(`${API_BASE_URL}/status/${session_id}`);
        const status = statusRes.data.status;

        if (status === 'done') {
          clearInterval(interval);
          const resultsRes = await axios.get(`${API_BASE_URL}/results/${session_id}`);
          
          const fixedResults = {
            ...resultsRes.data,
            results: resultsRes.data.results.map((r: any) => ({
              original: `${API_BASE_URL}${r.original}`,
              processed: `${API_BASE_URL}${r.processed}`
            }))
          };
          
          resolve(fixedResults);
        } else if (status === 'error') {
          clearInterval(interval);
          reject(new Error('Processing failed on server.'));
        }
      } catch (err) {
        clearInterval(interval);
        reject(err);
      }
    }, 1000); 
  });
};