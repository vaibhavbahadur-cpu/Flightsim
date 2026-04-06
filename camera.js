// camera.js - Flight Simulator Camera System
export class FlightCamera {
    constructor(viewer) {
        this.viewer = viewer;
        this.offset = {
            heading: Cesium.Math.toRadians(0),   // Directly behind
            pitch: Cesium.Math.toRadians(-15),  // Tilted slightly down to see the plane
            range: 150                           // 150 meters behind the tail
        };
    }

    // Set the camera to follow the tail of the plane
    setFollowView(entity) {
        this.viewer.trackedEntity = entity;
        
        // This creates the "Chase Cam" look
        this.viewer.camera.lookAtTransform(
            Cesium.Matrix4.IDENTITY, 
            new Cesium.HeadingPitchRange(
                this.offset.heading, 
                this.offset.pitch, 
                this.offset.range
            )
        );
    }

    // Reset the transform so the camera can move freely again
    freeCam() {
        this.viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
    }
}
