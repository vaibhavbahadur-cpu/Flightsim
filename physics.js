import { StallModule } from './stall.js';

export class FlightPhysics {
    constructor(lat, lon, alt) {
        this.latitude = lat;
        this.longitude = lon;
        this.altitude = alt;
        this.airspeed = 250; 
        this.heading = 170;  
        this.pitch = 0;      
        this.roll = 0;       
        this.groundHeight = 0; 
        this.pitchVelocity = 0; 
        this.rollVelocity = 0;
        this.yawVelocity = 0;
        this.vs = 0;
        this.spoilerAngle = 0; 
        this.lastUpdateTime = performance.now();
    }

    applyInputs(controls, deltaTime) {
        if (!deltaTime || deltaTime > 0.1) return;

        const isOnGround = (this.altitude <= this.groundHeight + 2.5);

        // --- 1. THRUST & AIRBRAKE ---
        const throttleInput = controls.throttle || 0;
        let currentThrust = (throttleInput / 9) * 8.0; 
        
        const targetSpoiler = controls.keys.KeyB ? 60 : 0;
        this.spoilerAngle += (targetSpoiler - this.spoilerAngle) * 3.0 * deltaTime;
        let spoilerDrag = (this.spoilerAngle / 60) * 45.0; 

        this.airspeed += (currentThrust - spoilerDrag) * deltaTime;
        if (this.airspeed < 0) this.airspeed = 0;

        // --- 2. 170KT STALL PHYSICS ---
        const stallSpeed = 170; 
        // Controls die completely at 150kts
        const airEffectiveness = Math.max(0, Math.min(1.0, (this.airspeed - 150) / 50));

        let stallNoseDrop = 0;
        if (this.airspeed < stallSpeed && !isOnGround) {
            // The "Superfast" drop: multiplier at -20.0
            stallNoseDrop = (stallSpeed - this.airspeed) * -20.0; 
        }

        // --- 3. ROTATION (STRICTLY INDEPENDENT) ---
        const damping = 3.5;           
        const responsiveness = 5.0;    

        let pIn = (controls.keys.ArrowUp ? -80 : (controls.keys.ArrowDown ? 80 : 0));
        let rIn = (controls.keys.ArrowLeft ? -80 : (controls.keys.ArrowRight ? 80 : 0));
        let yIn = (controls.keys.KeyA ? -50 : (controls.keys.KeyD ? 50 : 0));

        if (isOnGround) {
            this.heading += (yIn / 15) * (this.airspeed / 10) * deltaTime;
            this.pitch *= 0.5; 
            this.roll *= 0.5;
            this.pitchVelocity = 0;
            this.rollVelocity = 0;
            this.yawVelocity = 0;
        } else {
            // All axes scaled by airEffectiveness. At 5kts, keys do nothing.
            this.pitchVelocity += ((pIn * airEffectiveness) + stallNoseDrop - (this.pitchVelocity * damping)) * deltaTime * responsiveness;
            this.rollVelocity += ((rIn * airEffectiveness) - (this.rollVelocity * damping)) * deltaTime * responsiveness;
            this.yawVelocity += ((yIn * airEffectiveness) - (this.yawVelocity * damping)) * deltaTime * responsiveness;
            
            this.pitch += this.pitchVelocity * deltaTime;
            this.roll += this.rollVelocity * deltaTime;
            this.heading += this.yawVelocity * deltaTime;
        }
    }

    update() {
        const now = performance.now();
        const deltaTime = (now - this.lastUpdateTime) / 1000;
        const frameTime = Math.min(deltaTime, 0.05);
        this.lastUpdateTime = now;

        const p = window.Cesium.Math.toRadians(this.pitch);
        const h = window.Cesium.Math.toRadians(this.heading);
        const vz = this.airspeed * Math.sin(p);
        
        if (this.altitude <= this.groundHeight) {
            this.altitude = this.groundHeight;
            this.vs = 0;
        } else {
            // Massive sink rate when stalled
            const sinkRate = this.airspeed < 170 ? (170 - this.airspeed) * 2.5 : 0;
            this.altitude += (vz - sinkRate) * frameTime;
        }

        const vx = this.airspeed * Math.cos(p) * Math.cos(h);
        const vy = this.airspeed * Math.cos(p) * Math.sin(h);
        
        const radLat = window.Cesium.Math.toRadians(this.latitude);
        this.latitude += (vx * frameTime) / 111000;
        this.longitude += (vy * frameTime) / (111000 * Math.cos(radLat));

        return {
            latitude: this.latitude, longitude: this.longitude, altitude: this.altitude,
            heading: this.heading, pitch: this.pitch, roll: this.roll,
            airspeed: this.airspeed
        };
    }
}
