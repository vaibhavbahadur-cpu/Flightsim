export class FlightTelemetry {
    constructor() {
        this.container = document.createElement('div');
        this.container.style.position = 'absolute';
        this.container.style.top = '20px';
        this.container.style.left = '20px';
        this.container.style.width = '220px';
        this.container.style.padding = '15px';
        this.container.style.backgroundColor = 'rgba(0, 20, 0, 0.7)';
        this.container.style.color = '#00ff44';
        this.container.style.fontFamily = 'monospace';
        this.container.style.border = '2px solid #00ff44';
        this.container.style.borderRadius = '8px';
        this.container.style.zIndex = '9999';
        this.container.style.pointerEvents = 'none';
        document.body.appendChild(this.container);
    }

    update(data, controls) {
        const altMSL = Math.round(data.altitude * 3.28);
        const altAGL = Math.round((data.altitude - data.groundHeight) * 3.28);
        const knots = Math.round(data.airspeed * 1.94);
        const vsi = Math.round(data.vs * 196.8);
        const throttlePercent = Math.round((controls.throttle / 9) * 100);

        this.container.innerHTML = `
            <div style="text-align:center; border-bottom:1px solid #00ff44; margin-bottom:10px">747-8 HUD</div>
            <div>SPD: ${knots} KTS</div>
            <div>ALT(MSL): ${altMSL} FT</div>
            <div style="color:${altAGL < 1000 ? '#ffaa00' : '#00ff44'}">ALT(AGL): ${altAGL} FT</div>
            <div>VSI: ${vsi > 0 ? '+' : ''}${vsi} FPM</div>
            <hr style="border:0; border-top:1px dashed #00ff44">
            <div>PITCH: ${data.pitch.toFixed(1)}° | ROLL: ${data.roll.toFixed(1)}°</div>
            <div style="margin-top:10px">THR: ${throttlePercent}%</div>
            <div style="width:100%; height:8px; background:#003300; border:1px solid #00ff44">
                <div style="width:${throttlePercent}%; height:100%; background:#00ff44"></div>
            </div>
        `;
    }
}
