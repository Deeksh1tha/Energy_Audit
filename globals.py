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
CPU_USAGE = Gauge('cpu_usage', "CPU Usage")
MEM_USAGE = Gauge('mem_usage', "Memory Usage")
NRG_CNSMP = Gauge("energy_consumption", "Energy Consumption (kWh)")
CRBN_EMSN = Gauge("carbon_emissions", "Carbon Emissions")
PWR_USAGE = Gauge("power_usage", "Power Usage (Watts)")

def prometheus_set(cpu=0, mem=0, energy=0, co2=0, power=0):
    CPU_USAGE.set(cpu)
    MEM_USAGE.set(mem)
    NRG_CNSMP.set(energy)
    CRBN_EMSN.set(co2)
    PWR_USAGE.set(power)

def prometheus_reset():
    CPU_USAGE.set(0)
    MEM_USAGE.set(0)
    NRG_CNSMP.set(0)
    CRBN_EMSN.set(0)
    PWR_USAGE.set(0)
