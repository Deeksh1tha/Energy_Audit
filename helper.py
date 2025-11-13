import time
import sys
import subprocess
import io
import pandas as pd
import docker
import threading
from tqdm import tqdm
from globals import prometheus_set, CARBON_INTENSITY, POWER_GADGET_PATH
import requests
import ipinfo
from watttime import WattTimeMyAccess, WattTimeHistorical
from datetime import datetime, timezone, timedelta
import base64

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

def get_location_from_ip():
    """
    Finds the geographic location (latitude, longitude) based on public IP
    using the ipinfo.io service.
    
    Returns:
        A dictionary with 'latitude' and 'longitude', or None on failure.
    """
    try:
        response = requests.get("https://ipinfo.io/json", timeout=5)
        response.raise_for_status()
        data = response.json()
        
        if "loc" in data:
            lat, lon = data["loc"].split(',')
            print(f"Automatically detected location: {data.get('city', 'N/A')}, {data.get('country', 'N/A')} ({lat}, {lon})")
            return {"latitude": lat, "longitude": lon}
        else:
            print("Could not determine location from IP via ipinfo.io.")
            return None
            
    except requests.exceptions.RequestException as e:
        print(f"Failed to connect to geolocation service: {e}")
        return None
    except (KeyError, ValueError) as e:
        print(f"Error parsing geolocation response: {e}")
        return None




def get_carbon_intensity_electricity_maps(api_key: str, latitude: str, longitude: str) -> float:
    """
    Fetches from Electricity Maps. 
    Falls back to a static average if the live grid data is missing (404) or on other errors.
    """
    url = "https://api.electricitymaps.com/v3/carbon-intensity/latest"
    headers = {"auth-token": api_key}
    params = {"lat": latitude, "lon": longitude}
    
    print(f"   [ElectricityMaps] Requesting data for ({latitude}, {longitude})...")

    try:
        response = requests.get(url, headers=headers, params=params, timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            val = data.get('carbonIntensity')
            zone = data.get('zone')
            print(f"   Live Data Found ({zone}): {val} gCO2/kWh")
            return val
            
        elif response.status_code == 404:
            print(f" API connected, but the zone for your location has no live data.")
            print(f" Switching to Static India Average...")
            return 632.0  # 2023 Average for India
            
        elif response.status_code in [401, 403]:
            print(" Error: API Key Refused. Check your key.")
            return 632.0 # Fallback
            
        else:
            print(f" API Error {response.status_code}: {response.text}")
            return 632.0 # Fallback
            
    except requests.exceptions.RequestException as e:
        print(f" Connection Failed: {e}")
        return 632.0 # Fallback

def projected_annual_trees_cost(carbon_mg_interval, interval_seconds):
    """
    Projects the carbon emitted in a single interval over a full year and 
    calculates the number of trees required to absorb that amount of CO2.
    """
    if carbon_mg_interval is None or carbon_mg_interval <= 0 or interval_seconds <= 0:
        return 0.0

    # Number of intervals in a year
    intervals_per_year = (365 * 24 * 60 * 60) / interval_seconds
    
    # Projected carbon for the entire year in grams
    projected_annual_carbon_g = (carbon_mg_interval * intervals_per_year) / 1000.0
    
    # CO2 absorption per mature tree in grams per year (approx. 21kg)
    co2_absorption_per_tree_grams_year = 21000.0
    
    # Number of trees needed to offset the projected annual emissions
    trees_cost = projected_annual_carbon_g / co2_absorption_per_tree_grams_year
    
    return trees_cost