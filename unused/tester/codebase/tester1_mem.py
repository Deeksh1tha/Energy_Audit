#!/usr/bin/env python3
"""
Memory Intensive Script - High memory usage with varying CPU patterns
This script allocates large amounts of memory while performing periodic 
CPU-intensive operations to create a different resource usage pattern.
"""

import argparse
import time
import os
import random
import gc
import threading
import numpy as np
from datetime import datetime

class MemoryConsumer:
    def __init__(self, target_mb=1000, duration=60, cpu_spikes=True):
        """
        Initialize memory consumer
        
        Args:
            target_mb: Target memory usage in MB
            duration: How long to run in seconds
            cpu_spikes: Whether to include CPU spikes
        """
        self.target_mb = target_mb
        self.duration = duration
        self.cpu_spikes = cpu_spikes
        self.stop_event = threading.Event()
        self.memory_blocks = []
        self.block_size_mb = 50  # Allocate memory in 50MB chunks
    
    def memory_allocation_task(self):
        """Gradually allocate memory up to the target"""
        print(f"[PID: {os.getpid()}] Starting memory allocation task...")
        
        try:
            current_mb = 0
            while current_mb < self.target_mb and not self.stop_event.is_set():
                # Calculate size to allocate
                alloc_size = min(self.block_size_mb, self.target_mb - current_mb)
                
                # Allocate memory and fill with random data
                # Each element is 8 bytes (float64), so elements = bytes / 8
                elements = int(alloc_size * 1024 * 1024 / 8)
                memory_block = np.random.random(elements)
                
                # Store reference to prevent garbage collection
                self.memory_blocks.append(memory_block)
                
                current_mb += alloc_size
                print(f"[PID: {os.getpid()}] Allocated {current_mb}MB of {self.target_mb}MB")
                
                # Small pause between allocations
                time.sleep(0.5)
            
            print(f"[PID: {os.getpid()}] Reached target memory allocation: {current_mb}MB")
            
            # Keep the memory allocated until duration is reached
            self.stop_event.wait(timeout=self.duration)
            
        except MemoryError:
            print(f"[PID: {os.getpid()}] Memory error occurred. Current allocation: {current_mb}MB")
        
        print(f"[PID: {os.getpid()}] Memory task completed. Releasing memory...")
        
        # Release memory
        self.memory_blocks.clear()
        gc.collect()
    
    def cpu_spike_task(self):
        """Create periodic CPU spikes"""
        print(f"[PID: {os.getpid()}] Starting CPU spike task...")
        
        end_time = time.time() + self.duration
        spike_count = 0
        
        while time.time() < end_time and not self.stop_event.is_set():
            # Wait between spikes
            time.sleep(random.uniform(3, 8))
            
            if self.stop_event.is_set():
                break
            
            # Create a CPU spike for 1-3 seconds
            spike_duration = random.uniform(1, 3)
            spike_end = time.time() + spike_duration
            spike_count += 1
            
            print(f"[PID: {os.getpid()}] CPU spike {spike_count} started for {spike_duration:.2f}s")
            
            while time.time() < spike_end and not self.stop_event.is_set():
                # Matrix operations for CPU spike
                size = random.randint(100, 500)
                a = np.random.random((size, size))
                b = np.random.random((size, size))
                c = np.dot(a, b)
                del a, b, c
            
            print(f"[PID: {os.getpid()}] CPU spike {spike_count} ended")
        
        print(f"[PID: {os.getpid()}] CPU spike task completed. Generated {spike_count} spikes")
    
    def run(self):
        """Run memory and CPU tasks"""
        threads = [
            threading.Thread(target=self.memory_allocation_task)
        ]
        
        if self.cpu_spikes:
            threads.append(threading.Thread(target=self.cpu_spike_task))
        
        start_time = datetime.now()
        print(f"[PID: {os.getpid()}] Starting at {start_time}")
        
        # Start all threads
        for t in threads:
            t.start()
        
        try:
            # Wait for duration
            time.sleep(self.duration)
        except KeyboardInterrupt:
            print("\nInterrupted by user. Cleaning up...")
        finally:
            # Signal threads to stop
            self.stop_event.set()
            
            # Wait for threads to finish
            for t in threads:
                t.join()
            
            # Ensure memory is released
            self.memory_blocks.clear()
            gc.collect()
        
        end_time = datetime.now()
        runtime = (end_time - start_time).total_seconds()
        print(f"[PID: {os.getpid()}] Completed at {end_time} (ran for {runtime:.2f} seconds)")

def main():
    parser = argparse.ArgumentParser(description="Memory Intensive Script")
    parser.add_argument("--memory", type=int, default=1000, 
                        help="Target memory usage in MB (default: 1000)")
    parser.add_argument("--duration", type=int, default=60, 
                        help="Duration to run in seconds (default: 60)")
    parser.add_argument("--no-cpu-spikes", action="store_true", 
                        help="Disable CPU spikes")
    
    args = parser.parse_args()
    
    print(f"Starting memory-intensive operations")
    print(f"Target memory usage: {args.memory}MB")
    print(f"Running for {args.duration} seconds")
    print(f"CPU spikes: {'disabled' if args.no_cpu_spikes else 'enabled'}")
    print(f"Process PID: {os.getpid()}")
    
    # Create and run the memory consumer
    consumer = MemoryConsumer(
        target_mb=args.memory, 
        duration=args.duration,
        cpu_spikes=not args.no_cpu_spikes
    )
    consumer.run()
    
    print("Memory-intensive task completed")

if __name__ == "__main__":
    main()