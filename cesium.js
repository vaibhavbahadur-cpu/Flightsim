export class FlightWorld {
    constructor(containerId, token) {
        Cesium.Ion.defaultAccessToken = token;
        this.viewer = new Cesium.Viewer(containerId, {
            terrain: Cesium.Terrain.fromWorldTerrain(),
            selectionIndicator: false,
            infoBox: false,
            baseLayerPicker: false,
            geocoder: false,
            animation: false,
            timeline: false
        });

        // Instant camera move to Austin
        this.viewer.camera.setView({
            destination: Cesium.Cartesian3.fromDegrees(-97.67, 30.19, 2000),
            orientation: {
                heading: Cesium.Math.toRadians(0),
                pitch: Cesium.Math.toRadians(-30),
                roll: 0
            }
        });
    }
}
