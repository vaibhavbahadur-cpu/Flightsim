export class FlightPhysics {
    constructor(startLat, startLon, startAlt) {
        this.latitude = startLat;
        this.longitude = startLon;
        this.altitude = startAlt;
        
        this.velocity = 103; // Base 200kts
        this.heading = 170;
        this.lastUpdateTime = performance.now();
    }

    applyInputs(controls, deltaTime) {
        // Sensitivity Settings
        const pitchSensitivity = 40; // Meters per second climb/descent
        const turnSensitivity = 25;  // Degrees per second turn
        const rudderSensitivity = 15;

        // 1. Throttle (Velocity) - Mapping 1-9 to ~150-350 knots
        // Velocity = throttle * 20 (roughly)
        this.velocity = controls.throttle * 22; 

        // 2. Elevator (Up/Down Arrows)
        if (controls.keys.arrowup) this.altitude -= pitchSensitivity * deltaTime; // Standard Sim: Up is Pitch Down
        if (controls.keys.arrowdown) this.altitude += pitchSensitivity * deltaTime; // Down is Pitch Up

        // 3. Ailerons (Left/Right Arrows)
        if (controls.keys.arrowleft) this.heading -= turnSensitivity * deltaTime;
        if (controls.keys.arrowright) this.heading += turnSensitivity * deltaTime;

        // 4. Rudder (A/D Keys)
        if (controls.keys.a) this.heading -= rudderSensitivity * deltaTime;
        if (controls.keys.d) this.heading += rudderSensitivity * deltaTime;
    }

    update() {
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = currentTime;

        const distance = this.velocity * deltaTime;
        const metersPerDegreeLat = 111000;
        const metersPerDegreeLon = metersPerDegreeLat * Math.cos(window.Cesium.Math.toRadians(this.latitude));

        this.latitude += (distance * Math.cos(window.Cesium.Math.toRadians(this.heading))) / metersPerDegreeLat;
        this.longitude += (distance * Math.sin(window.Cesium.Math.toRadians(this.heading))) / metersPerDegreeLon;

        return { 
            latitude: this.latitude, 
            longitude: this.longitude, 
            altitude: this.altitude, 
            heading: this.heading 
        };
    }
}
