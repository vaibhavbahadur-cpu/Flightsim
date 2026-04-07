export class FlightPhysics {
    constructor(lat, lon, alt) {
        this.latitude = lat;
        this.longitude = lon;
        this.altitude = alt;
        
        this.airspeed = 103; 
        this.heading = 170;  
        this.pitch = 0;      
        this.roll = 0;       
        
        this.lastUpdateTime = performance.now();
    }

    applyInputs(controls, deltaTime) {
        if (!deltaTime || deltaTime > 0.1) return;

        // 1. Airspeed Inertia (Slow spool up/down)
        const targetSpeed = controls.throttle * 22;
        this.airspeed += (targetSpeed - this.airspeed) * deltaTime * 0.5;

        // 2. Control Surface Power (Sensitivity)
        const pitchPower = 50; 
        const rollPower = 70;
        const yawPower = 20;

        // --- THE LOCAL VECTOR ROTATION LOGIC ---
        // We convert the Roll angle to Radians to understand the aircraft's orientation
        const r = window.Cesium.Math.toRadians(this.roll);
        const cosR = Math.cos(r);
        const sinR = Math.sin(r);

        // A. ELEVATORS (Up/Down Arrows)
        // If level, elevators change Pitch. If banked 90°, they change Heading.
        let elevatorInput = 0;
        if (controls.keys.ArrowUp) elevatorInput = -pitchPower;
        if (controls.keys.ArrowDown) elevatorInput = pitchPower;
        
        this.pitch += (elevatorInput * cosR) * deltaTime;
        this.heading += (elevatorInput * sinR) * deltaTime;

        // B. RUDDER (A / D Keys)
        // If level, rudder changes Heading. If banked 90°, it changes Pitch.
        let rudderInput = 0;
        if (controls.keys.KeyA) rudderInput = -yawPower;
        if (controls.keys.KeyD) rudderInput = yawPower;

        this.heading += (rudderInput * cosR) * deltaTime;
        this.pitch -= (rudderInput * sinR) * deltaTime; // Inverse because Rudder-Left is "Up" when banked Right

        // C. AILERONS (Left/Right Arrows)
        if (controls.keys.ArrowLeft) this.roll -= rollPower * deltaTime;
        if (controls.keys.ArrowRight) this.roll += rollPower * deltaTime;

        // --- AERODYNAMIC GRAVITY ---
        // The "Nose Drop": If you aren't producing enough vertical lift (banked or inverted), 
        // the nose naturally falls toward the earth.
        const gravityEffect = (1 - Math.cos(r)) * 15; 
        this.pitch -= gravityEffect * deltaTime;

        // Inverted Gravity: Extra pull when upside down
        if (Math.abs(this.roll) > 90) {
            this.pitch -= 10 * deltaTime;
        }
    }

    update() {
        const now = performance.now();
        const deltaTime = (now - this.lastUpdateTime) / 1000;
        const frameTime = deltaTime > 0 ? deltaTime : 0.016;
        this.lastUpdateTime = now;

        // Convert 3D angles to Radians for the Global Movement Vector
        const p = window.Cesium.Math.toRadians(this.pitch);
        const h = window.Cesium.Math.toRadians(this.heading);

        // This is the "Nose-Pointing" Vector Calculation
        const vx = this.airspeed * Math.cos(p) * Math.cos(h); // North/South component
        const vy = this.airspeed * Math.cos(p) * Math.sin(h); // East/West component
        const vz = this.airspeed * Math.sin(p);              // Vertical component

        // Apply Vertical Movement (Altitude)
        this.altitude += vz * frameTime;

        // Apply Horizontal Movement (Lat/Lon)
        const metersPerDegLat = 111000;
        const radLat = window.Cesium.Math.toRadians(this.latitude);
        const metersPerDegLon = metersPerDegLat * Math.cos(radLat);

        this.latitude += (vx * frameTime) / metersPerDegLat;
        this.longitude += (vy * frameTime) / metersPerDegLon;

        // Keep rotation values clean
        this.heading = (this.heading + 360) % 360;
        
        // Wrap roll so it doesn't just infinitely increase (e.g., 370 becomes 10)
        if (this.roll > 180) this.roll -= 360;
        if (this.roll < -180) this.roll += 360;

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
