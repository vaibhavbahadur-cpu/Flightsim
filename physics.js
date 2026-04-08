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
        this.staller = new StallModule();
        this.lastUpdateTime = performance.now();
    }

    applyInputs(controls, deltaTime) {
        if (!deltaTime || deltaTime > 0.1) return;

        const pRad = window.Cesium.Math.toRadians(this.pitch);
        const rRad = window.Cesium.Math.toRadians(this.roll);
        const isOnGround = (this.altitude <= this.groundHeight + 2.5);

        // --- 1. SPEED & SPOILERS ---
        const throttleInput = controls.throttle || 0;
        let currentThrust = (throttleInput / 9) * 8.0; 
        
        const targetSpoiler = controls.keys.KeyB ? 60 : 0;
        this.spoilerAngle += (targetSpoiler - this.spoilerAngle) * 3.0 * deltaTime;
        
        let spoilerDrag = (this.spoilerAngle / 60) * 45.0; 
        let gravityDrag = Math.sin(pRad) * 15.0;

        this.airspeed += (currentThrust - (gravityDrag + spoilerDrag)) * deltaTime;
        if (this.airspeed < 0) this.airspeed = 0;

        // --- 2. THE VIOLENT 170 KNOT STALL ---
        const stallSpeed = 170; 
        
        // Control effectiveness dies completely at 160kts
        const airEffectiveness = Math.max(0, Math.min(1.0, (this.airspeed - 160) / 30));

        // SUPERFAST NOSE DROP
        let stallNoseDrop = 0;
        if (this.airspeed < stallSpeed && !isOnGround) {
            // High multiplier (-8.0) for a violent pitch down
            stallNoseDrop = (stallSpeed - this.airspeed) * -8.0; 
        }

        // --- 3. ROTATION PHYSICS ---
        // Lower damping = more violent movement
        const damping = 1.2;           
        const responsiveness = 4.0;    

        let pIn = (controls.keys.ArrowUp ? -60 : (controls.keys.ArrowDown ? 60 : 0));
        let rIn = (controls.keys.ArrowLeft ? -60 : (controls.keys.ArrowRight ? 60 : 0));

        if (isOnGround) {
            this.heading += (controls.keys.KeyA ? -1 : (controls.keys.KeyD ? 1 : 0)) * (this.airspeed / 10) * deltaTime;
            this.pitch *= 0.5; 
            this.roll *= 0.5;
            this.pitchVelocity = 0;
            this.rollVelocity = 0;
        } else {
            // If you're at 5kts, (pIn * airEffectiveness) is 0. 
            // Only stallNoseDrop remains, slamming the nose down.
            this.pitchVelocity += ((pIn * airEffectiveness) + stallNoseDrop - (this.pitchVelocity * damping)) * deltaTime * responsiveness;
            this.rollVelocity += ((rIn * airEffectiveness) - (this.rollVelocity * damping)) * deltaTime * responsiveness;
        }

        this.pitch += (this.pitchVelocity * Math.cos(rRad)) * deltaTime;
        this.heading += (this.pitchVelocity * Math.sin(rRad)) * deltaTime;
        this.roll += this.rollVelocity * deltaTime;

        // --- 4. LIFT VS WEIGHT (HEAVY DROP) ---
        if (!isOnGround) {
            const weightForce = 35.0; // Heavier feel
            const liftForce = Math.pow(this.airspeed / stallSpeed, 2) * weightForce;

            this.pitch -= weightForce * deltaTime;
            this.pitch += liftForce * deltaTime;

            // Immediate altitude loss during stall
            if (this.airspeed < stallSpeed) {
                this.vs -= (stallSpeed - this.airspeed) * 1.5 * deltaTime;
            }
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
            if (vz < 0) this.vs = 0;
        } else {
            // Add vertical sink rate (this.vs) to the actual altitude change
            this.altitude += (vz + (this.vs || 0)) * frameTime;
            this.vs *= 0.98; 
        }

        const vx = this.airspeed * Math.cos(p) * Math.cos(h);
        const vy = this.airspeed * Math.cos(p) * Math.sin(h);
        
        const radLat = window.Cesium.Math.toRadians(this.latitude);
        this.latitude += (vx * frameTime) / 111000;
        this.longitude += (vy * frameTime) / (111000 * Math.cos(radLat));

        return {
            latitude: this.latitude, longitude: this.longitude, altitude: this.altitude,
            heading: this.heading, pitch: this.pitch, roll: this.roll,
            airspeed: this.airspeed, vs: this.vs, spoilerAngle: this.spoilerAngle 
        };
    }
}
