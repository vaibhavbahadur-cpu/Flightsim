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

        // 1. Airspeed Inertia
        const targetSpeed = controls.throttle * 22;
        this.airspeed += (targetSpeed - this.airspeed) * deltaTime * 0.5;

        // 2. Control Sensitivity (Boosted Rudder for Knife Edge)
        const pitchPower = 55; 
        const rollPower = 75;
        const yawPower = 45; // Increased from 20 to 45 for better authority

        const r = window.Cesium.Math.toRadians(this.roll);
        const cosR = Math.cos(r);
        const sinR = Math.sin(r);

        // A. ELEVATORS (Up/Down Arrows)
        let elevatorInput = 0;
        if (controls.keys.ArrowUp) elevatorInput = -pitchPower;
        if (controls.keys.ArrowDown) elevatorInput = pitchPower;
        
        this.pitch += (elevatorInput * cosR) * deltaTime;
        this.heading += (elevatorInput * sinR) * deltaTime;

        // B. RUDDER (A / D Keys) - The "Knife Edge" Lifter
        let rudderInput = 0;
        if (controls.keys.KeyA) rudderInput = -yawPower;
        if (controls.keys.KeyD) rudderInput = yawPower;

        // This allows the rudder to "push" the nose up when you are banked 90 deg
        this.heading += (rudderInput * cosR) * deltaTime;
        this.pitch -= (rudderInput * sinR) * deltaTime; 

        // --- THE "GRAVITY VS SPEED" LOGIC ---
        // Gravity pull depends on bank angle
        const gravityFactor = 15; 
        const drop = (1 - Math.cos(r)) * gravityFactor;
        
        // C. BODY LIFT (New): High speed helps stay level even when banked
        // The faster you go, the less the nose drops.
        const speedBonus = this.airspeed / 200; 
        this.pitch -= (drop / (1 + speedBonus)) * deltaTime;

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

        // Vector Velocity
        const vx = this.airspeed * Math.cos(p) * Math.cos(h);
        const vy = this.airspeed * Math.cos(p) * Math.sin(h);
        const vz = this.airspeed * Math.sin(p);

        this.altitude += vz * frameTime;

        const metersPerDegLat = 111000;
        const radLat = window.Cesium.Math.toRadians(this.latitude);
        const metersPerDegLon = metersPerDegLat * Math.cos(radLat);

        this.latitude += (vx * frameTime) / metersPerDegLat;
        this.longitude += (vy * frameTime) / metersPerDegLon;

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
