import time
import threading
import psutil
from process import Process
import energy_bridge
from helper import get_carbon_intensity_electricity_maps, get_location_from_ip, projected_annual_trees_cost # Changed import


ENERGY_INTERVAL = 2

class MetricsCollector:
    def __init__(self, platform, interval=ENERGY_INTERVAL, electricity_maps_api_key=None): # Changed arguments
        self.platform = platform
        self.interval = interval

        self.tracked = set()  # (service_name, pid)
        self.tracked_lock = threading.Lock()
        self.pid_metrics = {}
        self.system_efficiency_index = []
        self.last_total_carbon_mg = 0.0 # Track previous total carbon

        energy_bridge.initialize()
        self.previous_results = energy_bridge.py_collect(False, 0)
        
        self.carbon_intensity = 0.0 # Default value
        if electricity_maps_api_key: # Changed condition
            location = get_location_from_ip()
            if location:
                self.carbon_intensity = get_carbon_intensity_electricity_maps( # Changed function call
                    api_key=electricity_maps_api_key, 
                    latitude=location["latitude"], 
                    longitude=location["longitude"]
                )
        else:
            print("Warning: Electricity Maps API key not provided. Carbon emissions will be 0.")
        print(f"✅ [DEBUG] Carbon intensity initialized to: {self.carbon_intensity} gCO2/kWh")


        # if self.platform.startswith("linux"):
        #     pyRAPL.setup()

    def add_pid(self, item):
        with self.tracked_lock:
            self.tracked.add(item)

    def remove_pid(self, item):
        with self.tracked_lock:
            self.tracked.discard(item)

    def _init_process_objects(self):
        
        process_objects = {}
        with self.tracked_lock:
            pids = list(self.tracked)
        
        # pids = [("Spotify", 21940), ("Code", 22828)]

        for service_name, pid in pids:
            try:
                proc = Process(pid)
                proc.cpu_usage(0)

                process_objects[pid] = (service_name, proc)

                if pid not in self.pid_metrics:
                    self._init_pid_metrics(pid, proc)

            except psutil.NoSuchProcess:
                self.remove_pid((service_name, pid))

        return process_objects

    def _init_pid_metrics(self, pid, proc):
        self.pid_metrics[pid] = {
            "name": proc.name,
            "cpu_utilization": [],
            "memory_usage": [],
            "energy_consumption": [],
            "carbon_emissions": [],
            "power_usage": [],
            "network_usage": [],
            "timestamps": [],
        }

    def _measure_energy(self):
        results = energy_bridge.py_collect(False, 0)
        
        if "CPU_ENERGY (J)" in results:
            energy = results["CPU_ENERGY (J)"]
            old_energy = self.previous_results.get("CPU_ENERGY (J)", 0.0)

        elif "PACKAGE_ENERGY (J)" in results:
            energy = results["PACKAGE_ENERGY (J)"]
            old_energy = self.previous_results.get("PACKAGE_ENERGY (J)", 0.0)

        # elif "CPU_POWER (Watts)" in results:
        #     energy = results["CPU_POWER (Watts)"]
        #     energy_array += energy * (previous_time_elapsed_ms / 1000.0)

        # elif "SYSTEM_POWER (Watts)" in results:
        #     energy = results["SYSTEM_POWER (Watts)"]
        #     energy_array += energy * (previous_time_elapsed_ms / 1000.0)
        #     energy_array += energy - old_energy

        self.previous_results = results
        return energy - old_energy

        # if self.platform.startswith("linux"):
        #     meter = pyRAPL.Measurement("Linux RAPL Detailed")
        #     meter.begin()
        #     time.sleep(self.interval)
        #     meter.end()
        #     return meter.result.pkg[0] / 1_000_000
        # else:
        #     current_energy, _, _, _, _ = get_energy_windows_intel(self.interval)
        #     return current_energy

    def _collect_process_metrics(self, pid, service_name, proc: Process, current_energy, avg_cpu_util):
        cpu_percent = proc.cpu_usage()
        mem_usage = proc.memory_usage()
        net_usage = proc.network_usage()
        last_energy = (
            self.pid_metrics[pid]['energy_consumption'][-1]
            if self.pid_metrics[pid]['energy_consumption']
            else 0
        )
        
         # Add this block for last carbon value
        last_carbon = (
            self.pid_metrics[pid]['carbon_emissions'][-1]
            if self.pid_metrics[pid]['carbon_emissions']
            else 0
        )

        scaling_factor = cpu_percent / avg_cpu_util if avg_cpu_util > 0 else 0
        power_usage = scaling_factor * current_energy
        process_energy =  power_usage + last_energy
        
        energy_kwh = power_usage / 3_600_000  # Convert Joules to kWh
        # Carbon for this interval (in mg)
        carbon_interval_mg = (energy_kwh * self.carbon_intensity) * 1000
        # Add to the previous total to get the new cumulative total
        process_carbon_total = carbon_interval_mg + last_carbon
        
        # This print now shows the CUMULATIVE total, which is what you want to see
        print(f"✅ [DEBUG pid:{pid}] Interval CPU: {cpu_percent:.2f}%, Interval Carbon: {carbon_interval_mg:.4f} mg -> Cumulative Carbon: {process_carbon_total:.4f} mg")

        self.pid_metrics[pid]["timestamps"].append(time.time())
        self.pid_metrics[pid]["cpu_utilization"].append(cpu_percent)
        self.pid_metrics[pid]["memory_usage"].append(mem_usage)
        self.pid_metrics[pid]["energy_consumption"].append(process_energy)
        # Append the new CUMULATIVE total
        self.pid_metrics[pid]["carbon_emissions"].append(process_carbon_total)

        self.pid_metrics[pid]["power_usage"].append(power_usage)
        # self.pid_metrics[pid]["network_usage"].append(net_usage)

        print(f"[{service_name}] PID {pid} — CPU: {cpu_percent:.2f}%, Mem: {mem_usage:.2f}MB, Net: {net_usage['rx_bytes'] + net_usage['tx_bytes']} bytes")

    def collect_once(self):
        process_objects = self._init_process_objects()
        current_energy = self._measure_energy()
        avg_cpu_util = psutil.cpu_percent(interval=None)

        # --- System-wide Efficiency Index Calculation ---
        # Weights for combining metrics. You can adjust these.
        W_CPU = 0.5
        W_MEM = 0.5

        # Get system-wide memory usage percentage
        mem_percent = psutil.virtual_memory().percent

        # Combine weighted CPU and Memory utilization. Lower is better.
        # We use the total energy of the interval as a scaling factor for the index.
        system_efficiency_index = ((W_CPU * avg_cpu_util) + (W_MEM * mem_percent)) * current_energy
        self.system_efficiency_index.append(system_efficiency_index)
        # --- End of System-wide Efficiency Index Calculation ---

        for pid, (service_name, proc) in process_objects.items():
            try:
                if proc.proc is not None:
                    self._collect_process_metrics(pid, service_name, proc, current_energy, avg_cpu_util)
                else:
                    raise Exception("Process Object not attached!")
            except:
                print(f"Process exited / not-found, removing {pid} from tracklist!")
                self.remove_pid((service_name, pid))
        
        # --- System-wide Terminal Output ---
        current_total_carbon_mg = sum(
            self.pid_metrics[pid]['carbon_emissions'][-1]
            for pid in self.pid_metrics
            if self.pid_metrics[pid]['carbon_emissions']
        )
        
        # Calculate carbon emitted in this interval
        interval_carbon_mg = current_total_carbon_mg - self.last_total_carbon_mg
        self.last_total_carbon_mg = current_total_carbon_mg

        # Project the annual tree cost based on the current rate
        annual_tree_cost = projected_annual_trees_cost(interval_carbon_mg, self.interval)

        print("\n" + "="*60)
        print(f"📊 SYSTEM STATUS UPDATE (at current rate)")
        print(f"  - System Efficiency Index: {system_efficiency_index:.4f} (Lower is better)")
        print(f"  - Projected Annual Carbon Cost: {annual_tree_cost * 21:.2f} kg CO2/year")
        print(f"  - Equivalent Annual Tree Cost: {annual_tree_cost:.4f} trees/year")
        print("="*60 + "\n")
        
    # Main function
    def loop_forever(self):
        psutil.cpu_percent(interval=None)
        while True:
            self.collect_once()
            time.sleep(1)

    def get_metrics(self, fetch_all=True, start_index=None, end_index=None):
        result = {}

        pid_snapshot = dict(self.pid_metrics)
        for pid, metrics in pid_snapshot.items():

            pid_data = {"name": metrics["name"]}

            for key, values in metrics.items():
                if not isinstance(values, list):
                    continue

                if fetch_all:
                    pid_data[key] = values[:]
                else:
                    start = start_index or 0
                    end = end_index or len(values)
                    pid_data[key] = values[start:end]

            result[pid] = pid_data
        
        # Add system-wide metrics to the result
        result["system"] = {
            "efficiency_index": self.system_efficiency_index
        }

        return result
