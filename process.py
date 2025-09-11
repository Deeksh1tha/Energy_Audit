import psutil

CPU_INTERVAL = 0.1

class ProcessGroup:
    def __init__(self, name = None, children=None):
        
        if name:
          self.name = name
        
        self.children: list[ProcessGroup] = children or []
        self.is_tracked = False
        self.is_group = False

    def add_child(self, child: "ProcessGroup"):
        self.children.append(child)

    def cpu_usage(self, interval = CPU_INTERVAL) -> float:
        return sum(child.cpu_usage() for child in self.children)

    def memory_usage(self) -> float:
        return sum(child.memory_usage() for child in self.children)

    def info(self) -> dict:
        return {
            "cpu_percent": self.cpu_usage(0),
            "memory_mb": self.memory_usage(),
            "children": [child.name for child in self.children],
        }

    def __repr__(self):
        return f"<ProcessGroup children={len(self.children)}>"


class Process(ProcessGroup):
    def __init__(self, pid: int):
        super().__init__(children=[])
        self.pid = pid
        try:
            self.proc = psutil.Process(pid)
            self.proc.cpu_percent(0)

        except psutil.NoSuchProcess:
            self.proc = None

    @property
    def name(self) -> str:
        return self.proc.name() if self.proc else "Unknown"
    
    def is_running(self) -> bool:
        return self.proc is not None and self.proc.is_running()

    def cpu_usage(self, interval = CPU_INTERVAL) -> float:
        if not self.proc:
            return 0.0
        return self.proc.cpu_percent()

    def memory_usage(self) -> float:
        if not self.proc:
            return 0.0
        return self.proc.memory_info().rss / (1024 * 1024)

    def info(self) -> dict:
        return {
            "pid": self.pid,
            "name": self.name,
            "cpu_percent": self.cpu_usage(0),
            "memory_mb": self.memory_usage(),
            "children": [child.info() for child in self.children],
        }

    def __repr__(self):
        return f"<Process pid={self.pid} name={self.name} children={len(self.children)}>"
