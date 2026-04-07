export class FlightPhysics {
    constructor(lat, lon, alt) {
        this.latitude = lat;
        this.longitude = lon;
        this.altitude = alt;
        this.airspeed = 103; 
        this.heading = 170;  
        this.pitch = 0;      
        this.roll = 0;       
        
        // --- ROTATIONAL MOMENTUM ---
        this.pitchVelocity = 0; // Degrees per second
        this.rollVelocity = 0;
        this.yawVelocity = 0;

        this.lastUpdateTime = performance.now();
    }

    applyInputs(controls, deltaTime) {
        if (!deltaTime || deltaTime > 0.1) return;

        // 1. Throttle Inertia
        const targetSpeed = (controls.throttle || 5) * 22;
        this.airspeed += (targetSpeed - this.airspeed) * deltaTime * 0.3;

        // 2. HEAVY JET PHYSICS CONSTANTS
        const controlAuthority = 15.0; // How much "torque" the surfaces have
        const damping = 2.5;           // Air resistance (prevents the Su-35 "whip")
        const responsiveness = 0.8;    // Overall "weight" (Lower = Heavier)

        // --- PITCH MOMENTUM (Elevators) ---
        let pitchInput = 0;
        if (controls.keys.ArrowUp) pitchInput = -controlAuthority;
        if (controls.keys.ArrowDown) pitchInput = controlAuthority;
        
        // Acceleration = Force - Damping
        this.pitchVelocity += (pitchInput - (this.pitchVelocity * damping)) * deltaTime * responsiveness;

        // --- ROLL MOMENTUM (Ailerons) ---
        let rollInput = 0;
        if (controls.keys.ArrowLeft) rollInput = -controlAuthority * 1.5;
        if (controls.keys.ArrowRight) rollInput = controlAuthority * 1.5;
        
        this.rollVelocity += (rollInput - (this.rollVelocity * damping)) * deltaTime * responsiveness;

        // --- YAW MOMENTUM (Rudder) ---
        let yawInput = 0;
        if (controls.keys.KeyA) yawInput = -controlAuthority * 0.5;
        if (controls.keys.KeyD) yawInput = controlAuthority * 0.5;
        
        this.yawVelocity += (yawInput - (this.yawVelocity * damping)) * deltaTime * responsiveness;

        // --- APPLY ROTATIONS TO LOCAL FRAME ---
        const r = window.Cesium.Math.toRadians(this.roll);
        const cosR = Math.cos(r);
        const sinR = Math.sin(r);

        // Movement is now derived from VELOCITY, not direct input
        this.pitch += (this.pitchVelocity * cosR) * deltaTime;
        this.heading += (this.pitchVelocity * sinR) * deltaTime;

        this.heading += (this.yawVelocity * cosR) * deltaTime;
        this.pitch -= (this.yawVelocity * sinR) * deltaTime;

        this.roll += this.rollVelocity * deltaTime;

        // --- STABILITY & WEIGHT ---
        const weightDrop = 1.5; 
        const liftBalanceSpeed = 110; 
        const liftEffect = (this.airspeed / liftBalanceSpeed) * 1.8;
        const bankDrop = (1 - Math.cos(r)) * 8;

        this.pitch -= (weightDrop + bankDrop) * deltaTime;
        this.pitch += (liftEffect * Math.cos(r)) * deltaTime;
    }

    update() {
        const now = performance.now();
        const deltaTime = (now - this.lastUpdateTime) / 1000;
        const frameTime = deltaTime > 0 ? deltaTime : 0.016;
        this.lastUpdateTime = now;

        const p = window.Cesium.Math.toRadians(this.pitch);
        const h = window.Cesium.Math.toRadians(this.heading);

        // Vector Velocity Calculation
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
