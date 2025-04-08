from flask import Flask, request, jsonify, render_template, send_from_directory, Response
from flask_cors import CORS
import psutil
from prometheus_client import generate_latest
from metrics import get_cpu_info, calculate_metrics, get_energy_windows_intel, get_energy_linux_rapl
from globals import prometheus_reset, PLATFORM

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/metrics')
def metrics():
    return Response(generate_latest(), mimetype='text/plain')

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

        prometheus_reset()

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

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)