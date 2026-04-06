export class FlightCamera {
    constructor(viewer) {
        this.viewer = viewer;
        this.offset = new window.Cesium.HeadingPitchRange(
            window.Cesium.Math.toRadians(180), // Tail view
            window.Cesium.Math.toRadians(-15), // Pitch
            150                                // Distance
        );
    }

    update(matrix) {
        // This 'glues' the camera to the plane so it can't shake
        this.viewer.camera.lookAtTransform(matrix, this.offset);
    }
}
