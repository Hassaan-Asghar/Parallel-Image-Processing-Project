"""
Parallel Processing Module
Handles parallel and sequential processing of multiple images.
"""

import time
from typing import List
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor
import numpy as np

from processing import ImageProcessor


def process_single_image_worker(args) -> dict:
    """
    Worker function for processing a single image.
    Used by parallel processing pool.
    
    Args:
        args: Tuple of (image, processor_instance)
        
    Returns:
        Processing result dictionary
    """
    image, = args
    processor = ImageProcessor()
    return processor.process_single_image(image)


def process_images_sequential(images: List[np.ndarray], processor: ImageProcessor) -> List[dict]:
    """
    Process images sequentially (one after another).
    
    This serves as the baseline for performance comparison.
    Each image is processed completely before moving to the next.
    
    Args:
        images: List of input images
        processor: ImageProcessor instance
        
    Returns:
        List of processing results
    """
    results = []
    for image in images:
        result = processor.process_single_image(image)
        results.append(result)
    return results


def process_images_parallel(images: List[np.ndarray], processor: ImageProcessor, 
                           max_workers: int = None) -> List[dict]:
    """
    Process images in parallel using multiple threads.
    
    Each image is assigned to a separate thread for simultaneous processing.
    This demonstrates the speedup achievable through parallelization.
    
    Note: We use ThreadPoolExecutor instead of ProcessPoolExecutor because:
    - OpenCV operations release the GIL for most operations
    - Avoids the overhead of serializing large numpy arrays between processes
    - More memory efficient for large images
    
    For CPU-bound operations without GIL release, ProcessPoolExecutor 
    would be more appropriate.
    
    Args:
        images: List of input images
        processor: ImageProcessor instance (not used in parallel mode, 
                   each worker creates its own)
        max_workers: Maximum number of parallel workers (defaults to CPU count)
        
    Returns:
        List of processing results in original order
    """
    results = []
    
    # Use ThreadPoolExecutor for I/O bound and GIL-releasing operations
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Prepare arguments for each worker
        args_list = [(image,) for image in images]
        
        # Submit all tasks and collect results
        futures = [executor.submit(process_single_image_worker, args) 
                   for args in args_list]
        
        # Collect results in order
        results = [future.result() for future in futures]
    
    return results


def process_images_multiprocess(images: List[np.ndarray], processor: ImageProcessor,
                                max_workers: int = None) -> List[dict]:
    """
    Process images using multiple processes (true parallelism).
    
    This uses separate Python processes to bypass the GIL completely.
    Best for CPU-intensive operations that don't release the GIL.
    
    Note: This has higher overhead due to:
    - Process creation/destruction
    - Serializing/deserializing large numpy arrays
    
    Args:
        images: List of input images
        processor: ImageProcessor instance (not used, each process creates its own)
        max_workers: Maximum number of parallel processes
        
    Returns:
        List of processing results in original order
    """
    results = []
    
    with ProcessPoolExecutor(max_workers=max_workers) as executor:
        # Prepare arguments for each worker
        args_list = [(image,) for image in images]
        
        # Use map to process all images
        results = list(executor.map(process_single_image_worker, args_list))
    
    return results


class BatchProcessor:
    """
    High-level batch processor with progress tracking and error handling.
    """
    
    def __init__(self, use_parallel: bool = True, max_workers: int = None):
        """
        Initialize batch processor.
        
        Args:
            use_parallel: Whether to use parallel processing
            max_workers: Maximum number of workers for parallel processing
        """
        self.use_parallel = use_parallel
        self.max_workers = max_workers
        self.processor = ImageProcessor()
    
    def process_batch(self, images: List[np.ndarray], 
                      progress_callback=None) -> dict:
        """
        Process a batch of images with optional progress tracking.
        
        Args:
            images: List of input images
            progress_callback: Optional callback function(current, total)
            
        Returns:
            Dictionary with results and timing information
        """
        total = len(images)
        
        if self.use_parallel:
            # Parallel processing
            start_time = time.time()
            results = process_images_parallel(
                images, 
                self.processor, 
                self.max_workers
            )
            processing_time = time.time() - start_time
            
            # Call progress callback for each completed image
            if progress_callback:
                for i in range(total):
                    progress_callback(i + 1, total)
        else:
            # Sequential processing with progress updates
            start_time = time.time()
            results = []
            for i, image in enumerate(images):
                result = self.processor.process_single_image(image)
                results.append(result)
                if progress_callback:
                    progress_callback(i + 1, total)
            processing_time = time.time() - start_time
        
        return {
            "results": results,
            "total_time": processing_time,
            "average_time_per_image": processing_time / total if total > 0 else 0,
            "images_processed": total,
            "parallel_mode": self.use_parallel
        }


def benchmark_processing(images: List[np.ndarray]) -> dict:
    """
    Benchmark both sequential and parallel processing.
    
    Args:
        images: List of input images
        
    Returns:
        Dictionary with benchmark results
    """
    processor = ImageProcessor()
    
    # Sequential benchmark
    start_seq = time.time()
    seq_results = process_images_sequential(images, processor)
    seq_time = time.time() - start_seq
    
    # Parallel benchmark
    start_par = time.time()
    par_results = process_images_parallel(images, processor)
    par_time = time.time() - start_par
    
    # Calculate speedup
    speedup = seq_time / par_time if par_time > 0 else 1.0
    
    return {
        "sequential_time": seq_time,
        "parallel_time": par_time,
        "speedup": speedup,
        "efficiency": speedup / (len(images) if len(images) > 0 else 1),
        "images_count": len(images)
    }