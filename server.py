from flask import Flask, request, jsonify, render_template, send_from_directory, Response
from flask_cors import CORS
import psutil
import time
import platform
import os
import subprocess
import threading
import uuid
# import requests
from datetime import datetime
import cpuinfo  # pip install py-cpuinfo
import werkzeug.utils
from tqdm import tqdm
from prometheus_client import generate_latest, Gauge

running_processes = {}

output_dir = "exec_outputs"
os.makedirs(output_dir, exist_ok=True)

CPU_USAGE = Gauge('cpu_usage', "CPU Usage")
MEM_USAGE = Gauge('mem_usage', "Memory Usage")

app = Flask(__name__)
CORS(app)
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max upload size

# Create upload folder if it doesn't exist
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
# Carbon intensity factors (gCO2/kWh) - simplified averages
CARBON_INTENSITY = {
    'coal': 820,
    'natural_gas': 490,
    'solar': 41,
    'wind': 11,
    'nuclear': 12,
    'default': 500  # Default value if location-based data isn't available
}

def get_cpu_info():
    """Get CPU information and temperature if available"""
    try:
        cpu_info = cpuinfo.get_cpu_info()
        cpu_freq = psutil.cpu_freq()
        
        # Try to get CPU temperature - not available on all systems
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

def calculate_metrics(process_name, duration=30):
    """Calculate comprehensive sustainability metrics for a given process."""
    start_time = time.time()
    metrics_data = []
    timestamps = []
    print([p.info['name'].lower() for p in psutil.process_iter(['name', 'cpu_percent', 'memory_info', 'io_counters'])])
    if not process_name.endswith('.exe') and platform.system() == 'Windows':
        process_name += '.exe'

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
                
                # Calculate energy consumption (Watt-hours)
                # Simplified model based on CPU and memory usage
                cpu_power = total_cpu * 0.5  # Rough estimate: 0.5W per CPU percentage
                memory_power = (total_mem / (1024 * 1024 * 1024)) * 0.3  # Rough estimate: 0.3W per GB
                total_power = cpu_power + memory_power
                
                # Convert to kWh
                energy_kwh = total_power / 1000
                
                # Calculate carbon emissions (gCO2)
                # Using default carbon intensity factor
                carbon_emissions = energy_kwh * CARBON_INTENSITY['default']
                
                # Calculate efficiency score (0-100)
                # Based on CPU and memory utilization
                efficiency_score = 100 - ((total_cpu / psutil.cpu_count()) + 
                                        (total_mem / psutil.virtual_memory().total) * 50)
                
                CPU_USAGE.set(total_cpu)
                MEM_USAGE.set(round(total_mem / (1024 * 1024), 2))
                metrics_data.append({
                    'energy_consumption': round(total_power, 2),  # Watts
                    'carbon_emissions': round(carbon_emissions, 4),  # gCO2
                    'cpu_usage': round(total_cpu, 1),  # Percentage
                    'memory_usage': round(total_mem / (1024 * 1024), 2),  # MB
                    'efficiency_score': round(max(0, min(efficiency_score, 100)), 1)  # 0-100
                })
                
                timestamps.append(time.strftime("%H:%M:%S"))
                
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue
            
            time.sleep(1)
            pbar.update(1)

    return metrics_data, timestamps if metrics_data else None
def run_and_analyze_executable(executable_path, duration=10):
    """Run an executable and analyze its metrics"""
    try:
        executable_name = os.path.basename(executable_path).split('.')[0]  # Remove extension
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")  # Format: YYYYMMDD_HHMMSS

        # Create output file with timestamp
        output_file = f"exec_outputs/{executable_name}_output_{timestamp}.txt"

        with open(output_file, "w") as out_file:
            # Start the process with output redirection
            process = subprocess.Popen(executable_path, stdout=out_file, stderr=subprocess.STDOUT)
            process_id = process.pid
            
            # Get process name
            proc = psutil.Process(process_id)
            process_name = proc.name()
            
            # Wait a moment for the process to initialize
            time.sleep(1)
            
            # Calculate metrics
            metrics_data, timestamps = calculate_metrics(process_name, duration)
            
            # Terminate the process if it's still running
            try:
                if process.poll() is None:
                    process.terminate()
                    process.wait(timeout=5)
            except:
                try:
                    process.kill()
                except:
                    pass
        
        return {
            "success": True,
            "process": process_name,
            "metrics": metrics_data,
            "timestamps": timestamps,
            "system_info": {
                "cpu": get_cpu_info(),
                "total_memory": round(psutil.virtual_memory().total / (1024 * 1024 * 1024), 2),  # GB
                "platform": platform.system()
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Error analyzing executable: {str(e)}"
        }

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/metrics')
def metrics():
    return Response(generate_latest(), mimetype='text/plain')

@app.route('/analyze', methods=['GET'])
def analyze_process():
    process_name = request.args.get('process', '').strip()
    if not process_name:
        return jsonify({"success": False, "error": "No process name provided"}), 400

    try:
        metrics_result = calculate_metrics(process_name)
        
        metrics_data, timestamps = metrics_result
        if not metrics_data:
            return jsonify({
                "success": False, 
                "error": f"Process '{process_name}' not found or no data available"
            }), 404

        cpu_info = get_cpu_info()

        CPU_USAGE.set(0)
        MEM_USAGE.set(0)
        return jsonify({
            "success": True,
            "process": process_name,
            "metrics": metrics_data,
            "timestamps": timestamps,
            "system_info": {
                "cpu": cpu_info,
                "total_memory": round(psutil.virtual_memory().total / (1024 * 1024 * 1024), 2),  # GB
                "platform": platform.system()
            }
        })
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"success": False, "error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"success": False, "error": "No selected file"}), 400
    
    if file:
        # Generate a unique filename to prevent overwrites
        original_filename = werkzeug.utils.secure_filename(file.filename)
        filename = f"{uuid.uuid4()}_{original_filename}"
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        # Store file info
        file_id = str(uuid.uuid4())
        running_processes[file_id] = {
            "original_name": original_filename,
            "file_path": file_path,
            "upload_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "status": "uploaded"
        }
        
        return jsonify({
            "success": True,
            "message": "File uploaded successfully",
            "file_id": file_id,
            "filename": original_filename
        })

@app.route('/analyze-executable/<file_id>', methods=['POST'])
def analyze_executable(file_id):
    if file_id not in running_processes:
        return jsonify({"success": False, "error": "File not found"}), 404
    
    file_info = running_processes[file_id]
    duration = request.json.get('duration', 10)  # Default 10 seconds of analysis
    
    # Update status
    file_info["status"] = "analyzing"
    
    # Run analysis in background thread to not block the request
    def analyze_background():
        result = run_and_analyze_executable(file_info["file_path"], duration)
        file_info["status"] = "completed"
        file_info["result"] = result
    
    thread = threading.Thread(target=analyze_background)
    thread.daemon = True
    thread.start()
    
    return jsonify({
        "success": True,
        "message": f"Analysis started for {file_info['original_name']}",
        "file_id": file_id
    })

@app.route('/analysis-status/<file_id>', methods=['GET'])
def analysis_status(file_id):
    if file_id not in running_processes:
        return jsonify({"success": False, "error": "File not found"}), 404
    
    file_info = running_processes[file_id]
    status = file_info["status"]
    
    response = {
        "success": True,
        "file_id": file_id,
        "filename": file_info["original_name"],
        "status": status
    }
    
    if status == "completed" and "result" in file_info:
        response["result"] = file_info["result"]
    
    return jsonify(response)

@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)