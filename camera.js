export class FlightCamera {
    constructor(viewer) {
        this.viewer = viewer;
        // Default view: Tail, slightly up, 150m away
        this.defaultOffset = new window.Cesium.HeadingPitchRange(
            window.Cesium.Math.toRadians(180), 
            window.Cesium.Math.toRadians(-15), 
            150
        );
    }

    // Run this ONCE when the plane spawns
    initializeFollow(entity) {
        if (!entity) return;
        this.viewer.trackedEntity = entity;
        
        // Reset the camera to the tail view initially
        this.viewer.zoomTo(entity, this.defaultOffset);
    }

    // We no longer need the update(matrix) function because 
    // trackedEntity handles the "glue" automatically without 
    // blocking your mouse!
    update() {
        // Leave empty for now to allow free-look
    }
}
