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
    
    // Start at 1,000ft, 200 kts (103 m/s)
    const physics = new FlightPhysics(30.19, -97.67, 305);
    
    my747.spawn(physics.longitude, physics.latitude, physics.altitude);

    function flightLoop() {
        const data = physics.update();
        
        // Update Position
        const position = window.Cesium.Cartesian3.fromDegrees(data.longitude, data.latitude, data.altitude);
        my747.aircraftEntity.position = position;

        // Update Orientation (Nose direction)
        const hpr = new window.Cesium.HeadingPitchRoll(window.Cesium.Math.toRadians(data.heading), 0, 0);
        my747.aircraftEntity.orientation = window.Cesium.Transforms.headingPitchRollQuaternion(position, hpr);

        // Update Camera
        camSystem.setFollowView(my747.aircraftEntity);

        requestAnimationFrame(flightLoop);
    }

    setTimeout(flightLoop, 2000);
}
