export class Boeing748 {
    constructor(viewer) {
        this.viewer = viewer;
        this.modelUri = 'https://raw.githack.com/vaibhavbahadur-cpu/7478/main/Boeing%20747-8I.glb';
        this.aircraftEntity = null;
        this.spoilerAngle = 0; 
    }

    spawn(lon, lat, alt) {
        const position = Cesium.Cartesian3.fromDegrees(lon, lat, alt);
        const hpr = new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(170), 0, 0);
        const orientation = Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

        this.aircraftEntity = this.viewer.entities.add({
            name: 'Boeing 747-8',
            position: position,
            orientation: orientation,
            model: {
                uri: this.modelUri,
                minimumPixelSize: 128,
                maximumScale: 20000
            }
        });

        // NEW: Create the spoiler planers
        this.createSpoiler(true);  // Left
        this.createSpoiler(false); // Right

        this.viewer.trackedEntity = this.aircraftEntity;
        console.log("747-8 Model Loaded Successfully with Spoilers.");
    }

    createSpoiler(isLeft) {
        const xOffset = isLeft ? -15 : 15; 
        const yOffset = -5; 
        const zOffset = 2.5; 

        this.viewer.entities.add({
            parent: this.aircraftEntity,
            position: new Cesium.Cartesian3(xOffset, yOffset, zOffset),
            box: {
                dimensions: new Cesium.Cartesian3(5.0, 3.0, 0.05), // Thin rectangular planer
                material: Cesium.Color.DARKGRAY.withAlpha(0.8),
                outline: true,
                outlineColor: Cesium.Color.BLACK
            },
            orientation: new Cesium.CallbackProperty(() => {
                // Pivot 60 degrees on the X axis when active
                return Cesium.Quaternion.fromAxisAngle(
                    Cesium.Cartesian3.UNIT_X, 
                    Cesium.Math.toRadians(-this.spoilerAngle)
                );
            }, false)
        });
    }

    updateVisuals(physicsData) {
        // Receives the angle from the physics engine
        this.spoilerAngle = physicsData.spoilerAngle || 0;
    }
}
