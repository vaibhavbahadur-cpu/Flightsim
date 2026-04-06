export class FlightCamera {
    constructor(viewer) {
        this.viewer = viewer;
    }

    setFollowView(entity) {
        if (!entity) return;

        // 1. Lock the selection to the plane
        this.viewer.trackedEntity = entity;

        // 2. Define the offset: 
        // Heading: 0 (Directly Behind)
        // Pitch: -15 degrees (Tilted slightly down to see the top of the wings)
        // Range: 100 meters (Distance from the tail)
        const offset = new window.Cesium.HeadingPitchRange(
            window.Cesium.Math.toRadians(90), 
            window.Cesium.Math.toRadians(-15), 
            100 
        );

        // 3. Force the camera to look at the plane using its internal transform
        // This ensures zooming in goes to the plane, not the Earth's core
        this.viewer.zoomTo(entity, offset).then(() => {
            // This 'then' ensures it only locks AFTER the camera arrives
            this.viewer.camera.lookAtTransform(
                entity.computeModelMatrix(window.Cesium.JulianDate.now()), 
                offset
            );
        });
    }

    // Call this if you want to fly around freely again
    unlock() {
        this.viewer.camera.lookAtTransform(window.Cesium.Matrix4.IDENTITY);
    }
}
