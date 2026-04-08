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

        this.createSpoiler(true);  
        this.createSpoiler(false); 

        this.viewer.trackedEntity = this.aircraftEntity;
    }

    createSpoiler(isLeft) {
        const xOffset = isLeft ? -20 : 20; 
        const yOffset = -5; 
        const zOffset = 5.0; // High enough to clear the wing mesh

        this.viewer.entities.add({
            parent: this.aircraftEntity,
            position: new Cesium.Cartesian3(xOffset, yOffset, zOffset),
            box: {
                dimensions: new Cesium.Cartesian3(12.0, 6.0, 0.2), // Big and visible
                material: Cesium.Color.RED.withAlpha(1.0),
                outline: true,
                outlineColor: Cesium.Color.BLACK
            },
            orientation: new Cesium.CallbackProperty(() => {
                return Cesium.Quaternion.fromAxisAngle(
                    Cesium.Cartesian3.UNIT_X, 
                    Cesium.Math.toRadians(-this.spoilerAngle)
                );
            }, false)
        });
    }

    updateVisuals(physicsData) {
        this.spoilerAngle = physicsData.spoilerAngle || 0;
    }
}
