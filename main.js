import { FlightWorld } from './cesium.js';
import { Boeing748 } from './plane/plane.js';
import { FlightCamera } from './camera.js';
import { FlightPhysics } from './physics.js';
import { FlightControls } from './controls.js';

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2NzhkMDM2Zi0yOTIwLTQyOWEtYTYwYy1lY2IyYmNlMzNkZTYiLCJpZCI6NDEwODE3LCJpYXQiOjE3NzQ3OTc2NTB9.-Fwn3dLnJIdfvcJj2tiB7UHey2alHBtdRH8hCXcIqJY';

export async function startSimulation() {
    // 1. Ensure Cesium is loaded before starting
    if (typeof window.Cesium === 'undefined') {
        setTimeout(startSimulation, 500);
        return;
    }

    // 2. Initialize the World and Systems
    const world = new FlightWorld('cesiumContainer', TOKEN);
    const my747 = new Boeing748(world.viewer);
    const camSystem = new FlightCamera(world.viewer);
    const controls = new FlightControls();
    
    // Initial State: Austin, TX @ 1,000ft (305m)
    const physics = new FlightPhysics(30.19, -97.67, 305);
    
    // 3. Spawn the Aircraft
    my747.spawn(physics.longitude, physics.latitude, physics.altitude);

    let cameraInitialized = false;
    let lastFrameTime = performance.now();

    // 4. The Unified Flight Loop
    function flightLoop(now) {
        if (my747.aircraftEntity) {
            // Calculate real-time Delta Time
            const deltaTime = (now - lastFrameTime) / 1000;
            lastFrameTime = now;

            // Step A: Process Controls and Physics
            physics.applyInputs(controls, deltaTime);
            const data = physics.update();
            
            // Step B: Update 3D Position
            const position = window.Cesium.Cartesian3.fromDegrees(
                data.longitude, 
                data.latitude, 
                data.altitude
            );
            my747.aircraftEntity.position = position;

            // Step C: Update 3D Rotation (Heading, Pitch, and Roll)
            // -90 is the model's fixed offset to point North initially
            const visualHeading = data.heading - 90; 
            
            const hpr = new window.Cesium.HeadingPitchRoll(
                window.Cesium.Math.toRadians(visualHeading), 
                window.Cesium.Math.toRadians(data.pitch), 
                window.Cesium.Math.toRadians(data.roll)
            );
            
            my747.aircraftEntity.orientation = window.Cesium.Transforms.headingPitchRollQuaternion(
                position, 
                hpr
            );

            // Step D: Initialize Camera (Run once when plane is ready)
            if (!cameraInitialized) {
                const matrix = my747.aircraftEntity.computeModelMatrix(window.Cesium.JulianDate.now());
                if (matrix && !window.Cesium.Matrix4.equals(matrix, window.Cesium.Matrix4.IDENTITY)) {
                    camSystem.initializeFollow(my747.aircraftEntity);
                    cameraInitialized = true;
                }
            }
        }
        
        // Loop at monitor refresh rate (60fps+)
        requestAnimationFrame(flightLoop);
    }

    // Start loop after a short delay to let assets load
    setTimeout(() => {
        requestAnimationFrame(flightLoop);
    }, 3000);
}
