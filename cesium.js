export class FlightWorld {
    constructor(containerId, token) {
        window.Cesium.Ion.defaultAccessToken = token;
        
        this.viewer = new window.Cesium.Viewer(containerId, {
            terrain: window.Cesium.Terrain.fromWorldTerrain(),
            selectionIndicator: false,
            infoBox: false,
            baseLayerPicker: false,
            geocoder: false,
            animation: false,
            timeline: false
        });
    }
}
