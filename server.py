from flask import Flask, request, jsonify, render_template, send_from_directory, Response
from flask_cors import CORS
import psutil
from prometheus_client import generate_latest
from metrics import get_cpu_info, calculate_metrics, get_energy_windows_intel
from globals import prometheus_reset_all, PLATFORM, prometheus_set

import threading
import time

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/metrics')
def metrics():
    return Response(generate_latest(), mimetype='text/plain')

tracked_pids = set()
tracked_pids_lock = threading.Lock()

@app.route("/register_pids", methods=["POST"])
def register_pids():
    data = request.get_json()
    service_group = data.get("service", "unknown")
    pids_dict = data.get("pids", {})

    with tracked_pids_lock:
        tracked_pids = set()
        for service_name, pids in pids_dict.items():
            try:
                for pid in pids:
                    pid = int(pid)
                    tracked_pids.add((service_name, pid))
            except (ValueError, TypeError):
                print(f"Invalid PID for {service_name}: {pid}")

    print(f"Registered PIDs from {service_group}: {pids_dict}")
    return jsonify({"status": "ok"}), 200

@app.route("/pids", methods=["GET"])
def get_all_pids():
    return jsonify({"pids": list(tracked_pids)}), 200

@app.route('/analyze-idle', methods=['POST'])
def analyze_idle():
    data = request.get_json()
    duration = data.get("duration", 5)

    if PLATFORM.startswith("win"):
        total_energy, avg_cpu_util, avg_cpu_freq, avg_processor_power, cum_power = get_energy_windows_intel(duration)  # Measure for 5 seconds
    elif PLATFORM.startswith("linux"):
        total_energy, avg_cpu_util, avg_cpu_freq, avg_processor_power, cum_power = get_energy_linux_rapl(duration)  # Measure for 5 seconds

    else:
        return jsonify({"error": "Unsupported Operating System"}), 400

    if total_energy is None:
        return jsonify({"error": "Energy data not found"}), 400

    response = {
        "total_cpu_energy": round(total_energy, 2),
        "average_cpu_utilization": round(avg_cpu_util, 2),
        "average_cpu_frequency": round(avg_cpu_freq, 2),
        "average_processor_power": round(avg_processor_power, 2),
        "cumulative_processor_energy": cum_power,
    }
    
    return jsonify(response)

@app.route("/analyze", methods=['GET'])
def analyze_process():
    process_name = request.args.get('process', '').strip()
    if not process_name:
        return jsonify({"success": False, "error": "No process name provided"}), 400

    try:
        metrics_result = calculate_metrics(process_name)
        
        metrics_data, timestamps, cpu_energy_data = metrics_result
        if not metrics_data:
            return jsonify({
                "success": False, 
                "error": f"Process '{process_name}' not found or no data available"
            }), 404

        cpu_info = get_cpu_info()

        prometheus_reset_all()

        return jsonify({
            "success": True,
            "process": process_name,
            "metrics": metrics_data,
            "timestamps": timestamps,
            "system_info": {
                "cpu": cpu_info,
                "total_memory": round(psutil.virtual_memory().total / (1024 * 1024 * 1024), 2),  # GB
                "platform": PLATFORM
            },
            "cpu_energy_data": cpu_energy_data,
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

def background_metrics_loop():
    while True:
        time.sleep(1)

        with tracked_pids_lock:
            pids = list(tracked_pids)

        for service_name, pid in pids:
            try:
                p = psutil.Process(pid)

                p.cpu_percent(interval=0.1)  # Warm-up with a small interval
                time.sleep(0.1)  # Small wait before measuring again
                cpu_percent = p.cpu_percent(interval=0.1)  # Get CPU usage over a small interval

                mem_info = p.memory_full_info()
                mem_usage_mb = mem_info.rss / (1024 * 1024)

                print(f"[{service_name}] PID {pid} — CPU: {cpu_percent:.2f}%, Mem: {mem_usage_mb:.2f}MB")
                prometheus_set(pid=pid, service=service_name, cpu=cpu_percent, mem=mem_usage_mb)

            except psutil.NoSuchProcess:
                with tracked_pids_lock:
                    tracked_pids.discard((service_name, pid))
            except Exception as e:
                print(f"[{service_name}] PID {pid} — Error: {e}")

if __name__ == '__main__':

    threading.Thread(target=background_metrics_loop, daemon=True).start()
    
    app.run(debug=True, host='0.0.0.0', port=5000)