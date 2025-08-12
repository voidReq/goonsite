#include <stdio.h>
#include <unistd.h>

int main() {
    float interval = 2.0;
    while (1) {
        printf("goon\n");
        usleep(interval * 1000000);
        if (interval > 0.2) {
            interval -= 0.2;
        } else {
            interval = 0.05;
        }
    }
    return 0;
}
