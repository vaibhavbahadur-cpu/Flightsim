import { FlightWorld } from './cesium.js';
import { Boeing748 } from './plane/plane.js';
import { FlightCamera } from './camera.js';
import { FlightPhysics } from './physics.js';
import { FlightControls } from './controls.js';

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI2NzhkMDM2Zi0yOTIwLTQyOWEtYTYwYy1lY2IyYmNlMzNkZTYiLCJpZCI6NDEwODE3LCJpYXQiOjE3NzQ3OTc2NTB9.-Fwn3dLnJIdfvcJj2tiB7UHey2alHBtdRH8hCXcIqJY';

export async function startSimulation() {
    if (typeof window.Cesium === 'undefined') {
        setTimeout(startSimulation, 500);
        return;
    }

    const world = new FlightWorld('cesiumContainer', TOKEN);
    const my747 = new Boeing748(world.viewer);
    const camSystem = new FlightCamera(world.viewer);
    const controls = new FlightControls();
    const physics = new FlightPhysics(30.19, -97.67, 305);
    
    my747.spawn(physics.longitude, physics.latitude, physics.altitude);

    let cameraInitialized = false;

    function flightLoop(now) {
        if (my747.aircraftEntity) {
            // Update systems
            physics.applyInputs(controls, 0.016); // Standard 60fps delta
            const data = physics.update();
            
            // Move Model
            const pos = window.Cesium.Cartesian3.fromDegrees(data.longitude, data.latitude, data.altitude);
            my747.aircraftEntity.position = pos;

            // Rotate Model (-90 offset for nose alignment)
            const vHeading = data.heading - 90; 
            const hpr = new window.Cesium.HeadingPitchRoll(window.Cesium.Math.toRadians(vHeading), 0, 0);
            my747.aircraftEntity.orientation = window.Cesium.Transforms.headingPitchRollQuaternion(pos, hpr);

            // Lock Camera once
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

    setTimeout(() => {
        requestAnimationFrame(flightLoop);
    }, 3000);
}
