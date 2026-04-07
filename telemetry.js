export class FlightTelemetry {
    constructor() {
        this.container = document.createElement('div');
        this.container.style.position = 'absolute';
        this.container.style.top = '20px';
        this.container.style.left = '20px';
        this.container.style.width = '240px';
        this.container.style.padding = '15px';
        this.container.style.backgroundColor = 'rgba(0, 15, 0, 0.8)';
        this.container.style.color = '#00ff44';
        this.container.style.fontFamily = 'monospace';
        this.container.style.border = '2px solid #00ff44';
        this.container.style.borderRadius = '10px';
        this.container.style.zIndex = '10000';
        this.container.style.pointerEvents = 'none';
        
        const style = document.createElement('style');
        style.innerHTML = `
            @keyframes hudBlink { 0% { opacity: 1; } 50% { opacity: 0; } 100% { opacity: 1; } }
            .stall-alert { color: #ff3300; font-size: 24px; text-align: center; font-weight: bold; animation: hudBlink 0.3s infinite; margin-bottom: 5px; text-shadow: 0 0 10px red; }
        `;
        document.head.appendChild(style);
        document.body.appendChild(this.container);
    }

    update(data, controls) {
        const knots = Math.round(data.airspeed * 1.94);
        const altMSL = Math.round(data.altitude * 3.28);
        const altAGL = Math.round((data.altitude - data.groundHeight) * 3.28);
        const vsi = Math.round(data.vs * 196.8);
        const throttlePercent = Math.round((controls.throttle / 9) * 100);

        const stallHUD = data.isStalled ? `<div class="stall-alert">!!! STALL !!!</div>` : '';

        this.container.innerHTML = `
            ${stallHUD}
            <div style="text-align:center; border-bottom:1px solid #00ff44; margin-bottom:10px; font-weight:bold;">SYSTEMS MONITOR</div>
            <div style="display:flex; justify-content:space-between;"><span>AIRSPEED:</span><span style="color:${knots < 170 ? '#ff0000' : '#00ff44'}">${knots} KTS</span></div>
            <div style="display:flex; justify-content:space-between;"><span>ALT(MSL):</span><span>${altMSL} FT</span></div>
            <div style="display:flex; justify-content:space-between; color:${altAGL < 1000 ? '#ffaa00' : '#00ff44'}"><span>ALT(AGL):</span><span>${altAGL} FT</span></div>
            <div style="display:flex; justify-content:space-between;"><span>VSI:</span><span>${vsi > 0 ? '+' : ''}${vsi} FPM</span></div>
            <hr style="border:0; border-top:1px dashed #00ff44; margin:10px 0;">
            <div style="display:flex; justify-content:space-between;"><span>ATTITUDE:</span><span>P:${data.pitch.toFixed(1)}° R:${data.roll.toFixed(1)}°</span></div>
            <div style="margin-top:10px;">
                <div style="font-size:10px; margin-bottom:3px;">THRUST LEVEL: ${throttlePercent}%</div>
                <div style="width:100%; height:10px; background:#002200; border:1px solid #00ff44;">
                    <div style="width:${throttlePercent}%; height:100%; background:#00ff44;"></div>
                </div>
            </div>
        `;
    }
}
