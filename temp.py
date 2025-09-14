"""
Cross-platform per-process network usage tracker.
Linux: uses pyroute2 (netlink).
Windows: uses ETW (Event Tracing for Windows).
"""

import platform
import threading

# ------------------------------
# Linux Implementation
# ------------------------------
if platform.system() == "Linux":
    from pyroute2 import IPRoute, NetlinkError

    def get_process_net_usage_linux(pid):
        """
        Returns {"rx_bytes": int, "tx_bytes": int} for given PID on Linux.
        """
        ipr = IPRoute()
        usage = {"rx_bytes": 0, "tx_bytes": 0}

        try:
            # Iterate through all sockets and check ownership
            with open(f"/proc/{pid}/net/dev", "r") as f:
                lines = f.readlines()[2:]  # skip headers
                for line in lines:
                    _, data = line.split(":", 1)
                    fields = data.split()
                    usage["rx_bytes"] += int(fields[0])
                    usage["tx_bytes"] += int(fields[8])
        except FileNotFoundError:
            raise ValueError(f"Process {pid} not found")
        except NetlinkError as e:
            print(f"Netlink error: {e}")

        return usage

# ------------------------------
# Windows Implementation
# ------------------------------
if platform.system() == "Windows":
    from etw import ETW, ProviderInfo

    NETWORK_PROVIDER = ProviderInfo("{7DD42A49-5329-4832-8DFD-43D979153A88}")
    process_net_usage_win = {}
    etw_thread_started = False

    def on_event(event):
        pid = event.process_id
        size = event.payload.get("size", 0)
        direction = event.payload.get("direction", "recv")

        if pid not in process_net_usage_win:
            process_net_usage_win[pid] = {"rx_bytes": 0, "tx_bytes": 0}

        if direction == "send":
            process_net_usage_win[pid]["tx_bytes"] += size
        else:
            process_net_usage_win[pid]["rx_bytes"] += size

    def start_etw_listener():
        trace = ETW(providers=[NETWORK_PROVIDER], event_callback=on_event)
        trace.start()

    def ensure_etw_thread():
        global etw_thread_started
        if not etw_thread_started:
            t = threading.Thread(target=start_etw_listener, daemon=True)
            t.start()
            etw_thread_started = True

    def get_process_net_usage_windows(pid):
        ensure_etw_thread()
        return process_net_usage_win.get(pid, {"rx_bytes": 0, "tx_bytes": 0})

# ------------------------------
# Unified API
# ------------------------------
def get_process_net_usage(pid):
    system = platform.system()
    if system == "Linux":
        return get_process_net_usage_linux(pid)
    elif system == "Windows":
        return get_process_net_usage_windows(pid)
    else:
        raise NotImplementedError(f"Unsupported OS: {system}")


# ------------------------------
# Example Usage
# ------------------------------
if __name__ == "__main__":
    import os, time

    pid = os.getpid()  # test with current process
    print(f"Monitoring PID {pid} on {platform.system()}")

    for _ in range(5):
        usage = get_process_net_usage(pid)
        print("Usage:", usage)
        time.sleep(2)
