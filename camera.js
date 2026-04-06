export class FlightCamera {
    constructor(viewer) {
        this.viewer = viewer;
        // 180 = Behind Tail, -15 = Tilted down, 150 = Distance
        this.offset = new window.Cesium.HeadingPitchRange(
            window.Cesium.Math.toRadians(180), 
            window.Cesium.Math.toRadians(-15), 
            150
        );
    }

    initializeFollow(entity) {
        if (!entity) return;

        // The Secret Sauce: Lock the camera's universe to the plane's position
        const transform = entity.computeModelMatrix(window.Cesium.JulianDate.now());
        
        if (transform) {
            this.viewer.camera.lookAtTransform(transform, this.offset);
            // This line allows the mouse to still orbit while staying "glued"
            this.viewer.trackedEntity = entity; 
        }
    }
}
