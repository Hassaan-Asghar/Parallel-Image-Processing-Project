import time
from concurrent.futures import ThreadPoolExecutor
from image_pipeline import process_single_image_advanced

def run_serial(args_list):
    start = time.time()
    results = []
    for args in args_list:
        results.append(process_single_image_advanced(*args))
    end = time.time()
    return results, end - start

def run_parallel(args_list):
    start = time.time()
    with ThreadPoolExecutor() as executor:
        results = list(
            executor.map(lambda p: process_single_image_advanced(*p), args_list)
        )
    end = time.time()
    return results, end - start
