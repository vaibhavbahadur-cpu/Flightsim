// plane.js - The 747-8 Aircraft Module
export class Boeing748 {
    constructor(viewer) {
        this.viewer = viewer;
        // FIX: Using Githack to bypass CORS and load your specific model
        this.modelUri = 'https://raw.githack.com/vaibhavbahadur-cpu/7478i2/main/Boeing%20747-8I.glb';
        this.aircraftEntity = null;
    }

    spawn(lon, lat, altMeters) {
        // Remove old plane if it exists
        if (this.aircraftEntity) {
            this.viewer.entities.remove(this.aircraftEntity);
        }

        const position = Cesium.Cartesian3.fromDegrees(lon, lat, altMeters);
        
        // Orientation: Facing South-East (Runway 18L/R direction)
        const heading = Cesium.Math.toRadians(170); 
        const hpr = new Cesium.HeadingPitchRoll(heading, 0, 0);
        const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

        this.aircraftEntity = this.viewer.entities.add({
            name: 'Boeing 747-8',
            position: position,
            orientation: orientation,
            model: {
                uri: this.modelUri,
                minimumPixelSize: 128,
                maximumScale: 20000,
                // Ensures the model is lit properly
                silhouetteColor: Cesium.Color.WHITE,
                silhouetteSize: 0.0
            }
        });

        // Lock camera to the plane
        this.viewer.trackedEntity = this.aircraftEntity;
    }
}
