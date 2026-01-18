import cv2
import os
import numpy as np

def load_images(img_paths):
    data = []
    for path in img_paths:
        img = cv2.imread(path)
        if img is not None:
            data.append((path, img))
    return data

def save_images(results):
    for path, final_img in results:
        output_path = f"output_images/auto_final_{os.path.basename(path)}"
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
        return None, None
    sigmas_arr = np.array(sigmas)
    median_sigma = np.median(sigmas_arr)
    std_sigma = np.std(sigmas_arr)
    lower_threshold = max(5.0, median_sigma - 0.5 * std_sigma) 
    upper_threshold = median_sigma + 0.75 * std_sigma
    return lower_threshold, upper_threshold

def detect_image_type(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY) if len(img.shape) == 3 else img
    hist = cv2.calcHist([gray], [0], None, [256], [0, 256])
    hist_normalized = hist / hist.sum()
    entropy = -np.sum(hist_normalized * np.log2(hist_normalized + 1e-10))
    
    color_std = np.std(img)
    
    if color_std < 25:
        return "medical"
    
    return "natural"

def apply_mask_overlay(img, mask):
    red_layer = np.zeros_like(img, dtype=np.uint8)
    mask_gray = cv2.cvtColor(mask, cv2.COLOR_BGR2GRAY)
    red_layer[mask_gray > 0] = [0, 0, 255]  
    overlay_img = cv2.addWeighted(img, 1.0, red_layer, 0.4, 0)
    return overlay_img

def segment_mri_robust(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    gray_enhanced = clahe.apply(gray)
    
    blur = cv2.GaussianBlur(gray_enhanced, (5, 5), 0)
    
    _, head_mask = cv2.threshold(blur, 15, 255, cv2.THRESH_BINARY)
    head_mask = cv2.morphologyEx(head_mask, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    head_mask = cv2.morphologyEx(head_mask, cv2.MORPH_CLOSE, np.ones((7, 7), np.uint8))
    
    contours, _ = cv2.findContours(head_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return np.zeros_like(image)
    
    head_cnt = max(contours, key=cv2.contourArea)
    brain_mask = np.zeros_like(gray)
    cv2.drawContours(brain_mask, [head_cnt], -1, 255, -1)
    
    height, width = gray.shape
    erosion_size = max(3, int(min(height, width) * 0.08))
    kernel_erode = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (erosion_size, erosion_size))
    brain_only_mask = cv2.erode(brain_mask, kernel_erode)
    
    brain_pixels = cv2.bitwise_and(gray_enhanced, gray_enhanced, mask=brain_only_mask)
    
    min_val, max_val, _, _ = cv2.minMaxLoc(brain_pixels)
    
    if max_val < 50:
        return np.zeros_like(image)
    
    brain_area = cv2.countNonZero(brain_only_mask)
    
    p_low = np.percentile(brain_pixels[brain_only_mask == 255], 50)
    p_high = np.percentile(brain_pixels[brain_only_mask == 255], 85)
    
    tumor_mask = np.zeros_like(gray)
    
    for percentile in [85, 80, 75, 70, 65]:
        thresh_val = np.percentile(brain_pixels[brain_only_mask == 255], percentile)
        _, temp_mask = cv2.threshold(brain_pixels, int(thresh_val), 255, cv2.THRESH_BINARY)
        
        kernel_clean = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        temp_mask = cv2.morphologyEx(temp_mask, cv2.MORPH_OPEN, kernel_clean, iterations=1)
        temp_mask = cv2.morphologyEx(temp_mask, cv2.MORPH_CLOSE, kernel_clean, iterations=1)
        
        temp_mask = cv2.bitwise_and(temp_mask, temp_mask, mask=brain_only_mask)
        
        tumor_area = cv2.countNonZero(temp_mask)
        ratio = tumor_area / (brain_area + 1e-5)
        
        if 0.005 < ratio < 0.20:
            tumor_mask = temp_mask
            break
        elif ratio <= 0.005:
            tumor_mask = temp_mask
            break
    
    final_contours, _ = cv2.findContours(tumor_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    result_mask = np.zeros_like(image)
    
    min_contour_area = (height * width) * 0.0005
    max_contour_area = (height * width) * 0.30
    
    for cnt in final_contours:
        area = cv2.contourArea(cnt)
        
        if area < min_contour_area or area > max_contour_area:
            continue
        
        hull = cv2.convexHull(cnt)
        hull_area = cv2.contourArea(hull)
        if hull_area == 0:
            continue
        
        solidity = float(area) / hull_area
        if solidity < 0.35:
            continue
        
        approx = cv2.approxPolyDP(cnt, 0.02 * cv2.arcLength(cnt, True), True)
        if len(approx) < 3:
            continue
        
        cv2.drawContours(result_mask, [cnt], -1, (255, 255, 255), -1)
    
    return result_mask

def auto_denoise(img, lower_threshold, upper_threshold):
    sigma = estimate_noise_mad(img)
    if sigma is None:
        return None
    
    BILATERAL_FACTOR = 1.0
    NLM_FACTOR = 0.6
    
    denoised_image = img.copy()
    action = ""
    
    if sigma < lower_threshold:
        action = "Skip"
    elif sigma < upper_threshold:
        action = "Mild"
        filter_sigma = int(sigma * BILATERAL_FACTOR)
        denoised_image = cv2.bilateralFilter(img, d=9, sigmaColor=filter_sigma, sigmaSpace=filter_sigma)
    else:
        action = "Strong"
        h_parameter_raw = sigma * NLM_FACTOR
        h_parameter = int(np.clip(h_parameter_raw, 10, 10))
        denoised_image = cv2.fastNlMeansDenoisingColored(img, None, h=h_parameter, hColor=h_parameter, templateWindowSize=7, searchWindowSize=21)
    
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
        return None, "skip (natural image)"
    
    mask = segment_mri_robust(image)
    
    if np.sum(cv2.cvtColor(mask, cv2.COLOR_BGR2GRAY)) == 0:
        return None, "skip (ROI not segmentable)"
    
    return mask, f"segmented ({img_type} type)"

def process_single_image_auto(img_path, img_data, lower_threshold, upper_threshold):
    result_denoise = auto_denoise(img_data, lower_threshold, upper_threshold)
    if result_denoise is None:
        return img_path, img_data
    
    denoised_img, action_denoise = result_denoise
    enhanced_img = auto_enhance(denoised_img)
    
    mask, status = auto_segment(enhanced_img)
    
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
    enhanced_image = cv2.cvtColor(lab_enhanced, cv2.COLOR_LAB2BGR)
    
    return enhanced_image

def apply_gamma_correction(img, gamma=1.0):
    inv_gamma = 1.0 / gamma
    table = np.array([((i / 255.0) ** inv_gamma) * 255 for i in np.arange(256)]).astype("uint8")
    return cv2.LUT(img, table)

def unsharp_masking(img, blur_ksize=(5, 5), alpha=1.5):
    blurred = cv2.GaussianBlur(img, blur_ksize, 1.0)
    unsharp_mask = cv2.addWeighted(img, 1.0, blurred, -1.0, 0)
    final_image = cv2.addWeighted(img, 1.0, unsharp_mask, alpha, 0)
    final_image = np.clip(final_image, 0, 255).astype(np.uint8)
    return final_image

def histogram_equalization(img):
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    gray_enhanced = clahe.apply(gray)
    
    lab_image = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l_channel, a_channel, b_channel = cv2.split(lab_image)
    
    l_channel[:] = gray_enhanced
    
    lab_enhanced = cv2.merge((l_channel, a_channel, b_channel))
    enhanced_image = cv2.cvtColor(lab_enhanced, cv2.COLOR_LAB2BGR)
    
    return enhanced_image

def grabcut_segmentation(img):
    height, width = img.shape[:2]
    margin_x = int(width * 0.20)
    margin_y = int(height * 0.20)
    rect = (margin_x, margin_y, width - 2 * margin_x, height - 2 * margin_y)
    mask = np.zeros(img.shape[:2], np.uint8) 
    bgdModel = np.zeros((1, 65), np.float64)
    fgdModel = np.zeros((1, 65), np.float64)
    cv2.grabCut(img, mask, rect, bgdModel, fgdModel, 5, cv2.GC_INIT_WITH_RECT)
    final_mask = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 1, 0).astype('uint8')
    mask_3ch = cv2.cvtColor(final_mask * 255, cv2.COLOR_GRAY2BGR) 
    return mask_3ch

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
        if lower_threshold is None or upper_threshold is None:
            raise ValueError("Auto noise removal requires thresholds!")
        result = auto_denoise(img, lower_threshold, upper_threshold)
        denoised, _ = result
    else:
        raise ValueError(f"Unknown noise_mode: {noise_mode}")

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
        raise ValueError(f"Unknown enhance_mode: {enhance_mode}")

    if segment_mode == "none":
        return img_path, enhanced
    elif segment_mode == "auto":
        mask, status = auto_segment(enhanced)
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
        raise ValueError(f"Unknown segment_mode: {segment_mode}")