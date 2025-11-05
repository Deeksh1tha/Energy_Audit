# Energy_Audit

### `process.py`
- Class for process, process-group
- write methods for obtaining process related data here (cpu usage, memory, disk i/o, network, ..)

### `metrics_collector.py`
- creates process objects
- gets cpu related data, calculates energy consumption, etc.

### `server.py`
- entry point of the backend
- Creates 2 threads - one for listening pids through socket, other one for calculating metrics in background
- gets pid's from `runner_v2.py` through socket
- `MetricsCollector` object is created and is updated with gotten pid's

### `helper.py`
- for now, only energy consumption function for windows is written here


## How to run?
**EnergiBridge**
1. Download & install Rust
2. Install energibridge
```
pip install energibridge_wheel\energibridge-0.0.7-cp310-cp310-win_amd64.whl --force-reinstall
```

**Server**
```
python3 server.py
```

**Config Runner**
```
cd playground
python3 runner_v2.py
```

**Dashboard**
```
cd dashboard
npm start
```