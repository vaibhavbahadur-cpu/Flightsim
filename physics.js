export class FlightPhysics {
    constructor(lat, lon, alt) {
        this.latitude = lat;
        this.longitude = lon;
        this.altitude = alt;
        
        this.airspeed = 103; // Total speed in m/s (approx 200kts)
        this.heading = 170;  // Compass direction
        this.pitch = 0;      // Nose up/down angle
        this.roll = 0;       // Wing tilt
        
        this.lastUpdateTime = performance.now();
    }

    applyInputs(controls, deltaTime) {
        if (!deltaTime || deltaTime > 0.1) return;

        // 1. Throttle (Airspeed) - 1-9 Keys
        const targetSpeed = controls.throttle * 22;
        // Simple acceleration: move toward target speed
        this.airspeed += (targetSpeed - this.airspeed) * deltaTime * 0.5;

        // 2. Pitch (Elevators) - Arrow Keys
        const pitchSensitivity = 30; // Degrees per second
        if (controls.keys.ArrowUp) this.pitch -= pitchSensitivity * deltaTime;
        if (controls.keys.ArrowDown) this.pitch += pitchSensitivity * deltaTime;
        
        // Clamp pitch so you don't backflip the 747 (Limit to +/- 30 degrees)
        this.pitch = Math.max(-30, Math.min(30, this.pitch));

        // 3. Roll & Heading (Ailerons)
        const rollSensitivity = 45;
        if (controls.keys.ArrowLeft) this.roll -= rollSensitivity * deltaTime;
        if (controls.keys.ArrowRight) this.roll += rollSensitivity * deltaTime;
        
        // Simple "Bank-to-Turn" logic: 
        // If the wings are tilted, the heading changes automatically.
        this.heading += (this.roll * 0.5) * deltaTime;
        
        // Limit roll to 45 degrees
        this.roll = Math.max(-45, Math.min(45, this.roll));

        // Auto-center roll (Stabilizer) if no keys pressed
        if (!controls.keys.ArrowLeft && !controls.keys.ArrowRight) {
            this.roll *= 0.95; 
        }
    }

    update() {
        const now = performance.now();
        const deltaTime = (now - this.lastUpdateTime) / 1000;
        const frameTime = deltaTime > 0 ? deltaTime : 0.016;
        this.lastUpdateTime = now;

        // --- THE TRIGONOMETRY FIX ---
        // Convert angles to Radians
        const radPitch = window.Cesium.Math.toRadians(this.pitch);
        const radHeading = window.Cesium.Math.toRadians(this.heading);

        // Calculate Vertical Speed: Speed * sin(pitch)
        // (If pitch is 0, sin(0) = 0, so vertical speed is 0)
        const verticalRate = this.airspeed * Math.sin(radPitch);
        
        // Calculate Forward (Ground) Speed: Speed * cos(pitch)
        const groundSpeed = this.airspeed * Math.cos(radPitch);

        // Update Altitude
        this.altitude += verticalRate * frameTime;

        // Map movement (Lat/Lon) using Ground Speed
        const metersPerDegLat = 111000;
        const radLat = window.Cesium.Math.toRadians(this.latitude);
        const metersPerDegLon = metersPerDegLat * Math.cos(radLat);

        const distMoved = groundSpeed * frameTime;
        this.latitude += (distMoved * Math.cos(radHeading)) / metersPerDegLat;
        this.longitude += (distMoved * Math.sin(radHeading)) / metersPerDegLon;

        return {
            latitude: this.latitude,
            longitude: this.longitude,
            altitude: this.altitude,
            heading: this.heading,
            pitch: this.pitch,
            roll: this.roll
        };
    }
}
