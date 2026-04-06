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

        // Drop camera from space to Austin
        this.viewer.camera.flyTo({
            destination : Cesium.Cartesian3.fromDegrees(-97.67, 30.19, 1500),
            orientation : {
                heading : Cesium.Math.toRadians(0.0),
                pitch : Cesium.Math.toRadians(-35.0),
                roll : 0.0
            },
            duration: 4
        });
    }
}
