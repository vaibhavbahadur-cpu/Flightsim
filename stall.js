export class StallModule {
    constructor() {
        this.isStalled = false;
        // 170 Knots is approx 87.5 m/s
        this.stallSpeedThreshold = 87.5; 
    }

    calculateLiftFactor(airspeed, pitch, vs) {
        // 1. Check for Speed Stall
        const speedStall = airspeed < this.stallSpeedThreshold;

        // 2. Check for Angle of Attack (AoA) Stall
        // AoA = Pitch - Flight Path Angle
        const flightPathAngle = (Math.asin(vs / Math.max(airspeed, 1)) * (180 / Math.PI));
        const aoa = pitch - flightPathAngle;
        
        // Critical AoA for a 747 is roughly 18-20 degrees
        const aoaStall = aoa > 20 && airspeed < 130;

        this.isStalled = speedStall || aoaStall;

        // If stalled, lift drops to 15%. If flying, lift is 100%.
        return this.isStalled ? 0.15 : 1.0;
    }

    getNoseDropTorque() {
        // Significant downward force when stalled
        return this.isStalled ? -75.0 : 0.0;
    }
}
