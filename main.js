import { FlightWorld } from './cesium.js';
import { Boeing748 } from './plane/plane.js';
import { FlightCamera } from './camera.js';
import { FlightPhysics } from './physics.js';
import { FlightControls } from './controls.js';
import { FlightTelemetry } from './telemetry.js';

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
    const telemetry = new FlightTelemetry();
    const physics = new FlightPhysics(30.19, -97.67, 1000); 
    
    my747.spawn(physics.longitude, physics.latitude, physics.altitude);

    let cameraInitialized = false;
    let lastFrameTime = performance.now();

    function flightLoop(now) {
        if (my747.aircraftEntity) {
            const carto = window.Cesium.Cartographic.fromDegrees(physics.longitude, physics.latitude);
            const height = world.viewer.scene.globe.getHeight(carto);
            if (height !== undefined) physics.groundHeight = height;

            const deltaTime = (now - lastFrameTime) / 1000;
            lastFrameTime = now;
            physics.applyInputs(controls, deltaTime);
            const data = physics.update();
            
            const pos = window.Cesium.Cartesian3.fromDegrees(data.longitude, data.latitude, data.altitude);
            my747.aircraftEntity.position = pos;

            const hpr = new window.Cesium.HeadingPitchRoll(
                window.Cesium.Math.toRadians(data.heading - 90), 
                window.Cesium.Math.toRadians(data.pitch), 
                window.Cesium.Math.toRadians(data.roll)
            );
            my747.aircraftEntity.orientation = window.Cesium.Transforms.headingPitchRollQuaternion(pos, hpr);

            telemetry.update(data, controls);
            if (!cameraInitialized) {
                camSystem.initializeFollow(my747.aircraftEntity);
                cameraInitialized = true;
            }
        }
        requestAnimationFrame(flightLoop);
    }

    setTimeout(() => { requestAnimationFrame(flightLoop); }, 3000);
}
