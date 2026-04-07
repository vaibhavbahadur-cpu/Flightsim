// Inside your flightLoop(now) function in main.js:

function flightLoop(now) {
    if (my747.aircraftEntity) {
        // 1. Get Terrain Height for current position
        const cartographic = window.Cesium.Cartographic.fromDegrees(
            physics.longitude, 
            physics.latitude
        );
        
        // Sample the terrain height at this location
        const terrainHeight = world.viewer.scene.globe.getHeight(cartographic);
        
        if (terrainHeight !== undefined) {
            physics.groundHeight = terrainHeight;
        }

        // 2. Run Physics
        const deltaTime = (now - lastFrameTime) / 1000;
        lastFrameTime = now;
        physics.applyInputs(controls, deltaTime);
        const data = physics.update();

        // 3. Update Model
        const position = window.Cesium.Cartesian3.fromDegrees(data.longitude, data.latitude, data.altitude);
        my747.aircraftEntity.position = position;
        
        // ... (Orientation and Telemetry code follows)
        telemetry.update(data, controls);
    }
    requestAnimationFrame(flightLoop);
}
