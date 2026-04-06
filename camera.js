export class FlightCamera {
    constructor(viewer) {
        this.viewer = viewer;
    }

    setFollowView(entity) {
        if (!entity) return;
        
        this.viewer.trackedEntity = entity;
        
        // Using window.Cesium to ensure the library is found
        const offset = new window.Cesium.HeadingPitchRange(
            window.Cesium.Math.toRadians(0),   // Behind
            window.Cesium.Math.toRadians(-15), // Tilted up
            150                                // Distance
        );

        this.viewer.zoomTo(entity, offset);
    }
}
