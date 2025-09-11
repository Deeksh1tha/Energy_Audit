#!/usr/bin/env python3
"""
CPU Intensive Script - High CPU utilization with moderate memory usage
This script performs heavy mathematical calculations across multiple processes
to maximize CPU usage while keeping memory footprint moderate.
"""

import multiprocessing
import time
import argparse
import os
import math
import random

def cpu_intensive_task(duration=60, intensity=90):
    """
    Perform CPU-intensive calculations
    
    Args:
        duration: How long to run in seconds
        intensity: Target CPU percentage (approximate)
    """
    print(f"[PID: {os.getpid()}] Starting CPU-intensive task...")
    
    # Calculate how much work needed per cycle based on intensity
    work_time = 0.01 * intensity / 100
    sleep_time = 0.01 - work_time
    sleep_time = max(0.001, sleep_time)  # Ensure minimum sleep
    
    end_time = time.time() + duration
    counter = 0
    
    while time.time() < end_time:
        # Heavy CPU work
        start_work = time.time()
        while time.time() - start_work < work_time:
            # Mix of floating point and integer operations
            for _ in range(10000):
                x = math.sin(random.random() * 2 * math.pi)
                y = math.cos(random.random() * 2 * math.pi)
                z = math.sqrt(x*x + y*y)
                
                # Add some prime number calculations
                num = random.randint(100000, 999999)
                is_prime = all(num % i != 0 for i in range(2, int(math.sqrt(num)) + 1))
                
            counter += 1
            
        # Short sleep to regulate CPU usage
        time.sleep(sleep_time)
        
        if counter % 50 == 0:
            print(f"[PID: {os.getpid()}] Still working... ({counter} iterations)")
    
    print(f"[PID: {os.getpid()}] CPU task completed. Performed {counter} iterations.")

def main():
    parser = argparse.ArgumentParser(description="CPU Intensive Script")
    parser.add_argument("--duration", type=int, default=60, 
                        help="Duration to run in seconds (default: 60)")
    parser.add_argument("--processes", type=int, default=3,
                        help=f"Number of processes to use (default: {3})")
    parser.add_argument("--intensity", type=int, default=80,
                        help="Target CPU intensity percentage (default: 80)")
    
    args = parser.parse_args()
    
    print(f"Starting CPU-intensive operations with {args.processes} processes")
    print(f"Target CPU utilization: {args.intensity}%")
    print(f"Running for {args.duration} seconds")
    print(f"Main process PID: {os.getpid()}")
    
    # Create a moderate-sized array in memory (about 100MB)
    memory_usage = [0] * (25 * 1024 * 1024)  # ~100MB (4 bytes per int)
    
    # Start multiple processes to utilize CPU cores
    processes = []
    for i in range(args.processes):
        p = multiprocessing.Process(
            target=cpu_intensive_task, 
            args=(args.duration, args.intensity)
        )
        processes.append(p)
        p.start()
        print(f"Started process {i+1} with PID {p.pid}")
    
    # Wait for all processes to complete
    for p in processes:
        p.join()
    
    print("All CPU-intensive tasks completed")

if __name__ == "__main__":
    main()