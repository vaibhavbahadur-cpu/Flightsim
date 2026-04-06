export class FlightPhysics {
    constructor(lat, lon, alt) {
        this.latitude = lat;
        this.longitude = lon;
        this.altitude = alt;
        this.velocity = 100;
        this.heading = 170;
    }

    applyInputs(controls, deltaTime) {
        if (!deltaTime || deltaTime > 0.1) return;

        const speedMult = 22; 
        const climbRate = 40; 
        const turnRate = 30;

        // Update Velocity based on 1-9 throttle
        this.velocity = controls.throttle * speedMult;

        // Pitch (Elevators)
        if (controls.keys.ArrowUp) this.altitude -= climbRate * deltaTime;
        if (controls.keys.ArrowDown) this.altitude += climbRate * deltaTime;

        // Roll/Yaw (Ailerons & Rudder)
        if (controls.keys.ArrowLeft || controls.keys.KeyA) this.heading -= turnRate * deltaTime;
        if (controls.keys.ArrowRight || controls.keys.KeyD) this.heading += turnRate * deltaTime;
    }

    update() {
        // ... (The Lat/Lon math you already have goes here)
        return { 
            latitude: this.latitude, 
            longitude: this.longitude, 
            altitude: this.altitude, 
            heading: this.heading 
        };
    }
}
