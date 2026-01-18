import cv2
import os
import numpy as np
import time
from concurrent.futures import ThreadPoolExecutor

def load_images(img_paths):
    data=[]
    for path in img_paths:
        img=cv2.imread(path)
        if img is not None:
            data.append((path, img))
        else:
            print(f"Error: Could not load {path}")
    print(f"[I/O END] Finished reading {len(data)} images.")
    return data

def save_images(results):
    for path, final_img in results:
        output_path = f"output_images/auto_final_{os.path.basename(path)}"
        cv2.imwrite(output_path, final_img)
    print("[I/O END] Finished writing results.")

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
        img=cv2.imread(path)
        if img is None:
            print(f"Error: cannot load {path}")
            continue
        sigma = estimate_noise_mad(img)
        if sigma is not None:
            sigmas.append(sigma)

    if not sigmas:
        print("No valid images to process.")
        return None, None

    sigmas_arr = np.array(sigmas)
    median_sigma = np.median(sigmas_arr)
    std_sigma = np.std(sigmas_arr)

    lower_threshold = max(5.0, median_sigma - 0.5 * std_sigma) 
    upper_threshold = median_sigma + 0.75 * std_sigma

    print(f"Global Noise Thresholds: Lower={lower_threshold:.2f}, Upper={upper_threshold:.2f}")
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
    mask_gray = cv2.cvtColor(mask, cv2.COLOR_BGR2GRAY)
    
    red_layer[mask_gray == 255] = [0, 0, 255]  

    overlay_img = cv2.addWeighted(img, 1.0, red_layer, 0.4, 0)
    
    return overlay_img

def detect_roi_presence(img_gray):
    blur = cv2.GaussianBlur(img_gray, (5,5), 0)
    val, thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    foreground_ratio = np.sum(thresh == 255) / (thresh.size)

    if 0.05 < foreground_ratio < 0.8:
        return True
    return False


def segment_mri_robust(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    _, head_mask = cv2.threshold(gray, 10, 255, cv2.THRESH_BINARY)
    head_mask = cv2.morphologyEx(head_mask, cv2.MORPH_OPEN, np.ones((5,5), np.uint8))
    
    contours, _ = cv2.findContours(head_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours: return np.zeros_like(image)
        
    head_cnt = max(contours, key=cv2.contourArea)
    brain_mask = np.zeros_like(gray)
    cv2.drawContours(brain_mask, [head_cnt], -1, 255, -1)
    
    height, width = gray.shape
    erosion_size = int(min(height, width) * 0.05)
    if erosion_size < 3: erosion_size = 3
        
    kernel_erode = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (erosion_size, erosion_size))
    brain_only_mask = cv2.erode(brain_mask, kernel_erode)
    
    brain_pixels = cv2.bitwise_and(gray, gray, mask=brain_only_mask)
    
    min_val, max_val, min_loc, max_loc = cv2.minMaxLoc(brain_pixels)
    
    if max_val < 30: return np.zeros_like(image)
        
    dynamic_thresh_val = int(max_val * 0.70)
    _, tumor_candidates = cv2.threshold(brain_pixels, dynamic_thresh_val, 255, cv2.THRESH_BINARY)
    
    kernel_clean = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
    tumor_candidates = cv2.morphologyEx(tumor_candidates, cv2.MORPH_OPEN, kernel_clean, iterations=2)
    
    final_contours, _ = cv2.findContours(tumor_candidates, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    result_mask = np.zeros_like(image)
    
    for cnt in final_contours:
        area = cv2.contourArea(cnt)
        
        if area < 150: continue
            
        hull = cv2.convexHull(cnt)
        hull_area = cv2.contourArea(hull)
        if hull_area == 0: continue
            
        solidity = float(area) / hull_area
        if solidity < 0.5: continue
            
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
        action = f"Skip: σ ({sigma:.2f}) < lower_threshold ({lower_threshold:.2f})"

    elif sigma < upper_threshold:
        action = f"Mild: σ ({sigma:.2f}). Applying Bilateral Filter."

        filter_sigma = int(sigma * BILATERAL_FACTOR)

        denoised_image = cv2.bilateralFilter(
            img,
            d=9,
            sigmaColor=filter_sigma,
            sigmaSpace=filter_sigma
        )

    else:
        action = f"Strong: σ ({sigma:.2f}). Applying NLM Filter."

        h_parameter_raw = sigma * NLM_FACTOR

        h_parameter = int(np.clip(h_parameter_raw, 10, 10))

        # print(f"-> NLM 'h' set to: {h_parameter} (Raw was {h_parameter_raw:.2f}). MAX CAP 10.")

        denoised_image = cv2.fastNlMeansDenoisingColored(
            img, None,
            h=h_parameter,
            hColor=h_parameter,
            templateWindowSize=7,
            searchWindowSize=21
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
        return None, "skip (natural image)"
    
    mask = segment_mri_robust(image)
        
    if np.sum(cv2.cvtColor(mask, cv2.COLOR_BGR2GRAY)) == 0:
        return None, "skip (ROI not segmentable)"
    
    return mask, f"segmented ({img_type} type)"

def process_single_image_auto(img_path, img_data, lower_threshold, upper_threshold):
    # print(f"\n[PID {os.getpid()}] Processing: {os.path.basename(img_path)}")
    
    result_denoise = auto_denoise(img_data, lower_threshold, upper_threshold)
    if result_denoise is None:
        return img_path, img_data

    denoised_img, action_denoise = result_denoise
    enhanced_img = auto_enhance(denoised_img)

    mask, status = auto_segment(enhanced_img)

    # output_path = f"auto_final_{os.path.basename(img_path)}"
    if mask is None:
        return img_path,enhanced_img
    else:
        final_segmented_image = apply_mask_overlay(enhanced_img, mask)
        return img_path,final_segmented_image

imgs = [
    "input_images/test_image.png",
    "input_images/Noisy Image.png",
    "input_images/Clean Image.png",
    "input_images/Te-me_0010.jpg",
    "input_images/Te-me_0012.jpg",
    "input_images/Te-me_0025.jpg",
    "input_images/Te-me_0026.jpg",
    "input_images/Te-me_0027.jpg",
    "input_images/Te-me_0031.jpg",
    "input_images/Te-me_0038.jpg",
    "input_images/Te-me_0090.jpg",
    "input_images/Te-me_0098.jpg",
    "input_images/Te-meTr_0008.jpg",
    "input_images/img_forest.jpg"
]

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
    img_yuv = cv2.cvtColor(img, cv2.COLOR_BGR2YUV)
    img_yuv[:, :, 0] = cv2.equalizeHist(img_yuv[:, :, 0])
    equalized_img = cv2.cvtColor(img_yuv, cv2.COLOR_YUV2BGR)
    return equalized_img

def grabcut_segmentation(img):
    height, width, _ = img.shape
    margin_x = int(width * 0.20)
    margin_y = int(height * 0.20)
    
    rect = (margin_x, margin_y, width - 2 * margin_x, height - 2 * margin_y)
    
    
    mask = np.zeros(img.shape[:2], np.uint8) 
    
    bgdModel = np.zeros((1, 65), np.float64)
    fgdModel = np.zeros((1, 65), np.float64)
    
    cv2.grabCut(
        img, 
        mask, 
        rect, 
        bgdModel, 
        fgdModel, 
        5,
        cv2.GC_INIT_WITH_RECT
    )
    
    final_mask = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 1, 0).astype('uint8')
    
    
    mask_3ch = cv2.cvtColor(final_mask * 255, cv2.COLOR_GRAY2BGR) 

    return mask_3ch

def process_single_image_advanced(img_path,img_data,noise_mode="none", enhance_mode="none", segment_mode="none",lower_threshold=None, upper_threshold=None):
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

def run_wrapper(args):
    return process_single_image_auto(*args)

if __name__ == "__main__":
    lower, upper = calculate_global_noise_thresholds(imgs)
    image_data_list = load_images(imgs)
    if not image_data_list:
        print("No images loaded. Exiting.")
        exit()

    args_list = [(path, data, lower, upper) for path, data in image_data_list]
    
    args_list_adv = [
        (path, data, "bilateral", "clahe", "auto", lower, upper)
        for path, data in image_data_list
    ]

    for args in args_list_adv:
        res = process_single_image_advanced(*args)


    print("\n============================")
    print("🔵 Running SERIAL processing")
    print("============================")

    start_serial = time.time()
    serial_results = []
    for args in args_list_adv:
        res = process_single_image_advanced(*args)
        serial_results.append(res)

    end_serial = time.time()

    print(f"\nSerial Time: {end_serial - start_serial:.2f} sec")

    print("\n============================")
    print("🟣 Running PARALLEL processing")
    print("============================")


    start_parallel = time.time()

    final_results = []
    with ThreadPoolExecutor() as executor:
        results_iterator = executor.map(lambda p: process_single_image_advanced(*p), args_list_adv)
        final_results = list(results_iterator)

    end_parallel = time.time()
    print(f"\nParallel Time: {end_parallel - start_parallel:.2f} sec")
    print("\n============================")
    save_images(final_results)

