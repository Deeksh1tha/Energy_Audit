import time
import sys
import subprocess
import io
import pandas as pd
import docker
import threading
from tqdm import tqdm
from globals import prometheus_set, CARBON_INTENSITY, POWER_GADGET_PATH

PLATFORM = sys.platform

if PLATFORM.startswith("win"):  # Windows
    import wmi
    # from etw import ETW, ProviderInfo
    # NETWORK_PROVIDER = ProviderInfo("{7DD42A49-5329-4832-8DFD-43D979153A88}")
    # process_net_usage_win = {}
    # etw_thread_started = False
elif PLATFORM.startswith("linux"):  # Linux
    import psutil 
    from pyroute2 import IPRoute, NetlinkError
elif PLATFORM.startswith("darwin"):  # macOS
    import psutil
else:
    raise RuntimeError("Unsupported operating system")

# Windows (Intel)
def get_energy_windows_intel(duration, log_file="power_log.csv"):
    process = subprocess.Popen([POWER_GADGET_PATH, "-duration", str(duration), "-file", log_file], 
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    
    process.wait()
    time.sleep(duration)
    
    # Read the CSV file
    with open(log_file, "r") as file:
        lines = file.readlines()
    
    # Separate raw data and summary statistics
    raw_data = []
    summary_stats = []

    summary_mode = False

    for line in lines:
        if line.startswith("Total Elapsed Time") and not summary_mode:
            summary_mode = True

        if not summary_mode:
            raw_data.append(line)
        else:
            summary_stats.append(line)
    
    df = pd.read_csv(io.StringIO("\n".join(raw_data)), sep=",", skipinitialspace=True)
    
    df['Processor Power_0(Watt)'] = df['Processor Power_0(Watt)'].astype(float)
    
    energy_cols = [col for col in df.columns if "Cumulative Processor Energy" in col]
    if not energy_cols:
        return None, None, None, None, None

    energy_values = df[energy_cols[0]].astype(float)  # Convert to float for calculations
    total_energy = energy_values.iloc[-1] - energy_values.iloc[0]  # Total energy used in the duration
    
    # Calculate averages
    avg_cpu_util = df['CPU Utilization(%)'].mean()
    avg_cpu_freq = df['CPU Frequency_0(MHz)'].mean()
    avg_processor_power = df['Processor Power_0(Watt)'].mean()
    
    return total_energy, avg_cpu_util, avg_cpu_freq, avg_processor_power, list(df['Cumulative Processor Energy_0(Joules)'])

# ------------------------------
# Linux Implementation
# ------------------------------

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

# def on_event(event):
#         pid = event.process_id
#         size = event.payload.get("size", 0)
#         direction = event.payload.get("direction", "recv")

#         if pid not in process_net_usage_win:
#             process_net_usage_win[pid] = {"rx_bytes": 0, "tx_bytes": 0}

#         if direction == "send":
#             process_net_usage_win[pid]["tx_bytes"] += size
#         else:
#             process_net_usage_win[pid]["rx_bytes"] += size

# def start_etw_listener():
#     trace = ETW(providers=[NETWORK_PROVIDER], event_callback=on_event)
#     trace.start()

# def ensure_etw_thread():
#     global etw_thread_started
#     if not etw_thread_started:
#         t = threading.Thread(target=start_etw_listener, daemon=True)
#         t.start()
#         etw_thread_started = True

def get_process_net_usage_windows(pid):
    return {"rx_bytes": 0, "tx_bytes": 0}
    # ensure_etw_thread()
    # return process_net_usage_win.get(pid, {"rx_bytes": 0, "tx_bytes": 0})

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