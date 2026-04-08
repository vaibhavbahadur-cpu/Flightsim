export class FlightNav {
    constructor(onSpawnCallback) {
        this.onSpawn = onSpawnCallback;
        this.isOpen = false;
        this.selectedPos = { lat: 30.19, lon: -97.67 };
        this.multiplayerMarkers = {}; // Stores markers for other pilots
        this.createUI();
    }

    createUI() {
        this.btn = document.createElement('button');
        this.btn.innerText = "NAV / RADAR";
        this.btn.style.cssText = `position:absolute; bottom:20px; left:50%; transform:translateX(-50%); 
            padding:10px 30px; background:#00ff44; border:none; font-weight:bold; cursor:pointer; z-index:10001;`;
        document.body.appendChild(this.btn);

        this.panel = document.createElement('div');
        this.panel.style.cssText = `position:absolute; top:50%; left:50%; transform:translate(-50%, -50%);
            width:700px; height:550px; background:#111; border:3px solid #00ff44; display:none; flex-direction:column; 
            z-index:10002; border-radius:10px; overflow:hidden; box-shadow: 0 0 20px rgba(0,255,68,0.5);`;
        document.body.appendChild(this.panel);

        const mapDiv = document.createElement('div');
        mapDiv.id = 'navMap';
        mapDiv.style.flex = '1';
        this.panel.appendChild(mapDiv);

        const settings = document.createElement('div');
        settings.style.padding = '15px';
        settings.style.background = '#222';
        settings.style.color = '#00ff44';
        settings.innerHTML = `
            <div style="display:flex; justify-content: space-around; align-items: center; font-family:monospace;">
                <label>ALT: 
                    <select id="spawnAlt" style="background:#000; color:#00ff44; border:1px solid #00ff44">
                        <option value="0">0 FT</option><option value="1000">1,000 FT</option>
                        <option value="10000" selected>10,000 FT</option><option value="35000">35,000 FT</option>
                    </select>
                </label>
                <label>HDG: <input type="number" id="spawnHdg" value="360" style="width:50px; background:#000; color:#00ff44; border:1px solid #00ff44">°</label>
                <button id="spawnBtn" style="padding:5px 15px; background:#00ff44; font-weight:bold; cursor:pointer; border:none;">RELOCATE SPAWN</button>
            </div>`;
        this.panel.appendChild(settings);

        this.btn.onclick = () => this.toggle();
        
        setTimeout(() => {
            this.map = L.map('navMap').setView([30.19, -97.67], 10);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(this.map);
            this.spawnMarker = L.marker([30.19, -97.67], {draggable: true}).addTo(this.map).bindPopup("Spawn Point");

            this.map.on('click', (e) => {
                this.selectedPos = { lat: e.latlng.lat, lon: e.latlng.lng };
                this.spawnMarker.setLatLng(e.latlng);
            });

            document.getElementById('spawnBtn').onclick = () => {
                const altFt = parseInt(document.getElementById('spawnAlt').value);
                const hdg = parseInt(document.getElementById('spawnHdg').value);
                this.onSpawn(this.selectedPos.lat, this.selectedPos.lon, altFt / 3.28, hdg);
                this.toggle();
            };
        }, 100);
    }

    updateRemotePlayer(id, lat, lon, callsign, alt) {
        if (!this.map) return;
        const altFt = Math.round(alt * 3.28);
        if (!this.multiplayerMarkers[id]) {
            this.multiplayerMarkers[id] = L.circleMarker([lat, lon], {
                color: '#ff0000', radius: 8, fillOpacity: 0.8
            }).addTo(this.map).bindTooltip(`${callsign} (${altFt}ft)`, {permanent: true, direction: 'top'});
        } else {
            this.multiplayerMarkers[id].setLatLng([lat, lon]);
            this.multiplayerMarkers[id].setTooltipContent(`${callsign} (${altFt}ft)`);
        }
    }

    removeRemotePlayer(id) {
        if (this.multiplayerMarkers[id]) {
            this.map.removeLayer(this.multiplayerMarkers[id]);
            delete this.multiplayerMarkers[id];
        }
    }

    toggle() {
        this.isOpen = !this.isOpen;
        this.panel.style.display = this.isOpen ? 'flex' : 'none';
        if (this.isOpen) setTimeout(() => this.map.invalidateSize(), 100);
    }
}
