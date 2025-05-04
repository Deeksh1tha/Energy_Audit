import subprocess
import requests
import os
import yaml
import time
import psutil

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

    print(f"[{name}] Running: {' '.join(command)} in {cwd or os.getcwd()}")

    if background:
        process = subprocess.Popen(command, cwd=cwd, env=env, shell=use_shell)

        # Wait a moment to let child processes spawn
        time.sleep(1)

        try:
            parent = psutil.Process(process.pid)
            children = parent.children(recursive=True)
            real_pids = [child.pid for child in children if child.pid != parent.pid] or [parent.pid]

        except Exception as e:
            print(f"Error finding child processes: {e}")
            real_pids = [process.pid]

        print(f"[{name}] Real PIDs: {real_pids}")
        return real_pids
    else:
        subprocess.run(command, cwd=cwd, env=env, shell=use_shell)
        return None

def run_all_services(config_path="config.yaml"):
    with open(config_path, 'r') as f:
        config = yaml.safe_load(f)

    pids_object = {}
    for name, service in config['services'].items():
        pids = run_service(name, service)
        if pids:
            pids_object[name] = pids
        
        send_pids_to_tracker(name, pid_list=pids_object)

    print("\n✅ Running services with PIDs:", pids_object)
    return pids

def send_pids_to_tracker(service_name, pid_list, url="http://localhost:5000/register_pids"):
    payload = {
        "service": service_name,
        "pids": pid_list
    }
    try:
        response = requests.post(url, json=payload)
        print(f"[{service_name}] Sent to tracker: {response.status_code}")
    except Exception as e:
        print("Failed to send PIDs:", e)

if __name__ == "__main__":
    run_all_services("config-template.yaml")
