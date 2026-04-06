// cesium.js - The World & Map Module
export class FlightWorld {
    constructor(containerId, navMapId, token) {
        // Use the token passed from the main launcher
        Cesium.Ion.defaultAccessToken = token;

        // 1. MAIN 3D VIEWER (The Flight Window)
        this.viewer = new Cesium.Viewer(containerId, {
            terrain: Cesium.Terrain.fromWorldTerrain(),
            baseLayerPicker: false,
            animation: false,
            timeline: false,
            sceneModePicker: false,
            selectionIndicator: false,
            infoBox: false,
            // CORS/Performance: Only render when something changes
            requestRenderMode: true, 
            maximumRenderTimeChange: 0.0
        });

        // 2. 2D NAVIGATION MAP (The Spawning Tool)
        this.navViewer = new Cesium.Viewer(navMapId, {
            sceneMode: Cesium.SceneMode.SCENE2D,
            baseLayerPicker: false,
            geocoder: true,
            animation: false,
            timeline: false,
            navigationHelpButton: false,
            homeButton: false
        });

        // Clean up the UI for a "Simulator" look
        if (this.navViewer.cesiumWidget.creditContainer) {
            this.navViewer.cesiumWidget.creditContainer.style.display = "none";
        }

        this.selectedSpawn = null;
        this.setupEvents();
    }

    // Handles clicking on the map to choose where to fly
    setupEvents() {
        const handler = new Cesium.ScreenSpaceEventHandler(this.navViewer.scene.canvas);
        handler.setInputAction((click) => {
            const cartesian = this.navViewer.camera.pickEllipsoid(click.position);
            if (cartesian) {
                const carto = Cesium.Cartographic.fromCartesian(cartesian);
                this.selectedSpawn = {
                    lon: Cesium.Math.toDegrees(carto.longitude),
                    lat: Cesium.Math.toDegrees(carto.latitude)
                };
                console.log("📍 Spawn point locked at:", this.selectedSpawn);
            }
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
    }

    // Helper to find the ground so the plane doesn't spawn underground
    async getTerrainHeight(lon, lat) {
        const positions = [Cesium.Cartographic.fromDegrees(lon, lat)];
        try {
            await Cesium.sampleTerrainMostDetailed(this.viewer.terrainProvider, positions);
            return positions[0].height || 0;
        } catch (e) {
            return 0; // Fallback to sea level if terrain data fails
        }
    }
}
