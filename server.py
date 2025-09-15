from flask import Flask, jsonify
from flask_cors import CORS
from globals import PLATFORM
from metrics_collector import MetricsCollector

import threading
import time
import socket
import pickle
import os
import json

app = Flask(__name__)
CORS(app)

collector = MetricsCollector(PLATFORM)

# === Config ===
PID_DIR = os.path.expanduser("~/.energy_audit/pids")
SOCKET_ADDR = ("127.0.0.1", 5052)


@app.route("/live-metrics", methods=['GET'])
def get_metrics():
    return jsonify(collector.get_metrics())


def pid_listener():

    server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    server.bind(SOCKET_ADDR)
    server.listen(5)
    print(f"[Metrics] Listening for PID updates on {SOCKET_ADDR}...")

    while True:
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
                print(f"[Metrics] Received updates (socket): {updates}")
            except Exception as e:
                print(f"[Metrics] Error decoding PID data: {e}")

        conn.close()

def load_pids():

    print(f"[Metrics] Watching PID files in {PID_DIR}...")
    os.makedirs(PID_DIR, exist_ok=True)

    seen_states = {}  # service -> last known pid set

    try:
        for fname in os.listdir(PID_DIR):
            if not fname.endswith(".json"):
                continue
            fpath = os.path.join(PID_DIR, fname)

            try:
                with open(fpath, "r") as f:
                    data = json.load(f)
                service = data.get("service")
                pids = set(data.get("pids", []))

                if service and (service not in seen_states or seen_states[service] != pids):
                    for pid in pids:
                        collector.add_pid((service, pid))
                    seen_states[service] = pids
                    print(f"[Metrics] Loaded updates (file): {service} → {pids}")

            except Exception as e:
                print(f"[Metrics] Error reading {fpath}: {e}")

    except Exception as e:
        print(f"[Metrics] Error scanning PID_DIR: {e}")


if __name__ == '__main__':
    load_pids()
    threading.Thread(target=pid_listener, daemon=True).start()
    threading.Thread(target=collector.loop_forever, daemon=True).start()
    app.run(debug=False, host='0.0.0.0', port=5000)