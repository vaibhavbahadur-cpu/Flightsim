export class FlightTelemetry {
    constructor() {
        // Create a container for the HUD
        this.container = document.createElement('div');
        this.container.style.position = 'absolute';
        this.container.style.top = '20px';
        this.container.style.left = '20px';
        this.container.style.padding = '15px';
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.6)';
        this.container.style.color = '#00ff00'; // Classic HUD Green
        this.container.style.fontFamily = 'monospace';
        this.container.style.fontSize = '16px';
        this.container.style.borderRadius = '5px';
        this.container.style.pointerEvents = 'none'; // Don't block mouse clicks
        this.container.style.zIndex = '1000';
        document.body.appendChild(this.container);
    }

    update(data, controls) {
        // Convert m/s to Knots (1 m/s ≈ 1.94 kts)
        const knots = (data.airspeed * 1.94).toFixed(0);
        // Convert meters to feet (1m ≈ 3.28ft)
        const altFeet = (data.altitude * 3.28).toFixed(0);
        // Throttle %
        const throttlePct = (controls.throttle / 9 * 100).toFixed(0);
        // Vertical Speed (converted to feet per minute)
        const vsFpm = (data.vs * 3.28 * 60).toFixed(0);

        this.container.innerHTML = `
            <div>AIRSPEED: ${knots} KTS</div>
            <div>ALTITUDE: ${altFeet} FT AGL</div>
            <div>VERT SPD: ${vsFpm} FPM</div>
            <div>PITCH:    ${data.pitch.toFixed(1)}°</div>
            <div>ROLL:     ${data.roll.toFixed(1)}°</div>
            <div style="margin-top:10px; color: #ffff00">THROTTLE: ${throttlePct}%</div>
        `;
    }
}
