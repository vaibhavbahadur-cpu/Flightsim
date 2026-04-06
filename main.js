import { FlightWorld } from './cesium.js';
import { Boeing748 } from './plane/plane.js';
import { FlightCamera } from './camera.js';
import { FlightPhysics } from './physics.js';

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2NzhkMDM2Zi0yOTIwLTQyOWEtYTYwYy1lY2IyYmNlMzNkZTYiLCJpZCI6NDEwODE3LCJpYXQiOjE3NzQ3OTc2NTB9.-Fwn3dLnJIdfvcJj2tiB7UHey2alHBtdRH8hCXcIqJY';

export async function startSimulation() {
    if (typeof window.Cesium === 'undefined') {
        setTimeout(startSimulation, 100);
        return;
    }

    const world = new FlightWorld('cesiumContainer', TOKEN);
    const my747 = new Boeing748(world.viewer);
    const camSystem = new FlightCamera(world.viewer);
    
    // Spawn at 200kts (103 m/s) over Austin
    const physics = new FlightPhysics(30.19, -97.67, 305);
    my747.spawn(physics.longitude, physics.latitude, physics.altitude);

    let cameraInitialized = false;

    function flightLoop() {
        if (my747.aircraftEntity) {
            const data = physics.update();
            
            // Update Position
            const position = window.Cesium.Cartesian3.fromDegrees(data.longitude, data.latitude, data.altitude);
            my747.aircraftEntity.position = position;

            // Rotation Fix: Rotate 90 deg CCW to align nose with travel
            const visualHeading = data.heading - 90; 
            const hpr = new window.Cesium.HeadingPitchRoll(window.Cesium.Math.toRadians(visualHeading), 0, 0);
            my747.aircraftEntity.orientation = window.Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

            // Initialize camera ONLY ONCE after the entity is ready
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

    setTimeout(flightLoop, 2000);
}
