import time
from concurrent.futures import ThreadPoolExecutor

def run_serial(args_list):
    start = time.time()
    results = []

    for args in args_list:
        results.append(process_single(*args))

    end = time.time()
    return results, end - start


def run_parallel(args_list):
    start = time.time()

    with ThreadPoolExecutor() as executor:
        results = list(
            executor.map(lambda p: process_single(*p), args_list)
        )

    end = time.time()
    return results, end - start


def process_single(
    img_path,
    img_data,
    mode,
    noise_mode,
    enhance_mode,
    segment_mode,
    lower,
    upper
):
    """
    Dispatches image processing based on selected mode.
    """

    from image_pipeline import (
        process_single_image_auto,
        process_single_image_advanced
    )

    if mode == "auto":
        return process_single_image_auto(
            img_path,
            img_data,
            lower,
            upper
        )

    elif mode == "advanced":
        return process_single_image_advanced(
            img_path,
            img_data,
            noise_mode,
            enhance_mode,
            segment_mode,
            lower,
            upper
        )

    else:
        raise ValueError(f"Unknown mode: {mode}")
