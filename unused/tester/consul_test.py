import multiprocessing
import time
import requests
from tqdm import tqdm

# Test duration
DURATION = 30  # seconds
CONSUL_URL = "http://localhost:8500/v1/health/state/any"  # Expensive API call

# Function to overload Consul
def network_stress(end_time):
    session = requests.Session()
    while time.time() < end_time:
        try:
            # Send multiple requests to overload Consul
            for _ in range(50):  
                session.get(CONSUL_URL, timeout=2)
        except:
            pass

if __name__ == "__main__":
    start_time = time.time()
    end_time = start_time + DURATION

    processes = []
    for _ in range(multiprocessing.cpu_count() * 2):  # Max parallelism
        p = multiprocessing.Process(target=network_stress, args=(end_time,))
        p.start()
        processes.append(p)

    for _ in tqdm(range(DURATION), desc="Stressing Consul"):
        time.sleep(1)

    for p in processes:
        p.terminate()
        p.join()

    print("Consul stress test completed.")
