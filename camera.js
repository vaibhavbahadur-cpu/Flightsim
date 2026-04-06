export class FlightCamera {
    constructor(viewer) {
        this.viewer = viewer;
        // 180 = Tail, -15 = Tilted Up, 150 = Distance
        this.offset = new window.Cesium.HeadingPitchRange(
            window.Cesium.Math.toRadians(180), 
            window.Cesium.Math.toRadians(-15), 
            150
        );
    }

    initializeFollow(entity) {
        if (!entity) return;

        // Get the plane's current position/rotation matrix
        const transform = entity.computeModelMatrix(window.Cesium.JulianDate.now());
        
        if (transform) {
            // This pins the camera to the plane's 'universe'
            this.viewer.camera.lookAtTransform(transform, this.offset);
            
            // This allows the mouse to still orbit the center
            this.viewer.trackedEntity = entity; 
        }
    }
}
