import time
import sys
import subprocess
import io
import pandas as pd

from tqdm import tqdm
from globals import prometheus_set, CARBON_INTENSITY, POWER_GADGET_PATH

PLATFORM = sys.platform

if PLATFORM.startswith("win"):  # Windows
    import wmi
elif PLATFORM.startswith("linux"):  # Linux
    import psutil 
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
