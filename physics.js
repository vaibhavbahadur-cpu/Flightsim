export class FlightPhysics {
    constructor(lat, lon, alt) {
        this.latitude = lat;
        this.longitude = lon;
        this.altitude = alt;
        
        // Initial 200 kts (103 m/s)
        this.velocity = 103; 
        this.heading = 170;
        
        // Ensure time starts correctly
        this.lastUpdateTime = performance.now();
    }

    applyInputs(controls, deltaTime) {
        // Safety: If deltaTime is broken, don't move
        if (!deltaTime || deltaTime > 0.1) return;

        const climbRate = 45; 
        const turnRate = 35;

        // 1-9 Throttle mapping (Speed check)
        this.velocity = controls.throttle * 22;

        // Elevators (Up/Down)
        if (controls.keys.ArrowUp) this.altitude -= climbRate * deltaTime;
        if (controls.keys.ArrowDown) this.altitude += climbRate * deltaTime;

        // Ailerons / Rudder (Left/Right)
        if (controls.keys.ArrowLeft || controls.keys.KeyA) this.heading -= turnRate * deltaTime;
        if (controls.keys.ArrowRight || controls.keys.KeyD) this.heading += turnRate * deltaTime;
    }

    update() {
        const now = performance.now();
        const deltaTime = (now - this.lastUpdateTime) / 1000;
        
        // Prevent staying still if deltaTime is 0
        const frameTime = deltaTime > 0 ? deltaTime : 0.016;
        this.lastUpdateTime = now;

        // Forward Speed Math
        const distance = this.velocity * frameTime;
        
        // Earth Curvature Constants for Austin
        const metersPerDegLat = 111000;
        const radLat = this.latitude * (Math.PI / 180);
        const metersPerDegLon = metersPerDegLat * Math.cos(radLat);

        // Calculate Movement Vectors
        const deltaLat = (distance * Math.cos(this.heading * (Math.PI / 180))) / metersPerDegLat;
        const deltaLon = (distance * Math.sin(this.heading * (Math.PI / 180))) / metersPerDegLon;

        // Apply Movement
        this.latitude += deltaLat;
        this.longitude += deltaLon;

        return {
            latitude: this.latitude,
            longitude: this.longitude,
            altitude: this.altitude,
            heading: this.heading
        };
    }
}
