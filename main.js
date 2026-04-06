function flightLoop() {
    const data = physics.update();
    
    // Update Position
    const position = window.Cesium.Cartesian3.fromDegrees(data.longitude, data.latitude, data.altitude);
    my747.aircraftEntity.position = position;

    // ROTATION FIX: Rotate 90 degrees CCW to align nose with travel direction
    const visualHeading = data.heading - 90; 
    const hpr = new window.Cesium.HeadingPitchRoll(
        window.Cesium.Math.toRadians(visualHeading), 
        0, 
        0
    );
    my747.aircraftEntity.orientation = window.Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

    // JITTER FIX: Tell the camera to follow the model's exact matrix
    const matrix = my747.aircraftEntity.computeModelMatrix(window.Cesium.JulianDate.now());
    if (matrix) {
        camSystem.update(matrix); // We will update camera.js to handle this matrix
    }

    requestAnimationFrame(flightLoop);
}
