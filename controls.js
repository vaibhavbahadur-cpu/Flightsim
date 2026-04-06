export class FlightControls {
    constructor() {
        this.keys = {
            arrowup: false, arrowdown: false, // Elevator (Pitch)
            arrowleft: false, arrowright: false, // Ailerons (Roll)
            a: false, d: false, // Rudder (Yaw)
            throttle: 5 // Default to 50% power (1-9)
        };

        window.addEventListener('keydown', (e) => this.handleKey(e, true));
        window.addEventListener('keyup', (e) => this.handleKey(e, false));
    }

    handleKey(e, isPressed) {
        const key = e.key.toLowerCase();

        // 1. Throttle Logic (1-9)
        if (isPressed && key >= '1' && key <= '9') {
            this.throttle = parseInt(key);
            console.log(`Throttle: ${this.throttle}0%`);
        }

        // 2. Control Surfaces
        if (this.keys.hasOwnProperty(key)) {
            this.keys[key] = isPressed;
        }
    }
}
