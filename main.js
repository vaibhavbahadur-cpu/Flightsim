import { FlightWorld } from './cesium.js';
import { Boeing748 } from './plane/plane.js';
import { FlightCamera } from './camera.js';
import { FlightPhysics } from './physics.js';
import { FlightControls } from './controls.js';
import { FlightTelemetry } from './telemetry.js';
import { FlightNav } from './nav.js';
import { FlightMultiplayer } from './multiplayer.js'; // IMPORT MULTIPLAYER

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
    
    // 1. INITIALIZE NAV SYSTEM
    const nav = new FlightNav((lat, lon, altMeters, heading) => {
        physics.latitude = lat;
        physics.longitude = lon;
        physics.altitude = altMeters;
        physics.heading = heading;
        physics.airspeed = altMeters > 100 ? 140 : 0;
        physics.pitch = 0;
        physics.roll = 0;
        physics.pitchVelocity = 0;
        physics.rollVelocity = 0;
        physics.vs = 0;
    });

    // 2. INITIALIZE MULTIPLAYER
    const callsign = prompt("Enter your Callsign (e.g., SPEEDBIRD, NASA1):", "PILOT_" + Math.floor(Math.random() * 1000));
    const multi = new FlightMultiplayer(world.viewer, nav, callsign);

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

            // 3. BROADCAST TO OTHER PLAYERS
            multi.send(data.latitude, data.longitude, data.altitude, data.heading, data.pitch, data.roll);

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
