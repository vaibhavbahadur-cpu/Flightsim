export class FlightControls {
    constructor() {
        this.keys = {
            ArrowUp: false,
            ArrowDown: false,
            ArrowLeft: false,
            ArrowRight: false,
            KeyA: false,
            KeyD: false,
            Space: false // NEW: Braking key
        };
        this.throttle = 5;

        window.addEventListener('keydown', (e) => {
            if (e.key >= '1' && e.key <= '9') this.throttle = parseInt(e.key);
            if (this.keys.hasOwnProperty(e.code)) {
                this.keys[e.code] = true;
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            if (this.keys.hasOwnProperty(e.code)) {
                this.keys[e.code] = false;
            }
        });
    }
}
