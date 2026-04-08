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
        this.yawVelocity = 0; // RE-ADDED YAW
        this.vs = 0;
        this.spoilerAngle = 0; 
        this.lastUpdateTime = performance.now();
    }

    applyInputs(controls, deltaTime) {
        if (!deltaTime || deltaTime > 0.1) return;

        const isOnGround = (this.altitude <= this.groundHeight + 2.0);

        // --- 1. SPEED & SPOILERS ---
        const throttleInput = controls.throttle || 0;
        let currentThrust = (throttleInput / 9) * 8.0; 
        const targetSpoiler = controls.keys.KeyB ? 60 : 0;
        this.spoilerAngle += (targetSpoiler - this.spoilerAngle) * 3.0 * deltaTime;
        let spoilerDrag = (this.spoilerAngle / 60) * 40.0; 

        this.airspeed += (currentThrust - spoilerDrag) * deltaTime;
        if (this.airspeed < 0) this.airspeed = 0;

        // --- 2. THE 170KT STALL ---
        const stallSpeed = 170; 
        const airEffectiveness = Math.max(0, Math.min(1.0, (this.airspeed - 150) / 40));

        let stallNoseDrop = 0;
        if (this.airspeed < stallSpeed && !isOnGround) {
            stallNoseDrop = (stallSpeed - this.airspeed) * -18.0; // Violent Drop
        }

        // --- 3. ROTATION (STRICTLY INDEPENDENT) ---
        const damping = 4.0;           
        const responsiveness = 5.0;    

        let pIn = (controls.keys.ArrowUp ? -70 : (controls.keys.ArrowDown ? 70 : 0));
        let rIn = (controls.keys.ArrowLeft ? -70 : (controls.keys.ArrowRight ? 70 : 0));
        let yIn = (controls.keys.KeyA ? -50 : (controls.keys.KeyD ? 50 : 0)); // YAW INPUT

        if (isOnGround) {
            // Nose wheel steering on ground
            this.heading += (yIn / 20) * (this.airspeed / 10) * deltaTime;
            this.pitch *= 0.5; 
            this.roll *= 0.5;
            this.pitchVelocity = 0;
            this.rollVelocity = 0;
            this.yawVelocity = 0;
        } else {
            // PITCH: Inputs + Stall Drop
            this.pitchVelocity += ((pIn * airEffectiveness) + stallNoseDrop - (this.pitchVelocity * damping)) * deltaTime * responsiveness;
            // ROLL: Strictly Arrow Keys
            this.rollVelocity += ((rIn * airEffectiveness) - (this.rollVelocity * damping)) * deltaTime * responsiveness;
            // YAW: Strictly A and D keys
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
        } else {
            // Force altitude loss if stalled
            const sinkRate = this.airspeed < 170 ? (170 - this.airspeed) * 1.5 : 0;
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
