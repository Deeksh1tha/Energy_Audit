from flask import Flask, jsonify
from flask_cors import CORS
from globals import PLATFORM
from metrics_collector import MetricsCollector

import threading
import time

import socket
import pickle

app = Flask(__name__)
CORS(app)

collector = MetricsCollector(PLATFORM)

@app.route("/live-metrics", methods=['GET'])
def get_metrics():
    return jsonify(collector.get_metrics())

def pid_listener():

    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(("127.0.0.1", 5052))
    server.listen(5)
    print(f"[Metrics] Listening for PID updates on 5052...")

    while True:

        time.sleep(1)

        conn, _ = server.accept()
        data = b""
        while True:
            chunk = conn.recv(4096)
            if not chunk:
                break
            data += chunk
        
        if data:
            try:
                updates = pickle.loads(data)  # Expect list of (service, pid)
                for item in updates:
                    collector.add_pid(item)  # Push each (service, pid) into queue
                print(f"[Metrics] Received updates: {updates}")
            except Exception as e:
                print(f"[Metrics] Error decoding PID data: {e}")

        conn.close()

if __name__ == '__main__':

    threading.Thread(target=pid_listener, daemon=True).start()
    threading.Thread(target=collector.loop_forever, daemon=True).start()
    app.run(debug=False, host='0.0.0.0', port=5000)
