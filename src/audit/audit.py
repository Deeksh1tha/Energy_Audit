import argparse
import os
import subprocess
import psutil
import time
import socket
import pickle
import json
import uuid
from datetime import datetime

import docker

def get_all_container_pids():
    client = docker.from_env()
    container_pids = []

    for c in client.containers.list():  # only running containers
        try:
            top_info = c.top()
            # The PID column name may vary (usually "PID")
            pid_index = top_info["Titles"].index("PID")
            pids = [int(proc[pid_index]) for proc in top_info["Processes"]]
            container_pids.extend(pids)
        except Exception as e:
            print(f"Failed to get PIDs for {c.name}: {e}")

    return container_pids

# === Config ===
PID_DIR = os.path.expanduser("~/.energy_audit/pids")
SOCKET_ADDR = ("127.0.0.1", 5052)  # default tracker socket


def atomic_write(path, data):
    tmp = f"{path}.tmp"
    with open(tmp, "w") as f:
        json.dump(data, f)
    os.replace(tmp, path)


def save_to_file(service, pids):
    
    os.makedirs(PID_DIR, exist_ok=True)
    file_path = os.path.join(PID_DIR, f"{service}.json")
    data = {
        "service": service,
        "pids": list(pids),
        "timestamp": datetime.utcnow().isoformat()
    }
    atomic_write(file_path, data)
    print(f"[Audit] Saved PIDs for {service} → {file_path}")


def send_pids(service, pid_list, socket_addr=SOCKET_ADDR):
    
    client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    client.settimeout(2)
    client.connect(socket_addr)
    updates = [(service, pid) for pid in pid_list]
    client.sendall(pickle.dumps(updates))
    client.close()
    print(f"[Audit] Sent PIDs for {service} → {pid_list}")


def track_process(command, service, interval=5):
    
    print(f"[Audit] Starting service '{service}' with command: {command}")
    process = subprocess.Popen(command, shell=True)
    pid_set = {process.pid}
    last_pids = set()
    
    try:
        if service.startswith("docker"):
            while True:
                container_pids = set(get_all_container_pids())
                if container_pids != last_pids:
                    try:
                        send_pids(service, container_pids)
                    except Exception:
                        save_to_file(service, container_pids)
                    last_pids = container_pids
                time.sleep(interval)
        else:
            while process.poll() is None:  
                current_pids = {process.pid}
                try:
                    parent = psutil.Process(process.pid)
                    for child in parent.children(recursive=True):
                        current_pids.add(child.pid)
                except psutil.NoSuchProcess:
                    pass

                if current_pids != last_pids:
                    try:
                        send_pids(service, current_pids)
                    except Exception:
                        save_to_file(service, current_pids)
                    last_pids = current_pids

                time.sleep(interval)
    except KeyboardInterrupt:
        print(f"[Audit] Stopping service '{service}'")
    finally:
        if process.poll() is None:
            process.terminate()


def main():
    parser = argparse.ArgumentParser(prog="audit", description="Audit processes for energy tracking")
    parser.add_argument("-p", "--program", required=True, help="Program command to audit (e.g. 'py server.py')")
    parser.add_argument("-n", "--name", help="Service name (defaults to random UUID)")
    parser.add_argument("-i", "--interval", type=int, default=5, help="Polling interval (sec)")
    args = parser.parse_args()

    service_name = args.name or f"service-{uuid.uuid4().hex[:6]}"
    track_process(args.program, service_name, args.interval)


if __name__ == "__main__":
    main()
