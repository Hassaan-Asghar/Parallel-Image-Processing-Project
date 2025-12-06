"""
Image Processing Module
Contains all image processing algorithms for noise detection, denoising,
enhancement, and segmentation.
"""

import cv2
import numpy as np
from typing import Tuple, Literal


NoiseType = Literal["salt_pepper", "gaussian", "speckle", "none"]


class ImageProcessor:
    """
    Image processor with methods for:
    - Noise detection
    - Noise removal (Median, Gaussian, Bilateral filtering)
    - Image enhancement (Mild CLAHE only)
    - Segmentation (Thresholding & Morphology for Tumor Detection)
    """
    
    def __init__(self):
        # Reduced clipLimit from 2.0 to 1.2 for much milder contrast enhancement
        self.clahe = cv2.createCLAHE(clipLimit=1.2, tileGridSize=(8, 8))
    
    # ==================== NOISE DETECTION ====================
    
    def detect_noise_type(self, image: np.ndarray) -> NoiseType:
        """
        Detect the type of noise present in an image.
        """
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY) if len(image.shape) == 3 else image
        
        # Calculate statistics
        hist = cv2.calcHist([gray], [0], None, [256], [0, 256]).flatten()
        total_pixels = gray.size
        
        # Check for salt & pepper noise
        black_ratio = hist[0] / total_pixels
        white_ratio = hist[255] / total_pixels
        extreme_ratio = black_ratio + white_ratio
        
        if extreme_ratio > 0.01:
            return "salt_pepper"
        
        # Check for Gaussian noise using local variance analysis
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        laplacian_var = laplacian.var()
        
        # Check for speckle noise using coefficient of variation
        mean_val = np.mean(gray)
        std_val = np.std(gray)
        cv = std_val / mean_val if mean_val > 0 else 0
        
        if laplacian_var > 500:
            if cv > 0.3:
                return "speckle"
            return "gaussian"
        
        if laplacian_var > 100:
            return "gaussian"
        
        return "none"
    
    # ==================== NOISE REMOVAL ====================
    
    def remove_noise(self, image: np.ndarray, noise_type: NoiseType) -> np.ndarray:
        """
        Apply appropriate denoising filter based on detected noise type.
        """
        if noise_type == "salt_pepper":
            return self.median_filter(image)
        elif noise_type == "gaussian":
            return self.gaussian_filter(image)
        elif noise_type == "speckle":
            return self.bilateral_filter(image)
        else:
            return cv2.fastNlMeansDenoisingColored(image, None, 3, 3, 7, 21)
    
    def median_filter(self, image: np.ndarray, kernel_size: int = 5) -> np.ndarray:
        return cv2.medianBlur(image, kernel_size)
    
    def gaussian_filter(self, image: np.ndarray, kernel_size: int = 5, sigma: float = 1.0) -> np.ndarray:
        return cv2.GaussianBlur(image, (kernel_size, kernel_size), sigma)
    
    def bilateral_filter(self, image: np.ndarray, d: int = 9, sigma_color: float = 75, sigma_space: float = 75) -> np.ndarray:
        return cv2.bilateralFilter(image, d, sigma_color, sigma_space)
    
    # ==================== IMAGE ENHANCEMENT (MINIMIZED) ====================
    
    def enhance_image(self, image: np.ndarray) -> np.ndarray:
        """
        Apply MINIMAL image enhancement.
        Removed Gamma and Unsharp Masking to prevent over-processing.
        Only applies mild contrast adjustment.
        """
        # Step 1: CLAHE (Mild)
        enhanced = self.apply_clahe(image)
        
        # REMOVED: Gamma correction (often darkens MRI too much)
        # REMOVED: Unsharp masking (adds noise artifacts to medical images)
        
        return enhanced
    
    def apply_clahe(self, image: np.ndarray) -> np.ndarray:
        lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        l = self.clahe.apply(l)
        lab = cv2.merge([l, a, b])
        return cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
    
    # ==================== SEGMENTATION (REFINED) ====================
    
    def segment_image(self, image: np.ndarray) -> np.ndarray:
        """
        Robust Tumor Segmentation using Skull Stripping & Dynamic Thresholding.
        Prevents 'all white' or 'all black' results by adapting to image brightness.
        """
        # 1. Convert to Grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # 2. CREATE BRAIN MASK (Skull Stripping)
        # Find the whole head by thresholding just above background noise (black)
        _, head_mask = cv2.threshold(gray, 10, 255, cv2.THRESH_BINARY)
        
        # Clean noise to get a solid head shape
        head_mask = cv2.morphologyEx(head_mask, cv2.MORPH_OPEN, np.ones((5,5), np.uint8))
        
        # Find the largest contour (The Head)
        contours, _ = cv2.findContours(head_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return np.zeros_like(image)  # Return black if no head found
            
        head_cnt = max(contours, key=cv2.contourArea)
        
        # Draw the solid head mask
        brain_mask = np.zeros_like(gray)
        cv2.drawContours(brain_mask, [head_cnt], -1, 255, -1)
        
        # CRITICAL STEP: Erode the mask to remove the skull
        # We shrink the mask by ~10% of the image size to ignore skull/eyes
        height, width = gray.shape
        erosion_size = int(min(height, width) * 0.10)  # 10% erosion
        kernel_erode = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (erosion_size, erosion_size))
        brain_only_mask = cv2.erode(brain_mask, kernel_erode)
        
        # 3. DYNAMIC TUMOR THRESHOLDING
        # Look at pixels ONLY inside the "brain_only_mask" (ignoring skull)
        brain_pixels = cv2.bitwise_and(gray, gray, mask=brain_only_mask)
        
        # Find the brightest intensity in the internal brain area
        min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(brain_pixels)
        
        # Safety Check: If image is completely dark (max_val is low), return empty
        if max_val < 30:
            return np.zeros_like(image)
            
        # Set threshold dynamically: Tumor is usually the top 30% brightest intensity
        # If max is 200, threshold becomes 140. If max is 100, threshold becomes 70.
        dynamic_thresh_val = int(max_val * 0.70)
        _, tumor_candidates = cv2.threshold(brain_pixels, dynamic_thresh_val, 255, cv2.THRESH_BINARY)
        
        # 4. CLEAN UP & FILTER
        # Remove small noise specs
        kernel_clean = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        tumor_candidates = cv2.morphologyEx(tumor_candidates, cv2.MORPH_OPEN, kernel_clean, iterations=2)
        
        # Find contours of candidates
        final_contours, _ = cv2.findContours(tumor_candidates, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        result_mask = np.zeros_like(image)
        
        for cnt in final_contours:
            area = cv2.contourArea(cnt)
            
            # Filter 1: Size (Avoid tiny dots)
            if area < 150:
                continue
                
            # Filter 2: Solidity (Tumors are solid blobs)
            hull = cv2.convexHull(cnt)
            hull_area = cv2.contourArea(hull)
            if hull_area == 0: continue
            solidity = float(area) / hull_area
            
            if solidity < 0.5: # Ignore very irregular scatterings
                continue
                
            # Draw valid tumor
            cv2.drawContours(result_mask, [cnt], -1, (255, 255, 255), -1)
            
        return result_mask

    # ==================== FULL PIPELINE ====================
    
    def process_single_image(self, image: np.ndarray) -> dict:
        """
        Process a single image through the complete pipeline.
        """
        import time
        start_time = time.time()
        
        # Step 1: Noise Detection
        noise_type = self.detect_noise_type(image)
        
        # Step 2: Noise Removal
        denoised = self.remove_noise(image, noise_type)
        
        # Step 3: Image Enhancement (Mild)
        enhanced = self.enhance_image(denoised)
        
        # Step 4: Segmentation
        segmented = self.segment_image(enhanced)
        
        processing_time = time.time() - start_time
        
        return {
            "noise_type": noise_type,
            "denoised": denoised,
            "enhanced": enhanced,
            "segmented": segmented,
            "processing_time": processing_time
        }