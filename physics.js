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

        const isOnGround = (this.altitude <= this.groundHeight + 2.0);

        // --- 1. SIMPLE SPEED & BRAKES ---
        const throttleInput = controls.throttle || 0;
        let currentThrust = (throttleInput / 9) * 8.0; 
        
        // Spoiler/Airbrake Drag
        const targetSpoiler = controls.keys.KeyB ? 60 : 0;
        this.spoilerAngle += (targetSpoiler - this.spoilerAngle) * 3.0 * deltaTime;
        let spoilerDrag = (this.spoilerAngle / 60) * 40.0; 

        this.airspeed += (currentThrust - spoilerDrag) * deltaTime;
        if (this.airspeed < 0) this.airspeed = 0;

        // --- 2. STALL LOGIC (170 KTS) ---
        const stallSpeed = 170; 
        // Controls die at 160kts
        const airEffectiveness = Math.max(0, Math.min(1.0, (this.airspeed - 160) / 40));

        // FAST NOSE DROP
        let stallNoseDrop = 0;
        if (this.airspeed < stallSpeed && !isOnGround) {
            // High multiplier for fast drop, but capped to prevent glitching
            stallNoseDrop = Math.max(-150, (stallSpeed - this.airspeed) * -12.0); 
        }

        // --- 3. STABLE ROTATION ---
        const damping = 3.0;           
        const responsiveness = 4.0;    

        let pIn = (controls.keys.ArrowUp ? -60 : (controls.keys.ArrowDown ? 60 : 0));
        let rIn = (controls.keys.ArrowLeft ? -60 : (controls.keys.ArrowRight ? 60 : 0));

        if (isOnGround) {
            this.heading += (controls.keys.KeyA ? -1 : (controls.keys.KeyD ? 1 : 0)) * (this.airspeed / 15) * deltaTime;
            this.pitch *= 0.8; 
            this.roll *= 0.8;
            this.pitchVelocity = 0;
            this.rollVelocity = 0;
        } else {
            // Pitch: Combines your input with the stall drop
            this.pitchVelocity += ((pIn * airEffectiveness) + stallNoseDrop - (this.pitchVelocity * damping)) * deltaTime * responsiveness;
            // Roll: Only works if you have airspeed
            this.rollVelocity += ((rIn * airEffectiveness) - (this.rollVelocity * damping)) * deltaTime * responsiveness;
            
            this.pitch += this.pitchVelocity * deltaTime;
            this.roll += this.rollVelocity * deltaTime;
            // Heading only changes when banking
            this.heading += (this.roll * 0.02) * (this.airspeed / 100);
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
            // Gravity weight pull
            const gravityPull = this.airspeed < 170 ? (170 - this.airspeed) * 0.8 : 0;
            this.altitude += (vz - gravityPull) * frameTime;
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
