export class FlightControls {
    constructor() {
        this.keys = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false,
            KeyA: false,
            KeyD: false
        };
        this.throttle = 5;

        window.addEventListener('keydown', (e) => {
            // Handle Throttle 1-9
            if (e.key >= '1' && e.key <= '9') {
                this.throttle = parseInt(e.key);
                console.log("Throttle Set:", this.throttle);
            }
            // Handle Movement
            if (e.code in this.keys) {
                this.keys[e.code] = true;
                e.preventDefault(); // Stops the webpage from scrolling
            }
        });

        window.addEventListener('keyup', (e) => {
            if (e.code in this.keys) {
                this.keys[e.code] = false;
            }
        });
    }
}
