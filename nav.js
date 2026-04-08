export class FlightNav {
    constructor(onSpawnCallback) {
        this.onSpawn = onSpawnCallback;
        this.isOpen = false;
        this.selectedPos = { lat: 30.19, lon: -97.67 }; // Default Austin
        this.createUI();
    }

    createUI() {
        // 1. The "NAV" Toggle Button
        this.btn = document.createElement('button');
        this.btn.innerText = "NAV";
        this.btn.style.position = 'absolute';
        this.btn.style.bottom = '20px';
        this.btn.style.left = '50%';
        this.btn.style.transform = 'translateX(-50%)';
        this.btn.style.padding = '10px 30px';
        this.btn.style.backgroundColor = '#00ff44';
        this.btn.style.border = 'none';
        this.btn.style.fontWeight = 'bold';
        this.btn.style.cursor = 'pointer';
        this.btn.style.zIndex = '10001';
        document.body.appendChild(this.btn);

        // 2. The Map Container (Hidden by default)
        this.panel = document.createElement('div');
        this.panel.style.cssText = `
            position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 600px; height: 500px; background: #111; border: 3px solid #00ff44;
            display: none; flex-direction: column; z-index: 10002; border-radius: 10px; overflow: hidden;
        `;
        document.body.appendChild(this.panel);

        // 3. The Map Div
        const mapDiv = document.createElement('div');
        mapDiv.id = 'navMap';
        mapDiv.style.flex = '1';
        this.panel.appendChild(mapDiv);

        // 4. Settings Panel (Altitude/Heading/Spawn)
        const settings = document.createElement('div');
        settings.style.padding = '15px';
        settings.style.background = '#222';
        settings.style.color = '#00ff44';
        settings.innerHTML = `
            <div style="display:flex; justify-content: space-around; align-items: center;">
                <label>ALT: 
                    <select id="spawnAlt" style="background:#000; color:#00ff44; border:1px solid #00ff44">
                        <option value="0">0 FT (Ground)</option>
                        <option value="1000">1,000 FT</option>
                        <option value="5000">5,000 FT</option>
                        <option value="10000" selected>10,000 FT</option>
                        <option value="35000">35,000 FT</option>
                    </select>
                </label>
                <label>HDG: <input type="number" id="spawnHdg" value="360" style="width:50px; background:#000; color:#00ff44; border:1px solid #00ff44">°</label>
                <button id="spawnBtn" style="padding:5px 15px; background:#00ff44; font-weight:bold; cursor:pointer;">SPAWN</button>
            </div>
        `;
        this.panel.appendChild(settings);

        // Event Listeners
        this.btn.onclick = () => this.toggle();
        
        // Initialize Leaflet Map
        setTimeout(() => {
            this.map = L.map('navMap').setView([30.19, -97.67], 10);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
            
            const marker = L.marker([30.19, -97.67]).addTo(this.map);

            this.map.on('click', (e) => {
                this.selectedPos = { lat: e.latlng.lat, lon: e.latlng.lng };
                marker.setLatLng(e.latlng);
            });

            document.getElementById('spawnBtn').onclick = () => {
                const altFt = parseInt(document.getElementById('spawnAlt').value);
                const hdg = parseInt(document.getElementById('spawnHdg').value);
                this.onSpawn(this.selectedPos.lat, this.selectedPos.lon, altFt / 3.28, hdg);
                this.toggle();
            };
        }, 100);
    }

    toggle() {
        this.isOpen = !this.isOpen;
        this.panel.style.display = this.isOpen ? 'flex' : 'none';
        if (this.isOpen) {
            setTimeout(() => this.map.invalidateSize(), 100);
        }
    }
}
