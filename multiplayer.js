export class FlightMultiplayer {
    constructor(viewer, nav, callsign) {
        this.viewer = viewer;
        this.nav = nav;
        this.callsign = callsign.replace(/\s+/g, '-').toLowerCase();
        this.others = {};
        this.connections = {};

        // Create a status indicator on the screen
        this.statusDiv = document.createElement('div');
        this.statusDiv.style.cssText = "position:absolute; top:10px; right:10px; padding:10px; background:rgba(0,0,0,0.7); color:#0f0; font-family:monospace; z-index:10005; border:1px solid #0f0;";
        this.statusDiv.innerHTML = `ID: ${this.callsign} <br> STATUS: INITIALIZING...`;
        document.body.appendChild(this.statusDiv);

        this.peer = new Peer(this.callsign);
        this.init();
    }

    init() {
        this.peer.on('open', (id) => {
            this.statusDiv.innerHTML = `ID: ${id} <br> STATUS: ONLINE (WAITING)`;
            this.statusDiv.style.color = "#0f0";

            // If we are pilot-2, try to find pilot-1 every 3 seconds
            if (this.callsign === 'pilot-2') {
                setInterval(() => {
                    if (Object.keys(this.connections).length === 0) {
                        this.connectTo('pilot-1');
                    }
                }, 3000);
            }
        });

        this.peer.on('connection', (conn) => {
            this.setupConnection(conn);
        });

        this.peer.on('error', (err) => {
            this.statusDiv.innerHTML = `ID: ${this.callsign} <br> ERROR: ${err.type}`;
            this.statusDiv.style.color = "#f00";
        });
    }

    connectTo(targetId) {
        console.log("Calling " + targetId);
        const conn = this.peer.connect(targetId);
        this.setupConnection(conn);
    }

    setupConnection(conn) {
        conn.on('open', () => {
            this.connections[conn.peer] = conn;
            this.statusDiv.innerHTML = `ID: ${this.callsign} <br> STATUS: CONNECTED TO ${conn.peer}`;
            this.statusDiv.style.color = "#0ff";
        });

        conn.on('data', (data) => {
            this.updateEntity(data);
            this.nav.updateRemotePlayer(data.id, data.pos.lat, data.pos.lon, data.callsign, data.pos.alt);
        });

        conn.on('close', () => {
            this.statusDiv.innerHTML = `ID: ${this.callsign} <br> STATUS: DISCONNECTED`;
            this.removePlayer(conn.peer);
        });
    }

    updateEntity(data) {
        if (!this.others[data.id]) {
            this.others[data.id] = this.viewer.entities.add({
                name: data.callsign,
                model: { 
                    uri: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/CesiumMilkTruck/glTF/CesiumMilkTruck.glb', 
                    scale: 20, // Made it bigger to be sure you see it
                    minimumPixelSize: 128 
                },
                label: { 
                    text: data.callsign.toUpperCase(), 
                    font: 'bold 20pt monospace', 
                    fillColor: Cesium.Color.YELLOW,
                    pixelOffset: new Cesium.Cartesian2(0, -80),
                    disableDepthTestDistance: Number.POSITIVE_INFINITY // Always stays on top
                }
            });
        }
        const pos = Cesium.Cartesian3.fromDegrees(data.pos.lon, data.pos.lat, data.pos.alt);
        this.others[data.id].position = pos;
        this.others[data.id].orientation = Cesium.Transforms.headingPitchRollQuaternion(pos, 
            new Cesium.HeadingPitchRoll(Cesium.Math.toRadians(data.hpr.h-90), Cesium.Math.toRadians(data.hpr.p), Cesium.Math.toRadians(data.hpr.r)));
    }

    removePlayer(id) {
        if (this.others[id]) { this.viewer.entities.remove(this.others[id]); delete this.others[id]; }
        this.nav.removeRemotePlayer(id);
        delete this.connections[id];
    }

    send(lat, lon, alt, h, p, r) {
        const payload = { id: this.callsign, callsign: this.callsign, pos: { lat, lon, alt }, hpr: { h, p, r } };
        for (let id in this.connections) {
            if (this.connections[id].open) {
                this.connections[id].send(payload);
            }
        }
    }
}
