@echo off
echo Starting Consul...
start "Consul" /b consul agent -dev

:: Wait for Consul to fully start
timeout /t 5 >nul

:: Create 100 parallel service registrations
for /L %%i in (1,1,100) do (
    start /b consul services register -name=service%%i -port=50%%i
)

:: Add larger key-value pairs to stress disk usage
for /L %%i in (1,1,5000) do (
    echo LargeDataLargeDataLargeDataLargeDataLargeDataLargeData > tmpfile.txt
    consul kv put app/data/entry%%i @tmpfile.txt
)

:: Max out CPU with recursive loops
echo Stressing CPU...
for /L %%i in (1,1,10) do (
    start /b cmd /c "powershell -Command \"$x=1; while($true) { $x=[math]::Pow($x,1.1) }\""
)

:: Flood the network with thousands of health check requests
for /L %%i in (1,1,2000) do (
    start /b curl -s http://localhost:8500/v1/health/service/service%%i >nul
)

:: Run workload for 30 seconds
timeout /t 40 >nul

:: Stop Consul
echo Stopping Consul...
taskkill /F /IM consul.exe >nul 2>&1

echo Workload simulation complete!
