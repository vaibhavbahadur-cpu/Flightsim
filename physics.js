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

        // 1. Throttle (Airspeed) - Gradual spooling
        const targetSpeed = (controls.throttle || 5) * 22;
        this.airspeed += (targetSpeed - this.airspeed) * deltaTime * 0.4;

        // 2. Control Authority
        const pitchPower = 50; 
        const rollPower = 70;
        const yawPower = 45; 

        const r = window.Cesium.Math.toRadians(this.roll);
        const cosR = Math.cos(r);
        const sinR = Math.sin(r);

        // A. ELEVATORS (Up/Down Arrows)
        let elevatorInput = 0;
        if (controls.keys.ArrowUp) elevatorInput = -pitchPower;
        if (controls.keys.ArrowDown) elevatorInput = pitchPower;
        
        this.pitch += (elevatorInput * cosR) * deltaTime;
        this.heading += (elevatorInput * sinR) * deltaTime;

        // B. RUDDER (A / D Keys)
        let rudderInput = 0;
        if (controls.keys.KeyA) rudderInput = -yawPower;
        if (controls.keys.KeyD) rudderInput = yawPower;

        this.heading += (rudderInput * cosR) * deltaTime;
        this.pitch -= (rudderInput * sinR) * deltaTime; 

        // --- STABILITY & WEIGHT MATH ---
        
        // 1. Natural Nose-Down Tendency (Weight of the 747)
        // We want the nose to drop about 2 degrees per second naturally.
        const weightDrop = 2.0; 
        this.pitch -= weightDrop * deltaTime;

        // 2. Speed-Dependent Lift
        // At cruise speed (approx 110 m/s), the lift should balance the weight.
        // If we go faster, we climb. If slower, we sink.
        const liftBalanceSpeed = 110; 
        const liftEffect = (this.airspeed / liftBalanceSpeed) * 2.2;
        
        // Apply lift only to the vertical component of the wings
        this.pitch += (liftEffect * Math.cos(r)) * deltaTime;

        // 3. Roll-Induced Sink (The "Bank-to-Turn" Drop)
        const bankDrop = (1 - Math.cos(r)) * 10;
        this.pitch -= bankDrop * deltaTime;

        // D. AILERONS (Left/Right Arrows)
        if (controls.keys.ArrowLeft) this.roll -= rollPower * deltaTime;
        if (controls.keys.ArrowRight) this.roll += rollPower * deltaTime;
    }

    update() {
        const now = performance.now();
        const deltaTime = (now - this.lastUpdateTime) / 1000;
        const frameTime = deltaTime > 0 ? deltaTime : 0.016;
        this.lastUpdateTime = now;

        const p = window.Cesium.Math.toRadians(this.pitch);
        const h = window.Cesium.Math.toRadians(this.heading);

        // Global Velocity Vectors
        const vx = this.airspeed * Math.cos(p) * Math.cos(h);
        const vy = this.airspeed * Math.cos(p) * Math.sin(h);
        const vz = this.airspeed * Math.sin(p);

        this.altitude += vz * frameTime;

        const metersPerDegLat = 111000;
        const radLat = window.Cesium.Math.toRadians(this.latitude);
        const metersPerDegLon = metersPerDegLat * Math.cos(radLat);

        this.latitude += (vx * frameTime) / metersPerDegLat;
        this.longitude += (vy * frameTime) / metersPerDegLon;

        // Angles normalization
        this.heading = (this.heading + 360) % 360;
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
