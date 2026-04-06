import { FlightWorld } from './cesium.js';
import { Boeing748 } from './plane/plane.js';
import { FlightCamera } from './camera.js';
import { FlightPhysics } from './physics.js';
import { FlightControls } from './controls.js';

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2NzhkMDM2Zi0yOTIwLTQyOWEtYTYwYy1lY2IyYmNlMzNkZTYiLCJpZCI6NDEwODE3LCJpYXQiOjE3NzQ3OTc2NTB9.-Fwn3dLnJIdfvcJj2tiB7UHey2alHBtdRH8hCXcIqJY';

export async function startSimulation() {
    if (typeof window.Cesium === 'undefined') {
        setTimeout(startSimulation, 100);
        return;
    }

    // 1. Initialize Systems
    const world = new FlightWorld('cesiumContainer', TOKEN);
    const my747 = new Boeing748(world.viewer);
    const camSystem = new FlightCamera(world.viewer);
    const controls = new FlightControls();
    
    // Initial State: Austin, TX @ 1,000ft (305m)
    const physics = new FlightPhysics(30.19, -97.67, 305);
    
    // 2. Spawn the 747-8
    my747.spawn(physics.longitude, physics.latitude, physics.altitude);

    let cameraInitialized = false;
    let lastFrameTime = performance.now();

    // 3. The Flight Loop
    function flightLoop() {
        if (my747.aircraftEntity) {
            // Calculate Delta Time (Time since last frame)
            const now = performance.now();
            const deltaTime = (now - lastFrameTime) / 1000; 
            lastFrameTime = now;

            // Step 1: Apply User Inputs (Arrows, 1-9, A/D)
            physics.applyInputs(controls, deltaTime);
            
            // Step 2: Update Physics Position
            const data = physics.update();
            
            // Step 3: Move the 3D Model
            const position = window.Cesium.Cartesian3.fromDegrees(
                data.longitude, 
                data.latitude, 
                data.altitude
            );
            my747.aircraftEntity.position = position;

            // Step 4: Rotate the Model (Align Nose + Apply visual Pitch/Roll)
            // We rotate -90 for the model offset, then add physics heading
            const visualHeading = data.heading - 90; 
            const hpr = new window.Cesium.HeadingPitchRoll(
                window.Cesium.Math.toRadians(visualHeading), 
                window.Cesium.Math.toRadians(0), // We can add data.pitch here later
                window.Cesium.Math.toRadians(0)  // We can add data.roll here later
            );
            my747.aircraftEntity.orientation = window.Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

            // Step 5: Initialize Camera (Lock to tail once, then allow orbit)
            if (!cameraInitialized) {
                const matrix = my747.aircraftEntity.computeModelMatrix(window.Cesium.JulianDate.now());
                if (matrix && !window.Cesium.Matrix4.equals(matrix, window.Cesium.Matrix4.IDENTITY)) {
                    camSystem.initializeFollow(my747.aircraftEntity);
                    cameraInitialized = true;
                }
            }
        }
        
        requestAnimationFrame(flightLoop);
    }

    // Start loop after assets settle
    setTimeout(flightLoop, 2000);
}
