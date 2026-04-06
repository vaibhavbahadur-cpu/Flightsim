export class Boeing748 {
    constructor(viewer) {
        this.viewer = viewer;
        // This link points directly to your GitHub Pages hosted file
        this.modelUri = 'https://vaibhavbahadur-cpu.github.io/7478i2/Boeing%20747-8I.glb';
        this.aircraftEntity = null;
    }

    spawn(lon, lat, alt) {
        console.log("Attempting to load 747 from:", this.modelUri);
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

        // Track the plane
        this.viewer.trackedEntity = this.aircraftEntity;
    }
}
