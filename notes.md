- [ ] replace HTTP completely from the application (since no / minimal user requests, so sockets will be most suitable)
  - [x] replace HTTP with something else "for sharing PIDs" (sockets)

- [ ] refactor & clean-up codebase

- [ ] modify runner script, capture hierarchy
- [ ] PID grouping

- [ ] Disk I/O
- [ ] Network Activity

- [ ] send only last 50 points to frontend (instead of complete array in `self.pid_metrics`)

- [x] Units for metric
- [ ] Carbon emissions 
- [ ] add other metrics in the table
- [ ] different plots (scatter, bar, ..)

CPU Usage:
Returns the total CPU usage (in %). Notice that it might be bigger than 100 if run on a multi-core machine.

If you want a value between 0% and 100%, divide the returned value by the number of CPUs.