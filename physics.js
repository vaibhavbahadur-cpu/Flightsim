// physics.js - Real-time Flight Dynamics
export class FlightPhysics {
    constructor(startLat, startLon, startAlt) {
        this.latitude = startLat;
        this.longitude = startLon;
        this.altitude = startAlt;
        
        // 200 Knots = ~103 Meters per Second
        this.velocity = 103; 
        this.heading = 170; // Heading toward KAUS Runway 18R
        this.lastUpdateTime = performance.now();
    }

    update() {
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.lastUpdateTime) / 1000; 
        this.lastUpdateTime = currentTime;

        // Distance moved in meters this frame
        const distance = this.velocity * deltaTime;

        // Earth Math (Approximate for Austin area)
        const metersPerDegreeLat = 111000;
        const metersPerDegreeLon = metersPerDegreeLat * Math.cos(window.Cesium.Math.toRadians(this.latitude));

        const deltaLat = (distance * Math.cos(window.Cesium.Math.toRadians(this.heading))) / metersPerDegreeLat;
        const deltaLon = (distance * Math.sin(window.Cesium.Math.toRadians(this.heading))) / metersPerDegreeLon;

        this.latitude += deltaLat;
        this.longitude += deltaLon;

        return {
            latitude: this.latitude,
            longitude: this.longitude,
            altitude: this.altitude,
            heading: this.heading
        };
    }
}
