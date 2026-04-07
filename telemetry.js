export class FlightTelemetry {
    constructor() {
        // Create the HUD Overlay
        this.container = document.createElement('div');
        this.container.id = 'flight-hud';
        this.container.style.position = 'absolute';
        this.container.style.top = '20px';
        this.container.style.left = '20px';
        this.container.style.width = '220px';
        this.container.style.padding = '15px';
        this.container.style.backgroundColor = 'rgba(0, 20, 0, 0.7)'; // Dark cockpit green
        this.container.style.color = '#00ff44'; // High-vis phosphor green
        this.container.style.fontFamily = '"Courier New", Courier, monospace';
        this.container.style.fontSize = '14px';
        this.container.style.fontWeight = 'bold';
        this.container.style.borderRadius = '8px';
        this.container.style.border = '2px solid #00ff44';
        this.container.style.boxShadow = '0 0 15px rgba(0, 255, 68, 0.3)';
        this.container.style.pointerEvents = 'none'; 
        this.container.style.zIndex = '9999';
        document.body.appendChild(this.container);
    }

    update(data, controls) {
        // --- DATA CONVERSIONS ---
        // Meters to Feet: 1m = 3.28084ft
        const altMSL = Math.round(data.altitude * 3.28084);
        const altAGL = Math.round((data.altitude - data.groundHeight) * 3.28084);
        
        // m/s to Knots: 1 m/s = 1.94384 knots
        const knots = Math.round(data.airspeed * 1.94384);
        
        // m/s to Feet Per Minute (VSI): 1 m/s = 196.85 fpm
        const vsi = Math.round(data.vs * 196.85);
        
        // Throttle Percentage (1-9 scale)
        const throttlePercent = Math.round((controls.throttle / 9) * 100);
        
        // --- RENDER HUD ---
        this.container.innerHTML = `
            <div style="text-align: center; border-bottom: 1px solid #00ff44; margin-bottom: 8px; padding-bottom: 5px;">
                747-8 TELEMETRY
            </div>
            
            <div style="display: flex; justify-content: space-between;">
                <span>SPD:</span>
                <span>${knots} KTS</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; color: #ffffff;">
                <span>ALT(MSL):</span>
                <span>${altMSL} FT</span>
            </div>
            
            <div style="display: flex; justify-content: space-between; color: ${altAGL < 1000 ? '#ffaa00' : '#00ff44'};">
                <span>ALT(AGL):</span>
                <span>${altAGL} FT</span>
            </div>
            
            <div style="display: flex; justify-content: space-between;">
                <span>VSI:</span>
                <span>${vsi > 0 ? '+' : ''}${vsi} FPM</span>
            </div>

            <div style="margin-top: 10px; padding-top: 5px; border-top: 1px dashed #00ff44;">
                <div style="display: flex; justify-content: space-between;">
                    <span>PITCH:</span>
                    <span>${data.pitch.toFixed(1)}°</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>ROLL:</span>
                    <span>${data.roll.toFixed(1)}°</span>
                </div>
            </div>

            <div style="margin-top: 12px;">
                <div style="font-size: 10px; margin-bottom: 2px;">THROTTLE: ${throttlePercent}%</div>
                <div style="width: 100%; height: 8px; background: #003300; border: 1px solid #00ff44;">
                    <div style="width: ${throttlePercent}%; height: 100%; background: #00ff44;"></div>
                </div>
            </div>
        `;
    }
}
