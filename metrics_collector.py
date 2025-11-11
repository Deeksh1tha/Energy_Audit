import time
import threading
import psutil
from process import Process
import energy_bridge

ENERGY_INTERVAL = 2

class MetricsCollector:
    def __init__(self, platform, interval=ENERGY_INTERVAL):
        self.platform = platform
        self.interval = interval

        self.tracked = set()  # (service_name, pid)
        self.tracked_lock = threading.Lock()
        self.pid_metrics = {}

        energy_bridge.initialize()
        self.previous_results = energy_bridge.py_collect(False, 0)

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

        scaling_factor = min(cpu_percent / avg_cpu_util if avg_cpu_util != 0 else 0, 0.9)
        power_usage = scaling_factor * current_energy
        process_energy =  power_usage + last_energy

        self.pid_metrics[pid]["timestamps"].append(time.time())
        self.pid_metrics[pid]["cpu_utilization"].append(cpu_percent)
        self.pid_metrics[pid]["memory_usage"].append(mem_usage)
        self.pid_metrics[pid]["energy_consumption"].append(process_energy)
        self.pid_metrics[pid]["power_usage"].append(power_usage)
        # self.pid_metrics[pid]["network_usage"].append(net_usage)

        print(f"[{service_name}] PID {pid} — CPU: {cpu_percent:.2f}%, Mem: {mem_usage:.2f}MB, Net: {net_usage['rx_bytes'] + net_usage['tx_bytes']} bytes")

    def collect_once(self):
        process_objects = self._init_process_objects()
        current_energy = self._measure_energy()
        avg_cpu_util = psutil.cpu_percent(interval=None)

        for pid, (service_name, proc) in process_objects.items():
            try:
                if proc.proc is not None:
                    self._collect_process_metrics(pid, service_name, proc, current_energy, avg_cpu_util)
                else:
                    raise Exception("Process Object not attached!")
            except:
                print(f"Process exited / not-found, removing {pid} from tracklist!")
                self.remove_pid((service_name, pid))
        
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

        return result
