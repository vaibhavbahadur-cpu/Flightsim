export class FlightWorld {
    constructor(containerId, navMapId, token) {
        Cesium.Ion.defaultAccessToken = token;

        // Main Viewer - Settings optimized to stop "About:Blank" errors
        this.viewer = new Cesium.Viewer(containerId, {
            terrain: Cesium.Terrain.fromWorldTerrain(),
            selectionIndicator: false,
            infoBox: false, // Critical: Stops the sandboxed frame error
            baseLayerPicker: false,
            geocoder: false,
            animation: false,
            timeline: false
        });

        // 2D Nav Map
        this.navViewer = new Cesium.Viewer(navMapId, {
            sceneMode: Cesium.SceneMode.SCENE2D,
            baseLayerPicker: false,
            geocoder: true,
            animation: false,
            timeline: false
        });

        // Trigger the descent to Austin
        this.viewer.camera.flyTo({
            destination : Cesium.Cartesian3.fromDegrees(-97.67, 30.19, 1500),
            orientation : {
                heading : Cesium.Math.toRadians(0.0),
                pitch : Cesium.Math.toRadians(-30.0),
                roll : 0.0
            },
            duration: 4
        });
    }
}
