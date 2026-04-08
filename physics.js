import { StallModule } from './stall.js';

export class FlightPhysics {
    constructor(lat, lon, alt) {
        this.latitude = lat;
        this.longitude = lon;
        this.altitude = alt;
        this.airspeed = 250; // Start at cruise speed
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
        const isOnGround = (this.altitude <= this.groundHeight + 2.0);

        // --- 1. SPEED & SPOILER DRAG ---
        const throttleInput = controls.throttle || 0;
        let currentThrust = (throttleInput / 9) * 8.0; 
        
        // Spoiler Deployment
        const targetSpoiler = controls.keys.KeyB ? 60 : 0;
        this.spoilerAngle += (targetSpoiler - this.spoilerAngle) * 2.0 * deltaTime;
        
        let spoilerDrag = (this.spoilerAngle / 60) * 35.0; 
        let gravityDrag = Math.sin(pRad) * 9.8;

        this.airspeed += (currentThrust - (gravityDrag + spoilerDrag)) * deltaTime;
        if (this.airspeed < 0) this.airspeed = 0;

        // --- 2. THE 170 KNOT STALL & CONTROL AUTHORITY ---
        const stallSpeed = 170; 
        
        // Control effectiveness: 100% at 200kts+, 0% at 150kts
        const airEffectiveness = Math.max(0, Math.min(1.0, (this.airspeed - 150) / 50));

        // Automatic Nose Drop: Gravity wins when the wings stop flying
        let stallNoseDrop = 0;
        if (this.airspeed < stallSpeed && !isOnGround) {
            // Stronger downward torque as speed drops below 170
            stallNoseDrop = (stallSpeed - this.airspeed) * -2.8; 
        }

        // --- 3. ROTATION PHYSICS ---
        const damping = 2.2;           
        const responsiveness = 3.0;    

        let pIn = (controls.keys.ArrowUp ? -45 : (controls.keys.ArrowDown ? 45 : 0));
        let rIn = (controls.keys.ArrowLeft ? -50 : (controls.keys.ArrowRight ? 50 : 0));

        if (isOnGround) {
            // Taxi logic
            this.heading += (controls.keys.KeyA ? -1 : (controls.keys.KeyD ? 1 : 0)) * (this.airspeed / 15) * deltaTime;
            this.pitch *= 0.7; 
            this.roll *= 0.7;
            this.pitchVelocity = 0;
            this.rollVelocity = 0;
        } else {
            // Flight logic: Scale inputs by airEffectiveness
            this.pitchVelocity += ((pIn * airEffectiveness) + stallNoseDrop - (this.pitchVelocity * damping)) * deltaTime * responsiveness;
            this.rollVelocity += ((rIn * airEffectiveness) - (this.rollVelocity * damping)) * deltaTime * responsiveness;
        }

        this.pitch += (this.pitchVelocity * Math.cos(rRad)) * deltaTime;
        this.heading += (this.pitchVelocity * Math.sin(rRad)) * deltaTime;
        this.roll += this.rollVelocity * deltaTime;

        // --- 4. LIFT VS WEIGHT (QUADRATIC STALL) ---
        if (!isOnGround) {
            const weightForce = 22.0; 
            // Lift formula: (Actual Speed / Stall Speed)^2
            // At 170kts = 1.0 (Level flight). At 85kts = 0.25 (Falling).
            const liftForce = Math.pow(this.airspeed / stallSpeed, 2) * weightForce;

            this.pitch -= weightForce * deltaTime;
            this.pitch += liftForce * deltaTime;

            // Extra Sink Rate if stalled
            if (this.airspeed < stallSpeed) {
                this.vs -= (stallSpeed - this.airspeed) * 0.4 * deltaTime;
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
            this.altitude += (vz + (this.vs || 0)) * frameTime;
            // Dampen the sink rate
            this.vs *= 0.95; 
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
