export class FlightPhysics {
    constructor(lat, lon, alt) {
        this.latitude = lat;
        this.longitude = lon;
        this.altitude = alt;
        this.airspeed = 103; 
        this.heading = 170;  
        this.pitch = 0;      
        this.roll = 0;       
        this.groundHeight = 0; // New: Dynamic floor
        
        this.pitchVelocity = 0;
        this.rollVelocity = 0;
        this.yawVelocity = 0;
        this.lastUpdateTime = performance.now();
    }

    applyInputs(controls, deltaTime) {
        if (!deltaTime || deltaTime > 0.1) return;

        // Constants (Using your "Sweet Spot" settings)
        const controlAuthority = 35.0; 
        const damping = 1.8;           
        const responsiveness = 2.5;    

        // Input Logic (Inertia)
        let pIn = controls.keys.ArrowUp ? -controlAuthority : (controls.keys.ArrowDown ? controlAuthority : 0);
        let rIn = controls.keys.ArrowLeft ? -controlAuthority * 1.5 : (controls.keys.ArrowRight ? controlAuthority * 1.5 : 0);
        let yIn = controls.keys.KeyA ? -controlAuthority * 0.5 : (controls.keys.KeyD ? controlAuthority * 0.5 : 0);

        this.pitchVelocity += (pIn - (this.pitchVelocity * damping)) * deltaTime * responsiveness;
        this.rollVelocity += (rIn - (this.rollVelocity * damping)) * deltaTime * responsiveness;
        this.yawVelocity += (yIn - (this.yawVelocity * damping)) * deltaTime * responsiveness;

        const r = window.Cesium.Math.toRadians(this.roll);
        this.pitch += (this.pitchVelocity * Math.cos(r)) * deltaTime;
        this.heading += (this.pitchVelocity * Math.sin(r)) * deltaTime;
        this.heading += (this.yawVelocity * Math.cos(r)) * deltaTime;
        this.pitch -= (this.yawVelocity * Math.sin(r)) * deltaTime;
        this.roll += this.rollVelocity * deltaTime;

        // Lift & Weight
        this.pitch -= (1.5 + (1 - Math.cos(r)) * 8) * deltaTime;
        this.pitch += ((this.airspeed / 110) * 1.8 * Math.cos(r)) * deltaTime;
    }

    update() {
        const now = performance.now();
        const deltaTime = (now - this.lastUpdateTime) / 1000;
        const frameTime = deltaTime > 0 ? deltaTime : 0.016;
        this.lastUpdateTime = now;

        const p = window.Cesium.Math.toRadians(this.pitch);
        const h = window.Cesium.Math.toRadians(this.heading);

        const vz = this.airspeed * Math.sin(p);
        
        // --- DYNAMIC COLLISION ---
        // We compare current altitude to the terrain height sampled from Cesium
        if (this.altitude <= this.groundHeight && vz < 0) {
            this.altitude = this.groundHeight;
            this.pitch = 0;
            this.pitchVelocity = 0;
            this.vs = 0;
        } else {
            this.altitude += vz * frameTime;
            this.vs = vz;
        }

        const vx = this.airspeed * Math.cos(p) * Math.cos(h);
        const vy = this.airspeed * Math.cos(p) * Math.sin(h);

        const metersPerDegLat = 111000;
        const radLat = window.Cesium.Math.toRadians(this.latitude);
        const metersPerDegLon = metersPerDegLat * Math.cos(radLat);

        this.latitude += (vx * frameTime) / metersPerDegLat;
        this.longitude += (vy * frameTime) / metersPerDegLon;

        return {
            latitude: this.latitude, longitude: this.longitude, altitude: this.altitude,
            heading: this.heading, pitch: this.pitch, roll: this.roll,
            airspeed: this.airspeed, vs: this.vs,
            agl: this.altitude - this.groundHeight // Altitude Above Ground Level
        };
    }
}
