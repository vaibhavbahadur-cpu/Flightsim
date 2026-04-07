export class StallModule {
    constructor() {
        this.isStalled = false;
        this.stallThreshold = 87; // ~170 Knots in m/s
    }

    calculateLiftFactor(airspeed, pitch, flapSetting = 0) {
        // 1. Check Speed Stall
        // Flaps will eventually lower this threshold, but for now it's static
        const speedStall = airspeed < this.stallThreshold;

        // 2. Check Angle of Attack (AoA) Stall
        // If the nose is pointed more than 25 degrees up at low speed, the wing stalls
        const criticalAoA = 25;
        const aoaStall = pitch > criticalAoA && airspeed < 120;

        this.isStalled = speedStall || aoaStall;

        if (this.isStalled) {
            // Return a penalty: 0.2 means you only have 20% of normal lift
            return 0.2; 
        }

        // Normal flight: Lift is 1.0 (100%)
        return 1.0;
    }

    getNoseDropTorque() {
        // If stalled, return a value to "push" the nose down
        return this.isStalled ? -15.0 : 0.0;
    }
}
