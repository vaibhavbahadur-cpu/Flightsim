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

        // 1. Throttle (Airspeed) - Gradual acceleration
        const targetSpeed = controls.throttle * 22;
        this.airspeed += (targetSpeed - this.airspeed) * deltaTime * 0.5;

        // 2. Pitch (Elevators) - NO LIMITS
        const pitchSensitivity = 40; 
        if (controls.keys.ArrowUp) this.pitch -= pitchSensitivity * deltaTime;
        if (controls.keys.ArrowDown) this.pitch += pitchSensitivity * deltaTime;
        
        // 3. Roll (Ailerons) - NO AUTO-CENTERING
        const rollSensitivity = 60;
        if (controls.keys.ArrowLeft) this.roll -= rollSensitivity * deltaTime;
        if (controls.keys.ArrowRight) this.roll += rollSensitivity * deltaTime;
        
        // 4. Yaw (Rudder) - RESTORED A/D Keys
        const yawSensitivity = 20;
        if (controls.keys.KeyA) this.heading -= yawSensitivity * deltaTime;
        if (controls.keys.KeyD) this.heading += yawSensitivity * deltaTime;

        // Bank-to-Turn Logic: Roll still influences heading naturally
        this.heading += (this.roll * 0.4) * deltaTime;
    }

    update() {
        const now = performance.now();
        const deltaTime = (now - this.lastUpdateTime) / 1000;
        const frameTime = deltaTime > 0 ? deltaTime : 0.016;
        this.lastUpdateTime = now;

        const radPitch = window.Cesium.Math.toRadians(this.pitch);
        const radHeading = window.Cesium.Math.toRadians(this.heading);

        // 3D Vector Math
        const verticalRate = this.airspeed * Math.sin(radPitch);
        const groundSpeed = this.airspeed * Math.cos(radPitch);

        this.altitude += verticalRate * frameTime;

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
