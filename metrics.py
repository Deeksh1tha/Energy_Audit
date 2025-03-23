import cpuinfo
import psutil
import time
import sys
import subprocess
import io
import pandas as pd
from threading import Thread

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
    
    time.sleep(duration + 1)
    
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

# Implement for other configurations

# Linux (Intel - pyRAPL)
def get_energy_linux_rapl(duration):
    pass

# Mac OS
def get_energy_max():
    pass

def get_cpu_info():
    try:
        cpu_info = cpuinfo.get_cpu_info()
        cpu_freq = psutil.cpu_freq()
        
        try:
            temperatures = psutil.sensors_temperatures()
            if temperatures and 'coretemp' in temperatures:
                cpu_temp = temperatures['coretemp'][0].current
            else:
                cpu_temp = None
        except:
            cpu_temp = None
            
        return {
            'model': cpu_info.get('brand_raw', 'Unknown'),
            'frequency': cpu_freq.current if cpu_freq else None,
            'temperature': cpu_temp
        }
    except:
        return {
            'model': 'Unknown',
            'frequency': None,
            'temperature': None
        }
    
def run_process(process_name, duration=30):

    metrics_data = []
    timestamps = []
    
    # print([p.info['name'].lower() for p in psutil.process_iter(['name', 'cpu_percent', 'memory_info', 'io_counters'])])
    
    if not process_name.endswith('.exe') and PLATFORM.startswith("win"):
        process_name += '.exe'

    start_time = time.time()
    with tqdm(total=duration, desc="Running", bar_format="{l_bar}{bar} [ Time: {elapsed} / {remaining} ]") as pbar:
        while time.time() - start_time < duration:
            try:
                process_list = [p for p in psutil.process_iter(['name', 'cpu_percent', 'memory_info', 'io_counters']) 
                            if process_name.lower() in p.info['name'].lower()]
                
                if not process_list:
                    return None
                
                # Basic metrics
                total_cpu = sum(p.info['cpu_percent'] for p in process_list)
                total_mem = sum(p.info['memory_info'].rss for p in process_list)
                
                efficiency_score = 100 - ((total_cpu / psutil.cpu_count()) + 
                                          (total_mem / psutil.virtual_memory().total) * 50)

                metrics_data.append({
                    'cpu_usage': round(total_cpu, 1),
                    'memory_usage': round(total_mem / (1024 * 1024), 2),
                    'efficiency_score': round(max(0, min(efficiency_score, 100)), 1)
                })

                prometheus_set(
                    cpu=total_cpu,
                    mem=round(total_mem / (1024 * 1024), 2),
                )

                timestamps.append(time.strftime("%H:%M:%S"))
                
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue
            
            time.sleep(1)
            pbar.update(1)

    return metrics_data, timestamps if metrics_data else None

# don't change this class -> https://medium.com/@birenmer/threading-the-needle-returning-values-from-python-threads-with-ease-ace21193c148
class CustomThread(Thread):
    def __init__(self, group=None, target=None, name=None, args=(), kwargs={}, verbose=None):    
        super().__init__(group, target, name, args, kwargs)
        self._return = None

    # Overriding the Thread.run function
    def run(self):
        if self._target is not None:
            self._return = self._target(*self._args, **self._kwargs)

    def join(self):
        super().join()
        return self._return

def calculate_metrics(process_name, duration=10):
    
    # Add conditional here for other configurations
    if PLATFORM.startswith("win"):
        cpu_energy_thread = CustomThread(target=get_energy_windows_intel, args=(duration, "power_log.csv"))
    cpu_energy_thread.start()

    metrics_data, timestamps = run_process(process_name, duration)

    cpu_energy_results = cpu_energy_thread.join()

    avg_cpu = sum(metric['cpu_usage'] for metric in metrics_data) / len(metrics_data) if metrics_data else 0
    avg_mem = sum(metric['memory_usage'] for metric in metrics_data) / len(metrics_data) if metrics_data else 0
    process_energy_data = per_process(cpu_energy_results, avg_cpu, avg_mem)

    return metrics_data, timestamps, process_energy_data

def per_process(cpu_energy_data, avg_cpu=0.1, avg_mem=1024):
    if not cpu_energy_data:
        return None

    total_energy, avg_cpu_util, avg_cpu_freq, avg_processor_power, cumulative_energy = cpu_energy_data

    # Calculate the scaling factor for per-process energy
    scaling_factor = min(avg_cpu / avg_cpu_util if avg_cpu_util != 0 else 0, 0.9)

    print(avg_cpu, avg_cpu_util)

    # Calculate per-process energy metrics
    per_process_total_energy = total_energy * scaling_factor
    per_process_avg_processor_power = avg_processor_power * scaling_factor

    sci = CARBON_INTENSITY['default']
    return {
        'avg_cpu': avg_cpu,
        'avg_mem': avg_mem,
        'per_process_total_energy': per_process_total_energy,
        'per_process_gCO2': per_process_total_energy * sci,
        'per_process_avg_processor_power': per_process_avg_processor_power,
        'per_process_cumulative_energy': [energy * scaling_factor for energy in cumulative_energy],
        'per_process_cumulative_gCO2': [energy * sci for energy in cumulative_energy]
    }
