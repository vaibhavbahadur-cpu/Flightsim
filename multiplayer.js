export class FlightMultiplayer {
    constructor(viewer, nav, callsign) {
        this.viewer = viewer;
        this.nav = nav;
        // Your unique random ID
        this.id = "pilot-" + Math.random().toString(36).substr(2, 5);
        this.callsign = callsign || "Unknown";
        this.others = {};
        this.connections = {};

        // HUD for debugging
        this.statusDiv = document.createElement('div');
        this.statusDiv.style.cssText = "position:absolute; top:10px; right:10px; padding:15px; background:rgba(0,0,0,0.9); color:#0f0; font-family:monospace; z-index:10005; border:2px solid #0f0; border-radius:10px;";
        document.body.appendChild(this.statusDiv);

        this.init();
    }

    init() {
        // We use a FIXED ID for the lobby so random names can find each other
        this.peer = new Peer('b748-global-lobby-' + Math.floor(Math.random() * 5)); 

        this.peer.on('open', (id) => {
            this.statusDiv.innerHTML = `CALLSIGN: ${this.callsign}<br>STATUS: SCANNING SKIES...`;
            
            // Search for the 5 possible lobby slots
            for (let i = 0; i < 5; i++) {
                const target = 'b748-global-lobby-' + i;
                if (target !== id) {
                    this.connectTo(target);
                }
            }
        });

        this.peer.on('connection', (conn) => {
            this.setupConnection(conn);
        });

        this.peer.on('error', (err) => {
            console.log("Peer error (usually safe):", err.type);
        });
    }

    connectTo(targetId) {
        const conn = this.peer.connect(targetId);
        this.setupConnection(conn);
    }

    setupConnection(conn) {
        conn.on('open', () => {
            this.connections[conn.peer] = conn;
            this.statusDiv.innerHTML = `CALLSIGN: ${this.callsign}<br>STATUS: <span style="color:#0ff">CONNECTED</span>`;
        });

        conn.on('data', (data) => {
            this.updateEntity(data);
            this.nav.updateRemotePlayer(data.id, data.pos.lat, data.pos.lon, data.callsign, data.pos.alt);
        });

        conn.on('close', () => {
            this.removePlayer(conn.peer);
        });
    }

    updateEntity(data) {
        if (!this.others[data.id]) {
            this.others[data.id] = this.viewer.entities.add({
                name: data.callsign,
                model: { 
                    uri: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMilkTruck/glTF/CesiumMilkTruck.glb', 
                    scale: 30, // BIGGER so you can't miss it
                    minimumPixelSize: 150 
                },
                label: { 
                    text: data.callsign.toUpperCase(), 
                    font: 'bold 24pt monospace', 
                    fillColor: Cesium.Color.YELLOW,
                    outlineColor: Cesium.Color.BLACK,
                    outlineWidth: 4,
                    pixelOffset: new Cesium.Cartesian2(0, -100),
                    disableDepthTestDistance: Number.POSITIVE_INFINITY 
                }
            });
        }
        const pos = Cesium.Cartesian3.fromDegrees(data.pos.lon, data.pos.lat, data.pos.alt);
        this.others[data.id].position = pos;
        this.others[data.id].orientation = Cesium.Transforms.headingPitchRollQuaternion(pos, 
            new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(data.hpr.h-90), Cesium.Math.toRadians(data.hpr.p), Cesium.Math.toRadians(data.hpr.r)));
    }

    send(lat, lon, alt, h, p, r) {
        const payload = { id: this.peer.id, callsign: this.callsign, pos: { lat, lon, alt }, hpr: { h, p, r } };
        for (let id in this.connections) {
            if (this.connections[id].open) {
                this.connections[id].send(payload);
            }
        }
    }
}
