import sys
from prometheus_client import Gauge

PLATFORM = sys.platform
POWER_GADGET_PATH = r"C:\Program Files\Intel\Power Gadget 3.6\PowerLog3.0.exe"

# Carbon intensity factors (gCO2/kWh) - simplified averages, import this from some API
CARBON_INTENSITY = {
    'coal': 820 / 3_600_000,          # 820 gCO2/kWh → 0.000227778 gCO2/J
    'natural_gas': 490 / 3_600_000,   # 490 gCO2/kWh → 0.000136111 gCO2/J
    'solar': 41 / 3_600_000,          # 41 gCO2/kWh → 0.000011389 gCO2/J
    'wind': 11 / 3_600_000,           # 11 gCO2/kWh → 0.000003056 gCO2/J
    'nuclear': 12 / 3_600_000,        # 12 gCO2/kWh → 0.000003333 gCO2/J
    'default': 500 / 3_600_000        # 500 gCO2/kWh → 0.000138889 gCO2/J
}

# Prometheus Gauges
CPU_USAGE = Gauge('cpu_usage', "CPU Usage (%)", ['pid', 'service'])
MEM_USAGE = Gauge('mem_usage', "Memory Usage (MB)", ['pid', 'service'])
NRG_CNSMP = Gauge("energy_consumption", "Energy Consumption (kWh)", ['pid', 'service'])
CRBN_EMSN = Gauge("carbon_emissions", "Carbon Emissions (kgCO2)", ['pid', 'service'])
PWR_USAGE = Gauge("power_usage", "Power Usage (Watts)", ['pid', 'service'])

def prometheus_set(pid, service, cpu=0, mem=0, energy=0, co2=0, power=0):
    CPU_USAGE.labels(pid=str(pid), service=service).set(cpu)
    MEM_USAGE.labels(pid=str(pid), service=service).set(mem)
    NRG_CNSMP.labels(pid=str(pid), service=service).set(energy)
    CRBN_EMSN.labels(pid=str(pid), service=service).set(co2)
    PWR_USAGE.labels(pid=str(pid), service=service).set(power)

def prometheus_reset_all():
    CPU_USAGE._metrics.clear()
    MEM_USAGE._metrics.clear()
    NRG_CNSMP._metrics.clear()
    CRBN_EMSN._metrics.clear()
    PWR_USAGE._metrics.clear()
