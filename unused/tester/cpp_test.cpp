#include <iostream>
#include <vector>
#include <cmath>
#ifdef _WIN32
    #include <windows.h>  // For Sleep() on Windows
#else
    #include <unistd.h>   // For usleep() on Linux/macOS
#endif

#define ALLOC_SIZE 1000000  // Allocate 1 million integers per iteration
#define MAX_MEMORY_MB 1000  // Stop allocating after ~1000MB
#define SLEEP_MS 100  // Sleep duration in milliseconds

int main() {
    double x = 0.0001;
    std::vector<int> memory_block;  // Vector for memory allocation
    memory_block.reserve((MAX_MEMORY_MB * 1024 * 1024) / sizeof(int));  // Pre-allocate

    while (true) {
        // CPU-intensive operation
        for (int i = 0; i < 1000000; i++) {
            x += std::sqrt(x) * std::sin(x);
        }

        // Memory allocation with limit
        if (memory_block.size() < (MAX_MEMORY_MB * 1024 * 1024) / sizeof(int)) {
            memory_block.insert(memory_block.end(), ALLOC_SIZE, 1);
        }

        std::cout << "Allocated: " << (memory_block.size() * sizeof(int)) / (1024 * 1024)
                  << " MB | CPU Usage Ongoing...\n";

        // Sleep for SLEEP_MS milliseconds
        #ifdef _WIN32
            Sleep(SLEEP_MS);  // Windows Sleep function (in ms)
        #else
            usleep(SLEEP_MS * 1000);  // Linux/macOS usleep (converts ms to µs)
        #endif
    }

    return 0;
}
