import { StallModule } from './stall.js';

export class FlightPhysics {
    constructor(lat, lon, alt) {
        this.latitude = lat;
        this.longitude = lon;
        this.altitude = alt;
        this.airspeed = 130; 
        this.heading = 170;  
        this.pitch = 0;      
        this.roll = 0;       
        this.groundHeight = 0; 
        this.pitchVelocity = 0; 
        this.rollVelocity = 0;
        this.yawVelocity = 0;
        this.vs = 0;
        this.isStalled = false;
        this.spoilerAngle = 0; 
        this.staller = new StallModule();
        this.lastUpdateTime = performance.now();
    }

    applyInputs(controls, deltaTime) {
        if (!deltaTime || deltaTime > 0.1) return;

        const pRad = window.Cesium.Math.toRadians(this.pitch);
        const rRad = window.Cesium.Math.toRadians(this.roll);
        const isOnGround = (this.altitude <= this.groundHeight + 1.5);

        // --- SPOILER PIVOT LOGIC ---
        const targetAngle = controls.keys.KeyB ? 60 : 0;
        const pivotSpeed = 180; 
        if (this.spoilerAngle < targetAngle) {
            this.spoilerAngle = Math.min(targetAngle, this.spoilerAngle + pivotSpeed * deltaTime);
        } else {
            this.spoilerAngle = Math.max(targetAngle, this.spoilerAngle - pivotSpeed * deltaTime);
        }

        // --- THRUST & DRAG ---
        const throttleInput = controls.throttle || 0;
        const maxEngineAccel = 6.5; 
        let currentThrust = (throttleInput / 9) * maxEngineAccel;
        const gravityDrag = Math.sin(pRad) * 9.8; 
        
        // Massive Spoiler Drag for testing
        let spoilerDrag = (this.spoilerAngle / 60) * 40.0; 
        let totalDecel = gravityDrag + spoilerDrag;

        if (isOnGround) {
            totalDecel += 0.5; 
            if (controls.keys.Space) totalDecel += 8.0; 
        }

        this.airspeed += (currentThrust - totalDecel) * deltaTime;
        if (this.airspeed < 0) this.airspeed = 0; 

        // --- AERODYNAMICS ---
        const liftFactor = this.staller.calculateLiftFactor(this.airspeed, this.pitch, this.vs);
        this.isStalled = this.staller.isStalled;
        const controlEfficiency = this.isStalled ? 0.05 : 1.0;

        // --- ROTATION ---
        const controlAuthority = 35.0; 
        const damping = 1.8;           
        const responsiveness = 2.5;    

        let pIn = (controls.keys.ArrowUp ? -controlAuthority : (controls.keys.ArrowDown ? controlAuthority : 0)) * controlEfficiency;
        let rIn = (controls.keys.ArrowLeft ? -controlAuthority * 1.5 : (controls.keys.ArrowRight ? controlAuthority * 1.5 : 0)) * controlEfficiency;
        let yIn = (controls.keys.KeyA ? -controlAuthority : (controls.keys.KeyD ? controlAuthority : 0));

        if (isOnGround) {
            this.heading += yIn * (this.airspeed / 20) * deltaTime;
            this.yawVelocity = 0; 
            this.pitch *= 0.9; 
            this.roll *= 0.9;
        } else {
            yIn *= (controlEfficiency * 0.5); 
            this.yawVelocity += (yIn - (this.yawVelocity * damping)) * deltaTime * responsiveness;
        }

        this.pitchVelocity += (pIn - (this.pitchVelocity * damping)) * deltaTime * responsiveness;
        this.rollVelocity += (rIn - (this.rollVelocity * damping)) * deltaTime * responsiveness;

        this.pitch += (this.pitchVelocity * Math.cos(rRad)) * deltaTime;
        this.heading += (this.pitchVelocity * Math.sin(rRad)) * deltaTime;
        this.heading += (this.yawVelocity * Math.cos(rRad)) * deltaTime;
        this.pitch -= (this.yawVelocity * Math.sin(rRad)) * deltaTime;
        this.roll += this.rollVelocity * deltaTime;

        if (!isOnGround) {
            const gravityWeight = (1.8 + (1 - Math.cos(rRad)) * 10);
            const liftEffect = ((this.airspeed / 110) * 2.2 * Math.cos(rRad)) * liftFactor;
            this.pitch -= gravityWeight * deltaTime;
            this.pitch += liftEffect * deltaTime;
        }
    }

    update() {
        const now = performance.now();
        const deltaTime = (now - this.lastUpdateTime) / 1000;
        const frameTime = deltaTime > 0 ? deltaTime : 0.016;
        this.lastUpdateTime = now;

        const p = window.Cesium.Math.toRadians(this.pitch);
        const h = window.Cesium.Math.toRadians(this.heading);
        const vz = this.airspeed * Math.sin(p);
        
        if (this.altitude <= this.groundHeight) {
            this.altitude = this.groundHeight;
            if (vz < 0) {
                this.vs = 0;
                this.pitch = Math.max(0, this.pitch); 
                this.pitchVelocity = 0;
            }
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
            isStalled: this.isStalled, spoilerAngle: this.spoilerAngle 
        };
    }
}
