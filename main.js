import { FlightWorld } from './cesium.js';
import { Boeing748 } from './plane/plane.js';
import { FlightCamera } from './camera.js';
import { FlightPhysics } from './physics.js';

// Your Cesium Ion Token
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2NzhkMDM2Zi0yOTIwLTQyOWEtYTYwYy1lY2IyYmNlMzNkZTYiLCJpZCI6NDEwODE3LCJpYXQiOjE3NzQ3OTc2NTB9.-Fwn3dLnJIdfvcJj2tiB7UHey2alHBtdRH8hCXcIqJY';

export async function startSimulation() {
    // 1. Safety check for the Cesium Engine
    if (typeof window.Cesium === 'undefined') {
        setTimeout(startSimulation, 100);
        return;
    }

    // 2. Initialize Systems
    const world = new FlightWorld('cesiumContainer', TOKEN);
    const my747 = new Boeing748(world.viewer);
    const camSystem = new FlightCamera(world.viewer);
    
    // Initial State: Austin, TX @ 1,000ft (305m), 200kts (103 m/s)
    const physics = new FlightPhysics(30.19, -97.67, 305);
    
    // 3. Spawn the Model
    my747.spawn(physics.longitude, physics.latitude, physics.altitude);

    let cameraInitialized = false;

    // 4. The Flight Loop (Run every frame)
    function flightLoop() {
        if (my747.aircraftEntity) {
            // Update physics data (Position & Speed)
            const data = physics.update();
            
            // Set the new 3D Position
            const position = window.Cesium.Cartesian3.fromDegrees(
                data.longitude, 
                data.latitude, 
                data.altitude
            );
            my747.aircraftEntity.position = position;

            // FIX: Rotate the model 90 degrees CCW to align the nose with the flight path
            const visualHeading = data.heading - 90; 
            const hpr = new window.Cesium.HeadingPitchRoll(
                window.Cesium.Math.toRadians(visualHeading), 
                0, 
                0
            );
            my747.aircraftEntity.orientation = window.Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

            // INITIAL CAMERA LOCK: Snaps behind the tail once, then allows free-look
            if (!cameraInitialized) {
                camSystem.initializeFollow(my747.aircraftEntity);
                cameraInitialized = true;
                console.log("Navigation: Flight path locked. Manual camera control enabled.");
            }
        }
        
        // Request the next frame
        requestAnimationFrame(flightLoop);
    }

    // Start the loop after a 2-second delay to allow assets to load
    setTimeout(flightLoop, 2000);
}
