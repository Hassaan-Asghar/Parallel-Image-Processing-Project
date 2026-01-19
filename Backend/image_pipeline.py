import cv2
import os
import numpy as np
import time
from concurrent.futures import ThreadPoolExecutor

def load_images(img_paths):
    data = []
    for path in img_paths:
        img = cv2.imread(path)
        if img is not None:
            data.append((path, img))
        else:
            print(f"Error: Could not load {path}")
    return data

def save_images(results):
    for path, final_img in results:
        output_path = f"output_images/auto_final_{os.path.basename(path)}"
        os.makedirs("output_images", exist_ok=True)
        cv2.imwrite(output_path, final_img)

def estimate_noise_mad(img):
    if len(img.shape) == 3:
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    else:
        gray = img.copy()

    laplacian = cv2.Laplacian(gray, cv2.CV_64F, ksize=3)
    coeffs = np.abs(laplacian.flatten())
    mad = np.median(coeffs)

    return mad / 0.6745

def calculate_global_noise_thresholds(img_paths):
    sigmas = []
    for path in img_paths:
        img = cv2.imread(path)
        if img is None:
            continue
        sigma = estimate_noise_mad(img)
        if sigma is not None:
            sigmas.append(sigma)

    if not sigmas:
        return 5.0, 10.0

    sigmas_arr = np.array(sigmas)
    median_sigma = np.median(sigmas_arr)
    std_sigma = np.std(sigmas_arr)

    lower_threshold = max(5.0, median_sigma - 0.5 * std_sigma)
    upper_threshold = median_sigma + 0.75 * std_sigma

    return lower_threshold, upper_threshold

def detect_image_type(img):
    h, w, c = img.shape
    means = np.mean(img, axis=(0, 1))
    
    if c == 3 and np.max(means) - np.min(means) < 5:
        return "medical"
    
    color_std = np.std(img)
    if color_std > 30:
        return "natural"

    return "unknown"

def apply_mask_overlay(img, mask):
    red_layer = np.zeros_like(img, dtype=np.uint8)
    if len(mask.shape) == 2:
        mask_gray = mask
    else:
        mask_gray = cv2.cvtColor(mask, cv2.COLOR_BGR2GRAY)
    
    red_layer[mask_gray > 0] = [0, 0, 255]
    overlay_img = cv2.addWeighted(img, 1.0, red_layer, 0.4, 0)
    return overlay_img

def segment_mri_robust(image):
    if len(image.shape) == 3:
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    else:
        gray = image.copy()
        
    pixel_values = gray.reshape((-1, 1))
    pixel_values = np.float32(pixel_values)

    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 100, 0.2)
    k = 3
    _, labels, centers = cv2.kmeans(pixel_values, k, None, criteria, 10, cv2.KMEANS_RANDOM_CENTERS)

    centers = np.uint8(centers)
    tumor_cluster = np.argmax(centers)

    labels = labels.flatten()
    segmented_image = labels.reshape(gray.shape)
    
    binary_mask = np.zeros_like(gray, dtype=np.uint8)
    binary_mask[segmented_image == tumor_cluster] = 255

    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
    binary_mask = cv2.morphologyEx(binary_mask, cv2.MORPH_OPEN, kernel, iterations=2)
    
    contours, _ = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    final_mask = np.zeros_like(gray)
    
    if contours:
        largest_contour = max(contours, key=cv2.contourArea)
        if cv2.contourArea(largest_contour) > 50:
            cv2.drawContours(final_mask, [largest_contour], -1, 255, -1)
            
    return final_mask

def auto_denoise(img, lower_threshold, upper_threshold):
    sigma = estimate_noise_mad(img)
    if sigma is None:
        return img, "Error"

    denoised_image = img.copy()
    action = ""

    if sigma < lower_threshold:
        action = "Skip"
    elif sigma < upper_threshold:
        action = "Mild Bilateral"
        filter_sigma = int(sigma)
        denoised_image = cv2.bilateralFilter(img, d=9, sigmaColor=filter_sigma, sigmaSpace=filter_sigma)
    else:
        action = "Strong NLM"
        h_parameter = 10
        denoised_image = cv2.fastNlMeansDenoisingColored(
            img, None, h=h_parameter, hColor=h_parameter, templateWindowSize=7, searchWindowSize=21
        )

    return denoised_image, action

def auto_enhance(img):
    lab_image = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab_image)

    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    l_channel_enhanced = clahe.apply(l_channel)

    lab_enhanced = cv2.merge((l_channel_enhanced, a_channel, b_channel))
    enhanced_image = cv2.cvtColor(lab_enhanced, cv2.COLOR_LAB2BGR)

    blurred = cv2.GaussianBlur(enhanced_image, (5, 5), 1.0)
    unsharp_mask = cv2.addWeighted(enhanced_image, 1.0, blurred, -1.0, 0)
    final_enhanced_image = cv2.addWeighted(enhanced_image, 1.0, unsharp_mask, 1.5, 0)
    final_enhanced_image = np.clip(final_enhanced_image, 0, 255).astype(np.uint8)

    return final_enhanced_image

def auto_segment(image):
    img_type = detect_image_type(image)
    if img_type == "natural":
        return None, "skip"
    
    mask = segment_mri_robust(image)
    if np.sum(mask) == 0:
        return None, "skip"
    
    return mask, "segmented"

def process_single_image_auto(img_path, img_data, lower_threshold, upper_threshold):
    denoised_img, _ = auto_denoise(img_data, lower_threshold, upper_threshold)
    enhanced_img = auto_enhance(denoised_img)
    mask, _ = auto_segment(enhanced_img)

    if mask is None:
        return img_path, enhanced_img
    else:
        final_segmented_image = apply_mask_overlay(enhanced_img, mask)
        return img_path, final_segmented_image

def median_filter(img, kernel_size=5):
    return cv2.medianBlur(img, kernel_size)

def gaussian_filter(img, kernel_size, sigma=1.0):
    return cv2.GaussianBlur(img, (kernel_size, kernel_size), sigma)

def bilateral_filter(img, d=9, sigma_color=75, sigma_space=75):
    return cv2.bilateralFilter(img, d, sigma_color, sigma_space)

def NLM_filter(img, h=10, template_window_size=7, search_window_size=21):
    return cv2.fastNlMeansDenoisingColored(img, None, h, h, template_window_size, search_window_size)

def apply_clahe(img, clip_limit=3.0, tile_grid_size=(8, 8)):
    lab_image = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab_image)
    clahe = cv2.createCLAHE(clipLimit=clip_limit, tileGridSize=tile_grid_size)
    l_channel_enhanced = clahe.apply(l_channel)
    lab_enhanced = cv2.merge((l_channel_enhanced, a_channel, b_channel))
    return cv2.cvtColor(lab_enhanced, cv2.COLOR_LAB2BGR)

def apply_gamma_correction(img, gamma=1.0):
    inv_gamma = 1.0 / gamma
    table = np.array([((i / 255.0) ** inv_gamma) * 255 for i in np.arange(256)]).astype("uint8")
    return cv2.LUT(img, table)

def unsharp_masking(img, blur_ksize=(5, 5), alpha=1.5):
    blurred = cv2.GaussianBlur(img, blur_ksize, 1.0)
    unsharp_mask = cv2.addWeighted(img, 1.0, blurred, -1.0, 0)
    final_image = cv2.addWeighted(img, 1.0, unsharp_mask, alpha, 0)
    return np.clip(final_image, 0, 255).astype(np.uint8)

def histogram_equalization(img):
    img_yuv = cv2.cvtColor(img, cv2.COLOR_BGR2YUV)
    img_yuv[:, :, 0] = cv2.equalizeHist(img_yuv[:, :, 0])
    return cv2.cvtColor(img_yuv, cv2.COLOR_YUV2BGR)

def grabcut_segmentation(img):
    height, width, _ = img.shape
    margin_x = int(width * 0.20)
    margin_y = int(height * 0.20)
    rect = (margin_x, margin_y, width - 2 * margin_x, height - 2 * margin_y)
    
    mask = np.zeros(img.shape[:2], np.uint8) 
    bgdModel = np.zeros((1, 65), np.float64)
    fgdModel = np.zeros((1, 65), np.float64)
    
    cv2.grabCut(img, mask, rect, bgdModel, fgdModel, 5, cv2.GC_INIT_WITH_RECT)
    final_mask = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 1, 0).astype('uint8')
    return final_mask * 255

def process_single_image_advanced(img_path, img_data, noise_mode="none", enhance_mode="none", segment_mode="none", lower_threshold=None, upper_threshold=None):
    img = img_data.copy()

    if noise_mode == "none":
        denoised = img
    elif noise_mode == "median":
        denoised = median_filter(img)
    elif noise_mode == "gaussian":
        denoised = gaussian_filter(img, kernel_size=5)
    elif noise_mode == "bilateral":
        denoised = bilateral_filter(img)
    elif noise_mode == "nlm":
        denoised = NLM_filter(img)
    elif noise_mode == "auto":
        denoised, _ = auto_denoise(img, lower_threshold, upper_threshold)
    else:
        denoised = img

    if enhance_mode == "none":
        enhanced = denoised
    elif enhance_mode == "clahe":
        enhanced = apply_clahe(denoised)
    elif enhance_mode == "gamma":
        enhanced = apply_gamma_correction(denoised, gamma=1.2)
    elif enhance_mode == "unsharp":
        enhanced = unsharp_masking(denoised)
    elif enhance_mode == "hist":
        enhanced = histogram_equalization(denoised)
    elif enhance_mode == "auto":
        enhanced = auto_enhance(denoised)
    else:
        enhanced = denoised

    if segment_mode == "none":
        return img_path, enhanced
    elif segment_mode == "auto":
        mask, _ = auto_segment(enhanced)
        if mask is None:
            return img_path, enhanced
        else:
            final_img = apply_mask_overlay(enhanced, mask)
            return img_path, final_img
    elif segment_mode == "grabcut":
        mask = grabcut_segmentation(enhanced)
        final_img = apply_mask_overlay(enhanced, mask)
        return img_path, final_img
    else:
        return img_path, enhanced