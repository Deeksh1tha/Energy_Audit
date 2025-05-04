import subprocess
import os
import yaml
import psutil
import time
from threading import Thread

# Monitor child processes of a service in background
def monitor_children(parent_pid, pid_set, interval=1.0):
    try:
        parent = psutil.Process(parent_pid)
        while parent.is_running():
            current_children = parent.children(recursive=True)
            for child in current_children:
                if child.pid not in pid_set:
                    pid_set.add(child.pid)
                    print(f"[Monitor] New child detected: {child.pid}")
            time.sleep(interval)
    except psutil.NoSuchProcess:
        pass

# Launch a service and optionally monitor PIDs
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
            Thread(target=monitor_children, args=(process.pid, pid_set), daemon=True).start()

        return pid_set
    else:
        subprocess.run(command, cwd=cwd, env=env, shell=use_shell)
        return set()

# Load config and run all services
def run_all_services(config_path="config.yaml"):
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)

    all_pids = {}
    for name, service in config['services'].items():
        pids = run_service(name, service)
        all_pids[name] = pids

    print("\n✅ All services launched. Tracking PIDs...\n")
    return all_pids

if __name__ == "__main__":
    all_tracked_pids = run_all_services("config.yaml")

    try:
        while True:
            print("=== Live PID Tracking ===")
            for service, pids in all_tracked_pids.items():
                print(f"{service}: {sorted(pids)}")
            print("=========================\n")
            time.sleep(5)
    except KeyboardInterrupt:
        print("🛑 Shutting down PID tracker.")
