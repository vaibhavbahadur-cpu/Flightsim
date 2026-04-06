export class Boeing748 {
    constructor(viewer) {
        this.viewer = viewer;
        // Make sure your repo '7478i2' is PUBLIC for this link to work
        this.modelUri = 'https://raw.githack.com/vaibhavbahadur-cpu/7478i2/main/Boeing%20747-8I.glb';
        this.aircraftEntity = null;
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

        // Lock camera to the plane
        this.viewer.trackedEntity = this.aircraftEntity;
    }
}
