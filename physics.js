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

        this.staller = new StallModule();

        this.lastUpdateTime = performance.now();

    }



    applyInputs(controls, deltaTime) {

        if (!deltaTime || deltaTime > 0.1) return;



        const pRad = window.Cesium.Math.toRadians(this.pitch);

        const rRad = window.Cesium.Math.toRadians(this.roll);



        // --- 1. THRUST VS GRAVITY (The 50kt Fix) ---

        const throttleInput = controls.throttle || 5;

        const maxEngineAccel = 6.5; 

        const currentThrust = (throttleInput / 9) * maxEngineAccel;

        

        // Gravity Drag: Bleeds speed based on pitch sine

        const gravityDrag = Math.sin(pRad) * 9.8; 

        this.airspeed += (currentThrust - gravityDrag) * deltaTime;



        // Airspeed floor

        if (this.airspeed < 5) this.airspeed = 5;



        // --- 2. AERODYNAMICS & STALL ---

        const liftFactor = this.staller.calculateLiftFactor(this.airspeed, this.pitch, this.vs);

        this.isStalled = this.staller.isStalled;



        // Elevator Washout: Lose 95% of control effectiveness in a stall

        const controlEfficiency = this.isStalled ? 0.05 : 1.0;

        let stallNoseDrop = this.isStaller ? this.staller.getNoseDropTorque() : (this.isStalled ? -75.0 : 0.0);

        let stallRoll = this.isStalled ? (Math.random() - 0.5) * 45.0 : 0.0;



        // --- 3. ROTATION PHYSICS ---

        const controlAuthority = 35.0; 

        const damping = 1.8;           

        const responsiveness = 2.5;    



        let pIn = (controls.keys.ArrowUp ? -controlAuthority : (controls.keys.ArrowDown ? controlAuthority : 0)) * controlEfficiency;

        let rIn = (controls.keys.ArrowLeft ? -controlAuthority * 1.5 : (controls.keys.ArrowRight ? controlAuthority * 1.5 : 0)) * controlEfficiency;

        let yIn = (controls.keys.KeyA ? -controlAuthority * 0.5 : (controls.keys.KeyD ? controlAuthority * 0.5 : 0)) * controlEfficiency;



        this.pitchVelocity += (pIn + stallNoseDrop - (this.pitchVelocity * damping)) * deltaTime * responsiveness;

        this.rollVelocity += (rIn + stallRoll - (this.rollVelocity * damping)) * deltaTime * responsiveness;

        this.yawVelocity += (yIn - (this.yawVelocity * damping)) * deltaTime * responsiveness;



        this.pitch += (this.pitchVelocity * Math.cos(rRad)) * deltaTime;

        this.heading += (this.pitchVelocity * Math.sin(rRad)) * deltaTime;

        this.heading += (this.yawVelocity * Math.cos(rRad)) * deltaTime;

        this.pitch -= (this.yawVelocity * Math.sin(rRad)) * deltaTime;

        this.roll += this.rollVelocity * deltaTime;



        // --- 4. LIFT VS WEIGHT ---

        const gravityWeight = (1.8 + (1 - Math.cos(rRad)) * 10);

        const liftEffect = ((this.airspeed / 110) * 2.2 * Math.cos(rRad)) * liftFactor;



        this.pitch -= gravityWeight * deltaTime;

        this.pitch += liftEffect * deltaTime;

    }



    update() {

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

} add your code and controls.js here it is add you code export class FlightControls {

    constructor() {

        this.keys = {

            ArrowUp: false,

            ArrowDown: false,

            ArrowLeft: false,

            ArrowRight: false,

            KeyA: false,

            KeyD: false

        };

        this.throttle = 5;



        window.addEventListener('keydown', (e) => {

            if (e.key >= '1' && e.key <= '9') this.throttle = parseInt(e.key);

            if (this.keys.hasOwnProperty(e.code)) {

                this.keys[e.code] = true;

                e.preventDefault();

            }

        });



        window.addEventListener('keyup', (e) => {

            if (this.keys.hasOwnProperty(e.code)) {

                this.keys[e.code] = false;

            }

        });

    }

}
