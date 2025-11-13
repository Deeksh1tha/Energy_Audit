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

if __name__ == "__main__":
    pids = get_all_container_pids()
    print("Containerized PIDs:", pids)
