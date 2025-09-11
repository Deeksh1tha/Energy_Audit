import subprocess
import os
import yaml
import psutil
from threading import Thread
import time
import socket
import pickle

SOCKET_PATH = r"\\.\pipe\pid_socket"

# import requests
# SERVER_URL = "http://localhost:5000/update_pids"

# Monitor child processes of a service in background
def monitor_children(parent_pid, pid_set, interval=1.0, service_name=None):
    try:
        parent = psutil.Process(parent_pid)
        while parent.is_running():
            current_children = parent.children(recursive=True)
            new_pids = []
            for child in current_children:
                if child.pid not in pid_set:
                    pid_set.add(child.pid)
                    new_pids.append(child.pid)
                    print(f"[Monitor] New child detected: {child.pid}")

            # If any new PIDs were added, notify the server
            if new_pids and service_name:
                try:
                    send_pids(service_name, new_pids)
                    # requests.post(SERVER_URL, json={
                    #     "service": service_name,
                    #     "pids": new_pids
                    # })
                except Exception as e:
                    print(f"[Monitor] Failed to send PID update: {e}")

            time.sleep(interval)
    except psutil.NoSuchProcess:
        pass

def send_pids(service, pid_list):
    try:
        client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        # client.connect(SOCKET_PATH)
        client.connect(("127.0.0.1", 5052))

        # Send list of (service, pid) tuples
        updates = [(service, pid) for pid in pid_list]
        client.sendall(pickle.dumps(updates))
        client.close()
    except Exception as e:
        print(f"[Runner] Failed to send PIDs: {e}")

def run_service(name, config):
    command = [config['command']]
    if config.get('entrypoint'):
        command.append(config['entrypoint'])
    if 'args' in config:
        command.extend(config['args'])

    env = os.environ.copy()
    if 'env_vars' in config:
        env.update(config['env_vars'])

    cwd = config.get('working_directory', None)
    use_shell = config.get('shell', False)
    background = config.get('background', False)

    print(f"[{name}] Running: {' '.join(command)}")

    if background:
        process = subprocess.Popen(command, cwd=cwd, env=env, shell=use_shell)
        print(f"[{name}] PID: {process.pid}")
        pid_set = set([process.pid])

        if config.get('capture_pid', False):
            Thread(target=monitor_children, args=(process.pid, pid_set, 1.0, name), daemon=True).start()

        return pid_set
    else:
        subprocess.run(command, cwd=cwd, env=env, shell=use_shell)
        return set()

# Load config and run all services
def run_all_services(config_path="config-template.yaml"):
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)

    all_pids = {}
    for name, service in config['services'].items():
        pids = run_service(name, service)
        all_pids[name] = pids

    print("\n✅ All services launched. Tracking PIDs...\n")
    return all_pids

if __name__ == "__main__":
    all_tracked_pids = run_all_services("config-template.yaml")

    try:
        while True:
            print("=== Live PID Tracking ===")
            for service, pids in all_tracked_pids.items():
                print(f"{service}: {sorted(pids)}")
            print("=========================\n")
            time.sleep(5)
    except KeyboardInterrupt:
        print("🛑 Shutting down PID tracker.")
