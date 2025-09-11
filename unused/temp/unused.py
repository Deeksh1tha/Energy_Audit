
# Not working
def get_power_usage_wmi(process_name):
    if not PLATFORM.startswith("win"):
        print("WMI called, but Operating System is not Windows!")
        return None

    try:
        pythoncom.CoInitialize()
        w = wmi.WMI(namespace="root\\CIMV2\\power")
        
        found_processes = []

        for process in w.Win32_PowerMeter():
            if process_name.lower() in process.Name.lower():
                found_processes.append({
                    "name": process.Name,
                    "power": float(process.Power)  # mW
                })
        
        if not found_processes:
            print(f"No processes matching '{process_name}' found")
            return None
            
        return found_processes
    
    except Exception as e:
        print(f"Error fetching power data: {e}")
        return None
    finally:
        pythoncom.CoUninitialize()