import { StallModule } from './stall.js';

export class FlightPhysics {
    constructor(lat, lon, alt) {
        this.latitude = lat;
        this.longitude = lon;
        this.altitude = alt;
        this.airspeed = 103; 
        this.heading = 170;  
        this.pitch = 0;      
        this.roll = 0;       
        this.groundHeight = 0; 
        
        this.pitchVelocity = 0; 
        this.rollVelocity = 0;
        this.yawVelocity = 0;
        this.vs = 0;
        this.isStalled = false;
        this.staller = new StallModule();
        this.lastUpdateTime = performance.now();
    }

    applyInputs(controls, deltaTime) {
        if (!deltaTime || deltaTime > 0.1) return;

        // --- 1. REALISTIC THRUST vs GRAVITY ---
        const throttleInput = controls.throttle || 5;
        const targetSpeed = throttleInput * 22;
        
        // Gravity Drag: Bleed speed based on pitch (9.8 m/s^2 * sin(pitch))
        const pRad = window.Cesium.Math.toRadians(this.pitch);
        const gravityDrag = Math.sin(pRad) * 9.8 * deltaTime;
        
        // Engine acceleration is slow on a 747
        const enginePower = (targetSpeed - this.airspeed) * deltaTime * 0.2;
        this.airspeed += enginePower - gravityDrag;

        // --- 2. STALL MOMENT & ASYMMETRY ---
        const liftFactor = this.staller.calculateLiftFactor(this.airspeed, this.pitch);
        this.isStalled = this.staller.isStalled;
        
        // Stronger Nose Drop: -40.0 makes it very hard to pull up during a stall
        let stallNoseDrop = this.isStalled ? -40.0 : 0.0;
        
        // Asymmetric Wing Stall: Randomly roll the plane if stalled
        let stallRoll = this.isStalled ? (Math.random() - 0.5) * 20.0 : 0.0;

        // --- 3. PHYSICS EXECUTION ---
        const controlAuthority = 35.0; 
        const damping = 1.8;           
        const responsiveness = 2.5;    

        let pIn = controls.keys.ArrowUp ? -controlAuthority : (controls.keys.ArrowDown ? controlAuthority : 0);
        let rIn = controls.keys.ArrowLeft ? -controlAuthority * 1.5 : (controls.keys.ArrowRight ? controlAuthority * 1.5 : 0);
        let yIn = controls.keys.KeyA ? -controlAuthority * 0.5 : (controls.keys.KeyD ? controlAuthority * 0.5 : 0);

        // Apply forces (stall drop added here)
        this.pitchVelocity += (pIn + stallNoseDrop - (this.pitchVelocity * damping)) * deltaTime * responsiveness;
        this.rollVelocity += (rIn + stallRoll - (this.rollVelocity * damping)) * deltaTime * responsiveness;
        this.yawVelocity += (yIn - (this.yawVelocity * damping)) * deltaTime * responsiveness;

        const r = window.Cesium.Math.toRadians(this.roll);
        const cosR = Math.cos(r);
        const sinR = Math.sin(r);

        this.pitch += (this.pitchVelocity * cosR) * deltaTime;
        this.heading += (this.pitchVelocity * sinR) * deltaTime;
        this.heading += (this.yawVelocity * cosR) * deltaTime;
        this.pitch -= (this.yawVelocity * sinR) * deltaTime;
        this.roll += this.rollVelocity * deltaTime;

        // Lift Logic
        const gravityEffect = (1.5 + (1 - Math.cos(r)) * 8);
        const liftEffect = ((this.airspeed / 110) * 1.8 * Math.cos(r)) * liftFactor;

        this.pitch -= gravityEffect * deltaTime;
        this.pitch += liftEffect * deltaTime;
    }

    update() {
        // ... (Keep your existing update() function for Lat/Lon/Alt math) ...
        const now = performance.now();
        const deltaTime = (now - this.lastUpdateTime) / 1000;
        const frameTime = deltaTime > 0 ? deltaTime : 0.016;
        this.lastUpdateTime = now;

        const p = window.Cesium.Math.toRadians(this.pitch);
        const h = window.Cesium.Math.toRadians(this.heading);
        const vz = this.airspeed * Math.sin(p);
        
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
            airspeed: this.airspeed, vs: this.vs, groundHeight: this.groundHeight,
            isStalled: this.isStalled
        };
    }
}
