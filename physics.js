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
        this.lastUpdateTime = performance.now();
    }

    applyInputs(controls, deltaTime) {
        if (!deltaTime || deltaTime > 0.1) return;

        const pRad = window.Cesium.Math.toRadians(this.pitch);
        const isOnGround = (this.altitude <= this.groundHeight + 2.0);

        // --- 1. LIFT VECTOR & CLIMB PENALTY ---
        const throttleInput = controls.throttle || 0;
        let thrust = (throttleInput / 9) * 12.0; 
        
        // Induced Drag: Climbing at steep angles bleeds speed
        let climbPenalty = Math.sin(pRad) * 18.0; 
        let airbrakeDrag = (controls.keys.KeyB ? 35.0 : 0);

        this.airspeed += (thrust - climbPenalty - airbrakeDrag) * deltaTime;
        if (this.airspeed < 0) this.airspeed = 0;

        // --- 2. THE 170KT STALL LOGIC ---
        const stallSpeed = 170;
        // Control effectiveness: Dies at 145kts
        const airEffectiveness = Math.max(0, Math.min(1.0, (this.airspeed - 145) / 55));

        // STALL WARNING & NOSE DROP
        let stallNoseDrop = 0;
        if (this.airspeed < stallSpeed && !isOnGround) {
            // Visual Warning in Console
            if (Math.random() > 0.95) console.warn("STALL STALL STALL");
            
            // Nose slams down to ground (no flip)
            stallNoseDrop = (stallSpeed - this.airspeed) * -3.5; 
        }

        // --- 3. ROTATION (INDEPENDENT AXES) ---
        const damping = 4.0;
        const responsiveness = 5.0;

        let pIn = (controls.keys.ArrowUp ? -75 : (controls.keys.ArrowDown ? 75 : 0));
        let rIn = (controls.keys.ArrowLeft ? -75 : (controls.keys.ArrowRight ? 75 : 0));
        let yIn = (controls.keys.KeyA ? -45 : (controls.keys.KeyD ? 45 : 0));

        if (isOnGround) {
            this.heading += (yIn / 15) * (this.airspeed / 10) * deltaTime;
            this.pitch *= 0.5;
            this.roll *= 0.5;
            this.pitchVelocity = 0;
            this.rollVelocity = 0;
        } else {
            // Apply air effectiveness: Slower = less control
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
        const deltaTime = Math.min((now - this.lastUpdateTime) / 1000, 0.05);
        this.lastUpdateTime = now;

        const p = window.Cesium.Math.toRadians(this.pitch);
        const h = window.Cesium.Math.toRadians(this.heading);
        
        // --- 4. LIFT VS WEIGHT (SQUARED LAW) ---
        const vz = this.airspeed * Math.sin(p);
        
        // Lift Factor: 1.0 at 170kts. At 85kts, lift is only 0.25.
        let liftFactor = Math.pow(this.airspeed / 170, 2); 
        
        if (this.altitude <= this.groundHeight) {
            this.altitude = this.groundHeight;
        } else {
            // Gravity = 28 units of force
            const gravity = 28.0;
            const netVerticalForce = (liftFactor * gravity) - gravity;
            
            // Vertical movement = Climb Rate + (Lift Deficit)
            this.altitude += (vz + netVerticalForce) * deltaTime;
        }

        const vx = this.airspeed * Math.cos(p) * Math.cos(h);
        const vy = this.airspeed * Math.cos(p) * Math.sin(h);
        
        const radLat = window.Cesium.Math.toRadians(this.latitude);
        this.latitude += (vx * deltaTime) / 111000;
        this.longitude += (vy * deltaTime) / (111000 * Math.cos(radLat));

        return {
            latitude: this.latitude, longitude: this.longitude, altitude: this.altitude,
            heading: this.heading, pitch: this.pitch, roll: this.roll,
            airspeed: this.airspeed
        };
    }
}
